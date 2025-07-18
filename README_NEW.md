# H10CM - Production Management & Inventory Tracking App

**Multi-tenant web application using React and TypeScript for production management and inventory tracking. The application is styled using Material UI and communicates with a Node.js/Express API backed by an MSSQL database.**

*This project was bootstrapped from the "Modernize - React and Next.js Admin Dashboard" template (Vite + TypeScript version, starterkit).*

## 🚀 Quick Start

```bash
# Navigate to project directory
cd H10CM

# Install dependencies
npm install

# Start development server
npm run dev
# Application available at http://localhost:5173

# Run tests
npm test
```

## 📁 Project Structure

```plaintext
H10CM/
├── src/
│   ├── components/          # React components
│   ├── services/           # API services
│   ├── store/              # State management
│   ├── types/              # TypeScript interfaces
│   └── views/              # Page components
├── api/                    # Backend API
├── h10cm.sql              # Database schema
├── .memory/               # MCP memory server data
└── README.md              # This file
```

## 🚧 **IDENTIFIED DEVELOPMENT WORK**

### **Phase 1: Mock Data Migration & Cleanup (High Priority)**

#### **Frontend Mock Data Requiring Database Migration:**

1. **Team Member Data (ProjectManagementDashboard.tsx)**
   - **Location**: Lines 285-320 in ProjectManagementDashboard.tsx
   - **Mock Data**: Hardcoded team members array with skills, availability, productivity scores
   - **Required**: `TeamMembers` table with user profiles, skills, availability status
   - **Impact**: Task assignment system currently using fake users

2. **User Management System (RBACContext.tsx)**
   - **Location**: `src/context/RBACContext.tsx`, `src/components/auth/LoginComponent.tsx`
   - **Mock Data**: `mockUsers` array, `mockPendingRequests` array
   - **Required**: Complete user authentication backend integration
   - **Impact**: Authentication system using hardcoded user list

3. **Admin Dashboard Data (SiteAdminDashboard.tsx)**
   - **Location**: `src/views/admin/SiteAdminDashboard.tsx`
   - **Mock Data**: Mock programs with user counts, access requests
   - **Required**: Real program management APIs with user statistics
   - **Impact**: Admin functions not connected to real data

4. **Task Management System (useTaskHooks.ts, api.ts)**
   - **Location**: `src/hooks/api/useTaskHooks.ts`, `src/services/api.ts`
   - **Mock Data**: All task CRUD operations, task statistics, user summaries
   - **Required**: Complete task management backend implementation
   - **Impact**: Task system entirely mocked

5. **Inventory Cost Calculations (InventoryStatsCards.tsx)**
   - **Location**: `src/components/procurement/InventoryStatsCards.tsx`
   - **Mock Data**: Hardcoded $10 per item cost estimation
   - **Required**: Real cost tracking in database with actual pricing
   - **Impact**: Financial reporting showing incorrect values

6. **Contact Management (ContactsData.tsx)**
   - **Location**: `src/api/contacts/ContactsData.tsx`
   - **Mock Data**: Complete contact management system
   - **Required**: Real contact storage and management
   - **Impact**: Contact system not persisting data

### **Phase 2: Backend Development (Critical Infrastructure)**

#### **Debug Control Backend (Missing Infrastructure)**

**Required Endpoints:**

- `GET /api/debug/system-metrics` - CPU, memory, disk usage
- `GET /api/debug/database-health` - Connection status, query performance
- `POST /api/debug/run-test` - Execute system tests
- `GET /api/debug/logs` - Application log retrieval
- `GET /api/debug/performance` - API response time monitoring
- `POST /api/debug/clear-cache` - Cache management
- `GET /api/debug/dependency-check` - Service health verification

#### **Procurement Dashboard Backend (Missing Business Logic)**

**Required Endpoints:**

