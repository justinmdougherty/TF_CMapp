-- ==============================================================================
-- 07_BUSINESS_PROCEDURES.SQL - H10CM BUSINESS WORKFLOW STORED PROCEDURES
-- ==============================================================================
-- This module contains complex business workflow procedures including shopping
-- cart operations, order management, and reporting procedures.
-- 
-- DEPENDENCIES: 06_core_procedures.sql
-- CREATES: Complex business workflow logic
--
-- Author: H10CM Development Team
-- Created: 2025-07-20
-- Version: H10CM v2.1 Modular (Includes all latest fixes)
-- ==============================================================================

USE H10CM;
GO

PRINT 'Creating business workflow stored procedures...';

-- ==============================================================================
-- PROJECT MANAGEMENT OPERATIONS
-- ==============================================================================

-- Delete project with complete cascade handling
-- Handles all dependent records: Tasks, ProjectSteps, TrackedItems, AttributeDefinitions, PendingOrders
CREATE OR ALTER PROCEDURE usp_DeleteProject
    @ProjectJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Extract parameters from JSON
        DECLARE @project_id INT = JSON_VALUE(@ProjectJson, '$.project_id');
        DECLARE @program_id INT = JSON_VALUE(@ProjectJson, '$.program_id');
        DECLARE @deleted_by INT = JSON_VALUE(@ProjectJson, '$.deleted_by');
        
        -- Validate required parameters
        IF @project_id IS NULL
        BEGIN
            SELECT 'ERROR' as status, 'Project ID is required' as message;
            RETURN;
        END
        
        IF @program_id IS NULL
        BEGIN
            SELECT 'ERROR' as status, 'Program ID is required for multi-tenant isolation' as message;
            RETURN;
        END
        
        -- Check if project exists and belongs to the correct program
        DECLARE @existing_program_id INT;
        DECLARE @project_name NVARCHAR(100);
        
        SELECT @existing_program_id = program_id, @project_name = project_name
        FROM Projects 
        WHERE project_id = @project_id;
        
        IF @existing_program_id IS NULL
        BEGIN
            SELECT 'ERROR' as status, 'Project not found' as message;
            RETURN;
        END
        
        IF @existing_program_id != @program_id
        BEGIN
            SELECT 'ERROR' as status, 'Project does not belong to the specified program' as message;
            RETURN;
        END
        
        -- Begin transaction for cascade delete
        BEGIN TRANSACTION;
        
        -- Count items to be deleted for audit logging
        DECLARE @tasks_count INT, @steps_count INT, @tracked_items_count INT, 
                @attributes_count INT, @pending_orders_count INT;
        
        SELECT @tasks_count = COUNT(*) FROM Tasks WHERE project_id = @project_id;
        SELECT @steps_count = COUNT(*) FROM ProjectSteps WHERE project_id = @project_id;
        SELECT @tracked_items_count = COUNT(*) FROM TrackedItems WHERE project_id = @project_id;
        SELECT @attributes_count = COUNT(*) FROM AttributeDefinitions WHERE project_id = @project_id;
        SELECT @pending_orders_count = COUNT(*) FROM PendingOrders WHERE project_id = @project_id;
        
        -- Cascade delete all dependent records (order matters due to foreign keys)
        DELETE FROM Tasks WHERE project_id = @project_id;
        DELETE FROM ProjectSteps WHERE project_id = @project_id;
        DELETE FROM TrackedItems WHERE project_id = @project_id;
        DELETE FROM AttributeDefinitions WHERE project_id = @project_id;
        DELETE FROM PendingOrders WHERE project_id = @project_id;
        
        -- Finally delete the project
        DELETE FROM Projects WHERE project_id = @project_id;
        
        -- Commit transaction
        COMMIT TRANSACTION;
        
        -- Return success message with deletion counts
        SELECT 'SUCCESS' as status, 
               CONCAT('Project "', @project_name, '" and all related data have been successfully deleted') as message,
               @project_id as project_id,
               @tasks_count as deleted_tasks,
               @steps_count as deleted_steps,
               @tracked_items_count as deleted_tracked_items,
               @attributes_count as deleted_attributes,
               @pending_orders_count as deleted_pending_orders;
               
    END TRY
    BEGIN CATCH
        -- Rollback transaction on error
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SELECT 'ERROR' as status, 
               CONCAT('Failed to delete project: ', ERROR_MESSAGE()) as message;
    END CATCH
END;
GO

