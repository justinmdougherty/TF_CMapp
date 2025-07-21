-- ==============================================================================
-- H10CM STORED PROCEDURE FIXES
-- ==============================================================================
-- This script fixes column name mismatches in stored procedures to match
-- actual table structures in the H10CM database.
-- 
-- Issues Fixed:
-- 1. Column name mismatches (e.g., sponsor_type vs organization_type)
-- 2. JSON_OBJECT compatibility for older SQL Server versions
-- 3. Missing column references in various procedures
-- 
-- Date: 2025-07-20
-- Author: System Fix Script
-- ==============================================================================

USE H10CM;
GO

-- Drop and recreate problematic procedures with correct column names

-- =============================================
-- Fix usp_GetSponsors
-- =============================================
DROP PROCEDURE IF EXISTS [dbo].[usp_GetSponsors];
GO

CREATE PROCEDURE [dbo].[usp_GetSponsors]
    @program_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Programs WHERE program_id = @program_id)
        BEGIN
            SELECT 
                CAST(NULL AS INT) as sponsor_id,
                CAST(NULL AS NVARCHAR(100)) as sponsor_name,
                CAST(NULL AS NVARCHAR(50)) as sponsor_code,
                CAST(NULL AS NVARCHAR(100)) as organization_type,
                CAST(NULL AS NVARCHAR(255)) as primary_contact_name,
                CAST(NULL AS NVARCHAR(255)) as primary_contact_email,
                CAST(NULL AS NVARCHAR(50)) as primary_contact_phone,
                CAST(NULL AS NVARCHAR(MAX)) as billing_address,
                CAST(NULL AS NVARCHAR(50)) as tax_id,
                CAST(NULL AS NVARCHAR(100)) as payment_terms,
                CAST(NULL AS NVARCHAR(50)) as status,
                CAST(NULL AS NVARCHAR(MAX)) as notes,
                CAST(NULL AS DATETIME2) as last_modified,
                CAST(NULL AS NVARCHAR(100)) as created_by
            WHERE 1 = 0;
            RETURN;
        END

        SELECT 
            sponsor_id,
            sponsor_name,
            sponsor_code,
            organization_type,
            primary_contact_name,
            primary_contact_email,
            primary_contact_phone,
            billing_address,
            tax_id,
            payment_terms,
            status,
            notes,
            last_modified,
            created_by
        FROM Sponsors 
        WHERE program_id = @program_id
        ORDER BY sponsor_name;
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
-- Fix usp_SaveSponsor
-- =============================================
DROP PROCEDURE IF EXISTS [dbo].[usp_SaveSponsor];
GO

CREATE PROCEDURE [dbo].[usp_SaveSponsor]
    @SponsorJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        DECLARE @sponsor_id INT = JSON_VALUE(@SponsorJson, '$.sponsor_id');
        DECLARE @program_id INT = JSON_VALUE(@SponsorJson, '$.program_id');
        DECLARE @sponsor_name NVARCHAR(100) = JSON_VALUE(@SponsorJson, '$.sponsor_name');
        DECLARE @sponsor_code NVARCHAR(50) = JSON_VALUE(@SponsorJson, '$.sponsor_code');
        DECLARE @organization_type NVARCHAR(100) = JSON_VALUE(@SponsorJson, '$.organization_type');
        DECLARE @primary_contact_name NVARCHAR(255) = JSON_VALUE(@SponsorJson, '$.primary_contact_name');
        DECLARE @primary_contact_email NVARCHAR(255) = JSON_VALUE(@SponsorJson, '$.primary_contact_email');
        DECLARE @primary_contact_phone NVARCHAR(50) = JSON_VALUE(@SponsorJson, '$.primary_contact_phone');
        DECLARE @billing_address NVARCHAR(MAX) = JSON_VALUE(@SponsorJson, '$.billing_address');
        DECLARE @tax_id NVARCHAR(50) = JSON_VALUE(@SponsorJson, '$.tax_id');
        DECLARE @payment_terms NVARCHAR(100) = JSON_VALUE(@SponsorJson, '$.payment_terms');
        DECLARE @status NVARCHAR(50) = JSON_VALUE(@SponsorJson, '$.status');
        DECLARE @notes NVARCHAR(MAX) = JSON_VALUE(@SponsorJson, '$.notes');
        DECLARE @created_by NVARCHAR(100) = JSON_VALUE(@SponsorJson, '$.created_by');

        IF @sponsor_id IS NULL OR @sponsor_id <= 0
        BEGIN
            -- Insert new sponsor
            INSERT INTO Sponsors (
                program_id, sponsor_name, sponsor_code, organization_type,
                primary_contact_name, primary_contact_email, primary_contact_phone,
                billing_address, tax_id, payment_terms, status, notes,
                created_by, created_date, last_modified
            )
            VALUES (
                @program_id, @sponsor_name, @sponsor_code, @organization_type,
                @primary_contact_name, @primary_contact_email, @primary_contact_phone,
                @billing_address, @tax_id, @payment_terms, ISNULL(@status, 'Active'), @notes,
                @created_by, GETUTCDATE(), GETUTCDATE()
            );
            
            SET @sponsor_id = SCOPE_IDENTITY();
        END
        ELSE
        BEGIN
            -- Update existing sponsor
            UPDATE Sponsors SET
                sponsor_name = @sponsor_name,
                sponsor_code = @sponsor_code,
                organization_type = @organization_type,
                primary_contact_name = @primary_contact_name,
                primary_contact_email = @primary_contact_email,
                primary_contact_phone = @primary_contact_phone,
                billing_address = @billing_address,
                tax_id = @tax_id,
                payment_terms = @payment_terms,
                status = @status,
                notes = @notes,
                last_modified = GETUTCDATE()
            WHERE sponsor_id = @sponsor_id AND program_id = @program_id;
        END

        -- Return the saved sponsor
        SELECT * FROM Sponsors WHERE sponsor_id = @sponsor_id;
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
-- Fix usp_GetSponsorFunds
-- =============================================
DROP PROCEDURE IF EXISTS [dbo].[usp_GetSponsorFunds];
GO

