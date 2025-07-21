-- ==============================================================================
-- 10_INDEXES_CONSTRAINTS.SQL - H10CM PERFORMANCE OPTIMIZATION
-- ==============================================================================
-- This module creates indexes and additional constraints for optimal performance
-- and data integrity in the H10CM production management system.
-- 
-- DEPENDENCIES: 09_sample_data.sql
-- CREATES: Performance indexes and integrity constraints
--
-- Author: H10CM Development Team
-- Created: 2025-07-20
-- Version: H10CM v2.1 Modular (Includes all latest fixes)
-- ==============================================================================

USE H10CM;
GO

PRINT 'Creating performance indexes and constraints...';

-- ==============================================================================
-- CORE TABLE INDEXES
-- ==============================================================================

-- Users table indexes
CREATE NONCLUSTERED INDEX IX_Users_CertificateSubject 
ON Users (certificate_subject);

CREATE NONCLUSTERED INDEX IX_Users_Email 
ON Users (email);

CREATE NONCLUSTERED INDEX IX_Users_Active 
ON Users (is_active) WHERE is_active = 1;

-- Programs table indexes
CREATE NONCLUSTERED INDEX IX_Programs_Name 
ON Programs (program_name);

CREATE NONCLUSTERED INDEX IX_Programs_Active 
ON Programs (is_active) WHERE is_active = 1;

-- ProgramAccess table indexes
CREATE NONCLUSTERED INDEX IX_ProgramAccess_UserId 
ON ProgramAccess (user_id);

CREATE NONCLUSTERED INDEX IX_ProgramAccess_ProgramId 
ON ProgramAccess (program_id);

CREATE NONCLUSTERED INDEX IX_ProgramAccess_AccessLevel 
ON ProgramAccess (access_level);

-- ==============================================================================
-- PROJECT MANAGEMENT INDEXES
-- ==============================================================================

-- Projects table indexes
CREATE NONCLUSTERED INDEX IX_Projects_ProgramId 
ON Projects (program_id);

CREATE NONCLUSTERED INDEX IX_Projects_Status 
ON Projects (status);

CREATE NONCLUSTERED INDEX IX_Projects_AssignedUserId 
ON Projects (project_manager_id);

CREATE NONCLUSTERED INDEX IX_Projects_CreatedBy 
ON Projects (created_by);

-- Tasks table indexes
CREATE NONCLUSTERED INDEX IX_Tasks_ProjectId 
ON Tasks (project_id);

CREATE NONCLUSTERED INDEX IX_Tasks_AssignedUserId 
ON Tasks (assigned_to);

CREATE NONCLUSTERED INDEX IX_Tasks_Status 
ON Tasks (status);

CREATE NONCLUSTERED INDEX IX_Tasks_Priority 
ON Tasks (priority);

CREATE NONCLUSTERED INDEX IX_Tasks_DueDate 
ON Tasks (due_date);

-- ProjectSteps table indexes
CREATE NONCLUSTERED INDEX IX_ProjectSteps_ProjectId 
ON ProjectSteps (project_id);

CREATE NONCLUSTERED INDEX IX_ProjectSteps_StepNumber 
ON ProjectSteps (step_number);

CREATE NONCLUSTERED INDEX IX_ProjectSteps_Status 
ON ProjectSteps (status);

-- TrackedItems table indexes
CREATE NONCLUSTERED INDEX IX_TrackedItems_ProjectId 
ON TrackedItems (project_id);

CREATE NONCLUSTERED INDEX IX_TrackedItems_Status 
ON TrackedItems (status);

-- ==============================================================================
-- INVENTORY MANAGEMENT INDEXES
-- ==============================================================================

-- InventoryItems table indexes
CREATE NONCLUSTERED INDEX IX_InventoryItems_ProgramId 
ON InventoryItems (program_id);

CREATE NONCLUSTERED INDEX IX_InventoryItems_ProjectId 
ON InventoryItems (project_id);

