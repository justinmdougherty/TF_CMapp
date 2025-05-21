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

**Last Updated:** May 20, 2025

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
  * [x] Adjusted layout of `PRBatchTrackingComponent` for better height (`70vh` for table).
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
* [x] **PR Project Specific UI (Mock & Enhancements):**
  * [x] Created `PRBatchTrackingComponent.tsx` in `src/views/project-detail/`.
    * [x] Embedded PR-specific step definitions and mock batch data.
    * [x] Implemented UI for table of units (with select all/individual selection) and step update panel.
    * [x] Implemented local state logic for updating step statuses for selected units within the mock.
    * [x] Added Tabs for 'In Progress', 'Completed', and 'Shipped' units.
    * [x] Added 'Add New Units' button and modal functionality (with mock S/N generation).
    * [x] Integrated user name from `certificateService` for "Completed By" field.
    * [x] Added batch start and target completion date fields to modal and display.
  * [x] Conditionally rendered `PRBatchTrackingComponent` within `ProjectDetailPage.tsx` when `project.name === 'PR'`.
  * [x] Resolved TypeScript prop passing errors.

### In Progress 🚧

* **Styling & Theming (Light Theme Contrast):**
  * [ ] Continue iterating on light theme colors to improve contrast between `background.default` and `background.paper` to ensure UI elements are clearly distinguishable.
* **Layout Adjustments for `PRBatchTrackingComponent`:**
  * [ ] Make the component wider to utilize more screen space effectively if still needed.
* **App Integration (from Full Template):**
  * [ ] **Tickets App:** Continue resolving any remaining dependencies or issues. Verify full functionality.
  * [ ] **Notes App:** Integrate from the full template. (Consider how batch-level notes from `PRBatchTrackingComponent` will integrate here).
  * [ ] **Calendar App:** Integrate from the full template. (Plan to display batch start/target completion dates).
* **State Management (Client-Side - Zustand):**
  * [ ] Install Zustand.
  * [ ] Create initial stores (e.g., for UI state, `authStore` for certificate user info).
  * [ ] Integrate `authStore` with `SidebarProfile/Profile.tsx` (if not fully covered by `certificateService` for display).

### To Do 📝

* **Database Design & Backend Integration for Dynamic Projects & Inventory:**
  * [ ] **Design and Implement Core Tables (MSSQL):**
    * [ ] `Projects`: To store project master data (ProjectID PK, ProjectName, etc.).
    * [ ] `StepDefinitions`: To store user-definable steps for each project (StepDefinitionID PK, ProjectID FK, StepName, StepOrder).
    * [ ] `InventoryItems`: Master list of all inventory parts (InventoryItemID PK, ItemName, CurrentStock, UnitOfMeasure, PartNumber).
    * [ ] `StepInventoryConsumption`: Links steps to inventory items they consume (ConsumptionID PK, StepDefinitionID FK, InventoryItemID FK, QuantityConsumed).
    * [ ] `ProductionBatches`: Tracks batches of units (ProductionBatchID PK, ProjectID FK, BatchName, BatchStartDate, BatchTargetCompletionDate, BatchNotes).
    * [ ] `BatchUnits`: Individual units within a batch (BatchUnitID PK, ProductionBatchID FK, UnitSerialNumber, PCBSerialNumber, IsShipped, ShippedDate, DateFullyCompleted).
    * [ ] `UnitStepProgress`: Tracks status of each step for each unit (UnitStepProgressID PK, BatchUnitID FK, StepDefinitionID FK, Status, CompletedDate, CompletedByUserID).
  * [ ] **Develop API Endpoints:** Create Node.js/Express API endpoints for CRUD operations on these new tables.
  * [ ] **Refactor Frontend Services (`*Service.ts` files):** Update to make actual `fetch` calls to the new backend API endpoints.
  * [ ] **Refactor `PRBatchTrackingComponent` (and generalize it):**
    * [ ] Fetch project-specific steps based on `ProjectID`.
    * [ ] Fetch and update batch data, unit data, and step progress via API calls.
    * [ ] Implement logic for automatic inventory decrementation on step completion (backend process triggered by frontend action).
