# H10CM Mock Data Migration Plan

## Overview
This document outlines the migration of hardcoded mock data from the frontend to the database, and the development of missing backend endpoints.

## Phase 1: Frontend Mock Data Audit

### 🔴 Critical Mock Data Requiring Database Migration

#### 1. User Management (`src/context/RBACContext.tsx`)
**Current State:** Hardcoded mock data
**Location:** Lines 45-164
**Data:**
- `mockUsers`: 4 complete user profiles with roles, permissions
- `mockPendingRequests`: Access request data
- `getAllPrograms()`: Program data with settings

**Migration Target:** 
- Users table (already exists, needs population)
- Programs table (exists, needs mock data)
- UserAccessRequests table (needs creation)

#### 2. Team Members (`src/views/project-management/ProjectManagementDashboard.tsx`)
**Current State:** Hardcoded array (lines 369-434)
**Data:**
- 4 team members with skills, availability, productivity scores
- Current task counts and statuses

**Migration Target:**
- Users table enhancement
- UserSkills table (new)
- UserAvailability table (new)

#### 3. Contact Management (`src/api/contacts/ContactsData.tsx`)
**Current State:** Complete mock contact system
**Data:**
- Full contact database with MSW handlers
- Contact CRUD operations

**Migration Target:**
- Contacts table (new)
- ContactAPI endpoints (new)

#### 4. Task Management (`src/hooks/api/useTaskHooks.ts`, `src/services/api.ts`)
**Current State:** All operations mocked
**Data:**
- Task creation, updates, statistics
- User task summaries
- Smart task assignment

**Migration Target:**
- Tasks table (exists, needs endpoints)
- TaskAssignments table (new)
- TaskStatistics views (new)

### 🟡 Semi-Mock Data (Calculations)

#### 1. Inventory Cost Calculations (`src/views/inventory/components/InventoryStatsCards.tsx`)
**Current State:** Hardcoded $10 per item (line 107)
**Issue:** Missing cost_per_unit in database schema
**Solution:** Add cost tracking to InventoryItems table

### 🟢 Development-Only Mock Data (Keep for Testing)

#### 1. Certificate Testing (`src/test/certificateTest.ts`)
**Purpose:** Development authentication fallback
**Status:** Keep for local development

#### 2. API Test Scripts (`api/test_*.js`)
**Purpose:** Database and API testing
**Status:** Keep for testing purposes

## Phase 2: Missing Backend Development

### 🔴 Debug Control Backend (HealthDashboard.tsx)

#### Current Frontend Features:
- Health checks for API endpoints
- System metrics display  
- Test execution simulation
- Performance monitoring

#### Missing Backend APIs:
```
GET /api/health/system-metrics     - CPU, memory, connections
GET /api/health/database-status    - DB connection pool, query performance
GET /api/health/test-results       - Run and return test suite results
POST /api/health/run-tests         - Execute test suites
GET /api/health/performance        - Response times, throughput metrics
```

### 🔴 Procurement Dashboard Backend

#### Current Frontend Features:
- Fund management placeholder
- Task allocation placeholder
- Order processing placeholder
- Document management placeholder

#### Missing Backend APIs:
```
# Fund Management
GET /api/procurement/sponsors
GET /api/procurement/sponsor-funds
POST /api/procurement/allocate-funds

# Task Allocation  
GET /api/procurement/task-allocations
POST /api/procurement/assign-task-funds
PUT /api/procurement/cross-payment

# Order Processing
GET /api/procurement/orders
POST /api/procurement/process-order
GET /api/procurement/order-status

# Document Management
GET /api/procurement/documents
POST /api/procurement/upload-document
GET /api/procurement/expiring-documents
```

## Phase 3: Database Schema Updates

### New Tables Needed:

```sql
-- User Management Enhancement
CREATE TABLE UserSkills (
    skill_id INT IDENTITY PRIMARY KEY,
    user_id INT FOREIGN KEY REFERENCES Users(user_id),
    skill_name NVARCHAR(100),
    proficiency_level INT -- 1-5 scale
);

CREATE TABLE UserAvailability (
    availability_id INT IDENTITY PRIMARY KEY,
    user_id INT FOREIGN KEY REFERENCES Users(user_id),
    status NVARCHAR(20), -- Available, Busy, Away
    current_task_count INT DEFAULT 0,
    productivity_score DECIMAL(5,2)
);

-- Contact Management
CREATE TABLE Contacts (
    contact_id INT IDENTITY PRIMARY KEY,
    program_id INT FOREIGN KEY REFERENCES Programs(program_id),
    first_name NVARCHAR(50),
    last_name NVARCHAR(50),
    email NVARCHAR(100),
    phone NVARCHAR(20),
    company NVARCHAR(100),
    department NVARCHAR(50),
    address NVARCHAR(500),
    notes NVARCHAR(MAX),
    is_frequent BIT DEFAULT 0,
    created_by INT FOREIGN KEY REFERENCES Users(user_id),
    date_created DATETIME2 DEFAULT GETDATE()
);

-- Task Management Enhancement  
CREATE TABLE TaskAssignments (
    assignment_id INT IDENTITY PRIMARY KEY,
    task_id INT FOREIGN KEY REFERENCES Tasks(task_id),
    assigned_to INT FOREIGN KEY REFERENCES Users(user_id),
    assigned_by INT FOREIGN KEY REFERENCES Users(user_id),
    assignment_date DATETIME2 DEFAULT GETDATE(),
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2)
);

-- System Health Monitoring
CREATE TABLE HealthChecks (
    check_id INT IDENTITY PRIMARY KEY,
    endpoint_name NVARCHAR(100),
    check_time DATETIME2 DEFAULT GETDATE(),
    status NVARCHAR(20), -- healthy, warning, error
    response_time_ms INT,
    message NVARCHAR(500)
);

-- Procurement System (Already exists per database)
-- Sponsors, SponsorFunds, FundingDocuments, TaskFundAllocations, OrderFundAllocations
```

## Phase 4: Implementation Priority

### Week 1: Database Mock Data Migration
1. ✅ Create migration scripts for Users table population
2. ✅ Migrate team member data with skills/availability
3. ✅ Create contact management tables and data
4. ✅ Setup task management enhancement

### Week 2: Debug Control Backend  
1. ✅ Implement system health endpoints
2. ✅ Add performance monitoring
3. ✅ Create test execution endpoints
4. ✅ Update HealthDashboard to use APIs

### Week 3: Procurement Backend
1. ✅ Implement fund management APIs
2. ✅ Create task allocation endpoints  
3. ✅ Build order processing workflow
4. ✅ Update ProcurementDashboard

### Week 4: Frontend Cleanup
1. ✅ Remove all hardcoded mock data
2. ✅ Update components to use API calls
3. ✅ Add error handling for API failures
4. ✅ Test and validate all functionality

## Files Requiring Updates

### Frontend Files to Modify:
- `src/context/RBACContext.tsx` - Remove mock data
- `src/views/project-management/ProjectManagementDashboard.tsx` - API-based team members
- `src/api/contacts/ContactsData.tsx` - Remove MSW handlers
- `src/hooks/api/useTaskHooks.ts` - Real API calls
- `src/services/api.ts` - Remove mock implementations
- `src/views/inventory/components/InventoryStatsCards.tsx` - Use real cost data

### Backend Files to Create:
- `api/routes/health.js` - Health monitoring endpoints
- `api/routes/procurement.js` - Procurement management
- `api/routes/contacts.js` - Contact management
- `api/routes/tasks.js` - Enhanced task management

### Database Files:
- `database/mock_data_migration.sql` - Population scripts
- `database/schema_updates.sql` - New table creation

## Success Criteria

1. ✅ Zero hardcoded data in frontend components
2. ✅ All mock API calls replaced with real endpoints  
3. ✅ Debug dashboard fully functional with backend
4. ✅ Procurement dashboard operational
5. ✅ Performance maintained or improved
6. ✅ No functionality loss during migration

## Risk Mitigation

1. **Backup Strategy**: Keep mock data in separate files during transition
2. **Gradual Migration**: Migrate one component at a time
3. **Fallback Options**: Maintain development-mode mock data
4. **Testing**: Comprehensive testing after each migration step