- `GET /api/procurement/funds` - Budget tracking and allocation
- `POST /api/procurement/allocate-funds` - Fund allocation to projects
- `GET /api/procurement/task-allocation` - Resource assignment tracking
- `POST /api/procurement/create-order-batch` - Bulk order processing
- `GET /api/procurement/cross-payments` - Inter-project payment tracking
- `GET /api/procurement/vendor-performance` - Supplier metrics
- `POST /api/procurement/approve-expenditure` - Approval workflow

### **Phase 3: Database Schema Extensions (Required Tables)**

#### **Missing Tables for Mock Data Migration:**

```sql
-- Team Management
CREATE TABLE TeamMembers (
    team_member_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT FOREIGN KEY REFERENCES Users(user_id),
    program_id INT FOREIGN KEY REFERENCES Programs(program_id),
    skills NVARCHAR(500),
    availability_status VARCHAR(50),
    productivity_score DECIMAL(5,2),
    current_task_count INT DEFAULT 0,
    last_active DATETIME2,
    created_date DATETIME2 DEFAULT GETDATE()
);

-- Task Management System
CREATE TABLE Tasks (
    task_id INT IDENTITY(1,1) PRIMARY KEY,
    program_id INT FOREIGN KEY REFERENCES Programs(program_id),
    project_id INT FOREIGN KEY REFERENCES Projects(project_id),
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(1000),
    assigned_to INT FOREIGN KEY REFERENCES Users(user_id),
    priority VARCHAR(20) DEFAULT 'Medium',
    status VARCHAR(50) DEFAULT 'Open',
    due_date DATETIME2,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    created_by INT FOREIGN KEY REFERENCES Users(user_id),
    created_date DATETIME2 DEFAULT GETDATE(),
    modified_date DATETIME2 DEFAULT GETDATE()
);

-- Contact Management
CREATE TABLE Contacts (
    contact_id INT IDENTITY(1,1) PRIMARY KEY,
    program_id INT FOREIGN KEY REFERENCES Programs(program_id),
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(255),
    phone NVARCHAR(50),
    company NVARCHAR(200),
    contact_type VARCHAR(50),
    created_date DATETIME2 DEFAULT GETDATE()
);

-- Enhanced Inventory Costing
ALTER TABLE InventoryItems ADD COLUMN actual_cost DECIMAL(10,2);
ALTER TABLE InventoryItems ADD COLUMN estimated_cost DECIMAL(10,2);
ALTER TABLE InventoryItems ADD COLUMN cost_updated_date DATETIME2;
```

### **Phase 4: Security & Performance (Production Readiness)**

#### **Multi-Tenant Security Audit (CRITICAL)**

- **Status**: ⚠️ Incomplete program-level filtering across all endpoints
- **Risk**: Potential cross-program data access vulnerability
- **Required**: Add `program_id` filtering to ALL API endpoints
- **Priority**: HIGH - Security enhancement needed for production

#### **Performance Optimizations**

- Database query optimization for multi-tenant scenarios
- API response caching for frequently accessed data
- Frontend bundle optimization and code splitting

### **Phase 5: Integration & Testing**

#### **End-to-End Testing**

- Mock data migration validation
- Multi-tenant data isolation verification
- Performance testing under load
- Security penetration testing

#### **User Acceptance Testing**

- Debug dashboard functionality validation
- Procurement workflow testing
- Task management system verification

### **Current Status Summary:**

- ✅ **Cart System**: Fully operational (resolved July 16, 2025)
- ✅ **Pending Orders**: Accurate quantity display (resolved July 15, 2025)
- ⚠️ **Mock Data**: Extensive frontend mocking requiring database migration
- ⚠️ **Backend APIs**: Debug control and procurement endpoints missing
- ⚠️ **Security**: Multi-tenant filtering incomplete
- ⚠️ **Testing**: Comprehensive testing suite needed

---

## 🔧 GitHub Project Management Setup

### Quick Setup Steps:

