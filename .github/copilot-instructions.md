# H10CM Production Management System - AI Assistant Instructions

## Project Overview

H10CM is a multi-tenant production management and inventory tracking system built with React/TypeScript frontend, Node.js Express backend, and MSSQL database. It features certificate-based authentication, RBAC permissions, and sophisticated inventory management with shopping cart functionality.

## Tool Usage Philosophy

### Multi-Tool Problem Solving

**CRITICAL**: Always use multiple tools in combination rather than sequential thinking alone. The agent should leverage all available capabilities:

- **Memory Tools**: Store and retrieve context across sessions
- **Browser Automation**: Use Playwright for testing and validation
- **Context Management**: Utilize context7 for maintaining state
- **File Operations**: Combine read, edit, and analysis tools
- **Database Tools**: Integrate SQL execution with validation
- **Package Management**: Coordinate dependency and testing tools

### Tool Orchestration Strategy

```typescript
// Example: Comprehensive problem-solving approach
const solveProblem = async (issue: string) => {
  // 1. Memory: Recall previous solutions and context
  const previousContext = await memory.recall(issue);

  // 2. Context: Maintain working state
  const workingContext = await context7.create(issue);

  // 3. Analysis: Use multiple analysis tools
  const fileAnalysis = await analyzeFiles(relevantFiles);
  const dbAnalysis = await validateDatabase(queries);

  // 4. Browser: Validate UI/UX impact
  const uiValidation = await playwright.test(scenarios);

  // 5. Implementation: Coordinate changes
  const implementation = await orchestrateChanges({
    fileChanges,
    dbUpdates,
    testValidation,
  });

  // 6. Memory: Store results for future reference
  await memory.store(issue, implementation);
};
```

## Available Tools & MCP Servers

### Core Tool Categories

**Memory & Context Management:**

- `memory` - Store and retrieve information across sessions
- `context7` - Advanced context management and state tracking
- `remember` - Session-specific information storage
- `recall` - Cross-session knowledge retrieval

**Browser Automation & Testing:**

- `playwright` - Browser automation for UI testing and validation
- `screenshot` - Visual validation and documentation
- `navigate` - Automated user journey testing
- `interact` - Form submission and user interaction testing

**File & Code Operations:**

- `edit_file` - Modify existing files with content changes
- `reapply` - Re-apply previous changes to files
- `read_file` - Access file contents for analysis
- `analyze_code` - Code quality and pattern analysis
- `format_code` - Automated code formatting and style enforcement

**Database & Data Tools:**

- `mssql_*` - **DIRECT DATABASE ACCESS**: Use MSSQL VS Code extension for real-time database operations
  - `mssql_connect` - Connect to H10CM database (Server: H10CM, Database: H10CM)
  - `mssql_run_query` - Execute SQL queries directly against the database
  - `mssql_list_tables` - List all tables in the database
  - `mssql_list_procedures` - List all stored procedures
  - `mssql_change_database` - Switch between databases if needed
  - **CRITICAL**: Always use these tools for database operations instead of file-based SQL execution
- `sql_execute` - Legacy SQL query execution and validation (use mssql\_\* tools instead)
- `validate_procedures` - Stored procedure testing and verification
- `data_integrity` - Multi-tenant data consistency checks
- `backup_restore` - Database state management for testing

**Development & Package Tools:**

- `npm_operations` - Package management and dependency resolution
- `test_runner` - Automated test execution and reporting
- `build_validation` - Build process verification
- `security_scan` - Vulnerability assessment and security validation

**API & Integration Tools:**

- `api_test` - Endpoint testing and validation
- `postman_sync` - Collection management and documentation
- `certificate_validation` - Authentication testing
- `health_check` - System monitoring and status verification

### Tool Selection Strategy

**Always prefer multi-tool approaches:**

