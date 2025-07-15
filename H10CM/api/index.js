// server.js

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
    database: "H10CM",
    port: 1433,
    options: {
        encrypt: true,
        enableArithAbort: true,
        trustServerCertificate: true
    }
};

sql.connect(dbConfig).then(pool => {
    console.log('Connected to H10CM Database (unified multi-tenant system)');
    app.locals.db = pool;
}).catch(err => {
    console.error('Database Connection Failed!', err);
});

// -----------------------------------------------------------------------------
// API HELPER FUNCTION (Your existing helper function)
// -----------------------------------------------------------------------------
const executeProcedure = async (res, procedureName, params = []) => {
    try {
        const pool = res.app.locals.db;
        if (!pool) {
            throw new Error("Database not connected. Check your configuration.");
        }
        
        const request = pool.request();
        
        params.forEach(param => {
            request.input(param.name, param.type, param.value);
        });

        const result = await request.execute(procedureName);
        
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
    res.send('TFPM API is running!');
});

const DEFAULT_USER_CERT = "MIIFRDCCBCygAwIBAgIDBnVHMA0GCSqGSIb3DQEBCwUAMFoxCzAJBgNVBAYTAlVTMRgwFgYDVQQKEw9VLlMuIEdvdmVybm1lbnQxDDAKBgNVBAsTA0RvRDEMMAoGA1UECxMDUEtJMRUwEwYDVQQDEwxET0QgSUQgQ0EtNzMwHhcNMjQwNzA5MDAwMDAwWhcNMjcwNzA4MjM1OTU5WjB/MQswCQYDVQQGEwJVUzEYMBYGA1UEChMPVS5TLiBHb3Zlcm5tZW50MQwwCgYDVQQLEwNEb0QxDDAKBgNVBAsTA1BLSTEMMAoGA1UECxMDVVNOMSwwKgYDVQQDEyNET1VHSEVSVFkuSlVTVElOLk1JQ0hBRUwuMTI1MDIyNzIyODCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAJ98y7xGmNrfVUtSA85i9EzyFfzpWLZvQfWv3KMvE9tdvjYLpi9wf1Mm440NZSdsn+VBSruZyb7s7EWa9Jiw19A4AsHHTm0PDUmIt5WbGPcXsszc/6eL/VEsR2V/gp5mhl96Az5ct/fMIslFhh5UX+H7ma8K56Hwir1vIc/Be80fQBulMwzGHz0vWOyQ0AWDtLWf6VdpYJV+Vjv0SC+H3pgIbEZL91Vwwmd1i8PzHi5BojfQIhI64IQuKqyPcZrLgmA3trNpHPJP8hdw4fe8I+N6TAjH/NkaB2BICis5pIbnmlrUyac60jr9qtavfBNfjtHTC9NQtQSv7+oQzMvqL5kCAwEAAaOCAewwggHoMB8GA1UdIwQYMBaAFOkhe/IUbzhViHqgUAmekXIcS9k7MDcGA1UdHwQwMC4wLKAqoCiGJmh0dHA6Ly9jcmwuZGlzYS5taWwvY3JsL0RPRElEQ0FfNzMuY3JsMA4GA1UdDwEB/wQEAwIHgDAkBgNVHSAEHTAbMAsGCWCGSAFlAgELKjAMBgpghkgBZQMCAQMNMB0GA1UdDgQWBBTjksZ1APK0JkryT88aMZw9hGjSvDBlBggrBgEFBQcBAQRZMFcwMwYIKwYBBQUHMAKGJ2h0dHA6Ly9jcmwuZGlzYS5taWwvc2lnbi9ET0RJRENBXzczLmNlcjAgBggrBgEFBQcwAYYUaHR0cDovL29jc3AuZGlzYS5taWwwgYgGA1UdEQSBgDB+oCcGCGCGSAFlAwYGoBsEGdT4ENs8CGwUVIGtg2DaCKhQjiEChDgQo/OgJAYKwYBBAGCNxQCA6AWDBQxMjUwMjI3MjI4MTE3MDAyQG1pbIYtdXJuOnV1aWQ6QTQ4NkZFRTctNDE4NS00NTAyLUEzOTQtRDVERUNDRUJBNkUzMBsGA1UdCQQUMBIwEAYIKwYBBQUHCQQxBBMCVVMwKAYDVR0lBCEwHwYKKwYBBAGCNxQCAgYIKwYBBQUHAwIGBysGAQUCAwQwDQYJKoZIhvcNAQELBQADggEBAFc6ZODAlHhmEInPE9vnPpGOYBaFhQ06RDDxft3UDKn9oxB0gxogFAs/5kMIJE+wn9mjazLH/B2VnizUfXarFZcPCP3aziNeVAWH/ZjqMq8PxUvV1PJdVxVJu1cU6XberkTs5dgHNSlAb39Qdl/OQANERHa1pUdCgHscIeGl2TrvprzXD3zf0WsFI57hNeil6KUazf3u3pXuN2P00cv3ryEOw7CzC2IO0Q61Yn/vAjCprVh3IhoIkF0yPrYhUiP5qqTLyhynDynnDYwbnt/ZGQYaLiC+gNFxZwkQJtGHVXlb7WOW0zRZI3QaBSielwK1eawfdq/J2SCtT3YHriwKeaI=";

// Known certificate subject for the DEFAULT_USER_CERT
const DEFAULT_CERT_SUBJECT = "CN=DOUGHERTY.JUSTIN.MICHAEL.1250227228,OU=USN,OU=PKI,OU=DoD,O=U.S. Government,C=US";

