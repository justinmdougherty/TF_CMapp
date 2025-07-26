// h10cm_api.js - H10CM Multi-Tenant API Server

// Load environment variables from .env file
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Debug: Check if GitHub token is loaded
console.log('🔑 GitHub Token loaded:', process.env.GITHUB_TOKEN ? `${process.env.GITHUB_TOKEN.substring(0, 8)}...` : 'NOT FOUND');

// Initialize GitHub Error Reporting (must be before other imports)
const githubErrorReporting = require('./services/githubErrorReporting');

// Initialize Audit Logger
const { AuditLogger, auditMiddleware, getClientIP, getUserAgent } = require('./services/auditLogger');

// -----------------------------------------------------------------------------
// SETUP & DEPENDENCIES
// -----------------------------------------------------------------------------
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const { responseMiddleware, executeProcedureStandardized } = require('./helpers/responseHelper');

const app = express();
const PORT = process.env.PORT || 3000;

// Add standardized response middleware early in the pipeline
app.use(responseMiddleware);

// Import route modules
const procurementRoutes = require('./routes/procurement');

// -----------------------------------------------------------------------------
// MIDDLEWARE
// -----------------------------------------------------------------------------
app.use(cors());
app.use(express.json());

// Pretty JSON middleware - formats all JSON responses with indentation
app.set('json spaces', 2);

// GitHub Error Reporting Middleware (must be before routes)
app.use(githubErrorReporting.errorMiddleware());

// -----------------------------------------------------------------------------
// DATABASE CONFIGURATION & CONNECTION
// -----------------------------------------------------------------------------
const dbConfig = {
    user: "sa",
    password: "0)Password",
    server: "127.0.0.1",
    database: "H10CM",  // Unified H10CM database with all tables and stored procedures
    port: 1433,
    options: {
        encrypt: true,
        enableArithAbort: true,
        trustServerCertificate: true
    }
};

// Connect to unified H10CM database
sql.connect(dbConfig).then(pool => {
    console.log('Connected to H10CM Multi-Tenant Database');
    app.locals.db = pool; // Main database connection
    app.locals.h10cmDb = pool; // Same connection for backward compatibility
    
    // Initialize audit logger with database connection
    app.locals.auditLogger = new AuditLogger(pool);
    console.log('✅ Audit logging system initialized');
    
    // Add audit middleware for API call logging
    app.use(auditMiddleware(app.locals.auditLogger));
}).catch(err => {
    console.error('Database Connection Failed!', err);
});

// -----------------------------------------------------------------------------
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// -----------------------------------------------------------------------------

const DEFAULT_USER_CERT = process.env.DEFAULT_USER_CERT || "development-fallback";

// Development fallback certificate for testing without real certs
const DEFAULT_DEVELOPMENT_CERT = "development-fallback";

// Extract user information from certificate and get their program access
const authenticateUser = async (req, res, next) => {
    try {
        const pool = req.app.locals.db;
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        // Get certificate from header or use development fallback
        const clientCert = req.headers['x-arr-clientcert'] || DEFAULT_USER_CERT;
        
        // Extract certificate subject (simplified for this example)
        const certSubject = extractCertificateSubject(clientCert);
        
        // Use stored procedure for secure user lookup
        const userResult = await pool.request()
            .input('CertificateSubject', sql.NVarChar, certSubject)
            .execute('usp_GetUserWithProgramAccess');

        if (userResult.recordset.length === 0) {
            // Log failed authentication attempt
            if (req.app.locals.auditLogger) {
                try {
                    await req.app.locals.auditLogger.logAuthentication(
                        null, // No user_id for failed auth
                        'LOGIN_FAILED',
                        false,
                        getClientIP(req),
                        getUserAgent(req),
                        { certificate_subject: certSubject, reason: 'User not found' }
                    );
                } catch (auditError) {
                    console.warn('Failed to log authentication failure:', auditError);
                }
            }
            return res.status(401).json({ error: 'User not found or not authorized' });
        }

        const user = userResult.recordset[0];
        
        // Parse program access JSON
        user.program_access = user.program_access ? JSON.parse(user.program_access) : [];
        user.accessible_programs = user.program_access.map(p => p.program_id);
        
        // Attach user info to request
        req.user = user;
        
        // Log successful authentication
        if (req.app.locals.auditLogger) {
            try {
                await req.app.locals.auditLogger.logAuthentication(
                    user.user_id,
                    'LOGIN',
                    true,
                    getClientIP(req),
                    getUserAgent(req),
                    { 
                        certificate_subject: certSubject,
                        program_count: user.accessible_programs.length,
                        is_admin: user.is_system_admin
                    }
                );
            } catch (auditError) {
                console.warn('Failed to log successful authentication:', auditError);
            }
        }
        
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

// Check if user has access to specific program
const checkProgramAccess = (requiredLevel = 'Read') => {
    return (req, res, next) => {
        let programId = req.params.programId || req.query.program_id || req.body.program_id;
        
        // If no program_id provided, use user's first accessible program as default
        if (!programId && req.user.accessible_programs && req.user.accessible_programs.length > 0) {
            programId = req.user.accessible_programs[0];
        }
        
        if (!programId) {
            return res.status(400).json({ error: 'Program ID required' });
        }

        // System admins have access to all programs
        if (req.user.is_system_admin) {
            req.programId = parseInt(programId);
            return next();
        }

        // Check user's program access
        const programAccess = req.user.program_access.find(p => p.program_id == programId);
        
        if (!programAccess) {
            return res.status(403).json({ error: 'Access denied to this program' });
        }

        // Check access level
        const accessLevels = { 'Read': 1, 'Write': 2, 'Admin': 3 };
        const userLevel = accessLevels[programAccess.access_level] || 0;
        const requiredAccessLevel = accessLevels[requiredLevel] || 1;

        if (userLevel < requiredAccessLevel) {
            return res.status(403).json({ error: `Insufficient access level. Required: ${requiredLevel}` });
        }

        req.programId = parseInt(programId);
        next();
    };
};

// Helper function to extract certificate subject (simplified)
const extractCertificateSubject = (cert) => {
    // If using development fallback, return Justin's admin subject for development
    if (cert === DEFAULT_DEVELOPMENT_CERT || cert === DEFAULT_USER_CERT) {
        return "CN=DOUGHERTY.JUSTIN.MICHAEL.1250227228,OU=USN,OU=PKI,OU=DoD,O=U.S. Government,C=US";
    }
    
    // In a real implementation, you'd parse the actual certificate
    // For production, return the real certificate subject
    return "CN=DOUGHERTY.JUSTIN.MICHAEL.1250227228,OU=USN,OU=PKI,OU=DoD,O=U.S. Government,C=US";
};

// Filter data by user's accessible programs
const filterByProgramAccess = (data, user) => {
    if (user.is_system_admin) {
        return data; // System admins see all data
    }
    
    return data.filter(item => {
        return user.accessible_programs.includes(item.program_id);
    });
};

// Execute query with program filtering
const executeQuery = async (req, res, query, params = []) => {
    try {
        const pool = req.app.locals.db;
        if (!pool) {
            throw new Error("Database not connected");
        }
        
        const request = pool.request();
        
        params.forEach(param => {
            request.input(param.name, param.type, param.value);
        });

        const result = await request.query(query);
        
        // Filter results by user's program access if not system admin
        let filteredData = result.recordset;
        if (!req.user.is_system_admin && filteredData.length > 0 && filteredData[0].hasOwnProperty('program_id')) {
            filteredData = filterByProgramAccess(filteredData, req.user);
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(filteredData);
        
    } catch (error) {
        console.error('Error executing query:', error);
        
        // Report this error to GitHub
        await githubErrorReporting.reportAPIError(error, req, {
            endpoint: req.originalUrl,
            errorLocation: 'executeQuery_function',
            procedureName: procedureName,
            queryParams: params
        });
        
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ error: error.message });
    }
};

// Legacy stored procedure execution (for backward compatibility)
const executeProcedure = async (res, procedureName, params = []) => {
    try {
        console.log(`=== EXECUTING PROCEDURE: ${procedureName} ===`);
        console.log('Parameters:', JSON.stringify(params, null, 2));
        
        const pool = res.app.locals.db;
        if (!pool) {
            throw new Error("Database not connected. Check your configuration.");
        }
        
        const request = pool.request();
        
        params.forEach(param => {
            console.log(`Adding parameter: ${param.name} = ${param.value}`);
            request.input(param.name, param.type, param.value);
        });

        const result = await request.execute(procedureName);
        console.log('Procedure result:', result);
        
        res.setHeader('Content-Type', 'application/json');

        if (result.recordset && result.recordset.length > 0) {
            const firstRow = result.recordset[0];
            const firstColumn = firstRow[Object.keys(firstRow)[0]];
            
            // Check if this is a JSON string response (like from some procedures)
            if (typeof firstColumn === 'string' && Object.keys(firstRow).length === 1) {
                try {
                    console.log('JSON result string:', firstColumn);
                    const data = JSON.parse(firstColumn);
                    
                    if (data.error) {
                        console.log('Procedure returned error:', data.error);
                        return res.status(400).send(JSON.stringify(data, null, 2));
                    }
                    if (data.SuccessMessage || data.WarningMessage) {
                        console.log('Procedure returned success/warning:', data);
                        return res.status(200).send(JSON.stringify(data, null, 2));
                    }
                    
                    console.log('Procedure returned JSON data:', data);
                    res.status(200).send(JSON.stringify(data, null, 2));
                } catch (parseError) {
                    // If JSON parsing fails, treat as structured data
                    console.log('Procedure returned structured data (single row):', firstRow);
                    res.status(200).send(JSON.stringify(firstRow, null, 2));
                }
            } else {
                // This is structured data (like from usp_SaveProject)
                if (result.recordset.length === 1) {
                    console.log('Procedure returned structured data (single row):', firstRow);
                    res.status(200).send(JSON.stringify(firstRow, null, 2));
                } else {
                    console.log('Procedure returned structured data (multiple rows):', result.recordset);
                    res.status(200).send(JSON.stringify(result.recordset, null, 2));
                }
            }
        } else {
            console.log('Procedure returned empty result');
            res.status(200).send('[]');
        }
    } catch (error) {
        console.error(`Error executing procedure ${procedureName}:`, error);
        res.setHeader('Content-Type', 'application/json');
        
        // Handle specific database constraint violations for better UX
        if (error.message) {
            // Handle duplicate key constraint (project names must be unique within a program)
            if (error.message.includes('UQ_Projects_Name_Program') || 
                error.message.includes('Cannot insert duplicate key')) {
                return res.status(409).send(JSON.stringify({ 
                    error: {
                        ErrorMessage: "A project with this name already exists in this program. Please choose a different name.",
                        type: 'duplicate_key',
                        constraint: 'unique_project_name_per_program',
                        field: 'project_name'
                    }
                }, null, 2));
            }
            
            // Handle other unique constraint violations
            if (error.message.includes('UNIQUE KEY constraint') || error.message.includes('duplicate key')) {
                return res.status(409).send(JSON.stringify({ 
                    error: {
                        ErrorMessage: "This entry conflicts with an existing record. Please check your data and try again.",
                        type: 'duplicate_key',
                        originalError: error.message
                    }
                }, null, 2));
            }
            
            // Handle foreign key constraint violations
            if (error.message.includes('FOREIGN KEY constraint')) {
                return res.status(400).send(JSON.stringify({ 
                    error: {
                        ErrorMessage: "Referenced data does not exist. Please check your selections and try again.",
                        type: 'foreign_key_violation',
                        originalError: error.message
                    }
                }, null, 2));
            }
        }
        
        res.status(500).send(JSON.stringify({ error: { ErrorMessage: "An internal server error occurred.", details: error.message } }, null, 2));
    }
};

// -----------------------------------------------------------------------------
// API ROUTES
// -----------------------------------------------------------------------------

app.get('/', (req, res) => {
    res.send('H10CM Multi-Tenant API is running!');
});

// =============================================================================
// AUTHENTICATION & USER MANAGEMENT ENDPOINTS
// =============================================================================

app.get("/api/auth/me", authenticateUser, (req, res) => {
  //console.log("Headers received:", JSON.stringify(req.headers, null, 2));

  const clientCert = req.headers['x-arr-clientcert'] || DEFAULT_USER_CERT;
  
  // Extract readable certificate subject instead of raw certificate data
  const certSubject = extractCertificateSubject(clientCert);
  
  // Create safe headers object without the full certificate
  const safeHeaders = { ...req.headers };
  if (safeHeaders['x-arr-clientcert']) {
    safeHeaders['x-arr-clientcert'] = `[CERTIFICATE_PRESENT_${safeHeaders['x-arr-clientcert'].length}_BYTES]`;
  }

  const userData = {
    user: {
      user_id: req.user.user_id,
      username: req.user.user_name,
      displayName: req.user.display_name,
      is_system_admin: req.user.is_system_admin,
      program_access: req.user.program_access,
      accessible_programs: req.user.accessible_programs,
      certificateInfo: {
        subject: certSubject,
        issuer: req.headers['x-arr-ssl'] || "",
        serialNumber: ""
      }
    },
    headers: safeHeaders,
    extractedFrom: req.headers['x-arr-clientcert'] ? 'certificate' : 'fallback',
    request: {
      ip: req.headers['x-forwarded-for'] || req.ip,
      method: req.method,
      path: req.path,
      protocol: req.protocol,
      secure: req.secure
    }
  };

  // Return user data directly (not wrapped in standardized response format)
  // This endpoint needs to maintain compatibility with frontend expectations
  return res.json(userData);
});

// =============================================================================
// PROGRAM MANAGEMENT ENDPOINTS (ADMIN ONLY)
// =============================================================================

// GET all programs (conditional authentication for initial setup)
app.get('/api/programs', async (req, res) => {
    try {
        const pool = req.app.locals.db;
        if (!pool) {
            return res.errorResponse('Database not connected', { type: 'database_connection' }, 500);
        }

        // Check if any programs exist first
        const programCountResult = await pool.request()
            .execute('usp_GetSystemStatistics');
        
        const hasPrograms = programCountResult.recordset[0].program_count > 0;
        
        if (!hasPrograms) {
            // No programs exist, allow unauthenticated access for initial setup
            return res.successResponse([], 'No programs exist - initial setup mode active');
        }

        // Programs exist, check for certificate authentication
        const clientCert = req.headers['x-arr-clientcert'];
        if (!clientCert) {
            // No certificate provided, require authentication
            return res.unauthorized('Authentication required');
        }

        // Authenticate the user first
        try {
            // Get certificate from header or use development fallback
            const certSubject = extractCertificateSubject(clientCert);
            
            // Use stored procedure for secure user lookup
            const userResult = await pool.request()
                .input('CertificateSubject', sql.NVarChar, certSubject)
                .execute('usp_GetUserWithProgramAccess');

            if (userResult.recordset.length === 0) {
                return res.status(401).json({ error: 'User not found or not authorized' });
            }

            const user = userResult.recordset[0];
            
            // Parse program access JSON
            user.program_access = user.program_access ? JSON.parse(user.program_access) : [];
            user.accessible_programs = user.program_access.map(p => p.program_id);
            
            // Authentication successful, proceed with stored procedure
            const result = await pool.request()
                .input('RequestingUserId', sql.Int, user.user_id)
                .input('IsSystemAdmin', sql.Bit, user.is_system_admin)
                .execute('usp_GetAllPrograms');
                
            return res.successResponse(result.recordset, 'Programs retrieved successfully');
        } catch (authError) {
            console.error('Authentication error in programs endpoint:', authError);
            return res.status(401).json({ error: 'Authentication failed' });
        }
    } catch (error) {
        console.error('Error getting programs:', error);
        return res.databaseError(error, 'retrieve programs');
    }
});

// POST create new program (conditional authentication for initial setup)
app.post('/api/programs', async (req, res) => {
    try {
        const pool = req.app.locals.db;
        if (!pool) {
            return res.errorResponse('Database not connected', { type: 'database_connection' }, 500);
        }

        // Check if any programs exist
        const programCountResult = await pool.request()
            .execute('usp_GetSystemStatistics');
        
        const hasPrograms = programCountResult.recordset[0].program_count > 0;
        
        if (hasPrograms) {
            // Programs exist, require authentication
            return authenticateUser(req, res, async () => {
                if (!req.user.is_system_admin) {
                    return res.forbidden('System Admin access required');
                }
                await createProgramLogic(req, res, pool);
            });
        } else {
            // No programs exist, allow creation for initial setup
            await createProgramLogic(req, res, pool);
        }
    } catch (error) {
        console.error('Error in create program endpoint:', error);
        return res.databaseError(error, 'process program creation request');
    }
});

// POST grant program access to user (System Admin only)
app.post('/api/programs/:programId/access', authenticateUser, async (req, res) => {
    if (!req.user.is_system_admin) {
        return res.forbidden('System Admin access required');
    }
    
    const { user_id, access_level } = req.body;
    const params = [
        { name: 'UserId', type: sql.Int, value: user_id },
        { name: 'ProgramId', type: sql.Int, value: req.params.programId },
        { name: 'AccessLevel', type: sql.NVarChar, value: access_level },
        { name: 'GrantedBy', type: sql.Int, value: req.user.user_id }
    ];
    await executeProcedureStandardized(res, 'usp_GrantProgramAccess', params, 'Program access granted successfully');
});

// GET users with their program access (conditional authentication for initial setup)
app.get('/api/users', async (req, res) => {
    try {
        const pool = req.app.locals.db;
        if (!pool) {
            return res.errorResponse('Database not connected', { type: 'database_connection' }, 500);
        }

        // Check if any system admins exist
        const adminCheckResult = await pool.request()
            .execute('usp_GetSystemStatistics');
        
        const hasAdmins = adminCheckResult.recordset[0].admin_count > 0;
        
        if (hasAdmins) {
            // Admins exist, require authentication
            return authenticateUser(req, res, async () => {
                if (!req.user.is_system_admin) {
                    return res.forbidden('System Admin access required');
                }
                await getUsersLogic(req, res, pool);
            });
        } else {
            // No admins exist, allow unauthenticated access for setup check
            await getUsersLogic(req, res, pool);
        }
    } catch (error) {
        console.error('Error in users endpoint:', error);
        
        // Report this error to GitHub
        await githubErrorReporting.reportAPIError(error, req, {
            endpoint: '/api/users',
            errorLocation: 'outer_catch_block'
        });
        
        return res.databaseError(error, 'fetch users');
    }
});

// =============================================================================
// PROJECT ENDPOINTS (WITH PROGRAM FILTERING)
// =============================================================================

// GET projects (filtered by user's program access)
app.get('/api/projects', authenticateUser, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        // Determine program filter for non-admin users
        let programId = null;
        if (req.query.program_id) {
            programId = parseInt(req.query.program_id);
        }

        const result = await pool.request()
            .input('RequestingUserId', sql.Int, req.user.user_id)
            .input('IsSystemAdmin', sql.Bit, req.user.is_system_admin)
            .input('ProgramFilter', sql.Int, programId)
            .execute('usp_GetProjects');
            
        // Filter by accessible programs for non-admin users if no specific program requested
        let projects = result.recordset;
        if (!req.user.is_system_admin && !req.query.program_id && req.user.accessible_programs.length > 0) {
            projects = projects.filter(project => req.user.accessible_programs.includes(project.program_id));
        }
        
        // Return projects data directly (not wrapped in standardized response format)
        // This endpoint needs to maintain compatibility with frontend expectations
        return res.json(projects);
    } catch (error) {
        console.error('Error in /api/projects:', error);
        
        // Report this error to GitHub
        await githubErrorReporting.reportAPIError(error, req, {
            endpoint: '/api/projects',
            errorLocation: 'get_projects_endpoint',
            programFilter: req.query.program_id,
            userRole: req.user.is_system_admin ? 'admin' : 'user'
        });
        
        return res.status(500).json({ error: 'Failed to retrieve projects' });
    }
});

