-- ==============================================================================
-- 06_MISSING_CORE_PROCEDURES.SQL - H10CM MISSING CORE STORED PROCEDURES
-- ==============================================================================
-- This module creates the missing core stored procedures to replace raw SQL
-- queries in the API with proper stored procedure calls for security.
-- 
-- DEPENDENCIES: 05_procurement_tables.sql
-- CREATES: Missing core business logic procedures
--
-- Author: H10CM Development Team  
-- Created: 2025-07-21
-- Version: H10CM v2.1 Security Enhancement
-- ==============================================================================

USE H10CM;
GO

PRINT 'Creating missing core stored procedures for security enhancement...';

-- =============================================================================
-- TASK MANAGEMENT PROCEDURES
-- =============================================================================

-- Get Tasks with program filtering
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_GetTasks')
    DROP PROCEDURE [dbo].[usp_GetTasks];
GO

CREATE PROCEDURE [dbo].[usp_GetTasks]
    @ProgramId INT = NULL,
    @UserId INT = NULL,
    @ProjectId INT = NULL,
    @IsSystemAdmin BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT t.task_id, p.program_id, t.task_title, t.priority, t.status, 
               t.completion_percentage, t.due_date, t.date_created,
               assigned_user.display_name AS assigned_to_name,
               assigner.display_name AS assigned_by_name,
               p.project_name, pr.program_name
        FROM Tasks t
        LEFT JOIN Users assigned_user ON t.assigned_to = assigned_user.user_id
        LEFT JOIN Users assigner ON t.assigned_by = assigner.user_id
        LEFT JOIN Projects p ON t.project_id = p.project_id
        LEFT JOIN Programs pr ON p.program_id = pr.program_id
        WHERE (@ProgramId IS NULL OR p.program_id = @ProgramId)
          AND (@UserId IS NULL OR t.assigned_to = @UserId)
          AND (@ProjectId IS NULL OR t.project_id = @ProjectId)
          AND (@IsSystemAdmin = 1 OR p.program_id IS NOT NULL)
        ORDER BY t.due_date, t.priority DESC;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR('Error in usp_GetTasks: %s', 16, 1, @ErrorMessage);
    END CATCH
END
GO

-- Get Tasks by Project
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_GetTasksByProject')
    DROP PROCEDURE [dbo].[usp_GetTasksByProject];
GO

CREATE PROCEDURE [dbo].[usp_GetTasksByProject]
    @ProjectId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT t.*, u.display_name as assigned_user_name
        FROM Tasks t
        LEFT JOIN Users u ON t.assigned_to = u.user_id
        WHERE t.project_id = @ProjectId
        ORDER BY t.date_created DESC;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR('Error in usp_GetTasksByProject: %s', 16, 1, @ErrorMessage);
    END CATCH
END
GO

-- Get Tasks by User
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_GetTasksByUser')
    DROP PROCEDURE [dbo].[usp_GetTasksByUser];
GO

CREATE PROCEDURE [dbo].[usp_GetTasksByUser]
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT t.*, p.project_name, u.display_name as assigned_user_name
        FROM Tasks t
        LEFT JOIN Projects p ON t.project_id = p.project_id
        LEFT JOIN Users u ON t.assigned_to = u.user_id
        WHERE t.assigned_to = @UserId
        ORDER BY t.due_date ASC, t.priority DESC;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR('Error in usp_GetTasksByUser: %s', 16, 1, @ErrorMessage);
    END CATCH
END
GO

-- =============================================================================
-- INVENTORY MANAGEMENT PROCEDURES
-- =============================================================================

-- Get Inventory Items with program filtering
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_GetInventoryItems')
    DROP PROCEDURE [dbo].[usp_GetInventoryItems];
GO

CREATE PROCEDURE [dbo].[usp_GetInventoryItems]
    @ProgramId INT = NULL,
    @IsSystemAdmin BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT ii.inventory_item_id, ii.item_name, ii.part_number, 
               ii.description, ii.category, ii.unit_of_measure, 
               ii.cost_per_unit, ii.current_stock_level, ii.reorder_point,
               ii.max_stock_level, ii.supplier_info, ii.last_cost_update,
               ii.location, ii.is_active, ii.date_created, ii.last_modified,
               ii.program_id, pr.program_name
        FROM InventoryItems ii
        LEFT JOIN Programs pr ON ii.program_id = pr.program_id
        WHERE (@ProgramId IS NULL OR ii.program_id = @ProgramId)
          AND (@IsSystemAdmin = 1 OR ii.program_id IS NOT NULL)
          AND ii.is_active = 1
        ORDER BY ii.item_name, ii.part_number;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR('Error in usp_GetInventoryItems: %s', 16, 1, @ErrorMessage);
    END CATCH
END
GO

-- =============================================================================
-- NOTIFICATION MANAGEMENT PROCEDURES
-- =============================================================================

-- Get Notifications for user
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_GetNotifications')
    DROP PROCEDURE [dbo].[usp_GetNotifications];