// Function to extract certificate subject from full certificate or return as-is if already a subject
function getCertificateSubject(certData) {
    // If it's already a certificate subject (starts with CN=), return it
    if (certData.startsWith('CN=')) {
        return certData;
    }
    
    // If it's the DEFAULT_USER_CERT, return the known subject
    if (certData === DEFAULT_USER_CERT) {
        return DEFAULT_CERT_SUBJECT;
    }
    
    // For other full certificates, we'd need to parse them
    // For now, return as-is and let the database query handle it
    return certData;
}


app.get("/api/auth/me", async (req, res) => {
  console.log("Headers received:", JSON.stringify(req.headers, null, 2));

  try {
    // 1. If the request has x-arr-clientcert, use it; otherwise fallback to DEFAULT_USER_CERT.
    const clientCert = req.headers['x-arr-clientcert'] || DEFAULT_USER_CERT;
    
    // 2. Extract the certificate subject for database lookup
    const certSubject = getCertificateSubject(clientCert);
    
    // 3. Query the database to find the user by certificate subject
    const pool = req.app.locals.db;
    if (!pool) {
      throw new Error("Database not connected");
    }
    
    const result = await pool.request()
      .input('certificate_subject', sql.NVarChar, certSubject)
      .query(`
        SELECT 
          u.user_id,
          u.user_name,
          u.display_name,
          u.email,
          u.is_system_admin,
          u.is_active,
          r.role_name,
          CASE 
            WHEN u.is_system_admin = 1 THEN 'Site Admin'
            WHEN r.role_name IS NOT NULL THEN r.role_name
            ELSE 'User'
          END as effective_role
        FROM Users u
        LEFT JOIN UserRoles ur ON u.user_id = ur.user_id
        LEFT JOIN Roles r ON ur.role_id = r.role_id
        WHERE u.certificate_subject = @certificate_subject
      `);
    
    let user = {
      username: "",
      displayName: "",
      role: "Guest",
      isSystemAdmin: false,
      certificateInfo: {
        subject: certSubject,
        issuer: req.headers['x-arr-ssl'] || "",
        serialNumber: ""
      }
    };
    
    // 4. If user found in database, populate the user info
    if (result.recordset && result.recordset.length > 0) {
      const dbUser = result.recordset[0];
      user = {
        userId: dbUser.user_id,
        username: dbUser.user_name,
        displayName: dbUser.display_name,
        email: dbUser.email || "",
        role: dbUser.effective_role, // This should now be "Site Admin" for system admins
        isSystemAdmin: dbUser.is_system_admin,
        isActive: dbUser.is_active,
        certificateInfo: {
          subject: certSubject,
          issuer: req.headers['x-arr-ssl'] || "",
          serialNumber: ""
        }
      };
    }

    // 5. Return JSON with proper user information
    res.json({
      user: user,
      // For clarity, place the raw certificate in 'headers' so the front end can find it:
      headers: {
        ...req.headers,             // original request headers for reference
        'x-arr-clientcert': clientCert // ensure fallback or real cert is set
      },
      extractedFrom: req.headers['x-arr-clientcert'] ? 'certificate' : 'fallback',
      authenticated: result.recordset && result.recordset.length > 0,
      certificateSubject: certSubject, // Include for debugging
      request: {
        ip: req.headers['x-forwarded-for'] || req.ip,
        method: req.method,
        path: req.path,
        protocol: req.protocol,
        secure: req.secure
      }
    });
    
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    res.status(500).json({
      error: 'Authentication failed',
      user: {
        username: "",
        displayName: "",
        role: "Guest",
        isSystemAdmin: false,
        certificateInfo: {
          subject: req.headers['x-arr-clientcert'] || DEFAULT_USER_CERT,
          issuer: req.headers['x-arr-ssl'] || "",
          serialNumber: ""
        }
      }
    });
  }
});


