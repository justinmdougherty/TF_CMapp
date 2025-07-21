-- H10CM Database Procedures Update Script
-- This script updates existing stored procedures to use JSON parameters instead of individual parameters
-- Run this script against your H10CM database after the schema is created

USE H10CM;
GO

PRINT 'Updating stored procedures to use JSON parameters...';

-- Update usp_SaveProject
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_SaveProject')
    DROP PROCEDURE [dbo].[usp_SaveProject];
GO

CREATE PROCEDURE [dbo].[usp_SaveProject]
    @ProjectJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Parse JSON input
    DECLARE @project_id INT,
            @program_id INT,
            @project_name NVARCHAR(100),
            @project_description NVARCHAR(MAX),
            @status NVARCHAR(50),
            @priority NVARCHAR(20),
            @project_manager_id INT,
            @project_start_date DATE,
            @project_end_date DATE,
            @estimated_completion_date DATE,
            @budget DECIMAL(18,2),
            @notes NVARCHAR(MAX),
            @created_by INT;
    
    -- Extract values from JSON
    SELECT 
        @project_id = JSON_VALUE(@ProjectJson, '$.project_id'),
        @program_id = JSON_VALUE(@ProjectJson, '$.program_id'),
        @project_name = JSON_VALUE(@ProjectJson, '$.project_name'),
        @project_description = JSON_VALUE(@ProjectJson, '$.project_description'),
        @status = ISNULL(JSON_VALUE(@ProjectJson, '$.status'), 'Planning'),
        @priority = ISNULL(JSON_VALUE(@ProjectJson, '$.priority'), 'Medium'),
        @project_manager_id = JSON_VALUE(@ProjectJson, '$.project_manager_id'),
        @project_start_date = JSON_VALUE(@ProjectJson, '$.project_start_date'),
        @project_end_date = JSON_VALUE(@ProjectJson, '$.project_end_date'),
        @estimated_completion_date = JSON_VALUE(@ProjectJson, '$.estimated_completion_date'),
        @budget = JSON_VALUE(@ProjectJson, '$.budget'),
        @notes = JSON_VALUE(@ProjectJson, '$.notes'),
        @created_by = JSON_VALUE(@ProjectJson, '$.created_by');
    
    -- Validate required fields
    IF @program_id IS NULL OR @project_name IS NULL OR @project_name = '' OR @created_by IS NULL
    BEGIN
        RAISERROR('Required fields missing: program_id, project_name, and created_by are required.', 16, 1);
        RETURN;
    END
    
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

PRINT 'Successfully updated usp_SaveProject';

-- Update usp_SaveTask
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_SaveTask')
    DROP PROCEDURE [dbo].[usp_SaveTask];
GO

CREATE PROCEDURE [dbo].[usp_SaveTask]
    @TaskJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Parse JSON input
    DECLARE @task_id INT,
            @project_id INT,
            @step_id INT,
            @tracked_item_id INT,
            @task_title NVARCHAR(255),
            @task_description NVARCHAR(MAX),
            @assigned_to INT,
            @assigned_by INT,
            @priority NVARCHAR(20),
            @status NVARCHAR(50),
            @due_date DATETIME2,
            @estimated_hours DECIMAL(5,2),
            @notes NVARCHAR(MAX);
    
    -- Extract values from JSON
    SELECT 
        @task_id = JSON_VALUE(@TaskJson, '$.task_id'),
        @project_id = JSON_VALUE(@TaskJson, '$.project_id'),
        @step_id = JSON_VALUE(@TaskJson, '$.step_id'),
        @tracked_item_id = JSON_VALUE(@TaskJson, '$.tracked_item_id'),
        @task_title = JSON_VALUE(@TaskJson, '$.task_title'),
        @task_description = JSON_VALUE(@TaskJson, '$.task_description'),
        @assigned_to = JSON_VALUE(@TaskJson, '$.assigned_to'),
        @assigned_by = JSON_VALUE(@TaskJson, '$.assigned_by'),
        @priority = ISNULL(JSON_VALUE(@TaskJson, '$.priority'), 'Medium'),
        @status = ISNULL(JSON_VALUE(@TaskJson, '$.status'), 'Pending'),
        @due_date = JSON_VALUE(@TaskJson, '$.due_date'),
        @estimated_hours = JSON_VALUE(@TaskJson, '$.estimated_hours'),
        @notes = JSON_VALUE(@TaskJson, '$.notes');
    
    -- Validate required fields
    IF @task_title IS NULL OR @task_title = '' OR @assigned_to IS NULL OR @assigned_by IS NULL
    BEGIN
        RAISERROR('Required fields missing: task_title, assigned_to, and assigned_by are required.', 16, 1);
        RETURN;
    END
    
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

