// h10cm_api.js - H10CM Multi-Tenant API Server

// -----------------------------------------------------------------------------
// SETUP & DEPENDENCIES
// -----------------------------------------------------------------------------
const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// -----------------------------------------------------------------------------
// MIDDLEWARE
// -----------------------------------------------------------------------------
app.use(cors());
app.use(express.json());

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
        
        // Look up user in database
        const userResult = await pool.request()
            .input('certificate_subject', sql.NVarChar, certSubject)
            .query(`
                SELECT u.user_id, u.user_name, u.display_name, u.is_system_admin,
                       JSON_QUERY((
                           SELECT pa.program_id, pa.access_level, p.program_name, p.program_code
                           FROM ProgramAccess pa 
                           JOIN Programs p ON pa.program_id = p.program_id
                           WHERE pa.user_id = u.user_id AND pa.is_active = 1
                           FOR JSON PATH
                       )) as program_access
                FROM Users u
                WHERE u.certificate_subject = @certificate_subject AND u.is_active = 1
            `);

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
        const programId = req.params.programId || req.query.program_id || req.body.program_id;
        
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

        if (result.recordset && result.recordset.length > 0 && result.recordset[0][Object.keys(result.recordset[0])[0]]) {
            const jsonResultString = result.recordset[0][Object.keys(result.recordset[0])[0]];
            console.log('JSON result string:', jsonResultString);
            const data = JSON.parse(jsonResultString);
            
            if (data.error) {
                console.log('Procedure returned error:', data.error);
                return res.status(400).send(JSON.stringify(data, null, 2));
            }
            if (data.SuccessMessage || data.WarningMessage) {
                console.log('Procedure returned success/warning:', data);
                return res.status(200).send(JSON.stringify(data, null, 2));
            }
            
            console.log('Procedure returned data:', data);
            res.status(200).send(JSON.stringify(data, null, 2));
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

  const response = {
    user: {
      user_id: req.user.user_id,
      username: req.user.user_name,
      displayName: req.user.display_name,
      is_system_admin: req.user.is_system_admin,
      program_access: req.user.program_access,
      accessible_programs: req.user.accessible_programs
    }
  };

  // Only include certificate and debug info for system admins
  if (req.user.is_system_admin) {
    response.user.certificateInfo = {
      subject: clientCert,
      issuer: req.headers['x-arr-ssl'] || "",
      serialNumber: ""
    };
    response.headers = {
      ...req.headers,
      'x-arr-clientcert': clientCert
    };
    response.extractedFrom = req.headers['x-arr-clientcert'] ? 'certificate' : 'fallback';
    response.request = {
      ip: req.headers['x-forwarded-for'] || req.ip,
      method: req.method,
      path: req.path,
      protocol: req.protocol,
      secure: req.secure
    };
  }

  res.json(response);
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
            .query('SELECT COUNT(*) as program_count FROM Programs WHERE is_active = 1');
        
        const hasPrograms = programCountResult.recordset[0].program_count > 0;
        
        if (!hasPrograms) {
            // No programs exist, allow unauthenticated access for initial setup
            return res.json([]);
        }

        // Programs exist, check authentication
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            // No auth provided and it's not an initial setup, require authentication
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Try authentication, but continue if it fails (for initial setup)
        try {
            await new Promise((resolve, reject) => {
                authenticateUser(req, res, (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        } catch (authError) {
            // Authentication failed, but allow for setup purposes
            return res.status(401).json({ error: 'Authentication failed' });
        }

        // Authentication successful, proceed with filtered results
        let query = `
            SELECT program_id, program_name, program_code, program_description, 
                   is_active, date_created, program_manager
            FROM Programs 
            WHERE is_active = 1
        `;
        
        // Non-admin users only see their accessible programs
        if (!req.user.is_system_admin && req.user.accessible_programs.length > 0) {
            query += ` AND program_id IN (${req.user.accessible_programs.join(',')})`;
        }
        
        query += ` ORDER BY program_name`;
        
        const result = await pool.request().query(query);
        res.json(result.recordset);
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
            .query('SELECT COUNT(*) as program_count FROM Programs WHERE is_active = 1');
        
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
            .query('SELECT COUNT(*) as admin_count FROM Users WHERE is_system_admin = 1 AND is_active = 1');
        
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
        let query = `
            SELECT p.project_id, p.program_id, p.project_name, p.project_description, 
                   p.status, p.priority, pr.program_name, pr.program_code,
                   pm.display_name as project_manager_name,
                   p.date_created, p.last_modified, p.project_start_date, p.project_end_date
            FROM Projects p
            JOIN Programs pr ON p.program_id = pr.program_id
            LEFT JOIN Users pm ON p.project_manager_id = pm.user_id
            WHERE pr.is_active = 1
        `;
        
        // Filter by program access for non-admin users
        if (!req.user.is_system_admin && req.user.accessible_programs.length > 0) {
            query += ` AND p.program_id IN (${req.user.accessible_programs.join(',')})`;
        }
        
        // Filter by specific program if requested
        if (req.query.program_id) {
            query += ` AND p.program_id = ${parseInt(req.query.program_id)}`;
        }
        
        query += ` ORDER BY p.project_name`;
        
        await executeQuery(req, res, query);
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
        // First, verify user has access to this project's program
        const pool = req.app.locals.db;
        const checkResult = await pool.request()
            .input('project_id', sql.Int, req.params.id)
            .query('SELECT program_id FROM Projects WHERE project_id = @project_id');
            
        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        const projectProgramId = checkResult.recordset[0].program_id;
        
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
        req.body.program_id = projectProgramId; // Ensure program_id doesn't change
        
        const params = [{ name: 'ProjectJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
        await executeProcedure(res, 'usp_SaveProject', params);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// DELETE project (with program and access validation)
app.delete('/api/projects/:id', authenticateUser, async (req, res) => {
    try {
        const pool = req.app.locals.db;
        const projectId = parseInt(req.params.id, 10);
        
        // First, verify user has access to this project's program
        const checkResult = await pool.request()
            .input('project_id', sql.Int, projectId)
            .query('SELECT program_id FROM Projects WHERE project_id = @project_id');
            
        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        const projectProgramId = checkResult.recordset[0].program_id;
        
        // Check program access
        if (!req.user.is_system_admin && !req.user.accessible_programs.includes(projectProgramId)) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }
        
        // Check write access level (Admin level required for deletion)
        if (!req.user.is_system_admin) {
            const programAccess = req.user.program_access.find(p => p.program_id === projectProgramId);
            if (!programAccess || programAccess.access_level !== 'Admin') {
                return res.status(403).json({ error: 'Admin access required to delete projects' });
            }
        }
        
        // Begin transaction to ensure all deletions succeed or fail together
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            // Delete related records first (in correct order due to foreign key constraints)
            // Note: Only deleting tables that actually exist in the current database
            
            // 1. Delete Tasks (depends on Projects)
            await transaction.request()
                .input('project_id', sql.Int, projectId)
                .query('DELETE FROM Tasks WHERE project_id = @project_id');
            
            // 2. Delete ProjectAccess (depends on Projects)
            await transaction.request()
                .input('project_id', sql.Int, projectId)
                .query('DELETE FROM ProjectAccess WHERE project_id = @project_id');
            
            // 3. Delete UserRoles (depends on Projects)
            await transaction.request()
                .input('project_id', sql.Int, projectId)
                .query('DELETE FROM UserRoles WHERE project_id = @project_id');
            
            // 4. Delete ProjectSteps (depends on Projects - has CASCADE DELETE)
            await transaction.request()
                .input('project_id', sql.Int, projectId)
                .query('DELETE FROM ProjectSteps WHERE project_id = @project_id');
            
            // 5. Delete TrackedItems (depends on Projects - has CASCADE DELETE)
            await transaction.request()
                .input('project_id', sql.Int, projectId)
                .query('DELETE FROM TrackedItems WHERE project_id = @project_id');
            
            // 6. Finally, delete the project itself
            await transaction.request()
                .input('project_id', sql.Int, projectId)
                .query('DELETE FROM Projects WHERE project_id = @project_id');
            
            // Commit the transaction
            await transaction.commit();
            
            res.json({ 
                success: true, 
                message: 'Project deleted successfully',
                project_id: projectId 
            });
            
        } catch (transactionError) {
            // Rollback the transaction on error
            await transaction.rollback();
            throw transactionError;
        }
        
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Failed to delete project: ' + error.message });
    }
});

// =============================================================================
// TASK ENDPOINTS (WITH PROGRAM FILTERING)
// =============================================================================

// GET tasks (filtered by user's program access)
app.get('/api/tasks', authenticateUser, async (req, res) => {
    try {
        let query = `
            SELECT t.task_id, t.program_id, t.task_title, t.priority, t.status, 
                   t.completion_percentage, t.due_date, t.date_created,
                   assigned_user.display_name AS assigned_to_name,
                   assigner.display_name AS assigned_by_name,
                   p.project_name, pr.program_name
            FROM Tasks t
            LEFT JOIN Users assigned_user ON t.assigned_to = assigned_user.user_id
            LEFT JOIN Users assigner ON t.assigned_by = assigner.user_id
            LEFT JOIN Projects p ON t.project_id = p.project_id
            LEFT JOIN Programs pr ON t.program_id = pr.program_id
            WHERE 1=1
        `;
        
        // Filter by program access for non-admin users
        if (!req.user.is_system_admin && req.user.accessible_programs.length > 0) {
            query += ` AND t.program_id IN (${req.user.accessible_programs.join(',')})`;
        }
        
        // Filter by assigned user if requested
        if (req.query.assigned_to_me === 'true') {
            query += ` AND t.assigned_to = ${req.user.user_id}`;
        }
        
        // Filter by program
        if (req.query.program_id) {
            query += ` AND t.program_id = ${parseInt(req.query.program_id)}`;
        }
        
        // Filter by project
        if (req.query.project_id) {
            query += ` AND t.project_id = ${parseInt(req.query.project_id)}`;
        }
        
        query += ` ORDER BY t.due_date, t.priority DESC`;
        
        await executeQuery(req, res, query);
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
        let query = `
            SELECT ii.inventory_item_id, ii.item_name, ii.part_number, 
                   ii.description, ii.category, ii.unit_of_measure, ii.current_stock_level,
                   ii.reorder_point, ii.cost_per_unit, ii.location, ii.is_active,
                   ii.supplier_info, ii.max_stock_level, ii.date_created, ii.last_modified,
                   ii.program_id, u.display_name as created_by_name
            FROM InventoryItems ii
            LEFT JOIN Users u ON ii.created_by = u.user_id
            WHERE ii.is_active = 1
        `;
        
        // Filter by program access for non-admin users
        if (!req.user.is_system_admin && req.user.accessible_programs.length > 0) {
            query += ` AND ii.program_id IN (${req.user.accessible_programs.join(',')})`;
        }
        
        // Add any additional filters
        if (req.query.category) {
            query += ` AND ii.category = '${req.query.category}'`;
        }
        
        if (req.query.low_stock) {
            query += ` AND ii.current_stock_level <= ISNULL(ii.reorder_point, 0)`;
        }
        
        query += ` ORDER BY ii.item_name`;
        
        const request = new sql.Request(app.locals.db);
        const result = await request.query(query);
        
        // Filter results by user's program access if not system admin
        let filteredData = result.recordset;
        if (!req.user.is_system_admin && filteredData.length > 0 && filteredData[0].hasOwnProperty('program_id')) {
            filteredData = filterByProgramAccess(filteredData, req.user);
        }
        
        res.json({ data: filteredData });
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
        const query = `
            SELECT notification_id, category, title, message, priority, is_read, 
                   is_actionable, action_url, action_text, date_created
            FROM Notifications
            WHERE user_id = @user_id 
            AND (expires_at IS NULL OR expires_at > GETDATE())
            ORDER BY date_created DESC
        `;
        
        const params = [{ name: 'user_id', type: sql.Int, value: req.user.user_id }];
        
        const pool = req.app.locals.db;
        const request = pool.request();
        params.forEach(param => {
            request.input(param.name, param.type, param.value);
        });
        
        const result = await request.query(query);
        res.json(result.recordset);
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
// HEALTH CHECK ENDPOINTS
// =============================================================================

// Health check endpoints
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
            .query('SELECT COUNT(*) as admin_count FROM Users WHERE is_system_admin = 1 AND is_active = 1');
        
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
        const query = `
            SELECT u.user_id, u.user_name, u.display_name, u.email, u.is_active, u.is_system_admin,
                   u.last_login, u.date_created,
                   JSON_QUERY((
                       SELECT pa.program_id, pa.access_level, p.program_name
                       FROM ProgramAccess pa 
                       JOIN Programs p ON pa.program_id = p.program_id
                       WHERE pa.user_id = u.user_id AND pa.is_active = 1
                       FOR JSON PATH
                   )) as program_access
            FROM Users u
            WHERE u.is_active = 1
            ORDER BY u.display_name
        `;
        
        const result = await pool.request().query(query);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
};

// Helper function for program creation logic
const createProgramLogic = async (req, res, pool) => {
    const { program_name, program_code, program_description } = req.body;
    
    try {
        const params = [
            { name: 'ProgramName', type: sql.NVarChar, value: program_name },
            { name: 'ProgramCode', type: sql.NVarChar, value: program_code },
            { name: 'ProgramDescription', type: sql.NVarChar, value: program_description },
            { name: 'CreatedBy', type: sql.NVarChar, value: req.user ? req.user.user_name : 'System' }
        ];
        
        const request = pool.request();
        params.forEach(param => {
            request.input(param.name, param.type, param.value);
        });

        const result = await request.execute('usp_AddNewTenant');
        
        res.setHeader('Content-Type', 'application/json');

        if (result.recordset && result.recordset.length > 0 && result.recordset[0][Object.keys(result.recordset[0])[0]]) {
            const jsonResultString = result.recordset[0][Object.keys(result.recordset[0])[0]];
            const data = JSON.parse(jsonResultString);
            
            if (data.error) {
                return res.status(400).send(JSON.stringify(data, null, 2));
            }
            if (data.SuccessMessage || data.WarningMessage) {
                return res.status(200).send(JSON.stringify(data, null, 2));
            }
            
            res.status(200).send(JSON.stringify(data, null, 2));
        } else {
            res.status(200).send(JSON.stringify({ message: 'Program created successfully' }, null, 2));
        }
    } catch (error) {
        console.error('Error creating program:', error);
        res.status(500).json({ error: 'Failed to create program' });
    }
};

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
        const { project_id } = req.query;
        
        const request = new sql.Request(app.locals.db);
        const result = await request
            .input('user_id', sql.Int, req.user.user_id)
            .input('project_id', sql.Int, project_id || null)
            .execute('usp_GetPendingOrders');

        res.json({
            success: true,
            orders: result.recordset,
            user_id: req.user.user_id,
            project_id: project_id
        });
    } catch (error) {
        console.error('Error getting pending orders:', error);
        res.status(500).json({ error: 'Failed to get pending orders' });
    }
});

// GET specific pending order by ID
app.get('/api/orders/pending/:orderId', authenticateUser, async (req, res) => {
    try {
        const orderId = parseInt(req.params.orderId);
        
        // Validate order ID
        if (isNaN(orderId) || orderId <= 0) {
            return res.status(400).json({ error: 'Invalid order ID' });
        }

        console.log(`Getting pending order ${orderId} for user ${req.user.user_id}`);

        // Execute query to get specific order
        const pool = req.app.locals.db;
        const request = pool.request();
        request.input('user_id', sql.Int, req.user.user_id);
        request.input('order_id', sql.Int, orderId);
        
        const result = await pool.request()
            .input('user_id', sql.Int, req.user.user_id)
            .query(`
                SELECT 
                    po.order_id as pending_order_id,
                    po.order_number,
                    po.user_id,
                    po.project_id,
                    po.status,
                    po.total_estimated_cost,
                    po.supplier_info,
                    po.order_notes as notes,
                    po.date_created,
                    po.date_approved,
                    po.approved_by,
                    po.date_ordered,
                    po.ordered_by,
                    po.expected_delivery_date,
                    po.actual_delivery_date,
                    po.last_modified,
                    poi.inventory_item_id,
                    ii.item_name,
                    ii.unit_of_measure,
                    poi.quantity_ordered as quantity_requested,
                    poi.unit_cost,
                    poi.total_cost,
                    poi.notes as item_notes
                FROM PendingOrders po
                INNER JOIN PendingOrderItems poi ON po.order_id = poi.order_id
                INNER JOIN InventoryItems ii ON poi.inventory_item_id = ii.inventory_item_id
                INNER JOIN ProgramAccess pa ON po.program_id = pa.program_id
                WHERE po.order_id = @order_id AND pa.user_id = @user_id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Return the first record (assuming single order item for now)
        const order = result.recordset[0];
        res.json(order);
    } catch (error) {
        console.error('Error getting pending order:', error);
        res.status(500).json({ error: 'Failed to get pending order' });
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

// PUT update order status (general status update endpoint)
app.put('/api/orders/:orderId/status', authenticateUser, async (req, res) => {
    try {
        const orderId = parseInt(req.params.orderId);
        const { status, notes } = req.body;
        
        // Validate order ID
        if (isNaN(orderId) || orderId <= 0) {
            return res.status(400).json({ error: 'Invalid order ID' });
        }

        // Validate status
        const validStatuses = ['Pending', 'Approved', 'Ordered', 'Received', 'Cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
        }

        console.log(`Updating order ${orderId} status to ${status} by user ${req.user.user_id}`);

        // Build the JSON object for the stored procedure
        const orderUpdateJson = {
            order_id: orderId,
            user_id: req.user.user_id,
            status: status,
            notes: notes || null
        };

        console.log('Updating order status with JSON:', JSON.stringify(orderUpdateJson, null, 2));

        // Execute the stored procedure with JSON parameter
        const pool = req.app.locals.db;
        const request = pool.request();
        request.input('OrderUpdateJson', sql.NVarChar, JSON.stringify(orderUpdateJson));
        
        const result = await request.execute('usp_UpdateOrderStatus');
        
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
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`H10CM Multi-Tenant API server running on port ${PORT}`);
    console.log(`Database: H10CM (Multi-Tenant Architecture)`);
    console.log(`Features: Program-level isolation, RBAC, Certificate Authentication`);
    console.log(`Health Check: http://localhost:${PORT}/api/health`);
    console.log(`Auth Test: http://localhost:${PORT}/api/auth/me`);
    console.log(`Programs: http://localhost:${PORT}/api/programs`);
});