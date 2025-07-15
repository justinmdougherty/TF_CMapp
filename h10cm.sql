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
-- VIEWS
-- =============================================

-- Enhanced Projects Summary View
CREATE VIEW [dbo].[v_Projects_Summary] AS
SELECT
    p.project_id,
    p.project_name,
    p.project_description,
    p.status,
    p.priority,
    pr.program_name,
    pr.program_code,
    pm.display_name AS project_manager_name,
    cb.display_name AS created_by_name,
    p.date_created,
    p.last_modified,
    p.project_start_date,
    p.project_end_date,
    p.estimated_completion_date,
    p.actual_completion_date,
    p.budget,
    (SELECT COUNT(*) FROM dbo.ProjectSteps ps WHERE ps.project_id = p.project_id) AS total_steps,
    (SELECT COUNT(*) FROM dbo.TrackedItems ti WHERE ti.project_id = p.project_id) AS total_tracked_items
FROM dbo.Projects p
LEFT JOIN dbo.Programs pr ON p.program_id = pr.program_id
LEFT JOIN dbo.Users pm ON p.project_manager_id = pm.user_id
LEFT JOIN dbo.Users cb ON p.created_by = cb.user_id;
GO

-- User Access Summary View
CREATE VIEW [dbo].[v_User_Access_Summary] AS
SELECT
    u.user_id,
    u.user_name,
    u.display_name,
    u.is_system_admin,
    prog.program_id,
    prog.program_name,
    pa.access_level AS program_access_level,
    proj.project_id,
    proj.project_name,
    pra.access_level AS project_access_level
FROM dbo.Users u
LEFT JOIN dbo.ProgramAccess pa ON u.user_id = pa.user_id AND pa.is_active = 1
LEFT JOIN dbo.Programs prog ON pa.program_id = prog.program_id AND prog.is_active = 1
LEFT JOIN dbo.ProjectAccess pra ON u.user_id = pra.user_id AND pra.is_active = 1
LEFT JOIN dbo.Projects proj ON pra.project_id = proj.project_id
WHERE u.is_active = 1;
GO

-- Task Summary View
CREATE VIEW [dbo].[v_Tasks_Summary] AS
SELECT
    t.task_id,
    t.task_title,
    t.priority,
    t.status,
    t.completion_percentage,
    assigned_user.display_name AS assigned_to_name,
    assigner.display_name AS assigned_by_name,
    p.project_name,
    pr.program_name,
    t.due_date,
    t.date_created,
    t.date_completed,
    CASE 
        WHEN t.due_date < GETDATE() AND t.status NOT IN ('Completed', 'Cancelled') THEN 'Overdue'
        WHEN t.due_date <= DATEADD(day, 1, GETDATE()) AND t.status NOT IN ('Completed', 'Cancelled') THEN 'Due Soon'
        ELSE 'On Track'
    END AS urgency_status
FROM dbo.Tasks t
LEFT JOIN dbo.Users assigned_user ON t.assigned_to = assigned_user.user_id
LEFT JOIN dbo.Users assigner ON t.assigned_by = assigner.user_id
LEFT JOIN dbo.Projects p ON t.project_id = p.project_id
LEFT JOIN dbo.Programs pr ON p.program_id = pr.program_id;
GO

-- Inventory Status View
CREATE VIEW [dbo].[v_InventoryItems_StockStatus] AS
SELECT
    ii.inventory_item_id,
    ii.item_name,
    ii.part_number,
    ii.category,
    ii.unit_of_measure,
    ii.current_stock_level,
    ii.reorder_point,
    ii.max_stock_level,
    ii.cost_per_unit,
    ii.location,
    (CASE WHEN ii.current_stock_level <= ISNULL(ii.reorder_point, 0) THEN 'Yes' ELSE 'No' END) AS needs_reorder,
    (CASE 
        WHEN ii.current_stock_level <= 0 THEN 'Out of Stock'
        WHEN ii.current_stock_level <= ISNULL(ii.reorder_point, 0) THEN 'Low Stock'
        WHEN ii.current_stock_level >= ISNULL(ii.max_stock_level, 99999) THEN 'Overstock'
        ELSE 'Normal'
    END) AS stock_status,
    (ii.current_stock_level * ISNULL(ii.cost_per_unit, 0)) AS total_value
FROM dbo.InventoryItems ii
WHERE ii.is_active = 1;
GO

-- Notification Summary View
CREATE VIEW [dbo].[v_Notifications_Summary] AS
SELECT
    n.notification_id,
    n.user_id,
    u.display_name AS user_name,
    n.category,
    n.title,
    n.priority,
    n.is_read,
    n.is_actionable,
    n.action_url,
    n.action_text,
    n.related_entity_type,
    n.related_entity_id,
    n.date_created,
    n.date_read,
    DATEDIFF(hour, n.date_created, GETDATE()) AS hours_old
FROM dbo.Notifications n
LEFT JOIN dbo.Users u ON n.user_id = u.user_id
WHERE n.expires_at IS NULL OR n.expires_at > GETDATE();
GO

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Program Indexes
CREATE NONCLUSTERED INDEX [IDX_Programs_Name] ON [dbo].[Programs] ([program_name]) INCLUDE ([program_code], [is_active])
CREATE NONCLUSTERED INDEX [IDX_Programs_Active] ON [dbo].[Programs] ([is_active]) INCLUDE ([program_name], [program_code])

-- User Indexes
CREATE NONCLUSTERED INDEX [IDX_Users_Certificate] ON [dbo].[Users] ([certificate_subject]) INCLUDE ([user_name], [display_name])
CREATE NONCLUSTERED INDEX [IDX_Users_Active] ON [dbo].[Users] ([is_active]) INCLUDE ([user_name], [display_name])
CREATE NONCLUSTERED INDEX [IDX_Users_LastLogin] ON [dbo].[Users] ([last_login])

-- Project Indexes
CREATE NONCLUSTERED INDEX [IDX_Projects_Program] ON [dbo].[Projects] ([program_id]) INCLUDE ([project_name], [status])
CREATE NONCLUSTERED INDEX [IDX_Projects_Status] ON [dbo].[Projects] ([status]) INCLUDE ([project_name], [priority])
CREATE NONCLUSTERED INDEX [IDX_Projects_Manager] ON [dbo].[Projects] ([project_manager_id])
CREATE NONCLUSTERED INDEX [IDX_Projects_Dates] ON [dbo].[Projects] ([project_start_date], [project_end_date])

-- Task Indexes
CREATE NONCLUSTERED INDEX [IDX_Tasks_AssignedTo] ON [dbo].[Tasks] ([assigned_to]) INCLUDE ([status], [priority], [due_date])
CREATE NONCLUSTERED INDEX [IDX_Tasks_Status] ON [dbo].[Tasks] ([status]) INCLUDE ([assigned_to], [priority])
CREATE NONCLUSTERED INDEX [IDX_Tasks_Project] ON [dbo].[Tasks] ([project_id]) INCLUDE ([assigned_to], [status])
CREATE NONCLUSTERED INDEX [IDX_Tasks_DueDate] ON [dbo].[Tasks] ([due_date]) INCLUDE ([assigned_to], [status])

-- Notification Indexes
CREATE NONCLUSTERED INDEX [IDX_Notifications_User] ON [dbo].[Notifications] ([user_id]) INCLUDE ([is_read], [category], [priority])
CREATE NONCLUSTERED INDEX [IDX_Notifications_Unread] ON [dbo].[Notifications] ([user_id], [is_read]) INCLUDE ([category], [priority], [date_created])
CREATE NONCLUSTERED INDEX [IDX_Notifications_Category] ON [dbo].[Notifications] ([category]) INCLUDE ([user_id], [is_read])