CREATE PROCEDURE [dbo].[usp_GetSponsorFunds]
    @program_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Programs WHERE program_id = @program_id)
        BEGIN
            SELECT 
                CAST(NULL AS INT) as fund_id,
                CAST(NULL AS INT) as sponsor_id,
                CAST(NULL AS NVARCHAR(100)) as fund_name,
                CAST(NULL AS NVARCHAR(50)) as fund_code,
                CAST(NULL AS NVARCHAR(50)) as fund_type,
                CAST(NULL AS DECIMAL(15,2)) as total_amount,
                CAST(NULL AS DECIMAL(15,2)) as allocated_amount,
                CAST(NULL AS DECIMAL(15,2)) as spent_amount,
                CAST(NULL AS DECIMAL(15,2)) as remaining_amount,
                CAST(NULL AS DATE) as effective_date,
                CAST(NULL AS DATE) as expiration_date,
                CAST(NULL AS NVARCHAR(100)) as sponsor_name,
                CAST(NULL AS NVARCHAR(50)) as approval_status,
                CAST(NULL AS DATETIME2) as last_modified,
                CAST(NULL AS NVARCHAR(100)) as created_by
            WHERE 1 = 0;
            RETURN;
        END

        SELECT 
            sf.fund_id,
            sf.sponsor_id,
            sf.fund_name,
            sf.fund_code,
            sf.fund_type,
            sf.total_amount,
            sf.allocated_amount,
            sf.spent_amount,
            sf.remaining_amount,
            sf.effective_date,
            sf.expiration_date,
            s.sponsor_name,
            sf.approval_status,
            sf.last_modified,
            sf.created_by
        FROM SponsorFunds sf
        JOIN Sponsors s ON sf.sponsor_id = s.sponsor_id
        WHERE s.program_id = @program_id
        ORDER BY sf.fund_name;
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
-- Fix usp_SaveSponsorFund
-- =============================================
DROP PROCEDURE IF EXISTS [dbo].[usp_SaveSponsorFund];
GO