// GET a single project by ID (with program access check)
app.get('/api/projects/:id', authenticateUser, async (req, res) => {
    try {
        // Validate project ID parameter
        const projectIdParam = req.params.id;
        
        // Check for malformed URL parameters (like :12 instead of 12)
        if (typeof projectIdParam === 'string' && projectIdParam.startsWith(':')) {
            return res.status(400).json({ 
                error: 'Invalid project ID format. Expected numeric ID, received route parameter placeholder.',
                received: projectIdParam,
                expected: 'numeric value (e.g., 12)',
                help: 'Use /api/projects/12 instead of /api/projects/:12'
            });
        }
        
        const projectId = parseInt(projectIdParam);
        
        // Validate that the parsed ID is a valid number
        if (isNaN(projectId) || projectId <= 0) {
            return res.status(400).json({ 
                error: 'Invalid project ID. Must be a positive integer.',
                received: projectIdParam,
                parsed: projectId
            });
        }
        
        const projectDetailsJson = JSON.stringify({
            project_id: projectId
        });
        
        const pool = req.app.locals.db;
        const request = pool.request();
        request.input('ProjectDetailsJson', sql.NVarChar, projectDetailsJson);
        
        const result = await request.execute('usp_GetProjectDetails');
        
        if (result.recordset.length === 0) {
            return res.notFound('Project');
        }
        
        const project = result.recordset[0];
        
        // Check program access for non-admin users
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(project.program_id)) {
            return res.forbidden('Access denied to this project');
        }
        
        return res.successResponse(project, 'Project details retrieved successfully');
    } catch (error) {
        console.error('Error getting project:', error);
        
        // Report this error to GitHub
        await githubErrorReporting.reportAPIError(error, req, {
            endpoint: '/api/projects/:id',
            errorLocation: 'get_project_by_id_endpoint',
            projectId: req.params.id,
            userRole: req.user.is_system_admin ? 'admin' : 'user'
        });
        
        return res.databaseError(error, 'retrieve project details');
    }
});

// GET project steps by project ID
app.get('/api/projects/:id/steps', authenticateUser, async (req, res) => {
    try {
        const projectId = req.params.id;
        
        // First verify the project exists and user has access to it using secure procedure
        const projectAccessJson = JSON.stringify({
            project_id: parseInt(projectId)
        });
        
        const pool = req.app.locals.db;
        const projectRequest = pool.request();
        projectRequest.input('ProjectAccessJson', sql.NVarChar, projectAccessJson);
        
        const projectResult = await projectRequest.execute('usp_GetProjectForAccess');
        
        if (projectResult.recordset.length === 0) {
            return res.notFound('Project');
        }
        
        const project = projectResult.recordset[0];
        
        // Check program access for non-admin users
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(project.program_id)) {
            return res.forbidden('Access denied to this project');
        }
        
        // Get project steps using the stored procedure
        const stepsRequest = pool.request();
        stepsRequest.input('project_id', sql.Int, projectId);
        
        const stepsResult = await stepsRequest.execute('usp_GetProjectStepsByProjectId');
        
        // Return the steps in the format expected by the frontend
        // Even if no steps are found, return an empty array instead of 404
        const responseData = {
            data: stepsResult.recordset || [],
            project_id: projectId,
            project_name: project.project_name
        };
        
        return res.successResponse(responseData, 'Project steps retrieved successfully');
    } catch (error) {
        console.error('Error getting project steps:', error);
        return res.databaseError(error, 'retrieve project steps');
    }
});

// GET tracked items for a project
app.get('/api/projects/:id/tracked-items', authenticateUser, async (req, res) => {
    try {
        const projectId = req.params.id;
        
        // First verify the project exists and user has access to it using secure procedure
        const projectAccessJson = JSON.stringify({
            project_id: parseInt(projectId)
        });
        
        const pool = req.app.locals.db;
        const projectRequest = pool.request();
        projectRequest.input('ProjectAccessJson', sql.NVarChar, projectAccessJson);
        
        const projectResult = await projectRequest.execute('usp_GetProjectForAccess');
        
        if (projectResult.recordset.length === 0) {
            return res.notFound('Project');
        }
        
        const project = projectResult.recordset[0];
        
        // Check program access for non-admin users
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(project.program_id)) {
            return res.forbidden('Access denied to this project');
        }
        
        // Get tracked items using secure stored procedure
        const trackedItemsJson = JSON.stringify({
            project_id: parseInt(projectId)
        });
        
        const trackedItemsRequest = pool.request();
        trackedItemsRequest.input('TrackedItemsJson', sql.NVarChar, trackedItemsJson);
        
        const trackedItemsResult = await trackedItemsRequest.execute('usp_GetTrackedItems');
        
        // Transform the data to parse the JSON step progress
        const transformedItems = trackedItemsResult.recordset.map(item => {
            let step_statuses = [];
            if (item.step_progress) {
                try {
                    step_statuses = JSON.parse(item.step_progress);
                } catch (error) {
                    console.error('Error parsing step progress JSON:', error);
                    step_statuses = [];
                }
            }
            
            // Remove the JSON field and add the parsed step_statuses
            const { step_progress, ...itemWithoutJson } = item;
            return {
                ...itemWithoutJson,
                step_statuses: step_statuses
            };
        });
        
        // Return the tracked items in the format expected by the frontend
        return res.successResponse({ data: transformedItems }, 'Tracked items retrieved successfully');
    } catch (error) {
        console.error('Error getting tracked items:', error);
        return res.databaseError(error, 'retrieve tracked items');
    }
});

// GET project attributes by project ID
app.get('/api/projects/:id/attributes', authenticateUser, async (req, res) => {
    try {
        const projectId = req.params.id;
        
        // First verify the project exists and user has access to it using secure procedure
        const projectAccessJson = JSON.stringify({
            project_id: parseInt(projectId)
        });
        
        const pool = req.app.locals.db;
        const projectRequest = pool.request();
        projectRequest.input('ProjectAccessJson', sql.NVarChar, projectAccessJson);
        
        const projectResult = await projectRequest.execute('usp_GetProjectForAccess');
        
        if (projectResult.recordset.length === 0) {
            return res.notFound('Project');
        }
        
        const project = projectResult.recordset[0];
        
        // Check program access for non-admin users
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(project.program_id)) {
            return res.forbidden('Access denied to this project');
        }
        
        // Get project attributes using secure stored procedure
        const attributesJson = JSON.stringify({
            project_id: parseInt(projectId)
        });
        
        const attributesRequest = pool.request();
        attributesRequest.input('AttributesJson', sql.NVarChar, attributesJson);
        
        const attributesResult = await attributesRequest.execute('usp_GetProjectAttributes');
        
        // Return the attributes in the format expected by the frontend
        return res.successResponse(attributesResult.recordset || [], 'Project attributes retrieved successfully');
    } catch (error) {
        console.error('Error getting project attributes:', error);
        return res.databaseError(error, 'retrieve project attributes');
    }
});

// POST (Create) a new attribute definition
app.post('/api/attributes', authenticateUser, async (req, res) => {
    try {
        const {
            project_id,
            attribute_name,
            attribute_type,
            is_required,
            is_auto_generated,
            display_order,
            default_value,
            validation_rules
        } = req.body;
        
        // Validate required fields
        if (!project_id || !attribute_name) {
            return res.validationError('Missing required fields: project_id, attribute_name');
        }
        
        // Use secure stored procedure for attribute definition creation
        const attributeJson = JSON.stringify({
            project_id: parseInt(project_id),
            attribute_name: attribute_name,
            attribute_type: attribute_type || 'text',
            is_required: is_required || false,
            is_auto_generated: is_auto_generated || false,
            display_order: display_order || null,
            default_value: default_value || null,
            validation_rules: validation_rules || null
        });
        
        const pool = req.app.locals.db;
        const request = pool.request();
        request.input('AttributeJson', sql.NVarChar, attributeJson);
        
        const result = await request.execute('usp_CreateProjectAttribute');
        
        if (result.recordset.length === 0) {
            return res.errorResponse('Failed to create attribute definition', { type: 'creation_failed' }, 500);
        }
        
        // Return the created attribute definition
        return res.successResponse(result.recordset[0], 'Attribute definition created successfully');
    } catch (error) {
        console.error('Error creating attribute definition:', error);
        return res.databaseError(error, 'create attribute definition');
    }
});

