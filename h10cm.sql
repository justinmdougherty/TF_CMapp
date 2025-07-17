-- =============================================
-- H10CM Complete Database Creation Script
-- Production Management & Inventory Tracking with Multi-Tenant RBAC
-- 
-- Features Supported:
-- - Multi-Tenant Role-Based Access Control (RBAC)
-- - Program-level user segmentation (Aerospace, Manufacturing, etc.)
-- - Project-level granular permissions
-- - Task Assignment Workflow
-- - Smart Notifications System
-- - Certificate-based user authentication
-- - Comprehensive audit trail
-- 
-- Created: July 13, 2025
-- =============================================

USE [master]
GO

-- Drop database if exists (for clean recreation)
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'H10CM')
BEGIN
    ALTER DATABASE [H10CM] SET SINGLE_USER WITH ROLLBACK IMMEDIATE
    DROP DATABASE [H10CM]
END
GO

-- Create Database
CREATE DATABASE [H10CM]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'H10CM', FILENAME = N'/var/opt/mssql/data/H10CM.mdf' , SIZE = 8192KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'H10CM_log', FILENAME = N'/var/opt/mssql/data/H10CM_log.ldf' , SIZE = 8192KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
 WITH CATALOG_COLLATION = DATABASE_DEFAULT
GO

-- Configure Database Settings
ALTER DATABASE [H10CM] SET COMPATIBILITY_LEVEL = 150
GO

IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [H10CM].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO

ALTER DATABASE [H10CM] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [H10CM] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [H10CM] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [H10CM] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [H10CM] SET ARITHABORT OFF 
GO
ALTER DATABASE [H10CM] SET AUTO_CLOSE OFF 
GO
ALTER DATABASE [H10CM] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [H10CM] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [H10CM] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [H10CM] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [H10CM] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [H10CM] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [H10CM] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [H10CM] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [H10CM] SET  ENABLE_BROKER 
GO
ALTER DATABASE [H10CM] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [H10CM] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [H10CM] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [H10CM] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [H10CM] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [H10CM] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [H10CM] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [H10CM] SET RECOVERY FULL 
GO
ALTER DATABASE [H10CM] SET  MULTI_USER 
GO
ALTER DATABASE [H10CM] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [H10CM] SET DB_CHAINING OFF 
GO
ALTER DATABASE [H10CM] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [H10CM] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [H10CM] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [H10CM] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO

EXEC sys.sp_db_vardecimal_storage_format N'H10CM', N'ON'
GO
ALTER DATABASE [H10CM] SET QUERY_STORE = OFF
GO

USE [H10CM]
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

-- Programs Table (Multi-Tenant Segmentation)
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
) ON [PRIMARY]
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
) ON [PRIMARY]
GO

-- Roles Table (Role Definitions)
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
) ON [PRIMARY]
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
) ON [PRIMARY]
GO

-- ProgramAccess Table (User Program Permissions)
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
) ON [PRIMARY]
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
) ON [PRIMARY]
GO

-- =============================================
-- CORE BUSINESS TABLES (MODIFIED WITH RBAC)
-- =============================================

-- Projects Table (Modified to include Program relationship)
CREATE TABLE [dbo].[Projects](
    [project_id] [int] IDENTITY(1,1) NOT NULL,
    [program_id] [int] NOT NULL,
    [project_name] [nvarchar](100) NOT NULL,
    [project_description] [nvarchar](max) NULL,
    [status] [nvarchar](50) NULL DEFAULT 'Planning', -- 'Active', 'Planning', 'Completed', 'On Hold', 'Inactive', 'Archived'
    [priority] [nvarchar](20) NULL DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
    [project_manager_id] [int] NULL,
    [date_created] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [last_modified] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [created_by] [int] NULL,
    [project_start_date] [date] NULL,
    [project_end_date] [date] NULL,
    [estimated_completion_date] [date] NULL,
    [actual_completion_date] [date] NULL,
    [budget] [decimal](18, 2) NULL,
    [notes] [nvarchar](max) NULL,
    CONSTRAINT [PK_Projects] PRIMARY KEY CLUSTERED ([project_id]),
    CONSTRAINT [UQ_Projects_Name_Program] UNIQUE ([program_id], [project_name]),
    CONSTRAINT [CK_Projects_Status] CHECK ([status] IN ('Active', 'Planning', 'Completed', 'On Hold', 'Inactive', 'Archived')),
    CONSTRAINT [CK_Projects_Priority] CHECK ([priority] IN ('Low', 'Medium', 'High', 'Critical'))
) ON [PRIMARY]
GO

-- InventoryItems Table (Enhanced)
CREATE TABLE [dbo].[InventoryItems](
    [inventory_item_id] [int] IDENTITY(1,1) NOT NULL,
    [item_name] [nvarchar](255) NOT NULL,
    [part_number] [nvarchar](100) NULL,
    [description] [nvarchar](max) NULL,
    [category] [nvarchar](100) NULL,
    [unit_of_measure] [nvarchar](50) NOT NULL,
    [current_stock_level] [decimal](18, 4) NOT NULL DEFAULT 0,
    [reorder_point] [decimal](18, 4) NULL,
    [max_stock_level] [decimal](18, 4) NULL,
    [supplier_info] [nvarchar](max) NULL,
    [cost_per_unit] [decimal](18, 2) NULL,
    [last_cost_update] [datetime2](7) NULL,
    [location] [nvarchar](255) NULL,
    [is_active] [bit] NOT NULL DEFAULT 1,
    [date_created] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [last_modified] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [created_by] [int] NULL,
    [program_id] [int] NULL, -- Added program_id for multi-tenant segmentation
    CONSTRAINT [PK_InventoryItems] PRIMARY KEY CLUSTERED ([inventory_item_id]),
    CONSTRAINT [UQ_InventoryItems_PartNumber] UNIQUE ([part_number])
) ON [PRIMARY]
GO

-- Tasks Table (Task Assignment Workflow)
CREATE TABLE [dbo].[Tasks](
    [task_id] [int] IDENTITY(1,1) NOT NULL,
    [project_id] [int] NULL,
    [step_id] [int] NULL,
    [tracked_item_id] [int] NULL,
    [task_title] [nvarchar](255) NOT NULL,
    [task_description] [nvarchar](max) NULL,
    [assigned_to] [int] NOT NULL,
    [assigned_by] [int] NOT NULL,
    [priority] [nvarchar](20) NOT NULL DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
    [status] [nvarchar](50) NOT NULL DEFAULT 'Pending', -- 'Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled'
    [due_date] [datetime2](7) NULL,
    [estimated_hours] [decimal](5, 2) NULL,
    [actual_hours] [decimal](5, 2) NULL,
    [completion_percentage] [int] NOT NULL DEFAULT 0,
    [date_created] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [date_started] [datetime2](7) NULL,
    [date_completed] [datetime2](7) NULL,
    [last_modified] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [notes] [nvarchar](max) NULL,
    CONSTRAINT [PK_Tasks] PRIMARY KEY CLUSTERED ([task_id]),
    CONSTRAINT [CK_Tasks_Priority] CHECK ([priority] IN ('Low', 'Medium', 'High', 'Critical')),
    CONSTRAINT [CK_Tasks_Status] CHECK ([status] IN ('Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled')),
    CONSTRAINT [CK_Tasks_Percentage] CHECK ([completion_percentage] >= 0 AND [completion_percentage] <= 100)
) ON [PRIMARY]
GO

