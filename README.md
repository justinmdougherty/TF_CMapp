# Production Management & Inventory Tracking App

Internal web application using React and TypeScript for production management and inventory tracking for a small team (~10 users). The application is styled using Material UI (MUI) and communicates with an existing Node.js/Express API backed by an MSSQL database.

This project was bootstrapped from the "Modernize - React and Next.js Admin Dashboard" template (Vite + TypeScript version, starterkit).

## Project Setup

1. **Navigate to the project directory:**

    ```bash
    cd path/to/your/TF_CMapp
    ```

2. **Install dependencies:**

    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```

3. **Configure API Proxy:**
    * Ensure the `server.proxy` in `vite.config.ts` is correctly pointing to your backend API.
        Example:

        ```typescript
        // vite.config.ts
        server: {
          proxy: {
            '/api': {
              target: '[http://h10-websvr01.rdte.nswc.navy.mil:3000/](http://h10-websvr01.rdte.nswc.navy.mil:3000/)', // Or your local backend
              changeOrigin: true,
              secure: false,
            },
          },
        },
        ```

4. **Run the development server:**

    ```bash
    npm run dev
    # or
    # yarn dev
    # or
    # pnpm dev
    ```

    The application will typically be available at `http://localhost:5173`.

## Project Progress & TODO List

**Last Updated:** May 22, 2025

### Completed ✅

* [x] **Initial Setup:**
  * [x] Chose "Modernize - React and Next.js Admin Dashboard" template (Plus license).
  * [x] Selected Vite + TypeScript version (`starterkit`).
  * [x] Installed initial dependencies and launched the starter application.
* [x] **Basic Page Structure:**
  * [x] Replaced sample page with a "Projects Dashboard" (`src/views/dashboard/ProjectsDashboardPage.tsx`).
    * [x] Displays project cards using TanStack Query with mock data.
    * [x] Cards are clickable and navigate to project detail pages (e.g., `/project/:projectId`).
  * [x] `ProjectDetailPage.tsx` (`src/views/project-detail/`) created and uses TanStack Query with mock data.
* [x] **Navigation:**
  * [x] Removed top header navigation links (Apps, Chat, Calendar, Email).
  * [x] Updated sidebar navigation (`MenuItems.ts`) with relevant links and placeholder pages.
  * [x] Added routes for placeholder pages in `Router.tsx`.
* [x] **Styling & Theming:**
  * [x] Updated theme files (`DefaultColors.tsx`, `LightThemeColors.tsx`, `DarkThemeColors.tsx`) for a professional "Government Blue" theme.
  * [x] Set "GOVERNMENT_BLUE_THEME" as the default active theme.
  * [x] Iterated on light theme background/paper colors to improve contrast.
* [x] **Layout Adjustments:**
  * [x] Removed default image/graphic from the `Breadcrumb` component.
  * [x] Resolved double breadcrumb issue on Project Detail page.
  * [x] Adjusted layout of batch tracking components for better width utilization.
  * [x] Implemented responsive width expansion for PR projects using breakpoint-specific widths.
* [x] **Sidebar Profile:**
  * [x] Integrated `certificateService.ts` and `node-forge`.
  * [x] Updated `SidebarProfile/Profile.tsx` for dynamic user name and initials avatar.
  * [x] Configured Vite proxy for `/api` calls.
* [x] **Dependency Integration & File Structure:**
  * [x] Copied `Scrollbar` component from full template.
  * [x] Began process for integrating "Tickets" app (copied files, context, ChildCard, updated router).
  * [x] Resolved file casing and import issues (e.g., `src/types/project.ts`).
  * [x] Centralized `Project` interface.
* [x] **State Management (Server State - Initial Setup):**
  * [x] Installed `@tanstack/react-query`.
  * [x] Wrapped application with `QueryClientProvider` in `src/main.tsx`.
  * [x] Created `src/services/projectService.ts` with mock API functions.
  * [x] Created `src/hooks/useProjects.ts` with `useGetProjects` and `useGetProjectById`.
  * [x] Refactored `ProjectsDashboardPage.tsx` and `ProjectDetailPage.tsx` to use these hooks.
