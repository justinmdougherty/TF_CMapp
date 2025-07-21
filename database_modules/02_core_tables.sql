-- ==============================================================================
-- 02_CORE_TABLES.SQL - H10CM CORE RBAC AND USER MANAGEMENT TABLES
-- ==============================================================================
-- This module creates the foundational tables for the H10CM multi-tenant system:
-- Users, Programs, Roles, and Access Control tables.
-- 
-- DEPENDENCIES: 01_database_and_schema.sql
-- CREATES: Core RBAC tables, Users, Programs, and access control structure
--
-- Author: H10CM Development Team
-- Created: 2025-07-20
-- Version: H10CM v2.1 Modular
-- ==============================================================================

USE H10CM;
GO

PRINT 'Creating core RBAC and user management tables...';
GO

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- JSON Validation Function
CREATE FUNCTION [dbo].[fn_IsValidJson](@json NVARCHAR(MAX))
RETURNS BIT
AS
BEGIN
    RETURN (SELECT ISJSON(@json));
END;
GO

-- =============================================
-- MULTI-TENANT RBAC TABLES
-- =============================================

-- Programs Table (Multi-Tenant Segmentation - ROOT ENTITY)
CREATE TABLE [dbo].[Programs](
    [program_id] [int] IDENTITY(1,1) NOT NULL,
    [program_name] [nvarchar](100) NOT NULL,
    [program_code] [nvarchar](20) NOT NULL,
    [program_description] [nvarchar](max) NULL,
    [is_active] [bit] NOT NULL DEFAULT 1,
    [date_created] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [last_modified] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [created_by] [nvarchar](255) NULL,
    [program_manager] [nvarchar](255) NULL,
    CONSTRAINT [PK_Programs] PRIMARY KEY CLUSTERED ([program_id]),
    CONSTRAINT [UQ_Programs_Name] UNIQUE ([program_name]),
    CONSTRAINT [UQ_Programs_Code] UNIQUE ([program_code])
) ON [PRIMARY];
GO

-- Users Table (Certificate-based Authentication)
CREATE TABLE [dbo].[Users](
    [user_id] [int] IDENTITY(1,1) NOT NULL,
    [certificate_subject] [nvarchar](500) NOT NULL,
    [certificate_thumbprint] [nvarchar](100) NULL,
    [user_name] [nvarchar](255) NOT NULL,
    [display_name] [nvarchar](255) NOT NULL,
    [email] [nvarchar](255) NULL,
    [first_name] [nvarchar](100) NULL,
    [last_name] [nvarchar](100) NULL,
    [initials] [nvarchar](10) NULL,
    [is_active] [bit] NOT NULL DEFAULT 1,
    [is_system_admin] [bit] NOT NULL DEFAULT 0,
    [last_login] [datetime2](7) NULL,
    [date_created] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [last_modified] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [preferences] [nvarchar](max) NULL, -- JSON for user preferences
    CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED ([user_id]),
    CONSTRAINT [UQ_Users_Certificate] UNIQUE ([certificate_subject]),
    CONSTRAINT [UQ_Users_UserName] UNIQUE ([user_name])
) ON [PRIMARY];
GO

-- ==============================================================================
-- INITIAL SYSTEM ADMIN SETUP (PRODUCTION REQUIRED)
-- ==============================================================================
-- This creates the initial system administrator account required for system setup.
-- This is NOT sample data - it's required for the system to function.

PRINT 'Setting up initial system administrator account...';

-- Create initial development program (required for system operation)
IF NOT EXISTS (SELECT 1 FROM Programs WHERE program_code = 'SYS001')
BEGIN
    INSERT INTO Programs (program_name, program_code, program_description, is_active, date_created, last_modified)
    VALUES ('System Administration', 'SYS001', 'System administration and initial setup program', 1, GETDATE(), GETDATE());
    
    PRINT 'Created System Administration program (SYS001)';
END

DECLARE @SystemProgramId INT = (SELECT program_id FROM Programs WHERE program_code = 'SYS001');

-- Create initial system administrator (Justin Dougherty)
-- Note: This uses the certificate subject that matches the API authentication
IF NOT EXISTS (SELECT 1 FROM Users WHERE certificate_subject = 'CN=DOUGHERTY.JUSTIN.MICHAEL.1250227228,OU=USN,OU=PKI,OU=DoD,O=U.S. Government,C=US')
BEGIN
    INSERT INTO Users (
        certificate_subject,
        user_name,
        display_name,
        first_name,
        last_name,
        email,
        initials,
        is_active,
        is_system_admin,
        date_created,
        last_modified
    ) VALUES (
        'CN=DOUGHERTY.JUSTIN.MICHAEL.1250227228,OU=USN,OU=PKI,OU=DoD,O=U.S. Government,C=US',
        'justin.dougherty',
        'Justin Dougherty',
        'Justin',
        'Dougherty',
        'justin.dougherty@navy.mil',
        'JD',
        1,
        1, -- System admin
        GETDATE(),
        GETDATE()
    );
    
    DECLARE @AdminUserId INT = (SELECT user_id FROM Users WHERE certificate_subject = 'CN=DOUGHERTY.JUSTIN.MICHAEL.1250227228,OU=USN,OU=PKI,OU=DoD,O=U.S. Government,C=US');
    
    -- Grant admin access to the system program
    INSERT INTO ProgramAccess (user_id, program_id, access_level, granted_by, date_granted)
    VALUES (@AdminUserId, @SystemProgramId, 'Admin', @AdminUserId, GETDATE());
    
    PRINT 'Created initial system administrator: Justin Dougherty';
    PRINT 'Granted admin access to System Administration program';
END
ELSE
BEGIN
    PRINT 'System administrator already exists';
END