```typescript
// Instead of: Sequential file editing
await edit_file(path1);
await edit_file(path2);

// Use: Coordinated multi-tool approach
const context = await context7.create("feature-implementation");
const memory = await memory.recall("similar-features");
const analysis = await analyze_code([path1, path2]);
const changes = await orchestrate_changes({
  files: [path1, path2],
  context: context,
  memory: memory,
  validation: await playwright.test(scenarios),
});
```

### Custom Instructions & Patterns

### Instruction File Patterns

The project uses pattern-based instruction files for specific contexts:

| Pattern            | File Path                                            | Context                             |
| ------------------ | ---------------------------------------------------- | ----------------------------------- |
| `**/*-post-r-pm-*` | `postman-http-request-post-response.instructions.md` | HTTP request post-response handling |
| `**/*-pre-r-pm-*`  | `postman-http-request-pre-request.instructions.md`   | HTTP request pre-processing         |
| `**/*-post-c-pm-*` | `postman-collections-post-response.instructions.md`  | Collection response handling        |
| `**/*-pre-c-pm-*`  | `postman-collections-pre-request.instructions.md`    | Collection pre-processing           |
| `**/*-post-f-pm-*` | `postman-folder-post-response.instructions.md`       | Folder operation responses          |
| `**/*-pre-f-pm-*`  | `postman-folder-pre-request.instructions.md`         | Folder operation setup              |

### Custom Instruction Usage

```typescript
// When working with API-related files, check for matching instruction patterns
const getInstructionFile = (filePath: string) => {
  if (filePath.includes("-post-r-pm-")) {
    return "postman-http-request-post-response.instructions.md";
  }
  // Additional pattern matching...
};
```

## Tool Integration Workflows

### Comprehensive Problem-Solving Workflow

**Phase 1: Context & Memory Analysis**

1. **Memory Recall**: Check for previous similar issues and solutions
2. **Context Creation**: Establish working context with context7
3. **Historical Analysis**: Review past decisions and patterns
4. **Stakeholder Impact**: Assess multi-tenant security implications

**Phase 2: Multi-Dimensional Analysis**

1. **Code Analysis**: Use code analysis tools for quality assessment
2. **Database Validation**: Execute SQL validation and integrity checks
3. **API Testing**: Validate endpoints with automated testing
4. **UI Validation**: Use Playwright for user experience verification

**Phase 3: Coordinated Implementation**

1. **Change Orchestration**: Coordinate file, database, and configuration changes
2. **Real-time Validation**: Continuous testing during implementation
3. **Security Verification**: Multi-tenant security pattern enforcement
4. **Performance Monitoring**: Health check integration throughout process

**Phase 4: Documentation & Memory Storage**

1. **Solution Documentation**: Comprehensive change documentation
2. **Memory Storage**: Store solution patterns for future reference
3. **Context Preservation**: Maintain working context for follow-up issues
4. **Knowledge Base Update**: Update instruction patterns and workflows

### Advanced Tool Combination Patterns

**Pattern 1: Database-First Development with UI Validation**

```typescript
const implementDatabaseFeature = async (feature) => {
  // Memory: Recall database patterns
  const dbPatterns = await memory.recall("database-patterns");

  // Context: Track implementation state
  const context = await context7.create(`db-feature-${feature.name}`);

  // Database: Implement and validate
  const dbResult = await sql_execute(feature.procedures);
  await validate_procedures(feature.procedures);

  // API: Test endpoints
  const apiResult = await api_test(feature.endpoints);

  // UI: Validate user experience
  const uiResult = await playwright.test(feature.userScenarios);

  // Memory: Store successful patterns
  await memory.store(`db-feature-${feature.name}`, {
    dbResult,
    apiResult,
    uiResult,
    patterns: dbPatterns,
  });
};
```

## GitHub CLI Issue Management

### Automatic Issue Closing Workflow

**CRITICAL**: When completing any bug fix, feature implementation, or resolving reported issues, **ALWAYS use GitHub CLI to close the corresponding GitHub issues** with appropriate resolution comments.

