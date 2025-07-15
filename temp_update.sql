-- H10CM Database Procedures Update Script
-- This script updates existing stored procedures to use JSON parameters instead of individual parameters

USE H10CM;
GO

PRINT 'Updating stored procedures to use JSON parameters...';

-- Update usp_SaveProject
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_SaveProject')
    DROP PROCEDURE [dbo].[usp_SaveProject];
GO

CREATE PROCEDURE [dbo].[usp_SaveProject]
    @ProjectJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Parse JSON input
    DECLARE @project_id INT,
            @program_id INT,
            @project_name NVARCHAR(100),
            @project_description NVARCHAR(MAX),
            @status NVARCHAR(50),
            @priority NVARCHAR(20),
            @project_manager_id INT,
            @project_start_date DATE,
            @project_end_date DATE,
            @estimated_completion_date DATE,
            @budget DECIMAL(18,2),
            @notes NVARCHAR(MAX),
            @created_by INT;
    
    -- Extract values from JSON
    SELECT 
        @project_id = JSON_VALUE(@ProjectJson, '$.project_id'),
        @program_id = JSON_VALUE(@ProjectJson, '$.program_id'),
        @project_name = JSON_VALUE(@ProjectJson, '$.project_name'),
        @project_description = JSON_VALUE(@ProjectJson, '$.project_description'),
        @status = ISNULL(JSON_VALUE(@ProjectJson, '$.status'), 'Planning'),
        @priority = ISNULL(JSON_VALUE(@ProjectJson, '$.priority'), 'Medium'),
        @project_manager_id = JSON_VALUE(@ProjectJson, '$.project_manager_id'),
        @project_start_date = JSON_VALUE(@ProjectJson, '$.project_start_date'),
        @project_end_date = JSON_VALUE(@ProjectJson, '$.project_end_date'),
        @estimated_completion_date = JSON_VALUE(@ProjectJson, '$.estimated_completion_date'),
        @budget = JSON_VALUE(@ProjectJson, '$.budget'),
        @notes = JSON_VALUE(@ProjectJson, '$.notes'),
        @created_by = JSON_VALUE(@ProjectJson, '$.created_by');
    
    -- Validate required fields
    IF @program_id IS NULL OR @project_name IS NULL OR @project_name = '' OR @created_by IS NULL
    BEGIN
        RAISERROR('Required fields missing: program_id, project_name, and created_by are required.', 16, 1);
        RETURN;
    END
    
    IF @project_id IS NULL
    BEGIN
        -- Insert new project
        INSERT INTO dbo.Projects (
            program_id, project_name, project_description, status, priority,
            project_manager_id, project_start_date, project_end_date,
            estimated_completion_date, budget, notes, created_by
        )
        VALUES (
            @program_id, @project_name, @project_description, @status, @priority,
            @project_manager_id, @project_start_date, @project_end_date,
            @estimated_completion_date, @budget, @notes, @created_by
        );
        
        SET @project_id = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        -- Update existing project
        UPDATE dbo.Projects
        SET 
            program_id = @program_id,
            project_name = @project_name,
            project_description = @project_description,
            status = @status,
            priority = @priority,
            project_manager_id = @project_manager_id,
            project_start_date = @project_start_date,
            project_end_date = @project_end_date,
            estimated_completion_date = @estimated_completion_date,
            budget = @budget,
            notes = @notes,
            last_modified = GETDATE()
        WHERE project_id = @project_id;
    END
    
    -- Return the project
    SELECT 
        p.project_id,
        p.project_name,
        p.project_description,
        p.status,
        p.priority,
        p.date_created,
        p.last_modified,
        p.project_start_date,
        p.project_end_date,
        p.estimated_completion_date,
        p.actual_completion_date,
        p.budget,
        p.notes,
        pr.program_name,
        pr.program_code
    FROM dbo.Projects p
    LEFT JOIN dbo.Programs pr ON p.program_id = pr.program_id
    WHERE p.project_id = @project_id;
END;
GO

PRINT 'Successfully updated usp_SaveProject';