-- Notifications Table (Smart Notifications System)
CREATE TABLE [dbo].[Notifications](
    [notification_id] [int] IDENTITY(1,1) NOT NULL,
    [user_id] [int] NOT NULL,
    [category] [nvarchar](50) NOT NULL, -- 'inventory', 'orders', 'production', 'quality', 'system', 'user', 'deadlines', 'approvals'
    [title] [nvarchar](255) NOT NULL,
    [message] [nvarchar](max) NOT NULL,
    [priority] [nvarchar](20) NOT NULL DEFAULT 'Normal', -- 'Low', 'Normal', 'High', 'Critical'
    [is_read] [bit] NOT NULL DEFAULT 0,
    [is_actionable] [bit] NOT NULL DEFAULT 0,
    [action_url] [nvarchar](500) NULL,
    [action_text] [nvarchar](100) NULL,
    [metadata] [nvarchar](max) NULL, -- JSON for additional data
    [related_entity_type] [nvarchar](50) NULL, -- 'Task', 'Project', 'Inventory', etc.
    [related_entity_id] [int] NULL,
    [date_created] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [date_read] [datetime2](7) NULL,
    [expires_at] [datetime2](7) NULL,
    CONSTRAINT [PK_Notifications] PRIMARY KEY CLUSTERED ([notification_id]),
    CONSTRAINT [CK_Notifications_Category] CHECK ([category] IN ('inventory', 'orders', 'production', 'quality', 'system', 'user', 'deadlines', 'approvals')),
    CONSTRAINT [CK_Notifications_Priority] CHECK ([priority] IN ('Low', 'Normal', 'High', 'Critical'))
) ON [PRIMARY]
GO

-- AuditLog Table (Complete Access and Change Tracking)
CREATE TABLE [dbo].[AuditLog](
    [audit_id] [int] IDENTITY(1,1) NOT NULL,
    [user_id] [int] NULL,
    [action_type] [nvarchar](50) NOT NULL, -- 'Create', 'Update', 'Delete', 'Login', 'Access', 'Permission'
    [entity_type] [nvarchar](50) NOT NULL, -- 'Project', 'Task', 'User', 'Role', etc.
    [entity_id] [int] NULL,
    [old_values] [nvarchar](max) NULL, -- JSON
    [new_values] [nvarchar](max) NULL, -- JSON
    [ip_address] [nvarchar](45) NULL,
    [user_agent] [nvarchar](500) NULL,
    [session_id] [nvarchar](100) NULL,
    [date_created] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [description] [nvarchar](max) NULL,
    CONSTRAINT [PK_AuditLog] PRIMARY KEY CLUSTERED ([audit_id])
) ON [PRIMARY]
GO

-- =============================================
-- REMAINING CORE TABLES (FROM ORIGINAL SCHEMA)
-- =============================================

-- AttributeDefinitions Table
CREATE TABLE [dbo].[AttributeDefinitions](
    [attribute_definition_id] [int] IDENTITY(1,1) NOT NULL,
    [project_id] [int] NOT NULL,
    [attribute_name] [nvarchar](255) NOT NULL,
    [attribute_type] [nvarchar](50) NOT NULL,
    [display_order] [int] NOT NULL,
    [is_required] [bit] NOT NULL,
    [default_value] [nvarchar](max) NULL,
    [validation_rules] [nvarchar](max) NULL, -- JSON
    CONSTRAINT [PK_AttributeDefinitions] PRIMARY KEY CLUSTERED ([attribute_definition_id]),
    CONSTRAINT [UQ_AttributeDefinitions_ProjectAttribute] UNIQUE ([project_id], [attribute_name])
) ON [PRIMARY]
GO

-- ProjectSteps Table
CREATE TABLE [dbo].[ProjectSteps](
    [step_id] [int] IDENTITY(1,1) NOT NULL,
    [project_id] [int] NOT NULL,
    [step_code] [nvarchar](100) NULL,
    [step_name] [nvarchar](255) NOT NULL,
    [step_description] [nvarchar](max) NULL,
    [step_order] [int] NOT NULL,
    [estimated_duration_hours] [decimal](8, 2) NULL,
    [is_quality_control] [bit] NOT NULL DEFAULT 0,
    [requires_approval] [bit] NOT NULL DEFAULT 0,
    [approval_role] [nvarchar](100) NULL,
    CONSTRAINT [PK_ProjectSteps] PRIMARY KEY CLUSTERED ([step_id]),
    CONSTRAINT [UQ_ProjectSteps_CodeAllowNull] UNIQUE ([project_id], [step_code]),
    CONSTRAINT [UQ_ProjectSteps_Order] UNIQUE ([project_id], [step_order])
) ON [PRIMARY]
GO

-- StepInventoryRequirements Table
CREATE TABLE [dbo].[StepInventoryRequirements](
    [requirement_id] [int] IDENTITY(1,1) NOT NULL,
    [step_id] [int] NOT NULL,
    [inventory_item_id] [int] NOT NULL,
    [quantity_required] [decimal](18, 4) NOT NULL,
    [is_consumed] [bit] NOT NULL DEFAULT 1, -- Whether item is consumed or just used
    CONSTRAINT [PK_StepInventoryRequirements] PRIMARY KEY CLUSTERED ([requirement_id]),
    CONSTRAINT [UQ_StepInventoryRequirements_StepItem] UNIQUE ([step_id], [inventory_item_id])
) ON [PRIMARY]
GO

-- TrackedItems Table
CREATE TABLE [dbo].[TrackedItems](
    [item_id] [int] IDENTITY(1,1) NOT NULL,
    [project_id] [int] NOT NULL,
    [item_identifier] [nvarchar](100) NULL,
    [current_overall_status] [nvarchar](50) NOT NULL DEFAULT 'Pending',
    [is_shipped] [bit] NOT NULL DEFAULT 0,
    [shipped_date] [datetime2](7) NULL,
    [date_fully_completed] [datetime2](7) NULL,
    [date_created] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [last_modified] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [created_by] [int] NULL,
    [notes] [nvarchar](max) NULL,
    CONSTRAINT [PK_TrackedItems] PRIMARY KEY CLUSTERED ([item_id])
) ON [PRIMARY]
GO

