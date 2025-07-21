/*
================================================================================
H10CM MULTI-TENANT PRODUCTION MANAGEMENT SYSTEM - DATABASE SCHEMA
================================================================================

SYSTEM OVERVIEW:
H10CM is a comprehensive multi-tenant production management and inventory tracking 
system designed for enterprise environments with complete data isolation between 
organizational units (programs). The system supports project management, task 
assignment, inventory control, procurement, and user administration with 
role-based access control (RBAC).

CORE ARCHITECTURE:
- Frontend: React 18 + TypeScript + Material UI + Vite
- Backend: Node.js + Express + Certificate-based Authentication
- Database: Microsoft SQL Server with stored procedures
- Authentication: DoD PKI Certificate validation with RBAC integration

================================================================================
MULTI-TENANT DATA ARCHITECTURE
================================================================================

TENANT HIERARCHY:
Programs (Root Tenant) → Projects → Tasks → TrackedItems
                     → InventoryItems → CartItems → PendingOrders
                     → Users (via ProgramAccess)

CORE TABLES & RELATIONSHIPS:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Programs (program_id) - Root tenant entity                                  │
│ ├── Users (via ProgramAccess) - Cross-tenant user access                    │
│ ├── Projects (project_id) - Program-isolated projects                       │
│ │   ├── Tasks (task_id) - Project-specific work assignments                 │
│ │   ├── ProjectSteps (step_id) - Workflow definitions                       │
│ │   └── TrackedItems (item_id) - Production units                           │
│ ├── InventoryItems (inventory_item_id) - Program-isolated inventory         │
│ ├── CartItems (cart_id) - User shopping carts                               │
│ └── PendingOrders (order_id) - Procurement orders                           │
└─────────────────────────────────────────────────────────────────────────────┘

DATA ISOLATION ENFORCEMENT:
All stored procedures MUST filter by program_id to ensure complete tenant isolation.
No cross-program data access is permitted except for system administrators.

================================================================================
ROLE-BASED ACCESS CONTROL (RBAC)
================================================================================

SECURITY MODEL:
- Certificate-Based Authentication: DoD PKI certificate validation
- Program-Level Access: ProgramAccess table controls program membership
- Project-Level Access: ProjectAccess table for fine-grained permissions
- Role Hierarchy: System > Program > Project > Resource levels

ACCESS LEVELS:
- System Admin: Global platform administration
- Program Admin: Full access within assigned programs
- Program Write: Read/write access to program resources  
- Program Read: Read-only access to program resources

USER CONTEXT FLOW:
Certificate → User Lookup → Program Access → Project Access → Resource Access

================================================================================
ERROR HANDLING STANDARDS
================================================================================

ALL STORED PROCEDURES MUST IMPLEMENT:

1. COMPLETE TRY/CATCH BLOCKS:
   BEGIN TRY
       -- Procedure logic here
   END TRY
   BEGIN CATCH
       DECLARE @ErrorMessage NVARCHAR(4000) = 'User-friendly error message';
       DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
       DECLARE @ErrorState INT = ERROR_STATE();
       RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
   END CATCH

2. PARAMETER VALIDATION:
   - Check for required parameters (NULL/empty validation)
   - Validate data types and constraints
   - Return specific error messages for validation failures

3. EMPTY DATABASE HANDLING:
   - For GET procedures: Return empty result sets with proper column structure
   - Use "WHERE 1 = 0" pattern to return schema without data
   - Provide graceful handling for new installations

4. USER-FRIENDLY ERROR MESSAGES:
   - NO generic SQL errors (avoid "Violation of PRIMARY KEY constraint")
   - NO technical jargon in user-facing messages
   - Focus on actionable guidance ("Please check required fields")
   - Suitable for frontend toast notifications

5. TRANSACTION SAFETY:
   - Use transactions for multi-table operations
   - Implement proper rollback on errors
   - Ensure data consistency across related tables

EXAMPLE ERROR MESSAGE PATTERNS:
✅ GOOD: "Unable to save project. Please ensure all required fields are completed."
❌ BAD: "Cannot insert duplicate key row in object 'dbo.Projects'"

================================================================================
STORED PROCEDURE CONVENTIONS
================================================================================

NAMING PATTERNS:
- usp_Get[Entity]         - Retrieve operations (SELECT)
- usp_Save[Entity]        - Insert/Update operations (UPSERT)
- usp_Delete[Entity]      - Delete operations
- usp_[Action][Entity]    - Specific actions (GrantProgramAccess)

PARAMETER PATTERNS:
- JSON Input: Use @[Entity]Json NVARCHAR(MAX) for complex objects
- Simple Params: Use strongly typed parameters for single values
- Program Filtering: Always include @program_id for tenant isolation

RETURN PATTERNS:
- GET procedures: Return result sets directly
- SAVE procedures: Return the created/updated entity
- ACTION procedures: Return status messages or affected records

JSON PARAMETER EXAMPLE:
DECLARE @project_id INT = JSON_VALUE(@ProjectJson, '$.project_id');
DECLARE @project_name NVARCHAR(100) = JSON_VALUE(@ProjectJson, '$.project_name');

================================================================================
PERFORMANCE OPTIMIZATION
================================================================================

INDEXING STRATEGY:
- Program-based filtering: Indexes on program_id columns
- User access patterns: Indexes on user_id and certificate_subject
- Date-based queries: Indexes on creation/modification timestamps
- Foreign key performance: All FK columns have supporting indexes

QUERY PATTERNS:
- Use covering indexes for frequently accessed column combinations
- Implement pagination for large result sets
- Avoid N+1 query patterns in application layer
- Use appropriate JOIN types based on data relationships

================================================================================
AUDIT & COMPLIANCE
================================================================================

AUDIT TRAIL:
- AuditLog table captures all data modifications
- User attribution for all changes via created_by/modified_by
- Timestamp tracking on all entities
- Action type classification for compliance reporting

COMPLIANCE FEATURES:
- Complete user action logging
- Data modification tracking
- Access pattern monitoring
- Retention policy support

================================================================================
DEVELOPMENT GUIDELINES
================================================================================

BEFORE ADDING NEW PROCEDURES:
1. Follow established error handling patterns
2. Implement proper parameter validation
3. Include program-level data filtering
4. Add comprehensive error messages
5. Test with empty database scenarios
6. Update this documentation header

TESTING REQUIREMENTS:
1. Empty database scenarios
2. Invalid parameter handling
3. Cross-tenant data isolation
4. Error message clarity
5. Performance with large datasets

SECURITY CHECKLIST:
□ Program-level data filtering implemented
□ Parameter validation prevents injection
□ User context properly validated
□ No hardcoded sensitive data
□ Audit trail properly captured

================================================================================
VERSION HISTORY
================================================================================

v1.0 - Initial multi-tenant schema with RBAC
v1.1 - Enhanced error handling and user-friendly messages
v1.2 - Comprehensive stored procedure audit and documentation
v2.0 - Complete modular architecture with 10-module structure
v2.1 - SQL syntax fixes and production-ready stored procedures (July 20, 2025)
v2.2 - Project cleanup: Organized documentation, removed obsolete files, cleaned API folder structure

================================================================================
*/

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
-- - Production tracking with step-by-step progress
-- - Shopping cart and procurement order management
-- - Step inventory requirements management
-- 
-- Created: July 13, 2025
-- Updated: July 18, 2025 - Added all latest procedures and schema updates
-- Version: H10CM v2.0 Production Ready
-- =============================================

