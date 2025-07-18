# Dynamic Attribute System Enhancement

## Summary of Changes

This update implements a more flexible attribute system that allows users to specify which attributes should be auto-generated during project creation, and excludes date-type attributes from the batch creation modal.

## Key Changes

### 1. Database Schema Update
- **File**: `add_auto_generated_column.sql`
- **Change**: Added `is_auto_generated` column to `AttributeDefinitions` table
- **Purpose**: Allows marking attributes as auto-generated during project creation

### 2. API Updates
- **File**: `api/index.js`
- **Changes**:
  - Added `is_auto_generated` parameter to attribute creation endpoint
  - Updated GET attributes endpoint to include `is_auto_generated` field
  - **NEW**: Added `/api/tracked-items/batch-step-progress` endpoint for batch status updates
- **Purpose**: Support for the new auto-generation flag and step progress logging

### 3. TypeScript Interface Updates
- **File**: `src/types/AttributeDefinition.ts`
- **Change**: Added `is_auto_generated?: boolean` field
- **Purpose**: Type safety for the new attribute flag

### 4. Project Creation Modal
- **File**: `src/views/dashboard/modals/AddProjectModal.tsx`
- **Changes**:
  - Added "Auto-Generated" column to attribute definition table
  - Added toggle switch for marking attributes as auto-generated
  - Date attributes automatically disable auto-generation
  - Updated API call to include `is_auto_generated` field
- **Purpose**: Allow users to specify which attributes should be auto-generated

### 5. Batch Creation Modal
- **File**: `src/views/project-detail/BatchTrackingComponent.tsx`
- **Changes**:
  - Removed name-based attribute type detection functions
  - Now uses database `is_auto_generated` flag instead of naming conventions
  - Date attributes are excluded from batch creation modal
  - Improved auto-generation logic for non-standard attributes
- **Purpose**: More accurate attribute handling based on user preferences

### 6. Step Progress Logging Fix

- **File**: `api/index.js`
- **Changes**:
  - Added missing `/api/tracked-items/batch-step-progress` endpoint
  - Implements proper database logging for step status updates
  - Records completion timestamps and user information in TrackedItemStepProgress table
- **Purpose**: Fix the issue where step status updates weren't being saved to database

## User Experience Improvements

1. **Project Creation**: Users can now explicitly mark which attributes should be auto-generated
2. **Batch Creation**: Date attributes (like calibration dates) are no longer shown in batch creation modal
3. **Serial Number Generation**: More flexible patterns that don't depend on project naming conventions
4. **Type Safety**: Better TypeScript support for the new attribute system

## Migration Required

**Important**: Run the `add_auto_generated_column.sql` script on your database before using the updated application.

## Example Usage

When creating a project:

1. Define attributes like "Unit Serial Number", "PCB Serial Number", "Starting Cal Date"
2. Mark serial number attributes as "Auto-Generated"
3. Leave date attributes as manual entry
4. When creating batches, only auto-generated and manual text attributes will appear
5. Date attributes will be handled separately in individual item editing

## Benefits

- **Flexibility**: Users control which attributes are auto-generated
- **Accuracy**: Date attributes are properly excluded from batch operations
- **Maintainability**: Database-driven configuration instead of hard-coded logic
- **Scalability**: Supports any number of custom attributes with proper typing