-- ItemAttributeValues Table
CREATE TABLE [dbo].[ItemAttributeValues](
    [value_id] [int] IDENTITY(1,1) NOT NULL,
    [item_id] [int] NOT NULL,
    [attribute_definition_id] [int] NOT NULL,
    [attribute_value] [nvarchar](max) NULL,
    [date_set] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [set_by] [int] NULL,
    CONSTRAINT [PK_ItemAttributeValues] PRIMARY KEY CLUSTERED ([value_id]),
    CONSTRAINT [UQ_ItemAttributeValues_ItemAttribute] UNIQUE ([item_id], [attribute_definition_id])
) ON [PRIMARY]
GO

-- TrackedItemStepProgress Table
CREATE TABLE [dbo].[TrackedItemStepProgress](
    [item_step_progress_id] [int] IDENTITY(1,1) NOT NULL,
    [item_id] [int] NOT NULL,
    [step_id] [int] NOT NULL,
    [status] [nvarchar](50) NOT NULL DEFAULT 'Not Started',
    [assigned_to] [int] NULL,
    [date_started] [datetime2](7) NULL,
    [date_completed] [datetime2](7) NULL,
    [actual_duration_hours] [decimal](8, 2) NULL,
    [quality_check_passed] [bit] NULL,
    [approved_by] [int] NULL,
    [approval_date] [datetime2](7) NULL,
    [notes] [nvarchar](max) NULL,
    CONSTRAINT [PK_TrackedItemStepProgress] PRIMARY KEY CLUSTERED ([item_step_progress_id]),
    CONSTRAINT [UQ_TrackedItemStepProgress_ItemStep] UNIQUE ([item_id], [step_id])
) ON [PRIMARY]
GO

-- InventoryTransactions Table
CREATE TABLE [dbo].[InventoryTransactions](
    [transaction_id] [int] IDENTITY(1,1) NOT NULL,
    [inventory_item_id] [int] NOT NULL,
    [transaction_type] [nvarchar](50) NOT NULL, -- 'Adjustment', 'Usage', 'Receipt', 'Transfer'
    [quantity_changed] [decimal](18, 4) NOT NULL,
    [quantity_before] [decimal](18, 4) NOT NULL,
    [quantity_after] [decimal](18, 4) NOT NULL,
    [unit_cost] [decimal](18, 2) NULL,
    [transaction_timestamp] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [user_id] [int] NULL,
    [step_id] [int] NULL,
    [tracked_item_id] [int] NULL,
    [purchase_order] [nvarchar](100) NULL,
    [reason_code] [nvarchar](50) NULL,
    [notes] [nvarchar](max) NULL,
    CONSTRAINT [PK_InventoryTransactions] PRIMARY KEY CLUSTERED ([transaction_id]),
    CONSTRAINT [CK_InventoryTransactions_Type] CHECK ([transaction_type] IN ('Adjustment', 'Usage', 'Receipt', 'Transfer'))
) ON [PRIMARY]
GO

-- =============================================
-- PROCUREMENT & SHOPPING CART TABLES
-- =============================================

-- CartItems Table (Shopping Cart for Procurement)
CREATE TABLE [dbo].[CartItems](
    [cart_id] [int] IDENTITY(1,1) NOT NULL,
    [user_id] [int] NOT NULL,
    [inventory_item_id] [int] NOT NULL,
    [quantity_requested] [decimal](18, 4) NOT NULL,
    [estimated_cost] [decimal](18, 2) NULL,
    [notes] [nvarchar](max) NULL,
    [date_added] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [last_modified] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_CartItems] PRIMARY KEY CLUSTERED ([cart_id]),
    CONSTRAINT [CK_CartItems_Quantity] CHECK ([quantity_requested] > 0)
) ON [PRIMARY]
GO

-- PendingOrders Table (Orders created from shopping cart)
CREATE TABLE [dbo].[PendingOrders](
    [order_id] [int] IDENTITY(1,1) NOT NULL,
    [order_number] [nvarchar](50) NOT NULL,
    [user_id] [int] NOT NULL,
    [project_id] [int] NOT NULL,
    [status] [nvarchar](50) NOT NULL DEFAULT 'Pending',
    [total_estimated_cost] [decimal](18, 2) NULL,
    [supplier_info] [nvarchar](max) NULL,
    [order_notes] [nvarchar](max) NULL,
    [date_created] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [date_approved] [datetime2](7) NULL,
    [approved_by] [int] NULL,
    [date_ordered] [datetime2](7) NULL,
    [ordered_by] [int] NULL,
    [expected_delivery_date] [datetime2](7) NULL,
    [actual_delivery_date] [datetime2](7) NULL,
    [last_modified] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_PendingOrders] PRIMARY KEY CLUSTERED ([order_id]),
    CONSTRAINT [UQ_PendingOrders_OrderNumber] UNIQUE ([order_number]),
    CONSTRAINT [CK_PendingOrders_Status] CHECK ([status] IN ('Pending', 'Approved', 'Ordered', 'Received', 'Cancelled'))
) ON [PRIMARY]
GO

-- PendingOrderItems Table (Line items for pending orders)
CREATE TABLE [dbo].[PendingOrderItems](
    [order_item_id] [int] IDENTITY(1,1) NOT NULL,
    [order_id] [int] NOT NULL,
    [inventory_item_id] [int] NOT NULL,
    [quantity_ordered] [decimal](18, 4) NOT NULL,
    [unit_cost] [decimal](18, 2) NULL,
    [total_cost] [decimal](18, 2) NULL,
    [quantity_received] [decimal](18, 4) NULL DEFAULT 0,
    [notes] [nvarchar](max) NULL,
    [date_added] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_PendingOrderItems] PRIMARY KEY CLUSTERED ([order_item_id]),
    CONSTRAINT [UQ_PendingOrderItems_OrderItem] UNIQUE ([order_id], [inventory_item_id]),
    CONSTRAINT [CK_PendingOrderItems_Quantity] CHECK ([quantity_ordered] > 0),
    CONSTRAINT [CK_PendingOrderItems_Received] CHECK ([quantity_received] >= 0)
) ON [PRIMARY]
GO

-- =============================================
-- PROCUREMENT & FUNDING MANAGEMENT TABLES
-- =============================================

-- Sponsors Table (Organizations providing funding)
CREATE TABLE [dbo].[Sponsors] (
    [sponsor_id] [int] IDENTITY(1,1) NOT NULL,
    [program_id] [int] NOT NULL,
    [sponsor_name] [nvarchar](255) NOT NULL,
    [sponsor_code] [nvarchar](50) NOT NULL,
    [organization_type] [nvarchar](100) NULL, -- Government, Commercial, Internal, etc.
    [primary_contact_name] [nvarchar](255) NULL,
    [primary_contact_email] [nvarchar](255) NULL,
    [primary_contact_phone] [nvarchar](50) NULL,
    [billing_address] [nvarchar](max) NULL,
    [tax_id] [nvarchar](50) NULL,
    [payment_terms] [nvarchar](255) NULL,
    [status] [nvarchar](50) NOT NULL DEFAULT 'Active',
    [notes] [nvarchar](max) NULL,
    [created_by] [int] NOT NULL,
    [created_date] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [last_modified] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_Sponsors] PRIMARY KEY CLUSTERED ([sponsor_id]),
    CONSTRAINT [FK_Sponsors_Program] FOREIGN KEY ([program_id]) REFERENCES [dbo].[Programs]([program_id]),
    CONSTRAINT [FK_Sponsors_CreatedBy] FOREIGN KEY ([created_by]) REFERENCES [dbo].[Users]([user_id]),
    CONSTRAINT [UQ_Sponsors_Code] UNIQUE ([program_id], [sponsor_code]),
    CONSTRAINT [CK_Sponsors_Status] CHECK ([status] IN ('Active', 'Inactive', 'Suspended'))
) ON [PRIMARY]
GO