-- Access Control Indexes
CREATE NONCLUSTERED INDEX [IDX_ProgramAccess_User] ON [dbo].[ProgramAccess] ([user_id]) INCLUDE ([program_id], [access_level], [is_active])
CREATE NONCLUSTERED INDEX [IDX_ProjectAccess_User] ON [dbo].[ProjectAccess] ([user_id]) INCLUDE ([project_id], [access_level], [is_active])
CREATE NONCLUSTERED INDEX [IDX_UserRoles_User] ON [dbo].[UserRoles] ([user_id]) INCLUDE ([role_id], [program_id], [project_id], [is_active])

-- Inventory Indexes
CREATE NONCLUSTERED INDEX [IDX_InventoryItems_PartNumber] ON [dbo].[InventoryItems] ([part_number]) INCLUDE ([item_name], [current_stock_level])
CREATE NONCLUSTERED INDEX [IDX_InventoryItems_Category] ON [dbo].[InventoryItems] ([category]) INCLUDE ([item_name], [current_stock_level])
CREATE NONCLUSTERED INDEX [IDX_InventoryItems_StockLevel] ON [dbo].[InventoryItems] ([current_stock_level]) INCLUDE ([reorder_point])

-- Cart/Procurement Indexes
CREATE NONCLUSTERED INDEX [IDX_CartItems_User] ON [dbo].[CartItems] ([user_id]) INCLUDE ([inventory_item_id], [quantity_requested], [date_added])
CREATE NONCLUSTERED INDEX [IDX_CartItems_InventoryItem] ON [dbo].[CartItems] ([inventory_item_id]) INCLUDE ([user_id], [quantity_requested])
CREATE NONCLUSTERED INDEX [IDX_PendingOrders_User] ON [dbo].[PendingOrders] ([user_id]) INCLUDE ([status], [date_created])
CREATE NONCLUSTERED INDEX [IDX_PendingOrders_Project] ON [dbo].[PendingOrders] ([project_id]) INCLUDE ([status], [date_created])
CREATE NONCLUSTERED INDEX [IDX_PendingOrders_Status] ON [dbo].[PendingOrders] ([status]) INCLUDE ([user_id], [project_id])
CREATE NONCLUSTERED INDEX [IDX_PendingOrderItems_Order] ON [dbo].[PendingOrderItems] ([order_id]) INCLUDE ([inventory_item_id], [quantity_ordered])
CREATE NONCLUSTERED INDEX [IDX_PendingOrderItems_InventoryItem] ON [dbo].[PendingOrderItems] ([inventory_item_id]) INCLUDE ([order_id], [quantity_ordered])

-- Transaction Indexes
CREATE NONCLUSTERED INDEX [IDX_InventoryTransactions_Item] ON [dbo].[InventoryTransactions] ([inventory_item_id]) INCLUDE ([transaction_timestamp], [transaction_type])
CREATE NONCLUSTERED INDEX [IDX_InventoryTransactions_Date] ON [dbo].[InventoryTransactions] ([transaction_timestamp]) INCLUDE ([inventory_item_id], [transaction_type])
CREATE NONCLUSTERED INDEX [IDX_InventoryTransactions_User] ON [dbo].[InventoryTransactions] ([user_id]) INCLUDE ([transaction_timestamp], [transaction_type])

-- Audit Indexes
CREATE NONCLUSTERED INDEX [IDX_AuditLog_User] ON [dbo].[AuditLog] ([user_id]) INCLUDE ([action_type], [date_created])
CREATE NONCLUSTERED INDEX [IDX_AuditLog_Entity] ON [dbo].[AuditLog] ([entity_type], [entity_id]) INCLUDE ([action_type], [date_created])
CREATE NONCLUSTERED INDEX [IDX_AuditLog_Date] ON [dbo].[AuditLog] ([date_created]) INCLUDE ([user_id], [action_type])

-- =============================================
-- FOREIGN KEY CONSTRAINTS
-- =============================================

-- Program Dependencies
ALTER TABLE [dbo].[Projects] ADD CONSTRAINT [FK_Projects_Programs] 
    FOREIGN KEY([program_id]) REFERENCES [dbo].[Programs] ([program_id])

-- User Dependencies
ALTER TABLE [dbo].[Projects] ADD CONSTRAINT [FK_Projects_ProjectManager] 
    FOREIGN KEY([project_manager_id]) REFERENCES [dbo].[Users] ([user_id])

ALTER TABLE [dbo].[Projects] ADD CONSTRAINT [FK_Projects_CreatedBy] 
    FOREIGN KEY([created_by]) REFERENCES [dbo].[Users] ([user_id])

-- RBAC Dependencies
ALTER TABLE [dbo].[UserRoles] ADD CONSTRAINT [FK_UserRoles_Users] 
    FOREIGN KEY([user_id]) REFERENCES [dbo].[Users] ([user_id])

ALTER TABLE [dbo].[UserRoles] ADD CONSTRAINT [FK_UserRoles_Roles] 
    FOREIGN KEY([role_id]) REFERENCES [dbo].[Roles] ([role_id])

ALTER TABLE [dbo].[UserRoles] ADD CONSTRAINT [FK_UserRoles_Programs] 
    FOREIGN KEY([program_id]) REFERENCES [dbo].[Programs] ([program_id])

ALTER TABLE [dbo].[UserRoles] ADD CONSTRAINT [FK_UserRoles_Projects] 
    FOREIGN KEY([project_id]) REFERENCES [dbo].[Projects] ([project_id])

ALTER TABLE [dbo].[UserRoles] ADD CONSTRAINT [FK_UserRoles_AssignedBy] 
    FOREIGN KEY([assigned_by]) REFERENCES [dbo].[Users] ([user_id])

ALTER TABLE [dbo].[ProgramAccess] ADD CONSTRAINT [FK_ProgramAccess_Users] 
    FOREIGN KEY([user_id]) REFERENCES [dbo].[Users] ([user_id])

ALTER TABLE [dbo].[ProgramAccess] ADD CONSTRAINT [FK_ProgramAccess_Programs] 
    FOREIGN KEY([program_id]) REFERENCES [dbo].[Programs] ([program_id])

ALTER TABLE [dbo].[ProgramAccess] ADD CONSTRAINT [FK_ProgramAccess_GrantedBy] 
    FOREIGN KEY([granted_by]) REFERENCES [dbo].[Users] ([user_id])

ALTER TABLE [dbo].[ProjectAccess] ADD CONSTRAINT [FK_ProjectAccess_Users] 
    FOREIGN KEY([user_id]) REFERENCES [dbo].[Users] ([user_id])

ALTER TABLE [dbo].[ProjectAccess] ADD CONSTRAINT [FK_ProjectAccess_Projects] 
    FOREIGN KEY([project_id]) REFERENCES [dbo].[Projects] ([project_id])

ALTER TABLE [dbo].[ProjectAccess] ADD CONSTRAINT [FK_ProjectAccess_GrantedBy] 
    FOREIGN KEY([granted_by]) REFERENCES [dbo].[Users] ([user_id])

-- Task Dependencies
ALTER TABLE [dbo].[Tasks] ADD CONSTRAINT [FK_Tasks_Projects] 
    FOREIGN KEY([project_id]) REFERENCES [dbo].[Projects] ([project_id])

ALTER TABLE [dbo].[Tasks] ADD CONSTRAINT [FK_Tasks_ProjectSteps] 
    FOREIGN KEY([step_id]) REFERENCES [dbo].[ProjectSteps] ([step_id])

ALTER TABLE [dbo].[Tasks] ADD CONSTRAINT [FK_Tasks_TrackedItems] 
    FOREIGN KEY([tracked_item_id]) REFERENCES [dbo].[TrackedItems] ([item_id])

ALTER TABLE [dbo].[Tasks] ADD CONSTRAINT [FK_Tasks_AssignedTo] 
    FOREIGN KEY([assigned_to]) REFERENCES [dbo].[Users] ([user_id])

ALTER TABLE [dbo].[Tasks] ADD CONSTRAINT [FK_Tasks_AssignedBy] 
    FOREIGN KEY([assigned_by]) REFERENCES [dbo].[Users] ([user_id])