GO

CREATE PROCEDURE [dbo].[usp_GetNotifications]
    @UserId INT,
    @IsSystemAdmin BIT = 0,
    @ProgramId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT notification_id, category, title, message, priority, is_read, 
               is_actionable, related_entity_type, related_entity_id,
               action_url, action_text, metadata, date_created, date_read
        FROM Notifications 
        WHERE user_id = @UserId
        ORDER BY date_created DESC;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR('Error in usp_GetNotifications: %s', 16, 1, @ErrorMessage);
    END CATCH
END
GO

-- =============================================================================
-- SYSTEM STATISTICS PROCEDURES
-- =============================================================================

-- Get System Statistics (counts, etc.)
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_GetSystemStatistics')
    DROP PROCEDURE [dbo].[usp_GetSystemStatistics];
GO

CREATE PROCEDURE [dbo].[usp_GetSystemStatistics]
    @IsSystemAdmin BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            (SELECT COUNT(*) FROM Programs) as program_count,
            (SELECT COUNT(*) FROM Users WHERE is_system_admin = 1) as admin_count,
            (SELECT COUNT(*) FROM Users) as total_user_count,
            (SELECT COUNT(*) FROM Projects) as project_count,
            (SELECT COUNT(*) FROM Tasks) as task_count,
            (SELECT COUNT(*) FROM InventoryItems) as inventory_item_count
        WHERE @IsSystemAdmin = 1;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR('Error in usp_GetSystemStatistics: %s', 16, 1, @ErrorMessage);
    END CATCH
END
GO

-- =============================================================================
-- PROJECT VALIDATION PROCEDURES  
-- =============================================================================

-- Get Project for Access Validation
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_GetProjectForValidation')
    DROP PROCEDURE [dbo].[usp_GetProjectForValidation];
GO

CREATE PROCEDURE [dbo].[usp_GetProjectForValidation]
    @ProjectId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT p.*, pr.program_name, pr.program_code
        FROM Projects p
        JOIN Programs pr ON p.program_id = pr.program_id
        WHERE p.project_id = @ProjectId;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR('Error in usp_GetProjectForValidation: %s', 16, 1, @ErrorMessage);
    END CATCH
END
GO

-- =============================================================================
-- TASK STATISTICS PROCEDURES
-- =============================================================================

-- Get Task Statistics
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_GetTaskStatistics')
    DROP PROCEDURE [dbo].[usp_GetTaskStatistics];
GO

CREATE PROCEDURE [dbo].[usp_GetTaskStatistics]
    @ProgramId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            COUNT(*) as total_tasks,
            SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
            SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
            SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
            SUM(CASE WHEN t.priority = 'high' THEN 1 ELSE 0 END) as high_priority_tasks,
            SUM(CASE WHEN t.due_date < GETDATE() AND t.status != 'completed' THEN 1 ELSE 0 END) as overdue_tasks,
            AVG(CASE WHEN t.status = 'completed' AND t.estimated_hours > 0 THEN t.estimated_hours ELSE NULL END) as avg_completion_time,
            COUNT(DISTINCT t.assigned_to) as active_team_members
        FROM Tasks t
        JOIN Projects p ON t.project_id = p.project_id
        WHERE p.program_id = @ProgramId;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR('Error in usp_GetTaskStatistics: %s', 16, 1, @ErrorMessage);
    END CATCH
END
GO

-- =============================================================================
-- USER TASK SUMMARY PROCEDURES
-- =============================================================================

-- Get User Task Summary
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_GetUserTaskSummary')
    DROP PROCEDURE [dbo].[usp_GetUserTaskSummary];
GO

CREATE PROCEDURE [dbo].[usp_GetUserTaskSummary]
    @UserId INT,
    @ProgramId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            u.user_name as username,
            u.display_name as full_name,
            COUNT(*) as total_assigned_tasks,
            SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
            SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
            SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
            SUM(CASE WHEN t.priority = 'high' THEN 1 ELSE 0 END) as high_priority_tasks,
            SUM(CASE WHEN t.due_date < GETDATE() AND t.status != 'completed' THEN 1 ELSE 0 END) as overdue_tasks,
            AVG(CASE WHEN t.status = 'completed' AND t.estimated_hours > 0 THEN t.estimated_hours ELSE NULL END) as avg_completion_time
        FROM Users u
        LEFT JOIN Tasks t ON u.user_id = t.assigned_to
        LEFT JOIN Projects p ON t.project_id = p.project_id
        WHERE u.user_id = @UserId 
        AND (p.program_id = @ProgramId OR p.program_id IS NULL)
        GROUP BY u.user_id, u.user_name, u.display_name;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR('Error in usp_GetUserTaskSummary: %s', 16, 1, @ErrorMessage);
    END CATCH
END
GO

PRINT 'Missing core stored procedures created successfully.';
PRINT 'Ready to replace raw SQL queries in API.';
PRINT '';
