import axios from 'axios';
import { debugService } from './debugService';
import { Project } from 'src/types/Project';
import { InventoryItem, InventoryAdjustment, InventoryTransaction } from 'src/types/Inventory';
import { BulkSubmissionResult } from 'src/types/Cart';
import { ProductionUnit } from 'src/types/Production';
import { ProjectStep } from 'src/types/ProjectSteps';
import { AttributeDefinition } from 'src/types/AttributeDefinition'; // Assuming this type exists
import { StepInventoryRequirement } from 'src/types/StepInventoryRequirement'; // Assuming this type exists
import { TrackedItem, TrackedItemAttribute, TrackedItemStepProgress } from 'src/types/TrackedItem';
import { PendingOrderItem, PendingOrderSummary, ReceiveItemsRequest, PendingOrderStatus, PendingOrderHeader } from '../types/PendingOrders';
import smartNotifications from './smartNotificationService';

// The base URL will be handled by the Vite proxy you have set up
const apiClient = axios.create({
  baseURL: '/api',
});

// Add authentication header for development
apiClient.interceptors.request.use((config) => {
  // Add the development fallback header that the backend expects
  config.headers['x-arr-clientcert'] = 'development-fallback';
  return config;
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Extract error message from response
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        error.message || 
                        'An unexpected error occurred';
    
    // Log the error for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data
    });
    
    // Automatically report API errors to GitHub if enabled
    try {
      const { githubIntegrationService } = await import('./githubIntegrationService');
      const config = githubIntegrationService.getConfig();
      
      if (config.enabled && config.autoCreateIssues && error.response?.status >= 500) {
        // Only report server errors (5xx) automatically
        const errorContext = githubIntegrationService.captureError(error, {
          errorType: 'api',
          severity: error.response?.status >= 500 ? 'high' : 'medium',
          category: 'bug',
          apiEndpoint: error.config?.url,
          httpStatus: error.response?.status,
          requestData: error.config?.data ? JSON.parse(error.config.data) : undefined,
          responseData: error.response?.data,
          additionalContext: {
            method: error.config?.method?.toUpperCase(),
            baseURL: error.config?.baseURL,
            headers: error.config?.headers,
            autoReported: true,
            captureMethod: 'axios.response.interceptor',
            automatic: true,
          },
        });

        await githubIntegrationService.createIssueFromError(errorContext);
        console.log('✅ API error automatically reported to GitHub');
      }
    } catch (reportError) {
      console.warn('Failed to auto-report API error to GitHub:', reportError);
    }
    
    // Show user-friendly notification for API errors
    if (error.response?.status >= 400) {
      // Import notifications lazily to avoid circular dependencies
      import('./notificationService').then(({ notifications }) => {
        if (error.response?.status >= 500) {
          notifications.error(`Server Error: ${errorMessage}`);
        } else if (error.response?.status === 403) {
          notifications.error('Access denied. Please check your permissions.');
        } else if (error.response?.status === 401) {
          notifications.error('Authentication required. Please log in again.');
        } else {
          notifications.error(`Error: ${errorMessage}`);
        }
      });
    }
    
    // Re-throw the error so React Query can handle it
    return Promise.reject(error);
  }
);

// --- Project API Functions ---
export const fetchProjects = async (): Promise<Project[]> => {
  const { data } = await apiClient.get('/projects');
  // The sorting is now handled in the API, but as a fallback, we can sort here.
  if (Array.isArray(data)) {
    data.sort((a, b) => a.project_name.localeCompare(b.project_name));
  }
  return data;
};