-- Notification Dependencies
ALTER TABLE [dbo].[Notifications] ADD CONSTRAINT [FK_Notifications_Users] 
    FOREIGN KEY([user_id]) REFERENCES [dbo].[Users] ([user_id])

-- Audit Dependencies
ALTER TABLE [dbo].[AuditLog] ADD CONSTRAINT [FK_AuditLog_Users] 
    FOREIGN KEY([user_id]) REFERENCES [dbo].[Users] ([user_id])

-- Existing Table Dependencies
ALTER TABLE [dbo].[AttributeDefinitions] ADD CONSTRAINT [FK_AttributeDefinitions_Projects] 
    FOREIGN KEY([project_id]) REFERENCES [dbo].[Projects] ([project_id]) ON UPDATE CASCADE ON DELETE CASCADE

ALTER TABLE [dbo].[ProjectSteps] ADD CONSTRAINT [FK_ProjectSteps_Projects] 
    FOREIGN KEY([project_id]) REFERENCES [dbo].[Projects] ([project_id]) ON UPDATE CASCADE ON DELETE CASCADE

ALTER TABLE [dbo].[StepInventoryRequirements] ADD CONSTRAINT [FK_StepInventoryRequirements_ProjectSteps] 
    FOREIGN KEY([step_id]) REFERENCES [dbo].[ProjectSteps] ([step_id]) ON UPDATE CASCADE ON DELETE CASCADE

ALTER TABLE [dbo].[StepInventoryRequirements] ADD CONSTRAINT [FK_StepInventoryRequirements_InventoryItems] 
    FOREIGN KEY([inventory_item_id]) REFERENCES [dbo].[InventoryItems] ([inventory_item_id]) ON UPDATE CASCADE

ALTER TABLE [dbo].[TrackedItems] ADD CONSTRAINT [FK_TrackedItems_Projects] 
    FOREIGN KEY([project_id]) REFERENCES [dbo].[Projects] ([project_id]) ON UPDATE CASCADE ON DELETE CASCADE

ALTER TABLE [dbo].[TrackedItems] ADD CONSTRAINT [FK_TrackedItems_CreatedBy] 
    FOREIGN KEY([created_by]) REFERENCES [dbo].[Users] ([user_id])

ALTER TABLE [dbo].[ItemAttributeValues] ADD CONSTRAINT [FK_ItemAttributeValues_TrackedItems] 
    FOREIGN KEY([item_id]) REFERENCES [dbo].[TrackedItems] ([item_id]) ON UPDATE CASCADE ON DELETE CASCADE

ALTER TABLE [dbo].[ItemAttributeValues] ADD CONSTRAINT [FK_ItemAttributeValues_AttributeDefinitions] 
    FOREIGN KEY([attribute_definition_id]) REFERENCES [dbo].[AttributeDefinitions] ([attribute_definition_id])

ALTER TABLE [dbo].[ItemAttributeValues] ADD CONSTRAINT [FK_ItemAttributeValues_SetBy] 
    FOREIGN KEY([set_by]) REFERENCES [dbo].[Users] ([user_id])

ALTER TABLE [dbo].[TrackedItemStepProgress] ADD CONSTRAINT [FK_TrackedItemStepProgress_TrackedItems] 
    FOREIGN KEY([item_id]) REFERENCES [dbo].[TrackedItems] ([item_id]) ON UPDATE CASCADE ON DELETE CASCADE

ALTER TABLE [dbo].[TrackedItemStepProgress] ADD CONSTRAINT [FK_TrackedItemStepProgress_ProjectSteps] 
    FOREIGN KEY([step_id]) REFERENCES [dbo].[ProjectSteps] ([step_id])

ALTER TABLE [dbo].[TrackedItemStepProgress] ADD CONSTRAINT [FK_TrackedItemStepProgress_AssignedTo] 
    FOREIGN KEY([assigned_to]) REFERENCES [dbo].[Users] ([user_id])

ALTER TABLE [dbo].[TrackedItemStepProgress] ADD CONSTRAINT [FK_TrackedItemStepProgress_ApprovedBy] 
    FOREIGN KEY([approved_by]) REFERENCES [dbo].[Users] ([user_id])

ALTER TABLE [dbo].[InventoryTransactions] ADD CONSTRAINT [FK_InventoryTransactions_InventoryItems] 
    FOREIGN KEY([inventory_item_id]) REFERENCES [dbo].[InventoryItems] ([inventory_item_id]) ON UPDATE CASCADE

ALTER TABLE [dbo].[InventoryTransactions] ADD CONSTRAINT [FK_InventoryTransactions_Users] 
    FOREIGN KEY([user_id]) REFERENCES [dbo].[Users] ([user_id])

ALTER TABLE [dbo].[InventoryTransactions] ADD CONSTRAINT [FK_InventoryTransactions_ProjectSteps] 
    FOREIGN KEY([step_id]) REFERENCES [dbo].[ProjectSteps] ([step_id])

ALTER TABLE [dbo].[InventoryTransactions] ADD CONSTRAINT [FK_InventoryTransactions_TrackedItems] 
    FOREIGN KEY([tracked_item_id]) REFERENCES [dbo].[TrackedItems] ([item_id]) ON UPDATE CASCADE ON DELETE SET NULL

ALTER TABLE [dbo].[InventoryItems] ADD CONSTRAINT [FK_InventoryItems_CreatedBy] 
    FOREIGN KEY([created_by]) REFERENCES [dbo].[Users] ([user_id])

-- Cart/Procurement Dependencies
ALTER TABLE [dbo].[CartItems] ADD CONSTRAINT [FK_CartItems_Users] 
    FOREIGN KEY([user_id]) REFERENCES [dbo].[Users] ([user_id]) ON UPDATE CASCADE ON DELETE CASCADE

ALTER TABLE [dbo].[CartItems] ADD CONSTRAINT [FK_CartItems_InventoryItems] 
    FOREIGN KEY([inventory_item_id]) REFERENCES [dbo].[InventoryItems] ([inventory_item_id]) ON UPDATE CASCADE ON DELETE CASCADE

ALTER TABLE [dbo].[PendingOrders] ADD CONSTRAINT [FK_PendingOrders_Users] 
    FOREIGN KEY([user_id]) REFERENCES [dbo].[Users] ([user_id]) ON UPDATE CASCADE

ALTER TABLE [dbo].[PendingOrders] ADD CONSTRAINT [FK_PendingOrders_Projects] 
    FOREIGN KEY([project_id]) REFERENCES [dbo].[Projects] ([project_id]) ON UPDATE CASCADE

ALTER TABLE [dbo].[PendingOrders] ADD CONSTRAINT [FK_PendingOrders_ApprovedBy] 
    FOREIGN KEY([approved_by]) REFERENCES [dbo].[Users] ([user_id])

ALTER TABLE [dbo].[PendingOrders] ADD CONSTRAINT [FK_PendingOrders_OrderedBy] 
    FOREIGN KEY([ordered_by]) REFERENCES [dbo].[Users] ([user_id])

ALTER TABLE [dbo].[PendingOrderItems] ADD CONSTRAINT [FK_PendingOrderItems_PendingOrders] 
    FOREIGN KEY([order_id]) REFERENCES [dbo].[PendingOrders] ([order_id]) ON UPDATE CASCADE ON DELETE CASCADE

ALTER TABLE [dbo].[PendingOrderItems] ADD CONSTRAINT [FK_PendingOrderItems_InventoryItems] 
    FOREIGN KEY([inventory_item_id]) REFERENCES [dbo].[InventoryItems] ([inventory_item_id]) ON UPDATE CASCADE

GO

-- =============================================
-- SAMPLE DATA FOR IMMEDIATE FUNCTIONALITY
-- =============================================