### GitHub CLI Setup

**Path Configuration**: Add `C:\Program Files\GitHub CLI` to system PATH:

1. Press `Win + R`, type `sysdm.cpl`, press Enter
2. Click **"Advanced"** tab → **"Environment Variables..."**
3. System Variables → Select **"Path"** → **"Edit..."** → **"New"**
4. Add: `C:\Program Files\GitHub CLI`
5. **Restart PowerShell/VS Code** for changes to take effect

**Authentication Check**:

```bash
gh auth status  # Verify authentication
gh auth login   # If not authenticated
```

### Issue Closing Patterns

**For Bug Fixes**:

```bash
gh issue close [ISSUE_NUMBER] --comment "✅ RESOLVED: [Brief description of fix]. [Technical details of what was changed and why]."
```

**For Feature Implementations**:

```bash
gh issue close [ISSUE_NUMBER] --comment "✅ IMPLEMENTED: [Feature description]. [Implementation details and how to use]."
```

**For Invalid/Duplicate Issues**:

```bash
gh issue close [ISSUE_NUMBER] --comment "❌ [INVALID/DUPLICATE]: [Reason why issue is invalid or reference to duplicate]."
```

**For Test Issues**:

```bash
gh issue close [ISSUE_NUMBER] --comment "🧪 TEST ISSUE: [Description of what was tested]. [Results and system status]."
```

### Workflow Integration

**Step 1: Identify Related Issues**

- Check if the current work relates to any open GitHub issues
- Look for issues created by automatic error reporting
- Review manual issues that may be addressed by current changes

**Step 2: Complete Implementation**

- Implement the fix/feature using multi-tool approach
- Validate the solution thoroughly
- Test affected functionality

**Step 3: Close Issues with Context**

```bash
# Example: After fixing a database procedure bug
gh issue close 17 --comment "✅ RESOLVED: Fixed circular dependency in usp_GetSystemStatistics stored procedure. Removed WHERE @IsSystemAdmin = 1 clause that prevented checking admin existence. API endpoint /api/users now works correctly."

# Example: After implementing a feature
gh issue close 25 --comment "✅ IMPLEMENTED: Added cart quantity validation with real-time inventory checking. Users now see available stock before adding items to cart. Updated CartDrawer.tsx and added inventory stock checking API endpoint."

# Example: For test/invalid issues
gh issue close 18 --comment "❌ NOT A REAL ISSUE: Port conflict caused by starting server while already running. This is user error during testing, not an application bug."
```

**Step 4: Document Resolution**

- Update any related documentation
- Store solution patterns in memory for future reference
- Update copilot instructions if new patterns emerge

### Issue Closing Best Practices

1. **Be Specific**: Include technical details about what was changed
2. **Reference Files**: Mention specific files or components modified
3. **Include Testing**: Note what was tested to verify the fix
4. **Use Emojis**: Visual indicators help categorize closure reasons
5. **Cross-Reference**: Link to related issues if applicable

### Common Issue Categories

**Auto-Generated Issues** (from error reporting system):

- Usually have `[AUTO]` prefix
- Include detailed error context and stack traces
- Close with technical fix details

**Manual Bug Reports**:

- User-reported issues
- Close with user-friendly explanation and verification steps

**Feature Requests**:

- Enhancement requests
- Close with implementation details and usage instructions

**Test/Development Issues**:

- Created during testing or development
- Close with test results and system status

### Integration with Error Reporting

When the automatic error reporting system creates GitHub issues:

1. **Investigate** the automatically reported error
2. **Fix** the underlying issue using standard workflows
3. **Close** the auto-generated issue with technical details
4. **Verify** no similar errors occur after the fix

This ensures automatic error reports are properly resolved and don't accumulate as noise in the issue tracker.

**Pattern 2: Multi-Tenant Security Validation**

