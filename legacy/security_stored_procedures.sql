-- ==============================================================================
-- SECURITY ENHANCEMENT: AUTHENTICATION & USER MANAGEMENT STORED PROCEDURES
-- ==============================================================================
-- These procedures replace raw SQL in API endpoints for enhanced security,
-- SQL injection prevention, and centralized data access logic.

USE H10CM;
GO

-- =============================================
-- usp_GetUserWithProgramAccess: Secure User Authentication
-- =============================================
-- Purpose: Replace raw SQL in authenticateUser middleware (api/index.js line ~75)
-- Security: Prevents SQL injection in authentication logic
-- Multi-tenant: Returns user info with program access for RBAC
CREATE PROCEDURE [dbo].[usp_GetUserWithProgramAccess]
    @CertificateSubject NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate input
    IF @CertificateSubject IS NULL OR @CertificateSubject = ''
    BEGIN
        RAISERROR('Certificate subject is required', 16, 1);
        RETURN;
    END
    
    -- Get user with program access in single query
    SELECT 
        u.user_id, 
        u.user_name, 
        u.display_name, 
        u.email,
        u.is_system_admin,
        u.is_active,
        u.last_login,
        u.date_created,
        JSON_QUERY((
            SELECT 
                pa.program_id, 
                pa.access_level, 
                p.program_name, 
                p.program_code,
                p.program_description
            FROM ProgramAccess pa 
            JOIN Programs p ON pa.program_id = p.program_id
            WHERE pa.user_id = u.user_id 
                AND pa.is_active = 1 
                AND p.is_active = 1
            FOR JSON PATH
        )) as program_access
    FROM Users u
    WHERE u.certificate_subject = @CertificateSubject 
        AND u.is_active = 1;
    
    -- Update last login timestamp
    UPDATE Users 
    SET last_login = GETUTCDATE()
    WHERE certificate_subject = @CertificateSubject 
        AND is_active = 1;
END
GO

-- =============================================
-- usp_GetAllUsers: Secure User Management
-- =============================================
-- Purpose: Replace raw SQL in getUsersLogic function (api/index.js line ~1625)
-- Security: Centralized user data access with consistent program filtering
-- Multi-tenant: Includes program access information for each user
CREATE PROCEDURE [dbo].[usp_GetAllUsers]
    @RequestingUserId INT = NULL,
    @IsSystemAdmin BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get all users with their program access
    SELECT 
        u.user_id, 
        u.user_name, 
        u.display_name, 
        u.email, 
        u.is_active, 
        u.is_system_admin,
        u.last_login, 
        u.date_created,
        u.certificate_subject,
        JSON_QUERY((
            SELECT 
                pa.program_id, 
                pa.access_level, 
                p.program_name,
                p.program_code
            FROM ProgramAccess pa 
            JOIN Programs p ON pa.program_id = p.program_id
            WHERE pa.user_id = u.user_id 
                AND pa.is_active = 1
                AND p.is_active = 1
            FOR JSON PATH
        )) as program_access
    FROM Users u
    WHERE u.is_active = 1
        -- System admins see all users, regular users see users in their programs
        AND (@IsSystemAdmin = 1 
            OR @RequestingUserId IS NULL 
            OR EXISTS (
                SELECT 1 FROM ProgramAccess pa1
                JOIN ProgramAccess pa2 ON pa1.program_id = pa2.program_id
                WHERE pa1.user_id = @RequestingUserId 
                    AND pa2.user_id = u.user_id
                    AND pa1.is_active = 1 
                    AND pa2.is_active = 1
            ))
    ORDER BY u.display_name;
END
GO

-- =============================================
-- usp_GetAllPrograms: Secure Program Management
-- =============================================
-- Purpose: Replace raw SQL in GET /api/programs endpoint (api/index.js line ~355)
-- Security: Centralized program access with proper multi-tenant filtering
-- Multi-tenant: Non-admin users only see their accessible programs
CREATE PROCEDURE [dbo].[usp_GetAllPrograms]
    @RequestingUserId INT = NULL,
    @IsSystemAdmin BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get programs based on user access level
    SELECT 
        p.program_id, 
        p.program_name, 
        p.program_code, 
        p.program_description,
        p.program_manager,
        p.is_active, 
        p.date_created,
        pm.display_name as program_manager_name,
        (SELECT COUNT(*) FROM Projects proj WHERE proj.program_id = p.program_id AND proj.is_active = 1) as project_count,
        (SELECT COUNT(DISTINCT pa.user_id) FROM ProgramAccess pa WHERE pa.program_id = p.program_id AND pa.is_active = 1) as user_count
    FROM Programs p
    LEFT JOIN Users pm ON p.program_manager = pm.user_id
    WHERE p.is_active = 1
        -- System admins see all programs, regular users see only their accessible programs
        AND (@IsSystemAdmin = 1 
            OR @RequestingUserId IS NULL
            OR EXISTS (
                SELECT 1 FROM ProgramAccess pa 
                WHERE pa.program_id = p.program_id 
                    AND pa.user_id = @RequestingUserId 
                    AND pa.is_active = 1
            ))
    ORDER BY p.program_name;
END
GO

