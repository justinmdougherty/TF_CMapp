# H10CM GitHub Issues Creation Script
# This script helps create initial GitHub issues for the H10CM project

param(
    [string]$GitHubToken,
    [string]$Owner = "justinmdougherty",
    [string]$Repo = "H10CM"
)

# GitHub API base URL
$baseUrl = "https://api.github.com/repos/$Owner/$Repo"

# Headers for GitHub API
$headers = @{
    "Authorization" = "token $GitHubToken"
    "Accept"        = "application/vnd.github.v3+json"
    "User-Agent"    = "H10CM-Issue-Creator"
}

# Issue templates
$issues = @(
    @{
        title  = "[TASK] Complete Multi-Tenant Security Audit for All API Endpoints"
        body   = @"
## Context
While fixing the inventory display issue, we discovered that the inventory endpoint was missing program_id filtering. We need to audit all endpoints to prevent data leakage between tenants.

## Scope
- [ ] Audit all GET endpoints for proper program filtering
- [ ] Audit all POST/PUT/DELETE endpoints for program validation  
- [ ] Review middleware implementation
- [ ] Test cross-tenant data access scenarios
- [ ] Document security patterns

## Endpoints to Review
- [ ] /api/projects
- [ ] /api/tasks
- [ ] /api/inventory-items  
- [ ] /api/orders
- [ ] /api/cart
- [ ] All other data endpoints

## Acceptance Criteria
- [ ] All endpoints verified to have program_id filtering
- [ ] Security test cases written and passing
- [ ] Documentation updated with security patterns
- [ ] No cross-tenant data access possible

**Priority:** High - Security critical
"@
        labels = @("security", "task", "high-priority", "backend")
    },
    @{
        title  = "[TASK] Standardize API Response Formats Across All Endpoints"
        body   = @"
## Problem
Different endpoints return data in different formats:
- Some return arrays directly
- Some return { data: array }
- Error handling is inconsistent

## Solution
Create standard response format:
```typescript
// Success responses
{ success: true, data: any, message?: string }

// Error responses  
{ success: false, error: string, details?: any }
```

## Files to Modify
- [ ] api/index.js - Update all endpoint responses
- [ ] H10CM/src/services/api.ts - Update API client
- [ ] All React hooks in src/hooks/api/

**Priority:** Medium - Developer experience improvement
"@
        labels = @("backend", "api", "consistency", "medium-priority")
    },
    @{
        title  = "[TASK] Implement Comprehensive Testing Suite"
        body   = @"
## Current State
- Backend: Basic Jest setup, low coverage
- Frontend: Basic Vitest setup, low coverage

## Goals
- Backend: 80%+ test coverage
- Frontend: 70%+ test coverage
- Integration tests for critical flows

## Tasks
- [ ] Backend API endpoint tests
- [ ] Database/stored procedure tests
- [ ] Frontend component tests
- [ ] React hook tests
- [ ] Integration tests for key workflows
- [ ] CI/CD pipeline with automated testing

**Priority:** High - Prevent future regressions
"@
        labels = @("testing", "quality", "high-priority")
    },
    @{
        title  = "[BUG] Inventory Display Issue - RESOLVED"
        body   = @"
## Summary
✅ **RESOLVED** - Inventory items were not displaying in the frontend application despite existing in the database.

## Root Cause
Data structure mismatch in frontend API service:
- Backend: Returns InventoryItem[] directly  
- Frontend: Expected { data: InventoryItem[] } structure
- Bug: getAllInventory() returned response.data instead of { data: response.data }

## Solution Applied
Fixed frontend API service to wrap response correctly:
```typescript
export const getAllInventory = async (): Promise<{ data: InventoryItem[] }> => {
  const response = await apiClient.get('/inventory-items');
  return { data: response.data };  // ✅ Correct!
};
```

## Files Modified
- api/index.js - Added program_id to inventory query
- H10CM/src/services/api.ts - Fixed data structure wrapping

**Resolution Date:** July 17, 2025
"@
        labels = @("bug", "frontend", "backend", "inventory", "resolved")
    }
)

function Create-GitHubIssue {
    param($issue)
    
    $body = @{
        title  = $issue.title
        body   = $issue.body
        labels = $issue.labels
    } | ConvertTo-Json
    
    try {
        Write-Host "Creating issue: $($issue.title)" -ForegroundColor Yellow
        $response = Invoke-RestMethod -Uri "$baseUrl/issues" -Method POST -Headers $headers -Body $body
        Write-Host "✅ Created issue #$($response.number): $($issue.title)" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "❌ Failed to create issue: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Main execution
if (-not $GitHubToken) {
    Write-Host @"
🚀 H10CM GitHub Issues Setup

To use this script, you need a GitHub Personal Access Token.

1. Go to GitHub.com → Settings → Developer settings → Personal access tokens
2. Create a new token with 'repo' scope
3. Run this script with: .\create-issues.ps1 -GitHubToken "your-token-here"

Alternatively, you can manually create these issues using the templates in GITHUB_SETUP.md
"@ -ForegroundColor Cyan
    exit 1
}

Write-Host "🚀 Creating initial GitHub issues for H10CM..." -ForegroundColor Cyan
Write-Host "Repository: $Owner/$Repo" -ForegroundColor White

$createdIssues = @()
foreach ($issue in $issues) {
    $created = Create-GitHubIssue -issue $issue
    if ($created) {
        $createdIssues += $created
        Start-Sleep -Seconds 1  # Rate limiting
    }
}

Write-Host "`n🎉 Issue creation complete!" -ForegroundColor Green
Write-Host "Created $($createdIssues.Count) out of $($issues.Count) issues" -ForegroundColor White

if ($createdIssues.Count -gt 0) {
    Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Go to https://github.com/$Owner/$Repo/issues to view your issues" -ForegroundColor White
    Write-Host "2. Set up a GitHub Project board to track progress" -ForegroundColor White  
    Write-Host "3. Add milestones and assign issues" -ForegroundColor White
    Write-Host "4. Start working on the high-priority security audit!" -ForegroundColor White
}
