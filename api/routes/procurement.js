// Procurement Management API Routes
const express = require('express');
const sql = require('mssql');
const router = express.Router();

// Middleware to authenticate user (assuming this exists in the main app)
const authenticateUser = (req, res, next) => {
    // This should be implemented in the main app
    // For now, we'll assume req.user is populated
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

// Helper function to execute procedures
const executeProcedure = async (res, procedureName, params, db) => {
    try {
        const request = new sql.Request(db);
        
        // Add parameters to the request
        for (const [key, value] of Object.entries(params)) {
            request.input(key, value);
        }
        
        const result = await request.execute(procedureName);
        return res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error(`Error executing ${procedureName}:`, error);
        return res.status(500).json({ 
            error: 'Database operation failed', 
            details: error.message 
        });
    }
};

// =============================================================================
// SPONSOR MANAGEMENT ENDPOINTS
// =============================================================================

// GET /api/sponsors - Get all sponsors
router.get('/sponsors', authenticateUser, async (req, res) => {
    try {
        const { program_id } = req.query;
        
        const request = new sql.Request(req.db);
        if (program_id) {
            request.input('program_id', sql.Int, program_id);
        }
        
        const result = await request.execute('usp_GetSponsors');
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching sponsors:', error);
        res.status(500).json({ error: 'Failed to fetch sponsors', details: error.message });
    }
});

// POST /api/sponsors - Create new sponsor
router.post('/sponsors', authenticateUser, async (req, res) => {
    try {
        const sponsorData = {
            ...req.body,
            created_by: req.user.user_id
        };
        
        const params = {
            SponsorJson: JSON.stringify(sponsorData)
        };
        
        await executeProcedure(res, 'usp_SaveSponsor', params, req.db);
    } catch (error) {
        console.error('Error creating sponsor:', error);
        res.status(500).json({ error: 'Failed to create sponsor', details: error.message });
    }
});

// PUT /api/sponsors/:id - Update sponsor
router.put('/sponsors/:id', authenticateUser, async (req, res) => {
    try {
        const sponsorData = {
            ...req.body,
            sponsor_id: parseInt(req.params.id)
        };
        
        const params = {
            SponsorJson: JSON.stringify(sponsorData)
        };
        
        await executeProcedure(res, 'usp_SaveSponsor', params, req.db);
    } catch (error) {
        console.error('Error updating sponsor:', error);
        res.status(500).json({ error: 'Failed to update sponsor', details: error.message });
    }
});

// =============================================================================
// SPONSOR FUND MANAGEMENT ENDPOINTS
// =============================================================================

// GET /api/sponsor-funds - Get all sponsor funds
router.get('/sponsor-funds', authenticateUser, async (req, res) => {
    try {
        const { sponsor_id, program_id } = req.query;
        
        const request = new sql.Request(req.db);
        if (sponsor_id) {
            request.input('sponsor_id', sql.Int, sponsor_id);
        }
        if (program_id) {
            request.input('program_id', sql.Int, program_id);
        }
        
        const result = await request.execute('usp_GetSponsorFunds');
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching sponsor funds:', error);
        res.status(500).json({ error: 'Failed to fetch sponsor funds', details: error.message });
    }
});

// POST /api/sponsor-funds - Create new sponsor fund
router.post('/sponsor-funds', authenticateUser, async (req, res) => {
    try {
        const fundData = {
            ...req.body,
            created_by: req.user.user_id
        };
        
        const params = {
            FundJson: JSON.stringify(fundData)
        };
        
        await executeProcedure(res, 'usp_SaveSponsorFund', params, req.db);
    } catch (error) {
        console.error('Error creating sponsor fund:', error);
        res.status(500).json({ error: 'Failed to create sponsor fund', details: error.message });
    }
});

// PUT /api/sponsor-funds/:id - Update sponsor fund
router.put('/sponsor-funds/:id', authenticateUser, async (req, res) => {
    try {
        const fundData = {
            ...req.body,
            fund_id: parseInt(req.params.id)
        };
        
        const params = {
            FundJson: JSON.stringify(fundData)
        };
        
        await executeProcedure(res, 'usp_SaveSponsorFund', params, req.db);
    } catch (error) {
        console.error('Error updating sponsor fund:', error);
        res.status(500).json({ error: 'Failed to update sponsor fund', details: error.message });
    }
});

// GET /api/fund-usage-summary - Get fund usage summary
router.get('/fund-usage-summary', authenticateUser, async (req, res) => {
    try {
        const { program_id } = req.query;
        
        const request = new sql.Request(req.db);
        if (program_id) {
            request.input('program_id', sql.Int, program_id);
        }
        
        const result = await request.execute('usp_GetFundUsageSummary');
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching fund usage summary:', error);
        res.status(500).json({ error: 'Failed to fetch fund usage summary', details: error.message });
    }
});

// GET /api/expiring-documents - Get expiring documents
router.get('/expiring-documents', authenticateUser, async (req, res) => {
    try {
        const { days_ahead } = req.query;
        
        const request = new sql.Request(req.db);
        if (days_ahead) {
            request.input('days_ahead', sql.Int, parseInt(days_ahead));
        }
        
        const result = await request.execute('usp_GetExpiringDocuments');
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching expiring documents:', error);
        res.status(500).json({ error: 'Failed to fetch expiring documents', details: error.message });
    }
});

// =============================================================================
// VENDOR MANAGEMENT ENDPOINTS
// =============================================================================

// GET /api/vendors - Get all procurement vendors
router.get('/vendors', authenticateUser, async (req, res) => {
    try {
        const { program_id } = req.query;
        
        const request = new sql.Request(req.db);
        if (program_id) {
            request.input('program_id', sql.Int, program_id);
        }
        
        const result = await request.execute('usp_GetProcurementVendors');
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({ error: 'Failed to fetch vendors', details: error.message });
    }
});

// POST /api/vendors - Create new vendor
router.post('/vendors', authenticateUser, async (req, res) => {
    try {
        const vendorData = {
            ...req.body,
            created_by: req.user.user_id
        };
        
        const params = {
            VendorJson: JSON.stringify(vendorData)
        };
        
        await executeProcedure(res, 'usp_SaveProcurementVendor', params, req.db);
    } catch (error) {
        console.error('Error creating vendor:', error);
        res.status(500).json({ error: 'Failed to create vendor', details: error.message });
    }
});

// PUT /api/vendors/:id - Update vendor
router.put('/vendors/:id', authenticateUser, async (req, res) => {
    try {
        const vendorData = {
            ...req.body,
            vendor_id: parseInt(req.params.id)
        };
        
        const params = {
            VendorJson: JSON.stringify(vendorData)
        };
        
        await executeProcedure(res, 'usp_SaveProcurementVendor', params, req.db);
    } catch (error) {
        console.error('Error updating vendor:', error);
        res.status(500).json({ error: 'Failed to update vendor', details: error.message });
    }
});

// =============================================================================
// CROSS PAYMENT AUDIT ENDPOINTS
// =============================================================================

// GET /api/cross-payment-audit - Get cross payment audit records
router.get('/cross-payment-audit', authenticateUser, async (req, res) => {
    try {
        const { fund_id, start_date, end_date } = req.query;
        
        const request = new sql.Request(req.db);
        if (fund_id) {
            request.input('fund_id', sql.Int, fund_id);
        }
        if (start_date) {
            request.input('start_date', sql.Date, start_date);
        }
        if (end_date) {
            request.input('end_date', sql.Date, end_date);
        }
        
        const result = await request.execute('usp_GetCrossPaymentAudit');
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching cross payment audit:', error);
        res.status(500).json({ error: 'Failed to fetch cross payment audit', details: error.message });
    }
});

// POST /api/cross-payment-audit - Create cross payment audit record
router.post('/cross-payment-audit', authenticateUser, async (req, res) => {
    try {
        const auditData = {
            ...req.body,
            created_by: req.user.user_id
        };
        
        const params = {
            AuditJson: JSON.stringify(auditData)
        };
        
        await executeProcedure(res, 'usp_CreateCrossPaymentAudit', params, req.db);
    } catch (error) {
        console.error('Error creating cross payment audit:', error);
        res.status(500).json({ error: 'Failed to create cross payment audit', details: error.message });
    }
});

// =============================================================================
// EXISTING FUND USAGE REPORTING ENDPOINTS
// =============================================================================

// GET /api/fund-usage-summary - Get fund usage summary
router.get('/fund-usage-summary', authenticateUser, async (req, res) => {
    try {
        const { program_id } = req.query;
        
        const query = `
            SELECT 
                s.sponsor_id,
                s.sponsor_name,
                SUM(sf.total_amount) as total_funds,
                SUM(sf.spent_amount) as spent_amount,
                SUM(sf.remaining_amount) as remaining_amount,
                SUM(CASE WHEN sf.expiration_date IS NOT NULL 
                     AND sf.expiration_date < DATEADD(DAY, 30, GETDATE()) 
                     THEN sf.remaining_amount ELSE 0 END) as expiring_funds,
                -- Cross payments would be calculated from CrossPaymentAudit table
                0 as cross_payments_made,
                0 as cross_payments_received,
                -- Active orders would be calculated from OrderFundAllocations
                0 as active_orders
            FROM Sponsors s
            INNER JOIN Programs p ON s.program_id = p.program_id
            LEFT JOIN SponsorFunds sf ON s.sponsor_id = sf.sponsor_id
            WHERE (@program_id IS NULL OR p.program_id = @program_id)
              AND s.status = 'Active'
            GROUP BY s.sponsor_id, s.sponsor_name
            ORDER BY s.sponsor_name
        `;
        
        const request = new sql.Request(req.db);
        if (program_id) {
            request.input('program_id', sql.Int, program_id);
        }
        
        const result = await request.query(query);
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching fund usage summary:', error);
        res.status(500).json({ error: 'Failed to fetch fund usage summary', details: error.message });
    }
});

// GET /api/expiring-documents - Get expiring funding documents
router.get('/expiring-documents', authenticateUser, async (req, res) => {
    try {
        const { days_ahead = 30 } = req.query;
        
        const query = `
            SELECT 
                fd.document_id,
                fd.document_name,
                fd.document_type,
                fd.expiration_date,
                fd.status,
                s.sponsor_name,
                sf.fund_name,
                DATEDIFF(DAY, GETDATE(), fd.expiration_date) as days_until_expiration,
                CASE 
                    WHEN fd.expiration_date < GETDATE() THEN 1
                    WHEN fd.expiration_date < DATEADD(DAY, 7, GETDATE()) THEN 1
                    ELSE 0
                END as is_expiring_soon
            FROM FundingDocuments fd
            INNER JOIN Sponsors s ON fd.sponsor_id = s.sponsor_id
            LEFT JOIN SponsorFunds sf ON fd.fund_id = sf.fund_id
            WHERE fd.expiration_date IS NOT NULL
              AND fd.expiration_date <= DATEADD(DAY, @days_ahead, GETDATE())
              AND fd.status = 'Active'
            ORDER BY fd.expiration_date ASC
        `;
        
        const request = new sql.Request();
        request.input('days_ahead', sql.Int, days_ahead);
        
        const result = await request.query(query);
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching expiring documents:', error);
        res.status(500).json({ error: 'Failed to fetch expiring documents', details: error.message });
    }
});

// =============================================================================
// NOTIFICATION ENDPOINTS
// =============================================================================

// GET /api/notifications - Get notifications for user
router.get('/notifications', authenticateUser, async (req, res) => {
    try {
        const query = `
            SELECT 
                n.notification_id,
                n.user_id as recipient_id,
                u.display_name as recipient_name,
                n.notification_type,
                n.title,
                n.message,
                n.data,
                n.created_date as sent_date,
                n.read_date,
                CASE 
                    WHEN n.read_date IS NULL THEN 'Sent'
                    ELSE 'Read'
                END as status
            FROM Notifications n
            INNER JOIN Users u ON n.user_id = u.user_id
            WHERE n.user_id = @user_id
            ORDER BY n.created_date DESC
        `;
        
        const request = new sql.Request(req.db);
        request.input('user_id', sql.Int, req.user.user_id);
        
        const result = await request.query(query);
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications', details: error.message });
    }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/notifications/:id/read', authenticateUser, async (req, res) => {
    try {
        const query = `
            UPDATE Notifications 
            SET read_date = GETDATE() 
            WHERE notification_id = @notification_id 
              AND user_id = @user_id
        `;
        
        const request = new sql.Request(req.db);
        request.input('notification_id', sql.Int, req.params.id);
        request.input('user_id', sql.Int, req.user.user_id);
        
        await request.query(query);
        
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read', details: error.message });
    }
});

module.exports = router;
