-- =====================================================================================
-- H10CM User Activity Logging and Audit Trail System
-- Comprehensive audit logging for security, compliance, and debugging
-- =====================================================================================

-- Create audit log table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserActivityLog')
BEGIN
    CREATE TABLE UserActivityLog (
        log_id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NULL, -- NULL for failed authentication attempts
        action_type NVARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, READ, LOGIN, LOGOUT, etc.
        entity_type NVARCHAR(100) NOT NULL, -- Project, InventoryItem, User, etc.
        entity_id INT NULL, -- ID of the affected entity
        description NVARCHAR(500) NULL, -- Human-readable description
        old_values NVARCHAR(MAX) NULL, -- JSON of previous values
        new_values NVARCHAR(MAX) NULL, -- JSON of new values
        metadata NVARCHAR(MAX) NULL, -- Additional metadata as JSON
        ip_address NVARCHAR(45) NULL, -- IPv4 or IPv6 address
        user_agent NVARCHAR(500) NULL, -- Browser/client information
        program_id INT NULL, -- Program context
        session_id NVARCHAR(100) NULL, -- Session identifier
        timestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        -- Foreign key constraints
        FOREIGN KEY (user_id) REFERENCES Users(user_id),
        FOREIGN KEY (program_id) REFERENCES Programs(program_id)
    );
    
    -- Create indexes for performance
    CREATE INDEX IX_UserActivityLog_UserId_Timestamp ON UserActivityLog(user_id, timestamp DESC);
    CREATE INDEX IX_UserActivityLog_Entity ON UserActivityLog(entity_type, entity_id);
    CREATE INDEX IX_UserActivityLog_ActionType ON UserActivityLog(action_type);
    CREATE INDEX IX_UserActivityLog_ProgramId ON UserActivityLog(program_id);
    CREATE INDEX IX_UserActivityLog_Timestamp ON UserActivityLog(timestamp DESC);
    
    PRINT '✅ UserActivityLog table created with indexes';
END
GO

-- =====================================================================================
-- Stored Procedure: Log User Activity
-- =====================================================================================
CREATE OR ALTER PROCEDURE usp_LogUserActivity
    @AuditLogJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Parse JSON input
        DECLARE @user_id INT = JSON_VALUE(@AuditLogJson, '$.user_id');
        DECLARE @action_type NVARCHAR(50) = JSON_VALUE(@AuditLogJson, '$.action_type');
        DECLARE @entity_type NVARCHAR(100) = JSON_VALUE(@AuditLogJson, '$.entity_type');
        DECLARE @entity_id INT = JSON_VALUE(@AuditLogJson, '$.entity_id');
        DECLARE @description NVARCHAR(500) = JSON_VALUE(@AuditLogJson, '$.description');
        DECLARE @old_values NVARCHAR(MAX) = JSON_VALUE(@AuditLogJson, '$.old_values');
        DECLARE @new_values NVARCHAR(MAX) = JSON_VALUE(@AuditLogJson, '$.new_values');
        DECLARE @metadata NVARCHAR(MAX) = JSON_VALUE(@AuditLogJson, '$.metadata');
        DECLARE @ip_address NVARCHAR(45) = JSON_VALUE(@AuditLogJson, '$.ip_address');
        DECLARE @user_agent NVARCHAR(500) = JSON_VALUE(@AuditLogJson, '$.user_agent');
        DECLARE @program_id INT = JSON_VALUE(@AuditLogJson, '$.program_id');
        DECLARE @session_id NVARCHAR(100) = JSON_VALUE(@AuditLogJson, '$.session_id');
        
        -- Validate required fields
        IF @action_type IS NULL OR @entity_type IS NULL
        BEGIN
            RAISERROR('action_type and entity_type are required', 16, 1);
            RETURN;
        END
        
        -- Insert audit log entry
        INSERT INTO UserActivityLog (
            user_id,
            action_type,
            entity_type,
            entity_id,
            description,
            old_values,
            new_values,
            metadata,
            ip_address,
            user_agent,
            program_id,
            session_id,
            timestamp
        ) VALUES (
            @user_id,
            @action_type,
            @entity_type,
            @entity_id,
            @description,
            @old_values,
            @new_values,
            @metadata,
            @ip_address,
            @user_agent,
            @program_id,
            @session_id,
            GETDATE()
        );
        
        -- Return the log entry ID
        SELECT SCOPE_IDENTITY() AS log_id;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

-- =====================================================================================
-- Stored Procedure: Get Audit Trail for Entity
-- =====================================================================================
CREATE OR ALTER PROCEDURE usp_GetAuditTrail
    @EntityType NVARCHAR(100),
    @EntityId INT,
    @UserId INT = NULL,
    @ProgramId INT = NULL,
    @Limit INT = 100
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit)
        ual.log_id,
        ual.user_id,
        u.display_name AS user_name,
        ual.action_type,
        ual.entity_type,
        ual.entity_id,
        ual.description,
        ual.old_values,
        ual.new_values,
        ual.metadata,
        ual.ip_address,
        ual.user_agent,
        ual.program_id,
        p.program_name,
        ual.session_id,
        ual.timestamp
    FROM UserActivityLog ual
    LEFT JOIN Users u ON ual.user_id = u.user_id
    LEFT JOIN Programs p ON ual.program_id = p.program_id
    WHERE ual.entity_type = @EntityType
      AND ual.entity_id = @EntityId
      AND (@UserId IS NULL OR ual.user_id = @UserId)
      AND (@ProgramId IS NULL OR ual.program_id = @ProgramId)
    ORDER BY ual.timestamp DESC;