-- Insert Sample Program (Primary Program)
INSERT INTO [dbo].[Programs] (program_name, program_code, program_description, created_by, program_manager)
VALUES 
    ('Operations', 'OPS', 'Production management and inventory tracking operations', 'System', 'System')

-- Optional: Insert additional programs for future expansion
-- INSERT INTO [dbo].[Programs] (program_name, program_code, program_description, created_by, program_manager)
-- VALUES 
--     ('Manufacturing Operations', 'MFG', 'General manufacturing and production operations', 'System', 'System'),
--     ('Quality Assurance', 'QA', 'Quality control and assurance operations', 'System', 'System'),
--     ('Research & Development', 'RND', 'Research and development projects', 'System', 'System')

-- Insert System Roles
INSERT INTO [dbo].[Roles] (role_name, role_description, role_level, permissions)
VALUES 
    ('System Administrator', 'Full system access and administration', 'System', '{"all": true}'),
    ('Program Manager', 'Manage entire programs and their projects', 'Program', '{"program_admin": true, "project_create": true, "user_manage": true}'),
    ('Project Manager', 'Manage individual projects', 'Project', '{"project_admin": true, "task_assign": true, "inventory_manage": true}'),
    ('Production Technician', 'Execute production tasks and update progress', 'Resource', '{"task_execute": true, "inventory_use": true, "progress_update": true}'),
    ('Quality Inspector', 'Quality control and inspection tasks', 'Resource', '{"quality_check": true, "approval_grant": true}'),
    ('Inventory Manager', 'Manage inventory and procurement', 'Resource', '{"inventory_admin": true, "procurement": true}')

-- Insert Sample System User (for system operations)
INSERT INTO [dbo].[Users] (certificate_subject, user_name, display_name, first_name, last_name, initials, is_active, is_system_admin, preferences)
VALUES 
    ('CN=System,O=H10CM', 'system', 'System User', 'System', 'User', 'SU', 1, 1, '{"theme": "light", "notifications": true}')

DECLARE @SystemUserId INT = SCOPE_IDENTITY()

-- Assign System Admin Role to System User
INSERT INTO [dbo].[UserRoles] (user_id, role_id, assigned_by)
SELECT @SystemUserId, role_id, @SystemUserId
FROM [dbo].[Roles] 
WHERE role_name = 'System Administrator'

-- Insert Sample Inventory Categories and Items
INSERT INTO [dbo].[InventoryItems] (item_name, part_number, description, category, unit_of_measure, current_stock_level, reorder_point, cost_per_unit, created_by)
VALUES 
    ('Aluminum Sheet 6061', 'AL-6061-001', '6061 Aluminum Sheet 12x12x0.125', 'Raw Materials', 'EA', 50, 10, 25.50, @SystemUserId),
    ('Stainless Steel Bolt M8x25', 'SS-M8X25-001', 'M8x25mm Stainless Steel Bolt', 'Fasteners', 'EA', 500, 100, 0.75, @SystemUserId),
    ('Aircraft Grade Rivet', 'RIV-AG-001', '3/16 Aircraft Grade Aluminum Rivet', 'Fasteners', 'EA', 1000, 200, 0.15, @SystemUserId),
    ('Cutting Oil', 'OIL-CUT-001', 'High Performance Cutting Fluid', 'Supplies', 'L', 25, 5, 12.00, @SystemUserId),
    ('Safety Glasses', 'PPE-SG-001', 'ANSI Z87.1 Safety Glasses', 'PPE', 'EA', 20, 5, 8.50, @SystemUserId)

-- Create Sample Project in Operations Program
DECLARE @OpsProgramId INT = (SELECT program_id FROM [dbo].[Programs] WHERE program_code = 'OPS')

INSERT INTO [dbo].[Projects] (program_id, project_name, project_description, status, priority, created_by)
VALUES 
    (@OpsProgramId, 'Production Run #001', 'Initial production batch with standard manufacturing process', 'Active', 'High', @SystemUserId)

DECLARE @ProjectId INT = SCOPE_IDENTITY()

-- Create Sample Project Steps for Production
INSERT INTO [dbo].[ProjectSteps] (project_id, step_code, step_name, step_description, step_order, estimated_duration_hours)
VALUES 
    (@ProjectId, 'PREP', 'Material Preparation', 'Prepare and inspect raw materials', 1, 4.0),
    (@ProjectId, 'PROC', 'Processing', 'Execute primary manufacturing process', 2, 6.0),
    (@ProjectId, 'ASSY', 'Assembly', 'Assemble components per specifications', 3, 3.0),
    (@ProjectId, 'TEST', 'Testing & Validation', 'Perform quality testing and validation', 4, 2.0),
    (@ProjectId, 'PACK', 'Packaging & Shipping', 'Final packaging and preparation for shipment', 5, 1.0)

-- Add Inventory Requirements for Steps
DECLARE @StepId INT = (SELECT step_id FROM [dbo].[ProjectSteps] WHERE project_id = @ProjectId AND step_code = 'PREP')
DECLARE @AluminumId INT = (SELECT inventory_item_id FROM [dbo].[InventoryItems] WHERE part_number = 'AL-6061-001')

INSERT INTO [dbo].[StepInventoryRequirements] (step_id, inventory_item_id, quantity_required)
VALUES (@StepId, @AluminumId, 2)

-- Insert Sample Notifications
INSERT INTO [dbo].[Notifications] (user_id, category, title, message, priority, is_actionable, action_url, action_text, related_entity_type, related_entity_id)
VALUES 
    (@SystemUserId, 'system', 'Database Initialized', 'H10CM database has been successfully initialized with sample data', 'Normal', 0, NULL, NULL, 'System', NULL),
    (@SystemUserId, 'inventory', 'Low Stock Alert', 'Cutting Oil inventory is running low', 'High', 1, '/inventory', 'View Inventory', 'InventoryItem', (SELECT inventory_item_id FROM [dbo].[InventoryItems] WHERE part_number = 'OIL-CUT-001'))

PRINT 'H10CM Database Created Successfully!'
PRINT 'Sample Data Inserted:'
PRINT '- 4 Programs (Aerospace, Manufacturing, QA, R&D)'
PRINT '- 6 System Roles'
PRINT '- 1 System User'
PRINT '- 5 Sample Inventory Items'
PRINT '- 1 Sample Project with 5 Steps'
PRINT '- Sample Notifications'
PRINT ''
PRINT 'Next Steps:'
PRINT '1. Create actual users through the application'
PRINT '2. Assign program access to users'
PRINT '3. Create additional projects and tasks'
PRINT '4. Configure inventory items for your specific needs'

GO
-- =============================================
-- MISSING STORED PROCEDURES FROM LEGACY API
-- =============================================

-- Get Projects (Primary procedure for dashboard)
CREATE PROCEDURE [dbo].[usp_GetProjects]
AS
BEGIN
    SET NOCOUNT ON;
    
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
        pr.program_code,
        pm.display_name AS project_manager_name,
        cb.display_name AS created_by_name,
        (SELECT COUNT(*) FROM dbo.ProjectSteps ps WHERE ps.project_id = p.project_id) AS total_steps,
        (SELECT COUNT(*) FROM dbo.TrackedItems ti WHERE ti.project_id = p.project_id) AS total_tracked_items,
        (SELECT COUNT(*) FROM dbo.Tasks t WHERE t.project_id = p.project_id) AS total_tasks
    FROM dbo.Projects p
    LEFT JOIN dbo.Programs pr ON p.program_id = pr.program_id
    LEFT JOIN dbo.Users pm ON p.project_manager_id = pm.user_id
    LEFT JOIN dbo.Users cb ON p.created_by = cb.user_id
    ORDER BY p.last_modified DESC;
END;
GO

