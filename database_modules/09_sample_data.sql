-- ==============================================================================
-- 09_SAMPLE_DATA.SQL - H10CM DEVELOPMENT SAMPLE DATA (OPTIONAL)
-- ==============================================================================
-- This module contains OPTIONAL sample data for development and testing purposes.
-- This is NOT required for production deployment and should NOT be run in production.
-- 
-- DEPENDENCIES: 08_security_procedures.sql
-- CREATES: Optional sample data for development environment only
--
-- Author: H10CM Development Team
-- Created: 2025-07-20
-- Version: H10CM v2.1 Modular (Optional Development Data Only)
-- ==============================================================================

USE H10CM;
GO

PRINT 'Inserting OPTIONAL sample data for development...';
PRINT 'NOTE: This data is for development/testing only and should NOT be used in production';

-- ==============================================================================
-- SAMPLE PROGRAMS (Development/Testing Only)
-- ==============================================================================

-- Only insert sample programs if none exist (besides the system admin program)
IF (SELECT COUNT(*) FROM Programs WHERE program_code != 'SYS001') = 0
BEGIN
    -- Insert sample programs
    INSERT INTO Programs (program_name, program_code, program_description, is_active, date_created, last_modified) VALUES
    ('NSWC Development Program', 'DEV001', 'Development and testing program for H10CM system', 1, GETDATE(), GETDATE()),
    ('Manufacturing Unit A', 'MFG001', 'Primary manufacturing facility program', 1, GETDATE(), GETDATE()),
    ('Quality Assurance Lab', 'QA001', 'Quality control and testing laboratory', 1, GETDATE(), GETDATE());
    
    PRINT 'Created sample programs for development';
END
ELSE
BEGIN
    PRINT 'Programs already exist - skipping sample program creation';
END

DECLARE @DevProgramId INT = (SELECT program_id FROM Programs WHERE program_code = 'DEV001');
DECLARE @MfgProgramId INT = (SELECT program_id FROM Programs WHERE program_code = 'MFG001');
DECLARE @QAProgramId INT = (SELECT program_id FROM Programs WHERE program_code = 'QA001');
DECLARE @SystemAdminUserId INT = (SELECT user_id FROM Users WHERE certificate_subject = 'CN=DOUGHERTY.JUSTIN.MICHAEL.1250227228,OU=USN,OU=PKI,OU=DoD,O=U.S. Government,C=US');

-- ==============================================================================
-- SAMPLE USERS (Development/Testing Only)
-- ==============================================================================

-- Only insert sample users if they don't exist
IF NOT EXISTS (SELECT 1 FROM Users WHERE certificate_subject = 'CN=Development Admin,O=NSWC,C=US')
BEGIN
    -- Insert sample users (for testing certificate authentication)
    INSERT INTO Users (certificate_subject, user_name, display_name, first_name, last_name, email, is_active, date_created, last_modified) VALUES
    ('CN=Development Admin,O=NSWC,C=US', 'dev.admin', 'Development Admin', 'Dev', 'Admin', 'dev.admin@navy.mil', 1, GETDATE(), GETDATE()),
    ('CN=John Smith,O=NSWC,C=US', 'john.smith', 'John Smith', 'John', 'Smith', 'john.smith@navy.mil', 1, GETDATE(), GETDATE()),
    ('CN=Jane Doe,O=NSWC,C=US', 'jane.doe', 'Jane Doe', 'Jane', 'Doe', 'jane.doe@navy.mil', 1, GETDATE(), GETDATE());
    
    PRINT 'Created sample users for development';
END
ELSE
BEGIN
    PRINT 'Sample users already exist - skipping sample user creation';
END

DECLARE @DevAdminUserId INT = (SELECT user_id FROM Users WHERE certificate_subject = 'CN=Development Admin,O=NSWC,C=US');
DECLARE @JohnUserId INT = (SELECT user_id FROM Users WHERE certificate_subject = 'CN=John Smith,O=NSWC,C=US');
DECLARE @JaneUserId INT = (SELECT user_id FROM Users WHERE certificate_subject = 'CN=Jane Doe,O=NSWC,C=US');

-- ==============================================================================
-- SAMPLE PROGRAM ACCESS
-- ==============================================================================

-- Grant program access to users
INSERT INTO ProgramAccess (user_id, program_id, access_level, granted_by, date_granted) VALUES
(@AdminUserId, @DevProgramId, 'Admin', @AdminUserId, GETDATE()),
(@AdminUserId, @MfgProgramId, 'Admin', @AdminUserId, GETDATE()),
(@AdminUserId, @QAProgramId, 'Admin', @AdminUserId, GETDATE()),
(@JohnUserId, @DevProgramId, 'Write', @AdminUserId, GETDATE()),
(@JohnUserId, @MfgProgramId, 'Read', @AdminUserId, GETDATE()),
(@JaneUserId, @DevProgramId, 'Write', @AdminUserId, GETDATE()),
(@JaneUserId, @QAProgramId, 'Write', @AdminUserId, GETDATE());