// POST (Create) a new project (with program access validation)
app.post('/api/projects', authenticateUser, checkProgramAccess('Write'), async (req, res) => {
    // Ensure the project is created in the validated program
    req.body.program_id = req.programId;
    req.body.created_by = req.user.user_id;
    
    const params = [{ name: 'ProjectJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
    await executeProcedureStandardized(res, 'usp_SaveProject', params, 'Project created successfully');
});

// PUT (Update) an existing project (with program access validation)
app.put('/api/projects/:id', authenticateUser, async (req, res) => {
    try {
        // First, verify user has access to this project's program and get existing project data
        const pool = req.app.locals.db;
        const checkResult = await pool.request()
            .input('ProjectId', sql.Int, req.params.id)
            .execute('usp_GetProjectForValidation');
            
        if (checkResult.recordset.length === 0) {
            return res.notFound('Project');
        }
        
        const existingProject = checkResult.recordset[0];
        const projectProgramId = existingProject.program_id;
        const originalCreatedBy = existingProject.created_by;
        
        // Check program access
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(projectProgramId)) {
            return res.forbidden('Access denied to this project');
        }
        
        // Check write access level
        if (!req.user.is_system_admin) {
            const programAccess = req.user.program_access.find(p => p.program_id === projectProgramId);
            if (!programAccess || programAccess.access_level === 'Read') {
                return res.forbidden('Write access required to update projects');
            }
        }
        
        req.body.project_id = parseInt(req.params.id, 10);
        req.body.program_id = parseInt(projectProgramId, 10); // Ensure program_id is integer
        req.body.created_by = parseInt(originalCreatedBy, 10); // Ensure created_by is integer
        
        // Ensure required fields are present (fallback to existing values if not provided)
        if (!req.body.project_name) {
            req.body.project_name = existingProject.project_name;
        }
        if (!req.body.project_description) {
            req.body.project_description = existingProject.project_description;
        }
        
        console.log('=== PROJECT UPDATE DEBUG ===');
        console.log('Request body before sending to stored procedure:', JSON.stringify(req.body, null, 2));
        
        const params = [{ name: 'ProjectJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
        await executeProcedureStandardized(res, 'usp_SaveProject', params, 'Project updated successfully');
    } catch (error) {
        console.error('Error updating project:', error);
        return res.databaseError(error, 'update project');
    }
});

// DELETE project (with proper authorization and cascade handling)
app.delete('/api/projects/:id', authenticateUser, async (req, res) => {
    try {
        const projectId = parseInt(req.params.id);
        
        // First, verify the project exists and check user permissions
        const projectCheck = await new sql.Request(app.locals.db)
            .input('ProjectId', sql.Int, projectId)
            .execute('usp_GetProjectForValidation');
        
        if (projectCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        const project = projectCheck.recordset[0];
        
        // Check if user has write access to this program
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(project.program_id)) {
            return res.status(403).json({ error: 'Access denied to this program' });
        }
        
        // Check if user has write permissions for this program
        const programAccess = req.user.program_access.find(p => p.program_id === project.program_id);
        if (!req.user.is_system_admin && (!programAccess || !['Write', 'Admin'].includes(programAccess.access_level))) {
            return res.status(403).json({ error: 'Write access required to delete projects' });
        }
        
        // Build JSON parameter for stored procedure
        const projectJson = {
            project_id: projectId,
            program_id: project.program_id,
            deleted_by: req.user.user_id
        };
        
        console.log('Deleting project with data:', JSON.stringify(projectJson, null, 2));
        
        // Execute the secure stored procedure
        const pool = req.app.locals.db;
        const request = pool.request();
        request.input('ProjectJson', sql.NVarChar, JSON.stringify(projectJson));
        
        const result = await request.execute('usp_DeleteProject');
        
        // Return the result from the stored procedure
        if (result.recordset && result.recordset.length > 0) {
            const deletionResult = result.recordset[0];
            
            if (deletionResult.status === 'SUCCESS') {
                console.log(`✅ ${deletionResult.message} by user ${req.user.user_id}`);
                res.json({
                    success: true,
                    message: deletionResult.message,
                    project_id: deletionResult.project_id,
                    deleted_tasks: deletionResult.deleted_tasks,
                    deleted_steps: deletionResult.deleted_steps,
                    deleted_tracked_items: deletionResult.deleted_tracked_items,
                    deleted_attributes: deletionResult.deleted_attributes,
                    deleted_pending_orders: deletionResult.deleted_pending_orders
                });
            } else {
                console.log(`❌ ${deletionResult.message} for user ${req.user.user_id}`);
                res.status(400).json({ error: deletionResult.message });
            }
        } else {
            res.status(500).json({ error: 'Failed to delete project - no result returned' });
        }
        
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// =============================================================================
// PROJECT STEPS ENDPOINTS
// =============================================================================

// POST (Create) a new project step (with program access validation)
app.post('/api/steps', authenticateUser, async (req, res) => {
    try {
        console.log('Creating project step:', req.body);
        
        // Verify user has access to the project's program
        const pool = req.app.locals.db;
        const projectCheck = await pool.request()
            .input('ProjectId', sql.Int, req.body.project_id)
            .execute('usp_GetProjectForValidation');
            
        if (projectCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        const projectProgramId = projectCheck.recordset[0].program_id;
        
        // Check program access
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(projectProgramId)) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }
        
        // Check write access level
        if (!req.user.is_system_admin) {
            const programAccess = req.user.program_access.find(p => p.program_id === projectProgramId);
            if (!programAccess || programAccess.access_level === 'Read') {
                return res.status(403).json({ error: 'Write access required to create project steps' });
            }
        }
        
        // Set program_id for the step
        req.body.program_id = projectProgramId;
        
        console.log('Creating project step with data:', JSON.stringify(req.body, null, 2));
        
        const params = [{ name: 'StepJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
        await executeProcedure(res, 'usp_SaveProjectStep', params);
    } catch (error) {
        console.error('Error creating project step:', error);
        res.status(500).json({ error: 'Failed to create project step' });
    }
});

// PUT (Update) an existing project step (with program access validation)
app.put('/api/steps/:id', authenticateUser, async (req, res) => {
    try {
        console.log('Updating project step:', req.params.id, req.body);
        
        // Verify user has access to the project's program using secure stored procedure
        const pool = req.app.locals.db;
        const stepValidationJson = JSON.stringify({
            step_id: parseInt(req.params.id)
        });
        
        const stepCheckRequest = pool.request();
        stepCheckRequest.input('StepValidationJson', sql.NVarChar, stepValidationJson);
        
        const stepCheckResult = await stepCheckRequest.execute('usp_GetProjectStepForValidation');
            
        if (stepCheckResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Project step not found' });
        }
        
        const stepData = stepCheckResult.recordset[0];
        const projectProgramId = stepData.program_id;
        
        // Check program access
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(projectProgramId)) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }
        
        // Check write access level
        if (!req.user.is_system_admin) {
            const programAccess = req.user.program_access.find(p => p.program_id === projectProgramId);
            if (!programAccess || programAccess.access_level === 'Read') {
                return res.status(403).json({ error: 'Write access required to update project steps' });
            }
        }
        
        // Set the step_id, project_id, and program_id
        req.body.step_id = parseInt(req.params.id, 10);
        req.body.project_id = stepData.project_id;
        req.body.program_id = projectProgramId;
        
        console.log('Updating project step with data:', JSON.stringify(req.body, null, 2));
        
        const params = [{ name: 'StepJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
        await executeProcedure(res, 'usp_SaveProjectStep', params);
    } catch (error) {
        console.error('Error updating project step:', error);
        res.status(500).json({ error: 'Failed to update project step' });
    }
});

// DELETE project step (with proper authorization)
app.delete('/api/steps/:id', authenticateUser, async (req, res) => {
    try {
        const stepId = parseInt(req.params.id);
        
        // Get step information using secure stored procedure
        const stepValidationJson = JSON.stringify({
            step_id: stepId
        });
        
        const stepCheckRequest = new sql.Request(app.locals.db);
        stepCheckRequest.input('StepValidationJson', sql.NVarChar, stepValidationJson);
        
        const stepCheckResult = await stepCheckRequest.execute('usp_GetProjectStepForValidation');
        
        if (stepCheckResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Project step not found' });
        }
        
        const step = stepCheckResult.recordset[0];
        
        // Check if user has write access to this program
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(step.program_id)) {
            return res.status(403).json({ error: 'Access denied to this program' });
        }
        
        // Check if user has write permissions for this program
        const programAccess = req.user.program_access.find(p => p.program_id === step.program_id);
        if (!req.user.is_system_admin && (!programAccess || !['Write', 'Admin'].includes(programAccess.access_level))) {
            return res.status(403).json({ error: 'Write access required to delete project steps' });
        }
        
        // Delete the project step using secure stored procedure
        const stepDeleteJson = JSON.stringify({
            step_id: stepId,
            program_id: step.program_id,
            deleted_by: req.user.user_id
        });
        
        const deleteRequest = new sql.Request(app.locals.db);
        deleteRequest.input('StepDeleteJson', sql.NVarChar, stepDeleteJson);
        
        const deleteResult = await deleteRequest.execute('usp_DeleteProjectStep');
        
        if (deleteResult.recordset && deleteResult.recordset.length > 0) {
            const deletionResult = deleteResult.recordset[0];
            console.log(`✅ ${deletionResult.message} by user ${req.user.user_id}`);
            res.json(deletionResult);
        } else {
            res.status(500).json({ error: 'Failed to delete project step - no result returned' });
        }
        
    } catch (error) {
        console.error('Error deleting project step:', error);
        res.status(500).json({ error: 'Failed to delete project step' });
    }
});

// =============================================================================
// STEP INVENTORY REQUIREMENTS ENDPOINTS
// =============================================================================

// POST (Create) a new step inventory requirement
app.post('/api/inventory-requirements', authenticateUser, async (req, res) => {
    try {
        console.log('Creating step inventory requirement:', req.body);
        
        // Verify user has access to the step's project's program using secure stored procedure
        const pool = req.app.locals.db;
        const stepValidationJson = JSON.stringify({
            step_id: parseInt(req.body.step_id)
        });
        
        const stepCheckRequest = pool.request();
        stepCheckRequest.input('StepValidationJson', sql.NVarChar, stepValidationJson);
        
        const stepCheckResult = await stepCheckRequest.execute('usp_GetProjectStepForValidation');
            
        if (stepCheckResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Project step not found' });
        }
        
        const stepData = stepCheckResult.recordset[0];
        const projectProgramId = stepData.program_id;
        
        // Check program access
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(projectProgramId)) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }
        
        // Check write access level
        if (!req.user.is_system_admin) {
            const programAccess = req.user.program_access.find(p => p.program_id === projectProgramId);
            if (!programAccess || programAccess.access_level === 'Read') {
                return res.status(403).json({ error: 'Write access required to create inventory requirements' });
            }
        }
        
        console.log('Creating inventory requirement with data:', JSON.stringify(req.body, null, 2));
        
        const params = [{ name: 'RequirementJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
        await executeProcedure(res, 'usp_SaveStepInventoryRequirement', params);
    } catch (error) {
        console.error('Error creating step inventory requirement:', error);
        res.status(500).json({ error: 'Failed to create step inventory requirement' });
    }
});

// PUT (Update) an existing step inventory requirement
app.put('/api/inventory-requirements/:id', authenticateUser, async (req, res) => {
    try {
        console.log('Updating step inventory requirement:', req.params.id, req.body);
        
        // Verify user has access to the step's project's program using secure stored procedure
        const pool = req.app.locals.db;
        const requirementValidationJson = JSON.stringify({
            requirement_id: parseInt(req.params.id)
        });
        
        const reqCheckRequest = pool.request();
        reqCheckRequest.input('RequirementValidationJson', sql.NVarChar, requirementValidationJson);
        
        const reqCheckResult = await reqCheckRequest.execute('usp_GetStepInventoryRequirementForValidation');
            
        if (reqCheckResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Step inventory requirement not found' });
        }
        
        const reqData = reqCheckResult.recordset[0];
        const projectProgramId = reqData.program_id;
        
        // Check program access
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(projectProgramId)) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }
        
        // Check write access level
        if (!req.user.is_system_admin) {
            const programAccess = req.user.program_access.find(p => p.program_id === projectProgramId);
            if (!programAccess || programAccess.access_level === 'Read') {
                return res.status(403).json({ error: 'Write access required to update inventory requirements' });
            }
        }
        
        // Set the requirement_id and step_id
        req.body.requirement_id = parseInt(req.params.id, 10);
        req.body.step_id = reqData.step_id;
        
        console.log('Updating inventory requirement with data:', JSON.stringify(req.body, null, 2));
        
        const params = [{ name: 'RequirementJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
        await executeProcedure(res, 'usp_SaveStepInventoryRequirement', params);
    } catch (error) {
        console.error('Error updating step inventory requirement:', error);
        res.status(500).json({ error: 'Failed to update step inventory requirement' });
    }
});

// DELETE step inventory requirement
app.delete('/api/inventory-requirements/:id', authenticateUser, async (req, res) => {
    try {
        const requirementId = parseInt(req.params.id);
        
        // Get requirement information using secure stored procedure
        const requirementValidationJson = JSON.stringify({
            requirement_id: requirementId
        });
        
        const reqCheckRequest = new sql.Request(app.locals.db);
        reqCheckRequest.input('RequirementValidationJson', sql.NVarChar, requirementValidationJson);
        
        const reqCheckResult = await reqCheckRequest.execute('usp_GetStepInventoryRequirementForValidation');
        
        if (reqCheckResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Step inventory requirement not found' });
        }
        
        const requirement = reqCheckResult.recordset[0];
        
        // Check if user has write access to this program
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(requirement.program_id)) {
            return res.status(403).json({ error: 'Access denied to this program' });
        }
        
        // Check if user has write permissions for this program
        const programAccess = req.user.program_access.find(p => p.program_id === requirement.program_id);
        if (!req.user.is_system_admin && (!programAccess || !['Write', 'Admin'].includes(programAccess.access_level))) {
            return res.status(403).json({ error: 'Write access required to delete inventory requirements' });
        }
        
        // Delete the requirement using secure stored procedure
        const requirementDeleteJson = JSON.stringify({
            requirement_id: requirementId,
            program_id: requirement.program_id,
            deleted_by: req.user.user_id
        });
        
        const deleteRequest = new sql.Request(app.locals.db);
        deleteRequest.input('RequirementDeleteJson', sql.NVarChar, requirementDeleteJson);
        
        const deleteResult = await deleteRequest.execute('usp_DeleteStepInventoryRequirement');
        
        if (deleteResult.recordset && deleteResult.recordset.length > 0) {
            const deletionResult = deleteResult.recordset[0];
            console.log(`✅ ${deletionResult.message} by user ${req.user.user_id}`);
            res.json(deletionResult);
        } else {
            res.status(500).json({ error: 'Failed to delete step inventory requirement - no result returned' });
        }
        
    } catch (error) {
        console.error('Error deleting step inventory requirement:', error);
        res.status(500).json({ error: 'Failed to delete step inventory requirement' });
    }
});

// =============================================================================
// TASK ENDPOINTS (WITH PROGRAM FILTERING)
// =============================================================================

// GET tasks (filtered by user's program access)
app.get('/api/tasks', authenticateUser, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        // Determine program filter for non-admin users
        let programId = null;
        if (req.query.program_id) {
            programId = parseInt(req.query.program_id);
        } else if (!req.user.is_system_admin && req.user.accessible_programs.length > 0) {
            // For non-admin users, if no specific program requested, get all their accessible tasks
            programId = null; // We'll handle multiple programs in the procedure
        }

        // Determine user filter
        let userId = null;
        if (req.query.assigned_to_me === 'true') {
            userId = req.user.user_id;
        }

        // Determine project filter
        let projectId = null;
        if (req.query.project_id) {
            projectId = parseInt(req.query.project_id);
        }

        const result = await pool.request()
            .input('ProgramId', sql.Int, programId)
            .input('UserId', sql.Int, userId)
            .input('ProjectId', sql.Int, projectId)
            .input('IsSystemAdmin', sql.Bit, req.user.is_system_admin)
            .execute('usp_GetTasks');
            
        // Filter by accessible programs for non-admin users if no specific program requested
        let tasks = result.recordset;
        if (!req.user.is_system_admin && !req.query.program_id && req.user.accessible_programs.length > 0) {
            tasks = tasks.filter(task => req.user.accessible_programs.includes(task.program_id));
        }
        res.json(tasks);
    } catch (error) {
        console.error('Error getting tasks:', error);
        res.status(500).json({ error: 'Failed to get tasks' });
    }
});

// POST create new task (with program validation)
app.post('/api/tasks', authenticateUser, checkProgramAccess('Write'), async (req, res) => {
    req.body.program_id = req.programId;
    req.body.assigned_by = req.user.user_id;
    
    const params = [{ name: 'TaskJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
    await executeProcedure(res, 'usp_SaveTask', params);
});

// =============================================================================
// INVENTORY ENDPOINTS (WITH PROGRAM FILTERING)
// =============================================================================

// GET inventory items (filtered by user's program access)
app.get('/api/inventory-items', authenticateUser, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        // Determine program filter for non-admin users
        let programId = null;
        if (!req.user.is_system_admin && req.user.accessible_programs.length > 0) {
            programId = req.user.accessible_programs[0]; // Default to first accessible program
        }

        const result = await pool.request()
            .input('ProgramId', sql.Int, programId)
            .input('IsSystemAdmin', sql.Bit, req.user.is_system_admin)
            .execute('usp_GetInventoryItems');
            
        let items = result.recordset;
        
        // Add any additional filters
        if (req.query.category) {
            items = items.filter(item => item.category === req.query.category);
        }
        
        if (req.query.low_stock) {
            items = items.filter(item => item.current_stock_level <= (item.reorder_point || 0));
        }
        
        res.json(items);
    } catch (error) {
        console.error('Error getting inventory items:', error);
        res.status(500).json({ error: 'Failed to get inventory items' });
    }
});

// POST create new inventory item (with program validation)
app.post('/api/inventory-items', authenticateUser, async (req, res) => {
    try {
        console.log('=== INVENTORY ITEM CREATE REQUEST ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('User info:', { user_id: req.user?.user_id, program_access: req.user?.program_access });
        
        // Get user's default program (using the first one for now)
        const userProgram = req.user.program_access && req.user.program_access.length > 0 
            ? req.user.program_access[0].program_id 
            : 1; // Default to program_id 1 if no program access
        
        console.log('Using program_id:', userProgram);
        
        // Build the JSON object for the stored procedure
        const inventoryItemJson = {
            inventory_item_id: null, // For new items
            item_name: req.body.item_name,
            part_number: req.body.part_number,
            description: req.body.description,
            category: req.body.category,
            unit_of_measure: req.body.unit_of_measure,
            current_stock_level: req.body.current_stock_level || 0,
            reorder_point: req.body.reorder_point,
            max_stock_level: req.body.max_stock_level,
            supplier_info: req.body.supplier_info,
            cost_per_unit: req.body.cost_per_unit,
            location: req.body.location,
            program_id: userProgram,
            created_by: req.user.user_id
        };
        
        console.log('Sending to stored procedure:', JSON.stringify(inventoryItemJson, null, 2));
        
        // Execute the stored procedure directly instead of using executeProcedure
        const pool = req.app.locals.db;
        const request = pool.request();
        request.input('InventoryItemJson', sql.NVarChar, JSON.stringify(inventoryItemJson));
        
        const result = await request.execute('usp_SaveInventoryItem');
        console.log('Procedure result:', result);
        
        // Return the created inventory item
        if (result.recordset && result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(500).json({ error: 'Failed to create inventory item - no result returned' });
        }
        
    } catch (error) {
        console.error('Error creating inventory item:', error);
        res.status(500).json({ error: 'Failed to create inventory item' });
    }
});

// DELETE inventory item (with proper authorization)
app.delete('/api/inventory-items/:id', authenticateUser, async (req, res) => {
    try {
        const inventoryItemId = parseInt(req.params.id);
        
        // Get user's program access for multi-tenant validation
        const userProgram = req.user.program_access && req.user.program_access.length > 0 
            ? req.user.program_access[0].program_id 
            : null;
        
        if (!userProgram && !req.user.is_system_admin) {
            return res.status(403).json({ error: 'No program access available' });
        }
        
        // Build JSON parameter for stored procedure
        const inventoryItemJson = {
            inventory_item_id: inventoryItemId,
            program_id: userProgram,
            deleted_by: req.user.user_id
        };
        
        console.log('Deleting inventory item with data:', JSON.stringify(inventoryItemJson, null, 2));
        
        // Execute the stored procedure
        const pool = req.app.locals.db;
        const request = pool.request();
        request.input('InventoryItemJson', sql.NVarChar, JSON.stringify(inventoryItemJson));
        
        const result = await request.execute('usp_DeleteInventoryItem');
        
        // Return the result from the stored procedure
        if (result.recordset && result.recordset.length > 0) {
            const deletionResult = result.recordset[0];
            console.log(`✅ ${deletionResult.message} by user ${req.user.user_id}`);
            res.json(deletionResult);
        } else {
            res.status(500).json({ error: 'Failed to delete inventory item - no result returned' });
        }
        
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        res.status(500).json({ error: 'Failed to delete inventory item' });
    }
});

// =============================================================================
// NOTIFICATION ENDPOINTS
// =============================================================================

// GET user notifications
app.get('/api/notifications', authenticateUser, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        const result = await pool.request()
            .input('UserId', sql.Int, req.user.user_id)
            .input('IsSystemAdmin', sql.Bit, req.user.is_system_admin)
            .execute('usp_GetNotifications');
            
        // Filter out expired notifications
        const notifications = result.recordset.filter(notification => 
            !notification.expires_at || notification.expires_at > new Date()
        );
        
        res.json(notifications);
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
});

// PUT mark notification as read
app.put('/api/notifications/:id/read', authenticateUser, async (req, res) => {
    try {
        const notificationUpdateJson = JSON.stringify({
            notification_id: parseInt(req.params.id),
            user_id: req.user.user_id
        });
        
        const pool = req.app.locals.db;
        const request = pool.request();
        request.input('NotificationUpdateJson', sql.NVarChar, notificationUpdateJson);
        
        const result = await request.execute('usp_UpdateNotificationSecure');
        
        if (result.recordset && result.recordset.length > 0) {
            const updateResult = result.recordset[0];
            res.json({ message: updateResult.message });
        } else {
            res.status(500).json({ error: 'Failed to update notification' });
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// =============================================================================
// VIEWS API ENDPOINTS (DATABASE VIEWS)
// =============================================================================

// Helper function to execute views with authentication and program filtering
const executeView = async (req, res, viewName) => {
    try {
        const pool = req.app.locals.db;
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        // Build query to select from view
        let query = `SELECT * FROM [dbo].[${viewName}]`;
        const params = [];

        // Add program filtering for non-admin users if the view has program context
        const programFilterableViews = ['v_Projects_Summary', 'v_Tasks_Summary', 'v_User_Access_Summary'];
        if (!req.user.is_system_admin && programFilterableViews.includes(viewName)) {
            if (req.user.accessible_programs.length > 0) {
                query += ` WHERE program_id IN (${req.user.accessible_programs.join(',')})`;
            } else {
                // User has no program access, return empty result
                return res.json([]);
            }
        }

        query += ` ORDER BY 1`; // Order by first column

        const request = pool.request();
        params.forEach(param => {
            request.input(param.name, param.type, param.value);
        });

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        console.error(`Error executing view ${viewName}:`, error);
        res.status(500).json({ error: `Failed to execute view: ${viewName}` });
    }
};

// GET Projects Summary View
app.get('/api/views/projects-summary', authenticateUser, (req, res) => {
    executeView(req, res, 'v_Projects_Summary');
});

// GET User Access Summary View  
app.get('/api/views/user-access-summary', authenticateUser, (req, res) => {
    executeView(req, res, 'v_User_Access_Summary');
});

// GET Tasks Summary View
app.get('/api/views/tasks-summary', authenticateUser, (req, res) => {
    executeView(req, res, 'v_Tasks_Summary');
});

// GET Inventory Stock Status View
app.get('/api/views/inventory-stock-status', authenticateUser, (req, res) => {
    executeView(req, res, 'v_InventoryItems_StockStatus');
});

// GET Notifications Summary View
app.get('/api/views/notifications-summary', authenticateUser, (req, res) => {
    executeView(req, res, 'v_Notifications_Summary');
});

// =============================================================================
// HEALTH CHECK ENDPOINTS
// =============================================================================

// Health check endpoints
// -----------------------------------------------------------------------------
// DEBUG CONTROL & HEALTH MONITORING ENDPOINTS
// -----------------------------------------------------------------------------

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        system: 'H10CM Multi-Tenant API',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Serve OpenAPI/Swagger specification
app.get('/api/swagger.yaml', (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const swaggerPath = path.join(__dirname, 'swagger.yaml');
        
        if (fs.existsSync(swaggerPath)) {
            const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
            res.set('Content-Type', 'application/x-yaml');
            res.send(swaggerContent);
        } else {
            res.status(404).json({ error: 'Swagger specification not found' });
        }
    } catch (error) {
        console.error('Error serving swagger spec:', error);
        res.status(500).json({ error: 'Failed to serve swagger specification' });
    }
});

app.get('/api/health/db', async (req, res) => {
    try {
        const pool = app.locals.db;
        if (pool && pool.connected) {
            // Test database connection with a simple query
            await pool.request().query('SELECT 1 as test');
            res.status(200).json({
                database: 'connected',
                database_name: 'H10CM',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(503).json({
                database: 'disconnected',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        res.status(503).json({
            database: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// =============================================================================
// SYSTEM SETUP ENDPOINTS (ADMIN ONLY)
// =============================================================================

// POST create user (System Admin only - for initial setup)
app.post('/api/admin/create-user', async (req, res) => {
    try {
        const pool = req.app.locals.db;
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        // For initial setup, check if any system admin exists
        const adminCheckResult = await pool.request()
            .execute('usp_GetSystemStatistics');
        
        const hasAdmins = adminCheckResult.recordset[0].admin_count > 0;
        
        // If admins exist, require authentication
        if (hasAdmins) {
            // Run authentication middleware
            return authenticateUser(req, res, async () => {
                if (!req.user.is_system_admin) {
                    return res.status(403).json({ error: 'System Admin access required' });
                }
                await createUserLogic(req, res, pool);
            });
        } else {
            // No admins exist, allow creation for initial setup
            await createUserLogic(req, res, pool);
        }
    } catch (error) {
        console.error('Error in create user endpoint:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// Helper function for user creation logic
const createUserLogic = async (req, res, pool) => {
    const { 
        user_name, 
        display_name, 
        email, 
        certificate_subject, 
        is_system_admin = false 
    } = req.body;

    try {
        // Insert user into database
        const insertUserQuery = `
            INSERT INTO Users (user_name, display_name, email, certificate_subject, is_system_admin, is_active, date_created)
            VALUES (@user_name, @display_name, @email, @certificate_subject, @is_system_admin, 1, GETDATE());
            SELECT SCOPE_IDENTITY() AS user_id;
        `;

        const result = await pool.request()
            .input('user_name', sql.NVarChar, user_name)
            .input('display_name', sql.NVarChar, display_name)
            .input('email', sql.NVarChar, email)
            .input('certificate_subject', sql.NVarChar, certificate_subject)
            .input('is_system_admin', sql.Bit, is_system_admin)
            .query(insertUserQuery);

        const newUserId = result.recordset[0].user_id;

        res.json({
            message: 'User created successfully',
            user_id: newUserId,
            user_name,
            display_name,
            is_system_admin
        });

    } catch (error) {
        console.error('Error creating user:', error);
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
            res.status(400).json({ error: 'User already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create user' });
        }
    }
};

// Helper function for users logic
const getUsersLogic = async (req, res, pool) => {
    try {
        // Use stored procedure for secure user retrieval
        const result = await pool.request()
            .input('RequestingUserId', sql.Int, req.user ? req.user.user_id : null)
            .input('IsSystemAdmin', sql.Bit, req.user ? req.user.is_system_admin : false)
            .execute('usp_GetAllUsers');
        
        // Return users data directly (not wrapped in standardized response format)
        // This endpoint needs to maintain compatibility with frontend expectations
        return res.json(result.recordset);
    } catch (error) {
        console.error('Error getting users:', error);
        return res.status(500).json({ error: 'Failed to retrieve users' });
    }
};

// Helper function for program creation logic
const createProgramLogic = async (req, res, pool) => {
    const { program_name, program_code, program_description, program_manager } = req.body;
    
    try {
        // Use stored procedure for secure program creation
        const result = await pool.request()
            .input('ProgramName', sql.NVarChar, program_name)
            .input('ProgramCode', sql.NVarChar, program_code)
            .input('ProgramDescription', sql.NVarChar, program_description || null)
            .input('ProgramManager', sql.Int, program_manager || null)
            .input('CreatedBy', sql.NVarChar, req.user ? req.user.user_name : 'System')
            .input('CreatedByUserId', sql.Int, req.user ? req.user.user_id : null)
            .execute('usp_CreateProgram');

        if (result.recordset && result.recordset.length > 0) {
            const data = result.recordset[0];
            return res.successResponse(data, 'Program created successfully');
        } else {
            return res.successResponse({ program_name }, 'Program created successfully');
        }
    } catch (error) {
        console.error('Error creating program:', error);
        return res.databaseError(error, 'create program');
    }
};

// GET debug settings
app.get('/api/admin/debug-settings', authenticateUser, async (req, res) => {
    try {
        if (!req.user.is_system_admin) {
            return res.status(403).json({ error: 'System Admin access required' });
        }

        const pool = req.app.locals.db;
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        // Get debug settings from database or return defaults
        const result = await pool.request()
            .query('SELECT setting_key, setting_value FROM SystemSettings WHERE setting_key LIKE \'debug_%\'');

        const debugSettings = {};
        result.recordset.forEach(row => {
            debugSettings[row.setting_key] = row.setting_value === 'true';
        });

        // Return defaults if no settings found
        const defaultSettings = {
            debug_enabled: false,
            debug_verbose_logging: false,
            debug_show_error_details: false,
            debug_show_sql_errors: false,
            debug_network_requests: false
        };

        res.json({ ...defaultSettings, ...debugSettings });
    } catch (error) {
        console.error('Error getting debug settings:', error);
        res.status(500).json({ error: 'Failed to get debug settings' });
    }
});

// POST debug settings
app.post('/api/admin/debug-settings', authenticateUser, async (req, res) => {
    try {
        if (!req.user.is_system_admin) {
            return res.status(403).json({ error: 'System Admin access required' });
        }

        const pool = req.app.locals.db;
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        const { settings } = req.body;
        
        // Validate settings
        const validSettings = [
            'debug_enabled',
            'debug_verbose_logging', 
            'debug_show_error_details',
            'debug_show_sql_errors',
            'debug_network_requests'
        ];

        for (const [key, value] of Object.entries(settings)) {
            if (!validSettings.includes(key)) {
                return res.status(400).json({ error: `Invalid setting: ${key}` });
            }
            if (typeof value !== 'boolean') {
                return res.status(400).json({ error: `Setting ${key} must be a boolean` });
            }
        }

        // Update or insert settings
        for (const [key, value] of Object.entries(settings)) {
            await pool.request()
                .input('setting_key', sql.NVarChar, key)
                .input('setting_value', sql.NVarChar, value.toString())
                .input('updated_by', sql.NVarChar, req.user.user_name)
                .query(`
                    IF EXISTS (SELECT 1 FROM SystemSettings WHERE setting_key = @setting_key)
                        UPDATE SystemSettings 
                        SET setting_value = @setting_value, updated_by = @updated_by, updated_date = GETDATE()
                        WHERE setting_key = @setting_key
                    ELSE
                        INSERT INTO SystemSettings (setting_key, setting_value, updated_by, updated_date)
                        VALUES (@setting_key, @setting_value, @updated_by, GETDATE())
                `);
        }

        res.json({ 
            message: 'Debug settings updated successfully',
            settings: settings
        });
    } catch (error) {
        console.error('Error updating debug settings:', error);
        res.status(500).json({ error: 'Failed to update debug settings' });
    }
});

// =============================================================================
// SHOPPING CART & PROCUREMENT ENDPOINTS
// =============================================================================

// GET shopping cart items for current user and project
app.get('/api/cart', authenticateUser, async (req, res) => {
    try {
        const { project_id } = req.query;
        
        // Validate project_id is provided
        if (!project_id) {
            return res.status(400).json({ error: 'project_id is required' });
        }

        const request = new sql.Request(app.locals.db);
        const result = await request
            .input('user_id', sql.Int, req.user.user_id)
            .input('project_id', sql.Int, project_id)
            .execute('usp_GetCartItems');

        const cartSummary = {
            total_items: result.recordset.length,
            total_quantity: result.recordset.reduce((sum, item) => sum + (item.quantity_requested || 0), 0),
            total_estimated_cost: result.recordset.reduce((sum, item) => sum + (item.estimated_cost || 0), 0)
        };

        res.json({
            success: true,
            items: result.recordset,
            summary: cartSummary,
            user_id: req.user.user_id,
            project_id: project_id
        });
    } catch (error) {
        console.error('Error getting cart items:', error);
        res.status(500).json({ error: 'Failed to get cart items' });
    }
});

// GET inventory item stock status (for real-time validation)
app.get('/api/inventory-items/:id/stock', authenticateUser, async (req, res) => {
    try {
        const inventory_item_id = parseInt(req.params.id);
        
        // Validate inventory_item_id
        if (isNaN(inventory_item_id) || inventory_item_id <= 0) {
            return res.validationError('Invalid inventory item ID');
        }

        const pool = req.app.locals.db;
        const request = pool.request();
        
        // Get current stock level and item details
        const stockQuery = `
            SELECT 
                i.inventory_item_id,
                i.item_name,
                i.part_number,
                i.current_stock_level,
                i.reorder_point,
                i.max_stock_level,
                i.program_id,
                CASE 
                    WHEN i.current_stock_level <= 0 THEN 'out_of_stock'
                    WHEN i.current_stock_level <= i.reorder_point THEN 'low_stock'
                    WHEN i.current_stock_level >= i.max_stock_level THEN 'overstocked'
                    ELSE 'in_stock'
                END as stock_status,
                ISNULL(pending.pending_quantity, 0) as pending_orders_quantity,
                (i.current_stock_level - ISNULL(pending.pending_quantity, 0)) as available_quantity
            FROM InventoryItems i
            LEFT JOIN (
                SELECT 
                    poi.inventory_item_id,
                    SUM(poi.quantity_ordered) as pending_quantity
                FROM PendingOrderItems poi
                JOIN PendingOrders po ON poi.order_id = po.order_id
                WHERE po.status = 'Pending'
                GROUP BY poi.inventory_item_id
            ) pending ON i.inventory_item_id = pending.inventory_item_id
            WHERE i.inventory_item_id = @inventory_item_id
        `;
        
        request.input('inventory_item_id', sql.Int, inventory_item_id);
        const result = await request.query(stockQuery);
        
        if (result.recordset.length === 0) {
            return res.notFound('Inventory item');
        }
        
        const stockInfo = result.recordset[0];
        
        // Check program access for non-admin users
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(stockInfo.program_id)) {
            return res.forbidden('Access denied to this inventory item');
        }
        
        const stockData = {
            inventory_item_id: stockInfo.inventory_item_id,
            item_name: stockInfo.item_name,
            part_number: stockInfo.part_number,
            current_stock_level: stockInfo.current_stock_level,
            pending_orders_quantity: stockInfo.pending_orders_quantity,
            available_quantity: stockInfo.available_quantity,
            stock_status: stockInfo.stock_status,
            reorder_point: stockInfo.reorder_point,
            max_stock_level: stockInfo.max_stock_level,
            can_order: stockInfo.available_quantity > 0,
            stock_message: getStockMessage(stockInfo)
        };
        
        return res.successResponse(stockData, 'Stock information retrieved successfully');
    } catch (error) {
        console.error('Error checking inventory stock:', error);
        
        // Report this error to GitHub
        await githubErrorReporting.reportAPIError(error, req, {
            endpoint: '/api/inventory-items/:id/stock',
            errorLocation: 'get_inventory_stock_endpoint',
            inventoryItemId: req.params.id,
            userRole: req.user.is_system_admin ? 'admin' : 'user'
        });
        
        return res.databaseError(error, 'check inventory stock');
    }
});

// Helper function to generate stock messages
function getStockMessage(stockInfo) {
    const available = stockInfo.available_quantity;
    const current = stockInfo.current_stock_level;
    const pending = stockInfo.pending_orders_quantity;
    
    if (available <= 0) {
        if (pending > 0) {
            return `Out of stock (${current} in stock, ${pending} pending orders)`;
        } else {
            return `Out of stock (${current} available)`;
        }
    } else if (stockInfo.stock_status === 'low_stock') {
        return `Low stock: ${available} available (${pending} in pending orders)`;
    } else {
        return `${available} available${pending > 0 ? ` (${pending} in pending orders)` : ''}`;
    }
}

// POST add item to shopping cart
app.post('/api/cart/add', authenticateUser, async (req, res) => {
    try {
        const { inventory_item_id, quantity_requested, estimated_cost, notes } = req.body;
        
        // Validate required fields
        if (!inventory_item_id || !quantity_requested) {
            return res.validationError(['inventory_item_id and quantity_requested are required']);
        }

        // Validate quantity is positive
        if (quantity_requested <= 0) {
            return res.validationError(['quantity_requested must be greater than 0']);
        }

        // Validate estimated_cost if provided
        if (estimated_cost !== undefined && estimated_cost < 0) {
            return res.validationError(['estimated_cost cannot be negative']);
        }

        // REAL-TIME STOCK VALIDATION
        const dbPool = req.app.locals.db;
        
        // Check current stock availability
        const stockCheckQuery = `
            SELECT 
                i.inventory_item_id,
                i.item_name,
                i.part_number,
                i.current_stock_level,
                i.program_id,
                ISNULL(pending.pending_quantity, 0) as pending_orders_quantity,
                (i.current_stock_level - ISNULL(pending.pending_quantity, 0)) as available_quantity
            FROM InventoryItems i
            LEFT JOIN (
                SELECT 
                    poi.inventory_item_id,
                    SUM(poi.quantity_ordered) as pending_quantity
                FROM PendingOrderItems poi
                JOIN PendingOrders po ON poi.order_id = po.order_id
                WHERE po.status = 'Pending'
                GROUP BY poi.inventory_item_id
            ) pending ON i.inventory_item_id = pending.inventory_item_id
            WHERE i.inventory_item_id = @inventory_item_id
        `;
        
        const stockRequest = dbPool.request();
        stockRequest.input('inventory_item_id', sql.Int, inventory_item_id);
        const stockResult = await stockRequest.query(stockCheckQuery);
        
        if (stockResult.recordset.length === 0) {
            return res.notFound('Inventory item');
        }
        
        const stockInfo = stockResult.recordset[0];
        
        // Check program access for non-admin users
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(stockInfo.program_id)) {
            return res.forbidden('Access denied to this inventory item');
        }
        
        // Validate requested quantity against available stock
        if (quantity_requested > stockInfo.available_quantity) {
            return res.errorResponse(
                'Insufficient stock available',
                {
                    type: 'insufficient_stock',
                    requested_quantity: quantity_requested,
                    available_quantity: stockInfo.available_quantity,
                    current_stock: stockInfo.current_stock_level,
                    pending_orders: stockInfo.pending_orders_quantity,
                    item_name: stockInfo.item_name,
                    part_number: stockInfo.part_number
                },
                400
            );
        }

        // Build the JSON object for the stored procedure
        const cartItemJson = {
            user_id: req.user.user_id,
            inventory_item_id: inventory_item_id,
            quantity_requested: quantity_requested,
            estimated_cost: estimated_cost || null,
            notes: notes || null
        };

        console.log('Adding to cart with JSON:', JSON.stringify(cartItemJson, null, 2));

        // Execute the stored procedure with JSON parameter
        const request = dbPool.request();
        request.input('CartJson', sql.NVarChar, JSON.stringify(cartItemJson));
        
        const result = await request.execute('usp_AddToCart');

        // Log cart operation for audit trail
        if (req.app.locals.auditLogger) {
            try {
                await req.app.locals.auditLogger.logCRUDOperation(
                    req.user.user_id,
                    'CREATE',
                    'CartItem',
                    null,
                    null,
                    cartItemJson,
                    getClientIP(req),
                    stockInfo.program_id,
                    `Added ${quantity_requested} units of ${stockInfo.item_name} to cart`
                );
            } catch (auditError) {
                console.warn('Failed to log cart operation:', auditError);
            }
        }

        return res.successResponse(
            {
                user_id: req.user.user_id,
                cart_summary: result.recordset[0] || {}
            },
            'Item added to cart successfully'
        );
    } catch (error) {
        console.error('Error adding item to cart:', error);
        
        // Report this error to GitHub
        await githubErrorReporting.reportAPIError(error, req, {
            endpoint: '/api/cart/add',
            procedure: 'usp_AddToCart',
            cartItemJson: cartItemJson,
            parameterName: 'CartJson'
        });
        
        return res.databaseError(error, 'add item to cart');
    }
});

// PUT update cart item quantity
app.put('/api/cart/:cartId', authenticateUser, async (req, res) => {
    try {
        const cartId = req.params.cartId;
        const { quantity_requested, estimated_cost, notes } = req.body;
        
        // Validate required fields
        if (!quantity_requested) {
            return res.status(400).json({ 
                error: 'quantity_requested is required' 
            });
        }

        // Validate quantity is positive
        if (quantity_requested <= 0) {
            return res.status(400).json({ 
                error: 'quantity_requested must be greater than 0' 
            });
        }

        const request = new sql.Request(app.locals.db);
        const result = await request
            .input('cart_id', sql.Int, cartId)
            .input('user_id', sql.Int, req.user.user_id)
            .input('quantity_requested', sql.Decimal(18, 4), quantity_requested)
            .input('estimated_cost', sql.Decimal(18, 2), estimated_cost || null)
            .input('notes', sql.NVarChar(sql.MAX), notes || null)
            .execute('usp_UpdateCartItem');

        res.json({
            success: true,
            message: 'Cart item updated successfully',
            item: result.recordset[0]
        });
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ error: 'Failed to update cart item' });
    }
});

// DELETE remove item from cart
app.delete('/api/cart/:cartId', authenticateUser, async (req, res) => {
    try {
        const cartId = req.params.cartId;
        
        const request = new sql.Request(app.locals.db);
        const result = await request
            .input('cart_id', sql.Int, cartId)
            .input('user_id', sql.Int, req.user.user_id)
            .execute('usp_RemoveFromCart');

        res.json({
            success: true,
            message: 'Item removed from cart successfully'
        });
    } catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).json({ error: 'Failed to remove cart item' });
    }
});

// POST create order from cart (convert cart to pending order)
app.post('/api/orders/create-from-cart', authenticateUser, async (req, res) => {
    try {
        const { project_id, order_notes, supplier_info } = req.body;
        
        // Validate required fields
        if (!project_id) {
            return res.status(400).json({ 
                error: 'project_id is required' 
            });
        }

        // Get user's program_id (use first accessible program for non-admin users)
        let program_id = null;
        if (req.user.is_system_admin) {
            // For system admin, we'll get the program_id from the project
            const projectRequest = new sql.Request(app.locals.db);
            const projectResult = await projectRequest
                .input('project_id', sql.Int, project_id)
                .query('SELECT program_id FROM Projects WHERE project_id = @project_id');
            
            if (projectResult.recordset.length === 0) {
                return res.status(404).json({ error: 'Project not found' });
            }
            program_id = projectResult.recordset[0].program_id;
        } else {
            // For non-admin users, use their first accessible program
            if (req.user.accessible_programs && req.user.accessible_programs.length > 0) {
                program_id = req.user.accessible_programs[0];
            } else {
                return res.status(403).json({ error: 'No program access available' });
            }
        }

        // Create JSON object for stored procedure
        const orderData = {
            user_id: req.user.user_id,
            project_id: project_id,
            program_id: program_id,
            order_notes: order_notes || null,
            supplier_info: supplier_info || null
        };

        console.log('Creating order from cart with JSON:', JSON.stringify(orderData, null, 2));

        const request = new sql.Request(app.locals.db);
        const result = await request
            .input('OrderJson', sql.NVarChar(sql.MAX), JSON.stringify(orderData))
            .execute('usp_CreateOrderFromCart');

        res.json({
            success: true,
            message: 'Order created from cart successfully',
            order: result.recordset[0]
        });
    } catch (error) {
        console.error('Error creating order from cart:', error);
        res.status(500).json({ error: 'Failed to create order from cart' });
    }
});

// GET pending orders for current user
app.get('/api/orders/pending', authenticateUser, async (req, res) => {
    try {
        const { program_id } = req.query;
        
        // If user is not system admin, use their accessible programs
        let targetProgramId = null;
        if (program_id) {
            // Validate user has access to requested program
            if (!req.user.is_system_admin && !req.user.accessible_programs.includes(parseInt(program_id))) {
                return res.status(403).json({ error: 'Access denied to this program' });
            }
            targetProgramId = parseInt(program_id);
        } else if (!req.user.is_system_admin && req.user.accessible_programs.length > 0) {
            // For non-admin users, default to their first accessible program
            targetProgramId = req.user.accessible_programs[0];
        }
        // If user is system admin and no program_id specified, get all orders (targetProgramId = null)
        
        const request = new sql.Request(app.locals.db);
        const result = await request
            .input('program_id', sql.Int, targetProgramId)
            .execute('usp_GetPendingOrders');

        res.json({
            success: true,
            orders: result.recordset,
            user_id: req.user.user_id,
            program_id: targetProgramId
        });
    } catch (error) {
        console.error('Error getting pending orders:', error);
        
        // Report this error to GitHub
        await githubErrorReporting.reportAPIError(error, req, {
            endpoint: '/api/orders/pending',
            errorLocation: 'get_pending_orders_endpoint',
            programFilter: req.query.program_id,
            userRole: req.user.is_system_admin ? 'admin' : 'user'
        });
        
        res.status(500).json({ error: 'Failed to get pending orders' });
    }
});

// PUT mark order as received (updates inventory and order status)
app.put('/api/orders/:orderId/received', authenticateUser, async (req, res) => {
    try {
        const orderId = parseInt(req.params.orderId);
        
        // Validate order ID
        if (isNaN(orderId) || orderId <= 0) {
            return res.status(400).json({ error: 'Invalid order ID' });
        }

        console.log(`Marking order ${orderId} as received by user ${req.user.user_id}`);

        // Build the JSON object for the stored procedure
        const orderReceivedJson = {
            order_id: orderId,
            user_id: req.user.user_id
        };

        console.log('Marking order as received with JSON:', JSON.stringify(orderReceivedJson, null, 2));

        // Execute the stored procedure with JSON parameter
        const pool = req.app.locals.db;
        const request = pool.request();
        request.input('OrderReceivedJson', sql.NVarChar, JSON.stringify(orderReceivedJson));
        
        const result = await request.execute('usp_MarkOrderAsReceived');
        
        // Parse JSON result
        if (result.recordset && result.recordset.length > 0) {
            const jsonResult = result.recordset[0].JsonResult;
            const data = JSON.parse(jsonResult);
            
            if (data.error) {
                return res.status(400).json(data);
            }
            
            res.json(data);
        } else {
            res.status(500).json({ error: 'No result returned from stored procedure' });
        }
    } catch (error) {
        console.error('Error marking order as received:', error);
        
        // Report this error to GitHub
        await githubErrorReporting.reportAPIError(error, req, {
            endpoint: '/api/orders/:orderId/received',
            errorLocation: 'mark_order_received_endpoint',
            orderId: req.params.orderId,
            userRole: req.user.is_system_admin ? 'admin' : 'user'
        });
        
        res.status(500).json({ error: 'Failed to mark order as received' });
    }
});

// DELETE order (only pending orders can be deleted)
app.delete('/api/orders/:orderId', authenticateUser, async (req, res) => {
    try {
        const orderId = parseInt(req.params.orderId);
        
        // Validate order ID
        if (isNaN(orderId) || orderId <= 0) {
            return res.status(400).json({ error: 'Invalid order ID' });
        }

        console.log(`Deleting order ${orderId} by user ${req.user.user_id}`);

        // Build the JSON object for the stored procedure
        const orderDeleteJson = {
            order_id: orderId,
            user_id: req.user.user_id
        };

        // Add program_id if user is not system admin (for access control)
        if (!req.user.is_system_admin && req.user.accessible_programs.length > 0) {
            // Use the program from query param or user's first accessible program
            const programId = req.query.program_id ? parseInt(req.query.program_id) : req.user.accessible_programs[0];
            orderDeleteJson.program_id = programId;
        }

        console.log('Deleting order with JSON:', JSON.stringify(orderDeleteJson, null, 2));

        // Execute the stored procedure with JSON parameter
        const pool = req.app.locals.db;
        const request = pool.request();
        request.input('OrderJson', sql.NVarChar, JSON.stringify(orderDeleteJson));
        
        const result = await request.execute('usp_DeleteOrder');
        
        if (result.recordset && result.recordset.length > 0) {
            const resultData = result.recordset[0].result;
            const data = JSON.parse(resultData);
            
            if (data.error) {
                console.error('Stored procedure error:', data.error);
                return res.status(400).json({ error: data.error });
            }
            
            console.log('Order deleted successfully:', data);
            res.json(data);
        } else {
            res.status(500).json({ error: 'No result returned from stored procedure' });
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        
        // Report this error to GitHub
        await githubErrorReporting.reportAPIError(error, req, {
            endpoint: '/api/orders/:orderId',
            errorLocation: 'delete_order_endpoint',
            orderId: req.params.orderId,
            userRole: req.user.is_system_admin ? 'admin' : 'user'
        });
        
        res.status(500).json({ error: 'Failed to delete order' });
    }
});

// POST tracked item - Create new tracked item
app.post('/api/tracked-items', authenticateUser, async (req, res) => {
    try {
        const { 
            project_id, 
            item_identifier, 
            current_overall_status = 'Pending',
            notes = '',
            initial_attributes = []
        } = req.body;

        // Validate required fields
        if (!project_id || !item_identifier) {
            return res.status(400).json({ error: 'project_id and item_identifier are required' });
        }

        // First verify the project exists and user has access to it
        const projectQuery = `
            SELECT p.*, pr.program_name, pr.program_code
            FROM Projects p
            JOIN Programs pr ON p.program_id = pr.program_id
            WHERE p.project_id = @project_id
        `;
        
        const pool = req.app.locals.db;
        const projectRequest = pool.request();
        projectRequest.input('project_id', sql.Int, project_id);
        
        const projectResult = await projectRequest.query(projectQuery);
        
        if (projectResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        const project = projectResult.recordset[0];
        
        // Check program access for non-admin users
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(project.program_id)) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }

        // Create the tracked item
        const createItemQuery = `
            INSERT INTO TrackedItems (
                project_id, 
                item_identifier, 
                current_overall_status, 
                notes, 
                created_by, 
                date_created, 
                last_modified
            )
            OUTPUT INSERTED.item_id, INSERTED.project_id, INSERTED.item_identifier, 
                   INSERTED.current_overall_status, INSERTED.notes, INSERTED.date_created,
                   INSERTED.last_modified, INSERTED.created_by, INSERTED.is_shipped,
                   INSERTED.shipped_date, INSERTED.date_fully_completed
            VALUES (
                @project_id,
                @item_identifier,
                @current_overall_status,
                @notes,
                @created_by,
                GETDATE(),
                GETDATE()
            )
        `;

        const createItemRequest = pool.request();
        createItemRequest.input('project_id', sql.Int, project_id);
        createItemRequest.input('item_identifier', sql.NVarChar(100), item_identifier);
        createItemRequest.input('current_overall_status', sql.NVarChar(50), current_overall_status);
        createItemRequest.input('notes', sql.NVarChar(sql.MAX), notes);
        createItemRequest.input('created_by', sql.Int, req.user.user_id);

        const createItemResult = await createItemRequest.query(createItemQuery);
        
        if (createItemResult.recordset.length === 0) {
            return res.status(500).json({ error: 'Failed to create tracked item' });
        }

        const createdItem = createItemResult.recordset[0];

        // Create initial attributes if provided
        if (initial_attributes && initial_attributes.length > 0) {
            for (const attr of initial_attributes) {
                const attrQuery = `
                    INSERT INTO ItemAttributeValues (
                        item_id, 
                        attribute_definition_id, 
                        attribute_value,
                        date_set,
                        set_by
                    )
                    VALUES (
                        @item_id,
                        @attribute_definition_id,
                        @attribute_value,
                        GETDATE(),
                        @set_by
                    )
                `;

                const attrRequest = pool.request();
                attrRequest.input('item_id', sql.Int, createdItem.item_id);
                attrRequest.input('attribute_definition_id', sql.Int, attr.attribute_definition_id);
                attrRequest.input('attribute_value', sql.NVarChar(sql.MAX), attr.attribute_value);
                attrRequest.input('set_by', sql.Int, req.user.user_id);

                await attrRequest.query(attrQuery);
            }
        }

        // Transform the response to match the frontend expected format
        const response = {
            item_id: createdItem.item_id.toString(),
            project_id: createdItem.project_id.toString(),
            item_identifier: createdItem.item_identifier,
            current_overall_status: createdItem.current_overall_status,
            notes: createdItem.notes || '',
            date_created: createdItem.date_created,
            last_modified: createdItem.last_modified,
            created_by: createdItem.created_by,
            is_shipped: createdItem.is_shipped,
            shipped_date: createdItem.shipped_date,
            date_fully_completed: createdItem.date_fully_completed
        };

        res.status(201).json(response);
    } catch (error) {
        console.error('Error creating tracked item:', error);
        res.status(500).json({ error: 'Failed to create tracked item' });
    }
});

// POST batch update tracked item step progress
app.post('/api/tracked-items/batch-step-progress', authenticateUser, async (req, res) => {
    try {
        const { itemIds, stepId, status, completed_by_user_name } = req.body;
        
        // Validate required fields
        if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
            return res.status(400).json({ error: 'itemIds array is required' });
        }
        
        if (!stepId) {
            return res.status(400).json({ error: 'stepId is required' });
        }
        
        if (!status) {
            return res.status(400).json({ error: 'status is required' });
        }
        
        const pool = req.app.locals.db;
        
        // Process each item
        const results = [];
        for (const itemId of itemIds) {
            console.log(`Processing item ${itemId} for step ${stepId} with status ${status}`);
            
            // Check if progress record exists
            const checkQuery = `
                SELECT * FROM TrackedItemStepProgress 
                WHERE item_id = @item_id AND step_id = @step_id
            `;
            
            const checkRequest = pool.request();
            checkRequest.input('item_id', sql.Int, parseInt(itemId));
            checkRequest.input('step_id', sql.Int, parseInt(stepId));
            
            const checkResult = await checkRequest.query(checkQuery);
            
            if (checkResult.recordset.length > 0) {
                // Update existing record
                const updateQuery = `
                    UPDATE TrackedItemStepProgress 
                    SET 
                        status = @status,
                        date_completed = CASE 
                            WHEN @status = 'Complete' THEN GETDATE() 
                            ELSE date_completed 
                        END,
                        notes = COALESCE(notes, '') + CASE 
                            WHEN @completed_by_user_name IS NOT NULL 
                            THEN CHAR(13) + CHAR(10) + 'Completed by: ' + @completed_by_user_name + ' on ' + CONVERT(varchar, GETDATE(), 120)
                            ELSE ''
                        END
                    WHERE item_id = @item_id AND step_id = @step_id
                `;
                
                const updateRequest = pool.request();
                updateRequest.input('item_id', sql.Int, parseInt(itemId));
                updateRequest.input('step_id', sql.Int, parseInt(stepId));
                updateRequest.input('status', sql.NVarChar(50), status);
                updateRequest.input('completed_by_user_name', sql.NVarChar(255), completed_by_user_name || null);
                
                await updateRequest.query(updateQuery);
                results.push({ itemId, action: 'updated' });
            } else {
                // Create new record
                const insertQuery = `
                    INSERT INTO TrackedItemStepProgress (
                        item_id, 
                        step_id, 
                        status, 
                        date_completed,
                        notes
                    ) VALUES (
                        @item_id,
                        @step_id,
                        @status,
                        CASE WHEN @status = 'Complete' THEN GETDATE() ELSE NULL END,
                        CASE 
                            WHEN @completed_by_user_name IS NOT NULL 
                            THEN 'Completed by: ' + @completed_by_user_name + ' on ' + CONVERT(varchar, GETDATE(), 120)
                            ELSE ''
                        END
                    )
                `;
                
                const insertRequest = pool.request();
                insertRequest.input('item_id', sql.Int, parseInt(itemId));
                insertRequest.input('step_id', sql.Int, parseInt(stepId));
                insertRequest.input('status', sql.NVarChar(50), status);
                insertRequest.input('completed_by_user_name', sql.NVarChar(255), completed_by_user_name || null);
                
                await insertRequest.query(insertQuery);
                results.push({ itemId, action: 'created' });
            }
        }
        
        console.log(`Batch update completed for ${results.length} items`);
        res.json({ 
            success: true, 
            message: `Updated ${results.length} items`, 
            results 
        });
        
    } catch (error) {
        console.error('Error in batch update tracked item step progress:', error);
        res.status(500).json({ error: 'Failed to update tracked item step progress' });
    }
});

// =============================================================================
// USER MANAGEMENT & TEAM APIs
// =============================================================================

// Get all users with team member information
app.get('/api/users/team-members', authenticateUser, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        const program_id = req.query.program_id || null;
        
        // Use stored procedure for secure team member retrieval
        const result = await pool.request()
            .input('ProgramId', sql.Int, program_id)
            .input('RequestingUserId', sql.Int, req.user.user_id)
            .execute('usp_GetTeamMembers');
        
        // Transform data to match expected frontend format
        const teamMembers = result.recordset.map(member => ({
            user_id: member.user_id,
            username: member.user_name,
            full_name: member.display_name,
            role: member.access_level === 'Admin' ? 'Administrator' : 
                  member.access_level === 'Write' ? 'Project Manager' : 'Technician',
            status: 'Active',
            availability_status: 'Available',
            skills: ['General Production'], // TODO: Implement skills system
            current_task_count: 0, // TODO: Get from Tasks table
            productivity_score: 95.0, // TODO: Calculate from metrics
            last_active: member.date_granted,
            program_name: member.program_name,
            access_level: member.access_level
        }));
        
        res.json(teamMembers);
    } catch (error) {
        console.error('Error fetching team members:', error);
        res.status(500).json({ error: 'Failed to fetch team members' });
    }
});

// Get user access requests
app.get('/api/users/access-requests', authenticateUser, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        
        // Only system admins can view access requests
        if (!req.user.is_system_admin) {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }
        
        // Use stored procedure for secure access request retrieval
        const result = await pool.request()
            .input('RequestingUserId', sql.Int, req.user.user_id)
            .input('IsSystemAdmin', sql.Bit, req.user.is_system_admin)
            .execute('usp_GetUserAccessRequests');
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching access requests:', error);
        res.status(500).json({ error: 'Failed to fetch access requests' });
    }
});

// Approve user access request
app.post('/api/users/access-requests/:userId/approve', authenticateUser, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        const { userId } = req.params;
        const { role, notes } = req.body;
        
        // Only system admins can approve access requests
        if (!req.user.is_system_admin) {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }
        
        // Update the access request status
        await pool.request()
            .input('user_id', sql.NVarChar, userId)
            .input('role', sql.NVarChar, role)
            .input('notes', sql.NVarChar, notes || '')
            .input('approved_by', sql.Int, req.user.user_id)
            .query(`
                UPDATE UserAccessRequests 
                SET status = 'approved',
                    approved_role = @role,
                    admin_notes = @notes,
                    approved_by = @approved_by,
                    approved_date = GETDATE()
                WHERE user_id = @user_id AND status = 'pending'
            `);
        
        res.json({ success: true, message: 'User access approved' });
    } catch (error) {
        console.error('Error approving user access:', error);
        res.status(500).json({ error: 'Failed to approve user access' });
    }
});

// Deny user access request
app.post('/api/users/access-requests/:userId/deny', authenticateUser, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        const { userId } = req.params;
        const { notes } = req.body;
        
        // Only system admins can deny access requests
        if (!req.user.is_system_admin) {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }
        
        // Update the access request status
        await pool.request()
            .input('user_id', sql.NVarChar, userId)
            .input('notes', sql.NVarChar, notes || '')
            .input('denied_by', sql.Int, req.user.user_id)
            .query(`
                UPDATE UserAccessRequests 
                SET status = 'denied',
                    admin_notes = @notes,
                    denied_by = @denied_by,
                    denied_date = GETDATE()
                WHERE user_id = @user_id AND status = 'pending'
            `);
        
        res.json({ success: true, message: 'User access denied' });
    } catch (error) {
        console.error('Error denying user access:', error);
        res.status(500).json({ error: 'Failed to deny user access' });
    }
});

// =============================================================================
// ENHANCED TASK MANAGEMENT APIs
// =============================================================================

// Get task statistics
app.get('/api/tasks/statistics', authenticateUser, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        const programId = req.query.program_id || req.user.accessible_programs[0];
        
        const result = await pool.request()
            .input('ProgramId', sql.Int, programId)
            .execute('usp_GetTaskStatistics');
        
        const stats = result.recordset[0];
        
        // Calculate completion rate
        const completionRate = stats.total_tasks > 0 ? 
            Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0;
            
        res.json({
            totalTasks: stats.total_tasks || 0,
            completedTasks: stats.completed_tasks || 0,
            inProgressTasks: stats.in_progress_tasks || 0,
            pendingTasks: stats.pending_tasks || 0,
            highPriorityTasks: stats.high_priority_tasks || 0,
            overdueTasks: stats.overdue_tasks || 0,
            completionRate,
            avgCompletionTime: stats.avg_completion_time || 0,
            activeTeamMembers: stats.active_team_members || 0
        });
        
    } catch (error) {
        console.error('Error fetching task statistics:', error);
        res.status(500).json({ error: 'Failed to fetch task statistics' });
    }
});

// Get user task summary
app.get('/api/tasks/user-summary/:userId', authenticateUser, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        const { userId } = req.params;
        const programId = req.query.program_id || req.user.accessible_programs[0];
        
        const result = await pool.request()
            .input('UserId', sql.Int, parseInt(userId))
            .input('ProgramId', sql.Int, programId)
            .execute('usp_GetUserTaskSummary');
        
        const summary = result.recordset[0];
        
        if (!summary) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Calculate completion rate
        const completionRate = summary.total_assigned_tasks > 0 ? 
            Math.round((summary.completed_tasks / summary.total_assigned_tasks) * 100) : 0;
            
        res.json({
            userId: parseInt(userId),
            username: summary.username,
            fullName: summary.full_name,
            totalAssignedTasks: summary.total_assigned_tasks || 0,
            completedTasks: summary.completed_tasks || 0,
            inProgressTasks: summary.in_progress_tasks || 0,
            pendingTasks: summary.pending_tasks || 0,
            highPriorityTasks: summary.high_priority_tasks || 0,
            overdueTasks: summary.overdue_tasks || 0,
            completionRate,
            avgCompletionTime: summary.avg_completion_time || 0
        });
        
    } catch (error) {
        console.error('Error fetching user task summary:', error);
        res.status(500).json({ error: 'Failed to fetch user task summary' });
    }
});

