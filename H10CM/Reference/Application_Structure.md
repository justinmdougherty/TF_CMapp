# TF_CMapp Application Structure Breakdown

This document provides an overview of the `TF_CMapp` React frontend application's structure, highlighting key components and their dependencies.

## 1. Core Application Flow

The application's entry point and core setup are managed by the following files:

-   **`src/main.tsx`**:
    -   **Purpose**: The main entry point of the React application. It renders the root component (`App`).
    -   **Key Responsibilities**:
        -   Initializes React Query (`QueryClientProvider`) for global data fetching and caching.
        -   Sets up `CustomizerContextProvider` for theme and layout customization.
        -   Includes a `Suspense` fallback for lazy-loaded components, displaying a `Spinner`.
    -   **Dependencies**: `App.tsx`, `views/spinner/Spinner.tsx`, `utils/i18n.ts`, `context/CustomizerContext.tsx`, `react-query`.

-   **`src/App.tsx`**:
    -   **Purpose**: The main application component that sets up the global theme and routing.
    -   **Key Responsibilities**:
        -   Applies the Material UI theme using `ThemeProvider`.
        -   Manages Right-to-Left (RTL) direction with `RTL` component.
        -   Integrates React Router for navigation using `RouterProvider`.
    -   **Dependencies**: `context/CustomizerContext.tsx`, `theme/Theme.tsx`, `layouts/full/shared/customizer/RTL.tsx`, `routes/Router.tsx`, `@mui/material`.

-   **`src/routes/Router.tsx`**:
    -   **Purpose**: Defines the application's routing structure using `react-router-dom`.
    -   **Key Responsibilities**:
        -   Configures routes for different pages and layouts.
        -   Uses `Loadable` for lazy loading components, improving initial load performance.
        -   Defines main layouts (`FullLayout`, `BlankLayout`) and their nested routes.
    -   **Key Routes**:
        -   `/`: Redirects to `/dashboard`.
        -   `/dashboard`: Renders `ProjectsDashboardPage`.
        -   `/project/:projectId`: Renders `ProjectDetailPage` for specific project details.
        -   `/inventory`: Renders `InventoryPage`.
        -   `/apps/notes`: Renders `NotesPage`.
        -   `/apps/calendar`: Renders `CalendarPage`.
        -   `/apps/tickets`: Renders `TicketsPage`.
        -   `/auth/404`: Renders `Error` page for not found routes.
    -   **Dependencies**: `layouts/full/FullLayout.tsx`, `layouts/blank/BlankLayout.tsx`, `layouts/full/shared/loadable/Loadable.tsx`, `views/dashboard/ProjectsDashboardPage.tsx`, `views/project-detail/ProjectDetailPage.tsx`, `views/authentication/Error.tsx`, `views/inventory/InventoryPage.tsx`, `views/apps/notes/Notes.tsx`, `views/apps/calendar/BigCalendar.tsx`, `views/apps/tickets/Tickets.tsx`.

## 2. Key Pages/Views

-   **`src/views/dashboard/ProjectsDashboardPage.tsx`**:
    -   **Purpose**: Displays a dashboard with a list of all available projects.
    -   **Key Responsibilities**: Fetches and renders project data, likely using a React Query hook.
    -   **Dependencies**: Expected to use `hooks/api/useProjectHooks.ts` for data fetching.

-   **`src/views/project-detail/ProjectDetailPage.tsx`**:
    -   **Purpose**: Displays detailed information for a single, selected project.
    -   **Key Responsibilities**:
        -   Fetches specific project data based on a `projectId` from URL parameters.
        -   Acts as a container for other project-specific components, including `BatchTrackingComponent`.
    -   **Dependencies**: Expected to use `hooks/api/useProjectHooks.ts` for data fetching, and renders `BatchTrackingComponent.tsx`.

-   **`src/views/project-detail/BatchTrackingComponent.tsx`**:
    -   **Purpose**: Manages and displays "tracked items" (batches) associated with a project.
    -   **Key Responsibilities**:
        -   Fetches batch data using React Query (`useQuery`).
        -   Manages local state for selected units, step updates, and modal visibility.
        -   Provides UI for updating step statuses and marking units as shipped using React Query mutations (`useMutation`).
        -   Handles adding new units to a batch.
        -   Displays unit details in a modal.
        -   Integrates with `certificateService` to get current user information.
    -   **Dependencies**: `react`, `react-query`, `axios`, `@mui/material` (extensive use of Material UI components like `Table`, `Dialog`, `Button`, `Select`, `TextField`, etc.), `@tabler/icons-react`, `services/certificateService.ts`, `types/Project.ts`.

