import React, { useEffect, useRef } from 'react';
import { Box, Typography, Card, CardContent, Alert, CircularProgress } from '@mui/material';

interface APIDocumentationProps {
  isVisible: boolean;
}

const APIDocumentation: React.FC<APIDocumentationProps> = ({ isVisible }) => {
  const swaggerUIRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    if (!isVisible) return;

    const loadSwaggerUI = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load Swagger UI CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.type = 'text/css';
        cssLink.href = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css';
        document.head.appendChild(cssLink);

        // Load Swagger UI JS
        const bundleScript = document.createElement('script');
        bundleScript.src = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js';
        bundleScript.async = true;

        const presetScript = document.createElement('script');
        presetScript.src = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js';
        presetScript.async = true;

        // Wait for scripts to load
        await new Promise<void>((resolve, reject) => {
          bundleScript.onload = () => {
            presetScript.onload = () => resolve();
            presetScript.onerror = reject;
            document.head.appendChild(presetScript);
          };
          bundleScript.onerror = reject;
          document.head.appendChild(bundleScript);
        });

        // Initialize Swagger UI
        if (swaggerUIRef.current && (window as any).SwaggerUIBundle) {
          (window as any).SwaggerUIBundle({
            spec: {
              openapi: '3.0.0',
              info: {
                title: 'H10CM Production Management API',
                version: '1.0.0',
                description:
                  'Multi-tenant production management and inventory tracking system with certificate-based authentication and RBAC permissions.',
              },
              servers: [
                {
                  url: 'http://localhost:3000',
                  description: 'Development server',
                },
              ],
              security: [
                {
                  certificateAuth: [],
                },
              ],
              tags: [
                { name: 'Authentication', description: 'User authentication and authorization' },
                { name: 'Programs', description: 'Multi-tenant program management' },
                { name: 'Projects', description: 'Project management within programs' },
                { name: 'Tasks', description: 'Task management and tracking' },
                { name: 'Inventory', description: 'Inventory item management' },
                { name: 'Cart', description: 'Shopping cart functionality' },
                { name: 'Orders', description: 'Order management and processing' },
                { name: 'Notifications', description: 'User notifications' },
                { name: 'Users', description: 'User management' },
                { name: 'Health', description: 'System health monitoring' },
              ],
              paths: {
                '/api/auth/me': {
                  get: {
                    tags: ['Authentication'],
                    summary: 'Get current user information',
                    description:
                      'Returns information about the currently authenticated user including program access. Certificate information is only included for system administrators.',
                    responses: {
                      '200': {
                        description: 'User information',
                        content: {
                          'application/json': {
                            schema: { $ref: '#/components/schemas/AuthMe' },
                          },
                        },
                      },
                    },
                  },
                },
                '/api/programs': {
                  get: {
                    tags: ['Programs'],
                    summary: 'Get all programs',
                    description: 'Returns a list of all programs',
                    responses: {
                      '200': {
                        description: 'Array of programs',
                        content: {
                          'application/json': {
                            schema: {
                              type: 'array',
                              items: { $ref: '#/components/schemas/Program' },
                            },
                          },
                        },
                      },
                    },
                  },
                  post: {
                    tags: ['Programs'],
                    summary: 'Create a new program',
                    requestBody: {
                      required: true,
                      content: {
                        'application/json': {
                          schema: { $ref: '#/components/schemas/NewProgram' },
                        },
                      },
                    },
                    responses: {
                      '200': { description: 'Program created successfully' },
                    },
                  },
                },
                '/api/programs/{programId}/access': {
                  post: {
                    tags: ['Programs'],
                    summary: 'Grant program access to user',
                    parameters: [
                      {
                        name: 'programId',
                        in: 'path',
                        required: true,
                        schema: { type: 'integer' },
                      },
                    ],
                    requestBody: {
                      required: true,
                      content: {
                        'application/json': {
                          schema: { $ref: '#/components/schemas/ProgramAccess' },
                        },
                      },
                    },
                    responses: {
                      '200': { description: 'Access granted successfully' },
                    },
                  },
                },
                '/api/users': {
                  get: {
                    tags: ['Users'],
                    summary: 'Get all users',
                    responses: {
                      '200': {
                        description: 'Array of users',
                        content: {
                          'application/json': {
                            schema: {
                              type: 'array',
                              items: { $ref: '#/components/schemas/User' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                '/api/admin/create-user': {
                  post: {
                    tags: ['Users'],
                    summary: 'Create a new user (admin only)',
                    requestBody: {
                      required: true,
                      content: {
                        'application/json': {
                          schema: { $ref: '#/components/schemas/NewUser' },
                        },
                      },
                    },
                    responses: {
                      '200': {
                        description: 'User created successfully',
                        content: {
                          'application/json': {
                            schema: { $ref: '#/components/schemas/UserCreateResponse' },
                          },
                        },
                      },
                    },
                  },
                },
                '/api/projects': {
                  get: {
                    tags: ['Projects'],
                    summary: 'Get all projects',
                    parameters: [
                      {
                        name: 'program_id',
                        in: 'query',
                        schema: { type: 'integer' },
                        description: 'Filter by program ID',
                      },
                    ],
                    responses: {
                      '200': {
                        description: 'Array of projects',
                        content: {
                          'application/json': {
                            schema: {
                              type: 'array',
                              items: { $ref: '#/components/schemas/Project' },
                            },
                          },
                        },
                      },
                    },
                  },
                  post: {
                    tags: ['Projects'],
                    summary: 'Create a new project',
                    requestBody: {
                      required: true,
                      content: {
                        'application/json': {
                          schema: { $ref: '#/components/schemas/NewProject' },
                        },
                      },
                    },
                    responses: {
                      '200': { description: 'Project created successfully' },
                    },
                  },
                },
                '/api/projects/{id}': {
                  get: {
                    tags: ['Projects'],
                    summary: 'Get a single project by ID',
                    parameters: [
                      {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'integer' },
                      },
                    ],
                    responses: {
                      '200': {
                        description: 'Project details',
                        content: {
                          'application/json': {
                            schema: { $ref: '#/components/schemas/Project' },
                          },
                        },
                      },
                    },
                  },
                  put: {
                    tags: ['Projects'],
                    summary: 'Update an existing project',
                    parameters: [
                      {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'integer' },
                      },
                    ],
                    requestBody: {
                      required: true,
                      content: {
                        'application/json': {
                          schema: { $ref: '#/components/schemas/NewProject' },
                        },
                      },
                    },
                    responses: {
                      '200': { description: 'Project updated successfully' },
                    },
                  },
                  delete: {
                    tags: ['Projects'],
                    summary: 'Delete a project',
                    parameters: [
                      {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'integer' },
                      },
                    ],
                    responses: {
                      '200': { description: 'Project deleted successfully' },
                      '404': { description: 'Project not found' },
                    },
                  },
                },
                '/api/tasks': {
                  get: {
                    tags: ['Tasks'],
                    summary: 'Get all tasks',
                    parameters: [
                      {
                        name: 'project_id',
                        in: 'query',
                        schema: { type: 'integer' },
                        description: 'Filter by project ID',
                      },
                    ],
                    responses: {
                      '200': {
                        description: 'Array of tasks',
                        content: {
                          'application/json': {
                            schema: {
                              type: 'array',
                              items: { $ref: '#/components/schemas/Task' },
                            },
                          },
                        },
                      },
                    },
                  },
                  post: {
                    tags: ['Tasks'],
                    summary: 'Create a new task',
                    requestBody: {
                      required: true,
                      content: {
                        'application/json': {
                          schema: { $ref: '#/components/schemas/NewTask' },
                        },
                      },
                    },
                    responses: {
                      '200': { description: 'Task created successfully' },
                    },
                  },
                },
                '/api/inventory-items': {
                  get: {
                    tags: ['Inventory'],
                    summary: 'Get all inventory items',
                    parameters: [
                      {
                        name: 'category',
                        in: 'query',
                        schema: { type: 'string' },
                        description: 'Filter by category',
                      },
                      {
                        name: 'low_stock',
                        in: 'query',
                        schema: { type: 'boolean' },
                        description: 'Filter for low stock items',
                      },
                    ],
                    responses: {
                      '200': {
                        description: 'Inventory items with data wrapper',
                        content: {
                          'application/json': {
                            schema: { $ref: '#/components/schemas/InventoryItemsResponse' },
                          },
                        },
                      },
                    },
                  },
                  post: {
                    tags: ['Inventory'],
                    summary: 'Create a new inventory item',
                    requestBody: {
                      required: true,
                      content: {
                        'application/json': {
                          schema: { $ref: '#/components/schemas/NewInventoryItem' },
                        },
                      },
                    },
                    responses: {
                      '200': { description: 'Inventory item created successfully' },
                    },
                  },
                },
                '/api/notifications': {
                  get: {
                    tags: ['Notifications'],
                    summary: 'Get user notifications',
                    responses: {
                      '200': {
                        description: 'Array of notifications',
                        content: {
                          'application/json': {
                            schema: {
                              type: 'array',
                              items: { $ref: '#/components/schemas/Notification' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                '/api/notifications/{id}/read': {
                  put: {
                    tags: ['Notifications'],
                    summary: 'Mark notification as read',
                    parameters: [
                      {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'integer' },
                      },
                    ],
                    responses: {
                      '200': {
                        description: 'Notification marked as read',
                        content: {
                          'application/json': {
                            schema: { $ref: '#/components/schemas/MessageResponse' },
                          },
                        },
                      },
                    },
                  },
                },
                '/api/cart': {
                  get: {
                    tags: ['Cart'],
                    summary: "Get current user's cart",
                    parameters: [
                      {
                        name: 'project_id',
                        in: 'query',
                        required: true,
                        schema: { type: 'integer' },
                      },
                    ],
                    responses: {
                      '200': {
                        description: 'Cart contents with summary',
                        content: {
                          'application/json': {
                            schema: { $ref: '#/components/schemas/CartResponse' },
                          },
                        },
                      },
                    },
                  },
                },
                '/api/cart/add': {
                  post: {
                    tags: ['Cart'],
                    summary: 'Add item to cart',
                    requestBody: {
                      required: true,
                      content: {
                        'application/json': {
                          schema: { $ref: '#/components/schemas/AddToCartRequest' },
                        },
                      },
                    },
                    responses: {
                      '200': {
                        description: 'Item added to cart',
                        content: {
                          'application/json': {
                            schema: { $ref: '#/components/schemas/CartResponse' },
                          },
                        },
                      },
                    },
                  },
                },
                '/api/cart/{cartId}': {
                  put: {
                    tags: ['Cart'],
                    summary: 'Update cart item',
                    parameters: [
                      {
                        name: 'cartId',
                        in: 'path',
                        required: true,
                        schema: { type: 'integer' },
                      },
                    ],
                    requestBody: {
                      required: true,
                      content: {
                        'application/json': {
                          schema: { $ref: '#/components/schemas/UpdateCartRequest' },
                        },
                      },
                    },
                    responses: {
                      '200': { description: 'Cart item updated successfully' },
                    },
                  },
                  delete: {
                    tags: ['Cart'],
                    summary: 'Remove item from cart',
                    parameters: [
                      {
                        name: 'cartId',
                        in: 'path',
                        required: true,
                        schema: { type: 'integer' },
                      },
                    ],
                    responses: {
                      '200': { description: 'Item removed from cart' },
                    },
                  },
                },
                '/api/orders/create-from-cart': {
                  post: {
                    tags: ['Orders'],
                    summary: 'Create order from cart items',
                    requestBody: {
                      required: true,
                      content: {
                        'application/json': {
                          schema: { $ref: '#/components/schemas/CreateOrderRequest' },
                        },
                      },
                    },
                    responses: {
                      '200': {
                        description: 'Order created successfully',
                        content: {
                          'application/json': {
                            schema: { $ref: '#/components/schemas/OrderCreateResponse' },
                          },
                        },
                      },
                    },
                  },
                },
                '/api/orders/pending': {
                  get: {
                    tags: ['Orders'],
                    summary: 'Get pending orders',
                    parameters: [
                      {
                        name: 'project_id',
                        in: 'query',
                        schema: { type: 'integer' },
                        description: 'Filter by project ID',
                      },
                    ],
                    responses: {
                      '200': {
                        description: 'Pending orders',
                        content: {
                          'application/json': {
                            schema: { $ref: '#/components/schemas/PendingOrdersResponse' },
                          },
                        },
                      },
                    },
                  },
                },
                '/api/orders/{orderId}/received': {
                  put: {
                    tags: ['Orders'],
                    summary: 'Mark order as received',
                    parameters: [
                      {
                        name: 'orderId',
                        in: 'path',
                        required: true,
                        schema: { type: 'integer' },
                      },
                    ],
                    responses: {
                      '200': {
                        description: 'Order marked as received',
                        content: {
                          'application/json': {
                            schema: { $ref: '#/components/schemas/OrderReceivedResponse' },
                          },
                        },
                      },
                    },
                  },
                },
                '/api/health': {
                  get: {
                    tags: ['Health'],
                    summary: 'System health check',
                    responses: {
                      '200': {
                        description: 'System health status',
                        content: {
                          'application/json': {
                            schema: { $ref: '#/components/schemas/HealthResponse' },
                          },
                        },
                      },
                    },
                  },
                },
                '/api/health/db': {
                  get: {
                    tags: ['Health'],
                    summary: 'Database health check',
                    responses: {
                      '200': {
                        description: 'Database health status',
                        content: {
                          'application/json': {
                            schema: { $ref: '#/components/schemas/DatabaseHealthResponse' },
                          },
                        },
                      },
                    },
                  },
                },
              },
              components: {
                securitySchemes: {
                  certificateAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-arr-clientcert',
                    description:
                      "Certificate-based authentication (use 'development-fallback' for local development)",
                  },
                },
                schemas: {
                  AuthMe: {
                    type: 'object',
                    properties: {
                      user: {
                        type: 'object',
                        properties: {
                          user_id: { type: 'integer', example: 2 },
                          username: { type: 'string', example: 'justin.dougherty' },
                          displayName: { type: 'string', example: 'Justin Dougherty' },
                          is_system_admin: { type: 'boolean', example: true },
                          program_access: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                program_id: { type: 'integer', example: 1 },
                                access_level: { type: 'string', example: 'Admin' },
                                program_name: { type: 'string', example: 'Production Line A' },
                                program_code: { type: 'string', example: 'PLA' },
                              },
                            },
                          },
                          accessible_programs: {
                            type: 'array',
                            items: { type: 'integer' },
                            example: [1, 2, 3],
                          },
                          certificateInfo: {
                            type: 'object',
                            description:
                              'ΓÜá∩╕Å ADMIN ONLY: Certificate information for system administrators',
                            properties: {
                              subject: {
                                type: 'string',
                                example:
                                  'CN=DOUGHERTY.JUSTIN.MICHAEL.1250227228,OU=USN,OU=PKI,OU=DoD,O=U.S. Government,C=US',
                              },
                              issuer: {
                                type: 'string',
                                example: 'CN=DOD ID CA-73,OU=PKI,OU=DoD,O=U.S. Government,C=US',
                              },
                              serialNumber: { type: 'string', example: '067547' },
                            },
                          },
                        },
                      },
                      headers: {
                        type: 'object',
                        description: 'Request headers (admin only)',
                        additionalProperties: true,
                      },
                      extractedFrom: {
                        type: 'string',
                        enum: ['certificate', 'fallback'],
                        description: 'Source of authentication (admin only)',
                      },
                      request: {
                        type: 'object',
                        description: 'Request information (admin only)',
                        properties: {
                          ip: { type: 'string', example: '192.168.1.100' },
                          method: { type: 'string', example: 'GET' },
                          path: { type: 'string', example: '/api/auth/me' },
                          protocol: { type: 'string', example: 'http' },
                          secure: { type: 'boolean', example: false },
                        },
                      },
                    },
                  },
                  Program: {
                    type: 'object',
                    properties: {
                      program_id: { type: 'integer' },
                      program_name: { type: 'string' },
                      program_code: { type: 'string' },
                      program_description: { type: 'string' },
                      is_active: { type: 'boolean' },
                      date_created: { type: 'string', format: 'date-time' },
                      last_modified: { type: 'string', format: 'date-time' },
                    },
                  },
                  NewProgram: {
                    type: 'object',
                    properties: {
                      program_name: { type: 'string' },
                      program_code: { type: 'string' },
                      program_description: { type: 'string' },
                    },
                  },
                  ProgramAccess: {
                    type: 'object',
                    properties: {
                      user_id: { type: 'integer' },
                      access_level: { type: 'string', enum: ['Read', 'Write', 'Admin'] },
                    },
                  },
                  User: {
                    type: 'object',
                    properties: {
                      user_id: { type: 'integer' },
                      user_name: { type: 'string' },
                      display_name: { type: 'string' },
                      is_system_admin: { type: 'boolean' },
                      is_active: { type: 'boolean' },
                      certificate_subject: { type: 'string' },
                      date_created: { type: 'string', format: 'date-time' },
                      last_login: { type: 'string', format: 'date-time' },
                    },
                  },
                  NewUser: {
                    type: 'object',
                    properties: {
                      user_name: { type: 'string' },
                      display_name: { type: 'string' },
                      certificate_subject: { type: 'string' },
                      is_system_admin: { type: 'boolean' },
                    },
                  },
                  UserCreateResponse: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      user_id: { type: 'integer' },
                      user_name: { type: 'string' },
                      display_name: { type: 'string' },
                      is_system_admin: { type: 'boolean' },
                    },
                  },
                  Project: {
                    type: 'object',
                    properties: {
                      project_id: { type: 'integer' },
                      program_id: { type: 'integer' },
                      project_name: { type: 'string' },
                      project_description: { type: 'string' },
                      status: { type: 'string' },
                      priority: { type: 'string' },
                      program_name: { type: 'string' },
                      program_code: { type: 'string' },
                      project_manager_name: { type: 'string' },
                      date_created: { type: 'string', format: 'date-time' },
                      last_modified: { type: 'string', format: 'date-time' },
                      project_start_date: { type: 'string', format: 'date-time' },
                      project_end_date: { type: 'string', format: 'date-time' },
                    },
                  },
                  NewProject: {
                    type: 'object',
                    properties: {
                      program_id: { type: 'integer' },
                      project_name: { type: 'string' },
                      project_description: { type: 'string' },
                      status: { type: 'string' },
                      priority: { type: 'string' },
                      project_start_date: { type: 'string', format: 'date-time' },
                      project_end_date: { type: 'string', format: 'date-time' },
                    },
                  },
                  Task: {
                    type: 'object',
                    properties: {
                      task_id: { type: 'integer' },
                      project_id: { type: 'integer' },
                      task_name: { type: 'string' },
                      task_description: { type: 'string' },
                      status: { type: 'string' },
                      priority: { type: 'string' },
                      assigned_to: { type: 'integer' },
                      due_date: { type: 'string', format: 'date-time' },
                      date_created: { type: 'string', format: 'date-time' },
                      last_modified: { type: 'string', format: 'date-time' },
                    },
                  },
                  NewTask: {
                    type: 'object',
                    properties: {
                      project_id: { type: 'integer' },
                      task_name: { type: 'string' },
                      task_description: { type: 'string' },
                      status: { type: 'string' },
                      priority: { type: 'string' },
                      assigned_to: { type: 'integer' },
                      due_date: { type: 'string', format: 'date-time' },
                    },
                  },
                  InventoryItem: {
                    type: 'object',
                    properties: {
                      inventory_item_id: { type: 'integer' },
                      item_name: { type: 'string' },
                      part_number: { type: 'string' },
                      description: { type: 'string' },
                      category: { type: 'string' },
                      unit_of_measure: { type: 'string' },
                      current_stock_level: { type: 'number' },
                      reorder_point: { type: 'number' },
                      cost_per_unit: { type: 'number' },
                      location: { type: 'string' },
                      is_active: { type: 'boolean' },
                      supplier_info: { type: 'string' },
                      max_stock_level: { type: 'number' },
                      date_created: { type: 'string', format: 'date-time' },
                      last_modified: { type: 'string', format: 'date-time' },
                      program_id: { type: 'integer' },
                      created_by_name: { type: 'string' },
                    },
                  },
                  NewInventoryItem: {
                    type: 'object',
                    properties: {
                      item_name: { type: 'string' },
                      part_number: { type: 'string' },
                      description: { type: 'string' },
                      category: { type: 'string' },
                      unit_of_measure: { type: 'string' },
                      current_stock_level: { type: 'number' },
                      reorder_point: { type: 'number' },
                      cost_per_unit: { type: 'number' },
                      location: { type: 'string' },
                      supplier_info: { type: 'string' },
                      max_stock_level: { type: 'number' },
                      program_id: { type: 'integer' },
                    },
                  },
                  InventoryItemsResponse: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/InventoryItem' },
                      },
                    },
                  },
                  Notification: {
                    type: 'object',
                    properties: {
                      notification_id: { type: 'integer' },
                      user_id: { type: 'integer' },
                      message: { type: 'string' },
                      type: { type: 'string' },
                      is_read: { type: 'boolean' },
                      date_created: { type: 'string', format: 'date-time' },
                    },
                  },
                  CartItem: {
                    type: 'object',
                    properties: {
                      cart_id: { type: 'integer' },
                      user_id: { type: 'integer' },
                      project_id: { type: 'integer' },
                      inventory_item_id: { type: 'integer' },
                      quantity_requested: { type: 'number' },
                      estimated_cost: { type: 'number' },
                      date_added: { type: 'string', format: 'date-time' },
                      item_name: { type: 'string' },
                      part_number: { type: 'string' },
                      unit_of_measure: { type: 'string' },
                      cost_per_unit: { type: 'number' },
                    },
                  },
                  CartSummary: {
                    type: 'object',
                    properties: {
                      total_items: { type: 'integer' },
                      total_quantity: { type: 'number' },
                      total_estimated_cost: { type: 'number' },
                    },
                  },
                  CartResponse: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      items: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/CartItem' },
                      },
                      summary: { $ref: '#/components/schemas/CartSummary' },
                      user_id: { type: 'integer' },
                      project_id: { type: 'integer' },
                    },
                  },
                  AddToCartRequest: {
                    type: 'object',
                    properties: {
                      inventory_item_id: { type: 'integer' },
                      quantity_requested: { type: 'number' },
                      project_id: { type: 'integer' },
                    },
                  },
                  UpdateCartRequest: {
                    type: 'object',
                    properties: {
                      quantity_requested: { type: 'number' },
                    },
                  },
                  CreateOrderRequest: {
                    type: 'object',
                    properties: {
                      project_id: { type: 'integer' },
                      delivery_notes: { type: 'string' },
                    },
                  },
                  OrderCreateResponse: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      order: {
                        type: 'object',
                        properties: {
                          order_id: { type: 'integer' },
                          order_number: { type: 'string' },
                          total_cost: { type: 'number' },
                          item_count: { type: 'integer' },
                        },
                      },
                    },
                  },
                  Order: {
                    type: 'object',
                    properties: {
                      order_id: { type: 'integer' },
                      order_number: { type: 'string' },
                      user_id: { type: 'integer' },
                      user_name: { type: 'string' },
                      project_id: { type: 'integer' },
                      project_name: { type: 'string' },
                      status: { type: 'string' },
                      total_estimated_cost: { type: 'number' },
                      order_date: { type: 'string', format: 'date-time' },
                      delivery_notes: { type: 'string' },
                      items: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            item_name: { type: 'string' },
                            part_number: { type: 'string' },
                            quantity_requested: { type: 'number' },
                            estimated_cost: { type: 'number' },
                          },
                        },
                      },
                    },
                  },
                  PendingOrdersResponse: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      orders: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Order' },
                      },
                      user_id: { type: 'integer' },
                      project_id: { type: 'integer' },
                    },
                  },
                  OrderReceivedResponse: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      order_id: { type: 'integer' },
                      order_number: { type: 'string' },
                      received_date: { type: 'string', format: 'date-time' },
                      items_updated: { type: 'integer' },
                    },
                  },
                  MessageResponse: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                    },
                  },
                  HealthResponse: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                  DatabaseHealthResponse: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      database: { type: 'string' },
                    },
                  },
                  ErrorResponse: {
                    type: 'object',
                    properties: {
                      error: { type: 'string' },
                      status: { type: 'integer' },
                    },
                  },
                },
              },
            },
            domNode: swaggerUIRef.current,
            deepLinking: true,
            presets: [
              (window as any).SwaggerUIBundle.presets.apis,
              (window as any).SwaggerUIStandalonePreset,
            ],
            plugins: [(window as any).SwaggerUIBundle.plugins.DownloadUrl],
            layout: 'StandaloneLayout',
            validatorUrl: null,
            displayOperationId: false,
            displayRequestDuration: true,
            docExpansion: 'list',
            filter: true,
            showExtensions: true,
            showCommonExtensions: true,
            tryItOutEnabled: true,
            requestInterceptor: (request: any) => {
              // Add certificate header for local development
              if (!request.headers['x-arr-clientcert']) {
                request.headers['x-arr-clientcert'] = 'development-fallback';
              }
              return request;
            },
          });
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading Swagger UI:', err);
        setError('Failed to load API documentation. Please try again.');
        setIsLoading(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timeout = setTimeout(loadSwaggerUI, 100);
    return () => clearTimeout(timeout);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            API Documentation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Interactive API documentation for the H10CM system. Certificate information is only
            displayed for system administrators.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isLoading && (
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Loading API documentation...
            </Typography>
          </Box>
        )}

        <Box
          ref={swaggerUIRef}
          sx={{
            '& .swagger-ui': {
              fontFamily: 'inherit',
              color: 'inherit',
            },
            '& .swagger-ui .info': {
              margin: '20px 0',
              color: 'inherit',
            },
            '& .swagger-ui .info .title': {
              color: 'inherit',
            },
            '& .swagger-ui .info .description': {
              color: 'inherit',
            },
            '& .swagger-ui .scheme-container': {
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
            },
            '& .swagger-ui .topbar': {
              display: 'none',
            },
            '& .swagger-ui .opblock-summary': {
              color: 'inherit',
            },
            '& .swagger-ui .opblock-description-wrapper': {
              color: 'inherit',
            },
            '& .swagger-ui .opblock-tag': {
              color: 'inherit',
            },
            '& .swagger-ui .opblock .opblock-summary-path': {
              color: 'inherit',
            },
            '& .swagger-ui .opblock .opblock-summary-description': {
              color: 'inherit',
            },
            '& .swagger-ui .parameter__name': {
              color: 'inherit',
            },
            '& .swagger-ui .parameter__type': {
              color: 'inherit',
            },
            '& .swagger-ui .response-col_status': {
              color: 'inherit',
            },
            '& .swagger-ui .response-col_description': {
              color: 'inherit',
            },
            '& .swagger-ui .model-box': {
              background: 'transparent',
            },
            '& .swagger-ui .model': {
              color: 'inherit',
            },
            '& .swagger-ui .model .property': {
              color: 'inherit',
            },
            '& .swagger-ui .model .property-type': {
              color: 'inherit',
            },
            '& .swagger-ui .renderedMarkdown': {
              color: 'inherit',
            },
            '& .swagger-ui .renderedMarkdown p': {
              color: 'inherit',
            },
            '& .swagger-ui .tab li': {
              color: 'inherit',
            },
            '& .swagger-ui .opblock .opblock-section-header': {
              background: 'transparent',
            },
            '& .swagger-ui .opblock .opblock-section-header h4': {
              color: 'inherit',
            },
            '& .swagger-ui .btn.authorize': {
              background: 'transparent',
              border: '1px solid',
              borderColor: 'primary.main',
              color: 'primary.main',
            },
            '& .swagger-ui .btn.authorize:hover': {
              background: 'primary.main',
              color: 'primary.contrastText',
            },
            '& .swagger-ui .highlight-code': {
              background: 'transparent',
            },
            '& .swagger-ui .highlight-code .hljs': {
              background: 'transparent',
              color: 'inherit',
            },
          }}
        />
      </CardContent>
    </Card>
  );
};

export default APIDocumentation;