// Update task
app.put('/api/tasks/:id', authenticateUser, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        const { id } = req.params;
        const taskData = req.body;
        
        const result = await pool.request()
            .input('task_id', sql.Int, parseInt(id))
            .input('task_name', sql.NVarChar, taskData.title)
            .input('description', sql.NVarChar, taskData.description || '')
            .input('status', sql.NVarChar, taskData.status)
            .input('priority', sql.NVarChar, taskData.priority || 'medium')
            .input('assigned_to', sql.Int, taskData.assigned_to ? parseInt(taskData.assigned_to) : null)
            .input('due_date', sql.DateTime, taskData.due_date ? new Date(taskData.due_date) : null)
            .input('estimated_hours', sql.Decimal, taskData.estimated_hours || null)
            .input('updated_by', sql.Int, req.user.user_id)
            .query(`
                UPDATE Tasks 
                SET task_name = @task_name,
                    description = @description,
                    status = @status,
                    priority = @priority,
                    assigned_to = @assigned_to,
                    due_date = @due_date,
                    estimated_hours = @estimated_hours,
                    last_modified = GETDATE(),
                    updated_by = @updated_by
                WHERE task_id = @task_id
                
                SELECT * FROM Tasks WHERE task_id = @task_id
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        res.json(result.recordset[0]);
        
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete task
app.delete('/api/tasks/:id', authenticateUser, async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        
        // First verify the task exists and check authorization
        const taskCheck = await req.app.locals.db.request()
            .input('task_id', sql.Int, taskId)
            .query(`
                SELECT T.task_id, T.task_name, T.project_id, P.program_id 
                FROM Tasks T 
                INNER JOIN Projects P ON T.project_id = P.project_id 
                WHERE T.task_id = @task_id
            `);
        
        if (taskCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        const task = taskCheck.recordset[0];
        
        // Check if user has access to this program
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(task.program_id)) {
            return res.status(403).json({ error: 'Access denied to this program' });
        }
        
        // Check if user has write permissions for this program
        const programAccess = req.user.program_access.find(p => p.program_id === task.program_id);
        if (!req.user.is_system_admin && (!programAccess || !['Write', 'Admin'].includes(programAccess.access_level))) {
            return res.status(403).json({ error: 'Write access required to delete tasks' });
        }
        
        // Build JSON parameter for stored procedure
        const taskJson = {
            task_id: taskId,
            deleted_by: req.user.user_id
        };
        
        console.log('Deleting task with data:', JSON.stringify(taskJson, null, 2));
        
        // Execute the secure stored procedure
        const pool = req.app.locals.db;
        const request = pool.request();
        request.input('TaskJson', sql.NVarChar, JSON.stringify(taskJson));
        
        const result = await request.execute('usp_DeleteTask');
        
        // Return the result from the stored procedure
        if (result.recordset && result.recordset.length > 0) {
            const deletionResult = result.recordset[0];
            
            if (deletionResult.status === 'SUCCESS') {
                console.log(`✅ ${deletionResult.message} by user ${req.user.user_id}`);
                res.json({
                    success: true,
                    message: deletionResult.message,
                    task_id: deletionResult.task_id,
                    project_id: deletionResult.project_id,
                    program_id: deletionResult.program_id
                });
            } else {
                console.log(`❌ ${deletionResult.message} for user ${req.user.user_id}`);
                res.status(400).json({ error: deletionResult.message });
            }
        } else {
            res.status(500).json({ error: 'Failed to delete task - no result returned' });
        }
        
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// Get tasks by project
app.get('/api/tasks/project/:projectId', authenticateUser, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        const { projectId } = req.params;
        
        const result = await pool.request()
            .input('ProjectId', sql.Int, parseInt(projectId))
            .execute('usp_GetTasksByProject');
        
        res.json(result.recordset);
        
    } catch (error) {
        console.error('Error fetching tasks by project:', error);
        res.status(500).json({ error: 'Failed to fetch tasks by project' });
    }
});

// Get tasks by user
app.get('/api/tasks/user/:userId', authenticateUser, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        const { userId } = req.params;
        
        const result = await pool.request()
            .input('UserId', sql.Int, parseInt(userId))
            .execute('usp_GetTasksByUser');
        
        res.json(result.recordset);
        
    } catch (error) {
        console.error('Error fetching tasks by user:', error);
        res.status(500).json({ error: 'Failed to fetch tasks by user' });
    }
});

// =============================================================================
// GITHUB INTEGRATION ENDPOINTS (ADMIN ONLY)
// =============================================================================

// Test GitHub connection
app.post('/api/admin/github/test', authenticateUser, async (req, res) => {
    try {
        // Only system admins can access GitHub integration
        if (!req.user.is_system_admin) {
            return res.status(403).json({ error: 'System Admin access required' });
        }

        const { owner, repo } = req.body;
        
        if (!owner || !repo) {
            return res.status(400).json({ error: 'Owner and repo are required' });
        }

        // Test GitHub API connection (without creating issues)
        const testResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: {
                'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'H10CM-Debug-Panel'
            }
        });

        if (testResponse.ok) {
            const repoInfo = await testResponse.json();
            const rateLimitRemaining = testResponse.headers.get('x-ratelimit-remaining');
            
            res.json({
                success: true,
                message: 'GitHub connection successful',
                repoInfo: {
                    name: repoInfo.name,
                    full_name: repoInfo.full_name,
                    private: repoInfo.private,
                    has_issues: repoInfo.has_issues
                },
                rateLimitRemaining: parseInt(rateLimitRemaining || '0')
            });
        } else {
            const errorData = await testResponse.json();
            res.status(testResponse.status).json({
                error: errorData.message || 'GitHub API error',
                status: testResponse.status
            });
        }
    } catch (error) {
        console.error('GitHub connection test error:', error);
        res.status(500).json({ error: 'Failed to test GitHub connection' });
    }
});

// Create GitHub issue
app.post('/api/admin/github/create-issue', authenticateUser, async (req, res) => {
    try {
        // Only system admins can create GitHub issues
        if (!req.user.is_system_admin) {
            return res.status(403).json({ error: 'System Admin access required' });
        }

        const { config, issueData, errorContext, isManual } = req.body;
        
        if (!config?.owner || !config?.repo || !issueData) {
            return res.status(400).json({ error: 'Invalid request data' });
        }

        // Check for duplicate issues if enabled
        if (config.duplicateDetectionEnabled && !isManual) {
            const duplicateCheck = await checkForDuplicateIssue(config, issueData, errorContext);
            if (duplicateCheck.isDuplicate) {
                return res.json({
                    success: true,
                    isDuplicate: true,
                    existingIssueUrl: duplicateCheck.existingIssueUrl,
                    message: 'Similar issue already exists'
                });
            }
        }

        // Create the GitHub issue
        console.log('📝 Creating GitHub issue with data:', {
            title: issueData.title,
            owner: config.owner,
            repo: config.repo,
            bodyLength: issueData.body?.length,
            labels: issueData.labels
        });

        const issueResponse = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/issues`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'H10CM-Debug-Panel'
            },
            body: JSON.stringify({
                title: issueData.title,
                body: issueData.body,
                labels: issueData.labels,
                assignees: issueData.assignees || []
            })
        });

        console.log('🔍 GitHub API Response:', {
            status: issueResponse.status,
            statusText: issueResponse.statusText,
            headers: Object.fromEntries(issueResponse.headers.entries())
        });

        if (issueResponse.ok) {
            const createdIssue = await issueResponse.json();
            
            // Log the issue creation
            console.log(`✅ GitHub issue created: #${createdIssue.number} by ${req.user.user_name}`);
            
            // Store issue metadata in database for tracking
            await storeIssueMetadata(createdIssue, errorContext, req.user);
            
            res.json({
                success: true,
                issueNumber: createdIssue.number,
                issueUrl: createdIssue.html_url,
                issueId: createdIssue.id
            });
        } else {
            const errorData = await issueResponse.json();
            console.error('❌ GitHub issue creation failed:', {
                status: issueResponse.status,
                statusText: issueResponse.statusText,
                errorData: errorData,
                requestUrl: `https://api.github.com/repos/${config.owner}/${config.repo}/issues`,
                requestData: {
                    title: issueData.title,
                    bodyLength: issueData.body?.length,
                    labels: issueData.labels
                }
            });
            res.status(issueResponse.status).json({
                error: errorData.message || 'Failed to create GitHub issue',
                status: issueResponse.status,
                details: errorData
            });
        }
    } catch (error) {
        console.error('GitHub issue creation error:', error);
        res.status(500).json({ error: 'Failed to create GitHub issue' });
    }
});