export const fetchProjectById = async (projectId: string | undefined): Promise<Project | null> => {
  console.log('🔍 fetchProjectById: Called with projectId:', projectId);
  
  if (!projectId) {
    console.log('🔍 fetchProjectById: No projectId provided, returning null');
    return null;
  }
  
  try {
    console.log('🔍 fetchProjectById: Making API call to /projects/' + projectId);
    const { data } = await apiClient.get(`/projects/${projectId}`);
    console.log('🔍 fetchProjectById: API response received:', data);
    
    // APIs for a single item might return an array with one item
    if (Array.isArray(data) && data.length > 0) {
      const projectData = data[0];
      console.log('🔍 fetchProjectById: Processing array response, first item:', projectData);
      
      // Derive project_type based on project_name
      let derivedProjectType = 'OTHER';
      if (projectData.project_name === 'PR') {
        derivedProjectType = 'PR';
      } else if (projectData.project_name === 'Assembly Line A') {
        derivedProjectType = 'ASSEMBLY';
      }
      
      const result = { ...projectData, project_type: derivedProjectType };
      console.log('🔍 fetchProjectById: Returning processed project:', result);
      return result;
    }
    
    // Handle standardized response format - extract the actual project data
    if (data && data.data) {
      console.log('🔍 fetchProjectById: Extracting project data from standardized response:', data.data);
      return data.data;
    }
    
    console.log('🔍 fetchProjectById: Returning direct response:', data);
    return data;
  } catch (error) {
    console.error('🔍 fetchProjectById: API call failed:', error);
    
    // Enhanced error logging for debugging
    if (error instanceof Error) {
      console.error('🔍 fetchProjectById: Error message:', error.message);
      console.error('🔍 fetchProjectById: Error stack:', error.stack);
    }
    
    // Axios error handling
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      console.error('🔍 fetchProjectById: Axios error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        headers: axiosError.response?.headers,
        config: {
          url: axiosError.config?.url,
          method: axiosError.config?.method,
          headers: axiosError.config?.headers,
          baseURL: axiosError.config?.baseURL,
        }
      });
    }
    
    throw error;
  }
};

export const createProject = async (project: Omit<Project, 'project_id' | 'date_created'>): Promise<Project> => {
  const { data } = await apiClient.post('/projects', project);
  // Handle standardized response format - data is wrapped in a success response
  return data.data || data;
};

export const updateProject = async (project: Project): Promise<Project> => {
  const { data } = await apiClient.put(`/projects/${project.project_id}`, project);
  // Handle standardized response format - data is wrapped in a success response
  return data.data || data;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  await apiClient.delete(`/projects/${projectId}`);
};

export const fetchProjectSteps = async (projectId: string | undefined): Promise<ProjectStep[]> => {
  if (!projectId) return [];
  const response = await apiClient.get(`/projects/${projectId}/steps`);
  const apiData = response.data;
  
  // Handle the standardized response format with nested data structure
  if (apiData.success && apiData.data && Array.isArray(apiData.data.data)) {
    return apiData.data.data;
  }
  
  // Fallback for direct array response or legacy format
  return Array.isArray(apiData.data) ? apiData.data : [];
};

export const createProjectStep = async (step: Omit<ProjectStep, 'step_id'>): Promise<ProjectStep> => {
  const { data } = await apiClient.post('/steps', step);
  return data;
};

export const updateProjectStep = async (step: ProjectStep): Promise<ProjectStep> => {
  const { data } = await apiClient.put(`/steps/${step.step_id}`, step);
  return data;
};

export const deleteProjectStep = async (stepId: string): Promise<void> => {
  await apiClient.delete(`/steps/${stepId}`);
};

export const fetchTrackedItems = async (projectId: string | undefined): Promise<ProductionUnit[]> => {
  if (!projectId) return [];
  console.log('Fetching tracked items for project:', projectId);
  const response = await apiClient.get(`/projects/${projectId}/tracked-items`);
  console.log('API response:', response.data);
  // Handle standardized response format: { success: true, data: { data: Array } }
  const nestedData = response.data.data;
  console.log('Nested data:', nestedData);
  const actualData = nestedData?.data || nestedData;
  console.log('Actual array data:', actualData);
  console.log('Is actual data an array?', Array.isArray(actualData));
  console.log('Actual data length:', actualData?.length);
  
  // Log the structure of the first item to understand the data format
  if (Array.isArray(actualData) && actualData.length > 0) {
    console.log('First item structure:', actualData[0]);
    console.log('First item keys:', Object.keys(actualData[0]));
  }
  
  // Ensure data is an array, otherwise return an empty array
  return Array.isArray(actualData) ? actualData : [];
};