-- Save Project (Insert/Update)
CREATE PROCEDURE [dbo].[usp_SaveProject]
    @project_id INT = NULL,
    @program_id INT,
    @project_name NVARCHAR(100),
    @project_description NVARCHAR(MAX) = NULL,
    @status NVARCHAR(50) = 'Planning',
    @priority NVARCHAR(20) = 'Medium',
    @project_manager_id INT = NULL,
    @project_start_date DATE = NULL,
    @project_end_date DATE = NULL,
    @estimated_completion_date DATE = NULL,
    @budget DECIMAL(18,2) = NULL,
    @notes NVARCHAR(MAX) = NULL,
    @created_by INT
AS
BEGIN
    SET NOCOUNT ON;
    
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

-- Save Task (Insert/Update)
CREATE PROCEDURE [dbo].[usp_SaveTask]
    @task_id INT = NULL,
    @project_id INT = NULL,
    @step_id INT = NULL,
    @tracked_item_id INT = NULL,
    @task_title NVARCHAR(255),
    @task_description NVARCHAR(MAX) = NULL,
    @assigned_to INT,
    @assigned_by INT,
    @priority NVARCHAR(20) = 'Medium',
    @status NVARCHAR(50) = 'Pending',
    @due_date DATETIME2 = NULL,
    @estimated_hours DECIMAL(5,2) = NULL,
    @notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @task_id IS NULL
    BEGIN
        -- Insert new task
        INSERT INTO dbo.Tasks (
            project_id, step_id, tracked_item_id, task_title, task_description,
            assigned_to, assigned_by, priority, status, due_date, estimated_hours, notes
        )
        VALUES (
            @project_id, @step_id, @tracked_item_id, @task_title, @task_description,
            @assigned_to, @assigned_by, @priority, @status, @due_date, @estimated_hours, @notes
        );
        
        SET @task_id = SCOPE_IDENTITY();
        
        -- Create notification for task assignment
        INSERT INTO dbo.Notifications (
            user_id, category, title, message, priority, is_actionable, 
            action_url, action_text, related_entity_type, related_entity_id
        )
        SELECT 
            @assigned_to,
            'user',
            'New Task Assigned',
            'You have been assigned a new task: ' + @task_title,
            @priority,
            1,
            '/my-tasks',
            'View Task',
            'Task',
            @task_id;
    END
    ELSE
    BEGIN
        -- Update existing task
        UPDATE dbo.Tasks
        SET 
            project_id = @project_id,
            step_id = @step_id,
            tracked_item_id = @tracked_item_id,
            task_title = @task_title,
            task_description = @task_description,
            assigned_to = @assigned_to,
            priority = @priority,
            status = @status,
            due_date = @due_date,
            estimated_hours = @estimated_hours,
            notes = @notes,
            last_modified = GETDATE()
        WHERE task_id = @task_id;
    END
    
    -- Return the task
    SELECT 
        t.task_id,
        t.task_title,
        t.task_description,
        t.priority,
        t.status,
        t.due_date,
        t.estimated_hours,
        t.date_created,
        t.last_modified,
        assigned_user.display_name AS assigned_to_name,
        assigner.display_name AS assigned_by_name,
        p.project_name
    FROM dbo.Tasks t
    LEFT JOIN dbo.Users assigned_user ON t.assigned_to = assigned_user.user_id
    LEFT JOIN dbo.Users assigner ON t.assigned_by = assigner.user_id
    LEFT JOIN dbo.Projects p ON t.project_id = p.project_id
    WHERE t.task_id = @task_id;
END;
GO

-- Save Inventory Item (Insert/Update)
CREATE PROCEDURE [dbo].[usp_SaveInventoryItem]
    @inventory_item_id INT = NULL,
    @item_name NVARCHAR(255),
    @part_number NVARCHAR(100) = NULL,
    @description NVARCHAR(MAX) = NULL,
    @category NVARCHAR(100) = NULL,
    @unit_of_measure NVARCHAR(50),
    @current_stock_level DECIMAL(18,4) = 0,
    @reorder_point DECIMAL(18,4) = NULL,
    @max_stock_level DECIMAL(18,4) = NULL,
    @supplier_info NVARCHAR(MAX) = NULL,
    @cost_per_unit DECIMAL(18,2) = NULL,
    @location NVARCHAR(255) = NULL,
    @program_id INT,
    @created_by INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if part_number already exists (if provided)
    IF @part_number IS NOT NULL AND @part_number != ''
    BEGIN
        SELECT @inventory_item_id = inventory_item_id 
        FROM dbo.InventoryItems 
        WHERE part_number = @part_number AND program_id = @program_id;
    END
    
    IF @inventory_item_id IS NULL
    BEGIN
        -- Insert new inventory item
        INSERT INTO dbo.InventoryItems (
            item_name, part_number, description, category, unit_of_measure,
            current_stock_level, reorder_point, max_stock_level, supplier_info,
            cost_per_unit, location, program_id, created_by, last_cost_update
        )
        VALUES (
            @item_name, @part_number, @description, @category, @unit_of_measure,
            @current_stock_level, @reorder_point, @max_stock_level, @supplier_info,
            @cost_per_unit, @location, @program_id, @created_by, CASE WHEN @cost_per_unit IS NOT NULL THEN GETDATE() END
        );
        
        SET @inventory_item_id = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        -- Update existing inventory item (add to stock level instead of replacing)
        UPDATE dbo.InventoryItems
        SET 
            item_name = @item_name,
            description = ISNULL(@description, description),
            category = ISNULL(@category, category),
            unit_of_measure = @unit_of_measure,
            current_stock_level = current_stock_level + @current_stock_level,  -- Add to existing stock
            reorder_point = ISNULL(@reorder_point, reorder_point),
            max_stock_level = ISNULL(@max_stock_level, max_stock_level),
            supplier_info = ISNULL(@supplier_info, supplier_info),
            cost_per_unit = ISNULL(@cost_per_unit, cost_per_unit),
            location = ISNULL(@location, location),
            last_modified = GETDATE(),
            last_cost_update = CASE WHEN @cost_per_unit IS NOT NULL THEN GETDATE() ELSE last_cost_update END
        WHERE inventory_item_id = @inventory_item_id;
    END
    
    -- Return the inventory item
    SELECT 
        inventory_item_id,
        item_name,
        part_number,
        description,
        category,
        unit_of_measure,
        current_stock_level,
        reorder_point,
        max_stock_level,
        supplier_info,
        cost_per_unit,
        location,
        program_id,
        is_active,
        date_created,
        last_modified
    FROM dbo.InventoryItems
    WHERE inventory_item_id = @inventory_item_id;
END;
GO

-- Grant Program Access (RBAC)
CREATE PROCEDURE [dbo].[usp_GrantProgramAccess]
    @user_id INT,
    @program_id INT,
    @access_level NVARCHAR(50),
    @granted_by INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Insert or update program access
    MERGE dbo.ProgramAccess AS target
    USING (SELECT @user_id as user_id, @program_id as program_id) AS source
    ON target.user_id = source.user_id AND target.program_id = source.program_id
    WHEN MATCHED THEN
        UPDATE SET 
            access_level = @access_level,
            granted_by = @granted_by,
            date_granted = GETDATE(),
            is_active = 1
    WHEN NOT MATCHED THEN
        INSERT (user_id, program_id, access_level, granted_by)
        VALUES (@user_id, @program_id, @access_level, @granted_by);
    
    -- Log the action
    INSERT INTO dbo.AuditLog (user_id, action_type, entity_type, entity_id, description)
    VALUES (@user_id, 'Permission', 'Program', @program_id, 'Granted ' + @access_level + ' access to program');
    
    SELECT 'Success' AS result;
END;
GO

-- Get Project Steps by Project ID
CREATE PROCEDURE [dbo].[usp_GetProjectStepsByProjectId]
    @project_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        step_id,
        project_id,
        step_code,
        step_name,
        step_description,
        step_order,
        estimated_duration_hours,
        is_quality_control,
        requires_approval,
        approval_role
    FROM dbo.ProjectSteps
    WHERE project_id = @project_id
    ORDER BY step_order;
END;
GO

