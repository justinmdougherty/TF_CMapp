-- ==============================================================================
-- 07_ADDITIONAL_SECURITY_PROCEDURES.SQL - SECURITY-CRITICAL STORED PROCEDURES
-- ==============================================================================
-- This module contains additional security-critical stored procedures to replace
-- remaining raw SQL queries in the API layer for complete SQL injection protection.
-- 
-- DEPENDENCIES: 07_business_procedures.sql
-- CREATES: Security-critical lookup and validation procedures
--
-- Author: H10CM Development Team
-- Created: 2025-07-26
-- Version: H10CM v2.2 Security Hardening
-- ==============================================================================

USE H10CM;
GO

PRINT 'Creating additional security-critical stored procedures...';

-- ==============================================================================
-- PROJECT STEP VALIDATION PROCEDURES
-- ==============================================================================

IF OBJECT_ID('usp_GetProjectStepForValidation', 'P') IS NOT NULL
    DROP PROCEDURE usp_GetProjectStepForValidation;
GO

CREATE PROCEDURE usp_GetProjectStepForValidation
    @StepValidationJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Extract parameters from JSON
        DECLARE @step_id INT = JSON_VALUE(@StepValidationJson, '$.step_id');
        
        -- Validate required parameters
        IF @step_id IS NULL
        BEGIN
            RAISERROR('Step ID is required for validation', 16, 1);
            RETURN;
        END
        
        -- Get step information with program context for security validation
        SELECT 
            ps.step_id,
            ps.step_name,
            ps.project_id,
            p.program_id,
            p.project_name
        FROM ProjectSteps ps
        INNER JOIN Projects p ON ps.project_id = p.project_id
        WHERE ps.step_id = @step_id;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

-- ==============================================================================
-- STEP INVENTORY REQUIREMENT VALIDATION PROCEDURES
-- ==============================================================================

IF OBJECT_ID('usp_GetStepInventoryRequirementForValidation', 'P') IS NOT NULL
    DROP PROCEDURE usp_GetStepInventoryRequirementForValidation;
GO

CREATE PROCEDURE usp_GetStepInventoryRequirementForValidation
    @RequirementValidationJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Extract parameters from JSON
        DECLARE @requirement_id INT = JSON_VALUE(@RequirementValidationJson, '$.requirement_id');
        
        -- Validate required parameters
        IF @requirement_id IS NULL
        BEGIN
            RAISERROR('Requirement ID is required for validation', 16, 1);
            RETURN;
        END
        
        -- Get requirement information with full security context
        SELECT 
            sir.requirement_id,
            sir.step_id,
            ps.project_id,
            p.program_id,
            ii.item_name,
            sir.quantity_required
        FROM StepInventoryRequirements sir
        INNER JOIN ProjectSteps ps ON sir.step_id = ps.step_id
        INNER JOIN Projects p ON ps.project_id = p.project_id
        INNER JOIN InventoryItems ii ON sir.inventory_item_id = ii.inventory_item_id
        WHERE sir.requirement_id = @requirement_id;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

-- ==============================================================================
-- SECURE DELETE PROCEDURES
-- ==============================================================================

IF OBJECT_ID('usp_DeleteProjectStep', 'P') IS NOT NULL
    DROP PROCEDURE usp_DeleteProjectStep;
GO

CREATE PROCEDURE usp_DeleteProjectStep
    @StepDeleteJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Extract parameters from JSON
        DECLARE @step_id INT = JSON_VALUE(@StepDeleteJson, '$.step_id');
        DECLARE @program_id INT = JSON_VALUE(@StepDeleteJson, '$.program_id');
        DECLARE @deleted_by INT = JSON_VALUE(@StepDeleteJson, '$.deleted_by');
        
        -- Validate required parameters
        IF @step_id IS NULL
        BEGIN
            RAISERROR('Step ID is required', 16, 1);
            RETURN;
        END
        
        IF @program_id IS NULL
        BEGIN
            RAISERROR('Program ID is required for multi-tenant isolation', 16, 1);
            RETURN;
        END
        
        IF @deleted_by IS NULL
        BEGIN
            RAISERROR('Deleted by user is required', 16, 1);
            RETURN;
        END
        
        -- Verify the step exists and belongs to the specified program
        DECLARE @step_name NVARCHAR(255);
        DECLARE @project_id INT;
        
        SELECT 
            @step_name = ps.step_name,
            @project_id = ps.project_id
        FROM ProjectSteps ps
        INNER JOIN Projects p ON ps.project_id = p.project_id
        WHERE ps.step_id = @step_id 
          AND p.program_id = @program_id;
        
        IF @step_name IS NULL
        BEGIN
            RAISERROR('Project step not found or access denied', 16, 1);
            RETURN;
        END
        
        -- Check for dependencies before deletion
        -- 1. Check if step has inventory requirements
        IF EXISTS (SELECT 1 FROM StepInventoryRequirements WHERE step_id = @step_id)
        BEGIN
            RAISERROR('Cannot delete project step that has inventory requirements. Please remove requirements first.', 16, 1);
            RETURN;
        END
        
        -- Log the deletion for audit purposes
        INSERT INTO AuditLog (
            user_id, action_type, entity_type, entity_id, 
            old_values, new_values, date_created, description
        )
        VALUES (
            @deleted_by, 'DELETE', 'ProjectSteps', @step_id,
            JSON_QUERY('{"step_name": "' + @step_name + '", "step_id": ' + CAST(@step_id AS NVARCHAR) + ', "project_id": ' + CAST(@project_id AS NVARCHAR) + '}'),
            NULL, GETDATE(), 'Project step deleted via secure stored procedure'
        );
        
        -- Delete the project step
        DELETE FROM ProjectSteps 
        WHERE step_id = @step_id;
        
        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR('Project step could not be deleted', 16, 1);
            RETURN;
        END
        
        COMMIT TRANSACTION;
        
        -- Return success status
        SELECT 
            'success' as status,
            'Project step "' + @step_name + '" has been successfully deleted' as message,
            @step_id as step_id,
            @step_name as step_name;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