```typescript
const validateMultiTenantSecurity = async (changes) => {
  // Context: Security validation session
  const securityContext = await context7.create("security-validation");

  // Memory: Recall security patterns
  const securityPatterns = await memory.recall("multi-tenant-security");

  // Code: Analyze for security patterns
  const codeAnalysis = await analyze_code(changes.files);

  // Database: Validate tenant isolation
  const dbValidation = await sql_execute(securityPatterns.queries);

  // API: Test cross-tenant access prevention
  const apiSecurity = await api_test(securityPatterns.testCases);

  // Browser: Validate UI security constraints
  const uiSecurity = await playwright.test(securityPatterns.uiTests);

  // Comprehensive security report
  return {
    codeAnalysis,
    dbValidation,
    apiSecurity,
    uiSecurity,
    recommendations: await memory.recall("security-recommendations"),
  };
};
```

**Pattern 3: Full-Stack Feature Implementation**

```typescript
const implementFullStackFeature = async (feature) => {
  // Phase 1: Analysis and Planning
  const context = await context7.create(`feature-${feature.name}`);
  const previousImplementations = await memory.recall(
    `similar-to-${feature.type}`
  );

  // Phase 2: Backend Implementation
  const dbChanges = await sql_execute(feature.database.procedures);
  const apiChanges = await edit_file(feature.api.endpoints);
  const apiValidation = await api_test(feature.api.testCases);

  // Phase 3: Frontend Implementation
  const uiChanges = await edit_file(feature.frontend.components);
  const uiValidation = await playwright.test(feature.frontend.scenarios);

  // Phase 4: Integration Testing
  const integrationTests = await test_runner(feature.integrationTests);
  const buildValidation = await build_validation();

  // Phase 5: Security and Performance
  const securityScan = await security_scan(feature.changedFiles);
  const healthCheck = await health_check();

  // Phase 6: Documentation and Memory
  await memory.store(`feature-${feature.name}`, {
    implementation: { dbChanges, apiChanges, uiChanges },
    validation: { apiValidation, uiValidation, integrationTests },
    security: securityScan,
    performance: healthCheck,
  });

  return context;
};
```

### Memory Management Strategies

**Persistent Knowledge Storage:**

```typescript
// Store architectural decisions
await memory.store("architecture-decisions", {
  multiTenant: "Program-based isolation with complete data separation",
  authentication: "Certificate-based with development fallback",
  database: "JSON-first stored procedures for API compatibility",
  frontend: "React Query + Zustand with Material UI",
});

// Store common problem solutions
await memory.store("common-solutions", {
  cartBug: "Use proper /api/cart/add → /api/orders/create-from-cart workflow",
  quantityDisplay: "Database field mismatch resolution pattern",
  multiTenantFiltering: "Enforce program_id at database level",
});

// Store testing patterns
await memory.store("testing-patterns", {
  apiTesting: "Jest + Supertest with certificate simulation",
  uiTesting: "Playwright with Material UI component testing",
  dbTesting: "Stored procedure validation with multi-tenant scenarios",
});
```

**Context Preservation:**

```typescript
// Maintain working context across complex operations
const workingContext = await context7.create("complex-feature");
await context7.update(workingContext, {
  phase: "analysis",
  findings: analysisResults,
});
await context7.update(workingContext, {
  phase: "implementation",
  changes: implementationResults,
});
await context7.update(workingContext, {
  phase: "validation",
  tests: validationResults,
});
```

### Browser Automation Integration

**Comprehensive UI Testing:**

```typescript
const validateUserExperience = async (feature) => {
  // Navigate to feature
  await playwright.navigate(`http://localhost:5173/${feature.route}`);

  // Test authentication flow
  await playwright.interact("certificate-login");

  // Validate multi-tenant program switching
  await playwright.test("program-selector", feature.tenantTests);

  // Test feature functionality
  await playwright.interact(feature.userActions);

  // Validate responsive design
  await playwright.screenshot("desktop-view");
  await playwright.viewport({ width: 768, height: 1024 });
  await playwright.screenshot("tablet-view");

  // Test accessibility
  await playwright.accessibility_audit();

  return {
    functionality: "passed",
    responsiveness: "validated",
    accessibility: "compliant",
  };
};
```

## Operating Modes

### Development Mode

**Local Development Environment:**

```bash
# Frontend (Port 5173)
Set-Location "c:\Web Development\H10CM"
npm run dev