-   **`src/views/inventory/InventoryPage.tsx`**:
    -   **Purpose**: Manages and displays inventory items.
    -   **Key Responsibilities**: Expected to fetch and display inventory data.
    -   **Dependencies**: Expected to use `hooks/api/useInventoryHooks.ts` for data fetching.

## 3. Data Fetching and Services

-   **`src/hooks/api/useProjectHooks.ts` (Planned)**:
    -   **Purpose**: To encapsulate API calls related to projects using React Query custom hooks.
    -   **Key Responsibilities**: Provide hooks like `useProjects` (for fetching all projects) and `useProjectDetails` (for fetching a single project).
    -   **Dependencies**: `axios`, `react-query`, `services/api.ts`, `types/Project.ts`.

-   **`src/hooks/api/useInventoryHooks.ts` (Planned)**:
    -   **Purpose**: To encapsulate API calls related to inventory using React Query custom hooks.
    -   **Key Responsibilities**: Provide hooks for fetching inventory items and adjusting stock.
    -   **Dependencies**: `axios`, `react-query`, `services/api.ts`, `types/Inventory.ts`.

-   **`src/services/api.ts`**:
    -   **Purpose**: Centralized Axios instance for making API requests to the backend.
    -   **Key Responsibilities**: Configures the base URL for API calls.
    -   **Dependencies**: `axios`.

-   **`src/services/certificateService.ts`**:
    -   **Purpose**: Handles fetching current user information, likely for authentication or display purposes.
    -   **Key Responsibilities**: Provides a `getCurrentUser` function.
    -   **Dependencies**: `axios`.

## 4. Type Definitions

-   **`src/types/Project.ts`**:
    -   **Purpose**: Defines TypeScript interfaces for project-related data structures.
    -   **Key Responsibilities**: Ensures type safety and consistency across the application when dealing with project objects.

-   **`src/types/Inventory.ts`**:
    -   **Purpose**: Defines TypeScript interfaces for inventory-related data structures.
    -   **Key Responsibilities**: Ensures type safety and consistency for inventory items.

## 5. Styling and Theming

-   **`src/theme/Theme.tsx`**:
    -   **Purpose**: Defines the Material UI theme for the application.
    -   **Key Responsibilities**: Configures colors, typography, components, and shadows.
    -   **Dependencies**: `@mui/material`, `DarkThemeColors.tsx`, `DefaultColors.tsx`, `LightThemeColors.tsx`, `Shadows.tsx`, `ThemeColors.tsx`, `Typography.tsx`, `Components.tsx`.

## 6. State Management

-   **Zustand**: While not explicitly detailed in the current file analysis, the `GEMINI.md` indicates Zustand is used for global state management (e.g., user authentication, notifications). This would typically involve a store definition in `src/store/` (e.g., `src/store/userStore.ts`).

## 7. Utilities

-   **`src/utils/i18n.ts`**:
    -   **Purpose**: Configures internationalization (i18n) for the application.
    -   **Dependencies**: `i18next`, `react-i18next`.

## 8. Component Hierarchy (High-Level)

```
main.tsx
└── App.tsx
    ├── CustomizerContext.tsx
    ├── theme/Theme.tsx
    ├── layouts/full/shared/customizer/RTL.tsx
    └── routes/Router.tsx
        ├── layouts/full/FullLayout.tsx
        │   └── (various shared components like Header, Sidebar, Breadcrumb)
        │       ├── views/dashboard/ProjectsDashboardPage.tsx
        │       ├── views/project-detail/ProjectDetailPage.tsx
        │       │   └── views/project-detail/BatchTrackingComponent.tsx
        │       │       ├── services/certificateService.ts
        │       │       └── types/Project.ts
        │       ├── views/inventory/InventoryPage.tsx
        │       └── (other app views like Notes, Calendar, Tickets)
        └── layouts/blank/BlankLayout.tsx
            └── views/authentication/Error.tsx
```