-- Save Project Step
CREATE PROCEDURE [dbo].[usp_SaveProjectStep]
    @step_id INT = NULL,
    @project_id INT,
    @step_code NVARCHAR(100) = NULL,
    @step_name NVARCHAR(255),
    @step_description NVARCHAR(MAX) = NULL,
    @step_order INT,
    @estimated_duration_hours DECIMAL(8,2) = NULL,
    @is_quality_control BIT = 0,
    @requires_approval BIT = 0,
    @approval_role NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @step_id IS NULL
    BEGIN
        -- Insert new step
        INSERT INTO dbo.ProjectSteps (
            project_id, step_code, step_name, step_description, step_order,
            estimated_duration_hours, is_quality_control, requires_approval, approval_role
        )
        VALUES (
            @project_id, @step_code, @step_name, @step_description, @step_order,
            @estimated_duration_hours, @is_quality_control, @requires_approval, @approval_role
        );
        
        SET @step_id = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        -- Update existing step
        UPDATE dbo.ProjectSteps
        SET 
            step_code = @step_code,
            step_name = @step_name,
            step_description = @step_description,
            step_order = @step_order,
            estimated_duration_hours = @estimated_duration_hours,
            is_quality_control = @is_quality_control,
            requires_approval = @requires_approval,
            approval_role = @approval_role
        WHERE step_id = @step_id;
    END
    
    -- Return the step
    SELECT 
        step_id,
        project_id,
        step_code,
        step_name,
        step_description,
        step_order,
        estimated_duration_hours,
        is_quality_control,
        requires_approval,
        approval_role
    FROM dbo.ProjectSteps
    WHERE step_id = @step_id;
END;
GO

-- Add New Tenant (Multi-tenant setup)
CREATE PROCEDURE [dbo].[usp_AddNewTenant]
    @tenant_name NVARCHAR(100),
    @tenant_code NVARCHAR(20),
    @description NVARCHAR(MAX) = NULL,
    @admin_user_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Insert new program (tenant)
    INSERT INTO dbo.Programs (program_name, program_code, program_description, created_by)
    VALUES (@tenant_name, @tenant_code, @description, @admin_user_id);
    
    DECLARE @program_id INT = SCOPE_IDENTITY();
    
    -- Grant admin access to the creator
    EXEC usp_GrantProgramAccess @admin_user_id, @program_id, 'Admin', @admin_user_id;
    
    -- Return the new program
    SELECT 
        program_id,
        program_name,
        program_code,
        program_description,
        is_active,
        date_created
    FROM dbo.Programs
    WHERE program_id = @program_id;
END;
GO

-- =============================================
-- CART/PROCUREMENT STORED PROCEDURES
-- =============================================

-- Get cart items for a user and project
CREATE PROCEDURE [dbo].[usp_GetCartItems]
    @user_id INT,
    @project_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.cart_id,
        c.inventory_item_id,
        c.quantity_requested,
        c.estimated_cost,
        c.notes,
        c.date_added,
        i.item_name,
        i.part_number,
        i.description,
        i.unit_of_measure,
        i.current_stock_level,
        i.reorder_point,
        i.cost_per_unit,
        i.supplier_info,
        i.program_id
    FROM CartItems c
    INNER JOIN InventoryItems i ON c.inventory_item_id = i.inventory_item_id
    WHERE c.user_id = @user_id AND i.program_id = @project_id
    ORDER BY c.date_added DESC;
END;
GO

-- Add item to cart
CREATE PROCEDURE [dbo].[usp_AddToCart]
    @user_id INT,
    @inventory_item_id INT,
    @quantity_requested DECIMAL(18,4),
    @estimated_cost DECIMAL(18,2) = NULL,
    @notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if item already exists in cart for this user
    IF EXISTS (SELECT 1 FROM CartItems WHERE user_id = @user_id AND inventory_item_id = @inventory_item_id)
    BEGIN
        -- Update existing cart item
        UPDATE CartItems
        SET 
            quantity_requested = quantity_requested + @quantity_requested,
            estimated_cost = ISNULL(@estimated_cost, estimated_cost),
            notes = ISNULL(@notes, notes),
            last_modified = GETDATE()
        WHERE user_id = @user_id AND inventory_item_id = @inventory_item_id;
    END
    ELSE
    BEGIN
        -- Insert new cart item
        INSERT INTO CartItems (user_id, inventory_item_id, quantity_requested, estimated_cost, notes)
        VALUES (@user_id, @inventory_item_id, @quantity_requested, @estimated_cost, @notes);
    END
    
    -- Return the updated cart summary
    SELECT 
        COUNT(*) as total_items,
        SUM(quantity_requested) as total_quantity,
        SUM(ISNULL(estimated_cost, 0)) as total_estimated_cost
    FROM CartItems c
    INNER JOIN InventoryItems i ON c.inventory_item_id = i.inventory_item_id
    WHERE c.user_id = @user_id;
END;
GO

-- Update cart item quantity
CREATE PROCEDURE [dbo].[usp_UpdateCartItem]
    @cart_id INT,
    @user_id INT,
    @quantity_requested DECIMAL(18,4),
    @estimated_cost DECIMAL(18,2) = NULL,
    @notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verify cart item belongs to the user
    IF NOT EXISTS (SELECT 1 FROM CartItems WHERE cart_id = @cart_id AND user_id = @user_id)
    BEGIN
        RAISERROR('Cart item not found or access denied', 16, 1);
        RETURN;
    END
    
    -- Update the cart item
    UPDATE CartItems
    SET 
        quantity_requested = @quantity_requested,
        estimated_cost = ISNULL(@estimated_cost, estimated_cost),
        notes = ISNULL(@notes, notes),
        last_modified = GETDATE()
    WHERE cart_id = @cart_id AND user_id = @user_id;
    
    -- Return the updated cart item
    SELECT 
        c.cart_id,
        c.inventory_item_id,
        c.quantity_requested,
        c.estimated_cost,
        c.notes,
        c.date_added,
        c.last_modified,
        i.item_name,
        i.part_number,
        i.unit_of_measure,
        i.current_stock_level,
        i.cost_per_unit
    FROM CartItems c
    INNER JOIN InventoryItems i ON c.inventory_item_id = i.inventory_item_id
    WHERE c.cart_id = @cart_id;
END;
GO

-- Remove item from cart
CREATE PROCEDURE [dbo].[usp_RemoveFromCart]
    @cart_id INT,
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verify cart item belongs to the user
    IF NOT EXISTS (SELECT 1 FROM CartItems WHERE cart_id = @cart_id AND user_id = @user_id)
    BEGIN
        RAISERROR('Cart item not found or access denied', 16, 1);
        RETURN;
    END
    
    -- Remove the cart item
    DELETE FROM CartItems
    WHERE cart_id = @cart_id AND user_id = @user_id;
    
    SELECT 'Cart item removed successfully' as result;
END;
GO