# Backend (Port 3000)
Set-Location "c:\Web Development\H10CM\api"
npm run dev
```

**CRITICAL: API Restart Required After Code Changes:**

- **Always restart the API server after making code changes** - Node.js doesn't auto-reload
- Kill existing API process (Ctrl+C) and restart with `npm run dev` or `npm start`
- **Database changes require API restart** to reload stored procedure references
- **Frontend changes auto-reload** with Vite hot module replacement

**Development-Specific Tool Usage:**

- Use `memory` to recall development patterns and shortcuts
- Use `context7` to maintain development session state
- Use `playwright` for local UI testing and validation
- Apply comprehensive tool orchestration for all changes
- Use `mssql_*` tools for direct database operations instead of file-based SQL
- Enable detailed error logging and stack traces
- Activate hot-reload for both frontend and backend
- Use local database connection (127.0.0.1)

### Production Mode

- Enforce strict security patterns and multi-tenant isolation
- Apply production-optimized instruction sets with full tool validation
- Enable comprehensive monitoring and health checks
- Require certificate-based authentication
- Use `memory` for production deployment patterns
- Use `context7` for coordinated production updates

### Testing Mode

- Load test-specific instruction files and patterns
- Apply quality gates and coverage requirements with tool validation
- Enable comprehensive security scanning using all available tools
- Use isolated test data and environments
- Coordinate `playwright`, `test_runner`, and `api_test` tools

## Prompt File Integration

### Context-Aware Prompting

**Dynamic Prompt Selection:**

- API-related changes → Load Postman instruction files
- Database operations → Reference SQL patterns and procedures
- Frontend changes → Apply React/TypeScript best practices
- Security operations → Enforce multi-tenant patterns

**Prompt File Patterns:**

```typescript
// Example: API endpoint modification
if (isApiEndpoint(filePath)) {
  const preRequestInstructions = await loadInstructions("pre-request");
  const postResponseInstructions = await loadInstructions("post-response");
  // Apply context-specific patterns
}
```

### Instruction File Loading

**Automatic Instruction Discovery:**

```typescript
// Load instruction files based on file patterns
const loadRelevantInstructions = async (filePath: string) => {
  const patterns = [
    { match: /api\/.*\.js$/, instruction: "api-development.md" },
    { match: /src\/.*\.tsx?$/, instruction: "react-patterns.md" },
    { match: /database_modules\/.*\.sql$/, instruction: "sql-procedures.md" },
  ];

  return patterns
    .filter((p) => p.match.test(filePath))
    .map((p) => p.instruction);
};
```

## Tool Integration Workflows

### Code Quality Workflow

**Quality Gates:**

1. **Pre-Change Analysis**: Understand existing code quality baseline
2. **Change Implementation**: Apply modifications following project patterns
3. **Post-Change Analysis**: Validate changes against project standards
4. **Issue Resolution**: Address any quality degradation before proceeding
5. **Security Validation**: Review security implications of changes

### Multi-Tenant Security Workflow

**Security Pattern Enforcement:**

```javascript
// Every API endpoint MUST include program-level filtering
const enforceMultiTenantSecurity = (endpoint) => {
  // 1. Validate program_id parameter
  // 2. Enforce user program access
  // 3. Apply database-level filtering
  // 4. Audit access patterns
};
```

### Database Procedure Workflow

**JSON-First Database Integration:**

```sql
-- All procedures MUST use JSON parameters
CREATE PROCEDURE usp_ExampleProcedure
    @DataJson NVARCHAR(MAX)
