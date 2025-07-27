/**
 * User Activity Logging and Audit Trail Service
 * Provides comprehensive activity tracking for security, compliance, and debugging
 */

const sql = require('mssql');

class AuditLogger {
    constructor(dbPool) {
        this.db = dbPool;
    }

    /**
     * Log user activity to audit trail
     * @param {Object} activityData - Activity information
     * @param {number} activityData.user_id - User performing the action
     * @param {string} activityData.action_type - Type of action (CREATE, UPDATE, DELETE, READ, LOGIN, etc.)
     * @param {string} activityData.entity_type - Type of entity affected (Project, InventoryItem, User, etc.)
     * @param {number} [activityData.entity_id] - ID of the affected entity
     * @param {string} [activityData.description] - Human-readable description of the action
     * @param {Object} [activityData.old_values] - Previous values (for updates)
     * @param {Object} [activityData.new_values] - New values (for creates/updates)
     * @param {Object} [activityData.metadata] - Additional metadata
     * @param {string} [activityData.ip_address] - User's IP address
     * @param {string} [activityData.user_agent] - User's browser/client info
     * @param {number} [activityData.program_id] - Program context
     * @param {string} [activityData.session_id] - Session identifier
     * @returns {Promise<number>} - Returns the log entry ID
     */
    async logActivity({
        user_id,
        action_type,
        entity_type,
        entity_id = null,
        description = null,
        old_values = null,
        new_values = null,
        metadata = null,
        ip_address = null,
        user_agent = null,
        program_id = null,
        session_id = null
    }) {
        try {
            if (!this.db) {
                console.warn('Database not available for audit logging');
                return null;
            }

            const logData = {
                user_id,
                action_type: action_type.toUpperCase(),
                entity_type,
                entity_id,
                description,
                old_values: old_values ? JSON.stringify(old_values) : null,
                new_values: new_values ? JSON.stringify(new_values) : null,
                metadata: metadata ? JSON.stringify(metadata) : null,
                ip_address,
                user_agent,
                program_id,
                session_id,
                timestamp: new Date()
            };

            const request = this.db.request();
            request.input('AuditLogJson', sql.NVarChar, JSON.stringify(logData));

            const result = await request.execute('usp_LogUserActivity');

            if (result.recordset && result.recordset.length > 0) {
                return result.recordset[0].log_id;
            }

            return null;
        } catch (error) {
            console.error('Error logging user activity:', error);
            // Don't throw - audit logging should not break application flow
            return null;
        }
    }

    /**
     * Log authentication events
     */
    async logAuthentication(user_id, action, success, ip_address, user_agent, details = {}) {
        return this.logActivity({
            user_id,
            action_type: action, // LOGIN, LOGOUT, LOGIN_FAILED, etc.
            entity_type: 'Authentication',
            description: `User ${action.toLowerCase()}${success ? ' successful' : ' failed'}`,
            metadata: {
                success,
                authentication_method: 'certificate',
                ...details
            },
            ip_address,
            user_agent
        });
    }

    /**
     * Log data access events
     */
    async logDataAccess(user_id, entity_type, entity_id, action, ip_address, program_id, metadata = {}) {
        return this.logActivity({
            user_id,
            action_type: action, // READ, EXPORT, SEARCH, etc.
            entity_type,
            entity_id,
            description: `${action} ${entity_type}${entity_id ? ` ID: ${entity_id}` : ''}`,
            metadata,
            ip_address,
            program_id
        });
    }

    /**
     * Log CRUD operations
     */
    async logCRUDOperation(user_id, action, entity_type, entity_id, old_values, new_values, ip_address, program_id, description = null) {
        const actionDescriptions = {
            CREATE: 'Created',
            UPDATE: 'Updated', 
            DELETE: 'Deleted',
            READ: 'Viewed'
        };

        return this.logActivity({
            user_id,
            action_type: action,
            entity_type,
            entity_id,
            description: description || `${actionDescriptions[action]} ${entity_type}${entity_id ? ` ID: ${entity_id}` : ''}`,
            old_values,
            new_values,
            ip_address,
            program_id
        });
    }

