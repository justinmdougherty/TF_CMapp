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
                            schema: {
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
                                          program_name: {
                                            type: 'string',
                                            example: 'Production Line A',
                                          },
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
                                        '⚠️ ADMIN ONLY: Certificate information for system administrators',
                                      properties: {
                                        subject: {
                                          type: 'string',
                                          example:
                                            'CN=DOUGHERTY.JUSTIN.MICHAEL.1250227228,OU=USN,OU=PKI,OU=DoD,O=U.S. Government,C=US',
                                        },
                                        issuer: {
                                          type: 'string',
                                          example:
                                            'CN=DOD ID CA-73,OU=PKI,OU=DoD,O=U.S. Government,C=US',
                                        },
                                        serialNumber: { type: 'string', example: '067547' },
                                      },
                                    },
                                  },
                                },
                              },
                            },
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
            },
            '& .swagger-ui .info': {
              margin: '20px 0',
            },
            '& .swagger-ui .scheme-container': {
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
            },
            '& .swagger-ui .topbar': {
              display: 'none',
            },
            '& .swagger-ui .info .title': {
              color: 'inherit',
            },
          }}
        />
      </CardContent>
    </Card>
  );
};

export default APIDocumentation;