* **Core Features - UI Shells & TanStack Query Integration (continued):**
  * [ ] **User Interface for Project & Step Management:**
    * [ ] UI for users to create/edit projects.
    * [ ] UI for users to define/edit steps for each project, including their order.
    * [ ] UI for users to associate inventory items and consumption quantities with specific steps.
  * [ ] **Inventory Page (Full Implementation):**
    * [ ] Design layout (table/grid) for `InventoryItems`.
    * [ ] Create `src/types/inventory.ts` for `InventoryItem` interface (if not already covered by backend types).
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
  * [ ] Design UI for viewing/editing batch-level notes (e.g., in `PRBatchTrackingComponent` or linked `Notes` app component).
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


Reusability of PRBatchTrackingComponent.tsx for other projects:

Highly Reusable Parts:

The overall UI structure:
Two-panel layout (units table on one side, action panel on the other).
The MUI Table structure for displaying units (Unit S/N, PCB S/N, Last Step, Date).
The checkbox selection logic for units (select all, select individual).
The Tabs for "In Progress" / "Completed" filtering.
The "Add Units" button and modal (the modal UI and basic quantity/SN inputs).
The general concept of an action panel with a dropdown for steps and a dropdown for statuses.
The "Apply to Selected" button logic.
The local state management for:
selectedUnits.
currentStepIdToUpdate.
currentStatusToApply.
activeTab.
Modal visibility and form state for adding units.
Helper functions like isUnitComplete (if the definition of "complete" is consistent) and getUnitLastCompletedStepInfo (though it would operate on the dynamic steps).
Parts That Need to Become Dynamic (Props or Fetched Data):

PR_PROJECT_STEPS: This is currently hardcoded. In a reusable component, this would need to be passed in as a prop, e.g., steps: ProductionStep[]. Your component would then use this steps prop to populate the "Step to Update" dropdown and for any logic that refers to step names or order.
initialMockPRBatch (and batchData state): The actual batch data (units, their current step statuses) would be fetched from your API based on a projectId and/or batchId passed as props. TanStack Query would handle this fetching. The component would then display the fetched data.
createInitialPRStepStatuses and createNewPRUnits: These functions currently use the hardcoded PR_PROJECT_STEPS. When steps is a prop, these functions would need to use that prop to initialize new units correctly for the specific project type's steps. The S/N generation in createNewPRUnits might also need to be more flexible or even server-driven.
TypeScript Interfaces (PRProductionStep, PRProductionUnit, etc.): If the core structure of a "unit" and its "step status" is the same across different project types (even if the actual steps are different), you could use more generic interface names (e.g., ProductionStep, UnitStepStatus, ProductionUnit). If different project types have vastly different data structures for their units or how steps are tracked, you might need different components or a more complex generic component with conditional rendering.
How to Make it Reusable:

Refactor PRBatchTrackingComponent.tsx into a more generic BatchTrackingComponent.tsx.
Props: This generic component would accept props like:
projectId: string
batchId: string
productionSteps: ProductionStep[] (This would be fetched by the parent page or a higher-level hook based on the project type/ID and then passed down).
initialBatchData?: ProductionBatch (Optional, if data is fetched by a parent).
Data Fetching: Inside BatchTrackingComponent.tsx (or a custom hook it uses), you'd use projectId and batchId with TanStack Query to fetch the specific batch data and potentially the productionSteps if they aren't passed as a prop.
Logic Adaptation: All internal logic that currently refers to PR_PROJECT_STEPS would be modified to use the productionSteps prop.
In summary: The core UI and interaction patterns you've built are very solid and reusable. The main change will be to decouple the hardcoded "PR" specific steps and data, making the component driven by props and fetched data. This way, you could use the same BatchTrackingComponent for "Midnight Rain" by simply passing it the "Midnight Rain" steps and batch data.