1. **Issue Templates**: Already configured in `.github/ISSUE_TEMPLATE/`
2. **Labels to Create**: 
   - `critical` (Red), `high-priority` (Red), `medium-priority` (Yellow), `low-priority` (Blue)
   - `bug` (Red), `feature` (Light Blue), `task` (Purple), `security` (Dark Red)
   - `frontend` (Green), `backend` (Blue), `database` (Purple), `api` (Orange)
3. **First Issues to Create**:
   - `[TASK] Complete Multi-Tenant Security Audit for All API Endpoints` (high-priority, security)
   - `[TASK] Migrate Mock Data to Database Storage` (high-priority, database)
   - `[FEATURE] Implement Debug Control Backend` (medium-priority, backend)
   - `[FEATURE] Build Procurement Dashboard Backend` (medium-priority, backend)

### Project Board Structure:
- **Backlog**: New issues and feature requests
- **In Progress**: Currently being worked on
- **Review**: Ready for code review
- **Testing**: In QA/testing phase
- **Done**: Completed and deployed

## 🗃️ Database Schema

### Multi-Tenant Architecture
The database uses a program-centric multi-tenant architecture:

- **Programs**: Root tenant entity
- **Users**: Global users with program access grants
- **ProgramAccess**: Junction table managing user permissions per program
- **All Business Data**: Isolated by program_id

### Core Tables
- `Programs` - Tenant organizations
- `Users` - System users with certificate authentication
- `ProgramAccess` - User-program permissions
- `Projects` - Program-isolated project management
- `InventoryItems` - Program-isolated inventory tracking
- `Orders` - Program-isolated order management

## 🔐 Authentication & Security

### Certificate-Based Authentication
- Uses DoD PKI certificates for user identification
- Header: `x-arr-clientcert` (production) or `development-fallback` (dev)
- Automatic user lookup via certificate subject

### Role-Based Access Control (RBAC)
- **System Admin**: Global platform administration
- **Program Admin**: Full program access
- **Program Write**: Read/write within program
- **Program Read**: Read-only program access

## 🛠️ Development Workflow

### Backend API (Node.js/Express)
```bash
cd api
npm install
npm run dev  # Starts on port 3000
```

### Frontend (React/TypeScript)
```bash
cd H10CM
npm install
npm run dev  # Starts on port 5173
```

### Database (MSSQL)
```sql
-- Run h10cm.sql to create database
-- Connection: localhost, sa, 0)Password, H10CM database
```

## 🧪 Testing

### Frontend Tests (Vitest + React Testing Library)
```bash
npm test
npm run test:coverage
```

### Backend Tests (Jest + Supertest)
```bash
cd api
npm test
```

## 📊 Health Monitoring

- **Endpoint**: `/api/health` - Basic API health check
- **Dashboard**: `http://localhost:5173/debug` - System monitoring (planned)
- **Logs**: Console logging with error tracking

## 🚀 Deployment

### Development
- Frontend: Vite dev server on `localhost:5173`
- Backend: Node.js server on `localhost:3000`
- Database: Local MSSQL instance

### Production
- Frontend: Static build deployed to web server
- Backend: Node.js API server
- Database: Production MSSQL server
- Proxy: Frontend `/api` requests routed to backend

## 📚 Additional Documentation

- [API Documentation Updates](API_DOCUMENTATION_UPDATES.md)
- [API Response Formats](API_RESPONSE_FORMATS.md)
- [Cart System Bug Fix](CART_SYSTEM_BUG_FIX.md)
- [Development Timeline](H10CM/Reference/DEVELOPMENT_TIMELINE.md)
- [Enhanced Task Management](H10CM/Reference/ENHANCED_TASK_MANAGEMENT_README.md)

## 🤝 Contributing

1. Create feature branch from `master`
2. Follow conventional commit messages
3. Add tests for new functionality
4. Update documentation as needed
5. Submit pull request for review

## 📄 License

This project is proprietary software developed for internal use.