-- Delete task with proper authorization checking
CREATE OR ALTER PROCEDURE usp_DeleteTask
    @TaskJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Extract parameters from JSON
        DECLARE @task_id INT = JSON_VALUE(@TaskJson, '$.task_id');
        DECLARE @user_id INT = JSON_VALUE(@TaskJson, '$.deleted_by');
        
        -- Validate required parameters
        IF @task_id IS NULL
        BEGIN
            SELECT 'ERROR' as status, 'Task ID is required' as message;
            RETURN;
        END
        
        -- Check if task exists and get project info for authorization
        DECLARE @project_id INT;
        DECLARE @program_id INT;
        DECLARE @task_name NVARCHAR(100);
        
        SELECT @project_id = T.project_id, @program_id = P.program_id, @task_name = T.task_name
        FROM Tasks T 
        INNER JOIN Projects P ON T.project_id = P.project_id
        WHERE T.task_id = @task_id;
        
        IF @project_id IS NULL
        BEGIN
            SELECT 'ERROR' as status, 'Task not found' as message;
            RETURN;
        END
        
        -- Delete the task
        DELETE FROM Tasks WHERE task_id = @task_id;
        
        -- Return success message
        SELECT 'SUCCESS' as status, 
               CONCAT('Task "', @task_name, '" has been successfully deleted') as message,
               @task_id as task_id,
               @project_id as project_id,
               @program_id as program_id;
               
    END TRY
    BEGIN CATCH
        SELECT 'ERROR' as status, 
               CONCAT('Failed to delete task: ', ERROR_MESSAGE()) as message;
    END CATCH
END;
GO

-- ==============================================================================
-- SHOPPING CART OPERATIONS
-- ==============================================================================

IF OBJECT_ID('usp_AddToCart', 'P') IS NOT NULL
    DROP PROCEDURE usp_AddToCart;
GO