Database Schema for Production Management & Inventory Tracking
This schema is designed to support user-defined projects, dynamic steps per project, and inventory consumption tied to those steps.

MSSQL Data Type Notes:

INT IDENTITY(1,1): Auto-incrementing integer primary key.

UNIQUEIDENTIFIER DEFAULT NEWID(): For globally unique IDs if preferred over integers.

NVARCHAR(X): For string data (Unicode). NVARCHAR(MAX) for very long strings.

DATETIME2(7): For date and time with high precision. DATE for date only.

BIT: For boolean values (0 or 1).

DECIMAL(P, S): For precise numeric values (e.g., DECIMAL(10, 2) for quantities with 2 decimal places).

1. Projects
Stores information about each project.

TableName: Projects

Columns:

ProjectID INT IDENTITY(1,1) PRIMARY KEY

ProjectName NVARCHAR(255) NOT NULL UNIQUE

ProjectDescription NVARCHAR(MAX) NULL

CreatedDate DATETIME2(7) NOT NULL DEFAULT GETDATE()

CreatedByUserID NVARCHAR(255) NULL (FK to a Users table, if you have one, or store username)

IsActive BIT NOT NULL DEFAULT 1

2. StepDefinitions (or ProjectSteps)
Defines the unique sequence of steps for each project.

TableName: StepDefinitions

Columns:

StepDefinitionID INT IDENTITY(1,1) PRIMARY KEY

ProjectID INT NOT NULL (FK referencing Projects.ProjectID)

StepName NVARCHAR(255) NOT NULL

StepOrder INT NOT NULL (Determines the sequence within a project)

StepDescription NVARCHAR(MAX) NULL

IsActive BIT NOT NULL DEFAULT 1

Constraints:

UNIQUE (ProjectID, StepOrder) - Ensures unique step order within a project.

UNIQUE (ProjectID, StepName) - Ensures unique step names within a project.

FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID)

3. InventoryItems
Master list of all inventory items.

TableName: InventoryItems

Columns:

InventoryItemID INT IDENTITY(1,1) PRIMARY KEY

ItemName NVARCHAR(255) NOT NULL UNIQUE

ItemDescription NVARCHAR(MAX) NULL

PartNumber NVARCHAR(100) NULL UNIQUE

CurrentStock DECIMAL(18, 4) NOT NULL DEFAULT 0

UnitOfMeasure NVARCHAR(50) NOT NULL (e.g., 'pieces', 'cm', 'grams')

MinStockLevel DECIMAL(18, 4) NULL

MaxStockLevel DECIMAL(18, 4) NULL

SupplierID INT NULL (FK to a Suppliers table, if applicable)

LastUpdatedDate DATETIME2(7) NOT NULL DEFAULT GETDATE()

IsActive BIT NOT NULL DEFAULT 1

4. StepInventoryConsumption
Links specific steps to the inventory items they consume and the quantity.

TableName: StepInventoryConsumption

Columns:

ConsumptionID INT IDENTITY(1,1) PRIMARY KEY

StepDefinitionID INT NOT NULL (FK referencing StepDefinitions.StepDefinitionID)

InventoryItemID INT NOT NULL (FK referencing InventoryItems.InventoryItemID)

QuantityConsumed DECIMAL(18, 4) NOT NULL (Must be > 0)

Constraints:

UNIQUE (StepDefinitionID, InventoryItemID) - An item can only be listed once per step.

FOREIGN KEY (StepDefinitionID) REFERENCES StepDefinitions(StepDefinitionID)

FOREIGN KEY (InventoryItemID) REFERENCES InventoryItems(InventoryItemID)

CHECK (QuantityConsumed > 0)

5. ProductionBatches
Tracks batches of units being produced for a specific project.

TableName: ProductionBatches

Columns:

ProductionBatchID INT IDENTITY(1,1) PRIMARY KEY

ProjectID INT NOT NULL (FK referencing Projects.ProjectID)

