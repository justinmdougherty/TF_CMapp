-- Missing usp_GetProjects stored procedure for H10CM
USE H10CM;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_GetProjects')
    DROP PROCEDURE [dbo].[usp_GetProjects];
GO

CREATE PROCEDURE [dbo].[usp_GetProjects]
    @RequestingUserId INT,
    @IsSystemAdmin BIT = 0,
    @ProgramFilter INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT p.project_id, p.program_id, p.project_name, p.project_description, 
               p.status, p.priority, pr.program_name, pr.program_code,
               pm.display_name as project_manager_name,
               p.date_created, p.last_modified, p.project_start_date, p.project_end_date
        FROM Projects p
        JOIN Programs pr ON p.program_id = pr.program_id
        LEFT JOIN Users pm ON p.project_manager_id = pm.user_id
        WHERE (@ProgramFilter IS NULL OR p.program_id = @ProgramFilter)
          AND (@IsSystemAdmin = 1 OR p.program_id IS NOT NULL)
        ORDER BY p.project_name;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR('Error in usp_GetProjects: %s', 16, 1, @ErrorMessage);
    END CATCH
END
GO

PRINT 'usp_GetProjects procedure created successfully.';