export const fetchTrackedItemDetails = async (itemId: string): Promise<TrackedItem> => {
  const { data } = await apiClient.get(`/tracked-items/${itemId}`);
  return data;
};

export const createTrackedItem = async (item: Omit<TrackedItem, 'item_id' | 'date_created' | 'last_modified'>): Promise<TrackedItem> => {
  const { data } = await apiClient.post('/tracked-items', item);
  return data;
};

export const saveTrackedItemAttributes = async (itemId: string, attributes: TrackedItemAttribute[]): Promise<void> => {
  await apiClient.post(`/tracked-items/${itemId}/attributes`, attributes);
};

export const updateTrackedItemStepProgress = async (itemId: string, stepId: string, progress: TrackedItemStepProgress): Promise<void> => {
  await apiClient.put(`/tracked-items/${itemId}/steps/${stepId}`, { 
    status: progress.status, 
    completed_by_user_name: progress.completed_by_user_name
  });
};

export const batchUpdateTrackedItemStepProgress = async (
  itemIds: string[], 
  stepId: string, 
  progress: Omit<TrackedItemStepProgress, 'item_id' | 'step_id'>
): Promise<void> => {
  await apiClient.post('/tracked-items/batch-step-progress', {
    itemIds,
    stepId,
    status: progress.status,
    completed_by_user_name: progress.completed_by_user_name
  });
};

// --- Inventory API Functions ---
export const fetchInventoryItems = async (): Promise<InventoryItem[]> => {
    const { data } = await apiClient.get('/inventory-items');
    return data;
};

export const fetchInventoryItemById = async (inventoryItemId: string): Promise<InventoryItem> => {
  const { data } = await apiClient.get(`/inventory-items/${inventoryItemId}`);
  return data;
};

export const createInventoryItem = async (item: Omit<InventoryItem, 'inventory_item_id'>): Promise<InventoryItem> => {
  const { data } = await apiClient.post('/inventory-items', item);
  return data;
};

export const updateInventoryItem = async (item: InventoryItem): Promise<InventoryItem> => {
  const { data } = await apiClient.put(`/inventory-items/${item.inventory_item_id}`, item);
  return data;
};

export const adjustInventoryStock = async (adjustment: InventoryAdjustment): Promise<void> => {
  await apiClient.post('/inventory-items/adjust', adjustment);
};

// Bulk operations
export const bulkAdjustInventoryStock = async (adjustments: InventoryAdjustment[]): Promise<BulkSubmissionResult> => {
  const { data } = await apiClient.post('/inventory-items/bulk-adjust', { adjustments });
  return data;
};

export const bulkAddInventoryItems = async (items: Omit<InventoryItem, 'inventory_item_id' | 'current_stock_level'>[]): Promise<BulkSubmissionResult> => {
  const { data } = await apiClient.post('/inventory-items/bulk-add', { items });
  return data;
};

export const fetchInventoryTransactions = async (inventoryItemId: string): Promise<InventoryTransaction[]> => {
  const { data } = await apiClient.get(`/inventory-items/${inventoryItemId}/transactions`);
  
  // Handle different response formats
  if (Array.isArray(data)) {
    return data;
  }
  
  // If the response has a data property with an array
  if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
    return data.data;
  }
  
  // Default to empty array if format is unexpected
  console.warn('Unexpected transaction data format:', data);
  return [];
};

export const getInventoryByProject = async (projectId: number): Promise<InventoryItem[]> => {
  const { data } = await apiClient.get(`/inventory/project/${projectId}`);
  return data;
};

// The API returns InventoryItem[] directly, but we wrap it for consistency
export const getAllInventory = async (): Promise<{ data: InventoryItem[] }> => {
  const response = await apiClient.get('/inventory-items');
  return { data: response.data };
};

export const addInventoryItem = async (newItem: Omit<InventoryItem, 'inventory_item_id'>): Promise<InventoryItem> => {
  const { data } = await apiClient.post('/inventory-items', newItem);
  return data;
};

