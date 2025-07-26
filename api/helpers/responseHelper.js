/**
 * Standardized API Response Helper
 * Provides consistent response formats across all API endpoints
 */

/**
 * Standard API Response Format
 * @typedef {Object} StandardResponse
 * @property {boolean} success - Indicates if the operation was successful
 * @property {any} [data] - Response data (only present on success)
 * @property {string} [message] - Success or informational message
 * @property {string} [error] - Error message (only present on failure)
 * @property {Object} [details] - Additional error details for debugging
 * @property {number} [count] - Count of items for list responses
 * @property {Object} [meta] - Metadata for pagination, etc.
 * @property {number} timestamp - ISO timestamp of response
 * @property {string} endpoint - API endpoint that generated this response
 */

/**
 * Create a successful response
 * @param {any} data - The response data
 * @param {string} [message] - Optional success message
 * @param {Object} [meta] - Optional metadata (pagination, etc.)
 * @param {string} [endpoint] - API endpoint name
 * @returns {StandardResponse}
 */
function successResponse(data, message = null, meta = null, endpoint = null) {
    const response = {
        success: true,
        data: data,
        timestamp: new Date().toISOString(),
    };

    if (message) response.message = message;
    if (meta) response.meta = meta;
    if (endpoint) response.endpoint = endpoint;
    
    // Add count for array responses
    if (Array.isArray(data)) {
        response.count = data.length;
    }

    return response;
}

/**
 * Create an error response
 * @param {string} error - Error message
 * @param {Object} [details] - Additional error details
 * @param {number} [statusCode] - HTTP status code
 * @param {string} [endpoint] - API endpoint name
 * @returns {StandardResponse}
 */
function errorResponse(error, details = null, statusCode = 500, endpoint = null) {
    const response = {
        success: false,
        error: error,
        timestamp: new Date().toISOString(),
    };

    if (details) response.details = details;
    if (endpoint) response.endpoint = endpoint;
    if (statusCode) response.statusCode = statusCode;

    return response;
}

/**
 * Create a validation error response
 * @param {string|Array} validationErrors - Validation error messages
 * @param {string} [endpoint] - API endpoint name
 * @returns {StandardResponse}
 */
function validationErrorResponse(validationErrors, endpoint = null) {
    return errorResponse(
        'Validation failed',
        {
            validation: Array.isArray(validationErrors) ? validationErrors : [validationErrors],
            type: 'validation_error'
        },
        400,
        endpoint
    );
}

/**
 * Create a not found error response
 * @param {string} resource - Resource that was not found
 * @param {string} [endpoint] - API endpoint name
 * @returns {StandardResponse}
 */
function notFoundResponse(resource, endpoint = null) {
    return errorResponse(
        `${resource} not found`,
        { type: 'not_found', resource },
        404,
        endpoint
    );
}

/**
 * Create an unauthorized error response
 * @param {string} [message] - Optional custom message
 * @param {string} [endpoint] - API endpoint name
 * @returns {StandardResponse}
 */
function unauthorizedResponse(message = 'Unauthorized access', endpoint = null) {
    return errorResponse(
        message,
        { type: 'unauthorized' },
        401,
        endpoint
    );
}

/**
 * Create a forbidden error response
 * @param {string} [message] - Optional custom message
 * @param {string} [endpoint] - API endpoint name
 * @returns {StandardResponse}
 */
function forbiddenResponse(message = 'Access denied', endpoint = null) {
    return errorResponse(
        message,
        { type: 'forbidden' },
        403,
        endpoint
    );
}

/**
 * Create a database error response
 * @param {Error} dbError - Database error object
 * @param {string} [operation] - Operation that failed
 * @param {string} [endpoint] - API endpoint name
 * @returns {StandardResponse}
 */
function databaseErrorResponse(dbError, operation = 'database operation', endpoint = null) {
    const details = {
        type: 'database_error',
        operation: operation,
    };

    // Include additional details in development
    if (process.env.NODE_ENV === 'development') {
        details.originalError = dbError.message;
        details.sqlState = dbError.state;
        details.procedure = dbError.procName;
    }

    return errorResponse(
        `Failed to ${operation}`,
        details,
        500,
        endpoint
    );
}

/**
 * Create a list response with pagination
 * @param {Array} items - Array of items
 * @param {Object} pagination - Pagination info
 * @param {number} pagination.page - Current page
 * @param {number} pagination.limit - Items per page
 * @param {number} pagination.total - Total items available
 * @param {string} [message] - Optional message
 * @param {string} [endpoint] - API endpoint name
 * @returns {StandardResponse}
 */
function listResponse(items, pagination = null, message = null, endpoint = null) {
    const meta = pagination ? {
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            pages: Math.ceil(pagination.total / pagination.limit),
            hasNext: pagination.page * pagination.limit < pagination.total,
            hasPrev: pagination.page > 1
        }
    } : null;

    return successResponse(items, message, meta, endpoint);
}

