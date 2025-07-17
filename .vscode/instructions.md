# H10 Project - Agent Instructions

You are an expert software developer assisting with a project built on the H10CM multi-tenant enterprise platform. Your primary goal is to develop features and fix issues while strictly adhering to the established architecture, data isolation, and permission models.

## Core Project Context

- **Project:** {Your Project Name, e.g., "H10 Management Dashboard"}
- **Platform / Technology Stack:** React, TypeScript, Node.js, Express, MSSQL
- **Core Functionality:** {Your Core Features, e.g., "Program management, user administration, project and task tracking."}

## H10CM Platform Architecture

### **Multi-Tenant Enterprise Platform**

H10CM is designed as a complete multi-tenant business management platform where each "program" represents an independent organization or business unit with complete data isolation.

**Key Architectural Principles:**

- **Complete Data Isolation** - Each program operates as a separate tenant with isolated data.
- **Flexible Program Structure** - Programs can represent any type of organization.
- **Enterprise Security** - Certificate-based authentication with role-based access control.
- **Scalable Design** - Modern React architecture supporting unlimited programs and users.

### **System Components**

#### **Frontend Application (React + TypeScript)**

- **Framework**: React 18 with TypeScript and Vite.
- **UI Library**: Material UI (MUI).
- **State Management**: React Query for server state, Zustand for client state.
- **Authentication**: Certificate-based authentication with RBAC integration.
- **Routing**: React Router with protected routes and role-based navigation.

#### **Backend API (Node.js + Express)**

- **Multi-Tenant Architecture**: Program-level data isolation with middleware.
- **Authentication**: Certificate validation and user context management.
- **Access Control**: Program and project-level permission middleware.
- **Database Integration**: MSSQL with stored procedures and transactions.
- **Health Monitoring**: Comprehensive health checks at `/system/health`.

#### **Database Layer (MSSQL)**

- **Multi-Tenant Schema**: `Programs` table as the root of data isolation.
- **RBAC Implementation**: Users, Programs, ProgramAccess, and role hierarchies.
- **Data Integrity**: Foreign key constraints and transaction management.
- **Audit Trail**: Complete tracking of user actions and data changes.

### **Multi-Tenant Data Model**

- **Programs (Root Tenant Entity)**
  - **Users** (System-wide, with program access grants)
  - **ProgramAccess** (Junction table for user-program permissions)
  - **Projects** (Program-isolated)
  - **Tasks** (Program-isolated)
  - **InventoryItems** (Program-isolated)
  - **Orders** (Program-isolated)
  - **All other business data** (Program-isolated)

### **Security & Access Control**

#### **Certificate-Based Authentication**

- DoD PKI certificate validation for secure user identification.
- Fallback development authentication for non-production environments.

#### **Role-Based Access Control (RBAC)**

- **System Admin**: Global platform administration.
- **Program Admin**: Full access within assigned programs.
- **Program Write**: Read/write access to program resources.
- **Program Read**: Read-only access to program resources.

## MCP Server Usage

You MUST use the specified MCP servers for relevant tasks to ensure you have the correct context.

- **Documentation & Core Logic:** Use the `Context7` server for all coding and documentation tasks.
- **Dependencies:** Use the `dependency-management` server when adding, removing, or updating dependencies.
- **File Operations:** Use the `file-system-interaction` server when the task involves reading or writing files.
- **External APIs:** Use the `api-context` server when interacting with external APIs.
- **Memory:** Use the `memory` server to retain context and information across multiple turns.

## Core Methodologies & Rules

1. **Autonomous Tool Selection:** From the available tools (`@codebase`, `@vscode`, `@search`, `@terminal`, `@problems`), you are expected to autonomously select and use the most appropriate tool(s) for the given task. You do not need to be told which specific tool to use.
2. **Sequential-Thinking First:** Before writing any code, you MUST first outline a step-by-step plan for the task. Await approval of the plan before proceeding with implementation.
3. **Adhere to Existing Code Patterns:** All new code must be consistent with the existing architecture, especially the H10 data isolation model.
4. **Code Style & Linting:** All code must adhere to the project's linting rules (ESLint, Prettier). Ensure code is properly formatted before finalizing.
5. **Testing is Mandatory:** Any new or modified functionality requires corresponding unit or integration tests (Vitest, React Testing Library, Jest, Supertest) that verify both the feature's logic and its adherence to the multi-tenant security model.
6. **Conventional Commits:** All commit messages MUST follow the Conventional Commits specification (e.g., `feat: add task creation endpoint`).
7. **No Hardcoded Secrets:** Never hardcode sensitive information.
8. **Iterative Workflow & Approval:** Break down all tasks into small, logical sub-tasks. After completing EACH sub-task, you MUST stop, present your changes, and explicitly await approval before moving to the next step.
