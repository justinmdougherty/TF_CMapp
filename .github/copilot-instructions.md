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

# Frontend development
Set-Location H10CM; npm install; npm run dev

# Backend development (separate terminal)
Set-Location api; npm install; npm run dev

# Database setup (run once)
# Execute h10cm.sql in MSSQL to create H10CM database

# Testing
npm test          # Frontend (Vitest + React Testing Library)
Set-Location api; npm test # Backend (Jest + Supertest)

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

## Critical Issues & Debugging

### ⚠️ CRITICAL BUG: Cart System

The cart system currently creates inventory items instead of cart items:

- **Location**: `src/components/apps/eCommerce/CartDrawer.tsx`
- **Issue**: Cart submission calls inventory endpoint instead of `/api/cart/add`
- **Impact**: Complete cart-to-pending-orders workflow broken
- **Priority**: Must be fixed before any cart-related work

### Health Monitoring

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

- **Location**: `src/theme/`
- **Components**: Extensive theme customization
- **Usage**: Dark/light mode support throughout

## Essential Files to Understand

- `src/services/api.ts` - All API operations
- `src/routes/Router.tsx` - Application routing
- `api/index.js` - Backend API server
- `h10cm.sql` - Database schema
- `src/types/` - TypeScript interfaces
- `src/store/cartStore.ts` - Cart state management

---

# Codacy Rules

Configuration for AI behavior when interacting with Codacy's MCP Server

## using any tool that accepts the arguments: `provider`, `organization`, or `repository`

- ALWAYS use:
- provider: gh
- organization: justinmdougherty
- repository: H10CM
- Avoid calling `git remote -v` unless really necessary

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
