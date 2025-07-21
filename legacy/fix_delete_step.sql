-- Fix usp_DeleteProjectStep column name issue
USE H10CM;
GO

DROP PROCEDURE IF EXISTS [dbo].[usp_DeleteProjectStep];
GO

CREATE PROCEDURE [dbo].[usp_DeleteProjectStep]
    @step_id INT,
    @deleted_by NVARCHAR(100) = 'System'
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        IF @step_id IS NULL OR @step_id <= 0
        BEGIN
            RAISERROR('Valid step ID is required', 16, 1);
            RETURN;
        END

        IF NOT EXISTS (SELECT 1 FROM ProjectSteps WHERE step_id = @step_id)
        BEGIN
            RAISERROR('Project step not found', 16, 1);
            RETURN;
        END

        -- Get step info before deletion for audit
        DECLARE @project_id INT;
        DECLARE @step_name NVARCHAR(255);
        
        SELECT @project_id = project_id, @step_name = step_name
        FROM ProjectSteps 
        WHERE step_id = @step_id;

        BEGIN TRANSACTION;

        -- Delete related step inventory requirements
        DELETE FROM StepInventoryRequirements 
        WHERE step_id = @step_id;

        -- Delete tracked progress for this step
        DELETE FROM TrackedItemStepProgress 
        WHERE step_id = @step_id;

        -- Delete the project step
        DELETE FROM ProjectSteps 
        WHERE step_id = @step_id;

        COMMIT TRANSACTION;

        -- Return success message as manual JSON
        SELECT '{"success": true, "message": "Project step deleted successfully", "deleted_step_id": ' + CAST(@step_id AS NVARCHAR(10)) + ', "step_name": "' + ISNULL(@step_name, '') + '"}' as result;

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

PRINT 'usp_DeleteProjectStep fixed - now uses step_name instead of step_title';
