# H10CM API Response Formats Documentation

## Overview
This document outlines the standardized request/response formats used across the H10CM application, including Frontend, API, and Database layers.

## General Architecture
- **Frontend**: React with TypeScript, using Axios for API calls
- **API**: Node.js Express server with MSSQL database
- **Database**: Microsoft SQL Server with stored procedures using JSON parameters

## Authentication
All API endpoints (except `/` and `/api/health`) require authentication via certificate:
```javascript
Headers: {
  "x-arr-clientcert": "development-fallback" // or actual certificate
}
```

## Multi-Tenant Security
- Program-based access control implemented across all endpoints
- Non-admin users see only data from their accessible programs
- Admin users (`is_system_admin: true`) have access to all programs

---

## API Response Format Standards

### 1. Collection Endpoints (GET - Multiple Items)

#### Standard Format
```javascript
{
  "data": [
    {
      "item_id": 1,
      "item_name": "Example Item",
      ...
    }
  ]
}
```

#### Examples:
- `GET /api/inventory-items` → `{ data: InventoryItem[] }`
- `GET /api/projects` → `Project[]` (direct array - inconsistent)
- `GET /api/users` → `User[]` (direct array - inconsistent)
- `GET /api/programs` → `Program[]` (direct array - inconsistent)

### 2. Single Item Endpoints (GET - Single Item)

#### Standard Format
```javascript
{
  "item_id": 1,
  "item_name": "Example Item",
  ...
}
```

#### Examples:
- `GET /api/projects/:id` → `Project` (direct object)

### 3. Success Operation Responses

#### Standard Format
```javascript
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }, // Optional: returned data
  "additional_field": "value" // Context-specific fields
}
```

#### Examples:
- `POST /api/cart/add` → `{ success: true, items: CartItem[], summary: {...} }`
- `PUT /api/orders/:id/received` → `{ success: true, message: "...", order_id: 1, ... }`
- `GET /api/orders/pending` → `{ success: true, orders: Order[], user_id: 2 }`

### 4. Error Responses

#### Standard Format
```javascript
{
  "error": "Error message description",
  "status": 500 // HTTP status code
}
```

#### Examples:
- `{ error: "Failed to get inventory items" }` (500)
- `{ error: "Unauthorized access" }` (401)
- `{ error: "Database not connected" }` (500)

---

## Database Layer Patterns

### 1. Stored Procedure Calls

#### JSON Parameter Format
```sql
DECLARE @ParameterJson NVARCHAR(MAX) = '{
  "field1": "value1",
  "field2": 123,
  "field3": true
}';

EXEC usp_ProcedureName @ParameterJson = @ParameterJson;
```

#### Examples:
- `usp_MarkOrderAsReceived` → `{"order_id": 1, "user_id": 2}`
- `usp_SaveProject` → `{"project_name": "...", "program_id": 1, "created_by": 2}`

### 2. Database Query Results

#### Standard Format
```javascript
result.recordset = [
  {
    "column1": "value1",
    "column2": 123,
    "column3": true
  }
]
```

---

## Frontend API Service Patterns

### 1. API Client Configuration
```typescript
const apiClient = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'x-arr-clientcert': 'development-fallback'
  }
});
```

### 2. Response Handling Patterns

#### Collection Data
```typescript
export const getAllInventory = async (): Promise<{ data: InventoryItem[] }> => {
  const response = await apiClient.get('/inventory-items');
  return response.data; // Expects: { data: InventoryItem[] }
};
```

#### Flexible Array Handling
```typescript
export const fetchProjectAttributes = async (projectId: string): Promise<AttributeDefinition[]> => {
  const { data } = await apiClient.get(`/projects/${projectId}/attributes`);
  return Array.isArray(data) ? data : (data.data || []);
};
```

#### Success Response Handling
```typescript
export const fetchPendingOrders = async (projectId?: string): Promise<Order[]> => {
  const response = await apiClient.get('/orders/pending', {
    params: { project_id: projectId }
  });
  const data = response.data;
  if (data.success) {
    return data.orders || [];
  } else {
    console.error('Failed to fetch pending orders:', data.error);
    return [];
  }
};
```

---

## Inconsistencies and Recommendations

### Current Inconsistencies