BatchName NVARCHAR(255) NOT NULL (e.g., "PR Batch 001", "Midnight Rain - Run 3")

QuantityPlanned INT NOT NULL

BatchStartDate DATE NULL

BatchTargetCompletionDate DATE NULL

BatchActualCompletionDate DATE NULL

BatchNotes NVARCHAR(MAX) NULL

CreatedDate DATETIME2(7) NOT NULL DEFAULT GETDATE()

CreatedByUserID NVARCHAR(255) NULL

Status NVARCHAR(50) NOT NULL DEFAULT 'Pending' (e.g., 'Pending', 'In Progress', 'Completed', 'Archived')

Constraints:

FOREIGN KEY (ProjectID) REFERENCES Projects(ProjectID)

6. BatchUnits
Stores individual units within a production batch.

TableName: BatchUnits

Columns:

BatchUnitID INT IDENTITY(1,1) PRIMARY KEY

ProductionBatchID INT NOT NULL (FK referencing ProductionBatches.ProductionBatchID)

UnitSerialNumber NVARCHAR(100) NOT NULL

PCBSerialNumber NVARCHAR(100) NULL

DateAdded DATETIME2(7) NOT NULL DEFAULT GETDATE()

IsShipped BIT NOT NULL DEFAULT 0

ShippedDate DATETIME2(7) NULL

DateFullyCompleted DATETIME2(7) NULL (Date all steps for this unit were completed)

Status NVARCHAR(50) NOT NULL DEFAULT 'In Progress' (e.g., 'In Progress', 'Completed', 'Shipped', 'Scrapped')

Constraints:

UNIQUE (ProductionBatchID, UnitSerialNumber)

FOREIGN KEY (ProductionBatchID) REFERENCES ProductionBatches(ProductionBatchID)

7. UnitStepProgress
Tracks the progress of each unit through its defined project steps. This is where the actual tracking happens.

TableName: UnitStepProgress

Columns:

UnitStepProgressID INT IDENTITY(1,1) PRIMARY KEY

BatchUnitID INT NOT NULL (FK referencing BatchUnits.BatchUnitID)

StepDefinitionID INT NOT NULL (FK referencing StepDefinitions.StepDefinitionID)

Status NVARCHAR(50) NOT NULL DEFAULT 'Not Started' (e.g., 'Not Started', 'In Progress', 'Complete', 'N/A', 'Skipped')

CompletedDate DATETIME2(7) NULL

CompletedByUserID NVARCHAR(255) NULL (Stores the username or ID of the user who completed the step)

Notes NVARCHAR(MAX) NULL (Step-specific notes, if needed in the future, though you mentioned batch-level for now)

LastUpdatedDate DATETIME2(7) NOT NULL DEFAULT GETDATE()

Constraints:

UNIQUE (BatchUnitID, StepDefinitionID) - Each step can only have one status entry per unit.

FOREIGN KEY (BatchUnitID) REFERENCES BatchUnits(BatchUnitID)

FOREIGN KEY (StepDefinitionID) REFERENCES StepDefinitions(StepDefinitionID)

Potential Future Tables (Considerations):
Users: For managing application users, roles, and permissions. CreatedByUserID and CompletedByUserID would then be FKs to this table.

Suppliers: If you need to track inventory suppliers.

InventoryTransactions: For a detailed audit log of all inventory movements (increment, decrement, adjustments) with timestamps, user, reason, etc. This is highly recommended for robust inventory tracking.

Example: (TransactionID PK, InventoryItemID FK, TransactionType NVARCHAR(50), QuantityChange DECIMAL, TransactionDate, UserID FK, Notes)

CalendarEvents / ProjectSchedules: To store the batch start/end dates for display on a calendar view.

Example: (EventID PK, EventType ['BatchSchedule'], RelatedID [ProductionBatchID], StartDate, EndDate, Title)

This schema provides a relational structure that should support your current and planned features. Remember to create appropriate indexes on foreign keys and frequently queried columns for performance.