-- SponsorFunds Table (Specific funding sources/accounts)
CREATE TABLE [dbo].[SponsorFunds] (
    [fund_id] [int] IDENTITY(1,1) NOT NULL,
    [sponsor_id] [int] NOT NULL,
    [fund_name] [nvarchar](255) NOT NULL,
    [fund_code] [nvarchar](50) NOT NULL,
    [fund_type] [nvarchar](100) NOT NULL, -- Contract, Grant, Internal, Emergency, etc.
    [total_amount] [decimal](18, 2) NOT NULL,
    [allocated_amount] [decimal](18, 2) NOT NULL DEFAULT 0,
    [spent_amount] [decimal](18, 2) NOT NULL DEFAULT 0,
    [remaining_amount] AS ([total_amount] - [allocated_amount]) PERSISTED,
    [effective_date] [datetime2](7) NOT NULL,
    [expiration_date] [datetime2](7) NULL,
    [funding_document_id] [int] NULL,
    [approval_status] [nvarchar](50) NOT NULL DEFAULT 'Pending',
    [approved_by] [int] NULL,
    [approved_date] [datetime2](7) NULL,
    [status] [nvarchar](50) NOT NULL DEFAULT 'Active',
    [restrictions] [nvarchar](max) NULL, -- JSON or text describing usage restrictions
    [reporting_requirements] [nvarchar](max) NULL,
    [notes] [nvarchar](max) NULL,
    [created_by] [int] NOT NULL,
    [created_date] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [last_modified] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_SponsorFunds] PRIMARY KEY CLUSTERED ([fund_id]),
    CONSTRAINT [FK_SponsorFunds_Sponsor] FOREIGN KEY ([sponsor_id]) REFERENCES [dbo].[Sponsors]([sponsor_id]),
    CONSTRAINT [FK_SponsorFunds_ApprovedBy] FOREIGN KEY ([approved_by]) REFERENCES [dbo].[Users]([user_id]),
    CONSTRAINT [FK_SponsorFunds_CreatedBy] FOREIGN KEY ([created_by]) REFERENCES [dbo].[Users]([user_id]),
    CONSTRAINT [UQ_SponsorFunds_Code] UNIQUE ([sponsor_id], [fund_code]),
    CONSTRAINT [CK_SponsorFunds_Status] CHECK ([status] IN ('Active', 'Inactive', 'Expired', 'Exhausted')),
    CONSTRAINT [CK_SponsorFunds_Approval] CHECK ([approval_status] IN ('Pending', 'Approved', 'Rejected')),
    CONSTRAINT [CK_SponsorFunds_Amounts] CHECK ([total_amount] >= 0 AND [allocated_amount] >= 0 AND [spent_amount] >= 0),
    CONSTRAINT [CK_SponsorFunds_Dates] CHECK ([effective_date] <= [expiration_date] OR [expiration_date] IS NULL)
) ON [PRIMARY]
GO

-- FundingDocuments Table (Contracts, agreements, documentation)
CREATE TABLE [dbo].[FundingDocuments] (
    [document_id] [int] IDENTITY(1,1) NOT NULL,
    [fund_id] [int] NULL,
    [sponsor_id] [int] NOT NULL,
    [document_type] [nvarchar](100) NOT NULL, -- Contract, Grant Agreement, Amendment, etc.
    [document_number] [nvarchar](100) NOT NULL,
    [document_title] [nvarchar](255) NOT NULL,
    [document_description] [nvarchar](max) NULL,
    [file_path] [nvarchar](500) NULL,
    [file_name] [nvarchar](255) NULL,
    [file_size] [bigint] NULL,
    [mime_type] [nvarchar](100) NULL,
    [effective_date] [datetime2](7) NOT NULL,
    [expiration_date] [datetime2](7) NULL,
    [renewal_date] [datetime2](7) NULL,
    [status] [nvarchar](50) NOT NULL DEFAULT 'Active',
    [version] [nvarchar](20) NOT NULL DEFAULT '1.0',
    [parent_document_id] [int] NULL, -- For amendments and revisions
    [compliance_requirements] [nvarchar](max) NULL,
    [reporting_schedule] [nvarchar](max) NULL,
    [key_terms] [nvarchar](max) NULL, -- JSON or structured text
    [uploaded_by] [int] NOT NULL,
    [uploaded_date] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [last_modified] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_FundingDocuments] PRIMARY KEY CLUSTERED ([document_id]),
    CONSTRAINT [FK_FundingDocuments_Fund] FOREIGN KEY ([fund_id]) REFERENCES [dbo].[SponsorFunds]([fund_id]),
    CONSTRAINT [FK_FundingDocuments_Sponsor] FOREIGN KEY ([sponsor_id]) REFERENCES [dbo].[Sponsors]([sponsor_id]),
    CONSTRAINT [FK_FundingDocuments_Parent] FOREIGN KEY ([parent_document_id]) REFERENCES [dbo].[FundingDocuments]([document_id]),
    CONSTRAINT [FK_FundingDocuments_UploadedBy] FOREIGN KEY ([uploaded_by]) REFERENCES [dbo].[Users]([user_id]),
    CONSTRAINT [UQ_FundingDocuments_Number] UNIQUE ([sponsor_id], [document_number]),
    CONSTRAINT [CK_FundingDocuments_Status] CHECK ([status] IN ('Active', 'Inactive', 'Expired', 'Superseded')),
    CONSTRAINT [CK_FundingDocuments_Dates] CHECK ([effective_date] <= [expiration_date] OR [expiration_date] IS NULL)
) ON [PRIMARY]
GO

-- Add foreign key reference from SponsorFunds to FundingDocuments
ALTER TABLE [dbo].[SponsorFunds] 
ADD CONSTRAINT [FK_SponsorFunds_Document] FOREIGN KEY ([funding_document_id]) REFERENCES [dbo].[FundingDocuments]([document_id])
GO