AS
BEGIN
    -- Extract parameters from JSON
    DECLARE @program_id INT = JSON_VALUE(@DataJson, '$.program_id');

    -- Enforce multi-tenant isolation
    IF @program_id IS NULL
        RAISERROR('Program ID required for multi-tenant isolation', 16, 1);
END
```

## External Service Integration

### Postman Collection Management

**API Documentation Workflow:**

- Automatic collection generation from API endpoints
- Request/response validation against OpenAPI specs
- Environment-specific configuration management

### Certificate Service Integration

**Authentication Flow:**

```typescript
// Certificate-based user authentication
const authenticateUser = async (req: Request) => {
  const clientCert = req.headers["x-arr-clientcert"] || "development-fallback";
  const user = await certificateService.validateUser(clientCert);
  return user;
};
```

## Error Handling & Recovery

### Quality Gate Failures

**Automatic Recovery Patterns:**

```typescript
// If quality analysis fails, implement fallback quality checks
const handleQualityFailure = async (filePath: string) => {
  try {
    await validateCode(filePath);
  } catch (error) {
    // Fallback to local linting and formatting
    await localQualityCheck(filePath);
  }
};
```

### Instruction File Missing

**Graceful Degradation:**

```typescript
// If instruction file is missing, use default patterns
const getInstructions = async (pattern: string) => {
  try {
    return await readInstructionFile(pattern);
  } catch (error) {
    console.warn(`Instruction file not found for pattern: ${pattern}`);
    return getDefaultInstructions();
  }
};
```

## Architecture & Project Structure

### Modular Database-First Architecture

```
H10CM/                          # React/TypeScript frontend (port 5173)
├── src/
│   ├── components/            # Feature-organized components
│   ├── services/api.ts        # Centralized API client with interceptors
│   ├── hooks/api/             # React Query hooks for server state
│   ├── store/                 # Zustand stores for client state
│   ├── types/                 # TypeScript interfaces
│   └── views/                 # Page components (Router.tsx)
├── database_modules/          # 🆕 Modular database architecture
│   ├── create_h10cm_database.sql  # Master execution script
│   ├── 01_database_and_schema.sql # Infrastructure
│   ├── 02_core_tables.sql         # RBAC tables
│   ├── 03_project_tables.sql      # Project management
│   ├── 04_inventory_tables.sql    # Inventory system
│   ├── 05_procurement_tables.sql  # Vendor/sponsor management
│   ├── 06_core_procedures.sql     # Basic CRUD operations
│   ├── 07_business_procedures.sql # Cart/order workflows
│   ├── 08_security_procedures.sql # Authentication
│   ├── 09_sample_data.sql         # Development seed data
│   └── 10_indexes_constraints.sql # Performance optimization
└── api/                       # Node.js Express backend (port 3000)
    ├── index.js              # Main API server with multi-tenant middleware
    ├── package.json          # Backend dependencies
    └── tests/                # Jest test suite
```

### Key Development Commands

```powershell
# Frontend development
Set-Location H10CM; npm install; npm run dev    # http://localhost:5173

# Backend development (separate terminal)
Set-Location api; npm install; npm run dev      # http://localhost:3000

# Database setup (run once)
# Execute database_modules/create_h10cm_database.sql in SQL Server

# Testing
npm test                                         # Frontend (Vitest)
Set-Location api; npm test                      # Backend (Jest + Supertest)
```

## Multi-Tenant Architecture

### Critical Multi-Tenant Patterns

H10CM uses **Programs** as the root tenant entity with complete data isolation:

```typescript
// ALL API endpoints must enforce program-level filtering
const result = await pool
  .request()
  .input("program_id", sql.Int, req.user.program_id)
  .query("SELECT * FROM Projects WHERE program_id = @program_id");