/**
 * Express middleware to add standardized response helpers to res object
 * Usage: app.use(responseMiddleware);
 */
function responseMiddleware(req, res, next) {
    // Add helper methods to response object
    res.successResponse = (data, message, meta) => {
        const response = successResponse(data, message, meta, req.route?.path || req.path);
        return res.status(200).json(response);
    };

    res.errorResponse = (error, details, statusCode = 500) => {
        const response = errorResponse(error, details, statusCode, req.route?.path || req.path);
        return res.status(statusCode).json(response);
    };

    res.validationError = (validationErrors) => {
        const response = validationErrorResponse(validationErrors, req.route?.path || req.path);
        return res.status(400).json(response);
    };

    res.notFound = (resource) => {
        const response = notFoundResponse(resource, req.route?.path || req.path);
        return res.status(404).json(response);
    };

    res.unauthorized = (message) => {
        const response = unauthorizedResponse(message, req.route?.path || req.path);
        return res.status(401).json(response);
    };

    res.forbidden = (message) => {
        const response = forbiddenResponse(message, req.route?.path || req.path);
        return res.status(403).json(response);
    };

    res.databaseError = (dbError, operation) => {
        const response = databaseErrorResponse(dbError, operation, req.route?.path || req.path);
        return res.status(500).json(response);
    };

    res.listResponse = (items, pagination, message) => {
        const response = listResponse(items, pagination, message, req.route?.path || req.path);
        return res.status(200).json(response);
    };

    next();
}

/**
 * Enhanced procedure execution with standardized responses
 * @param {Object} res - Express response object
 * @param {string} procedureName - Name of stored procedure
 * @param {Array} params - Procedure parameters
 * @param {string} [successMessage] - Optional success message
 * @returns {Promise<void>}
 */
async function executeProcedureStandardized(res, procedureName, params = [], successMessage = null) {
    try {
        const pool = res.app.locals.db;
        if (!pool) {
            return res.errorResponse('Database not connected', { type: 'database_connection' }, 500);
        }

        const request = pool.request();
        params.forEach((param) => {
            request.input(param.name, param.type, param.value);
        });

        const result = await request.execute(procedureName);

        // Handle JSON string responses from procedures
        if (result.recordset?.length > 0) {
            const firstColumn = result.recordset[0][Object.keys(result.recordset[0])[0]];
            if (
                typeof firstColumn === 'string' &&
                Object.keys(result.recordset[0]).length === 1
            ) {
                try {
                    const data = JSON.parse(firstColumn);
                    return res.successResponse(data, successMessage);
                } catch (parseError) {
                    // If JSON parse fails, return raw result
                    return res.successResponse(result.recordset, successMessage);
                }
            }
        }

        // Return recordset directly
        return res.successResponse(result.recordset || [], successMessage);
    } catch (error) {
        console.error(`Error executing procedure ${procedureName}:`, error);
        
        // Handle specific database constraint violations for better UX
        if (error.message) {
            // Handle duplicate key constraint (project names must be unique within a program)
            if (error.message.includes('UQ_Projects_Name_Program') || 
                error.message.includes('Cannot insert duplicate key')) {
                return res.errorResponse(
                    'A project with this name already exists in this program. Please choose a different name.',
                    { 
                        type: 'duplicate_key',
                        constraint: 'unique_project_name_per_program',
                        field: 'project_name'
                    },
                    409 // Conflict
                );
            }
            
            // Handle other unique constraint violations
            if (error.message.includes('UNIQUE KEY constraint') || error.message.includes('duplicate key')) {
                return res.errorResponse(
                    'This entry conflicts with an existing record. Please check your data and try again.',
                    { 
                        type: 'duplicate_key',
                        originalError: error.message
                    },
                    409 // Conflict
                );
            }
            
            // Handle foreign key constraint violations
            if (error.message.includes('FOREIGN KEY constraint')) {
                return res.errorResponse(
                    'Referenced data does not exist. Please check your selections and try again.',
                    { 
                        type: 'foreign_key_violation',
                        originalError: error.message
                    },
                    400 // Bad Request
                );
            }
            
            // Handle check constraint violations
            if (error.message.includes('CHECK constraint')) {
                return res.errorResponse(
                    'Data validation failed. Please check your input and try again.',
                    { 
                        type: 'check_constraint_violation',
                        originalError: error.message
                    },
                    400 // Bad Request
                );
            }
        }
        
        return res.databaseError(error, `execute ${procedureName}`);
    }
}

module.exports = {
    successResponse,
    errorResponse,
    validationErrorResponse,
    notFoundResponse,
    unauthorizedResponse,
    forbiddenResponse,
    databaseErrorResponse,
    listResponse,
    responseMiddleware,
    executeProcedureStandardized
};