-- TaskFundAllocations Table (Allocate funds to specific tasks)
CREATE TABLE [dbo].[TaskFundAllocations] (
    [allocation_id] [int] IDENTITY(1,1) NOT NULL,
    [task_id] [int] NOT NULL,
    [fund_id] [int] NOT NULL,
    [allocation_amount] [decimal](18, 2) NOT NULL,
    [spent_amount] [decimal](18, 2) NOT NULL DEFAULT 0,
    [remaining_amount] AS ([allocation_amount] - [spent_amount]) PERSISTED,
    [allocation_date] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [expiration_date] [datetime2](7) NULL,
    [status] [nvarchar](50) NOT NULL DEFAULT 'Active',
    [is_cross_payment] [bit] NOT NULL DEFAULT 0, -- Indicates if this is a cross-sponsor payment
    [cross_payment_sponsor_id] [int] NULL, -- Which sponsor is being paid back
    [cross_payment_reference] [nvarchar](100) NULL,
    [purpose] [nvarchar](255) NOT NULL,
    [justification] [nvarchar](max) NULL,
    [approval_status] [nvarchar](50) NOT NULL DEFAULT 'Approved',
    [approved_by] [int] NULL,
    [approved_date] [datetime2](7) NULL,
    [notes] [nvarchar](max) NULL,
    [created_by] [int] NOT NULL,
    [created_date] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [last_modified] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_TaskFundAllocations] PRIMARY KEY CLUSTERED ([allocation_id]),
    CONSTRAINT [FK_TaskFundAllocations_Task] FOREIGN KEY ([task_id]) REFERENCES [dbo].[Tasks]([task_id]),
    CONSTRAINT [FK_TaskFundAllocations_Fund] FOREIGN KEY ([fund_id]) REFERENCES [dbo].[SponsorFunds]([fund_id]),
    CONSTRAINT [FK_TaskFundAllocations_CrossPaymentSponsor] FOREIGN KEY ([cross_payment_sponsor_id]) REFERENCES [dbo].[Sponsors]([sponsor_id]),
    CONSTRAINT [FK_TaskFundAllocations_ApprovedBy] FOREIGN KEY ([approved_by]) REFERENCES [dbo].[Users]([user_id]),
    CONSTRAINT [FK_TaskFundAllocations_CreatedBy] FOREIGN KEY ([created_by]) REFERENCES [dbo].[Users]([user_id]),
    CONSTRAINT [UQ_TaskFundAllocations_TaskFund] UNIQUE ([task_id], [fund_id]),
    CONSTRAINT [CK_TaskFundAllocations_Status] CHECK ([status] IN ('Active', 'Inactive', 'Expired', 'Exhausted')),
    CONSTRAINT [CK_TaskFundAllocations_Approval] CHECK ([approval_status] IN ('Pending', 'Approved', 'Rejected')),
    CONSTRAINT [CK_TaskFundAllocations_Amounts] CHECK ([allocation_amount] > 0 AND [spent_amount] >= 0),
    CONSTRAINT [CK_TaskFundAllocations_CrossPayment] CHECK (([is_cross_payment] = 0) OR ([is_cross_payment] = 1 AND [cross_payment_sponsor_id] IS NOT NULL))
) ON [PRIMARY]
GO

-- OrderFundAllocations Table (Allocate funds to procurement orders)
CREATE TABLE [dbo].[OrderFundAllocations] (
    [allocation_id] [int] IDENTITY(1,1) NOT NULL,
    [order_id] [int] NOT NULL,
    [fund_id] [int] NOT NULL,
    [allocation_amount] [decimal](18, 2) NOT NULL,
    [percentage] [decimal](5, 2) NULL, -- Percentage of order total
    [status] [nvarchar](50) NOT NULL DEFAULT 'Active',
    [created_by] [int] NOT NULL,
    [created_date] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [last_modified] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_OrderFundAllocations] PRIMARY KEY CLUSTERED ([allocation_id]),
    CONSTRAINT [FK_OrderFundAllocations_Order] FOREIGN KEY ([order_id]) REFERENCES [dbo].[PendingOrders]([order_id]),
    CONSTRAINT [FK_OrderFundAllocations_Fund] FOREIGN KEY ([fund_id]) REFERENCES [dbo].[SponsorFunds]([fund_id]),
    CONSTRAINT [FK_OrderFundAllocations_CreatedBy] FOREIGN KEY ([created_by]) REFERENCES [dbo].[Users]([user_id]),
    CONSTRAINT [UQ_OrderFundAllocations_OrderFund] UNIQUE ([order_id], [fund_id]),
    CONSTRAINT [CK_OrderFundAllocations_Status] CHECK ([status] IN ('Active', 'Inactive', 'Cancelled')),
    CONSTRAINT [CK_OrderFundAllocations_Amounts] CHECK ([allocation_amount] > 0),
    CONSTRAINT [CK_OrderFundAllocations_Percentage] CHECK ([percentage] IS NULL OR ([percentage] >= 0 AND [percentage] <= 100))
) ON [PRIMARY]
GO

-- ProcurementVendors Table (Vendor management)
CREATE TABLE [dbo].[ProcurementVendors] (
    [vendor_id] [int] IDENTITY(1,1) NOT NULL,
    [program_id] [int] NOT NULL,
    [vendor_name] [nvarchar](255) NOT NULL,
    [vendor_code] [nvarchar](50) NOT NULL,
    [vendor_type] [nvarchar](100) NULL, -- Supplier, Contractor, Service Provider, etc.
    [primary_contact_name] [nvarchar](255) NULL,
    [primary_contact_email] [nvarchar](255) NULL,
    [primary_contact_phone] [nvarchar](50) NULL,
    [billing_address] [nvarchar](max) NULL,
    [shipping_address] [nvarchar](max) NULL,
    [tax_id] [nvarchar](50) NULL,
    [payment_terms] [nvarchar](255) NULL,
    [preferred_payment_method] [nvarchar](100) NULL,
    [credit_limit] [decimal](18, 2) NULL,
    [performance_rating] [decimal](3, 2) NULL, -- 1.00 to 5.00
    [certification_requirements] [nvarchar](max) NULL,
    [capabilities] [nvarchar](max) NULL,
    [status] [nvarchar](50) NOT NULL DEFAULT 'Active',
    [notes] [nvarchar](max) NULL,
    [created_by] [int] NOT NULL,
    [created_date] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [last_modified] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_ProcurementVendors] PRIMARY KEY CLUSTERED ([vendor_id]),
    CONSTRAINT [FK_ProcurementVendors_Program] FOREIGN KEY ([program_id]) REFERENCES [dbo].[Programs]([program_id]),
    CONSTRAINT [FK_ProcurementVendors_CreatedBy] FOREIGN KEY ([created_by]) REFERENCES [dbo].[Users]([user_id]),
    CONSTRAINT [UQ_ProcurementVendors_Code] UNIQUE ([program_id], [vendor_code]),
    CONSTRAINT [CK_ProcurementVendors_Status] CHECK ([status] IN ('Active', 'Inactive', 'Suspended', 'Blacklisted')),
    CONSTRAINT [CK_ProcurementVendors_Rating] CHECK ([performance_rating] IS NULL OR ([performance_rating] >= 1.0 AND [performance_rating] <= 5.0))
) ON [PRIMARY]
GO