PRINT 'Successfully updated usp_SaveTask';

-- Update usp_SaveInventoryItem
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_SaveInventoryItem')
    DROP PROCEDURE [dbo].[usp_SaveInventoryItem];
GO

CREATE PROCEDURE [dbo].[usp_SaveInventoryItem]
    @InventoryItemJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Parse JSON input
    DECLARE @inventory_item_id INT,
            @item_name NVARCHAR(255),
            @part_number NVARCHAR(100),
            @description NVARCHAR(MAX),
            @category NVARCHAR(100),
            @unit_of_measure NVARCHAR(50),
            @current_stock_level DECIMAL(18,4),
            @reorder_point DECIMAL(18,4),
            @max_stock_level DECIMAL(18,4),
            @supplier_info NVARCHAR(MAX),
            @cost_per_unit DECIMAL(18,2),
            @location NVARCHAR(255),
            @program_id INT,
            @created_by INT;
    
    -- Extract values from JSON
    SELECT 
        @inventory_item_id = JSON_VALUE(@InventoryItemJson, '$.inventory_item_id'),
        @item_name = JSON_VALUE(@InventoryItemJson, '$.item_name'),
        @part_number = JSON_VALUE(@InventoryItemJson, '$.part_number'),
        @description = JSON_VALUE(@InventoryItemJson, '$.description'),
        @category = JSON_VALUE(@InventoryItemJson, '$.category'),
        @unit_of_measure = JSON_VALUE(@InventoryItemJson, '$.unit_of_measure'),
        @current_stock_level = ISNULL(JSON_VALUE(@InventoryItemJson, '$.current_stock_level'), 0),
        @reorder_point = JSON_VALUE(@InventoryItemJson, '$.reorder_point'),
        @max_stock_level = JSON_VALUE(@InventoryItemJson, '$.max_stock_level'),
        @supplier_info = JSON_VALUE(@InventoryItemJson, '$.supplier_info'),
        @cost_per_unit = JSON_VALUE(@InventoryItemJson, '$.cost_per_unit'),
        @location = JSON_VALUE(@InventoryItemJson, '$.location'),
        @program_id = JSON_VALUE(@InventoryItemJson, '$.program_id'),
        @created_by = JSON_VALUE(@InventoryItemJson, '$.created_by');
    
    -- Validate required fields
    IF @item_name IS NULL OR @item_name = '' OR @unit_of_measure IS NULL OR @unit_of_measure = '' OR @program_id IS NULL OR @created_by IS NULL
    BEGIN
        RAISERROR('Required fields missing: item_name, unit_of_measure, program_id, and created_by are required.', 16, 1);
        RETURN;
    END
    
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

PRINT 'Successfully updated usp_SaveInventoryItem';

-- Update usp_SaveProjectStep
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_SaveProjectStep')
    DROP PROCEDURE [dbo].[usp_SaveProjectStep];
GO

CREATE PROCEDURE [dbo].[usp_SaveProjectStep]
    @StepJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Parse JSON input
    DECLARE @step_id INT,
            @project_id INT,
            @step_code NVARCHAR(100),
            @step_name NVARCHAR(255),
            @step_description NVARCHAR(MAX),
            @step_order INT,
            @estimated_duration_hours DECIMAL(8,2),
            @is_quality_control BIT,
            @requires_approval BIT,
            @approval_role NVARCHAR(100);
    
    -- Extract values from JSON
    SELECT 
        @step_id = JSON_VALUE(@StepJson, '$.step_id'),
        @project_id = JSON_VALUE(@StepJson, '$.project_id'),
        @step_code = JSON_VALUE(@StepJson, '$.step_code'),
        @step_name = JSON_VALUE(@StepJson, '$.step_name'),
        @step_description = JSON_VALUE(@StepJson, '$.step_description'),
        @step_order = JSON_VALUE(@StepJson, '$.step_order'),
        @estimated_duration_hours = JSON_VALUE(@StepJson, '$.estimated_duration_hours'),
        @is_quality_control = ISNULL(JSON_VALUE(@StepJson, '$.is_quality_control'), 0),
        @requires_approval = ISNULL(JSON_VALUE(@StepJson, '$.requires_approval'), 0),
        @approval_role = JSON_VALUE(@StepJson, '$.approval_role');
    
    -- Validate required fields
    IF @project_id IS NULL OR @step_name IS NULL OR @step_name = '' OR @step_order IS NULL
    BEGIN
        RAISERROR('Required fields missing: project_id, step_name, and step_order are required.', 16, 1);
        RETURN;
    END
    
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

