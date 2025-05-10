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

**Last Updated:** May 10, 2025 (Adjust to the current date when you commit)

### Completed ✅

* [x] **Initial Setup:**
  * [x] Chose "Modernize - React and Next.js Admin Dashboard" template (Plus license).
  * [x] Selected Vite + TypeScript version (`starterkit`).
  * [x] Installed initial dependencies and launched the starter application.
* [x] **Basic Page Structure:**
  * [x] Replaced sample page with a "Projects Dashboard" (`src/views/dashboard/ProjectsDashboardPage.tsx`).
    * [x] Displays project cards (initially static, now uses TanStack Query with mock data).
    * [x] Cards are clickable and navigate to project detail pages (e.g., `/project/:projectId`).
  * [x] Created `ProjectDetailPage.tsx` (now uses TanStack Query with mock data).
* [x] **Navigation:**
  * [x] Removed top header navigation links (Apps, Chat, Calendar, Email).
  * [x] Updated sidebar navigation (`MenuItems.ts`) to include:
    * Projects Dashboard
    * Inventory (placeholder page created)
    * Notes (placeholder page created)
    * Calendar (placeholder page created)
    * Tickets (placeholder page created)
  * [x] Added routes for new placeholder pages in `Router.tsx`.
* [x] **Styling & Theming:**
  * [x] Discussed moving away from pastel colors for a more professional "Government Blue" theme.
  * [x] Updated `src/theme/DefaultColors.tsx`, `src/theme/LightThemeColors.tsx`, and `src/theme/DarkThemeColors.tsx` with the new color palette.
  * [x] Set "GOVERNMENT_BLUE_THEME" as the default active theme in `config.tsx`.
* [x] **Layout Adjustments:**
  * [x] Removed default image/graphic from the `Breadcrumb` component.
* [x] **Sidebar Profile:**
  * [x] Integrated `certificateService.ts` and `node-forge` to fetch user info from `/api/auth/me`.
  * [x] Updated `SidebarProfile/Profile.tsx` to display dynamic user name and an avatar with initials (Note: Local dev might show "Unknown" due to client cert behavior; works in deployed environment).
  * [x] Configured Vite proxy in `vite.config.ts` for `/api` calls.
* [x] **Dependency Integration & File Structure:**
  * [x] Copied `Scrollbar` component from full template to fix missing import.
  * [x] Began process for integrating "Tickets" app (copied files, context, ChildCard, updated router).
  * [x] Resolved file casing issues for imports (e.g., `src/types/project.ts`).
  * [x] Centralized `Project` interface to `src/types/project.ts`.
* [x] **State Management (Server State - Initial Setup):**
  * [x] Installed `@tanstack/react-query`.
  * [x] Wrapped application with `QueryClientProvider` in `src/main.tsx`.
  * [x] Created `src/services/projectService.ts` with mock API functions (`WorkspaceProjectsAPI`, `WorkspaceProjectByIdAPI`).
  * [x] Created `src/hooks/useProjects.ts` with `useGetProjects` and `useGetProjectById` custom hooks.
  * [x] Refactored `ProjectsDashboardPage.tsx` and `ProjectDetailPage.tsx` to use these hooks for data fetching (currently mock data).

### In Progress 🚧

* [ ] **App Integration (from Full Template):**
  * [ ] **Tickets App:** Continue resolving any remaining dependencies or issues. Verify full functionality.
  * [ ] **Notes App:** Integrate from the full template.
    * Copy files, check/install dependencies, update router, integrate with TanStack Query if it fetches data.
  * [ ] **Calendar App:** Integrate from the full template.
    * Copy files, check/install dependencies, update router, integrate with TanStack Query if it fetches data.
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
  * [ ] **Project Detail Page:**
    * [ ] Expand with sections for project timeline, tasks, documents, etc. Fetch related data using TanStack Query.
  * [ ] **Production Order Views:**
    * [ ] Design list & detail views.
    * [ ] Create types, services, and hooks for production orders.
    * [ ] Implement UI with TanStack Query.
    * [ ] Create forms (static UI then `useMutation`).
* **TanStack Query Mutations:**
  * [ ] Implement `useMutation` hooks in `useProjects.ts` (and other hooks) for `add`, `update`, `delete` operations.
  * [ ] Connect forms to these mutations.
  * [ ] Implement optimistic updates or query invalidation upon successful mutations.
* **Real-Time Updates (for other users):**
  * [ ] Evaluate need: Start with TanStack Query's `refetchOnWindowFocus` (default) and `refetchInterval` for key data.
  * [ ] If more immediate updates are needed, plan for WebSockets/SSE integration on the backend and corresponding client-side invalidation logic with TanStack Query.
* **API Service Layer:**
  * [ ] Update all `*Service.ts` files to make actual `Workspace` calls to the backend API endpoints once they are defined and available.
* **Forms & Validation:**
  * [ ] Implement form validation robustly (e.g., using `Yup` + `react-hook-form` or similar).
* **Styling Finalization:**
  * [ ] Get client feedback on the "Government Blue" theme and make final adjustments.
  * [ ] Ensure responsiveness across different screen sizes.
* **Testing:**
  * [ ] Plan and implement unit and integration tests.
* **Documentation:**
  * [ ] Add more detailed documentation for components and services.
* **Local Dev Certificate Issue:**
  * [ ] (Low Priority / Later) Investigate options for better client certificate handling in the local Vite dev environment (e.g., mock user data in dev mode for `certificateService`).

## Notes on Template and Dependencies

* This project uses the **Vite** build tool.
* Primary UI library: **Material UI (MUI)**.
* Icons: **Tabler Icons** (via `@tabler/icons-react`).
* Server State Management: **TanStack Query (`@tanstack/react-query`)**.
* Certificate Parsing: **`node-forge`**.
* Refer to the full "Modernize" template documentation for details on its components and structure if needed when integrating full app features.

---
