# H10CM Production Management System - AI Assistant Instructions

## Project Overview

H10CM is a multi-tenant production management and inventory tracking system built with React/TypeScript frontend, Node.js Express backend, and MSSQL database. It features certificate-based authentication, RBAC permissions, and sophisticated inventory management with shopping cart functionality.

## Architecture & Project Structure

### Dual-Repository Structure

```
H10CM/                    # React/TypeScript frontend (port 5173)
├── src/
│   ├── components/       # Feature-organized components
│   ├── services/api.ts   # Centralized API functions
│   ├── hooks/api/        # React Query hooks
│   ├── store/           # Zustand stores
│   ├── types/           # TypeScript interfaces
│   └── views/           # Page components (Router.tsx)
api/                     # Node.js Express backend (port 3000)
├── index.js            # Main API server
├── package.json        # Separate backend dependencies
└── tests/              # Jest test suite
h10cm.sql               # Database creation script
```

### Key Development Commands

```powershell
# Frontend development
Set-Location H10CM; npm install; npm run dev

# Backend development (separate terminal)
Set-Location api; npm install; npm run dev

# Database setup (run once)
# Execute h10cm.sql in MSSQL to create H10CM database

# Testing
npm test          # Frontend (Vitest + React Testing Library)
Set-Location api; npm test # Backend (Jest + Supertest)
```

## Multi-Tenant Architecture

### RBAC Database Structure

- **Programs**: Top-level tenant isolation (program_id)
- **ProgramAccess**: User program permissions
- **ProjectAccess**: Project-level permissions
- **Users**: Certificate-based authentication

### Critical Pattern: Program-Level Data Filtering

```typescript
// All API endpoints must filter by program_id
const result = await pool
  .request()
  .input("program_id", sql.Int, req.user.program_id)
  .query("SELECT * FROM Projects WHERE program_id = @program_id");
```

## Authentication & Security

### Certificate-Based Authentication

- Uses `x-arr-clientcert` header for user identification
- Fallback to `development-fallback` for local development
- User lookup in database via `certificate_subject`

### API Proxy Configuration

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:3000',  // Local dev
      // target: 'http://h10-websvr01.rdte.nswc.navy.mil:3000/', // Production
      changeOrigin: true,
      secure: false,
    },
  },
}
```

## Critical Frontend Architecture Patterns

### React Query + Zustand State Management

```typescript
// API data fetching (src/hooks/api/useProjectHooks.ts)
export const useProjects = () => {
  return useQuery<Project[], Error>({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    refetchOnWindowFocus: true,
  });
};

// Client-side state (src/store/cartStore.ts)
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        /* cart logic */
      },
    }),
    { name: "cart-storage" }
  )
);
```

### Frontend Architecture Components

- **Context Providers**: `CustomizerContext`, `RBACContext`, `ProgramContext` for app-wide state
- **Layout System**: `FullLayout` with vertical/horizontal header options
- **Theme Management**: Material UI with dark/light mode switching
- **Error Boundaries**: Global error handling with fallback UI
- **Routing**: React Router with lazy loading via `Loadable` HOC

### Key Component Patterns

```typescript
// Page components follow this pattern (src/views/*/Page.tsx)
import PageContainer from "src/components/container/PageContainer";
import Breadcrumb from "src/layouts/full/shared/breadcrumb/Breadcrumb";

const MyPage: React.FC = () => {
  return (
    <PageContainer title="Page Title" description="Page description">
      <Breadcrumb title="Page Title" items={BCrumb} />
      {/* Page content */}
    </PageContainer>
  );
};
```

## API Client Architecture

### Centralized API Service

```typescript
// src/services/api.ts - ALL API calls go through this file
const apiClient = axios.create({
  baseURL: "/api",
});

// Program context injection
apiClient.interceptors.request.use((config) => {
  if (currentProgramId && shouldIncludeProgramId(config.url)) {
    config.params = { ...config.params, program_id: currentProgramId };
  }
  return config;
});
```

## State Management Patterns

### React Query + Zustand Architecture

```typescript
// API data fetching (src/hooks/api/useProjectHooks.ts)
export const useProjects = () => {
  return useQuery<Project[], Error>({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    refetchOnWindowFocus: true,
  });
};