CREATE PROCEDURE [dbo].[usp_SaveSponsorFund]
    @SponsorFundJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        DECLARE @fund_id INT = JSON_VALUE(@SponsorFundJson, '$.fund_id');
        DECLARE @sponsor_id INT = JSON_VALUE(@SponsorFundJson, '$.sponsor_id');
        DECLARE @fund_name NVARCHAR(100) = JSON_VALUE(@SponsorFundJson, '$.fund_name');
        DECLARE @fund_code NVARCHAR(50) = JSON_VALUE(@SponsorFundJson, '$.fund_code');
        DECLARE @fund_type NVARCHAR(50) = JSON_VALUE(@SponsorFundJson, '$.fund_type');
        DECLARE @total_amount DECIMAL(15,2) = JSON_VALUE(@SponsorFundJson, '$.total_amount');
        DECLARE @allocated_amount DECIMAL(15,2) = JSON_VALUE(@SponsorFundJson, '$.allocated_amount');
        DECLARE @spent_amount DECIMAL(15,2) = JSON_VALUE(@SponsorFundJson, '$.spent_amount');
        DECLARE @remaining_amount DECIMAL(15,2) = JSON_VALUE(@SponsorFundJson, '$.remaining_amount');
        DECLARE @effective_date DATE = JSON_VALUE(@SponsorFundJson, '$.effective_date');
        DECLARE @expiration_date DATE = JSON_VALUE(@SponsorFundJson, '$.expiration_date');
        DECLARE @funding_document_id NVARCHAR(100) = JSON_VALUE(@SponsorFundJson, '$.funding_document_id');
        DECLARE @approval_status NVARCHAR(50) = JSON_VALUE(@SponsorFundJson, '$.approval_status');
        DECLARE @approved_by NVARCHAR(100) = JSON_VALUE(@SponsorFundJson, '$.approved_by');
        DECLARE @approved_date DATETIME2 = JSON_VALUE(@SponsorFundJson, '$.approved_date');
        DECLARE @status NVARCHAR(50) = JSON_VALUE(@SponsorFundJson, '$.status');
        DECLARE @restrictions NVARCHAR(MAX) = JSON_VALUE(@SponsorFundJson, '$.restrictions');
        DECLARE @reporting_requirements NVARCHAR(MAX) = JSON_VALUE(@SponsorFundJson, '$.reporting_requirements');
        DECLARE @notes NVARCHAR(MAX) = JSON_VALUE(@SponsorFundJson, '$.notes');
        DECLARE @created_by NVARCHAR(100) = JSON_VALUE(@SponsorFundJson, '$.created_by');

        IF @fund_id IS NULL OR @fund_id <= 0
        BEGIN
            -- Insert new fund
            INSERT INTO SponsorFunds (
                sponsor_id, fund_name, fund_code, fund_type, total_amount,
                allocated_amount, spent_amount, remaining_amount, effective_date, expiration_date,
                funding_document_id, approval_status, approved_by, approved_date, status,
                restrictions, reporting_requirements, notes, created_by, created_date, last_modified
            )
            VALUES (
                @sponsor_id, @fund_name, @fund_code, @fund_type, @total_amount,
                ISNULL(@allocated_amount, 0), ISNULL(@spent_amount, 0), ISNULL(@remaining_amount, @total_amount), 
                @effective_date, @expiration_date, @funding_document_id, ISNULL(@approval_status, 'Pending'),
                @approved_by, @approved_date, ISNULL(@status, 'Active'), @restrictions, @reporting_requirements,
                @notes, @created_by, GETUTCDATE(), GETUTCDATE()
            );
            
            SET @fund_id = SCOPE_IDENTITY();
        END
        ELSE
        BEGIN
            -- Update existing fund
            UPDATE SponsorFunds SET
                sponsor_id = @sponsor_id,
                fund_name = @fund_name,
                fund_code = @fund_code,
                fund_type = @fund_type,
                total_amount = @total_amount,
                allocated_amount = @allocated_amount,
                spent_amount = @spent_amount,
                remaining_amount = @remaining_amount,
                effective_date = @effective_date,
                expiration_date = @expiration_date,
                funding_document_id = @funding_document_id,
                approval_status = @approval_status,
                approved_by = @approved_by,
                approved_date = @approved_date,
                status = @status,
                restrictions = @restrictions,
                reporting_requirements = @reporting_requirements,
                notes = @notes,
                last_modified = GETUTCDATE()
            WHERE fund_id = @fund_id;
        END

        -- Return the saved fund
        SELECT sf.*, s.sponsor_name 
        FROM SponsorFunds sf
        JOIN Sponsors s ON sf.sponsor_id = s.sponsor_id
        WHERE sf.fund_id = @fund_id;
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
-- Fix usp_GetProcurementVendors
-- =============================================
DROP PROCEDURE IF EXISTS [dbo].[usp_GetProcurementVendors];
GO