-- ==============================================================================
-- SAMPLE PROJECTS
-- ==============================================================================

-- Insert sample projects
INSERT INTO Projects (project_name, description, status, program_id, created_by, assigned_to, date_created, last_modified) VALUES
('H10CM System Development', 'Core development project for H10CM platform', 'Active', @DevProgramId, @AdminUserId, @JohnUserId, GETDATE(), GETDATE()),
('Inventory Management Module', 'Development of inventory tracking capabilities', 'Active', @DevProgramId, @AdminUserId, @JaneUserId, GETDATE(), GETDATE()),
('Production Line Setup', 'Initial manufacturing line configuration', 'Planning', @MfgProgramId, @AdminUserId, @JohnUserId, GETDATE(), GETDATE()),
('Quality Control Procedures', 'Establishment of QC testing protocols', 'Active', @QAProgramId, @AdminUserId, @JaneUserId, GETDATE(), GETDATE());

DECLARE @H10CMProjectId INT = (SELECT project_id FROM Projects WHERE project_name = 'H10CM System Development');
DECLARE @InventoryProjectId INT = (SELECT project_id FROM Projects WHERE project_name = 'Inventory Management Module');
DECLARE @ProductionProjectId INT = (SELECT project_id FROM Projects WHERE project_name = 'Production Line Setup');
DECLARE @QCProjectId INT = (SELECT project_id FROM Projects WHERE project_name = 'Quality Control Procedures');

-- ==============================================================================
-- SAMPLE INVENTORY ITEMS
-- ==============================================================================

-- Insert sample inventory items
INSERT INTO InventoryItems (item_name, description, part_number, current_stock_level, cost_per_unit, program_id, created_by, date_created, last_modified) VALUES
('Circuit Board PCB-001', 'Main control circuit board', 'PCB-001', 25, 150.00, @DevProgramId, @AdminUserId, GETDATE(), GETDATE()),
('Resistor 10K Ohm', '10K Ohm precision resistor pack', 'RES-10K-001', 500, 0.25, @DevProgramId, @JaneUserId, GETDATE(), GETDATE()),
('Capacitor 100uF', '100 microfarad electrolytic capacitor', 'CAP-100UF-001', 200, 1.50, @DevProgramId, @JaneUserId, GETDATE(), GETDATE()),
('Steel Bracket SB-100', 'Mounting bracket for equipment', 'SB-100', 75, 25.00, @MfgProgramId, @JohnUserId, GETDATE(), GETDATE()),
('Testing Cable TC-50', '50-foot testing cable assembly', 'TC-50', 10, 85.00, @QAProgramId, @JaneUserId, GETDATE(), GETDATE());

-- ==============================================================================
-- SAMPLE VENDORS AND SPONSORS
-- ==============================================================================

-- Insert sample vendors
INSERT INTO ProcurementVendors (program_id, vendor_name, vendor_code, primary_contact_name, primary_contact_email, primary_contact_phone, billing_address, status, created_by, created_date, last_modified) VALUES
(@DevProgramId, 'TechSupply Corp', 'TECH001', 'Mike Johnson', 'mike.johnson@techsupply.com', '555-0123', '123 Tech Street, Tech City, TC 12345', 'Active', @AdminUserId, GETDATE(), GETDATE()),
(@MfgProgramId, 'Industrial Parts LLC', 'IND001', 'Sarah Wilson', 'sarah.wilson@industrialparts.com', '555-0456', '456 Industrial Blvd, Factory Town, FT 67890', 'Active', @AdminUserId, GETDATE(), GETDATE()),
(@QAProgramId, 'Quality Components Inc', 'QC001', 'Bob Martinez', 'bob.martinez@qualitycomp.com', '555-0789', '789 Quality Lane, QC City, QC 11111', 'Active', @AdminUserId, GETDATE(), GETDATE());

-- Insert sample sponsors
INSERT INTO Sponsors (program_id, sponsor_name, sponsor_code, organization_type, primary_contact_name, primary_contact_email, primary_contact_phone, status, created_by, created_date, last_modified) VALUES
(@DevProgramId, 'Navy Research Office', 'NRO001', 'Government', 'Admiral Smith', 'admiral.smith@navy.mil', '555-1000', 'Active', @AdminUserId, GETDATE(), GETDATE()),
(@MfgProgramId, 'Manufacturing Division', 'MFG001', 'Government', 'Captain Jones', 'captain.jones@navy.mil', '555-2000', 'Active', @AdminUserId, GETDATE(), GETDATE()),
(@QAProgramId, 'Quality Assurance Dept', 'QA001', 'Government', 'Commander Davis', 'commander.davis@navy.mil', '555-3000', 'Active', @AdminUserId, GETDATE(), GETDATE());

PRINT 'Sample data inserted successfully.';
PRINT 'Development environment is ready with sample programs, users, and inventory.';
PRINT 'Ready for indexes and constraints.';
PRINT '';