-- ProcurementNotifications Table (Procurement-specific notifications)
CREATE TABLE [dbo].[ProcurementNotifications] (
    [notification_id] [int] IDENTITY(1,1) NOT NULL,
    [user_id] [int] NOT NULL,
    [notification_type] [nvarchar](100) NOT NULL, -- Fund Expiring, Order Approved, Payment Required, etc.
    [priority] [nvarchar](20) NOT NULL DEFAULT 'Medium',
    [title] [nvarchar](255) NOT NULL,
    [message] [nvarchar](max) NOT NULL,
    [related_entity_type] [nvarchar](100) NULL, -- Fund, Order, Task, Document, etc.
    [related_entity_id] [int] NULL,
    [action_required] [bit] NOT NULL DEFAULT 0,
    [action_url] [nvarchar](500) NULL,
    [status] [nvarchar](50) NOT NULL DEFAULT 'Unread',
    [read_date] [datetime2](7) NULL,
    [acknowledged_date] [datetime2](7) NULL,
    [expiration_date] [datetime2](7) NULL,
    [metadata] [nvarchar](max) NULL, -- JSON for additional data
    [created_date] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_ProcurementNotifications] PRIMARY KEY CLUSTERED ([notification_id]),
    CONSTRAINT [FK_ProcurementNotifications_User] FOREIGN KEY ([user_id]) REFERENCES [dbo].[Users]([user_id]),
    CONSTRAINT [CK_ProcurementNotifications_Priority] CHECK ([priority] IN ('Low', 'Medium', 'High', 'Critical')),
    CONSTRAINT [CK_ProcurementNotifications_Status] CHECK ([status] IN ('Unread', 'Read', 'Acknowledged', 'Dismissed'))
) ON [PRIMARY]
GO

-- ProcurementAuditLog Table (Audit trail for fund transactions)
CREATE TABLE [dbo].[ProcurementAuditLog] (
    [audit_id] [int] IDENTITY(1,1) NOT NULL,
    [user_id] [int] NOT NULL,
    [action_type] [nvarchar](100) NOT NULL, -- CREATE, UPDATE, DELETE, ALLOCATE, SPEND, TRANSFER, etc.
    [entity_type] [nvarchar](100) NOT NULL, -- Sponsor, Fund, Task, Order, Document, etc.
    [entity_id] [int] NOT NULL,
    [old_values] [nvarchar](max) NULL, -- JSON of previous values
    [new_values] [nvarchar](max) NULL, -- JSON of new values
    [amount_involved] [decimal](18, 2) NULL,
    [description] [nvarchar](255) NOT NULL,
    [ip_address] [nvarchar](45) NULL,
    [user_agent] [nvarchar](500) NULL,
    [session_id] [nvarchar](100) NULL,
    [timestamp] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_ProcurementAuditLog] PRIMARY KEY CLUSTERED ([audit_id]),
    CONSTRAINT [FK_ProcurementAuditLog_User] FOREIGN KEY ([user_id]) REFERENCES [dbo].[Users]([user_id])
) ON [PRIMARY]
GO

-- Add indexes for better performance
CREATE INDEX [IX_Sponsors_Program] ON [dbo].[Sponsors]([program_id]);
CREATE INDEX [IX_SponsorFunds_Sponsor] ON [dbo].[SponsorFunds]([sponsor_id]);
CREATE INDEX [IX_SponsorFunds_Status] ON [dbo].[SponsorFunds]([status]);
CREATE INDEX [IX_SponsorFunds_ExpirationDate] ON [dbo].[SponsorFunds]([expiration_date]);
CREATE INDEX [IX_FundingDocuments_Fund] ON [dbo].[FundingDocuments]([fund_id]);
CREATE INDEX [IX_FundingDocuments_Sponsor] ON [dbo].[FundingDocuments]([sponsor_id]);
CREATE INDEX [IX_FundingDocuments_ExpirationDate] ON [dbo].[FundingDocuments]([expiration_date]);
CREATE INDEX [IX_TaskFundAllocations_Task] ON [dbo].[TaskFundAllocations]([task_id]);
CREATE INDEX [IX_TaskFundAllocations_Fund] ON [dbo].[TaskFundAllocations]([fund_id]);
CREATE INDEX [IX_TaskFundAllocations_CrossPayment] ON [dbo].[TaskFundAllocations]([is_cross_payment]);
CREATE INDEX [IX_OrderFundAllocations_Order] ON [dbo].[OrderFundAllocations]([order_id]);
CREATE INDEX [IX_OrderFundAllocations_Fund] ON [dbo].[OrderFundAllocations]([fund_id]);
CREATE INDEX [IX_ProcurementVendors_Program] ON [dbo].[ProcurementVendors]([program_id]);
CREATE INDEX [IX_ProcurementNotifications_User] ON [dbo].[ProcurementNotifications]([user_id]);
CREATE INDEX [IX_ProcurementNotifications_Status] ON [dbo].[ProcurementNotifications]([status]);
CREATE INDEX [IX_ProcurementAuditLog_User] ON [dbo].[ProcurementAuditLog]([user_id]);
CREATE INDEX [IX_ProcurementAuditLog_EntityType] ON [dbo].[ProcurementAuditLog]([entity_type], [entity_id]);
CREATE INDEX [IX_ProcurementAuditLog_Timestamp] ON [dbo].[ProcurementAuditLog]([timestamp]);
GO

-- =============================================
-- PROCUREMENT STORED PROCEDURES
-- =============================================

