-- Fix usp_GetAllPrograms program_manager join issue
USE H10CM;
GO

DROP PROCEDURE IF EXISTS [dbo].[usp_GetAllPrograms];
GO

CREATE PROCEDURE [dbo].[usp_GetAllPrograms]
    @RequestingUserId INT = NULL,
    @IsSystemAdmin BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Programs)
        BEGIN
            SELECT 
                CAST(NULL AS INT) as program_id,
                CAST(NULL AS NVARCHAR(100)) as program_name,
                CAST(NULL AS NVARCHAR(50)) as program_code,
                CAST(NULL AS NVARCHAR(MAX)) as program_description,
                CAST(NULL AS NVARCHAR(100)) as program_manager,
                CAST(NULL AS BIT) as is_active,
                CAST(NULL AS DATETIME2) as date_created,
                CAST(NULL AS NVARCHAR(100)) as program_manager_name,
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
            p.program_manager as program_manager_name, -- Use the string value directly since it's already a name
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

PRINT 'usp_GetAllPrograms fixed - program_manager field type issue resolved';
