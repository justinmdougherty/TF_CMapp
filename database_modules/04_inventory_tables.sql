-- ==============================================================================
-- 04_INVENTORY_TABLES.SQL - H10CM INVENTORY AND CART MANAGEMENT TABLES
-- ==============================================================================
-- This module creates the inventory management, shopping cart, and order tracking
-- tables with proper multi-tenant isolation.
-- 
-- DEPENDENCIES: 03_project_tables.sql
-- CREATES: Inventory, cart, order management, and step requirements tables
--
-- Author: H10CM Development Team
-- Created: 2025-07-20
-- Version: H10CM v2.1 Modular
-- ==============================================================================

USE H10CM;
GO

PRINT 'Creating inventory management and cart tables...';

-- =============================================
-- CORE INVENTORY MANAGEMENT TABLES
-- =============================================

-- InventoryItems Table (Program-isolated inventory with multi-tenant support)
CREATE TABLE [dbo].[InventoryItems](
    [inventory_item_id] [int] IDENTITY(1,1) NOT NULL,
    [program_id] [int] NOT NULL, -- CRITICAL: Multi-tenant isolation
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
    CONSTRAINT [PK_InventoryItems] PRIMARY KEY CLUSTERED ([inventory_item_id]),
    CONSTRAINT [UQ_InventoryItems_PartNumber] UNIQUE ([part_number])
) ON [PRIMARY];
GO

-- StepInventoryRequirements Table (Links project steps to required inventory)
CREATE TABLE [dbo].[StepInventoryRequirements](
    [requirement_id] [int] IDENTITY(1,1) NOT NULL,
    [step_id] [int] NOT NULL,
    [inventory_item_id] [int] NOT NULL,
    [quantity_required] [decimal](18, 4) NOT NULL,
    [is_consumed] [bit] NOT NULL DEFAULT 1, -- Whether item is consumed or just used
    CONSTRAINT [PK_StepInventoryRequirements] PRIMARY KEY CLUSTERED ([requirement_id]),
    CONSTRAINT [UQ_StepInventoryRequirements_StepItem] UNIQUE ([step_id], [inventory_item_id])
) ON [PRIMARY];
GO

-- InventoryTransactions Table (Track all inventory movements)
CREATE TABLE [dbo].[InventoryTransactions](
    [transaction_id] [int] IDENTITY(1,1) NOT NULL,
    [inventory_item_id] [int] NOT NULL,
    [transaction_type] [nvarchar](50) NOT NULL, -- 'Adjustment', 'Usage', 'Receipt', 'Transfer'
    [quantity_change] [decimal](18, 4) NOT NULL, -- Positive for additions, negative for usage
    [new_stock_level] [decimal](18, 4) NOT NULL,
    [unit_cost] [decimal](18, 2) NULL,
    [total_cost] [decimal](18, 2) NULL,
    [transaction_date] [datetime2](7) NOT NULL DEFAULT GETDATE(),
    [performed_by] [int] NOT NULL,
    [reference_type] [nvarchar](50) NULL, -- 'Order', 'Task', 'Adjustment', etc.
    [reference_id] [int] NULL,
    [notes] [nvarchar](max) NULL,
    CONSTRAINT [PK_InventoryTransactions] PRIMARY KEY CLUSTERED ([transaction_id]),
    CONSTRAINT [CK_InventoryTransactions_Type] CHECK ([transaction_type] IN ('Adjustment', 'Usage', 'Receipt', 'Transfer'))
) ON [PRIMARY];
GO

-- =============================================
-- SHOPPING CART AND ORDER MANAGEMENT TABLES
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
) ON [PRIMARY];
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
) ON [PRIMARY];
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
) ON [PRIMARY];
GO

-- Add foreign key constraints for inventory tables
ALTER TABLE [dbo].[InventoryItems] ADD CONSTRAINT [FK_InventoryItems_Programs] 
    FOREIGN KEY([program_id]) REFERENCES [dbo].[Programs] ([program_id]);

ALTER TABLE [dbo].[InventoryItems] ADD CONSTRAINT [FK_InventoryItems_CreatedBy] 
    FOREIGN KEY([created_by]) REFERENCES [dbo].[Users] ([user_id]);

ALTER TABLE [dbo].[StepInventoryRequirements] ADD CONSTRAINT [FK_StepInventoryRequirements_Steps] 
    FOREIGN KEY([step_id]) REFERENCES [dbo].[ProjectSteps] ([step_id]);

ALTER TABLE [dbo].[StepInventoryRequirements] ADD CONSTRAINT [FK_StepInventoryRequirements_Inventory] 
    FOREIGN KEY([inventory_item_id]) REFERENCES [dbo].[InventoryItems] ([inventory_item_id]);

ALTER TABLE [dbo].[InventoryTransactions] ADD CONSTRAINT [FK_InventoryTransactions_Inventory] 
    FOREIGN KEY([inventory_item_id]) REFERENCES [dbo].[InventoryItems] ([inventory_item_id]);

ALTER TABLE [dbo].[InventoryTransactions] ADD CONSTRAINT [FK_InventoryTransactions_PerformedBy] 
    FOREIGN KEY([performed_by]) REFERENCES [dbo].[Users] ([user_id]);

ALTER TABLE [dbo].[CartItems] ADD CONSTRAINT [FK_CartItems_Users] 
    FOREIGN KEY([user_id]) REFERENCES [dbo].[Users] ([user_id]);

ALTER TABLE [dbo].[CartItems] ADD CONSTRAINT [FK_CartItems_Inventory] 
    FOREIGN KEY([inventory_item_id]) REFERENCES [dbo].[InventoryItems] ([inventory_item_id]);

ALTER TABLE [dbo].[PendingOrders] ADD CONSTRAINT [FK_PendingOrders_Users] 
    FOREIGN KEY([user_id]) REFERENCES [dbo].[Users] ([user_id]);

ALTER TABLE [dbo].[PendingOrders] ADD CONSTRAINT [FK_PendingOrders_Projects] 
    FOREIGN KEY([project_id]) REFERENCES [dbo].[Projects] ([project_id]);

ALTER TABLE [dbo].[PendingOrders] ADD CONSTRAINT [FK_PendingOrders_ApprovedBy] 
    FOREIGN KEY([approved_by]) REFERENCES [dbo].[Users] ([user_id]);

ALTER TABLE [dbo].[PendingOrders] ADD CONSTRAINT [FK_PendingOrders_OrderedBy] 
    FOREIGN KEY([ordered_by]) REFERENCES [dbo].[Users] ([user_id]);

ALTER TABLE [dbo].[PendingOrderItems] ADD CONSTRAINT [FK_PendingOrderItems_Orders] 
    FOREIGN KEY([order_id]) REFERENCES [dbo].[PendingOrders] ([order_id]);

ALTER TABLE [dbo].[PendingOrderItems] ADD CONSTRAINT [FK_PendingOrderItems_Inventory] 
    FOREIGN KEY([inventory_item_id]) REFERENCES [dbo].[InventoryItems] ([inventory_item_id]);

PRINT 'Inventory management and cart tables created successfully.';
PRINT '- InventoryItems table (Program-isolated inventory)';
PRINT '- StepInventoryRequirements table (Project step inventory requirements)';
PRINT '- InventoryTransactions table (Comprehensive inventory tracking)';
PRINT '- CartItems table (Shopping cart functionality)';
PRINT '- PendingOrders table (Order management)';
PRINT '- PendingOrderItems table (Order line items)';
PRINT 'Ready for procurement and vendor management tables.';
PRINT '';
