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
            order_notes,
            date_created
        )
        VALUES (
            @order_number,
            @user_id,
            @project_id,
            'Pending',
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

PRINT 'Business workflow procedures created successfully.';
PRINT 'Shopping cart, order management, and reporting procedures are now available.';
PRINT 'Ready for sample data.';
PRINT '';
