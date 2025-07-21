// h10cm_api.js - H10CM Multi-Tenant API Server

// -----------------------------------------------------------------------------
// SETUP & DEPENDENCIES
// -----------------------------------------------------------------------------
const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Import route modules
const procurementRoutes = require('./routes/procurement');

// -----------------------------------------------------------------------------
// MIDDLEWARE
// -----------------------------------------------------------------------------
app.use(cors());
app.use(express.json());

// Pretty JSON middleware - formats all JSON responses with indentation
app.set('json spaces', 2);

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
}).catch(err => {
    console.error('Database Connection Failed!', err);
});

// -----------------------------------------------------------------------------
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// -----------------------------------------------------------------------------

const DEFAULT_USER_CERT = "MIIFRDCCBCygAwIBAgIDBnVHMA0GCSqGSIb3DQEBCwUAMFoxCzAJBgNVBAYTAlVTMRgwFgYDVQQKEw9VLlMuIEdvdmVybm1lbnQxDDAKBgNVBAsTA0RvRDEMMAoGA1UECxMDUEtJMRUwEwYDVQQDEwxET0QgSUQgQ0EtNzMwHhcNMjQwNzA5MDAwMDAwWhcNMjcwNzA4MjM1OTU5WjB/MQswCQYDVQQGEwJVUzEYMBYGA1UEChMPVS5TLiBHb3Zlcm5tZW50MQwwCgYDVQQLEwNEb0QxDDAKBgNVBAsTA1BLSTEMMAoGA1UECxMDVVNOMSwwKgYDVQQDEyNET1VHSEVSVFkuSlVTVElOLk1JQ0hBRUwuMTI1MDIyNzIyODCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAJ98y7xGmNrfVUtSA85i9EzyFfzpWLZvQfWv3KMvE9tdvjYLpi9wf1Mm440NZSdsn+VBSruZyb7s7EWa9Jiw19A4AsHHTm0PDUmIt5WbGPcXsszc/6eL/VEsR2V/gp5mhl96Az5ct/fMIslFhh5UX+H7ma8K56Hwir1vIc/Be80fQBulMwzGHz0vWOyQ0AWDtLWf6VdpYJV+Vjv0SC+H3pgIbEZL91Vwwmd1i8PzHi5BojfQIhI64IQuKqyPcZrLgmA3trNpHPJP8hdw4fe8I+N6TAjH/NkaB2BICis5pIbnmlrUyac60jr9qtavfBNfjtHTC9NQtQSv7+oQzMvqL5kCAwEAAaOCAewwggHoMB8GA1UdIwQYMBaAFOkhe/IUbzhViHqgUAmekXIcS9k7MDcGA1UdHwQwMC4wLKAqoCiGJmh0dHA6Ly9jcmwuZGlzYS5taWwvY3JsL0RPRElEQ0FfNzMuY3JsMA4GA1UdDwEB/wQEAwIHgDAkBgNVHSAEHTAbMAsGCWCGSAFlAgELKjAMBgpghkgBZQMCAQMNMB0GA1UdDgQWBBTjksZ1APK0JkryT88aMZw9hGjSvDBlBggrBgEFBQcBAQRZMFcwMwYIKwYBBQUHMAKGJ2h0dHA6Ly9jcmwuZGlzYS5taWwvc2lnbi9ET0RJRENBXzczLmNlcjAgBggrBgEFBQcwAYYUaHR0cDovL29jc3AuZGlzYS5taWwwgYgGA1UdEQSBgDB+oCcGCGCGSAFlAwYGoBsEGdT4ENs8CGwUVIGtg2DaCKhQjiEChDgQo/OgJAYKkwYBBAGCNxQCA6AWDBQxMjUwMjI3MjI4MTE3MDAyQG1pbIYtdXJuOnV1aWQ6QTQ4NkZFRTctNDE4NS00NTAyLUEzOTQtRDVERUNDRUJBNkUzMBsGA1UdCQQUMBIwEAYIKwYBBQUHCQQxBBMCVVMwKAYDVR0lBCEwHwYKKwYBBAGCNxQCAgYIKwYBBQUHAwIGBysGAQUCAwQwDQYJKoZIhvcNAQELBQADggEBAFc6ZODAlHhmEInPE9vnPpGOYBaFhQ06RDDxft3UDKn9oxB0gxogFAs/5kMIJE+wn9mjazLH/B2VnizUfXarFZcPCP3aziNeVAWH/ZjqMq8PxUvV1PJdVxVJu1cU6XberkTs5dgHNSlAb39Qdl/OQANERHa1pUdCgHscIeGl2TrvprzXD3zf0WsFI57hNeil6KUazf3u3pXuN2P00cv3ryEOw7CzC2IO0Q61Yn/vAjCprVh3IhoIkF0yPrYhUiP5qqTLyhynDynnDYwbnt/ZGQYaLiC+gNFxZwkQJtGHVXlb7WOW0zRZI3QaBSielwK1eawfdq/J2SCtT3YHriwKeaI=";

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
        const clientCert = req.headers['x-arr-clientcert'] || DEFAULT_DEVELOPMENT_CERT;
        
        // Extract certificate subject (simplified for this example)
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
        
        // Attach user info to request
        req.user = user;
        
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
    if (cert === DEFAULT_DEVELOPMENT_CERT) {
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

  res.json({
    user: {
      user_id: req.user.user_id,
      username: req.user.user_name,
      displayName: req.user.display_name,
      is_system_admin: req.user.is_system_admin,
      program_access: req.user.program_access,
      accessible_programs: req.user.accessible_programs,
      certificateInfo: {
        subject: clientCert,
        issuer: req.headers['x-arr-ssl'] || "",
        serialNumber: ""
      }
    },
    headers: {
      ...req.headers,
      'x-arr-clientcert': clientCert
    },
    extractedFrom: req.headers['x-arr-clientcert'] ? 'certificate' : 'fallback',
    request: {
      ip: req.headers['x-forwarded-for'] || req.ip,
      method: req.method,
      path: req.path,
      protocol: req.protocol,
      secure: req.secure
    }
  });
});