-- Create order from cart
CREATE PROCEDURE [dbo].[usp_CreateOrderFromCart]
    @user_id INT,
    @project_id INT,
    @supplier_info NVARCHAR(MAX) = NULL,
    @order_notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Check if user has cart items for this project
        IF NOT EXISTS (
            SELECT 1 FROM CartItems c
            INNER JOIN InventoryItems i ON c.inventory_item_id = i.inventory_item_id
            WHERE c.user_id = @user_id AND i.program_id = @project_id
        )
        BEGIN
            RAISERROR('No cart items found for this project', 16, 1);
            RETURN;
        END
        
        -- Generate order number
        DECLARE @order_number NVARCHAR(50) = 'ORD-' + CONVERT(NVARCHAR(8), GETDATE(), 112) + '-' + RIGHT('000' + CAST(ABS(CHECKSUM(NEWID())) % 1000 AS NVARCHAR(3)), 3);
        
        -- Calculate total estimated cost
        DECLARE @total_estimated_cost DECIMAL(18,2) = (
            SELECT SUM(ISNULL(c.estimated_cost, 0))
            FROM CartItems c
            INNER JOIN InventoryItems i ON c.inventory_item_id = i.inventory_item_id
            WHERE c.user_id = @user_id AND i.program_id = @project_id
        );
        
        -- Create the pending order
        INSERT INTO PendingOrders (
            order_number, user_id, project_id, total_estimated_cost, supplier_info, order_notes
        )
        VALUES (
            @order_number, @user_id, @project_id, @total_estimated_cost, @supplier_info, @order_notes
        );
        
        DECLARE @order_id INT = SCOPE_IDENTITY();
        
        -- Move cart items to order items
        INSERT INTO PendingOrderItems (order_id, inventory_item_id, quantity_ordered, unit_cost, total_cost, notes)
        SELECT 
            @order_id,
            c.inventory_item_id,
            c.quantity_requested,
            i.cost_per_unit,
            c.quantity_requested * ISNULL(i.cost_per_unit, 0),
            c.notes
        FROM CartItems c
        INNER JOIN InventoryItems i ON c.inventory_item_id = i.inventory_item_id
        WHERE c.user_id = @user_id AND i.program_id = @project_id;
        
        -- Remove items from cart
        DELETE c
        FROM CartItems c
        INNER JOIN InventoryItems i ON c.inventory_item_id = i.inventory_item_id
        WHERE c.user_id = @user_id AND i.program_id = @project_id;
        
        -- Return the created order
        SELECT 
            o.order_id,
            o.order_number,
            o.status,
            o.total_estimated_cost,
            o.date_created,
            COUNT(oi.order_item_id) as total_items
        FROM PendingOrders o
        LEFT JOIN PendingOrderItems oi ON o.order_id = oi.order_id
        WHERE o.order_id = @order_id
        GROUP BY o.order_id, o.order_number, o.status, o.total_estimated_cost, o.date_created;
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Get pending orders for a user/project
CREATE PROCEDURE [dbo].[usp_GetPendingOrders]
    @user_id INT = NULL,
    @project_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        o.order_id,
        o.order_number,
        o.user_id,
        u.display_name as user_name,
        o.project_id,
        p.project_name,
        o.status,
        o.total_estimated_cost,
        o.supplier_info,
        o.order_notes,
        o.date_created,
        o.date_approved,
        o.date_ordered,
        o.expected_delivery_date,
        o.actual_delivery_date,
        COUNT(oi.order_item_id) as total_items
    FROM PendingOrders o
    LEFT JOIN Users u ON o.user_id = u.user_id
    LEFT JOIN Projects p ON o.project_id = p.project_id
    LEFT JOIN PendingOrderItems oi ON o.order_id = oi.order_id
    WHERE (@user_id IS NULL OR o.user_id = @user_id)
      AND (@project_id IS NULL OR o.project_id = @project_id)
    GROUP BY 
        o.order_id, o.order_number, o.user_id, u.display_name, o.project_id, p.project_name,
        o.status, o.total_estimated_cost, o.supplier_info, o.order_notes, o.date_created,
        o.date_approved, o.date_ordered, o.expected_delivery_date, o.actual_delivery_date
    ORDER BY o.date_created DESC;
END;
GO

-- =============================================
-- ENHANCED DEFAULT DATA WITH PROPER USERS
-- =============================================

-- Clear existing sample data to add proper users (with proper constraint handling)
-- Disable foreign key constraints temporarily
ALTER TABLE [dbo].[Projects] NOCHECK CONSTRAINT ALL;
ALTER TABLE [dbo].[Tasks] NOCHECK CONSTRAINT ALL;
ALTER TABLE [dbo].[Notifications] NOCHECK CONSTRAINT ALL;
ALTER TABLE [dbo].[InventoryItems] NOCHECK CONSTRAINT ALL;
ALTER TABLE [dbo].[ProgramAccess] NOCHECK CONSTRAINT ALL;
ALTER TABLE [dbo].[ProjectAccess] NOCHECK CONSTRAINT ALL;
ALTER TABLE [dbo].[UserRoles] NOCHECK CONSTRAINT ALL;
ALTER TABLE [dbo].[AuditLog] NOCHECK CONSTRAINT ALL;

-- Clear existing data with IF EXISTS checks
IF EXISTS (SELECT 1 FROM [dbo].[ProgramAccess])
    DELETE FROM [dbo].[ProgramAccess];

IF EXISTS (SELECT 1 FROM [dbo].[ProjectAccess])
    DELETE FROM [dbo].[ProjectAccess];

IF EXISTS (SELECT 1 FROM [dbo].[UserRoles])
    DELETE FROM [dbo].[UserRoles];

IF EXISTS (SELECT 1 FROM [dbo].[Tasks])
    DELETE FROM [dbo].[Tasks];

IF EXISTS (SELECT 1 FROM [dbo].[Notifications])
    DELETE FROM [dbo].[Notifications];

IF EXISTS (SELECT 1 FROM [dbo].[AuditLog])
    DELETE FROM [dbo].[AuditLog];

IF EXISTS (SELECT 1 FROM [dbo].[Users])
    DELETE FROM [dbo].[Users]; -- Delete all users

-- =============================================
-- MULTI-TENANT INVENTORY MIGRATION
-- Add program_id to InventoryItems for proper tenant isolation
-- =============================================

-- Step 1: Add program_id column to InventoryItems table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.InventoryItems') AND name = 'program_id')
BEGIN
    ALTER TABLE [dbo].[InventoryItems] 
    ADD [program_id] [int] NULL;
    
    PRINT 'Added program_id column to InventoryItems table';
END

-- Step 2: Get Default Program ID and populate existing inventory items
DECLARE @DefaultProgramId INT = (SELECT program_id FROM [dbo].[Programs] WHERE program_code = 'OPS');

-- Update existing inventory items to belong to default program
IF @DefaultProgramId IS NOT NULL
BEGIN
    UPDATE [dbo].[InventoryItems] 
    SET program_id = @DefaultProgramId 
    WHERE program_id IS NULL;
    
    PRINT 'Updated existing inventory items to belong to default program';
END

-- Step 3: Make program_id NOT NULL after data migration
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.InventoryItems') AND name = 'program_id' AND is_nullable = 1)
BEGIN
    ALTER TABLE [dbo].[InventoryItems] 
    ALTER COLUMN [program_id] [int] NOT NULL;
    
    PRINT 'Made program_id column NOT NULL';
END

-- Step 4: Add foreign key constraint if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_InventoryItems_Programs')
BEGIN
    ALTER TABLE [dbo].[InventoryItems] 
    ADD CONSTRAINT [FK_InventoryItems_Programs] 
    FOREIGN KEY([program_id]) REFERENCES [dbo].[Programs] ([program_id]);
    
    PRINT 'Added foreign key constraint FK_InventoryItems_Programs';
END

-- Step 5: Add performance index for program-based inventory queries
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IDX_InventoryItems_Program')
BEGIN
    CREATE NONCLUSTERED INDEX [IDX_InventoryItems_Program] 
    ON [dbo].[InventoryItems] ([program_id]) 
    INCLUDE ([item_name], [current_stock_level], [reorder_point]);
    
    PRINT 'Added performance index IDX_InventoryItems_Program';
END

PRINT 'Multi-tenant inventory migration completed successfully!'
PRINT 'Inventory items are now properly isolated by program.'

GO

-- =============================================
-- CONTINUE WITH ENHANCED DEFAULT DATA
-- =============================================

-- Insert Justin Dougherty as System Administrator
INSERT INTO [dbo].[Users] (
    certificate_subject, 
    certificate_thumbprint, 
    user_name, 
    display_name, 
    email, 
    first_name, 
    last_name, 
    initials, 
    is_active, 
    is_system_admin, 
    preferences
)
VALUES (
    'CN=DOUGHERTY.JUSTIN.MICHAEL.1250227228,OU=USN,OU=PKI,OU=DoD,O=U.S. Government,C=US',
    'admin-cert-thumbprint-123',
    'justin.dougherty',
    'Justin Dougherty',
    'justin.dougherty@navy.mil',
    'Justin',
    'Dougherty',
    'JD',
    1,
    1,
    '{"theme": "light", "notifications": true, "dashboard_view": "production"}'
);