CREATE PROCEDURE [dbo].[usp_GetProcurementVendors]
    @program_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Programs WHERE program_id = @program_id)
        BEGIN
            SELECT 
                CAST(NULL AS INT) as vendor_id,
                CAST(NULL AS NVARCHAR(100)) as vendor_name,
                CAST(NULL AS NVARCHAR(50)) as vendor_code,
                CAST(NULL AS NVARCHAR(100)) as vendor_type
            WHERE 1 = 0;
            RETURN;
        END

        SELECT 
            vendor_id,
            vendor_name,
            vendor_code,
            vendor_type
        FROM ProcurementVendors 
        WHERE program_id = @program_id
        ORDER BY vendor_name;
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
-- Fix usp_SaveProcurementVendor
-- =============================================
DROP PROCEDURE IF EXISTS [dbo].[usp_SaveProcurementVendor];
GO

CREATE PROCEDURE [dbo].[usp_SaveProcurementVendor]
    @VendorJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        DECLARE @vendor_id INT = JSON_VALUE(@VendorJson, '$.vendor_id');
        DECLARE @program_id INT = JSON_VALUE(@VendorJson, '$.program_id');
        DECLARE @vendor_name NVARCHAR(100) = JSON_VALUE(@VendorJson, '$.vendor_name');
        DECLARE @vendor_code NVARCHAR(50) = JSON_VALUE(@VendorJson, '$.vendor_code');
        DECLARE @vendor_type NVARCHAR(100) = JSON_VALUE(@VendorJson, '$.vendor_type');
        DECLARE @created_by NVARCHAR(100) = JSON_VALUE(@VendorJson, '$.created_by');

        IF @vendor_id IS NULL OR @vendor_id <= 0
        BEGIN
            -- Insert new vendor
            INSERT INTO ProcurementVendors (
                program_id, vendor_name, vendor_code, vendor_type,
                created_by, created_date, last_modified
            )
            VALUES (
                @program_id, @vendor_name, @vendor_code, @vendor_type,
                @created_by, GETUTCDATE(), GETUTCDATE()
            );
            
            SET @vendor_id = SCOPE_IDENTITY();
        END
        ELSE
        BEGIN
            -- Update existing vendor
            UPDATE ProcurementVendors SET
                vendor_name = @vendor_name,
                vendor_code = @vendor_code,
                vendor_type = @vendor_type,
                last_modified = GETUTCDATE()
            WHERE vendor_id = @vendor_id AND program_id = @program_id;
        END

        -- Return the saved vendor
        SELECT * FROM ProcurementVendors WHERE vendor_id = @vendor_id;
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
-- Fix usp_DeleteProjectStep - Replace JSON_OBJECT with manual JSON
-- =============================================
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
        DECLARE @step_title NVARCHAR(255);
        
        SELECT @project_id = project_id, @step_title = step_title
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
        SELECT '{"success": true, "message": "Project step deleted successfully", "deleted_step_id": ' + CAST(@step_id AS NVARCHAR(10)) + ', "step_title": "' + ISNULL(@step_title, '') + '"}' as result;

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
-- Fix usp_GetAllPrograms - Drop and recreate to fix is_active issue
-- =============================================
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
            pm.display_name as program_manager_name,
            (SELECT COUNT(*) FROM Projects proj WHERE proj.program_id = p.program_id) as project_count,
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
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

PRINT '=================================================';
PRINT 'H10CM STORED PROCEDURE FIXES COMPLETED';
PRINT '=================================================';
PRINT 'Fixed Procedures:';
PRINT '- usp_GetSponsors (Column name alignment)';
PRINT '- usp_SaveSponsor (Column name alignment)';
PRINT '- usp_GetSponsorFunds (Column name alignment)';
PRINT '- usp_SaveSponsorFund (Column name alignment)';
PRINT '- usp_GetProcurementVendors (Column name alignment)';
PRINT '- usp_SaveProcurementVendor (Column name alignment)';
PRINT '- usp_DeleteProjectStep (JSON_OBJECT compatibility fix)';
PRINT '- usp_GetAllPrograms (Recreated to fix is_active issue)';
PRINT '';
PRINT 'Column Mapping Changes:';
PRINT '- sponsor_type → organization_type';
PRINT '- contact_person → primary_contact_name';
PRINT '- contact_email → primary_contact_email';
PRINT '- contact_phone → primary_contact_phone';
PRINT '- start_date → effective_date';
PRINT '- modified_date/modified_by → last_modified/created_by';
PRINT '';
PRINT 'Compatibility Fixes:';
PRINT '- Replaced JSON_OBJECT with manual JSON string construction';
PRINT '- Added comprehensive error handling for all procedures';
PRINT '- Added empty database handling for all GET procedures';
PRINT '';
PRINT 'All procedures now match actual table structures!';