// =============================================================================
// PROGRAM MANAGEMENT ENDPOINTS (ADMIN ONLY)
// =============================================================================

// GET all programs (conditional authentication for initial setup)
app.get('/api/programs', async (req, res) => {
    try {
        const pool = req.app.locals.db;
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        // Check if any programs exist first
        const programCountResult = await pool.request()
            .execute('usp_GetSystemStatistics');
        
        const hasPrograms = programCountResult.recordset[0].program_count > 0;
        
        if (!hasPrograms) {
            // No programs exist, allow unauthenticated access for initial setup
            return res.json([]);
        }

        // Programs exist, check for certificate authentication
        const clientCert = req.headers['x-arr-clientcert'];
        if (!clientCert) {
            // No certificate provided, require authentication
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Use authenticateUser middleware to authenticate
        authenticateUser(req, res, async () => {
            try {
                // Authentication successful, proceed with stored procedure
                const result = await pool.request()
                    .input('RequestingUserId', sql.Int, req.user ? req.user.user_id : null)
                    .input('IsSystemAdmin', sql.Bit, req.user ? req.user.is_system_admin : false)
                    .execute('usp_GetAllPrograms');
                    
                res.json(result.recordset);
            } catch (error) {
                console.error('Error getting programs:', error);
                res.status(500).json({ error: 'Failed to get programs' });
            }
        });
    } catch (error) {
        console.error('Error getting programs:', error);
        res.status(500).json({ error: 'Failed to get programs' });
    }
});

// POST create new program (conditional authentication for initial setup)
app.post('/api/programs', async (req, res) => {
    try {
        const pool = req.app.locals.db;
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        // Check if any programs exist
        const programCountResult = await pool.request()
            .execute('usp_GetSystemStatistics');
        
        const hasPrograms = programCountResult.recordset[0].program_count > 0;
        
        if (hasPrograms) {
            // Programs exist, require authentication
            return authenticateUser(req, res, async () => {
                if (!req.user.is_system_admin) {
                    return res.status(403).json({ error: 'System Admin access required' });
                }
                await createProgramLogic(req, res, pool);
            });
        } else {
            // No programs exist, allow creation for initial setup
            await createProgramLogic(req, res, pool);
        }
    } catch (error) {
        console.error('Error in create program endpoint:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// POST grant program access to user (System Admin only)
app.post('/api/programs/:programId/access', authenticateUser, async (req, res) => {
    if (!req.user.is_system_admin) {
        return res.status(403).json({ error: 'System Admin access required' });
    }
    
    const { user_id, access_level } = req.body;
    const params = [
        { name: 'UserId', type: sql.Int, value: user_id },
        { name: 'ProgramId', type: sql.Int, value: req.params.programId },
        { name: 'AccessLevel', type: sql.NVarChar, value: access_level },
        { name: 'GrantedBy', type: sql.Int, value: req.user.user_id }
    ];
    await executeProcedure(res, 'usp_GrantProgramAccess', params);
});

// GET users with their program access (conditional authentication for initial setup)
app.get('/api/users', async (req, res) => {
    try {
        const pool = req.app.locals.db;
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        // Check if any system admins exist
        const adminCheckResult = await pool.request()
            .execute('usp_GetSystemStatistics');
        
        const hasAdmins = adminCheckResult.recordset[0].admin_count > 0;
        
        if (hasAdmins) {
            // Admins exist, require authentication
            return authenticateUser(req, res, async () => {
                if (!req.user.is_system_admin) {
                    return res.status(403).json({ error: 'System Admin access required' });
                }
                await getUsersLogic(req, res, pool);
            });
        } else {
            // No admins exist, allow unauthenticated access for setup check
            await getUsersLogic(req, res, pool);
        }
    } catch (error) {
        console.error('Error in users endpoint:', error);
        res.status(500).json({ error: 'Failed to get users' });
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
        
        res.json(projects);
    } catch (error) {
        console.error('Error in /api/projects:', error);
        res.status(500).json({ error: 'Failed to get projects.' });
    }
});

// GET a single project by ID (with program access check)
app.get('/api/projects/:id', authenticateUser, async (req, res) => {
    try {
        const query = `
            SELECT p.*, pr.program_name, pr.program_code,
                   pm.display_name as project_manager_name
            FROM Projects p
            JOIN Programs pr ON p.program_id = pr.program_id
            LEFT JOIN Users pm ON p.project_manager_id = pm.user_id
            WHERE p.project_id = @project_id
        `;
        
        const params = [{ name: 'project_id', type: sql.Int, value: req.params.id }];
        
        const pool = req.app.locals.db;
        const request = pool.request();
        params.forEach(param => {
            request.input(param.name, param.type, param.value);
        });
        
        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        const project = result.recordset[0];
        
        // Check program access for non-admin users
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(project.program_id)) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }
        
        res.json(project);
    } catch (error) {
        console.error('Error getting project:', error);
        res.status(500).json({ error: 'Failed to get project' });
    }
});

// GET project steps by project ID
app.get('/api/projects/:id/steps', authenticateUser, async (req, res) => {
    try {
        const projectId = req.params.id;
        
        // First verify the project exists and user has access to it
        const projectQuery = `
            SELECT p.*, pr.program_name, pr.program_code
            FROM Projects p
            JOIN Programs pr ON p.program_id = pr.program_id
            WHERE p.project_id = @project_id
        `;
        
        const pool = req.app.locals.db;
        const projectRequest = pool.request();
        projectRequest.input('project_id', sql.Int, projectId);
        
        const projectResult = await projectRequest.query(projectQuery);
        
        if (projectResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        const project = projectResult.recordset[0];
        
        // Check program access for non-admin users
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(project.program_id)) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }
        
        // Get project steps using the stored procedure
        const stepsRequest = pool.request();
        stepsRequest.input('project_id', sql.Int, projectId);
        
        const stepsResult = await stepsRequest.execute('usp_GetProjectStepsByProjectId');
        
        // Return the steps in the format expected by the frontend
        // Even if no steps are found, return an empty array instead of 404
        res.json({
            data: stepsResult.recordset || [],
            project_id: projectId,
            project_name: project.project_name
        });
    } catch (error) {
        console.error('Error getting project steps:', error);
        res.status(500).json({ error: 'Failed to get project steps' });
    }
});

// GET tracked items for a project
app.get('/api/projects/:id/tracked-items', authenticateUser, async (req, res) => {
    try {
        const projectId = req.params.id;
        
        // First verify the project exists and user has access to it
        const projectQuery = `
            SELECT p.*, pr.program_name, pr.program_code
            FROM Projects p
            JOIN Programs pr ON p.program_id = pr.program_id
            WHERE p.project_id = @project_id
        `;
        
        const pool = req.app.locals.db;
        const projectRequest = pool.request();
        projectRequest.input('project_id', sql.Int, projectId);
        
        const projectResult = await projectRequest.query(projectQuery);
        
        if (projectResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        const project = projectResult.recordset[0];
        
        // Check program access for non-admin users
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(project.program_id)) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }
        
        // Get tracked items for the project with step progress information
        const trackedItemsQuery = `
            SELECT 
                ti.item_id,
                ti.project_id,
                ti.item_identifier,
                ti.current_overall_status,
                ti.is_shipped,
                ti.shipped_date,
                ti.date_fully_completed,
                ti.date_created,
                ti.last_modified,
                ti.created_by,
                ti.notes,
                -- Include step progress information
                (
                    SELECT 
                        tsp.step_id as stepId,
                        tsp.status,
                        tsp.date_completed as completedDate,
                        tsp.date_started as startedDate,
                        tsp.notes as stepNotes,
                        u.display_name as completed_by_user_name
                    FROM TrackedItemStepProgress tsp
                    LEFT JOIN Users u ON tsp.assigned_to = u.user_id
                    WHERE tsp.item_id = ti.item_id
                    FOR JSON PATH
                ) as step_statuses_json
            FROM TrackedItems ti
            WHERE ti.project_id = @project_id
            ORDER BY ti.date_created DESC
        `;
        
        const trackedItemsRequest = pool.request();
        trackedItemsRequest.input('project_id', sql.Int, projectId);
        
        const trackedItemsResult = await trackedItemsRequest.query(trackedItemsQuery);
        
        // Transform the data to parse the JSON step statuses
        const transformedItems = trackedItemsResult.recordset.map(item => {
            let step_statuses = [];
            if (item.step_statuses_json) {
                try {
                    step_statuses = JSON.parse(item.step_statuses_json);
                } catch (error) {
                    console.error('Error parsing step statuses JSON:', error);
                    step_statuses = [];
                }
            }
            
            // Remove the JSON field and add the parsed step_statuses
            const { step_statuses_json, ...itemWithoutJson } = item;
            return {
                ...itemWithoutJson,
                step_statuses: step_statuses
            };
        });
        
        // Return the tracked items in the format expected by the frontend
        res.json({ data: transformedItems });
    } catch (error) {
        console.error('Error getting tracked items:', error);
        res.status(500).json({ error: 'Failed to get tracked items' });
    }
});

// GET project attributes by project ID
app.get('/api/projects/:id/attributes', authenticateUser, async (req, res) => {
    try {
        const projectId = req.params.id;
        
        // First verify the project exists and user has access to it
        const projectQuery = `
            SELECT p.*, pr.program_name, pr.program_code
            FROM Projects p
            JOIN Programs pr ON p.program_id = pr.program_id
            WHERE p.project_id = @project_id
        `;
        
        const pool = req.app.locals.db;
        const projectRequest = pool.request();
        projectRequest.input('project_id', sql.Int, projectId);
        
        const projectResult = await projectRequest.query(projectQuery);
        
        if (projectResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        const project = projectResult.recordset[0];
        
        // Check program access for non-admin users
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(project.program_id)) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }
        
        // Get project attributes
        const attributesQuery = `
            SELECT 
                attribute_definition_id,
                project_id,
                attribute_name,
                attribute_type,
                display_order,
                is_required,
                is_auto_generated,
                default_value,
                validation_rules
            FROM AttributeDefinitions
            WHERE project_id = @project_id
            ORDER BY display_order, attribute_name
        `;
        
        const attributesRequest = pool.request();
        attributesRequest.input('project_id', sql.Int, projectId);
        
        const attributesResult = await attributesRequest.query(attributesQuery);
        
        // Return the attributes in the format expected by the frontend
        res.json(attributesResult.recordset || []);
    } catch (error) {
        console.error('Error getting project attributes:', error);
        res.status(500).json({ error: 'Failed to get project attributes' });
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
        if (!project_id || !attribute_name || !attribute_type) {
            return res.status(400).json({ error: 'Missing required fields: project_id, attribute_name, attribute_type' });
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
        
        // Insert the new attribute definition
        const insertQuery = `
            INSERT INTO AttributeDefinitions (
                project_id, 
                attribute_name, 
                attribute_type, 
                display_order, 
                is_required, 
                is_auto_generated,
                default_value, 
                validation_rules
            )
            OUTPUT INSERTED.*
            VALUES (@project_id, @attribute_name, @attribute_type, @display_order, @is_required, @is_auto_generated, @default_value, @validation_rules)
        `;
        
        const insertRequest = pool.request();
        insertRequest.input('project_id', sql.Int, project_id);
        insertRequest.input('attribute_name', sql.NVarChar, attribute_name);
        insertRequest.input('attribute_type', sql.NVarChar, attribute_type);
        insertRequest.input('display_order', sql.Int, display_order || 1);
        insertRequest.input('is_required', sql.Bit, is_required || false);
        insertRequest.input('is_auto_generated', sql.Bit, is_auto_generated || false);
        insertRequest.input('default_value', sql.NVarChar, default_value || null);
        insertRequest.input('validation_rules', sql.NVarChar, validation_rules || null);
        
        const insertResult = await insertRequest.query(insertQuery);
        
        if (insertResult.recordset.length === 0) {
            return res.status(500).json({ error: 'Failed to create attribute definition' });
        }
        
        // Return the created attribute definition
        res.status(201).json(insertResult.recordset[0]);
    } catch (error) {
        console.error('Error creating attribute definition:', error);
        res.status(500).json({ error: 'Failed to create attribute definition' });
    }
});

// POST (Create) a new project (with program access validation)
app.post('/api/projects', authenticateUser, checkProgramAccess('Write'), async (req, res) => {
    // Ensure the project is created in the validated program
    req.body.program_id = req.programId;
    req.body.created_by = req.user.user_id;
    
    const params = [{ name: 'ProjectJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
    await executeProcedure(res, 'usp_SaveProject', params);
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
            return res.status(404).json({ error: 'Project not found' });
        }
        
        const existingProject = checkResult.recordset[0];
        const projectProgramId = existingProject.program_id;
        const originalCreatedBy = existingProject.created_by;
        
        // Check program access
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(projectProgramId)) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }
        
        // Check write access level
        if (!req.user.is_system_admin) {
            const programAccess = req.user.program_access.find(p => p.program_id === projectProgramId);
            if (!programAccess || programAccess.access_level === 'Read') {
                return res.status(403).json({ error: 'Write access required to update projects' });
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
        await executeProcedure(res, 'usp_SaveProject', params);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Failed to update project' });
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
        
        // Start a transaction to handle cascade delete properly
        const transaction = new sql.Transaction(app.locals.db);
        await transaction.begin();
        
        try {
            // First, delete any pending orders associated with this project
            console.log(`🗑️ Deleting pending orders for project ${projectId}...`);
            const deletePendingOrdersResult = await new sql.Request(transaction)
                .input('project_id', sql.Int, projectId)
                .query('DELETE FROM PendingOrders WHERE project_id = @project_id');
            
            console.log(`🗑️ Deleted ${deletePendingOrdersResult.rowsAffected[0]} pending orders for project ${projectId}`);
            
            // Then delete the project itself
            console.log(`🗑️ Deleting project ${projectId}...`);
            const deleteProjectResult = await new sql.Request(transaction)
                .input('project_id', sql.Int, projectId)
                .query('DELETE FROM Projects WHERE project_id = @project_id');
            
            if (deleteProjectResult.rowsAffected[0] === 0) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Project not found or already deleted' });
            }
            
            // Commit the transaction
            await transaction.commit();
            
            console.log(`✅ Project "${project.project_name}" (ID: ${projectId}) and related data deleted by user ${req.user.user_id}`);
            
            res.json({ 
                success: true, 
                message: `Project "${project.project_name}" and ${deletePendingOrdersResult.rowsAffected[0]} related pending orders have been successfully deleted`,
                project_id: projectId,
                deleted_pending_orders: deletePendingOrdersResult.rowsAffected[0]
            });
            
        } catch (transactionError) {
            await transaction.rollback();
            throw transactionError;
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
        
        // Verify user has access to the project's program
        const pool = req.app.locals.db;
        const stepCheck = await pool.request()
            .input('step_id', sql.Int, req.params.id)
            .query(`
                SELECT ps.project_id, p.program_id 
                FROM ProjectSteps ps
                JOIN Projects p ON ps.project_id = p.project_id
                WHERE ps.step_id = @step_id
            `);
            
        if (stepCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Project step not found' });
        }
        
        const stepData = stepCheck.recordset[0];
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
        
        // First, verify the step exists and check user permissions
        const stepCheck = await new sql.Request(app.locals.db)
            .input('step_id', sql.Int, stepId)
            .query(`
                SELECT ps.step_name, ps.project_id, p.program_id 
                FROM ProjectSteps ps
                JOIN Projects p ON ps.project_id = p.project_id
                WHERE ps.step_id = @step_id
            `);
        
        if (stepCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Project step not found' });
        }
        
        const step = stepCheck.recordset[0];
        
        // Check if user has write access to this program
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(step.program_id)) {
            return res.status(403).json({ error: 'Access denied to this program' });
        }
        
        // Check if user has write permissions for this program
        const programAccess = req.user.program_access.find(p => p.program_id === step.program_id);
        if (!req.user.is_system_admin && (!programAccess || !['Write', 'Admin'].includes(programAccess.access_level))) {
            return res.status(403).json({ error: 'Write access required to delete project steps' });
        }
        
        // Delete the project step
        const deleteStepResult = await new sql.Request(app.locals.db)
            .input('step_id', sql.Int, stepId)
            .query('DELETE FROM ProjectSteps WHERE step_id = @step_id');
        
        if (deleteStepResult.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Project step not found or already deleted' });
        }
        
        console.log(`✅ Project step "${step.step_name}" (ID: ${stepId}) deleted by user ${req.user.user_id}`);
        
        res.json({ 
            success: true, 
            message: `Project step "${step.step_name}" has been successfully deleted`,
            step_id: stepId
        });
        
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
        
        // Verify user has access to the step's project's program
        const pool = req.app.locals.db;
        const stepCheck = await pool.request()
            .input('step_id', sql.Int, req.body.step_id)
            .query(`
                SELECT ps.project_id, p.program_id 
                FROM ProjectSteps ps
                JOIN Projects p ON ps.project_id = p.project_id
                WHERE ps.step_id = @step_id
            `);
            
        if (stepCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Project step not found' });
        }
        
        const stepData = stepCheck.recordset[0];
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
        
        // Verify user has access to the step's project's program
        const pool = req.app.locals.db;
        const reqCheck = await pool.request()
            .input('requirement_id', sql.Int, req.params.id)
            .query(`
                SELECT sir.step_id, ps.project_id, p.program_id 
                FROM StepInventoryRequirements sir
                JOIN ProjectSteps ps ON sir.step_id = ps.step_id
                JOIN Projects p ON ps.project_id = p.project_id
                WHERE sir.requirement_id = @requirement_id
            `);
            
        if (reqCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Step inventory requirement not found' });
        }
        
        const reqData = reqCheck.recordset[0];
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
        
        // First, verify the requirement exists and check user permissions
        const reqCheck = await new sql.Request(app.locals.db)
            .input('requirement_id', sql.Int, requirementId)
            .query(`
                SELECT sir.requirement_id, sir.step_id, ps.project_id, p.program_id, ii.item_name
                FROM StepInventoryRequirements sir
                JOIN ProjectSteps ps ON sir.step_id = ps.step_id
                JOIN Projects p ON ps.project_id = p.project_id
                JOIN InventoryItems ii ON sir.inventory_item_id = ii.inventory_item_id
                WHERE sir.requirement_id = @requirement_id
            `);
        
        if (reqCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Step inventory requirement not found' });
        }
        
        const requirement = reqCheck.recordset[0];
        
        // Check if user has write access to this program
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(requirement.program_id)) {
            return res.status(403).json({ error: 'Access denied to this program' });
        }
        
        // Check if user has write permissions for this program
        const programAccess = req.user.program_access.find(p => p.program_id === requirement.program_id);
        if (!req.user.is_system_admin && (!programAccess || !['Write', 'Admin'].includes(programAccess.access_level))) {
            return res.status(403).json({ error: 'Write access required to delete inventory requirements' });
        }
        
        // Delete the requirement
        const deleteResult = await new sql.Request(app.locals.db)
            .input('requirement_id', sql.Int, requirementId)
            .query('DELETE FROM StepInventoryRequirements WHERE requirement_id = @requirement_id');
        
        if (deleteResult.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Step inventory requirement not found or already deleted' });
        }
        
        console.log(`✅ Step inventory requirement for "${requirement.item_name}" (ID: ${requirementId}) deleted by user ${req.user.user_id}`);
        
        res.json({ 
            success: true, 
            message: `Step inventory requirement for "${requirement.item_name}" has been successfully deleted`,
            requirement_id: requirementId
        });
        
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
        const pool = req.app.locals.db;
        const result = await pool.request()
            .input('notification_id', sql.Int, req.params.id)
            .input('user_id', sql.Int, req.user.user_id)
            .query(`
                UPDATE Notifications 
                SET is_read = 1, date_read = GETDATE()
                WHERE notification_id = @notification_id AND user_id = @user_id
            `);
            
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        res.json({ message: 'Notification marked as read' });
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
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ error: 'Failed to get users' });
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
        
        res.setHeader('Content-Type', 'application/json');

        if (result.recordset && result.recordset.length > 0) {
            const data = result.recordset[0];
            res.status(200).send(JSON.stringify(data, null, 2));
        } else {
            res.status(200).send(JSON.stringify({ message: 'Program created successfully' }, null, 2));
        }
    } catch (error) {
        console.error('Error creating program:', error);
        res.status(500).json({ error: 'Failed to create program', details: error.message });
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

// POST add item to shopping cart
app.post('/api/cart/add', authenticateUser, async (req, res) => {
    try {
        const { inventory_item_id, quantity_requested, estimated_cost, notes } = req.body;
        
        // Validate required fields
        if (!inventory_item_id || !quantity_requested) {
            return res.status(400).json({ 
                error: 'inventory_item_id and quantity_requested are required' 
            });
        }

        // Validate quantity is positive
        if (quantity_requested <= 0) {
            return res.status(400).json({ 
                error: 'quantity_requested must be greater than 0' 
            });
        }

        // Validate estimated_cost if provided
        if (estimated_cost !== undefined && estimated_cost < 0) {
            return res.status(400).json({ 
                error: 'estimated_cost cannot be negative' 
            });
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
        const pool = req.app.locals.db;
        const request = pool.request();
        request.input('CartItemJson', sql.NVarChar, JSON.stringify(cartItemJson));
        
        const result = await request.execute('usp_AddToCart');

        res.json({
            success: true,
            message: 'Item added to cart successfully', 
            user_id: req.user.user_id,
            cart_summary: result.recordset[0] || {}
        });
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ error: 'Failed to add item to cart' });
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

        const request = new sql.Request(app.locals.db);
        const result = await request
            .input('user_id', sql.Int, req.user.user_id)
            .input('project_id', sql.Int, project_id)
            .input('order_notes', sql.NVarChar(sql.MAX), order_notes || null)
            .input('supplier_info', sql.NVarChar(500), supplier_info || null)
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
        res.status(500).json({ error: 'Failed to mark order as received' });
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
        const pool = req.app.locals.db;
        const { id } = req.params;
        
        const result = await pool.request()
            .input('task_id', sql.Int, parseInt(id))
            .query(`
                DELETE FROM Tasks WHERE task_id = @task_id
            `);
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        res.json({ success: true, message: 'Task deleted successfully' });
        
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
// PROCUREMENT MANAGEMENT ROUTES
// =============================================================================

// Mount procurement routes with database connection
app.use('/api', (req, res, next) => {
    req.db = app.locals.db;
    next();
}, procurementRoutes);

// Export app for testing
module.exports = app;

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