-- Create or update sponsor
CREATE PROCEDURE [dbo].[usp_SaveSponsor]
    @SponsorJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @program_id INT = JSON_VALUE(@SponsorJson, '$.program_id');
    DECLARE @sponsor_id INT = JSON_VALUE(@SponsorJson, '$.sponsor_id');
    DECLARE @sponsor_name NVARCHAR(255) = JSON_VALUE(@SponsorJson, '$.sponsor_name');
    DECLARE @sponsor_code NVARCHAR(50) = JSON_VALUE(@SponsorJson, '$.sponsor_code');
    DECLARE @organization_type NVARCHAR(100) = JSON_VALUE(@SponsorJson, '$.organization_type');
    DECLARE @primary_contact_name NVARCHAR(255) = JSON_VALUE(@SponsorJson, '$.primary_contact_name');
    DECLARE @primary_contact_email NVARCHAR(255) = JSON_VALUE(@SponsorJson, '$.primary_contact_email');
    DECLARE @primary_contact_phone NVARCHAR(50) = JSON_VALUE(@SponsorJson, '$.primary_contact_phone');
    DECLARE @billing_address NVARCHAR(MAX) = JSON_VALUE(@SponsorJson, '$.billing_address');
    DECLARE @tax_id NVARCHAR(50) = JSON_VALUE(@SponsorJson, '$.tax_id');
    DECLARE @payment_terms NVARCHAR(255) = JSON_VALUE(@SponsorJson, '$.payment_terms');
    DECLARE @status NVARCHAR(50) = JSON_VALUE(@SponsorJson, '$.status');
    DECLARE @notes NVARCHAR(MAX) = JSON_VALUE(@SponsorJson, '$.notes');
    DECLARE @created_by INT = JSON_VALUE(@SponsorJson, '$.created_by');
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        IF @sponsor_id IS NULL OR @sponsor_id = 0
        BEGIN
            -- Create new sponsor
            INSERT INTO [dbo].[Sponsors] (
                program_id, sponsor_name, sponsor_code, organization_type,
                primary_contact_name, primary_contact_email, primary_contact_phone,
                billing_address, tax_id, payment_terms, status, notes, created_by
            )
            VALUES (
                @program_id, @sponsor_name, @sponsor_code, @organization_type,
                @primary_contact_name, @primary_contact_email, @primary_contact_phone,
                @billing_address, @tax_id, @payment_terms, @status, @notes, @created_by
            );
            
            SET @sponsor_id = SCOPE_IDENTITY();
        END
        ELSE
        BEGIN
            -- Update existing sponsor
            UPDATE [dbo].[Sponsors]
            SET 
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
                last_modified = GETDATE()
            WHERE sponsor_id = @sponsor_id AND program_id = @program_id;
        END
        
        COMMIT TRANSACTION;
        
        SELECT @sponsor_id AS sponsor_id;
        
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

-- Create or update sponsor fund
CREATE PROCEDURE [dbo].[usp_SaveSponsorFund]
    @FundJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @fund_id INT = JSON_VALUE(@FundJson, '$.fund_id');
    DECLARE @sponsor_id INT = JSON_VALUE(@FundJson, '$.sponsor_id');
    DECLARE @fund_name NVARCHAR(255) = JSON_VALUE(@FundJson, '$.fund_name');
    DECLARE @fund_code NVARCHAR(50) = JSON_VALUE(@FundJson, '$.fund_code');
    DECLARE @fund_type NVARCHAR(100) = JSON_VALUE(@FundJson, '$.fund_type');
    DECLARE @total_amount DECIMAL(18,2) = JSON_VALUE(@FundJson, '$.total_amount');
    DECLARE @effective_date DATETIME2 = JSON_VALUE(@FundJson, '$.effective_date');
    DECLARE @expiration_date DATETIME2 = JSON_VALUE(@FundJson, '$.expiration_date');
    DECLARE @funding_document_id INT = JSON_VALUE(@FundJson, '$.funding_document_id');
    DECLARE @approval_status NVARCHAR(50) = JSON_VALUE(@FundJson, '$.approval_status');
    DECLARE @approved_by INT = JSON_VALUE(@FundJson, '$.approved_by');
    DECLARE @status NVARCHAR(50) = JSON_VALUE(@FundJson, '$.status');
    DECLARE @restrictions NVARCHAR(MAX) = JSON_VALUE(@FundJson, '$.restrictions');
    DECLARE @reporting_requirements NVARCHAR(MAX) = JSON_VALUE(@FundJson, '$.reporting_requirements');
    DECLARE @notes NVARCHAR(MAX) = JSON_VALUE(@FundJson, '$.notes');
    DECLARE @created_by INT = JSON_VALUE(@FundJson, '$.created_by');
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        IF @fund_id IS NULL OR @fund_id = 0
        BEGIN
            -- Create new fund
            INSERT INTO [dbo].[SponsorFunds] (
                sponsor_id, fund_name, fund_code, fund_type, total_amount,
                effective_date, expiration_date, funding_document_id, approval_status,
                approved_by, status, restrictions, reporting_requirements, notes, created_by
            )
            VALUES (
                @sponsor_id, @fund_name, @fund_code, @fund_type, @total_amount,
                @effective_date, @expiration_date, @funding_document_id, @approval_status,
                @approved_by, @status, @restrictions, @reporting_requirements, @notes, @created_by
            );
            
            SET @fund_id = SCOPE_IDENTITY();
        END
        ELSE
        BEGIN
            -- Update existing fund
            UPDATE [dbo].[SponsorFunds]
            SET 
                fund_name = @fund_name,
                fund_code = @fund_code,
                fund_type = @fund_type,
                total_amount = @total_amount,
                effective_date = @effective_date,
                expiration_date = @expiration_date,
                funding_document_id = @funding_document_id,
                approval_status = @approval_status,
                approved_by = @approved_by,
                status = @status,
                restrictions = @restrictions,
                reporting_requirements = @reporting_requirements,
                notes = @notes,
                last_modified = GETDATE()
            WHERE fund_id = @fund_id;
        END
        
        -- Set approval date if approved
        IF @approval_status = 'Approved' AND @approved_by IS NOT NULL
        BEGIN
            UPDATE [dbo].[SponsorFunds]
            SET approved_date = GETDATE()
            WHERE fund_id = @fund_id AND approved_date IS NULL;
        END
        
        COMMIT TRANSACTION;
        
        SELECT @fund_id AS fund_id;
        
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

-- Allocate fund to task
CREATE PROCEDURE [dbo].[usp_AllocateTaskFund]
    @AllocationJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @task_id INT = JSON_VALUE(@AllocationJson, '$.task_id');
    DECLARE @fund_id INT = JSON_VALUE(@AllocationJson, '$.fund_id');
    DECLARE @allocation_amount DECIMAL(18,2) = JSON_VALUE(@AllocationJson, '$.allocation_amount');
    DECLARE @expiration_date DATETIME2 = JSON_VALUE(@AllocationJson, '$.expiration_date');
    DECLARE @is_cross_payment BIT = JSON_VALUE(@AllocationJson, '$.is_cross_payment');
    DECLARE @cross_payment_sponsor_id INT = JSON_VALUE(@AllocationJson, '$.cross_payment_sponsor_id');
    DECLARE @cross_payment_reference NVARCHAR(100) = JSON_VALUE(@AllocationJson, '$.cross_payment_reference');
    DECLARE @purpose NVARCHAR(255) = JSON_VALUE(@AllocationJson, '$.purpose');
    DECLARE @justification NVARCHAR(MAX) = JSON_VALUE(@AllocationJson, '$.justification');
    DECLARE @created_by INT = JSON_VALUE(@AllocationJson, '$.created_by');
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Check if fund has sufficient remaining amount
        DECLARE @remaining_amount DECIMAL(18,2);
        SELECT @remaining_amount = total_amount - allocated_amount
        FROM [dbo].[SponsorFunds]
        WHERE fund_id = @fund_id AND status = 'Active';
        
        IF @remaining_amount < @allocation_amount
        BEGIN
            RAISERROR('Insufficient funds available. Remaining: %s, Requested: %s', 16, 1, @remaining_amount, @allocation_amount);
            RETURN;
        END
        
        -- Create allocation
        INSERT INTO [dbo].[TaskFundAllocations] (
            task_id, fund_id, allocation_amount, expiration_date, is_cross_payment,
            cross_payment_sponsor_id, cross_payment_reference, purpose, justification, created_by
        )
        VALUES (
            @task_id, @fund_id, @allocation_amount, @expiration_date, @is_cross_payment,
            @cross_payment_sponsor_id, @cross_payment_reference, @purpose, @justification, @created_by
        );
        
        -- Update fund allocated amount
        UPDATE [dbo].[SponsorFunds]
        SET allocated_amount = allocated_amount + @allocation_amount,
            last_modified = GETDATE()
        WHERE fund_id = @fund_id;
        
        COMMIT TRANSACTION;
        
        SELECT SCOPE_IDENTITY() AS allocation_id;
        
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

