-- ==============================================================================
-- 03_PROJECT_TABLES.SQL - H10CM PROJECT MANAGEMENT TABLES
-- ==============================================================================
-- This module creates the project management and workflow tables:
-- Projects, Tasks, ProjectSteps, TrackedItems, and related workflow tables.
-- 
-- DEPENDENCIES: 02_core_tables.sql
-- CREATES: Project management, task assignment, and production tracking tables
--
-- Author: H10CM Development Team
-- Created: 2025-07-20
-- Version: H10CM v2.1 Modular
-- ==============================================================================

USE H10CM;
GO

PRINT 'Creating project management and workflow tables...';

-- =============================================
-- CORE PROJECT MANAGEMENT TABLES
-- =============================================

-- Projects Table (Program-isolated project entities)
CREATE TABLE [dbo].[Projects](
    [project_id] [int] IDENTITY(1,1) NOT NULL,
    [program_id] [int] NOT NULL, -- CRITICAL: Multi-tenant isolation
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
) ON [PRIMARY];
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
) ON [PRIMARY];
GO

-- ProjectSteps Table (Workflow Step Definitions)
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
) ON [PRIMARY];
GO

-- TrackedItems Table (Production Units)
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
) ON [PRIMARY];
GO

-- TrackedItemStepProgress Table (Production Progress Tracking)
CREATE TABLE [dbo].[TrackedItemStepProgress](
    [item_step_progress_id] [int] IDENTITY(1,1) NOT NULL,
    [item_id] [int] NOT NULL,
    [step_id] [int] NOT NULL,
    [status] [nvarchar](50) NOT NULL DEFAULT 'Not Started',
    [assigned_to] [int] NULL,
    [date_started] [datetime2](7) NULL,
    [date_completed] [datetime2](7) NULL,
    [actual_duration_hours] [decimal](8, 2) NULL,
    [quality_passed] [bit] NULL,
    [approved_by] [int] NULL,
    [approval_date] [datetime2](7) NULL,
    [notes] [nvarchar](max) NULL,
    [last_modified] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_TrackedItemStepProgress] PRIMARY KEY CLUSTERED ([item_step_progress_id]),
    CONSTRAINT [UQ_TrackedItemStepProgress_ItemStep] UNIQUE ([item_id], [step_id])
) ON [PRIMARY];
GO

-- =============================================
-- ATTRIBUTE AND CONFIGURATION TABLES
-- =============================================

-- AttributeDefinitions Table (Project-specific attribute definitions)
CREATE TABLE [dbo].[AttributeDefinitions](
    [attribute_definition_id] [int] IDENTITY(1,1) NOT NULL,
    [project_id] [int] NOT NULL,
    [attribute_name] [nvarchar](255) NOT NULL,
    [attribute_type] [nvarchar](50) NOT NULL,
    [display_order] [int] NOT NULL,
    [is_required] [bit] NOT NULL,
    [is_auto_generated] [bit] NOT NULL DEFAULT 0,
    [default_value] [nvarchar](max) NULL,
    [validation_rules] [nvarchar](max) NULL, -- JSON
    CONSTRAINT [PK_AttributeDefinitions] PRIMARY KEY CLUSTERED ([attribute_definition_id]),
    CONSTRAINT [UQ_AttributeDefinitions_ProjectAttribute] UNIQUE ([project_id], [attribute_name])
) ON [PRIMARY];
GO

-- ItemAttributeValues Table (Tracked item attribute values)
CREATE TABLE [dbo].[ItemAttributeValues](
    [value_id] [int] IDENTITY(1,1) NOT NULL,
    [item_id] [int] NOT NULL,
    [attribute_definition_id] [int] NOT NULL,
    [attribute_value] [nvarchar](max) NULL,
    [date_set] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [set_by] [int] NULL,
    CONSTRAINT [PK_ItemAttributeValues] PRIMARY KEY CLUSTERED ([value_id]),
    CONSTRAINT [UQ_ItemAttributeValues_ItemAttribute] UNIQUE ([item_id], [attribute_definition_id])
) ON [PRIMARY];
GO

-- =============================================
-- NOTIFICATION AND AUDIT TABLES
-- =============================================

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
) ON [PRIMARY];
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
) ON [PRIMARY];
GO

-- Add foreign key constraints for project tables
ALTER TABLE [dbo].[Projects] ADD CONSTRAINT [FK_Projects_Programs] 
    FOREIGN KEY([program_id]) REFERENCES [dbo].[Programs] ([program_id]);

ALTER TABLE [dbo].[Projects] ADD CONSTRAINT [FK_Projects_Manager] 
    FOREIGN KEY([project_manager_id]) REFERENCES [dbo].[Users] ([user_id]);

ALTER TABLE [dbo].[Projects] ADD CONSTRAINT [FK_Projects_CreatedBy] 
    FOREIGN KEY([created_by]) REFERENCES [dbo].[Users] ([user_id]);

ALTER TABLE [dbo].[Tasks] ADD CONSTRAINT [FK_Tasks_Projects] 
    FOREIGN KEY([project_id]) REFERENCES [dbo].[Projects] ([project_id]);

ALTER TABLE [dbo].[Tasks] ADD CONSTRAINT [FK_Tasks_AssignedTo] 
    FOREIGN KEY([assigned_to]) REFERENCES [dbo].[Users] ([user_id]);

ALTER TABLE [dbo].[Tasks] ADD CONSTRAINT [FK_Tasks_AssignedBy] 
    FOREIGN KEY([assigned_by]) REFERENCES [dbo].[Users] ([user_id]);

ALTER TABLE [dbo].[ProjectSteps] ADD CONSTRAINT [FK_ProjectSteps_Projects] 
    FOREIGN KEY([project_id]) REFERENCES [dbo].[Projects] ([project_id]);

ALTER TABLE [dbo].[TrackedItems] ADD CONSTRAINT [FK_TrackedItems_Projects] 
    FOREIGN KEY([project_id]) REFERENCES [dbo].[Projects] ([project_id]);

ALTER TABLE [dbo].[TrackedItems] ADD CONSTRAINT [FK_TrackedItems_CreatedBy] 
    FOREIGN KEY([created_by]) REFERENCES [dbo].[Users] ([user_id]);

ALTER TABLE [dbo].[AttributeDefinitions] ADD CONSTRAINT [FK_AttributeDefinitions_Projects] 
    FOREIGN KEY([project_id]) REFERENCES [dbo].[Projects] ([project_id]);

PRINT 'Project management and workflow tables created successfully.';
PRINT '- Projects table (Program-isolated project entities)';
PRINT '- Tasks table (Task assignment workflow)';
PRINT '- ProjectSteps table (Workflow step definitions)';
PRINT '- TrackedItems table (Production units)';
PRINT '- TrackedItemStepProgress table (Production progress tracking)';
PRINT '- AttributeDefinitions table (Project-specific attributes)';
PRINT '- ItemAttributeValues table (Tracked item attributes)';
PRINT '- Notifications table (Smart notification system)';
PRINT '- AuditLog table (Comprehensive audit trail)';
PRINT 'Ready for inventory and procurement tables.';
PRINT '';