CREATE NONCLUSTERED INDEX IX_InventoryItems_PartNumber 
ON InventoryItems (part_number);

CREATE NONCLUSTERED INDEX IX_InventoryItems_Name 
ON InventoryItems (name);

CREATE NONCLUSTERED INDEX IX_InventoryItems_Quantity 
ON InventoryItems (quantity);

-- CartItems table indexes
CREATE NONCLUSTERED INDEX IX_CartItems_UserId 
ON CartItems (user_id);

CREATE NONCLUSTERED INDEX IX_CartItems_ProgramId 
ON CartItems (program_id);

CREATE NONCLUSTERED INDEX IX_CartItems_InventoryItemId 
ON CartItems (inventory_item_id);

-- PendingOrders table indexes
CREATE NONCLUSTERED INDEX IX_PendingOrders_ProgramId 
ON PendingOrders (program_id);

CREATE NONCLUSTERED INDEX IX_PendingOrders_ProjectId 
ON PendingOrders (project_id);

CREATE NONCLUSTERED INDEX IX_PendingOrders_Status 
ON PendingOrders (status);

CREATE NONCLUSTERED INDEX IX_PendingOrders_RequestedBy 
ON PendingOrders (requested_by_user_id);

CREATE NONCLUSTERED INDEX IX_PendingOrders_CreatedAt 
ON PendingOrders (created_at);

-- ==============================================================================
-- PROCUREMENT INDEXES
-- ==============================================================================

-- Vendors table indexes
CREATE NONCLUSTERED INDEX IX_Vendors_ProgramId 
ON Vendors (program_id);

CREATE NONCLUSTERED INDEX IX_ProcurementVendors_Name 
ON ProcurementVendors (vendor_name);

CREATE NONCLUSTERED INDEX IX_ProcurementVendors_Active 
ON ProcurementVendors (status) WHERE status = 'Active';

-- Sponsors table indexes
CREATE NONCLUSTERED INDEX IX_Sponsors_ProgramId 
ON Sponsors (program_id);

CREATE NONCLUSTERED INDEX IX_Sponsors_Name 
ON Sponsors (sponsor_name);

CREATE NONCLUSTERED INDEX IX_Sponsors_Active 
ON Sponsors (status) WHERE status = 'Active';

-- SponsorFunds table indexes
CREATE NONCLUSTERED INDEX IX_SponsorFunds_SponsorId 
ON SponsorFunds (sponsor_id);

CREATE NONCLUSTERED INDEX IX_SponsorFunds_ProgramId 
ON SponsorFunds (program_id);

CREATE NONCLUSTERED INDEX IX_SponsorFunds_Status 
ON SponsorFunds (status) WHERE status = 'Active';

-- ==============================================================================
-- AUDIT AND LOGGING INDEXES
-- ==============================================================================

-- ActivityLog table indexes (if exists)
IF OBJECT_ID('ActivityLog', 'U') IS NOT NULL
BEGIN
    CREATE NONCLUSTERED INDEX IX_ActivityLog_UserId 
    ON ActivityLog (user_id);
    
    CREATE NONCLUSTERED INDEX IX_ActivityLog_ProgramId 
    ON ActivityLog (program_id);
    
    CREATE NONCLUSTERED INDEX IX_ActivityLog_CreatedAt 
    ON ActivityLog (created_at);
    
    CREATE NONCLUSTERED INDEX IX_ActivityLog_ActivityType 
    ON ActivityLog (activity_type);
END

-- Notifications table indexes (if exists)
IF OBJECT_ID('Notifications', 'U') IS NOT NULL
BEGIN
    CREATE NONCLUSTERED INDEX IX_Notifications_UserId 
    ON Notifications (user_id);
    
    CREATE NONCLUSTERED INDEX IX_Notifications_ProgramId 
    ON Notifications (program_id);
    
    CREATE NONCLUSTERED INDEX IX_Notifications_IsRead 
    ON Notifications (is_read);
    
    CREATE NONCLUSTERED INDEX IX_Notifications_CreatedAt 
    ON Notifications (created_at);