// Get GitHub issues created by the system
app.get('/api/admin/github/issues', authenticateUser, async (req, res) => {
    try {
        // Only system admins can view GitHub issues
        if (!req.user.is_system_admin) {
            return res.status(403).json({ error: 'System Admin access required' });
        }

        // Get issues from our tracking database
        const pool = req.app.locals.db;
        const result = await pool.request()
            .input('limit', sql.Int, parseInt(req.query.limit) || 50)
            .input('offset', sql.Int, parseInt(req.query.offset) || 0)
            .query(`
                SELECT TOP (@limit) 
                    issue_id,
                    issue_number,
                    issue_url,
                    issue_title,
                    labels,
                    error_type,
                    severity,
                    created_by_user,
                    created_at,
                    is_manual
                FROM GitHubIssues 
                ORDER BY created_at DESC
                OFFSET @offset ROWS
            `);
        
        res.json(result.recordset || []);
    } catch (error) {
        console.error('Error fetching GitHub issues:', error);
        res.status(500).json({ error: 'Failed to fetch GitHub issues' });
    }
});

// Helper function to check for duplicate issues
async function checkForDuplicateIssue(config, issueData, errorContext) {
    try {
        // Search for similar issues in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const searchQuery = `repo:${config.owner}/${config.repo} is:issue created:>${thirtyDaysAgo.toISOString().split('T')[0]} ${issueData.title.split(' ').slice(0, 3).join(' ')}`;
        
        const searchResponse = await fetch(`https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}`, {
            headers: {
                'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'H10CM-Debug-Panel'
            }
        });

        if (searchResponse.ok) {
            const searchResults = await searchResponse.json();
            
            // Check for similar titles or error messages
            for (const issue of searchResults.items) {
                const similarity = calculateStringSimilarity(issueData.title, issue.title);
                if (similarity > 0.8) {
                    return {
                        isDuplicate: true,
                        existingIssueUrl: issue.html_url,
                        existingIssue: issue
                    };
                }
            }
        }
        
        return { isDuplicate: false };
    } catch (error) {
        console.warn('Duplicate check failed:', error);
        return { isDuplicate: false };
    }
}

