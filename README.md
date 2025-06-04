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

Frontend Data Handling and Display Logic
Here's a conceptual overview of how your frontend application (e.g., using React, Vue, Angular, or similar) would typically handle the data fetched from the database to display a dynamic table for a selected project, like "PR".

This process uses the results from the queries we've discussed, particularly Query 3, Query 4, and Query 5 from the mssql_visualization_queries artifact.

Assumptions:

The user has selected a project (e.g., "PR"). The project_id for "PR" is known.

Your API/backend service can execute these SQL queries and return data, likely as JSON arrays of objects.

Step-by-Step Frontend Logic:

Fetch Column Definitions (Headers):

Action: The frontend makes an API call that executes a query similar to Query 3 (SELECT attribute_name, display_order, attribute_type, is_required FROM AttributeDefinitions WHERE project_id = @TargetProjectID ORDER BY display_order;).

Expected Data Format (JSON from API):

[
  { "attribute_name": "Unit S/N", "display_order": 1, "attribute_type": "TEXT", "is_required": true },
  { "attribute_name": "PCB S/N", "display_order": 2, "attribute_type": "TEXT", "is_required": true },
  { "attribute_name": "Firmware Version", "display_order": 3, "attribute_type": "TEXT", "is_required": false },
  { "attribute_name": "Calibration Date", "display_order": 4, "attribute_type": "DATE", "is_required": false }
]

Frontend Handling:

Store this array. This array defines the columns for your table: their names, order, data type (for potential formatting or input validation), and if they are mandatory.

Use this to render the table headers (<thead><tr><th>...</th></tr></thead>).

Fetch Tracked Items (Base Row Data):

Action: The frontend makes an API call that executes a query similar to Query 4 (SELECT item_id, current_overall_status, is_shipped, ... FROM TrackedItems WHERE project_id = @TargetProjectID;).

Expected Data Format (JSON from API):

[
  { "item_id": 1, "current_overall_status": "In Progress", "is_shipped": false, "item_notes": "Note for item 1" /*...other fixed fields */ },
  { "item_id": 2, "current_overall_status": "Pending", "is_shipped": false, "item_notes": null /* ... */ },
  { "item_id": 3, "current_overall_status": "Completed", "is_shipped": false, "item_notes": "Ready" /* ...*/ }
]

Frontend Handling:

Store this array. Each object represents a row in your table, containing the fixed information about each tracked unit.

Fetch All Attribute Values for these Items (EAV Data):

Action: The frontend makes an API call that executes a query similar to Query 5 (SELECT ti.item_id, ad.attribute_name, iav.attribute_value FROM TrackedItems ti JOIN ItemAttributeValues iav ... WHERE ti.project_id = @TargetProjectID;).

Expected Data Format (JSON from API - "unpivoted"):

[
  { "item_id": 1, "attribute_name": "Unit S/N", "attribute_value": "PR-U0001" },
  { "item_id": 1, "attribute_name": "PCB S/N", "attribute_value": "PR-P0001A" },
  { "item_id": 1, "attribute_name": "Firmware Version", "attribute_value": "v1.0.2" },
  { "item_id": 1, "attribute_name": "Calibration Date", "attribute_value": "2025-06-01" },
  { "item_id": 2, "attribute_name": "Unit S/N", "attribute_value": "PR-U0002" },
  { "item_id": 2, "attribute_name": "PCB S/N", "attribute_value": "PR-P0002B" },
  // Note: No Firmware or Cal Date for item_id 2 in this example data
  { "item_id": 3, "attribute_name": "Unit S/N", "attribute_value": "PR-U0003" },
  { "item_id": 3, "attribute_name": "PCB S/N", "attribute_value": "PR-P0003C" },
  { "item_id": 3, "attribute_name": "Firmware Version", "attribute_value": "v1.1.0" }
]

Transform/Merge Data for Display (Pivoting in Frontend Logic):

Action: This is where the frontend combines the data from steps 1, 2, and 3. For each TrackedItem from step 2, it needs to create a single object that includes its fixed fields and its dynamic attributes as key-value pairs.

Algorithm (Conceptual):

// fetchedColumnDefinitions from Step 1
// fetchedTrackedItems from Step 2
// fetchedAttributeValues (EAV data) from Step 3

const displayableTableData = fetchedTrackedItems.map(item => {
  // Start with the fixed fields of the item
  let rowData = { ...item }; // e.g., { item_id: 1, current_overall_status: "In Progress", ... }

  // Find all attribute values for the current item_id from the EAV data
  const itemSpecificAttributes = fetchedAttributeValues.filter(
    attrVal => attrVal.item_id === item.item_id
  );

  // Populate the dynamic columns
  // Use the attribute_name from fetchedColumnDefinitions as the key
  fetchedColumnDefinitions.forEach(colDef => {
    const attribute = itemSpecificAttributes.find(
      attr => attr.attribute_name === colDef.attribute_name
    );
    // Use the actual attribute_name as the key in the rowData object
    rowData[colDef.attribute_name] = attribute ? attribute.attribute_value : null; // Or undefined, or ""
  });

  return rowData;
});

/*
Example of what `displayableTableData` might look like for "PR":
[
  {
    "item_id": 1,
    "current_overall_status": "In Progress",
    "is_shipped": false,
    "item_notes": "Note for item 1",
    "Unit S/N": "PR-U0001",
    "PCB S/N": "PR-P0001A",
    "Firmware Version": "v1.0.2",
    "Calibration Date": "2025-06-01"
  },
  {
    "item_id": 2,
    "current_overall_status": "Pending",
    "is_shipped": false,
    "item_notes": null,
    "Unit S/N": "PR-U0002",
    "PCB S/N": "PR-P0002B",
    "Firmware Version": null, // Or undefined, because it wasn't in ItemAttributeValues
    "Calibration Date": null  // Or undefined
  },
  // ... other items
]
*/

Frontend Handling:

This displayableTableData array is now in a format that most table components can easily consume. Each object is a row, and the keys of the objects correspond to the column headers.

When rendering the table body (<tbody>), iterate through displayableTableData. For each item, iterate through fetchedColumnDefinitions (to maintain column order) and use item[colDef.attribute_name] to get the cell value.

Why this approach?

Flexibility: The frontend doesn't need to know the column names in advance. It discovers them from AttributeDefinitions (Query 3).

Efficiency: Query 5 (EAV data) can be large, but it's a structured way to get all dynamic data. The transformation (pivot) happens on the client-side.

Standard: This is a common pattern for handling EAV data in applications.

Alternative: SQL PIVOT (Query 5 - PIVOT example)

The PIVOT example in Query 5 shows how SQL could return the data already in a table-like structure.

Challenge: The FOR attribute_name IN ([Col1], [Col2], ...) part of the SQL PIVOT query needs to know the column names in advance. This means you'd have to dynamically construct this part of the SQL query on the backend, based on the results of Query 3. This can be complex and might lead to SQL injection vulnerabilities if not handled very carefully.

Benefit: If done on the backend, the frontend receives data already in the final table format, simplifying frontend logic.

Trade-off: More complex backend logic vs. more complex frontend transformation logic. For many web applications, performing the pivot in the frontend JavaScript is common and often more manageable.

This explanation should give you a clear picture of how the data flows from the database to a dynamically rendered table in your application.