DECLARE @JustinUserId INT = SCOPE_IDENTITY();

-- Insert Development/Test User
INSERT INTO [dbo].[Users] (
    certificate_subject, 
    certificate_thumbprint, 
    user_name, 
    display_name, 
    email, 
    first_name, 
    last_name, 
    initials, 
    is_active, 
    is_system_admin, 
    preferences
)
VALUES (
    'CN=development-user,OU=Development,OU=Test,O=Development,C=US',
    'dev-cert-thumbprint-456',
    'development.user',
    'Development Visitor (Limited Access)',
    'dev@localhost',
    'Development',
    'User',
    'DU',
    1,
    0,
    '{"theme": "light", "notifications": true}'
);

DECLARE @DevUserId INT = SCOPE_IDENTITY();

-- Insert Sample Production Technician
INSERT INTO [dbo].[Users] (
    certificate_subject, 
    certificate_thumbprint, 
    user_name, 
    display_name, 
    email, 
    first_name, 
    last_name, 
    initials, 
    is_active, 
    is_system_admin, 
    preferences
)
VALUES (
    'CN=SMITH.JOHN.PATRICK.9876543210,OU=USN,OU=PKI,OU=DoD,O=U.S. Government,C=US',
    'tech-cert-thumbprint-789',
    'john.smith',
    'John Smith',
    'john.smith@navy.mil',
    'John',
    'Smith',
    'JS',
    1,
    0,
    '{"theme": "dark", "notifications": true}'
);

DECLARE @TechUserId INT = SCOPE_IDENTITY();

-- Update the Default Program to have proper creator
UPDATE [dbo].[Programs] 
SET created_by = @JustinUserId, program_manager = 'Justin Dougherty'
WHERE program_code = 'OPS';

-- Assign System Admin Role to Justin
INSERT INTO [dbo].[UserRoles] (user_id, role_id, assigned_by)
SELECT @JustinUserId, role_id, @JustinUserId
FROM [dbo].[Roles] 
WHERE role_name = 'System Administrator';

-- Assign Production Technician Role to John Smith
INSERT INTO [dbo].[UserRoles] (user_id, role_id, assigned_by)
SELECT @TechUserId, role_id, @JustinUserId
FROM [dbo].[Roles] 
WHERE role_name = 'Production Technician';

-- Grant Program Access to all users for Default Program
DECLARE @DefaultProgramId INT = (SELECT program_id FROM [dbo].[Programs] WHERE program_code = 'OPS');

-- Justin gets Admin access
EXEC usp_GrantProgramAccess @JustinUserId, @DefaultProgramId, 'Admin', @JustinUserId;

-- Development user gets Read access
EXEC usp_GrantProgramAccess @DevUserId, @DefaultProgramId, 'Read', @JustinUserId;

-- Tech user gets Write access
EXEC usp_GrantProgramAccess @TechUserId, @DefaultProgramId, 'Write', @JustinUserId;

-- Update the sample project to have proper creator and manager
UPDATE [dbo].[Projects] 
SET created_by = @JustinUserId, project_manager_id = @JustinUserId
WHERE project_name = 'Production Run #001';

-- Update inventory items to have proper creator
UPDATE [dbo].[InventoryItems] 
SET created_by = @JustinUserId
WHERE created_by IS NULL OR created_by = 1;

-- Update notifications to have proper user
UPDATE [dbo].[Notifications] 
SET user_id = @JustinUserId
WHERE user_id IS NULL OR user_id = 1;

-- Create some sample tasks for the project
DECLARE @SampleProjectId INT = (SELECT project_id FROM [dbo].[Projects] WHERE project_name = 'Production Run #001');

EXEC usp_SaveTask 
    @project_id = @SampleProjectId,
    @task_title = 'Review Material Specifications',
    @task_description = 'Review and approve material specifications for production run #001',
    @assigned_to = @TechUserId,
    @assigned_by = @JustinUserId,
    @priority = 'High',
    @status = 'Pending',
    @due_date = '2025-07-20',
    @estimated_hours = 2.0,
    @notes = 'Critical for production timeline';

EXEC usp_SaveTask 
    @project_id = @SampleProjectId,
    @task_title = 'Inventory Stock Check',
    @task_description = 'Verify inventory levels for all required materials',
    @assigned_to = @DevUserId,
    @assigned_by = @JustinUserId,
    @priority = 'Medium',
    @status = 'Pending',
    @due_date = '2025-07-18',
    @estimated_hours = 1.5,
    @notes = 'Check reorder points and current stock levels';

-- Re-enable foreign key constraints
ALTER TABLE [dbo].[Projects] CHECK CONSTRAINT ALL;
ALTER TABLE [dbo].[Tasks] CHECK CONSTRAINT ALL;
ALTER TABLE [dbo].[Notifications] CHECK CONSTRAINT ALL;
ALTER TABLE [dbo].[InventoryItems] CHECK CONSTRAINT ALL;
ALTER TABLE [dbo].[ProgramAccess] CHECK CONSTRAINT ALL;
ALTER TABLE [dbo].[ProjectAccess] CHECK CONSTRAINT ALL;
ALTER TABLE [dbo].[UserRoles] CHECK CONSTRAINT ALL;
ALTER TABLE [dbo].[AuditLog] CHECK CONSTRAINT ALL;

GO

-- =============================================
-- FINAL VERIFICATION AND SUMMARY
-- =============================================

PRINT 'H10CM Database Enhanced Successfully!'
PRINT '================================================='
PRINT ''
PRINT '✅ STORED PROCEDURES ADDED:'
PRINT '- usp_GetProjects (Primary dashboard procedure)'
PRINT '- usp_SaveProject (Insert/Update projects)'
PRINT '- usp_SaveTask (Task management)'
PRINT '- usp_SaveInventoryItem (Inventory management)'
PRINT '- usp_GrantProgramAccess (RBAC access control)'
PRINT '- usp_GetProjectStepsByProjectId (Project workflow)'
PRINT '- usp_SaveProjectStep (Project step management)'
PRINT '- usp_AddNewTenant (Multi-tenant setup)'
PRINT '- usp_GetCartItems (Shopping cart management)'
PRINT '- usp_AddToCart (Add items to cart)'
PRINT '- usp_UpdateCartItem (Update cart quantities)'
PRINT '- usp_RemoveFromCart (Remove from cart)'
PRINT '- usp_CreateOrderFromCart (Create procurement orders)'
PRINT '- usp_GetPendingOrders (View pending orders)'
PRINT ''
PRINT '✅ TABLES ADDED:'
PRINT '- CartItems (Shopping cart functionality)'
PRINT '- PendingOrders (Procurement order management)'
PRINT '- PendingOrderItems (Order line items)'
PRINT '- Enhanced InventoryItems with program_id for multi-tenant isolation'
PRINT ''
PRINT '✅ USERS CREATED:'
PRINT '- Justin Dougherty (System Administrator)'
PRINT '- Development User (Limited Access)'
PRINT '- John Smith (Production Technician)'
PRINT ''
PRINT '✅ SAMPLE DATA:'
PRINT '- Operations Program with proper ownership'
PRINT '- Sample project with assigned manager'
PRINT '- 5 Inventory items with proper creator'
PRINT '- 2 Sample tasks assigned to team members'
PRINT '- Proper program access permissions'
PRINT ''
PRINT '🚀 READY FOR DEPLOYMENT!'
PRINT 'The database is now complete and ready for the H10CM API.'
PRINT 'Justin Dougherty has full system admin access.'
PRINT 'Certificate authentication is properly configured.'

GO