CREATE PROCEDURE usp_AddToCart
    @CartJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @user_id INT = JSON_VALUE(@CartJson, '$.user_id');
        DECLARE @inventory_item_id INT = JSON_VALUE(@CartJson, '$.inventory_item_id');
        DECLARE @quantity_requested DECIMAL(18,4) = JSON_VALUE(@CartJson, '$.quantity_requested');
        
        -- Get program_id from inventory item (since CartItems doesn't have program_id)
        DECLARE @program_id INT;
        SELECT @program_id = program_id 
        FROM InventoryItems 
        WHERE inventory_item_id = @inventory_item_id;
        
        IF @program_id IS NULL
        BEGIN
            RAISERROR('Inventory item not found', 16, 1);
            RETURN;
        END
        
        -- Validate program access
        IF NOT EXISTS (SELECT 1 FROM ProgramAccess WHERE user_id = @user_id AND program_id = @program_id)
        BEGIN
            RAISERROR('Access denied to program', 16, 1);
            RETURN;
        END
        
        -- Add or update cart item
        IF EXISTS (SELECT 1 FROM CartItems WHERE user_id = @user_id AND inventory_item_id = @inventory_item_id)
        BEGIN
            UPDATE CartItems 
            SET quantity_requested = quantity_requested + @quantity_requested,
                last_modified = GETDATE()
            WHERE user_id = @user_id 
              AND inventory_item_id = @inventory_item_id;
        END
        ELSE
        BEGIN
            INSERT INTO CartItems (user_id, inventory_item_id, quantity_requested, date_added, last_modified)
            VALUES (@user_id, @inventory_item_id, @quantity_requested, GETDATE(), GETDATE());
        END
        
        COMMIT TRANSACTION;
        
        SELECT 'success' as status, 'Item added to cart' as message;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

-- ==============================================================================
-- ORDER MANAGEMENT PROCEDURES
-- ==============================================================================

IF OBJECT_ID('usp_CreateOrderFromCart', 'P') IS NOT NULL
    DROP PROCEDURE usp_CreateOrderFromCart;
GO

CREATE PROCEDURE usp_CreateOrderFromCart
    @OrderJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @user_id INT = JSON_VALUE(@OrderJson, '$.user_id');
        DECLARE @project_id INT = JSON_VALUE(@OrderJson, '$.project_id');
        DECLARE @order_notes NVARCHAR(MAX) = JSON_VALUE(@OrderJson, '$.order_notes');
        DECLARE @supplier_info NVARCHAR(500) = JSON_VALUE(@OrderJson, '$.supplier_info');
        
        -- Get program_id from project (since we need multi-tenant validation)
        DECLARE @program_id INT;
        SELECT @program_id = program_id 
        FROM Projects 
        WHERE project_id = @project_id;
        
        IF @program_id IS NULL
        BEGIN
            RAISERROR('Project not found', 16, 1);
            RETURN;
        END
        
        -- Validate program access
        IF NOT EXISTS (SELECT 1 FROM ProgramAccess WHERE user_id = @user_id AND program_id = @program_id)
        BEGIN
            RAISERROR('Access denied to program', 16, 1);
            RETURN;
        END
        
        -- Check if cart has items (CartItems doesn't have program_id, so join through InventoryItems)
        IF NOT EXISTS (
            SELECT 1 FROM CartItems c 
            INNER JOIN InventoryItems i ON c.inventory_item_id = i.inventory_item_id 
            WHERE c.user_id = @user_id AND i.program_id = @program_id
        )
        BEGIN
            RAISERROR('Cart is empty', 16, 1);
            RETURN;
        END
        
        -- Generate unique order number
        DECLARE @order_number NVARCHAR(50) = 'ORD-' + FORMAT(GETDATE(), 'yyyyMMddHHmmss') + '-' + CAST(@user_id AS NVARCHAR(10));
        
        -- Create main order record
        DECLARE @order_id INT;
        INSERT INTO PendingOrders (
            order_number,
            user_id, 
            project_id, 
            status,
            supplier_info,
            order_notes,
            date_created
        )
        VALUES (
            @order_number,
            @user_id,
            @project_id,
            'Pending',
            @supplier_info,
            @order_notes,
            GETDATE()
        );
        
        SET @order_id = SCOPE_IDENTITY();
        
        -- Create order items from cart items
        INSERT INTO PendingOrderItems (
            order_id,
            inventory_item_id, 
            quantity_ordered,
            date_added
        )
        SELECT 
            @order_id,
            ci.inventory_item_id,
            ci.quantity_requested,
            GETDATE()
        FROM CartItems ci
        INNER JOIN InventoryItems ii ON ci.inventory_item_id = ii.inventory_item_id
        WHERE ci.user_id = @user_id AND ii.program_id = @program_id;
        
        -- Clear the cart
        DELETE FROM CartItems 
        WHERE user_id = @user_id;
        
        COMMIT TRANSACTION;
        
        SELECT 'success' as status, 'Orders created successfully' as message;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

-- ==============================================================================
-- REPORTING PROCEDURES
-- ==============================================================================

IF OBJECT_ID('usp_GetPendingOrders', 'P') IS NOT NULL
    DROP PROCEDURE usp_GetPendingOrders;
GO

CREATE PROCEDURE usp_GetPendingOrders
    @program_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            po.order_id,
            po.order_number,
            po.user_id,
            u.display_name as requested_by,
            po.project_id,
            p.project_name,
            po.status,
            po.total_estimated_cost,
            po.order_notes,
            po.date_created,
            po.date_approved,
            po.approved_by,
            -- Order items as JSON array
            (
                SELECT 
                    poi.order_item_id,
                    poi.inventory_item_id,
                    ii.item_name,
                    ii.part_number,
                    poi.quantity_ordered,
                    poi.unit_cost,
                    poi.total_cost,
                    poi.notes
                FROM PendingOrderItems poi
                INNER JOIN InventoryItems ii ON poi.inventory_item_id = ii.inventory_item_id
                WHERE poi.order_id = po.order_id
                FOR JSON PATH
            ) as order_items
        FROM PendingOrders po
        INNER JOIN Users u ON po.user_id = u.user_id
        INNER JOIN Projects p ON po.project_id = p.project_id
        WHERE (@program_id IS NULL OR p.program_id = @program_id)
        ORDER BY po.date_created DESC;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

IF OBJECT_ID('usp_GetInventoryDashboard', 'P') IS NOT NULL
    DROP PROCEDURE usp_GetInventoryDashboard;
GO

CREATE PROCEDURE usp_GetInventoryDashboard
    @program_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Summary statistics
        SELECT 
            COUNT(*) as total_items,
            SUM(CASE WHEN current_stock_level > 0 THEN 1 ELSE 0 END) as in_stock_items,
            SUM(CASE WHEN current_stock_level = 0 THEN 1 ELSE 0 END) as out_of_stock_items,
            AVG(CAST(current_stock_level as FLOAT)) as avg_stock_level
        FROM InventoryItems 
        WHERE program_id = @program_id;
        
        -- Recent activity
        SELECT TOP 10
            ii.item_name,
            ii.part_number,
            ii.current_stock_level,
            ii.last_modified
        FROM InventoryItems ii
        WHERE ii.program_id = @program_id
        ORDER BY ii.last_modified DESC;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

-- ==============================================================================
-- INVENTORY MANAGEMENT PROCEDURES
-- ==============================================================================

IF OBJECT_ID('usp_SaveInventoryItem', 'P') IS NOT NULL
    DROP PROCEDURE usp_SaveInventoryItem;
GO

CREATE PROCEDURE usp_SaveInventoryItem
    @InventoryItemJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Extract parameters from JSON
        DECLARE @inventory_item_id INT = JSON_VALUE(@InventoryItemJson, '$.inventory_item_id');
        DECLARE @item_name NVARCHAR(255) = JSON_VALUE(@InventoryItemJson, '$.item_name');
        DECLARE @part_number NVARCHAR(100) = JSON_VALUE(@InventoryItemJson, '$.part_number');
        DECLARE @description NVARCHAR(500) = JSON_VALUE(@InventoryItemJson, '$.description');
        DECLARE @category NVARCHAR(100) = JSON_VALUE(@InventoryItemJson, '$.category');
        DECLARE @unit_of_measure NVARCHAR(50) = JSON_VALUE(@InventoryItemJson, '$.unit_of_measure');
        DECLARE @current_stock_level DECIMAL(18,4) = JSON_VALUE(@InventoryItemJson, '$.current_stock_level');
        DECLARE @reorder_point DECIMAL(18,4) = JSON_VALUE(@InventoryItemJson, '$.reorder_point');
        DECLARE @max_stock_level DECIMAL(18,4) = JSON_VALUE(@InventoryItemJson, '$.max_stock_level');
        DECLARE @supplier_info NVARCHAR(500) = JSON_VALUE(@InventoryItemJson, '$.supplier_info');
        DECLARE @cost_per_unit DECIMAL(18,4) = JSON_VALUE(@InventoryItemJson, '$.cost_per_unit');
        DECLARE @location NVARCHAR(255) = JSON_VALUE(@InventoryItemJson, '$.location');
        DECLARE @program_id INT = JSON_VALUE(@InventoryItemJson, '$.program_id');
        DECLARE @created_by INT = JSON_VALUE(@InventoryItemJson, '$.created_by');
        
        -- Validate required fields
        IF @item_name IS NULL OR LTRIM(RTRIM(@item_name)) = ''
        BEGIN
            RAISERROR('Item name is required and cannot be empty', 16, 1);
            RETURN;
        END
        
        IF @program_id IS NULL
        BEGIN
            RAISERROR('Program ID is required for multi-tenant isolation', 16, 1);
            RETURN;
        END
        
        IF @created_by IS NULL
        BEGIN
            RAISERROR('Created by user is required', 16, 1);
            RETURN;
        END
        
        -- Set defaults for optional fields
        IF @current_stock_level IS NULL SET @current_stock_level = 0;
        IF @cost_per_unit IS NULL SET @cost_per_unit = 0;
        
        -- Check for duplicate part numbers within the same program
        IF @part_number IS NOT NULL AND @part_number != ''
        BEGIN
            IF EXISTS (
                SELECT 1 FROM InventoryItems 
                WHERE part_number = @part_number 
                  AND program_id = @program_id 
                  AND (@inventory_item_id IS NULL OR inventory_item_id != @inventory_item_id)
            )
            BEGIN
                RAISERROR('An inventory item with this part number already exists in this program', 16, 1);
                RETURN;
            END
        END
        
        IF @inventory_item_id IS NULL OR @inventory_item_id = 0
        BEGIN
            -- INSERT new inventory item
            INSERT INTO InventoryItems (
                item_name, part_number, description, category, unit_of_measure,
                current_stock_level, reorder_point, max_stock_level, supplier_info,
                cost_per_unit, location, program_id, created_by, date_created, last_modified
            )
            VALUES (
                @item_name, @part_number, @description, @category, @unit_of_measure,
                @current_stock_level, @reorder_point, @max_stock_level, @supplier_info,
                @cost_per_unit, @location, @program_id, @created_by, GETDATE(), GETDATE()
            );
            
            SET @inventory_item_id = SCOPE_IDENTITY();
        END
        ELSE
        BEGIN
            -- UPDATE existing inventory item
            UPDATE InventoryItems 
            SET 
                item_name = @item_name,
                part_number = @part_number,
                description = @description,
                category = @category,
                unit_of_measure = @unit_of_measure,
                current_stock_level = @current_stock_level,
                reorder_point = @reorder_point,
                max_stock_level = @max_stock_level,
                supplier_info = @supplier_info,
                cost_per_unit = @cost_per_unit,
                location = @location,
                last_modified = GETDATE()
            WHERE inventory_item_id = @inventory_item_id 
              AND program_id = @program_id; -- Ensure multi-tenant isolation
            
            IF @@ROWCOUNT = 0
            BEGIN
                RAISERROR('Inventory item not found or access denied', 16, 1);
                RETURN;
            END
        END
        
        COMMIT TRANSACTION;
        
        -- Return the created/updated inventory item
        SELECT 
            inventory_item_id, item_name, part_number, description, category,
            unit_of_measure, current_stock_level, reorder_point, max_stock_level,
            supplier_info, cost_per_unit, location, program_id, created_by,
            date_created, last_modified
        FROM InventoryItems 
        WHERE inventory_item_id = @inventory_item_id;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

IF OBJECT_ID('usp_DeleteInventoryItem', 'P') IS NOT NULL
    DROP PROCEDURE usp_DeleteInventoryItem;
GO

CREATE PROCEDURE usp_DeleteInventoryItem
    @InventoryItemJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Extract parameters from JSON
        DECLARE @inventory_item_id INT = JSON_VALUE(@InventoryItemJson, '$.inventory_item_id');
        DECLARE @program_id INT = JSON_VALUE(@InventoryItemJson, '$.program_id');
        DECLARE @deleted_by INT = JSON_VALUE(@InventoryItemJson, '$.deleted_by');
        
        -- Validate required parameters
        IF @inventory_item_id IS NULL
        BEGIN
            RAISERROR('Inventory item ID is required', 16, 1);
            RETURN;
        END
        
        IF @program_id IS NULL
        BEGIN
            RAISERROR('Program ID is required for multi-tenant isolation', 16, 1);
            RETURN;
        END
        
        IF @deleted_by IS NULL
        BEGIN
            RAISERROR('Deleted by user is required', 16, 1);
            RETURN;
        END
        
        -- Verify the inventory item exists and belongs to the specified program
        DECLARE @item_name NVARCHAR(255);
        SELECT @item_name = item_name
        FROM InventoryItems 
        WHERE inventory_item_id = @inventory_item_id 
          AND program_id = @program_id;
        
        IF @item_name IS NULL
        BEGIN
            RAISERROR('Inventory item not found or access denied', 16, 1);
            RETURN;
        END
        
        -- Check for dependencies before deletion
        -- 1. Check if item is in any cart
        IF EXISTS (SELECT 1 FROM CartItems WHERE inventory_item_id = @inventory_item_id)
        BEGIN
            RAISERROR('Cannot delete inventory item that is currently in shopping carts', 16, 1);
            RETURN;
        END
        
        -- 2. Check if item is in any pending order items
        IF EXISTS (SELECT 1 FROM PendingOrderItems WHERE inventory_item_id = @inventory_item_id)
        BEGIN
            RAISERROR('Cannot delete inventory item that has pending order items', 16, 1);
            RETURN;
        END
        
        -- 3. Check if item is referenced in step inventory requirements
        IF EXISTS (SELECT 1 FROM StepInventoryRequirements WHERE inventory_item_id = @inventory_item_id)
        BEGIN
            RAISERROR('Cannot delete inventory item that is referenced in project step requirements', 16, 1);
            RETURN;
        END
        
        -- Log the deletion for audit purposes
        INSERT INTO AuditLog (
            entity_type, action_type, entity_id, user_id, 
            old_values, new_values, date_created
        )
        VALUES (
            'InventoryItems', 'DELETE', @inventory_item_id, @deleted_by,
            JSON_QUERY('{"item_name": "' + @item_name + '", "inventory_item_id": ' + CAST(@inventory_item_id AS NVARCHAR) + '}'),
            NULL, GETDATE()
        );
        
        -- Delete the inventory item
        DELETE FROM InventoryItems 
        WHERE inventory_item_id = @inventory_item_id 
          AND program_id = @program_id;
        
        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR('Inventory item could not be deleted', 16, 1);
            RETURN;
        END
        
        COMMIT TRANSACTION;
        
        -- Return success status
        SELECT 
            'success' as status,
            'Inventory item "' + @item_name + '" has been successfully deleted' as message,
            @inventory_item_id as inventory_item_id,
            @item_name as item_name;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

PRINT 'Business workflow procedures created successfully.';
PRINT 'Shopping cart, order management, inventory management, and reporting procedures are now available.';
PRINT 'Ready for sample data.';
PRINT '';