```

### Database Connection Configuration

**Database Credentials (Local Development):**

```javascript
const dbConfig = {
  user: "sa",
  password: "0)Password",
  server: "127.0.0.1",
  database: "H10CM",
  port: 1433,
  options: {
    encrypt: true,
    enableArithAbort: true,
    trustServerCertificate: true,
  },
};
```

**SQL Command Line Access:**

```powershell
# Execute SQL files against H10CM database
sqlcmd -S "127.0.0.1" -U "sa" -P "0)Password" -d "H10CM" -i "database_modules\filename.sql"
```

### Database-First JSON Stored Procedures

**CRITICAL PATTERN**: All stored procedures use JSON parameters for API compatibility:

```sql
-- Standard procedure pattern
CREATE PROCEDURE usp_SaveProject
    @ProjectJson NVARCHAR(MAX)
AS
BEGIN
    DECLARE @project_id INT = JSON_VALUE(@ProjectJson, '$.project_id');
    DECLARE @program_id INT = JSON_VALUE(@ProjectJson, '$.program_id');
    -- Multi-tenant filtering enforced at DB level
END
```

### RBAC Database Structure

- **Programs**: Top-level tenant isolation (`program_id`)
- **ProgramAccess**: User program permissions
- **ProjectAccess**: Project-level permissions
- **Users**: Certificate-based authentication with cross-program access

## Authentication & Security

### Certificate-Based Authentication

- Uses `x-arr-clientcert` header for user identification
- Fallback to `development-fallback` for local development
- User lookup via stored procedure `usp_GetUserWithProgramAccess`

### Multi-Tenant Access Control

```javascript
// Critical middleware pattern - program access enforcement
const checkProgramAccess = (requiredLevel = "Read") => {
  return (req, res, next) => {
    let programId = req.params.programId || req.query.program_id;

    // Auto-assign user's first accessible program if none specified
    if (!programId && req.user.accessible_programs?.length > 0) {
      programId = req.user.accessible_programs[0];
    }

    // System admins bypass checks
    if (req.user.is_system_admin) {
      req.programId = parseInt(programId);
      return next();
    }

    // Verify program access from user's program_access JSON
    const hasAccess = req.user.program_access?.find(
      (p) => p.program_id == programId
    );
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to program" });
    }

    req.programId = parseInt(programId);
    next();
  };
};
```

### API Proxy Configuration

```typescript
// vite.config.ts - Local development proxy
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

### Context Provider Architecture

- **CustomizerContext**: Theme/layout state with user-specific persistence
- **RBACContext**: Authentication state with certificate integration
- **ProgramContext**: Multi-tenant program switching
- **Error Boundaries**: Global error handling with fallback UI

### Component Patterns

```typescript
// Standard page component pattern (src/views/*/Page.tsx)
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

### Material UI Theme Integration

- All components use `CustomizerContext` for theme state
- User-specific preferences with localStorage persistence
- Certificate-based user identification for preference storage

## API Client Architecture

### Centralized API Service with Program Context

```typescript
// src/services/api.ts - ALL API calls go through this file
const apiClient = axios.create({
  baseURL: "/api",
});

// Program context injection for multi-tenant requests
apiClient.interceptors.request.use((config) => {
  if (currentProgramId && shouldIncludeProgramId(config.url)) {
    config.params = { ...config.params, program_id: currentProgramId };
  }
  return config;
});
```

### Stored Procedure Integration Pattern

```javascript
// api/index.js - JSON-based procedure execution
const executeProcedure = async (res, procedureName, params = []) => {
  const request = pool.request();
  params.forEach((param) => {
    request.input(param.name, param.type, param.value);
  });

  const result = await request.execute(procedureName);

  // Handle JSON string responses from procedures
  if (result.recordset?.length > 0) {
    const firstColumn =
      result.recordset[0][Object.keys(result.recordset[0])[0]];
    if (
      typeof firstColumn === "string" &&
      Object.keys(result.recordset[0]).length === 1
    ) {
      const data = JSON.parse(firstColumn);
      return res.json(data);
    }
  }
};
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