    /**
     * Log inventory operations
     */
    async logInventoryOperation(user_id, action, inventory_item_id, quantity_change, reason, ip_address, program_id) {
        return this.logActivity({
            user_id,
            action_type: 'INVENTORY_ADJUSTMENT',
            entity_type: 'InventoryItem',
            entity_id: inventory_item_id,
            description: `${action} ${Math.abs(quantity_change)} units - ${reason}`,
            new_values: { quantity_change, action, reason },
            ip_address,
            program_id
        });
    }

    /**
     * Log security events
     */
    async logSecurityEvent(user_id, event_type, severity, description, ip_address, metadata = {}) {
        return this.logActivity({
            user_id,
            action_type: 'SECURITY_EVENT',
            entity_type: 'Security',
            description: `${severity.toUpperCase()}: ${description}`,
            metadata: {
                event_type,
                severity,
                ...metadata
            },
            ip_address
        });
    }

    /**
     * Log API calls for monitoring
     */
    async logAPICall(user_id, method, endpoint, status_code, response_time, ip_address, user_agent, program_id) {
        return this.logActivity({
            user_id,
            action_type: 'API_CALL',
            entity_type: 'API',
            description: `${method} ${endpoint} - ${status_code}`,
            metadata: {
                method,
                endpoint,
                status_code,
                response_time,
                timestamp: new Date()
            },
            ip_address,
            user_agent,
            program_id
        });
    }

    /**
     * Get audit trail for specific entity
     */
    async getAuditTrail(entity_type, entity_id, user_id = null, program_id = null, limit = 100) {
        try {
            const request = this.db.request();
            request.input('EntityType', sql.NVarChar, entity_type);
            request.input('EntityId', sql.Int, entity_id);
            request.input('UserId', sql.Int, user_id);
            request.input('ProgramId', sql.Int, program_id);
            request.input('Limit', sql.Int, limit);

            const result = await request.execute('usp_GetAuditTrail');
            return result.recordset;
        } catch (error) {
            console.error('Error retrieving audit trail:', error);
            throw error;
        }
    }

    /**
     * Get user activity summary
     */
    async getUserActivitySummary(user_id, date_from, date_to, program_id = null) {
        try {
            const request = this.db.request();
            request.input('UserId', sql.Int, user_id);
            request.input('DateFrom', sql.DateTime, date_from);
            request.input('DateTo', sql.DateTime, date_to);
            request.input('ProgramId', sql.Int, program_id);

            const result = await request.execute('usp_GetUserActivitySummary');
            return result.recordset;
        } catch (error) {
            console.error('Error retrieving user activity summary:', error);
            throw error;
        }
    }

    /**
     * Get security events
     */
    async getSecurityEvents(severity = null, user_id = null, hours_back = 24, program_id = null) {
        try {
            const request = this.db.request();
            request.input('Severity', sql.NVarChar, severity);
            request.input('UserId', sql.Int, user_id);
            request.input('HoursBack', sql.Int, hours_back);
            request.input('ProgramId', sql.Int, program_id);

            const result = await request.execute('usp_GetSecurityEvents');
            return result.recordset;
        } catch (error) {
            console.error('Error retrieving security events:', error);
            throw error;
        }
    }
}

/**
 * Express middleware to automatically log API calls
 */
function auditMiddleware(auditLogger) {
    return (req, res, next) => {
        const startTime = Date.now();
        
        // Override res.json to capture response
        const originalJson = res.json;
        res.json = function(data) {
            const responseTime = Date.now() - startTime;
            
            // Log API call asynchronously (don't block response)
            if (req.user && auditLogger) {
                process.nextTick(async () => {
                    try {
                        await auditLogger.logAPICall(
                            req.user.user_id,
                            req.method,
                            req.route?.path || req.path,
                            res.statusCode,
                            responseTime,
                            req.ip || req.connection?.remoteAddress,
                            req.get('User-Agent'),
                            req.user.program_access?.[0]?.program_id
                        );
                    } catch (error) {
                        console.warn('Failed to log API call:', error);
                    }
                });
            }
            
            return originalJson.call(this, data);
        };

        next();
    };
}

/**
 * Helper to extract client IP address
 */
function getClientIP(req) {
    return req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           'unknown';
}

/**
 * Helper to get user agent
 */
function getUserAgent(req) {
    return req.get('User-Agent') || 'unknown';
}

module.exports = {
    AuditLogger,
    auditMiddleware,
    getClientIP,
    getUserAgent
};