// Health check endpoints for testing
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.get('/api/health/db', async (req, res) => {
    try {
        const pool = app.locals.db;
        if (pool && pool.connected) {
            res.status(200).json({
                database: 'connected',
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
// PROJECTS
// =============================================================================

// GET all projects - <<< THIS IS THE REVISED SECTION >>>
app.get('/api/projects', async (req, res) => {
    try {
        const pool = app.locals.db;
        if (!pool) {
            throw new Error("Database not connected.");
        }
        
        const result = await pool.request().execute('usp_GetProjects');

        if (result.recordset && result.recordset.length > 0) {
            // Extract the single JSON string from the database result.
            const jsonString = result.recordset[0][Object.keys(result.recordset[0])[0]];
            
            // Parse the string into a JavaScript array of project objects.
            let projects = JSON.parse(jsonString);

            // Sort the array numerically by project_id to guarantee order.
            projects.sort((a, b) => a.project_id - b.project_id);
            
            // --- The Fix ---
            // 1. Manually set the Content-Type header to ensure it's treated as JSON.
            res.setHeader('Content-Type', 'application/json');
            
            // 2. Manually stringify the sorted array with pretty-printing (2 spaces).
            //    This sends a clean, formatted string as the response body.
            res.status(200).send(JSON.stringify(projects, null, 2));

        } else {
            // If no data, return an empty array with the correct content type.
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send('[]');
        }
    } catch (error) {
        console.error('Error in /api/projects:', error);
        res.status(500).json({ error: 'Failed to get projects.' });
    }
});

// GET a single project by ID
app.get('/api/projects/:id', async (req, res) => {
    const params = [{ name: 'project_id', type: sql.Int, value: req.params.id }];
    await executeProcedure(res, 'usp_GetProjectById', params);
});

// POST (Create) a new project
app.post('/api/projects', async (req, res) => {
    const params = [{ name: 'ProjectJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
    await executeProcedure(res, 'usp_SaveProject', params);
});

// PUT (Update) an existing project
app.put('/api/projects/:id', async (req, res) => {
    req.body.project_id = parseInt(req.params.id, 10);
    const params = [{ name: 'ProjectJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
    await executeProcedure(res, 'usp_SaveProject', params);
});

// DELETE a project
app.delete('/api/projects/:id', async (req, res) => {
    try {
        const pool = res.app.locals.db;
        if (!pool) {
            throw new Error("Database not connected. Check your configuration.");
        }
        
        const projectId = parseInt(req.params.id, 10);
        console.log(`Deleting project with ID: ${projectId}`);
        
        // Simple delete query - in production you'd want to handle cascading deletes
        const result = await pool.request()
            .input('project_id', sql.Int, projectId)
            .query('DELETE FROM Projects WHERE project_id = @project_id');
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// GET project attributes
app.get('/api/projects/:projectId/attributes', async (req, res) => {
    try {
        const pool = res.app.locals.db;
        if (!pool) {
            throw new Error("Database not connected. Check your configuration.");
        }
        
        const request = pool.request();
        request.input('project_id', sql.Int, req.params.projectId);
        
        const result = await request.query(`
            SELECT 
                attribute_definition_id,
                project_id,
                attribute_name,
                attribute_type,
                display_order,
                is_required
            FROM AttributeDefinitions
            WHERE project_id = @project_id
            ORDER BY display_order
        `);
        
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(JSON.stringify(result.recordset, null, 2));
        
    } catch (error) {
        console.error('Error getting project attributes:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).send(JSON.stringify({ error: error.message }, null, 2));
    }
});

// =============================================================================
// INVENTORY ITEMS
// =============================================================================

// GET all inventory items
app.get('/api/inventory-items', async (req, res) => {
    await executeProcedure(res, 'usp_GetInventoryItems');
});

// GET a single inventory item by ID
app.get('/api/inventory-items/:id', async (req, res) => {
    const params = [{ name: 'inventory_item_id', type: sql.Int, value: req.params.id }];
    await executeProcedure(res, 'usp_GetInventoryItemById', params);
});

// POST (Create) a new inventory item
app.post('/api/inventory-items', async (req, res) => {
    const params = [{ name: 'InventoryItemJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
    await executeProcedure(res, 'usp_SaveInventoryItem', params);
});

// PUT (Update) an existing inventory item
app.put('/api/inventory-items/:id', async (req, res) => {
    req.body.inventory_item_id = parseInt(req.params.id, 10);
    const params = [{ name: 'InventoryItemJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
    await executeProcedure(res, 'usp_SaveInventoryItem', params);
});

// POST to manually adjust inventory stock
app.post('/api/inventory-items/adjust', async (req, res) => {
    const params = [{ name: 'AdjustmentJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
    await executeProcedure(res, 'usp_AdjustInventoryStock', params);
});

// GET inventory transactions for a specific item
app.get('/api/inventory-items/:id/transactions', async (req, res) => {
    const params = [{ name: 'inventory_item_id', type: sql.Int, value: req.params.id }];
    await executeProcedure(res, 'usp_GetInventoryTransactionsByItemId', params);
});


// =============================================================================
// ATTRIBUTE DEFINITIONS
// =============================================================================

// GET all attribute definitions for a specific project
app.get('/api/projects/:projectId/attributes', async (req, res) => {
    const params = [{ name: 'project_id', type: sql.Int, value: req.params.projectId }];
    await executeProcedure(res, 'usp_GetAttributeDefinitionsByProjectId', params);
});

// POST (Create) a new attribute definition
app.post('/api/attributes', async (req, res) => {
    const params = [{ name: 'AttributeJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
    await executeProcedure(res, 'usp_SaveAttributeDefinition', params);
});

// PUT (Update) an existing attribute definition
app.put('/api/attributes/:id', async (req, res) => {
    req.body.attribute_definition_id = parseInt(req.params.id, 10);
    const params = [{ name: 'AttributeJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
    await executeProcedure(res, 'usp_SaveAttributeDefinition', params);
});

// DELETE an attribute definition
app.delete('/api/attributes/:id', async (req, res) => {
    const params = [{ name: 'attribute_definition_id', type: sql.Int, value: req.params.id }];
    await executeProcedure(res, 'usp_DeleteAttributeDefinition', params);
});

// =============================================================================
// PROJECT STEPS
// =============================================================================

// GET all steps for a specific project
app.get('/api/projects/:projectId/steps', async (req, res) => {
    const params = [{ name: 'project_id', type: sql.Int, value: req.params.projectId }];
    await executeProcedure(res, 'usp_GetProjectStepsByProjectId', params);
});

// POST (Create) a new project step
app.post('/api/steps', async (req, res) => {
    const params = [{ name: 'StepJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
    await executeProcedure(res, 'usp_SaveProjectStep', params);
});

// PUT (Update) an existing project step
app.put('/api/steps/:id', async (req, res) => {
    req.body.step_id = parseInt(req.params.id, 10);
    const params = [{ name: 'StepJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
    await executeProcedure(res, 'usp_SaveProjectStep', params);
});

// DELETE a project step
app.delete('/api/steps/:id', async (req, res) => {
    const params = [{ name: 'step_id', type: sql.Int, value: req.params.id }];
    await executeProcedure(res, 'usp_DeleteProjectStep', params);
});


// =============================================================================
// STEP INVENTORY REQUIREMENTS
// =============================================================================

// GET all inventory requirements for a specific step
app.get('/api/steps/:stepId/inventory-requirements', async (req, res) => {
    const params = [{ name: 'step_id', type: sql.Int, value: req.params.stepId }];
    await executeProcedure(res, 'usp_GetStepInventoryRequirementsByStepId', params);
});

// POST (Create) a new step inventory requirement
app.post('/api/inventory-requirements', async (req, res) => {
    const params = [{ name: 'RequirementJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
    await executeProcedure(res, 'usp_SaveStepInventoryRequirement', params);
});

// DELETE a step inventory requirement
app.delete('/api/inventory-requirements/:id', async (req, res) => {
    const params = [{ name: 'requirement_id', type: sql.Int, value: req.params.id }];
    await executeProcedure(res, 'usp_DeleteStepInventoryRequirement', params);
});

// =============================================================================
// TRACKED ITEMS
// =============================================================================

// GET all tracked items for a specific project (with attributes)
app.get('/api/projects/:projectId/tracked-items', async (req, res) => {
    try {
        console.log(`🔍 API: Fetching tracked items for project ${req.params.projectId}`);
        
        const pool = app.locals.db;
        if (!pool) {
            throw new Error("Database not connected.");
        }
        
        // First, get the basic tracked items data using stored procedure
        const request = pool.request();
        request.input('project_id', sql.Int, req.params.projectId);
        
        const result = await request.execute('usp_GetTrackedItemsByProjectId');
        
        let trackedItems = [];
        
        if (result.recordset && result.recordset.length > 0) {
            const jsonString = result.recordset[0][Object.keys(result.recordset[0])[0]];
            // Check if jsonString is not null, undefined, or empty before parsing
            if (jsonString) { 
                try {
                    const parsedData = JSON.parse(jsonString);
                    
                    // Handle different response formats from the stored procedure
                    if (Array.isArray(parsedData)) {
                        trackedItems = parsedData;
                    } else if (parsedData.data && Array.isArray(parsedData.data)) {
                        trackedItems = parsedData.data;
                    } else {
                        console.log('📭 API: Unexpected data format from stored procedure, but handled.');
                        trackedItems = []; // Default to empty array
                    }
                } catch (parseError) {
                    console.error('❌ API: JSON parsing failed.', parseError);
                    console.log('Raw string from DB:', jsonString);
                    trackedItems = []; // Default to empty array on parse error
                }
            } else {
                 console.log('📭 API: Received null or empty JSON string from DB, treating as no items.');
                 trackedItems = [];
            }
        }
        
        console.log(`🔍 API: Found ${trackedItems.length} tracked items, fetching attributes and step statuses...`);
        
        // Now fetch attributes and step statuses for each tracked item
        for (let item of trackedItems) {
            try {
                const attributesRequest = pool.request();
                attributesRequest.input('item_id', sql.Int, item.item_id);
                
                // Get attributes using a direct query to the attributes tables
                const attributesResult = await attributesRequest.query(`
                    SELECT 
                        iav.attribute_definition_id,
                        iav.attribute_value,
                        ad.attribute_name,
                        ad.attribute_type
                    FROM ItemAttributeValues iav
                    INNER JOIN AttributeDefinitions ad ON iav.attribute_definition_id = ad.attribute_definition_id
                    WHERE iav.item_id = @item_id
                `);
                
                // Add attributes array to the item
                item.attributes = attributesResult.recordset.map(attr => ({
                    attribute_definition_id: attr.attribute_definition_id,
                    attribute_value: attr.attribute_value,
                    attribute_name: attr.attribute_name,
                    attribute_type: attr.attribute_type
                }));
                
                // Get step statuses for the item
                const stepStatusRequest = pool.request();
                stepStatusRequest.input('item_id', sql.Int, item.item_id);
                
                const stepStatusResult = await stepStatusRequest.query(`
                    SELECT 
                        step_id as stepId,
                        status,
                        completion_timestamp,
                        completed_by_user_name
                    FROM dbo.TrackedItemStepProgress
                    WHERE item_id = @item_id
                `);
                
                // Add step_statuses array to the item
                item.step_statuses = stepStatusResult.recordset.map(step => ({
                    stepId: step.stepId,
                    status: step.status,
                    completion_timestamp: step.completion_timestamp,
                    completed_by_user_name: step.completed_by_user_name
                }));
                
                console.log(`🔍 API: Item ${item.item_id} has ${item.attributes.length} attributes and ${item.step_statuses.length} step statuses`);
                
            } catch (attrError) {
                console.warn(`❌ API: Failed to fetch attributes or step statuses for item ${item.item_id}:`, attrError.message);
                // Set empty arrays if fetch fails
                item.attributes = [];
                item.step_statuses = [];
            }
        }
        
        console.log(`✅ API: Returning ${trackedItems.length} tracked items with attributes and step statuses included`);
        
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(JSON.stringify({ data: trackedItems }, null, 2));
        
    } catch (error) {
        console.error('❌ API: Error in /api/projects/:projectId/tracked-items:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).send(JSON.stringify({ error: 'Failed to get tracked items.' }, null, 2));
    }
});

// GET full details for a single tracked item
app.get('/api/tracked-items/:id', async (req, res) => {
    const params = [{ name: 'item_id', type: sql.Int, value: req.params.id }];
    await executeProcedure(res, 'usp_GetTrackedItemDetails', params);
});

// POST (Create) a new tracked item (which also inits steps)
app.post('/api/tracked-items', async (req, res) => {
    const params = [{ name: 'TrackedItemJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
    await executeProcedure(res, 'usp_CreateTrackedItem', params);
});

// PUT to update the general details of a tracked item
app.put('/api/tracked-items/:id', async (req, res) => {
    req.body.item_id = parseInt(req.params.id, 10);
    const params = [{ name: 'DetailsJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
    await executeProcedure(res, 'usp_UpdateTrackedItemDetails', params);
});

// POST to save (update/insert) attribute values for a tracked item
app.post('/api/tracked-items/:id/attributes', async (req, res) => {
    req.body.item_id = parseInt(req.params.id, 10);
    const params = [{ name: 'ValuesJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
    await executeProcedure(res, 'usp_SaveItemAttributeValues', params);
});

// POST to update the progress of a single step for a tracked item
app.post('/api/tracked-items/:itemId/steps/:stepId', async (req, res) => {
    req.body.item_id = parseInt(req.params.itemId, 10);
    req.body.step_id = parseInt(req.params.stepId, 10);
    const params = [{ name: 'ProgressJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
    await executeProcedure(res, 'usp_UpdateTrackedItemStepProgress', params);
});

// PUT (Update) step progress for a tracked item - same functionality as POST for compatibility
app.put('/api/tracked-items/:itemId/steps/:stepId', async (req, res) => {
    req.body.item_id = parseInt(req.params.itemId, 10);
    req.body.step_id = parseInt(req.params.stepId, 10);
    const params = [{ name: 'ProgressJson', type: sql.NVarChar, value: JSON.stringify(req.body) }];
    await executeProcedure(res, 'usp_UpdateTrackedItemStepProgress', params);
});

// POST to batch update step progress for multiple tracked items (DEADLOCK PREVENTION)
app.post('/api/tracked-items/batch-step-progress', async (req, res) => {
    try {
        const { itemIds, stepId, status, completed_by_user_name } = req.body;
        
        if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
            return res.status(400).json({ error: 'itemIds array is required and must not be empty' });
        }
        
        if (!stepId) {
            return res.status(400).json({ error: 'stepId is required' });
        }
        
        if (!status) {
            return res.status(400).json({ error: 'status is required' });
        }

        const pool = res.app.locals.db;
        if (!pool) {
            throw new Error("Database not connected. Check your configuration.");
        }

        console.log(`🔄 Processing batch step progress update for ${itemIds.length} items, step ${stepId}, status: ${status}`);
        
        const results = [];
        const errors = [];
        
        // Process items sequentially to avoid deadlocks
        for (const itemId of itemIds) {
            const maxRetries = 3;
            let retryCount = 0;
            let success = false;
            
            while (retryCount < maxRetries && !success) {
                try {
                    const progressData = {
                        item_id: parseInt(itemId, 10),
                        step_id: parseInt(stepId, 10),
                        status: status,
                        completed_by_user_name: completed_by_user_name
                    };
                    
                    const request = pool.request();
                    request.input('ProgressJson', sql.NVarChar, JSON.stringify(progressData));
                    
                    await request.execute('usp_UpdateTrackedItemStepProgress');
                    
                    results.push({ itemId, success: true });
                    success = true;
                    console.log(`✅ Successfully updated item ${itemId}`);
                    
                } catch (error) {
                    retryCount++;
                    
                    // Check if it's a deadlock error (error number 1205)
                    if (error.number === 1205 && retryCount < maxRetries) {
                        // Exponential backoff with jitter
                        const baseDelay = 100 * Math.pow(2, retryCount - 1);
                        const jitter = Math.random() * 50;
                        const delay = baseDelay + jitter;
                        
                        console.log(`⚠️ Deadlock detected for item ${itemId}, retrying in ${Math.round(delay)}ms (attempt ${retryCount}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                    
                    // If it's not a deadlock or we've exhausted retries, record the error
                    console.error(`❌ Failed to update item ${itemId} after ${retryCount} attempts:`, error.message);
                    errors.push({ 
                        itemId, 
                        error: error.message, 
                        attempts: retryCount 
                    });
                    break;
                }
            }
        }
        
        const response = {
            success: results.length,
            failed: errors.length,
            total: itemIds.length,
            results,
            errors: errors.length > 0 ? errors : undefined
        };
        
        console.log(`📊 Batch update completed: ${results.length}/${itemIds.length} successful`);
        
        // Return success if at least some items were updated
        if (results.length > 0) {
            res.status(200).json(response);
        } else {
            res.status(500).json(response);
        }
        
    } catch (error) {
        console.error('❌ Error in batch step progress update:', error);
        res.status(500).json({ 
            error: 'Failed to process batch step progress update',
            details: error.message 
        });
    }
});

// -----------------------------------------------------------------------------
// VIEW ENDPOINTS
// =============================================================================
const executeView = async (res, viewName) => {
    try {
        const pool = res.app.locals.db;
        if (!pool) {
            throw new Error("Database not connected. Check your configuration.");
        }
        const result = await pool.request().query(`SELECT * FROM ${viewName}`);
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(JSON.stringify(result.recordset, null, 2));
    } catch (error) {
        console.error(`Error querying view ${viewName}:`, error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).send(JSON.stringify({ error: error.message }, null, 2));
    }
}

app.get('/api/views/inventory-stock-status', (req, res) => executeView(res, 'v_InventoryItems_StockStatus'));
app.get('/api/views/tracked-items-overview', (req, res) => executeView(res, 'v_TrackedItems_Overview'));
app.get('/api/views/step-progress-status', (req, res) => executeView(res, 'v_TrackedItemStepProgress_Status'));

// =============================================================================
// NOTIFICATIONS
// =============================================================================

// GET all notifications for the current user
app.get('/api/notifications', async (req, res) => {
    try {
        const { 
            isRead, 
            category, 
            type, 
            actionRequired, 
            limit = 50, 
            offset = 0 
        } = req.query;

        // TODO: Implement database storage for notifications
        // For now, return an example structure
        const notifications = [
            {
                id: 'notif_' + Date.now(),
                type: 'warning',
                category: 'inventory',
                title: 'Low Stock Alert',
                message: 'RK73Z1HTTC resistor is running low (5 pieces remaining)',
                timestamp: new Date(),
                isRead: false,
                isImportant: true,
                actionRequired: true,
                relatedEntityType: 'inventory',
                relatedEntityId: 123,
                actionUrl: '/inventory/123',
                actionLabel: 'Reorder Now',
                icon: '📦'
            }
        ];

        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(JSON.stringify(notifications, null, 2));
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// POST create a new notification
app.post('/api/notifications', async (req, res) => {
    try {
        const {
            type,
            category, 
            title,
            message,
            isImportant = false,
            actionRequired = false,
            relatedEntityType,
            relatedEntityId,
            actionUrl,
            actionLabel,
            metadata = {},
            expiresAt,
            userId
        } = req.body;

        // TODO: Implement database storage
        const notification = {
            id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type,
            category,
            title,
            message,
            timestamp: new Date(),
            isRead: false,
            isImportant,
            actionRequired,
            relatedEntityType,
            relatedEntityId,
            actionUrl,
            actionLabel,
            metadata,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            userId: userId || 'system'
        };

        console.log(`📧 Notification Created: [${category}] ${title}`);
        
        res.setHeader('Content-Type', 'application/json');
        res.status(201).send(JSON.stringify(notification, null, 2));
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
});

// PATCH mark notification as read
app.patch('/api/notifications/:id/read', async (req, res) => {
    try {
        const notificationId = req.params.id;
        
        // TODO: Update in database
        console.log(`📖 Notification marked as read: ${notificationId}`);
        
        res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// PATCH mark all notifications as read
app.patch('/api/notifications/mark-all-read', async (req, res) => {
    try {
        // TODO: Update all in database for user
        console.log('📖 All notifications marked as read');
        
        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

// DELETE a notification
app.delete('/api/notifications/:id', async (req, res) => {
    try {
        const notificationId = req.params.id;
        
        // TODO: Delete from database
        console.log(`🗑️ Notification deleted: ${notificationId}`);
        
        res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// GET notification summary/stats
app.get('/api/notifications/summary', async (req, res) => {
    try {
        // TODO: Calculate from database
        const summary = {
            total: 15,
            unread: 5,
            critical: 2,
            actionRequired: 3,
            byCategory: {
                inventory: 8,
                orders: 4,
                production: 2,
                quality: 0,
                system: 1,
                user: 0,
                deadlines: 0,
                approvals: 0
            },
            byType: {
                success: 3,
                warning: 7,
                error: 2,
                info: 2,
                critical: 1,
                reminder: 0
            }
        };

        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(JSON.stringify(summary, null, 2));
    } catch (error) {
        console.error('Error fetching notification summary:', error);
        res.status(500).json({ error: 'Failed to fetch notification summary' });
    }
});


// =============================================================================
// PROCUREMENT & SHOPPING CART
// =============================================================================

// GET shopping cart items for current user and project
app.get('/api/cart', async (req, res) => {
    try {
        const pool = app.locals.db;
        if (!pool) {
            throw new Error("Database not connected");
        }

        const { project_id } = req.query;
        
        // TODO: Get user_id from authentication context
        const userId = 2; // Placeholder for authenticated user

        if (!project_id) {
            return res.status(400).json({ error: 'project_id parameter is required' });
        }

        const result = await pool.request()
            .input('user_id', sql.Int, userId)
            .input('project_id', sql.Int, project_id)
            .execute('usp_GetCartItems');

        const cartSummary = {
            items: result.recordset.length,
            totalQuantity: result.recordset.reduce((sum, item) => sum + item.quantity_requested, 0),
            estimatedTotal: result.recordset.reduce((sum, item) => sum + (item.estimated_cost || 0), 0),
            project_id: parseInt(project_id),
            user_id: userId
        };

        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(JSON.stringify({
            summary: cartSummary,
            items: result.recordset
        }, null, 2));
    } catch (error) {
        console.error('Error getting cart items:', error);
        res.status(500).json({ error: 'Failed to get cart items' });
    }
});

// POST add item to shopping cart
app.post('/api/cart/add', async (req, res) => {
    try {
        const pool = app.locals.db;
        if (!pool) {
            throw new Error("Database not connected");
        }

        const { 
            inventory_item_id, 
            item_name, 
            part_number, 
            description, 
            quantity_requested, 
            estimated_cost, 
            notes,
            project_id 
        } = req.body;

        // TODO: Get user_id from authentication context
        const userId = 2; // Placeholder for authenticated user

        if (!project_id) {
            return res.status(400).json({ error: 'project_id is required' });
        }

        let itemId = inventory_item_id;

        // If item doesn't exist in inventory, create it first using stored procedure
        if (!itemId && item_name && part_number) {
            const createResult = await pool.request()
                .input('item_name', sql.NVarChar, item_name)
                .input('part_number', sql.NVarChar, part_number)
                .input('description', sql.NVarChar, description || '')
                .input('category', sql.NVarChar, 'Requested Item')
                .input('unit_of_measure', sql.NVarChar, 'EA')
                .input('current_stock_level', sql.Decimal, 0)
                .input('reorder_point', sql.Decimal, quantity_requested)
                .input('cost_per_unit', sql.Decimal, estimated_cost || 0)
                .input('program_id', sql.Int, 1) // TF Program ID
                .input('created_by', sql.Int, userId)
                .execute('usp_SaveInventoryItem');

            itemId = createResult.recordset[0].inventory_item_id;
        }

        // Verify the item belongs to the specified project (through program)
        if (itemId) {
            const itemCheck = await pool.request()
                .input('inventory_item_id', sql.Int, itemId)
                .input('program_id', sql.Int, 1) // TF Program ID
                .query(`
                    SELECT inventory_item_id 
                    FROM InventoryItems 
                    WHERE inventory_item_id = @inventory_item_id AND program_id = @program_id
                `);

            if (itemCheck.recordset.length === 0) {
                return res.status(400).json({ error: 'Item does not belong to the specified program' });
            }
        }

        // Add item to cart using stored procedure
        const cartData = {
            user_id: userId,
            inventory_item_id: itemId,
            quantity_requested: quantity_requested,
            estimated_cost: estimated_cost || null,
            notes: notes || null
        };
        
        const result = await pool.request()
            .input('CartItemJson', sql.NVarChar, JSON.stringify(cartData))
            .execute('usp_AddToCart');

        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(JSON.stringify({
            success: true, 
            message: 'Item added to cart successfully', 
            project_id: project_id,
            cart_summary: result.recordset[0]
        }, null, 2));
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ error: 'Failed to add item to cart' });
    }
});

// PUT update cart item quantity
app.put('/api/cart/:cartId', async (req, res) => {
    try {
        const pool = app.locals.db;
        if (!pool) {
            throw new Error("Database not connected");
        }

        const { quantity_requested, estimated_cost, notes, project_id } = req.body;
        const cartId = req.params.cartId;
        const userId = 2; // TODO: Get from authentication context

        if (!project_id) {
            return res.status(400).json({ error: 'project_id is required' });
        }

        // Verify the cart item belongs to the current user and project
        const cartCheck = await pool.request()
            .input('cart_id', sql.Int, cartId)
            .input('user_id', sql.Int, userId)
            .input('project_id', sql.Int, project_id)
            .query(`
                SELECT c.cart_id 
                FROM CartItems c
                INNER JOIN InventoryItems i ON c.inventory_item_id = i.inventory_item_id
                WHERE c.cart_id = @cart_id AND c.user_id = @user_id AND i.project_id = @project_id
            `);

        if (cartCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Cart item not found or access denied' });
        }

// PUT update cart item quantity
app.put('/api/cart/:cartId', async (req, res) => {
    try {
        const pool = app.locals.db;
        if (!pool) {
            throw new Error("Database not connected");
        }

        const { quantity_requested, estimated_cost, notes, project_id } = req.body;
        const cartId = req.params.cartId;
        const userId = 2; // TODO: Get from authentication context

        if (!project_id) {
            return res.status(400).json({ error: 'project_id is required' });
        }

        // Update cart item using stored procedure
        const cartUpdateData = {
            cart_id: cartId,
            user_id: userId,
            quantity_requested: quantity_requested,
            estimated_cost: estimated_cost || null,
            notes: notes || null
        };
        
        const result = await pool.request()
            .input('CartItemJson', sql.NVarChar, JSON.stringify(cartUpdateData))
            .execute('usp_UpdateCartItem');

        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(JSON.stringify({
            success: true, 
            message: 'Cart item updated successfully', 
            project_id: project_id,
            updated_item: result.recordset[0]
        }, null, 2));
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ error: 'Failed to update cart item' });
    }
});

// DELETE remove item from cart
app.delete('/api/cart/:cartId', async (req, res) => {
    try {
        const pool = app.locals.db;
        if (!pool) {
            throw new Error("Database not connected");
        }

        const cartId = req.params.cartId;
        const userId = 2; // TODO: Get from authentication context
        const { project_id } = req.query;

        if (!project_id) {
            return res.status(400).json({ error: 'project_id query parameter is required' });
        }

        // Remove cart item using stored procedure
        const result = await pool.request()
            .input('cart_id', sql.Int, cartId)
            .input('user_id', sql.Int, userId)
            .execute('usp_RemoveFromCart');

        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(JSON.stringify({
            success: true, 
            message: 'Item removed from cart successfully', 
            project_id: project_id
        }, null, 2));
    } catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).json({ error: 'Failed to remove cart item' });
    }
});

// POST create order from cart (convert cart to pending order)
app.post('/api/orders/create-from-cart', async (req, res) => {
    try {
        const pool = app.locals.db;
        if (!pool) {
            throw new Error("Database not connected");
        }

        const { supplier_info, order_notes, project_id } = req.body;
        const userId = 2; // TODO: Get from authentication context

        if (!project_id) {
            return res.status(400).json({ error: 'project_id is required' });
        }

        // Create order from cart using stored procedure
        const result = await pool.request()
            .input('user_id', sql.Int, userId)
            .input('project_id', sql.Int, project_id)
            .input('supplier_info', sql.NVarChar, supplier_info || null)
            .input('order_notes', sql.NVarChar, order_notes || null)
            .execute('usp_CreateOrderFromCart');

        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(JSON.stringify({
            success: true, 
            message: 'Order created successfully', 
            project_id: project_id,
            order: result.recordset[0]
        }, null, 2));
    } catch (error) {
        console.error('Error creating order from cart:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// =============================================================================
// PENDING ORDERS MANAGEMENT
// =============================================================================

// GET all pending orders with filtering
app.get('/api/orders/pending', async (req, res) => {
    try {
        const pool = app.locals.db;
        if (!pool) {
            throw new Error("Database not connected");
        }

        const { project_id } = req.query;
        const userId = 2; // TODO: Get from authentication context

        // Get pending orders using stored procedure
        const result = await pool.request()
            .input('user_id', sql.Int, userId)
            .input('project_id', sql.Int, project_id || null)
            .execute('usp_GetPendingOrders');

        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(JSON.stringify({
            success: true,
            orders: result.recordset,
            project_id: project_id || 'all'
        }, null, 2));
    } catch (error) {
        console.error('Error fetching pending orders:', error);
        res.status(500).json({ error: 'Failed to fetch pending orders' });
    }
});

// =============================================================================
// START SERVER (only if not in test environment)
// =============================================================================
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

// Export the app for testing
module.exports = app;
        if (search) {
            request.input('search', sql.NVarChar, searchParam);
        }

        const result = await request.query(`
            SELECT 
                po.order_id,
                po.status,
                po.supplier_info,
                po.expected_delivery_date,
                po.date_requested,
                po.total_estimated_cost,
                po.notes as order_notes,
                u.display_name as requested_by_name,
                poi.order_item_id,
                poi.inventory_item_id,
                poi.quantity_requested,
                poi.quantity_received,
                poi.estimated_cost,
                poi.actual_cost,
                poi.notes as item_notes,
                i.item_name,
                i.part_number,
                i.description,
                i.unit_of_measure
            FROM PendingOrders po
            INNER JOIN PendingOrderItems poi ON po.order_id = poi.order_id
            INNER JOIN InventoryItems i ON poi.inventory_item_id = i.inventory_item_id
            INNER JOIN Users u ON po.requested_by = u.user_id
            WHERE ${whereClause}
            ORDER BY po.date_requested DESC, po.order_id, poi.order_item_id
        `);

        // Group the results by order_id
        const orders = {};
        result.recordset.forEach(row => {
            if (!orders[row.order_id]) {
                orders[row.order_id] = {
                    order_id: row.order_id,
                    status: row.status,
                    supplier_info: row.supplier_info,
                    expected_delivery_date: row.expected_delivery_date,
                    date_requested: row.date_requested,
                    total_estimated_cost: row.total_estimated_cost,
                    order_notes: row.order_notes,
                    requested_by_name: row.requested_by_name,
                    items: []
                };
            }
            
            orders[row.order_id].items.push({
                order_item_id: row.order_item_id,
                inventory_item_id: row.inventory_item_id,
                quantity_requested: row.quantity_requested,
                quantity_received: row.quantity_received,
                estimated_cost: row.estimated_cost,
                actual_cost: row.actual_cost,
                item_notes: row.item_notes,
                item_name: row.item_name,
                part_number: row.part_number,
                description: row.description,
                unit_of_measure: row.unit_of_measure
            });
        });

        res.json({
            orders: Object.values(orders),
            total: Object.keys(orders).length
        });
    } catch (error) {
        console.error('Error getting pending orders:', error);
        res.status(500).json({ error: 'Failed to get pending orders' });
    }
});

// PUT update order status
app.put('/api/orders/:orderId/status', async (req, res) => {
    try {
        const pool = app.locals.db;
        if (!pool) {
            throw new Error("Database not connected");
        }

        const { status } = req.body;
        const orderId = req.params.orderId;

        const result = await pool.request()
            .input('order_id', sql.Int, orderId)
            .input('status', sql.VarChar, status)
            .query(`
                UPDATE PendingOrders 
                SET status = @status,
                    date_ordered = CASE WHEN @status = 'ordered' THEN GETDATE() ELSE date_ordered END,
                    date_shipped = CASE WHEN @status = 'shipped' THEN GETDATE() ELSE date_shipped END,
                    date_received = CASE WHEN @status = 'received' THEN GETDATE() ELSE date_received END
                WHERE order_id = @order_id
            `);

        res.json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// POST receive order items (partial or complete)
app.post('/api/orders/:orderId/receive', async (req, res) => {
    try {
        const pool = app.locals.db;
        if (!pool) {
            throw new Error("Database not connected");
        }

        const { items } = req.body; // Array of {order_item_id, quantity_received, actual_cost}
        const orderId = req.params.orderId;

        // Start transaction
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Update order items
            for (const item of items) {
                await transaction.request()
                    .input('order_item_id', sql.Int, item.order_item_id)
                    .input('quantity_received', sql.Int, item.quantity_received)
                    .input('actual_cost', sql.Decimal, item.actual_cost || 0)
                    .query(`
                        UPDATE PendingOrderItems 
                        SET quantity_received = @quantity_received,
                            actual_cost = @actual_cost
                        WHERE order_item_id = @order_item_id
                    `);

                // Update inventory stock levels
                const orderItem = await transaction.request()
                    .input('order_item_id', sql.Int, item.order_item_id)
                    .query(`
                        SELECT inventory_item_id FROM PendingOrderItems 
                        WHERE order_item_id = @order_item_id
                    `);

                if (orderItem.recordset.length > 0) {
                    await transaction.request()
                        .input('inventory_item_id', sql.Int, orderItem.recordset[0].inventory_item_id)
                        .input('quantity_received', sql.Int, item.quantity_received)
                        .query(`
                            UPDATE InventoryItems 
                            SET current_stock_level = current_stock_level + @quantity_received
                            WHERE inventory_item_id = @inventory_item_id
                        `);
                }
            }

            // Check if order is fully received
            const orderStatus = await transaction.request()
                .input('order_id', sql.Int, orderId)
                .query(`
                    SELECT 
                        CASE 
                            WHEN SUM(quantity_requested) = SUM(ISNULL(quantity_received, 0)) 
                            THEN 'received' 
                            ELSE 'partial' 
                        END as new_status
                    FROM PendingOrderItems 
                    WHERE order_id = @order_id
                `);

            const newStatus = orderStatus.recordset[0].new_status;
            
            // Update order status
            await transaction.request()
                .input('order_id', sql.Int, orderId)
                .input('status', sql.VarChar, newStatus)
                .query(`
                    UPDATE PendingOrders 
                    SET status = @status,
                        date_received = CASE WHEN @status = 'received' THEN GETDATE() ELSE date_received END
                    WHERE order_id = @order_id
                `);

            await transaction.commit();
            
            res.json({ 
                success: true, 
                message: 'Order items received successfully',
                newStatus: newStatus
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error receiving order items:', error);
        res.status(500).json({ error: 'Failed to receive order items' });
    }
});

// -----------------------------------------------------------------------------
// START SERVER (only if not in test environment)
// -----------------------------------------------------------------------------
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

// Export the app for testing
module.exports = app;