export const deleteInventoryItem = async (id: number): Promise<void> => {
  await apiClient.delete(`/inventory-items/${id}`);
};

// --- Attribute Definition API Functions ---
export const fetchProjectAttributes = async (projectId: string): Promise<AttributeDefinition[]> => {
  const { data } = await apiClient.get(`/projects/${projectId}/attributes`);
  // Handle both direct array and { data: array } response formats
  return Array.isArray(data) ? data : (data.data || []);
};

export const createAttributeDefinition = async (attribute: Omit<AttributeDefinition, 'attribute_definition_id'>): Promise<AttributeDefinition> => {
  const { data } = await apiClient.post('/attributes', attribute);
  return data;
};

export const updateAttributeDefinition = async (attribute: AttributeDefinition): Promise<AttributeDefinition> => {
  const { data } = await apiClient.put(`/attributes/${attribute.attribute_definition_id}`, attribute);
  return data;
};

export const deleteAttributeDefinition = async (attributeId: string): Promise<void> => {
  await apiClient.delete(`/attributes/${attributeId}`);
};

// --- Step Inventory Requirements API Functions ---
export const fetchStepInventoryRequirements = async (stepId: string): Promise<StepInventoryRequirement[]> => {
  const { data } = await apiClient.get(`/steps/${stepId}/inventory-requirements`);
  return data;
};

export const createStepInventoryRequirement = async (requirement: Omit<StepInventoryRequirement, 'requirement_id'>): Promise<StepInventoryRequirement> => {
  const { data } = await apiClient.post('/inventory-requirements', requirement);
  return data;
};

export const updateStepInventoryRequirement = async (requirement: StepInventoryRequirement): Promise<StepInventoryRequirement> => {
  const { data } = await apiClient.put(`/inventory-requirements/${requirement.requirement_id}`, requirement);
  return data;
};

export const deleteStepInventoryRequirement = async (requirementId: string): Promise<void> => {
  await apiClient.delete(`/inventory-requirements/${requirementId}`);
};

// --- View Endpoints API Functions ---
export const fetchInventoryStockStatusView = async (): Promise<any[]> => {
  const { data } = await apiClient.get('/views/inventory-stock-status');
  return data;
};

export const fetchTrackedItemsOverviewView = async (): Promise<any[]> => {
  const { data } = await apiClient.get('/views/tracked-items-overview');
  return data;
};

export const fetchStepProgressStatusView = async (): Promise<any[]> => {
  const { data } = await apiClient.get('/views/step-progress-status');
  return data;
};

// Pending Orders API
export const fetchPendingOrders = async (): Promise<PendingOrderHeader[]> => {
  try {
    // Use project_id=1 as default for now (this should be configurable)
    const { data } = await apiClient.get(`/orders/pending?project_id=1`);
    
    if (data.success) {
      console.log('Fetched pending orders from API:', data.orders);
      return data.orders || [];
    } else {
      console.error('Failed to fetch pending orders:', data.error);
      return [];
    }
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    return [];
  }
};