END
GO

-- =====================================================================================
-- Stored Procedure: Get User Activity Summary
-- =====================================================================================
CREATE OR ALTER PROCEDURE usp_GetUserActivitySummary
    @UserId INT,
    @DateFrom DATETIME2,
    @DateTo DATETIME2,
    @ProgramId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get activity summary by action type
    SELECT 
        ual.action_type,
        ual.entity_type,
        COUNT(*) AS activity_count,
        MIN(ual.timestamp) AS first_activity,
        MAX(ual.timestamp) AS last_activity
    FROM UserActivityLog ual
    WHERE ual.user_id = @UserId
      AND ual.timestamp >= @DateFrom
      AND ual.timestamp <= @DateTo
      AND (@ProgramId IS NULL OR ual.program_id = @ProgramId)
    GROUP BY ual.action_type, ual.entity_type
    ORDER BY activity_count DESC, ual.action_type;
    
    -- Get detailed recent activities
    SELECT TOP 20
        ual.log_id,
        ual.action_type,
        ual.entity_type,
        ual.entity_id,
        ual.description,
        ual.ip_address,
        ual.program_id,
        p.program_name,
        ual.timestamp
    FROM UserActivityLog ual
    LEFT JOIN Programs p ON ual.program_id = p.program_id
    WHERE ual.user_id = @UserId
      AND ual.timestamp >= @DateFrom
      AND ual.timestamp <= @DateTo
      AND (@ProgramId IS NULL OR ual.program_id = @ProgramId)
    ORDER BY ual.timestamp DESC;
END
GO

-- =====================================================================================
-- Stored Procedure: Get Security Events
-- =====================================================================================
CREATE OR ALTER PROCEDURE usp_GetSecurityEvents
    @Severity NVARCHAR(20) = NULL,
    @UserId INT = NULL,
    @HoursBack INT = 24,
    @ProgramId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @DateFrom DATETIME2 = DATEADD(HOUR, -@HoursBack, GETDATE());
    
    SELECT 
        ual.log_id,
        ual.user_id,
        u.display_name AS user_name,
        ual.action_type,
        ual.entity_type,
        ual.description,
        ual.metadata,
        ual.ip_address,
        ual.user_agent,
        ual.program_id,
        p.program_name,
        ual.timestamp,
        -- Extract severity from metadata
        JSON_VALUE(ual.metadata, '$.severity') AS severity,
        JSON_VALUE(ual.metadata, '$.event_type') AS event_type
    FROM UserActivityLog ual
    LEFT JOIN Users u ON ual.user_id = u.user_id
    LEFT JOIN Programs p ON ual.program_id = p.program_id
    WHERE ual.timestamp >= @DateFrom
      AND (ual.action_type = 'SECURITY_EVENT' OR ual.action_type LIKE '%_FAILED')
      AND (@UserId IS NULL OR ual.user_id = @UserId)
      AND (@ProgramId IS NULL OR ual.program_id = @ProgramId)
      AND (@Severity IS NULL OR JSON_VALUE(ual.metadata, '$.severity') = @Severity)
    ORDER BY ual.timestamp DESC;
END
GO

-- =====================================================================================
-- Create view for audit dashboard
-- =====================================================================================
CREATE OR ALTER VIEW v_AuditDashboard AS
SELECT 
    -- Today's activity counts
    (SELECT COUNT(*) FROM UserActivityLog WHERE CAST(timestamp AS DATE) = CAST(GETDATE() AS DATE)) AS today_activities,
    
    -- Last 24 hours authentication attempts
    (SELECT COUNT(*) FROM UserActivityLog WHERE action_type IN ('LOGIN', 'LOGIN_FAILED') AND timestamp >= DATEADD(HOUR, -24, GETDATE())) AS auth_attempts_24h,
    
    -- Failed logins in last 24 hours
    (SELECT COUNT(*) FROM UserActivityLog WHERE action_type = 'LOGIN_FAILED' AND timestamp >= DATEADD(HOUR, -24, GETDATE())) AS failed_logins_24h,
    
    -- Security events in last 24 hours
    (SELECT COUNT(*) FROM UserActivityLog WHERE action_type = 'SECURITY_EVENT' AND timestamp >= DATEADD(HOUR, -24, GETDATE())) AS security_events_24h,
    
    -- Most active users today
    (SELECT TOP 1 u.display_name 
     FROM UserActivityLog ual 
     JOIN Users u ON ual.user_id = u.user_id 
     WHERE CAST(ual.timestamp AS DATE) = CAST(GETDATE() AS DATE) 
     GROUP BY u.display_name 
     ORDER BY COUNT(*) DESC) AS most_active_user_today,
    
    -- Last audit entry timestamp
    (SELECT MAX(timestamp) FROM UserActivityLog) AS last_audit_entry
GO

PRINT '✅ H10CM Audit System installed successfully';
PRINT 'Available procedures:';
PRINT '  - usp_LogUserActivity: Log user activities';
PRINT '  - usp_GetAuditTrail: Get audit trail for entities';
PRINT '  - usp_GetUserActivitySummary: Get user activity summary';
PRINT '  - usp_GetSecurityEvents: Get security events';
PRINT 'Available views:';
PRINT '  - v_AuditDashboard: Audit dashboard summary';
GO