// Helper function to store issue metadata
async function storeIssueMetadata(githubIssue, errorContext, user) {
    try {
        const pool = app.locals.db;
        
        // Create GitHubIssues table if it doesn't exist
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='GitHubIssues' AND xtype='U')
            CREATE TABLE GitHubIssues (
                id INT IDENTITY(1,1) PRIMARY KEY,
                issue_id BIGINT NOT NULL,
                issue_number INT NOT NULL,
                issue_url NVARCHAR(500) NOT NULL,
                issue_title NVARCHAR(500) NOT NULL,
                labels NVARCHAR(MAX),
                error_type NVARCHAR(50),
                severity NVARCHAR(20),
                error_context NVARCHAR(MAX),
                created_by_user NVARCHAR(100),
                created_at DATETIME2 DEFAULT GETDATE(),
                is_manual BIT DEFAULT 0
            )
        `);
        
        await pool.request()
            .input('issue_id', sql.BigInt, githubIssue.id)
            .input('issue_number', sql.Int, githubIssue.number)
            .input('issue_url', sql.NVarChar, githubIssue.html_url)
            .input('issue_title', sql.NVarChar, githubIssue.title)
            .input('labels', sql.NVarChar, JSON.stringify(githubIssue.labels?.map(l => l.name) || []))
            .input('error_type', sql.NVarChar, errorContext?.errorType || 'manual')
            .input('severity', sql.NVarChar, errorContext?.severity || 'medium')
            .input('error_context', sql.NVarChar, JSON.stringify(errorContext || {}))
            .input('created_by_user', sql.NVarChar, user.user_name)
            .input('is_manual', sql.Bit, !errorContext)
            .query(`
                INSERT INTO GitHubIssues 
                (issue_id, issue_number, issue_url, issue_title, labels, error_type, severity, error_context, created_by_user, is_manual)
                VALUES 
                (@issue_id, @issue_number, @issue_url, @issue_title, @labels, @error_type, @severity, @error_context, @created_by_user, @is_manual)
            `);
    } catch (error) {
        console.warn('Failed to store issue metadata:', error);
    }
}

// Helper function to calculate string similarity
function calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

function getEditDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

// =============================================================================
// AUDIT TRAIL ENDPOINTS
// =============================================================================

// GET audit trail for specific entity
app.get('/api/audit/entity/:entityType/:entityId', authenticateUser, async (req, res) => {
    try {
        const { entityType, entityId } = req.params;
        const { limit = 50 } = req.query;
        
        if (!req.app.locals.auditLogger) {
            return res.errorResponse('Audit logging not available', null, 503);
        }

        // Get user's program context for filtering
        const programId = req.user.is_system_admin ? null : req.user.accessible_programs[0];
        
        const auditTrail = await req.app.locals.auditLogger.getAuditTrail(
            entityType,
            parseInt(entityId),
            null, // All users
            programId,
            parseInt(limit)
        );

        return res.successResponse(auditTrail, `Audit trail retrieved for ${entityType} ID: ${entityId}`);
    } catch (error) {
        console.error('Error retrieving audit trail:', error);
        return res.databaseError(error, 'retrieve audit trail');
    }
});

// GET user activity summary
app.get('/api/audit/user/:userId/activity', authenticateUser, async (req, res) => {
    try {
        const { userId } = req.params;
        const { days = 7 } = req.query;
        
        // Only allow users to view their own activity unless admin
        if (!req.user.is_system_admin && req.user.user_id != userId) {
            return res.forbidden('Can only view your own activity');
        }

        if (!req.app.locals.auditLogger) {
            return res.errorResponse('Audit logging not available', null, 503);
        }

        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - parseInt(days));
        const dateTo = new Date();

        const programId = req.user.is_system_admin ? null : req.user.accessible_programs[0];
        
        const activitySummary = await req.app.locals.auditLogger.getUserActivitySummary(
            parseInt(userId),
            dateFrom,
            dateTo,
            programId
        );

        return res.successResponse(
            activitySummary,
            `Activity summary for user ${userId} (last ${days} days)`,
            { days: parseInt(days), date_from: dateFrom, date_to: dateTo }
        );
    } catch (error) {
        console.error('Error retrieving user activity:', error);
        return res.databaseError(error, 'retrieve user activity');
    }
});

// GET security events (Admin only)
app.get('/api/audit/security-events', authenticateUser, async (req, res) => {
    try {
        if (!req.user.is_system_admin) {
            return res.forbidden('Admin access required for security events');
        }

        const { severity, hours = 24 } = req.query;
        
        if (!req.app.locals.auditLogger) {
            return res.errorResponse('Audit logging not available', null, 503);
        }

        const securityEvents = await req.app.locals.auditLogger.getSecurityEvents(
            severity,
            null, // All users
            parseInt(hours)
        );

        return res.successResponse(
            securityEvents,
            `Security events retrieved (last ${hours} hours)`,
            { hours: parseInt(hours), severity: severity || 'all' }
        );
    } catch (error) {
        console.error('Error retrieving security events:', error);
        return res.databaseError(error, 'retrieve security events');
    }
});

// =============================================================================
// PROCUREMENT MANAGEMENT ROUTES
// =============================================================================

// Mount procurement routes with database connection
app.use('/api', (req, res, next) => {
    req.db = app.locals.db;
    next();
}, procurementRoutes);

// TEST ENDPOINT - For testing error reporting (REMOVE IN PRODUCTION)
app.get('/api/test/error', async (req, res) => {
    console.log('🧪 Testing error reporting...');
    
    if (req.query.type === 'sync') {
        // Test synchronous error
        throw new Error('Test synchronous error for GitHub reporting');
    } else if (req.query.type === 'async') {
        // Test asynchronous error
        setTimeout(() => {
            throw new Error('Test asynchronous error for GitHub reporting');
        }, 100);
        res.json({ message: 'Async error will be thrown in 100ms' });
    } else if (req.query.type === 'promise') {
        // Test promise rejection
        Promise.reject(new Error('Test promise rejection for GitHub reporting'));
        res.json({ message: 'Promise rejection triggered' });
    } else {
        // Test manual error reporting
        const testError = new Error('Test manual error reporting');
        await githubErrorReporting.reportAPIError(testError, req, {
            testType: 'manual',
            description: 'Manual test of error reporting system'
        });
        res.json({ message: 'Manual error reported to GitHub' });
    }
});

// Export app for testing
module.exports = app;

// Global error handler for unhandled errors in Express routes
app.use((error, req, res, next) => {
    console.error('🔥 Global Express Error Handler:', error);
    
    // Report error to GitHub
    githubErrorReporting.reportAPIError(error, req, {
        middleware: 'global_error_handler',
        timestamp: new Date().toISOString()
    });
    
    // Send generic error response
    res.status(500).json({ 
        error: 'Internal server error',
        message: 'An error occurred while processing your request'
    });
});

// Start server only if not in test environment
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`H10CM Multi-Tenant API server running on port ${PORT}`);
        console.log(`Database: H10CM (Multi-Tenant Architecture)`);
        console.log(`Features: Program-level isolation, RBAC, Certificate Authentication`);
        console.log(`Health Check: http://localhost:${PORT}/api/health`);
        console.log(`Auth Test: http://localhost:${PORT}/api/auth/me`);
        console.log(`Programs: http://localhost:${PORT}/api/programs`);
    });
}
