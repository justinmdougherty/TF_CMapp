-- =============================================
-- H10CM Database Views Module
-- =============================================
-- This file creates the database views that were missing from the modular setup
-- Run this after creating the core tables and procedures

USE [H10CM];
GO

PRINT 'Creating H10CM Database Views...';

-- =============================================
-- VIEWS
-- =============================================

-- Enhanced Projects Summary View
IF EXISTS (SELECT * FROM sys.views WHERE name = 'v_Projects_Summary')
    DROP VIEW [dbo].[v_Projects_Summary];
GO

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

PRINT '✅ Created v_Projects_Summary view';

-- User Access Summary View
IF EXISTS (SELECT * FROM sys.views WHERE name = 'v_User_Access_Summary')
    DROP VIEW [dbo].[v_User_Access_Summary];
GO

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

PRINT '✅ Created v_User_Access_Summary view';

-- Task Summary View
IF EXISTS (SELECT * FROM sys.views WHERE name = 'v_Tasks_Summary')
    DROP VIEW [dbo].[v_Tasks_Summary];
GO

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

PRINT '✅ Created v_Tasks_Summary view';

-- Inventory Status View
IF EXISTS (SELECT * FROM sys.views WHERE name = 'v_InventoryItems_StockStatus')
    DROP VIEW [dbo].[v_InventoryItems_StockStatus];
GO

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

PRINT '✅ Created v_InventoryItems_StockStatus view';

-- Notification Summary View
IF EXISTS (SELECT * FROM sys.views WHERE name = 'v_Notifications_Summary')
    DROP VIEW [dbo].[v_Notifications_Summary];
GO

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

PRINT '✅ Created v_Notifications_Summary view';

-- =============================================
-- SUMMARY
-- =============================================

PRINT '';
PRINT '🎉 H10CM Database Views Created Successfully!';
PRINT '   - v_Projects_Summary';
PRINT '   - v_User_Access_Summary';
PRINT '   - v_Tasks_Summary';
PRINT '   - v_InventoryItems_StockStatus';
PRINT '   - v_Notifications_Summary';
PRINT '';
PRINT 'Views are now available for the API endpoints.';