PRINT 'Successfully updated usp_SaveProjectStep';

-- Update usp_AddToCart
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_AddToCart')
    DROP PROCEDURE [dbo].[usp_AddToCart];
GO

CREATE PROCEDURE [dbo].[usp_AddToCart]
    @CartItemJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Parse JSON input
    DECLARE @user_id INT,
            @inventory_item_id INT,
            @quantity_requested DECIMAL(18,4),
            @estimated_cost DECIMAL(18,2),
            @notes NVARCHAR(MAX);
    
    -- Extract values from JSON
    SELECT 
        @user_id = JSON_VALUE(@CartItemJson, '$.user_id'),
        @inventory_item_id = JSON_VALUE(@CartItemJson, '$.inventory_item_id'),
        @quantity_requested = JSON_VALUE(@CartItemJson, '$.quantity_requested'),
        @estimated_cost = JSON_VALUE(@CartItemJson, '$.estimated_cost'),
        @notes = JSON_VALUE(@CartItemJson, '$.notes');
    
    -- Validate required fields
    IF @user_id IS NULL OR @inventory_item_id IS NULL OR @quantity_requested IS NULL OR @quantity_requested <= 0
    BEGIN
        RAISERROR('Required fields missing: user_id, inventory_item_id, and quantity_requested > 0 are required.', 16, 1);
        RETURN;
    END
    
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

PRINT 'Successfully updated usp_AddToCart';

-- Update usp_UpdateCartItem
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_UpdateCartItem')
    DROP PROCEDURE [dbo].[usp_UpdateCartItem];
GO

CREATE PROCEDURE [dbo].[usp_UpdateCartItem]
    @CartItemJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Parse JSON input
    DECLARE @cart_id INT,
            @user_id INT,
            @quantity_requested DECIMAL(18,4),
            @estimated_cost DECIMAL(18,2),
            @notes NVARCHAR(MAX);
    
    -- Extract values from JSON
    SELECT 
        @cart_id = JSON_VALUE(@CartItemJson, '$.cart_id'),
        @user_id = JSON_VALUE(@CartItemJson, '$.user_id'),
        @quantity_requested = JSON_VALUE(@CartItemJson, '$.quantity_requested'),
        @estimated_cost = JSON_VALUE(@CartItemJson, '$.estimated_cost'),
        @notes = JSON_VALUE(@CartItemJson, '$.notes');
    
    -- Validate required fields
    IF @cart_id IS NULL OR @user_id IS NULL OR @quantity_requested IS NULL OR @quantity_requested <= 0
    BEGIN
        RAISERROR('Required fields missing: cart_id, user_id, and quantity_requested > 0 are required.', 16, 1);
        RETURN;
    END
    
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
        i.item_name,
        i.part_number,
        c.quantity_requested,
        c.estimated_cost,
        c.notes,
        c.date_created,
        c.last_modified
    FROM CartItems c
    INNER JOIN InventoryItems i ON c.inventory_item_id = i.inventory_item_id
    WHERE c.cart_id = @cart_id;
END;
GO

PRINT 'Successfully updated usp_UpdateCartItem';

-- =============================================
-- usp_MarkOrderAsReceived - Mark order as received and update inventory
-- =============================================

-- Drop existing procedure if it exists
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'usp_MarkOrderAsReceived')
    DROP PROCEDURE [dbo].[usp_MarkOrderAsReceived];
GO

