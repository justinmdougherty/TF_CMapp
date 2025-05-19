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

**Last Updated:** May 16, 2025 (Adjust to the current date when you commit)

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
* [x] **PR Project Specific UI (Mock):**
  * [x] Created `PRBatchTrackingComponent.tsx` in `src/views/project-detail/`.
    * [x] Embedded PR-specific step definitions and mock batch data.
    * [x] Implemented UI for table of units (with select all/individual selection) and step update panel.
    * [x] Implemented local state logic for updating step statuses for selected units within the mock.
  * [x] Conditionally rendered `PRBatchTrackingComponent` within `ProjectDetailPage.tsx` when `project.name === 'PR'`.
  * [x] Resolved TypeScript prop passing error for `projectId`.

### In Progress 🚧

* [ ] **Layout Adjustments for `PRBatchTrackingComponent`:**
  * [ ] Make the component wider to utilize more screen space.
* [ ] **App Integration (from Full Template):**
  * [ ] **Tickets App:** Continue resolving any remaining dependencies or issues. Verify full functionality.
  * [ ] **Notes App:** Integrate from the full template.
  * [ ] **Calendar App:** Integrate from the full template.
* [ ] **State Management (Client-Side - Zustand):**
  * [ ] Install Zustand.
  * [ ] Create initial stores (e.g., for UI state, `authStore` for certificate user info).
  * [ ] Integrate `authStore` with `SidebarProfile/Profile.tsx`.

### To Do 📝

* **Core Features - UI Shells & TanStack Query Integration:**
  * [ ] **Inventory Page:**
    * [ ] Design layout (table/grid).
    * [ ] Create `src/types/inventory.ts` for `InventoryItem` interface.
    * [ ] Create `src/services/inventoryService.ts` (with mock data).
    * [ ] Create `src/hooks/useInventory.ts`.
    * [ ] Implement UI with TanStack Query for data fetching.
    * [ ] Create `AddInventoryItemForm.tsx` (static UI initially, then integrate with `useMutation`).
  * [ ] **Project Detail Page (Non-PR Projects):**
    * [ ] Define and display relevant details for non-PR projects if different from current generic display.
  * [ ] **Production Order Views:**
    * [ ] Design list & detail views.
    * [ ] Create types, services, and hooks for production orders.
    * [ ] Implement UI with TanStack Query.
    * [ ] Create forms (static UI then `useMutation`).
* **TanStack Query Mutations:**
  * [ ] Implement `useMutation` hooks for `add`, `update`, `delete` operations (projects, inventory, PR batch steps).
  * [ ] Connect forms to these mutations.
  * [ ] Implement optimistic updates or query invalidation.
* **Real-Time Updates (for other users):**
  * [ ] Evaluate need: Start with TanStack Query's `refetchOnWindowFocus` and `refetchInterval`.
  * [ ] If more immediate updates are needed, plan for WebSockets/SSE.
* **API Service Layer:**
  * [ ] Update all `*Service.ts` files to make actual `Workspace` calls to the backend.
* **Forms & Validation:**
  * [ ] Implement form validation.
* **Styling Finalization:**
  * [ ] Get client feedback on the theme.
  * [ ] Ensure responsiveness.
* **Testing & Documentation.**
* **Local Dev Certificate Issue (Low Priority / Later).**

## Notes on Template and Dependencies

* This project uses the **Vite** build tool.
* Primary UI library: **Material UI (MUI)**.
* Icons: **Tabler Icons** (via `@tabler/icons-react`).
* Server State Management: **TanStack Query (`@tanstack/react-query`)**.
* Certificate Parsing: **`node-forge`**.
* Refer to the full "Modernize" template documentation for details on its components and structure if needed when integrating full app features.