IF OBJECT_ID('usp_DeleteStepInventoryRequirement', 'P') IS NOT NULL
    DROP PROCEDURE usp_DeleteStepInventoryRequirement;
GO

CREATE PROCEDURE usp_DeleteStepInventoryRequirement
    @RequirementDeleteJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Extract parameters from JSON
        DECLARE @requirement_id INT = JSON_VALUE(@RequirementDeleteJson, '$.requirement_id');
        DECLARE @program_id INT = JSON_VALUE(@RequirementDeleteJson, '$.program_id');
        DECLARE @deleted_by INT = JSON_VALUE(@RequirementDeleteJson, '$.deleted_by');
        
        -- Validate required parameters
        IF @requirement_id IS NULL
        BEGIN
            RAISERROR('Requirement ID is required', 16, 1);
            RETURN;
        END
        
        IF @program_id IS NULL
        BEGIN
            RAISERROR('Program ID is required for multi-tenant isolation', 16, 1);
            RETURN;
        END
        
        IF @deleted_by IS NULL
        BEGIN
            RAISERROR('Deleted by user is required', 16, 1);
            RETURN;
        END
        
        -- Verify the requirement exists and belongs to the specified program
        DECLARE @item_name NVARCHAR(255);
        DECLARE @step_id INT;
        DECLARE @quantity_required DECIMAL(18,4);
        
        SELECT 
            @item_name = ii.item_name,
            @step_id = sir.step_id,
            @quantity_required = sir.quantity_required
        FROM StepInventoryRequirements sir
        INNER JOIN ProjectSteps ps ON sir.step_id = ps.step_id
        INNER JOIN Projects p ON ps.project_id = p.project_id
        INNER JOIN InventoryItems ii ON sir.inventory_item_id = ii.inventory_item_id
        WHERE sir.requirement_id = @requirement_id 
          AND p.program_id = @program_id;
        
        IF @item_name IS NULL
        BEGIN
            RAISERROR('Step inventory requirement not found or access denied', 16, 1);
            RETURN;
        END
        
        -- Log the deletion for audit purposes
        INSERT INTO AuditLog (
            user_id, action_type, entity_type, entity_id, 
            old_values, new_values, date_created, description
        )
        VALUES (
            @deleted_by, 'DELETE', 'StepInventoryRequirements', @requirement_id,
            JSON_QUERY('{"item_name": "' + @item_name + '", "requirement_id": ' + CAST(@requirement_id AS NVARCHAR) + ', "quantity_required": ' + CAST(@quantity_required AS NVARCHAR) + '}'),
            NULL, GETDATE(), 'Step inventory requirement deleted via secure stored procedure'
        );
        
        -- Delete the requirement
        DELETE FROM StepInventoryRequirements 
        WHERE requirement_id = @requirement_id;
        
        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR('Step inventory requirement could not be deleted', 16, 1);
            RETURN;
        END
        
        COMMIT TRANSACTION;
        
        -- Return success status
        SELECT 
            'success' as status,
            'Step inventory requirement for "' + @item_name + '" has been successfully deleted' as message,
            @requirement_id as requirement_id,
            @item_name as item_name;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

-- ==============================================================================
-- NOTIFICATION SECURITY PROCEDURES
-- ==============================================================================

IF OBJECT_ID('usp_UpdateNotificationSecure', 'P') IS NOT NULL
    DROP PROCEDURE usp_UpdateNotificationSecure;
GO

CREATE PROCEDURE usp_UpdateNotificationSecure
    @NotificationUpdateJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Extract parameters from JSON
        DECLARE @notification_id INT = JSON_VALUE(@NotificationUpdateJson, '$.notification_id');
        DECLARE @user_id INT = JSON_VALUE(@NotificationUpdateJson, '$.user_id');
        
        -- Validate required parameters
        IF @notification_id IS NULL
        BEGIN
            RAISERROR('Notification ID is required', 16, 1);
            RETURN;
        END
        
        IF @user_id IS NULL
        BEGIN
            RAISERROR('User ID is required for security validation', 16, 1);
            RETURN;
        END
        
        -- Update notification with proper user validation
        UPDATE Notifications 
        SET is_read = 1, date_read = GETDATE()
        WHERE notification_id = @notification_id 
          AND user_id = @user_id;
        
        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR('Notification not found or access denied', 16, 1);
            RETURN;
        END
        
        -- Return success status
        SELECT 
            'success' as status,
            'Notification marked as read' as message,
            @notification_id as notification_id;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

PRINT 'Additional security-critical procedures created successfully.';
PRINT 'All raw SQL security vulnerabilities can now be eliminated.';
PRINT 'Ready for API security hardening.';
PRINT '';