// Client-side state (src/store/cartStore.ts)
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        /* ... */
      },
    }),
    { name: "cart-storage" }
  )
);
```

## Component & Type Patterns

### File Naming Conventions

- Pages: `*Page.tsx` (e.g., `InventoryPage.tsx`)
- Components: PascalCase (e.g., `ProjectCard.tsx`)
- Types: Match feature names (e.g., `src/types/Project.ts`)
- Hooks: `use*Hooks.ts` (e.g., `useProjectHooks.ts`)

### Type Safety Requirements

```typescript
// All API functions must be typed
export const fetchProjects = async (): Promise<Project[]> => {
  const { data } = await apiClient.get("/projects");
  return data;
};
```

## Critical Development Patterns

### Backend API Architecture

```javascript
// api/index.js - Multi-tenant filtering pattern
const authenticateUser = async (req, res, next) => {
  // Certificate-based authentication
  const clientCert = req.headers["x-arr-clientcert"] || "development-fallback";
  const certSubject = extractCertificateSubject(clientCert);

  // User lookup with program access
  const user = await getUserWithProgramAccess(certSubject);
  req.user = user;
  next();
};

// Program access middleware
const checkProgramAccess = (requiredLevel = "Read") => {
  return (req, res, next) => {
    const programId = req.params.programId || req.query.program_id;
    if (!req.user.accessible_programs.includes(programId)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
};
```

### Database Patterns

```sql
-- All stored procedures use JSON parameters
CREATE PROCEDURE usp_SaveInventoryItem
    @InventoryItemJson NVARCHAR(MAX)
AS
BEGIN
    DECLARE @program_id INT = JSON_VALUE(@InventoryItemJson, '$.program_id');
    DECLARE @project_id INT = JSON_VALUE(@InventoryItemJson, '$.project_id');
    -- Multi-tenant filtering enforced at DB level
END
```

## Critical Issues & Status

### ✅ Cart System - RESOLVED (July 16, 2025)

The critical cart bug has been **completely resolved**:

- **Issue**: Cart was creating inventory items instead of cart items
- **Root Cause**: `CartDrawer.tsx` bypassed cart API workflow
- **Solution**: Updated to use proper `/api/cart/add` → `/api/orders/create-from-cart` workflow
- **Status**: Cart system fully operational for production use

### ✅ Pending Orders - RESOLVED (July 15, 2025)

- **Issue**: Orders displayed quantity "1" instead of actual quantities
- **Root Cause**: Database field mismatch (`quantity_requested` vs `quantity_ordered`)
- **Solution**: Updated `usp_GetPendingOrders` stored procedure
- **Status**: Accurate quantity display working correctly

### ⚠️ Next Priority: Multi-Tenant Security

- **Issue**: Program-level filtering not fully implemented across all endpoints
- **Impact**: Potential cross-program data access
- **Action Required**: Add `program_id` filtering to remaining API endpoints
- **Priority**: High - Security enhancement needed for production

## Health Monitoring

- **Dashboard**: `/system/health` - API endpoint monitoring
- **Status**: Real-time health checks with 30-second intervals

## Testing & Quality

### Code Quality Rules (Codacy Integration)

- **After ANY file edit**: Run `codacy_cli_analyze` tool immediately
- **After dependency changes**: Run security scan with `trivy`
- **No manual CLI installation**: Use MCP server tools only

### Test Structure

```typescript
// Frontend tests (Vitest)
import { render, screen } from "@testing-library/react";
import { ProjectCard } from "./ProjectCard";

// Backend tests (Jest + Supertest)
describe("Projects API", () => {
  test("GET /api/projects returns projects", async () => {
    const response = await request(app).get("/api/projects");
    expect(response.status).toBe(200);
  });
});
```

## Database Operations

### Stored Procedures Pattern

```sql
-- Multi-tenant filtering in all procedures
CREATE PROCEDURE usp_GetInventoryItems
    @program_id INT
AS
BEGIN
    SELECT * FROM InventoryItems
    WHERE program_id = @program_id
END
```

### Connection Pattern

```javascript
// api/index.js
const dbConfig = {
  server: "127.0.0.1",
  database: "H10CM",
  user: "sa",
  password: "0)Password",
};
```

## Material UI Theme System

### Custom Theme Structure

- **Location**: `src/theme/` - Extensive theme customization
- **Context**: `CustomizerContext` manages theme state across app
- **Features**: Dark/light mode, RTL support, customizable layouts
- **Usage**: All components use theme-aware styling

### User Preferences Integration

```typescript
// src/services/userPreferencesService.ts
export const userPreferencesService = {
  initialize: async () => {
    const user = await certificateService.getCurrentUser();
    // Load user-specific preferences from localStorage
  },
  savePreferences: (preferences: UserPreferences) => {
    // Save to localStorage with user-specific key
  },
};
```

## Essential Files to Understand

### Core Infrastructure

- `src/main.tsx` - App entry point with React Query and Context providers
- `src/App.tsx` - Main app component with theme, routing, and error boundary
- `src/routes/Router.tsx` - Complete application routing with lazy loading
- `src/services/api.ts` - Centralized API client with interceptors

### Backend Architecture

- `api/index.js` - Main API server with authentication and multi-tenant filtering
- `h10cm.sql` - Complete database schema with stored procedures
- `api/tests/` - Jest test suite for API endpoints

### Frontend Architecture

- `src/layouts/full/FullLayout.tsx` - Main layout component with header/sidebar
- `src/context/CustomizerContext.tsx` - Theme and layout state management
- `src/context/RBACContext.tsx` - Role-based access control context
- `src/components/container/PageContainer.tsx` - Standard page wrapper

### Key Feature Areas

- `src/hooks/api/` - React Query hooks for all API interactions
- `src/store/cartStore.ts` - Shopping cart state with persistence
- `src/types/` - TypeScript interfaces for all entities
- `src/views/` - Page components organized by feature

### Testing & Configuration

- `src/test/setup.ts` - Vitest configuration and mocks
- `src/test/test-utils.tsx` - Custom render with providers
- `vite.config.ts` - Vite configuration with API proxy
- `vitest.config.ts` - Test configuration with coverage

---
# Codacy Rules
Configuration for AI behavior when interacting with Codacy's MCP Server

## After ANY successful `edit_file` or `reapply` operation
- YOU MUST IMMEDIATELY run the `codacy_cli_analyze` tool from Codacy's MCP Server for each file that was edited, with:
 - `rootPath`: set to the workspace path
 - `file`: set to the path of the edited file
 - `tool`: leave empty or unset
- If any issues are found in the new edits, propose and apply fixes for them.
- > NOTE: Failure to follow this rule is considered a critical error.

## CRITICAL: Dependencies and Security Checks
- IMMEDIATELY after ANY of these actions:
 - Running npm/yarn/pnpm install
 - Adding dependencies to package.json
 - Adding requirements to requirements.txt
 - Adding dependencies to pom.xml
 - Adding dependencies to build.gradle
 - Any other package manager operations
- You MUST run the `codacy_cli_analyze` tool with:
 - `rootPath`: set to the workspace path
 - `tool`: set to "trivy"
 - `file`: leave empty or unset
- If any vulnerabilities are found because of the newly added packages:
 - Stop all other operations
 - Propose and apply fixes for the security issues
 - Only continue with the original task after security issues are resolved
- EXAMPLE:
 - After: npm install react-markdown
 - Do: Run codacy_cli_analyze with trivy
 - Before: Continuing with any other tasks

## General
- Repeat the relevant steps for each modified file.
- "Propose fixes" means to both suggest and, if possible, automatically apply the fixes.
- You MUST NOT wait for the user to ask for analysis or remind you to run the tool.
- Do not run `codacy_cli_analyze` looking for changes in duplicated code or code complexity metrics.
- Do not run `codacy_cli_analyze` looking for changes in code coverage.
- Do not try to manually install Codacy CLI using either brew, npm, npx, or any other package manager.
- If the Codacy CLI is not installed, just run the `codacy_cli_analyze` tool from Codacy's MCP Server.
- When calling `codacy_cli_analyze`, only send provider, organization and repository if the project is a git repository.

## Whenever a call to a Codacy tool that uses `repository` or `organization` as a parameter returns a 404 error
- Offer to run the `codacy_setup_repository` tool to add the repository to Codacy
- If the user accepts, run the `codacy_setup_repository` tool
- Do not ever try to run the `codacy_setup_repository` tool on your own
- After setup, immediately retry the action that failed (only retry once)