-- ==============================================================================
-- H10CM DATABASE CREATION - MASTER EXECUTION SCRIPT
-- ==============================================================================
-- This script executes all database modules in the correct order to create
-- a complete H10CM production-ready database with comprehensive error handling,
-- multi-tenant security, and all latest fixes integrated.
--
-- EXECUTION ORDER IS CRITICAL - DO NOT CHANGE THE SEQUENCE!
--
-- Usage: sqlcmd -S server_name -U username -P password -i create_h10cm_database.sql
--
-- Created: 2025-07-20
-- Version: H10CM v2.1 Modular Architecture
-- ==============================================================================

PRINT '==============================================================================';
PRINT 'H10CM DATABASE CREATION - MODULAR EXECUTION STARTED';
PRINT '==============================================================================';
PRINT 'Execution Time: ' + CONVERT(NVARCHAR(50), GETDATE(), 120);
PRINT '';

-- Phase 1: Core Infrastructure
PRINT '>>> PHASE 1: CORE INFRASTRUCTURE';
PRINT 'Creating database and core schema...';
:r 01_database_and_schema.sql

PRINT 'Creating core tables (Users, Programs, Roles)...';
:r 02_core_tables.sql

-- Phase 2: Business Data Layer
PRINT '';
PRINT '>>> PHASE 2: BUSINESS DATA LAYER';
PRINT 'Creating project management tables...';
:r 03_project_tables.sql

PRINT 'Creating inventory management tables...';
:r 04_inventory_tables.sql

PRINT 'Creating procurement and vendor tables...';
:r 05_procurement_tables.sql

-- Phase 3: Business Logic (Stored Procedures)
PRINT '';
PRINT '>>> PHASE 3: BUSINESS LOGIC LAYER';
PRINT 'Creating core CRUD procedures...';
:r 06_core_procedures.sql

PRINT 'Creating business workflow procedures...';
:r 07_business_procedures.sql

PRINT 'Creating security and authentication procedures...';
:r 08_security_procedures.sql

-- Phase 4: Data and Optimization
PRINT '';
PRINT '>>> PHASE 4: DATA AND OPTIMIZATION';
PRINT 'NOTE: Sample data (09_sample_data.sql) is OPTIONAL for development only';
PRINT 'Production deployments should skip sample data insertion';
PRINT '';
PRINT 'Inserting sample/seed data (OPTIONAL - remove this line for production)...';
:r 09_sample_data.sql

PRINT 'Creating indexes and constraints...';
:r 10_indexes_constraints.sql

-- Final Status Report
PRINT '';
PRINT '==============================================================================';
PRINT 'H10CM DATABASE CREATION COMPLETED SUCCESSFULLY!';
PRINT '==============================================================================';
PRINT 'Completion Time: ' + CONVERT(NVARCHAR(50), GETDATE(), 120);
PRINT '';
PRINT 'DATABASE SUMMARY:';
PRINT '- Multi-tenant architecture with program-level isolation';
PRINT '- Certificate-based authentication system';
PRINT '- Comprehensive RBAC with role hierarchies';
PRINT '- Complete inventory and procurement management';
PRINT '- Production workflow tracking system';
PRINT '- Shopping cart and order management';
PRINT '- All stored procedures include comprehensive error handling';
PRINT '- JSON parameter support for API compatibility';
PRINT '- Performance optimized with proper indexing';
PRINT '';
PRINT 'NEXT STEPS:';
PRINT '1. Restart API server to use new stored procedures';
PRINT '2. Test authentication and user management endpoints';
PRINT '3. Verify multi-tenant data isolation';
PRINT '4. Configure production user accounts';
PRINT '';
PRINT 'The H10CM database is ready for production deployment!';
PRINT '==============================================================================';