export const createPendingOrders = async (items: Omit<PendingOrderItem, 'pending_order_id' | 'quantity_received' | 'date_requested' | 'status'>[]): Promise<BulkSubmissionResult> => {
  try {
    console.log('🔄 Creating pending orders for items:', items);
    
    // First, add all items to the cart
    const cartPromises = items.map(item => {
      const cartItem = {
        inventory_item_id: item.inventory_item_id,
        quantity_requested: item.quantity_requested,
        estimated_cost: item.estimated_cost || 0,
        notes: item.notes || 'Bulk reorder request'
      };
      
      console.log('🛒 Adding item to cart:', cartItem);
      return apiClient.post('/cart/add', cartItem);
    });

    // Wait for all items to be added to cart
    console.log('⏳ Waiting for cart items to be added...');
    const cartResults = await Promise.all(cartPromises);
    console.log('✅ Cart items added successfully:', cartResults.map(r => r.data));
    
    // Then create order from cart
    const orderData = {
      project_id: 1, // Use project_id=1 as default for now
      supplier_info: items[0]?.supplier || 'Various Suppliers',
      order_notes: `Bulk order created from ${items.length} items`
    };
    
    console.log('📦 Creating order from cart with data:', orderData);
    const { data } = await apiClient.post('/orders/create-from-cart', orderData);
    console.log('📋 Order creation response:', data);
    
    if (data.success) {
      console.log('✅ Created order from cart:', data.order);
      return {
        success: true,
        message: `Successfully created order from ${items.length} items`,
        successfulItems: items.map(item => item.inventory_item_id.toString()),
        failedItems: []
      };
    } else {
      throw new Error(data.error || 'Failed to create order from cart');
    }
  } catch (error) {
    console.error('❌ Error creating pending orders:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      console.error('Response status:', axiosError.response?.status);
      console.error('Response data:', axiosError.response?.data);
    }
    return {
      success: false,
      message: 'Failed to create pending orders',
      successfulItems: [],
      failedItems: items.map(item => ({ 
        cartItemId: item.inventory_item_id.toString(), 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }))
    };
  }
};

export const updatePendingOrderStatus = async (
  pending_order_id: number, 
  status: PendingOrderStatus, 
  notes?: string
): Promise<PendingOrderItem> => {
  const { data } = await apiClient.put(`/orders/${pending_order_id}/status`, {
    status,
    notes
  });
  
  // Create notification for status change
  smartNotifications.notifyOrderStatusChange(data, data.previous_status);
  
  return data;
};

export const receiveOrderItems = async (request: ReceiveItemsRequest): Promise<BulkSubmissionResult> => {
  const { data } = await apiClient.put('/orders/receive', request);
  
  // Create notifications for received items
  request.items.forEach(item => {
    if (item.quantity_received > 0) {
      smartNotifications.createNotification({
        type: 'success',
        category: 'orders',
        title: 'Order Received',
        message: `Received ${item.quantity_received} units for order #${item.pending_order_id}`,
        actionRequired: false,
        relatedEntityType: 'order',
        relatedEntityId: item.pending_order_id,
        actionUrl: '/orders/pending',
        actionLabel: 'View Orders',
        metadata: { 
          quantityReceived: item.quantity_received,
          notes: item.notes
        },
        icon: '✅',
      });
    }
  });
  
  return data;
};

export const getPendingOrdersSummary = async (): Promise<PendingOrderSummary> => {
  const { data } = await apiClient.get('/pending-orders/summary');
  return data;
};

export const deletePendingOrder = async (pending_order_id: number): Promise<void> => {
  await apiClient.delete(`/orders/${pending_order_id}`);
};

// --- Task Management API Functions ---
import { TaskItem, CreateTaskRequest, UpdateTaskRequest, TaskStatistics, UserTaskSummary } from 'src/types/Task';

export const fetchTasks = async (): Promise<TaskItem[]> => {
  try {
    const response = await fetch('/api/tasks');
    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return []; // Return empty array on error
  }
};