-- =============================================
-- usp_CreateProgram: Secure Program Creation
-- =============================================
-- Purpose: Replace raw SQL in createProgramLogic function (api/index.js line ~1648)
-- Security: Validates program creation with proper audit trail
-- Note: This enhances the existing usp_AddNewTenant procedure with additional validation
CREATE PROCEDURE [dbo].[usp_CreateProgram]
    @ProgramName NVARCHAR(100),
    @ProgramCode NVARCHAR(20),
    @ProgramDescription NVARCHAR(MAX) = NULL,
    @ProgramManager INT = NULL,
    @CreatedBy NVARCHAR(100),
    @CreatedByUserId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate inputs
    IF @ProgramName IS NULL OR @ProgramName = ''
    BEGIN
        RAISERROR('Program name is required', 16, 1);
        RETURN;
    END
    
    IF @ProgramCode IS NULL OR @ProgramCode = ''
    BEGIN
        RAISERROR('Program code is required', 16, 1);
        RETURN;
    END
    
    -- Check for duplicate program code
    IF EXISTS (SELECT 1 FROM Programs WHERE program_code = @ProgramCode AND is_active = 1)
    BEGIN
        RAISERROR('Program code already exists', 16, 1);
        RETURN;
    END
    
    -- Check for duplicate program name
    IF EXISTS (SELECT 1 FROM Programs WHERE program_name = @ProgramName AND is_active = 1)
    BEGIN
        RAISERROR('Program name already exists', 16, 1);
        RETURN;
    END
    
    DECLARE @NewProgramId INT;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Insert new program
        INSERT INTO Programs (
            program_name, 
            program_code, 
            program_description, 
            program_manager,
            is_active, 
            date_created
        )
        VALUES (
            @ProgramName, 
            @ProgramCode, 
            @ProgramDescription, 
            @ProgramManager,
            1, 
            GETUTCDATE()
        );
        
        SET @NewProgramId = SCOPE_IDENTITY();
        
        -- Grant admin access to creator if provided
        IF @CreatedByUserId IS NOT NULL
        BEGIN
            INSERT INTO ProgramAccess (user_id, program_id, access_level, granted_by, date_granted, is_active)
            VALUES (@CreatedByUserId, @NewProgramId, 'Admin', @CreatedByUserId, GETUTCDATE(), 1);
        END
        
        COMMIT TRANSACTION;
        
        -- Return created program
        SELECT 
            program_id, 
            program_name, 
            program_code, 
            program_description,
            program_manager,
            is_active, 
            date_created,
            'Program created successfully' as message
        FROM Programs 
        WHERE program_id = @NewProgramId;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
        RETURN;
    END CATCH
END
GO

-- =============================================
-- usp_GetTeamMembers: Secure Team Member Retrieval
-- =============================================
-- Purpose: Replace raw SQL for team members endpoint
-- Security: Centralized team member access with program filtering
CREATE PROCEDURE [dbo].[usp_GetTeamMembers]
    @ProgramId INT = NULL,
    @RequestingUserId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get team members based on program access
    SELECT DISTINCT
        u.user_id,
        u.user_name,
        u.display_name,
        u.email,
        pa.access_level,
        pa.date_granted,
        p.program_name,
        p.program_code
    FROM Users u
    JOIN ProgramAccess pa ON u.user_id = pa.user_id
    JOIN Programs p ON pa.program_id = p.program_id
    WHERE u.is_active = 1
        AND pa.is_active = 1
        AND p.is_active = 1
        AND (@ProgramId IS NULL OR pa.program_id = @ProgramId)
        -- Users can only see team members from programs they have access to
        AND (@RequestingUserId IS NULL OR EXISTS (
            SELECT 1 FROM ProgramAccess req_pa 
            WHERE req_pa.user_id = @RequestingUserId 
                AND req_pa.program_id = pa.program_id 
                AND req_pa.is_active = 1
        ))
    ORDER BY u.display_name;
END
GO

-- =============================================
-- usp_GetUserAccessRequests: Secure Access Request Management
-- =============================================
-- Purpose: Handle user access requests (if implemented in frontend)
-- Security: Centralized access request management
CREATE PROCEDURE [dbo].[usp_GetUserAccessRequests]
    @RequestingUserId INT = NULL,
    @IsSystemAdmin BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    -- For now, return empty set since access requests aren't fully implemented
    -- This procedure is a placeholder for future access request functionality
    SELECT 
        CAST(NULL AS INT) as request_id,
        CAST(NULL AS INT) as user_id,
        CAST(NULL AS NVARCHAR(100)) as user_name,
        CAST(NULL AS NVARCHAR(100)) as display_name,
        CAST(NULL AS INT) as program_id,
        CAST(NULL AS NVARCHAR(100)) as program_name,
        CAST(NULL AS NVARCHAR(50)) as requested_access_level,
        CAST(NULL AS DATETIME) as request_date,
        CAST(NULL AS NVARCHAR(50)) as status,
        CAST(NULL AS NVARCHAR(MAX)) as justification
    WHERE 1 = 0; -- Always return empty for now
    
    -- TODO: Implement proper access request system with AccessRequests table
END
GO

PRINT 'Security stored procedures created successfully!';
PRINT 'Created procedures:';
PRINT '- usp_GetUserWithProgramAccess (Authentication)';
PRINT '- usp_GetAllUsers (User Management)';
PRINT '- usp_GetAllPrograms (Program Management)';
PRINT '- usp_CreateProgram (Program Creation)';
PRINT '- usp_GetTeamMembers (Team Management)';
PRINT '- usp_GetUserAccessRequests (Access Requests)';
PRINT '';
PRINT 'Next: Restart API server to test new stored procedures';