* [x] **Generic Batch Tracking System:**
  * [x] **Refactored PRBatchTrackingComponent into Generic BatchTrackingComponent:**
    * [x] Created configuration-driven system supporting multiple project types.
    * [x] Implemented `PROJECT_TYPE_CONFIGS` with support for PR and ASSEMBLY project types.
    * [x] Built flexible table column system with tab-specific visibility.
    * [x] Added configurable step definitions per project type.
    * [x] Implemented dynamic serial number prefix handling.
    * [x] Created extensible interface system for adding new project types.
  * [x] **Enhanced UI Features:**
    * [x] Added unit detail modal with individual step progress tracking.
    * [x] Implemented modal navigation (Previous/Next) for efficient unit review.
    * [x] Added color-coded status indicators in detail view.
    * [x] Included "Next Steps Required" section for incomplete units.
    * [x] Fixed selection preservation when applying status updates.
    * [x] Enhanced click handling to distinguish between row clicks and checkbox clicks.
  * [x] **Table Enhancements:**
    * [x] Increased component size and improved text readability.
    * [x] Optimized grid layout (9/12 for table, 3/12 for controls on In Progress tab).
    * [x] Added responsive column widths using percentages.
    * [x] Implemented proper overflow handling without horizontal scroll bars.
  * [x] **Integration Updates:**
    * [x] Updated `ProjectDetailPage.tsx` to use generic `BatchTrackingComponent`.
    * [x] Added project type detection based on `project.name`.
    * [x] Implemented conditional rendering for supported batch tracking types.
    * [x] Applied responsive width expansion to both project details and batch tracking sections.

### In Progress 🚧

* **Styling & Theming (Light Theme Contrast):**
  * [ ] Continue iterating on light theme colors to improve contrast between `background.default` and `background.paper` to ensure UI elements are clearly distinguishable.
* **App Integration (from Full Template):**
  * [ ] **Tickets App:** Continue resolving any remaining dependencies or issues. Verify full functionality.
  * [ ] **Notes App:** Integrate from the full template. (Consider how batch-level notes from batch tracking will integrate here).
  * [ ] **Calendar App:** Integrate from the full template. (Plan to display batch start/target completion dates).
* **State Management (Client-Side - Zustand):**
  * [ ] Install Zustand.
  * [ ] Create initial stores (e.g., for UI state, `authStore` for certificate user info).
  * [ ] Integrate `authStore` with `SidebarProfile/Profile.tsx` (if not fully covered by `certificateService` for display).

### To Do 📝