CREATE PROCEDURE [dbo].[usp_MarkOrderAsReceived]
    @OrderReceivedJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ResultJson NVARCHAR(MAX);
    DECLARE @OrderExists BIT = 0;
    DECLARE @UserCanReceive BIT = 0;
    DECLARE @OrderStatus NVARCHAR(50);
    DECLARE @OrderNumber NVARCHAR(50);
    
    -- Parse JSON input
    DECLARE @OrderId INT = JSON_VALUE(@OrderReceivedJson, '$.order_id');
    DECLARE @UserId INT = JSON_VALUE(@OrderReceivedJson, '$.user_id');
    
    BEGIN TRY
        -- Validate JSON parameters
        IF @OrderId IS NULL OR @UserId IS NULL
        BEGIN
            SET @ResultJson = '{"error": "Missing required parameters: order_id and user_id"}';
            SELECT @ResultJson as JsonResult;
            RETURN;
        END
        
        -- Check if order exists and get current status
        SELECT 
            @OrderExists = 1,
            @OrderStatus = status,
            @OrderNumber = order_number,
            @UserCanReceive = CASE 
                WHEN user_id = @UserId THEN 1 
                ELSE 0 
            END
        FROM PendingOrders 
        WHERE order_id = @OrderId;
        
        -- Validate order exists
        IF @OrderExists = 0
        BEGIN
            SET @ResultJson = '{"error": "Order not found"}';
            SELECT @ResultJson as JsonResult;
            RETURN;
        END
        
        -- Check if user can receive this order (must be the person who ordered it)
        IF @UserCanReceive = 0
        BEGIN
            -- Check if user is system admin
            DECLARE @IsSystemAdmin BIT = 0;
            SELECT @IsSystemAdmin = is_system_admin FROM Users WHERE user_id = @UserId;
            
            IF @IsSystemAdmin = 0
            BEGIN
                SET @ResultJson = '{"error": "Only the person who ordered can mark as received"}';
                SELECT @ResultJson as JsonResult;
                RETURN;
            END
        END
        
        -- Check if order is already received
        IF @OrderStatus = 'Received'
        BEGIN
            SET @ResultJson = '{"error": "Order has already been marked as received"}';
            SELECT @ResultJson as JsonResult;
            RETURN;
        END
        
        -- Check if order is in a state that can be received
        IF @OrderStatus NOT IN ('Pending', 'Approved', 'Ordered')
        BEGIN
            SET @ResultJson = '{"error": "Order cannot be received in current status: ' + @OrderStatus + '"}';
            SELECT @ResultJson as JsonResult;
            RETURN;
        END
        
        -- Begin transaction to update order and inventory
        BEGIN TRANSACTION;
        
        -- Update all order items to mark as fully received
        UPDATE PendingOrderItems 
        SET quantity_received = quantity_ordered
        WHERE order_id = @OrderId;
        
        -- Update inventory stock levels
        UPDATE ii
        SET current_stock_level = ISNULL(current_stock_level, 0) + poi.quantity_ordered,
            last_modified = GETDATE()
        FROM InventoryItems ii
        INNER JOIN PendingOrderItems poi ON ii.inventory_item_id = poi.inventory_item_id
        WHERE poi.order_id = @OrderId;
        
        -- Update order status to received
        UPDATE PendingOrders 
        SET status = 'Received',
            actual_delivery_date = GETDATE(),
            last_modified = GETDATE()
        WHERE order_id = @OrderId;
        
        -- Commit transaction
        COMMIT TRANSACTION;
        
        -- Return success with order details
        DECLARE @ItemsUpdated INT;
        SELECT @ItemsUpdated = COUNT(*) FROM PendingOrderItems WHERE order_id = @OrderId;
        
        SET @ResultJson = '{"success": true, "message": "Order marked as received and inventory updated", "order_id": ' + CAST(@OrderId AS NVARCHAR(10)) + ', "order_number": "' + @OrderNumber + '", "received_date": "' + FORMAT(GETDATE(), 'yyyy-MM-dd HH:mm:ss') + '", "items_updated": ' + CAST(@ItemsUpdated AS NVARCHAR(10)) + '}';
        
        SELECT @ResultJson as JsonResult;
        
    END TRY
    BEGIN CATCH
        -- Rollback transaction on error
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SET @ResultJson = '{"error": "Failed to mark order as received: ' + ERROR_MESSAGE() + '", "error_number": ' + CAST(ERROR_NUMBER() AS NVARCHAR(10)) + ', "error_line": ' + CAST(ERROR_LINE() AS NVARCHAR(10)) + '}';
        
        SELECT @ResultJson as JsonResult;
    END CATCH
END
GO

PRINT 'Successfully created usp_MarkOrderAsReceived';

PRINT 'All stored procedures have been successfully updated to use JSON parameters!';
PRINT 'The following procedures now accept JSON input:';
PRINT '- usp_SaveProject (@ProjectJson)';
PRINT '- usp_SaveTask (@TaskJson)';
PRINT '- usp_SaveInventoryItem (@InventoryItemJson)';
PRINT '- usp_SaveProjectStep (@StepJson)';
PRINT '- usp_AddToCart (@CartItemJson)';
PRINT '- usp_UpdateCartItem (@CartItemJson)';