1. **Response Format Mixing**:
   - Some endpoints return `{ data: [...] }`
   - Others return arrays directly `[...]`
   - Some return `{ success: true, orders: [...] }`

2. **Authentication Handling**:
   - Some endpoints use `executeQuery()` (applies program filtering)
   - Others use direct database calls without consistent filtering

3. **Error Handling**:
   - Inconsistent error message formats
   - Mixed use of HTTP status codes

### Recommended Standardization

#### 1. Standardize Collection Responses
```javascript
// Recommended format for all collection endpoints
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 50
  }
}
```

#### 2. Standardize Single Item Responses
```javascript
// Recommended format for single item endpoints
{
  "success": true,
  "data": { ... }
}
```

#### 3. Standardize Error Responses
```javascript
// Recommended format for all error responses
{
  "success": false,
  "error": {
    "message": "Human readable error message",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

---

## Current Endpoint Mapping

### Authentication & User Management
- `GET /api/auth/me` → `{ user: User, certificateInfo: {...} }`
- `GET /api/users` → `User[]`
- `POST /api/admin/create-user` → `{ message: "...", user_id: 1, ... }`

### Program & Project Management
- `GET /api/programs` → `Program[]`
- `POST /api/programs` → Direct response from stored procedure
- `GET /api/projects` → `Project[]`
- `POST /api/projects` → Direct response from stored procedure

### Inventory Management
- `GET /api/inventory-items` → `{ data: InventoryItem[] }` ✅ **FIXED**
- `POST /api/inventory-items` → Direct response from stored procedure

### Order Management
- `GET /api/orders/pending` → `{ success: true, orders: Order[], user_id: 2 }`
- `PUT /api/orders/:id/received` → `{ success: true, message: "...", order_id: 1, ... }`

### Cart Management
- `GET /api/cart` → `{ success: true, items: CartItem[], summary: {...} }`
- `POST /api/cart/add` → `{ success: true, items: CartItem[], summary: {...} }`

### Health & Monitoring
- `GET /api/health` → `{ status: "OK", timestamp: "..." }`
- `GET /api/health/db` → `{ status: "OK", database: "connected" }`

---

## Testing Commands

### PowerShell Testing Examples
```powershell
# Test inventory endpoint
Invoke-WebRequest -Uri "http://localhost:3000/api/inventory-items" -Method GET -Headers @{"x-arr-clientcert"="development-fallback"}

# Test pending orders
Invoke-WebRequest -Uri "http://localhost:3000/api/orders/pending" -Method GET -Headers @{"x-arr-clientcert"="development-fallback"}

# Test mark order as received
Invoke-WebRequest -Uri "http://localhost:3000/api/orders/1/received" -Method PUT -Headers @{"x-arr-clientcert"="development-fallback"}
```

### JSON Response Parsing
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/inventory-items" -Method GET -Headers @{"x-arr-clientcert"="development-fallback"}
$data = $response.Content | ConvertFrom-Json
$data.data | Select-Object -First 5
```

---

## Migration Notes

### Recently Fixed Issues

1. **Inventory Endpoint Format** (✅ FIXED):
   - **Problem**: API returned array directly, frontend expected `{ data: [...] }`
   - **Solution**: Updated `/api/inventory-items` to return `{ data: InventoryItem[] }`
   - **Impact**: Frontend inventory page now displays correctly

2. **Program Access Filtering** (✅ FIXED):
   - **Problem**: Inventory items not filtered by user's accessible programs
   - **Solution**: Added proper program-based filtering in inventory endpoint
   - **Impact**: Users now see only inventory items from their accessible programs

### Remaining Inconsistencies

1. **Response Format Standardization**: Many endpoints still return different formats
2. **Error Handling**: Inconsistent error response structures
3. **Authentication**: Some endpoints bypass proper program filtering

---

## Summary

The H10CM application uses a multi-layered architecture with program-based access control. The main challenge is standardizing response formats across all endpoints while maintaining backward compatibility. The inventory endpoint has been fixed to return the expected `{ data: [...] }` format, resolving the frontend display issue.

**Key Takeaways:**
- Always use consistent response formats within the same application
- Implement proper program-based filtering for multi-tenant security
- Use standardized error handling across all endpoints
- Test API changes with both PowerShell and frontend integration