* **Database Design & Backend Integration for Dynamic Projects & Inventory:**
  * [ ] **Design and Implement Core Tables (MSSQL):** See [Database Schema](#database-schema) section below.
  * [ ] **Develop API Endpoints:** Create Node.js/Express API endpoints for CRUD operations on the new database tables.
  * [ ] **Refactor Frontend Services (`*Service.ts` files):** Update to make actual `fetch` calls to the new backend API endpoints.
  * [ ] **Connect Generic Batch Tracking to Database:**
    * [ ] Fetch project-specific steps based on `ProjectID`.
    * [ ] Fetch and update batch data, unit data, and step progress via API calls.
    * [ ] Implement logic for automatic inventory decrementation on step completion (backend process triggered by frontend action).
* **Extend Generic Batch Tracking System:**
  * [ ] Add more project type configurations to `PROJECT_TYPE_CONFIGS`.
  * [ ] Implement custom field support for different project types.
  * [ ] Add project type management UI for administrators.
  * [ ] Implement step template system for reusable step definitions.
* **Core Features - UI Shells & TanStack Query Integration (continued):**
  * [ ] **User Interface for Project & Step Management:**
    * [ ] UI for users to create/edit projects.
    * [ ] UI for users to define/edit steps for each project, including their order.
    * [ ] UI for users to associate inventory items and consumption quantities with specific steps.
  * [ ] **Inventory Page (Full Implementation):**
    * [ ] Design layout (table/grid) for `InventoryItems`.
    * [ ] Create `src/types/inventory.ts` for `InventoryItem` interface.
    * [ ] Create `src/services/inventoryService.ts` and `src/hooks/useInventory.ts` (for API calls).
    * [ ] Implement UI with TanStack Query for data fetching, display, and updates.
    * [ ] Create `AddInventoryItemForm.tsx` (integrate with `useMutation`).
    * [ ] Implement inventory adjustment features.
  * [ ] **Production Order Views (Full Implementation):**
    * [ ] Design list & detail views for `ProductionBatches`.
    * [ ] Create types, services, and hooks for production orders/batches.
    * [ ] Implement UI with TanStack Query.
    * [ ] Create forms for creating/editing batches (integrate with `useMutation`).
* **TanStack Query Mutations:**
  * [ ] Implement `useMutation` hooks for all `add`, `update`, `delete` operations (projects, inventory, batch steps, adding units to batch, etc.).
  * [ ] Connect forms to these mutations.
  * [ ] Implement optimistic updates or query invalidation strategies.
* **Batch Notes Integration:**
  * [ ] Design UI for viewing/editing batch-level notes (e.g., in batch tracking component or linked `Notes` app component).
  * [ ] Ensure `ProductionBatches` table and API support saving/retrieving these notes.
* **Calendar Integration:**
  * [ ] Display `BatchStartDate` and `BatchTargetCompletionDate` from `ProductionBatches` on the Calendar app.
* **Real-Time Updates (for other users):**
  * [ ] Evaluate need: Start with TanStack Query's `refetchOnWindowFocus` and `refetchInterval`.
  * [ ] If more immediate updates are needed, plan for WebSockets/SSE for changes in batch/step status.
* **Forms & Validation:**
  * [ ] Implement robust form validation across all input forms.
* **Styling Finalization & Responsiveness:**
  * [ ] Get client feedback on the theme.
  * [ ] Ensure responsiveness across devices.
* **Testing & Documentation.**
* **Configuration Management (Further Considerations):**
  * [ ] **Database Schema Management/Migrations:** Implement a tool/strategy (e.g., Flyway, Liquibase, or custom scripts) for managing database schema changes across environments.
  * [ ] **API Versioning Strategy:** Plan if/how the API will be versioned as it evolves.
  * [ ] **Environment Configuration:** Ensure a robust way to manage different configurations (API URLs, database connections) for dev, test, and production environments (e.g., using `.env` files).
  * [ ] **Build and Deployment Automation:** Set up CI/CD pipelines.
  * [ ] **Comprehensive CM Documentation:** Document all CM processes and configurations.
* **Local Dev Certificate Issue (Low Priority / Later).**

## Generic Batch Tracking System Architecture

### Overview

The batch tracking system has been designed as a highly configurable, reusable component that can support multiple project types with different workflows, steps, and requirements.

### Key Components

#### 1. **BatchTrackingComponent.tsx**

The main generic component that renders the batch tracking interface based on configuration.

**Props:**
* `projectId: string` - The ID of the project
* `projectType: string` - Determines which configuration to load

#### 2. **PROJECT_TYPE_CONFIGS**

Configuration object that defines how each project type should behave:

```typescript
const PROJECT_TYPE_CONFIGS: Record<string, ProjectTypeConfig> = {
  PR: { /* PR-specific configuration */ },
  ASSEMBLY: { /* Assembly-specific configuration */ },
  // Easy to add more project types
}
```

#### 3. **Configuration Structure**

Each project type configuration includes:
* **Steps**: Array of production steps with order and descriptions
* **Table Columns**: Dynamic column definitions with tab-specific visibility
* **Unit Fields**: Form fields for creating new units
* **Serial Number Prefixes**: Automatic S/N generation patterns

### Highly Reusable Parts

✅ **UI Structure:**
* Two-panel layout (units table + action panel)
* MUI Table structure for displaying units
* Checkbox selection logic (select all, individual selection)
* Tabs for "In Progress" / "Completed" / "Shipped" filtering
* "Add Units" modal with form inputs
* Step update panel with dropdowns and apply functionality

✅ **State Management:**
* `selectedUnits` tracking
* `currentStepIdToUpdate` and `currentStatusToApply`
* `activeTab` management
* Modal visibility and form state
* Selection preservation during status updates

✅ **Helper Functions:**
* `isUnitComplete()` - Determines if all steps are finished
* `getUnitLastCompletedStepInfo()` - Finds most recent completed step
* Unit detail modal with navigation capabilities

### Dynamic Parts (Configuration-Driven)

🔧 **Project-Specific Steps:**
* Steps are now loaded from `config.steps` instead of hardcoded
* Each project type can have different numbers and types of steps
* Step names, descriptions, and order are fully configurable

🔧 **Table Columns:**
* Columns are defined in configuration with tab-specific visibility
* Width, labels, and rendering logic can be customized per project type
* Support for conditional columns (e.g., PCB S/N only for certain projects)

🔧 **Serial Number Generation:**
* Configurable prefixes per project type
* Support for different S/N patterns (Unit S/N, PCB S/N, etc.)
* Optional fields based on project requirements

🔧 **Unit Data Structure:**
* Base structure is consistent across project types
* Additional custom fields supported via `[key: string]: any`
* Flexible enough to handle project-specific requirements

### Adding New Project Types

To add a new project type (e.g., "TESTING"):

1. **Add Configuration:**

```typescript
TESTING: {
  projectType: 'TESTING',
  displayName: 'Testing Project',
  steps: [
    { id: 'test_step_01', name: 'Initial calibration', order: 1 },
    { id: 'test_step_02', name: 'Performance test', order: 2 },
    // ... more steps
  ],
  tableColumns: [
    { id: 'unitSN', label: 'Test Unit S/N', width: '20%', tabs: ['inProgress', 'completed'] },
    // ... more columns
  ],
  unitFields: [
    { key: 'unitSN', label: 'Test Unit S/N', type: 'text', required: true },
  ],
  snPrefix: { unit: 'TEST-' },
}
```

2. **Update Supported Types:**

```typescript
const supportedBatchTypes = ['PR', 'ASSEMBLY', 'TESTING'];
```

3. **Database Integration:** Ensure your database schema supports the new project type and its specific requirements.

### Current Project Type Examples

#### **PR Project:**

- 17 detailed manufacturing steps
* Dual S/N tracking (Unit + PCB)
* Complex assembly workflow with potting and wiring steps

#### **Assembly Project:**

- 6 streamlined assembly steps
* Single S/N tracking
* Simplified workflow for basic assembly operations

## Database Schema

This schema is designed to support user-defined projects, dynamic steps per project, and inventory consumption tied to those steps.

### Table Definitions

#### 1. Projects

Stores information about each project.

```sql
CREATE TABLE Projects (
    ProjectID INT IDENTITY(1,1) PRIMARY KEY,
    ProjectName NVARCHAR(255) NOT NULL UNIQUE,
    ProjectDescription NVARCHAR(MAX) NULL,
    ProjectType NVARCHAR(50) NOT NULL, -- e.g., 'PR', 'ASSEMBLY', 'TESTING'
    CreatedDate DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    CreatedByUserID NVARCHAR(255) NULL,
    IsActive BIT NOT NULL DEFAULT 1
);
```

#### 2. StepDefinitions

Defines the unique sequence of steps for each project.

```sql
CREATE TABLE StepDefinitions (
    StepDefinitionID INT IDENTITY(1,1) PRIMARY KEY,
    ProjectID INT NOT NULL,
    StepName NVARCHAR(255) NOT NULL,
    StepOrder INT NOT NULL,
    StepDescription NVARCHAR(MAX) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    
    CONSTRAINT FK_StepDefinitions_Projects 
        FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID),
    CONSTRAINT UQ_StepDefinitions_ProjectOrder 
        UNIQUE (ProjectID, StepOrder),
    CONSTRAINT UQ_StepDefinitions_ProjectName 
        UNIQUE (ProjectID, StepName)
);
```

#### 3. InventoryItems

Master list of all inventory items.

```sql
CREATE TABLE InventoryItems (
    InventoryItemID INT IDENTITY(1,1) PRIMARY KEY,
    ItemName NVARCHAR(255) NOT NULL UNIQUE,
    ItemDescription NVARCHAR(MAX) NULL,
    PartNumber NVARCHAR(100) NULL UNIQUE,
    CurrentStock DECIMAL(18, 4) NOT NULL DEFAULT 0,
    UnitOfMeasure NVARCHAR(50) NOT NULL, -- e.g., 'pieces', 'cm', 'grams'
    MinStockLevel DECIMAL(18, 4) NULL,
    MaxStockLevel DECIMAL(18, 4) NULL,
    SupplierID INT NULL,
    LastUpdatedDate DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    IsActive BIT NOT NULL DEFAULT 1
);
```

#### 4. StepInventoryConsumption

Links specific steps to the inventory items they consume.

```sql
CREATE TABLE StepInventoryConsumption (
    ConsumptionID INT IDENTITY(1,1) PRIMARY KEY,
    StepDefinitionID INT NOT NULL,
    InventoryItemID INT NOT NULL,
    QuantityConsumed DECIMAL(18, 4) NOT NULL,
    
    CONSTRAINT FK_StepInventory_StepDef 
        FOREIGN KEY (StepDefinitionID) REFERENCES StepDefinitions(StepDefinitionID),
    CONSTRAINT FK_StepInventory_Items 
        FOREIGN KEY (InventoryItemID) REFERENCES InventoryItems(InventoryItemID),
    CONSTRAINT UQ_StepInventory_StepItem 
        UNIQUE (StepDefinitionID, InventoryItemID),
    CONSTRAINT CK_StepInventory_Quantity 
        CHECK (QuantityConsumed > 0)
);
```

#### 5. ProductionBatches

Tracks batches of units being produced for a specific project.

```sql
CREATE TABLE ProductionBatches (
    ProductionBatchID INT IDENTITY(1,1) PRIMARY KEY,
    ProjectID INT NOT NULL,
    BatchName NVARCHAR(255) NOT NULL,
    QuantityPlanned INT NOT NULL,
    BatchStartDate DATE NULL,
    BatchTargetCompletionDate DATE NULL,
    BatchActualCompletionDate DATE NULL,
    BatchNotes NVARCHAR(MAX) NULL,
    CreatedDate DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    CreatedByUserID NVARCHAR(255) NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Pending', 'In Progress', 'Completed', 'Archived'
    
    CONSTRAINT FK_ProductionBatches_Projects 
        FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID)
);
```

#### 6. BatchUnits

Stores individual units within a production batch.

```sql
CREATE TABLE BatchUnits (
    BatchUnitID INT IDENTITY(1,1) PRIMARY KEY,
    ProductionBatchID INT NOT NULL,
    UnitSerialNumber NVARCHAR(100) NOT NULL,
    PCBSerialNumber NVARCHAR(100) NULL,
    DateAdded DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    IsShipped BIT NOT NULL DEFAULT 0,
    ShippedDate DATETIME2(7) NULL,
    DateFullyCompleted DATETIME2(7) NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'In Progress', -- 'In Progress', 'Completed', 'Shipped', 'Scrapped'
    
    CONSTRAINT FK_BatchUnits_Batches 
        FOREIGN KEY (ProductionBatchID) REFERENCES ProductionBatches(ProductionBatchID),
    CONSTRAINT UQ_BatchUnits_Serial 
        UNIQUE (ProductionBatchID, UnitSerialNumber)
);
```

#### 7. UnitStepProgress

Tracks the progress of each unit through its defined project steps.

```sql
CREATE TABLE UnitStepProgress (
    UnitStepProgressID INT IDENTITY(1,1) PRIMARY KEY,
    BatchUnitID INT NOT NULL,
    StepDefinitionID INT NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Not Started', -- 'Not Started', 'In Progress', 'Complete', 'N/A', 'Skipped'
    CompletedDate DATETIME2(7) NULL,
    CompletedByUserID NVARCHAR(255) NULL,
    Notes NVARCHAR(MAX) NULL,
    LastUpdatedDate DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT FK_UnitStepProgress_Units 
        FOREIGN KEY (BatchUnitID) REFERENCES BatchUnits(BatchUnitID),
    CONSTRAINT FK_UnitStepProgress_Steps 
        FOREIGN KEY (StepDefinitionID) REFERENCES StepDefinitions(StepDefinitionID),
    CONSTRAINT UQ_UnitStepProgress_UnitStep 
        UNIQUE (BatchUnitID, StepDefinitionID)
);
```

### Future Tables (Considerations)

#### Users

```sql
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(255) NOT NULL UNIQUE,
    DisplayName NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NULL,
    Role NVARCHAR(50) NOT NULL DEFAULT 'User',
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME2(7) NOT NULL DEFAULT GETDATE()
);
```

#### InventoryTransactions

```sql
CREATE TABLE InventoryTransactions (
    TransactionID INT IDENTITY(1,1) PRIMARY KEY,
    InventoryItemID INT NOT NULL,
    TransactionType NVARCHAR(50) NOT NULL, -- 'Consume', 'Receive', 'Adjust', 'Transfer'
    QuantityChange DECIMAL(18, 4) NOT NULL, -- Positive for additions, negative for consumption
    TransactionDate DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    UserID INT NULL,
    RelatedBatchUnitID INT NULL, -- For step-based consumption
    RelatedStepDefinitionID INT NULL, -- For step-based consumption
    Notes NVARCHAR(MAX) NULL,
    
    CONSTRAINT FK_InventoryTrans_Items 
        FOREIGN KEY (InventoryItemID) REFERENCES InventoryItems(InventoryItemID),
    CONSTRAINT FK_InventoryTrans_Users 
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
```

### Data Type Notes

* **`INT IDENTITY(1,1)`**: Auto-incrementing integer primary key
* **`UNIQUEIDENTIFIER DEFAULT NEWID()`**: For globally unique IDs if preferred
* **`NVARCHAR(X)`**: Unicode string data. `NVARCHAR(MAX)` for very long strings
* **`DATETIME2(7)`**: High precision date and time. `DATE` for date only
* **`BIT`**: Boolean values (0 or 1)
* **`DECIMAL(P, S)`**: Precise numeric values (e.g., `DECIMAL(18, 4)` for quantities with 4 decimal places)

### Indexing Recommendations

```sql
-- Performance indexes for frequently queried columns
CREATE INDEX IX_StepDefinitions_ProjectID ON StepDefinitions(ProjectID);
CREATE INDEX IX_ProductionBatches_ProjectID ON ProductionBatches(ProjectID);
CREATE INDEX IX_BatchUnits_ProductionBatchID ON BatchUnits(ProductionBatchID);
CREATE INDEX IX_UnitStepProgress_BatchUnitID ON UnitStepProgress(BatchUnitID);
CREATE INDEX IX_UnitStepProgress_StepDefinitionID ON UnitStepProgress(StepDefinitionID);
CREATE INDEX IX_InventoryTransactions_InventoryItemID ON InventoryTransactions(InventoryItemID);
```

## API Endpoints

### Projects API

```
GET    /api/projects                     # Get all projects
GET    /api/projects/:id                 # Get project by ID
POST   /api/projects                     # Create new project
PUT    /api/projects/:id                 # Update project
DELETE /api/projects/:id                 # Delete project
GET    /api/projects/:id/steps           # Get steps for project
POST   /api/projects/:id/steps           # Create step for project
PUT    /api/projects/steps/:stepId       # Update step
DELETE /api/projects/steps/:stepId       # Delete step
```

### Production Batches API

```
GET    /api/batches                      # Get all batches
GET    /api/batches/:id                  # Get batch by ID
POST   /api/batches                      # Create new batch
PUT    /api/batches/:id                  # Update batch
DELETE /api/batches/:id                  # Delete batch
GET    /api/batches/:id/units            # Get units in batch
POST   /api/batches/:id/units            # Add units to batch
PUT    /api/batches/units/:unitId        # Update unit
DELETE /api/batches/units/:unitId        # Delete unit
```

### Unit Step Progress API

```
GET    /api/units/:unitId/progress       # Get all step progress for unit
PUT    /api/units/:unitId/steps/:stepId  # Update step status for unit
POST   /api/units/bulk-update            # Bulk update step status for multiple units
```

### Inventory API

```
GET    /api/inventory                    # Get all inventory items
GET    /api/inventory/:id                # Get inventory item by ID
POST   /api/inventory                    # Create new inventory item
PUT    /api/inventory/:id                # Update inventory item
DELETE /api/inventory/:id                # Delete inventory item
GET    /api/inventory/:id/transactions   # Get transactions for item
POST   /api/inventory/:id/adjust         # Adjust inventory levels
```

### Authentication API

```
GET    /api/auth/user                    # Get current user info
POST   /api/auth/login                   # Login (if using form auth)
POST   /api/auth/logout                  # Logout
```
