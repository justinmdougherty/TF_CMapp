-- ==============================================================================
-- 08_SECURITY_PROCEDURES.SQL - H10CM AUTHENTICATION & USER MANAGEMENT
-- ==============================================================================
-- This module contains the security and authentication stored procedures that
-- replace raw SQL in API endpoints for enhanced security and SQL injection prevention.
-- 
-- DEPENDENCIES: 02_core_tables.sql, 03_project_tables.sql
-- CREATES: Authentication, user management, and RBAC procedures
--
-- Author: H10CM Development Team
-- Created: 2025-07-20
-- Version: H10CM v2.1 Modular (Migrated from security_stored_procedures.sql)
-- ==============================================================================

USE H10CM;
GO

PRINT 'Creating security and authentication procedures...';
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
    
    BEGIN TRY
        -- Validate input
        IF @CertificateSubject IS NULL OR @CertificateSubject = ''
        BEGIN
            RAISERROR('Certificate subject is required for authentication', 16, 1);
            RETURN;
        END
        
        -- Check if any users exist
        IF NOT EXISTS (SELECT 1 FROM Users)
        BEGIN
            SELECT 
                CAST(NULL AS INT) as user_id,
                CAST(NULL AS NVARCHAR(255)) as user_name,
                CAST(NULL AS NVARCHAR(255)) as display_name,
                CAST(NULL AS NVARCHAR(255)) as email,
                CAST(NULL AS BIT) as is_system_admin,
                CAST(NULL AS BIT) as is_active,
                CAST(NULL AS DATETIME2) as last_login,
                CAST(NULL AS DATETIME2) as date_created,
                CAST(NULL AS NVARCHAR(MAX)) as program_access
            WHERE 1 = 0;
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
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
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
    
    BEGIN TRY
        -- Check if any users exist
        IF NOT EXISTS (SELECT 1 FROM Users)
        BEGIN
            SELECT 
                CAST(NULL AS INT) as user_id,
                CAST(NULL AS NVARCHAR(255)) as user_name,
                CAST(NULL AS NVARCHAR(255)) as display_name,
                CAST(NULL AS NVARCHAR(255)) as email,
                CAST(NULL AS BIT) as is_active,
                CAST(NULL AS BIT) as is_system_admin,
                CAST(NULL AS DATETIME2) as last_login,
                CAST(NULL AS DATETIME2) as date_created,
                CAST(NULL AS NVARCHAR(500)) as certificate_subject,
                CAST(NULL AS NVARCHAR(MAX)) as program_access
            WHERE 1 = 0;
            RETURN;
        END
        
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
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
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
    
    BEGIN TRY
        -- Check if any programs exist
        IF NOT EXISTS (SELECT 1 FROM Programs)
        BEGIN
            SELECT 
                CAST(NULL AS INT) as program_id,
                CAST(NULL AS NVARCHAR(100)) as program_name,
                CAST(NULL AS NVARCHAR(50)) as program_code,
                CAST(NULL AS NVARCHAR(MAX)) as program_description,
                CAST(NULL AS NVARCHAR(255)) as program_manager,
                CAST(NULL AS BIT) as is_active,
                CAST(NULL AS DATETIME2) as date_created,
                CAST(NULL AS NVARCHAR(255)) as program_manager_name,
                CAST(NULL AS INT) as project_count,
                CAST(NULL AS INT) as user_count
            WHERE 1 = 0;
            RETURN;
        END

        -- Get programs based on user access level
        SELECT 
            p.program_id, 
            p.program_name, 
            p.program_code, 
            p.program_description,
            p.program_manager,
            p.is_active, 
            p.date_created,
            p.program_manager as program_manager_name, -- Use string value directly
            (SELECT COUNT(*) FROM Projects proj WHERE proj.program_id = p.program_id) as project_count,
            (SELECT COUNT(DISTINCT pa.user_id) FROM ProgramAccess pa WHERE pa.program_id = p.program_id AND pa.is_active = 1) as user_count
        FROM Programs p
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
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
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
    @ProgramManager NVARCHAR(255) = NULL,
    @CreatedBy NVARCHAR(100),
    @CreatedByUserId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Validate inputs
        IF @ProgramName IS NULL OR @ProgramName = ''
        BEGIN
            RAISERROR('Program name is required for program creation', 16, 1);
            RETURN;
        END
        
        IF @ProgramCode IS NULL OR @ProgramCode = ''
        BEGIN
            RAISERROR('Program code is required for program creation', 16, 1);
            RETURN;
        END
        
        -- Check for duplicate program code
        IF EXISTS (SELECT 1 FROM Programs WHERE program_code = @ProgramCode AND is_active = 1)
        BEGIN
            RAISERROR('Program code already exists - please choose a different code', 16, 1);
            RETURN;
        END
        
        -- Check for duplicate program name
        IF EXISTS (SELECT 1 FROM Programs WHERE program_name = @ProgramName AND is_active = 1)
        BEGIN
            RAISERROR('Program name already exists - please choose a different name', 16, 1);
            RETURN;
        END
        
        DECLARE @NewProgramId INT;
        
        BEGIN TRANSACTION;
        
        -- Insert new program
        INSERT INTO Programs (
            program_name, 
            program_code, 
            program_description, 
            program_manager,
            is_active, 
            date_created,
            created_by
        )
        VALUES (
            @ProgramName, 
            @ProgramCode, 
            @ProgramDescription, 
            @ProgramManager,
            1, 
            GETUTCDATE(),
            @CreatedBy
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
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
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
    
    BEGIN TRY
        -- Check if any users exist
        IF NOT EXISTS (SELECT 1 FROM Users u JOIN ProgramAccess pa ON u.user_id = pa.user_id)
        BEGIN
            SELECT 
                CAST(NULL AS INT) as user_id,
                CAST(NULL AS NVARCHAR(255)) as user_name,
                CAST(NULL AS NVARCHAR(255)) as display_name,
                CAST(NULL AS NVARCHAR(255)) as email,
                CAST(NULL AS NVARCHAR(50)) as access_level,
                CAST(NULL AS DATETIME2) as date_granted,
                CAST(NULL AS NVARCHAR(100)) as program_name,
                CAST(NULL AS NVARCHAR(20)) as program_code
            WHERE 1 = 0;
            RETURN;
        END
        
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
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

-- =============================================
-- usp_GetUserAccessRequests: Secure Access Request Management
-- =============================================
-- Purpose: Handle user access requests (placeholder for future functionality)
-- Security: Centralized access request management
CREATE PROCEDURE [dbo].[usp_GetUserAccessRequests]
    @RequestingUserId INT = NULL,
    @IsSystemAdmin BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
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
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

PRINT 'Security and authentication procedures created successfully.';
PRINT '- usp_GetUserWithProgramAccess (Certificate-based authentication)';
PRINT '- usp_GetAllUsers (User management with RBAC filtering)';
PRINT '- usp_GetAllPrograms (Program management with multi-tenant security)';
PRINT '- usp_CreateProgram (Secure program creation with validation)';
PRINT '- usp_GetTeamMembers (Team member access with program filtering)';
PRINT '- usp_GetUserAccessRequests (Access request management placeholder)';
PRINT 'Ready for sample data and indexes.';
PRINT '';