-- Roles Table (System Role Definitions)
CREATE TABLE [dbo].[Roles](
    [role_id] [int] IDENTITY(1,1) NOT NULL,
    [role_name] [nvarchar](100) NOT NULL,
    [role_description] [nvarchar](max) NULL,
    [role_level] [nvarchar](50) NOT NULL, -- 'System', 'Program', 'Project', 'Resource'
    [permissions] [nvarchar](max) NULL, -- JSON for permissions
    [is_active] [bit] NOT NULL DEFAULT 1,
    [date_created] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_Roles] PRIMARY KEY CLUSTERED ([role_id]),
    CONSTRAINT [UQ_Roles_Name] UNIQUE ([role_name]),
    CONSTRAINT [CK_Roles_Level] CHECK ([role_level] IN ('System', 'Program', 'Project', 'Resource'))
) ON [PRIMARY];
GO

-- UserRoles Table (Many-to-Many User/Role Assignment)
CREATE TABLE [dbo].[UserRoles](
    [user_role_id] [int] IDENTITY(1,1) NOT NULL,
    [user_id] [int] NOT NULL,
    [role_id] [int] NOT NULL,
    [program_id] [int] NULL, -- NULL for system-level roles
    [project_id] [int] NULL, -- NULL for system/program-level roles
    [assigned_by] [int] NOT NULL,
    [date_assigned] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [date_revoked] [datetime2](7) NULL,
    [is_active] [bit] NOT NULL DEFAULT 1,
    CONSTRAINT [PK_UserRoles] PRIMARY KEY CLUSTERED ([user_role_id]),
    CONSTRAINT [UQ_UserRoles_Assignment] UNIQUE ([user_id], [role_id], [program_id], [project_id])
) ON [PRIMARY];
GO

-- ProgramAccess Table (User Program Permissions - CRITICAL FOR MULTI-TENANCY)
CREATE TABLE [dbo].[ProgramAccess](
    [access_id] [int] IDENTITY(1,1) NOT NULL,
    [user_id] [int] NOT NULL,
    [program_id] [int] NOT NULL,
    [access_level] [nvarchar](50) NOT NULL, -- 'Read', 'Write', 'Admin'
    [granted_by] [int] NOT NULL,
    [date_granted] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [date_revoked] [datetime2](7) NULL,
    [is_active] [bit] NOT NULL DEFAULT 1,
    CONSTRAINT [PK_ProgramAccess] PRIMARY KEY CLUSTERED ([access_id]),
    CONSTRAINT [UQ_ProgramAccess] UNIQUE ([user_id], [program_id]),
    CONSTRAINT [CK_ProgramAccess_Level] CHECK ([access_level] IN ('Read', 'Write', 'Admin'))
) ON [PRIMARY];
GO

-- ProjectAccess Table (Project-Level Permissions)
CREATE TABLE [dbo].[ProjectAccess](
    [access_id] [int] IDENTITY(1,1) NOT NULL,
    [user_id] [int] NOT NULL,
    [project_id] [int] NOT NULL,
    [access_level] [nvarchar](50) NOT NULL, -- 'Read', 'Write', 'Admin'
    [granted_by] [int] NOT NULL,
    [date_granted] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [date_revoked] [datetime2](7) NULL,
    [is_active] [bit] NOT NULL DEFAULT 1,
    CONSTRAINT [PK_ProjectAccess] PRIMARY KEY CLUSTERED ([access_id]),
    CONSTRAINT [UQ_ProjectAccess] UNIQUE ([user_id], [project_id]),
    CONSTRAINT [CK_ProjectAccess_Level] CHECK ([access_level] IN ('Read', 'Write', 'Admin'))
) ON [PRIMARY];
GO

-- Add basic foreign key constraints for core tables
ALTER TABLE [dbo].[UserRoles] ADD CONSTRAINT [FK_UserRoles_Users] 
    FOREIGN KEY([user_id]) REFERENCES [dbo].[Users] ([user_id]);

ALTER TABLE [dbo].[UserRoles] ADD CONSTRAINT [FK_UserRoles_Roles] 
    FOREIGN KEY([role_id]) REFERENCES [dbo].[Roles] ([role_id]);

ALTER TABLE [dbo].[UserRoles] ADD CONSTRAINT [FK_UserRoles_Programs] 
    FOREIGN KEY([program_id]) REFERENCES [dbo].[Programs] ([program_id]);

ALTER TABLE [dbo].[UserRoles] ADD CONSTRAINT [FK_UserRoles_AssignedBy] 
    FOREIGN KEY([assigned_by]) REFERENCES [dbo].[Users] ([user_id]);

ALTER TABLE [dbo].[ProgramAccess] ADD CONSTRAINT [FK_ProgramAccess_Users] 
    FOREIGN KEY([user_id]) REFERENCES [dbo].[Users] ([user_id]);

ALTER TABLE [dbo].[ProgramAccess] ADD CONSTRAINT [FK_ProgramAccess_Programs] 
    FOREIGN KEY([program_id]) REFERENCES [dbo].[Programs] ([program_id]);

ALTER TABLE [dbo].[ProgramAccess] ADD CONSTRAINT [FK_ProgramAccess_GrantedBy] 
    FOREIGN KEY([granted_by]) REFERENCES [dbo].[Users] ([user_id]);

PRINT 'Core RBAC and user management tables created successfully.';
PRINT '- Programs table (Root tenant entity)';
PRINT '- Users table (Certificate-based authentication)';
PRINT '- Roles table (System role definitions)';
PRINT '- UserRoles table (User-role assignments)';
PRINT '- ProgramAccess table (Multi-tenant access control)';
PRINT '- ProjectAccess table (Project-level permissions)';
PRINT 'Ready for business data layer creation.';
PRINT '';