-- Get funds with usage summary
CREATE PROCEDURE [dbo].[usp_GetFundsWithUsage]
    @program_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        f.fund_id,
        f.fund_name,
        f.fund_code,
        f.fund_type,
        f.total_amount,
        f.allocated_amount,
        f.spent_amount,
        f.remaining_amount,
        f.effective_date,
        f.expiration_date,
        f.status,
        f.approval_status,
        s.sponsor_name,
        s.sponsor_code,
        s.program_id,
        p.program_name,
        -- Calculate days until expiration
        CASE 
            WHEN f.expiration_date IS NULL THEN NULL
            ELSE DATEDIFF(DAY, GETDATE(), f.expiration_date)
        END AS days_until_expiration,
        -- Fund utilization percentage
        CASE 
            WHEN f.total_amount = 0 THEN 0
            ELSE ROUND((f.allocated_amount / f.total_amount) * 100, 2)
        END AS utilization_percentage
    FROM [dbo].[SponsorFunds] f
    INNER JOIN [dbo].[Sponsors] s ON f.sponsor_id = s.sponsor_id
    INNER JOIN [dbo].[Programs] p ON s.program_id = p.program_id
    WHERE (@program_id IS NULL OR s.program_id = @program_id)
    ORDER BY f.expiration_date ASC, f.fund_name;
END
GO

-- Get task fund allocations
CREATE PROCEDURE [dbo].[usp_GetTaskFundAllocations]
    @program_id INT = NULL,
    @task_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        tfa.allocation_id,
        tfa.task_id,
        tfa.fund_id,
        tfa.allocation_amount,
        tfa.spent_amount,
        tfa.remaining_amount,
        tfa.allocation_date,
        tfa.expiration_date,
        tfa.status,
        tfa.is_cross_payment,
        tfa.cross_payment_sponsor_id,
        tfa.cross_payment_reference,
        tfa.purpose,
        tfa.justification,
        t.task_title,
        t.task_description,
        f.fund_name,
        f.fund_code,
        s.sponsor_name,
        s.sponsor_code,
        cps.sponsor_name AS cross_payment_sponsor_name,
        p.program_name
    FROM [dbo].[TaskFundAllocations] tfa
    INNER JOIN [dbo].[Tasks] t ON tfa.task_id = t.task_id
    INNER JOIN [dbo].[SponsorFunds] f ON tfa.fund_id = f.fund_id
    INNER JOIN [dbo].[Sponsors] s ON f.sponsor_id = s.sponsor_id
    INNER JOIN [dbo].[Programs] p ON s.program_id = p.program_id
    LEFT JOIN [dbo].[Sponsors] cps ON tfa.cross_payment_sponsor_id = cps.sponsor_id
    WHERE (@program_id IS NULL OR s.program_id = @program_id)
      AND (@task_id IS NULL OR tfa.task_id = @task_id)
    ORDER BY tfa.allocation_date DESC;
END
GO

-- =============================================
-- SAMPLE PROCUREMENT DATA
-- =============================================

-- Insert sample sponsors
INSERT INTO [dbo].[Sponsors] (program_id, sponsor_name, sponsor_code, organization_type, primary_contact_name, primary_contact_email, status, created_by)
VALUES 
(1, 'Department of Defense', 'DOD', 'Government', 'John Smith', 'john.smith@defense.gov', 'Active', 1),
(1, 'Navy Research Laboratory', 'NRL', 'Government', 'Sarah Johnson', 'sarah.johnson@navy.mil', 'Active', 1),
(1, 'Internal Operations', 'INTERNAL', 'Internal', 'Operations Manager', 'ops@company.com', 'Active', 1);

-- Insert sample sponsor funds
INSERT INTO [dbo].[SponsorFunds] (sponsor_id, fund_name, fund_code, fund_type, total_amount, effective_date, expiration_date, approval_status, approved_by, status, created_by)
VALUES 
(1, 'FY2025 R&D Contract', 'DOD-RD-2025', 'Contract', 500000.00, '2025-01-01', '2025-12-31', 'Approved', 1, 'Active', 1),
(2, 'Advanced Materials Grant', 'NRL-AM-2025', 'Grant', 250000.00, '2025-01-01', '2025-06-30', 'Approved', 1, 'Active', 1),
(3, 'Emergency Operations Fund', 'INT-EMG-2025', 'Internal', 100000.00, '2025-01-01', NULL, 'Approved', 1, 'Active', 1);

-- Insert sample vendors
INSERT INTO [dbo].[ProcurementVendors] (program_id, vendor_name, vendor_code, vendor_type, primary_contact_name, primary_contact_email, status, created_by)
VALUES 
(1, 'Advanced Manufacturing Solutions', 'AMS', 'Supplier', 'Mike Wilson', 'mike.wilson@ams.com', 'Active', 1),
(1, 'Precision Components Inc', 'PCI', 'Supplier', 'Lisa Chen', 'lisa.chen@precision.com', 'Active', 1),
(1, 'Quality Testing Services', 'QTS', 'Service Provider', 'David Brown', 'david.brown@qts.com', 'Active', 1);

PRINT '✅ PROCUREMENT & FUNDING MANAGEMENT SYSTEM ADDED:'
PRINT '- Sponsors table (organizations providing funding)'
PRINT '- SponsorFunds table (specific funding sources/accounts)'
PRINT '- FundingDocuments table (contracts, agreements, documentation)'
PRINT '- TaskFundAllocations table (allocate funds to specific tasks)'
PRINT '- OrderFundAllocations table (allocate funds to procurement orders)'
PRINT '- ProcurementVendors table (vendor management)'
PRINT '- ProcurementNotifications table (procurement-specific notifications)'
PRINT '- ProcurementAuditLog table (audit trail for fund transactions)'
PRINT '- Sample data: 3 sponsors, 3 funds, 3 vendors'
PRINT '- Complete stored procedures for fund management'
PRINT '- Cross-payment allocation system'
PRINT '- Expiration tracking for funds and documents'
PRINT '- Multi-tenant support with program_id integration'
PRINT ''

-- ...existing code...