export const fetchTasksByProject = async (projectId: string): Promise<TaskItem[]> => {
  try {
    const response = await fetch(`/api/projects/${projectId}/tasks`);
    if (!response.ok) {
      throw new Error('Failed to fetch project tasks');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    return []; // Return empty array on error
  }
};

export const fetchTasksByUser = async (userId: string): Promise<TaskItem[]> => {
  try {
    const response = await fetch(`/api/users/${userId}/tasks`);
    if (!response.ok) {
      throw new Error('Failed to fetch user tasks');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    return []; // Return empty array on error
  }
};

export const createTask = async (task: CreateTaskRequest): Promise<TaskItem> => {
  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });

    if (!response.ok) {
      throw new Error('Failed to create task');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTask = async (taskId: string, updates: Partial<TaskItem>): Promise<TaskItem> => {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update task');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete task');
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

export const getTaskStatistics = async (): Promise<TaskStatistics> => {
  try {
    const response = await fetch('/api/tasks/statistics');
    if (!response.ok) {
      throw new Error('Failed to fetch task statistics');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching task statistics:', error);
    // Return empty stats on error
    return {
      total_tasks: 0,
      pending_tasks: 0,
      in_progress_tasks: 0,
      completed_tasks: 0,
      overdue_tasks: 0,
      high_priority_tasks: 0,
      tasks_by_category: {
        Production: 0,
        Inventory: 0,
        Quality: 0,
        Planning: 0,
        Maintenance: 0,
        General: 0,
      },
      tasks_by_user: {},
    };
  }
};

export const getUserTaskSummary = async (userId: string): Promise<UserTaskSummary> => {
  try {
    const response = await fetch(`/api/users/${userId}/task-summary`);
    if (!response.ok) {
      throw new Error('Failed to fetch user task summary');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user task summary:', error);
    // Return empty summary on error
    return {
      user_id: userId,
      username: 'unknown',
      pending_tasks: [],
      in_progress_tasks: [],
      overdue_tasks: [],
      completed_today: 0,
      total_assigned: 0,
    };
  }
};

// --- Cart API Functions ---

export interface CartAPIItem {
  cart_id?: number;
  inventory_item_id: number;
  quantity_requested: number;
  estimated_cost?: number;
  notes?: string;
  item_name: string;
  part_number?: string;
  unit_of_measure: string;
  user_id?: number;
  date_added?: string;
}

export interface CartAPIResponse {
  success: boolean;
  items?: CartAPIItem[];
  cart_summary?: {
    total_items: number;
    total_quantity: number;
    total_estimated_cost: number;
  };
  message?: string;
}

export const addToCart = async (item: {
  inventory_item_id: number;
  quantity_requested: number;
  estimated_cost?: number;
  notes?: string;
}): Promise<CartAPIResponse> => {
  const { data } = await apiClient.post('/cart/add', item);
  return data;
};

export const getCartItems = async (project_id: number): Promise<CartAPIResponse> => {
  const { data } = await apiClient.get(`/cart?project_id=${project_id}`);
  return data;
};

export const updateCartItem = async (cartId: number, item: {
  quantity_requested: number;
  estimated_cost?: number;
  notes?: string;
}): Promise<CartAPIResponse> => {
  const { data } = await apiClient.put(`/cart/${cartId}`, item);
  return data;
};

export const removeFromCart = async (cartId: number): Promise<CartAPIResponse> => {
  const { data } = await apiClient.delete(`/cart/${cartId}`);
  return data;
};

export const clearCart = async (project_id: number): Promise<CartAPIResponse> => {
  const { data } = await apiClient.delete(`/cart/clear?project_id=${project_id}`);
  return data;
};

export const createOrderFromCart = async (orderData: {
  project_id: number;
  supplier_info?: string;
  order_notes?: string;
}): Promise<BulkSubmissionResult> => {
  try {
    const { data } = await apiClient.post('/orders/create-from-cart', orderData);
    return data;
  } catch (error) {
    console.error('Error creating order from cart:', error);
    return {
      success: false,
      message: 'Failed to create order from cart',
      successfulItems: [],
      failedItems: []
    };
  }
};

// =============================================================================
// CART & ORDERS API FUNCTIONS
// =============================================================================

// Mark order as received
export const markOrderAsReceived = async (orderId: number) => {
  try {
    const { data } = await apiClient.put(`/orders/${orderId}/received`);
    return data;
  } catch (error) {
    console.error('Error marking order as received:', error);
    throw error;
  }
};

// Check inventory stock levels and availability
export const checkInventoryStock = async (inventoryItemId: number): Promise<{
  success: boolean;
  inventory_item_id: number;
  item_name: string;
  part_number: string;
  current_stock_level: number;
  pending_orders_quantity: number;
  available_quantity: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  reorder_point: number | null;
  max_stock_level: number | null;
  can_order: boolean;
  stock_message: string;
}> => {
  try {
    const { data } = await apiClient.get(`/inventory-items/${inventoryItemId}/stock`);
    return data;
  } catch (error) {
    console.error('Error checking inventory stock:', error);
    throw error;
  }
};