### Backend Multi-Tenant API Architecture

```javascript
// api/index.js - Multi-tenant filtering enforcement
const authenticateUser = async (req, res, next) => {
  // Certificate-based authentication with fallback
  const clientCert = req.headers["x-arr-clientcert"] || "development-fallback";
  const certSubject = extractCertificateSubject(clientCert);

  // User lookup with program access via stored procedure
  const userResult = await pool
    .request()
    .input("CertificateSubject", sql.NVarChar, certSubject)
    .execute("usp_GetUserWithProgramAccess");

  const user = userResult.recordset[0];
  user.program_access = JSON.parse(user.program_access || "[]");
  user.accessible_programs = user.program_access.map((p) => p.program_id);
  req.user = user;
  next();
};
```

### Database JSON Parameter Patterns

```sql
-- Multi-tenant procedure with JSON input
CREATE PROCEDURE usp_SaveInventoryItem
    @InventoryItemJson NVARCHAR(MAX)
AS
BEGIN
    DECLARE @program_id INT = JSON_VALUE(@InventoryItemJson, '$.program_id');
    DECLARE @item_name NVARCHAR(255) = JSON_VALUE(@InventoryItemJson, '$.item_name');

    -- Multi-tenant filtering enforced at database level
    IF @program_id IS NULL
        RAISERROR('Program ID required for multi-tenant isolation', 16, 1);
END
```

### Testing Architecture

```typescript
// Frontend tests (Vitest with Material UI support)
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";

// Backend tests (Jest + Supertest for API testing)
describe("Projects API", () => {
  test("GET /api/projects returns projects with program filtering", async () => {
    const response = await request(app)
      .get("/api/projects")
      .set("x-arr-clientcert", "test-cert");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({ program_id: expect.any(Number) }),
      ])
    );
  });
});
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

### ✅ Database Deployment - PRODUCTION READY (July 20, 2025)

- **Issue**: Multiple syntax errors preventing database creation
- **Root Cause**: SQL batch separation and column name mismatches across 10 modules
- **Solution**: Comprehensive review and correction of all database modules
- **Status**: 100% error-free modular architecture ready for deployment

### ⚠️ Next Priority: Multi-Tenant Security

- **Issue**: Program-level filtering not fully implemented across all endpoints
- **Impact**: Potential cross-program data access
- **Action Required**: Add `program_id` filtering to remaining API endpoints
- **Priority**: High - Security enhancement needed for production

## Health Monitoring

- **Dashboard**: `/system/health` - API endpoint monitoring
- **Status**: Real-time health checks with 30-second intervals

## Testing & Quality

### Code Quality Standards

- Follow TypeScript best practices and strict type checking
- Maintain consistent code formatting and style
- Apply security best practices for multi-tenant architecture
- Use comprehensive error handling and validation

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

## MCP Server Integration

### Tool Usage Priorities

**Always Use Multi-Tool Approach:**

1. **Memory & Context First**: Always start with memory recall and context creation
2. **Analysis Phase**: Use code analysis, database validation, and API testing
3. **Implementation Phase**: Coordinate file operations with real-time validation
4. **Validation Phase**: Browser testing, security scans, and health checks
5. **Documentation Phase**: Memory storage and context preservation

**Tool Selection Logic:**

```typescript
// Always prefer comprehensive tool orchestration
const selectTools = (operation: string) => {
  const baseTools = ["memory", "context7"];

  if (operation.includes("database")) {
    return [...baseTools, "sql_execute", "validate_procedures", "api_test"];
  }

  if (operation.includes("frontend")) {
    return [...baseTools, "edit_file", "playwright", "analyze_code"];
  }

  if (operation.includes("api")) {
    return [...baseTools, "api_test", "security_scan", "health_check"];
  }

  // Always use multiple tools, never single-tool solutions
  return [...baseTools, "edit_file", "analyze_code", "test_runner"];
};
```