END

-- ==============================================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ==============================================================================

-- Multi-tenant filtering composite indexes
CREATE NONCLUSTERED INDEX IX_Projects_Program_Status 
ON Projects (program_id, status) INCLUDE (name, description, assigned_user_id);

CREATE NONCLUSTERED INDEX IX_InventoryItems_Program_Project 
ON InventoryItems (program_id, project_id) INCLUDE (name, part_number, quantity);

CREATE NONCLUSTERED INDEX IX_Tasks_Project_Status_Priority 
ON Tasks (project_id, status, priority) INCLUDE (name, assigned_user_id, due_date);

CREATE NONCLUSTERED INDEX IX_PendingOrders_Program_Status 
ON PendingOrders (program_id, status) INCLUDE (project_id, inventory_item_id, quantity_ordered);

-- User access pattern indexes
CREATE NONCLUSTERED INDEX IX_ProgramAccess_User_Program 
ON ProgramAccess (user_id, program_id) INCLUDE (access_level);

-- Date range query optimization
CREATE NONCLUSTERED INDEX IX_CreatedAt_AllTables 
ON Projects (created_at);

CREATE NONCLUSTERED INDEX IX_UpdatedAt_AllTables 
ON InventoryItems (updated_at);

-- ==============================================================================
-- CHECK CONSTRAINTS
-- ==============================================================================

-- Access level constraints
ALTER TABLE ProgramAccess 
ADD CONSTRAINT CK_ProgramAccess_AccessLevel 
CHECK (access_level IN ('Read', 'Write', 'Admin'));

-- Task priority constraints
ALTER TABLE Tasks 
ADD CONSTRAINT CK_Tasks_Priority 
CHECK (priority IN ('Low', 'Medium', 'High', 'Critical'));

-- Task and project status constraints
ALTER TABLE Tasks 
ADD CONSTRAINT CK_Tasks_Status 
CHECK (status IN ('Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'));

ALTER TABLE Projects 
ADD CONSTRAINT CK_Projects_Status 
CHECK (status IN ('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'));

-- Quantity constraints
ALTER TABLE InventoryItems 
ADD CONSTRAINT CK_InventoryItems_Quantity 
CHECK (current_stock_level >= 0);

ALTER TABLE CartItems 
ADD CONSTRAINT CK_CartItems_Quantity 
CHECK (quantity_requested > 0);

ALTER TABLE PendingOrderItems 
ADD CONSTRAINT CK_PendingOrderItems_Quantity 
CHECK (quantity_ordered > 0);

-- Cost constraints
ALTER TABLE InventoryItems 
ADD CONSTRAINT CK_InventoryItems_UnitCost 
CHECK (cost_per_unit >= 0);

-- ==============================================================================
-- COMPLETION MESSAGE
-- ==============================================================================

PRINT 'Performance indexes created successfully.';
PRINT 'Data integrity constraints added.';
PRINT 'Database optimization complete.';
PRINT '';
PRINT '================================================';
PRINT 'H10CM MODULAR DATABASE CREATION COMPLETE!';
PRINT '================================================';
PRINT 'All modules have been successfully created:';
PRINT '  ✅ Database and Schema (01)';
PRINT '  ✅ Core RBAC Tables (02)';
PRINT '  ✅ Project Management Tables (03)';
PRINT '  ✅ Inventory Management Tables (04)';
PRINT '  ✅ Procurement Tables (05)';
PRINT '  ✅ Core Procedures (06)';
PRINT '  ✅ Business Procedures (07)';
PRINT '  ✅ Security Procedures (08)';
PRINT '  ✅ Sample Data (09)';
PRINT '  ✅ Performance Optimization (10)';
PRINT '';
PRINT 'Database is ready for production use!';
PRINT '================================================';
GO
