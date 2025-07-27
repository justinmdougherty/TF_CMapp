/**
 * Backend GitHub Error Reporting Service
 * Handles automatic error reporting from the Node.js/Express backend
 */

// Use dynamic import for node-fetch to handle ESM module
let fetch;
const initializeFetch = async () => {
    if (!fetch) {
        const fetchModule = await import('node-fetch');
        fetch = fetchModule.default;
    }
    return fetch;
};

class GitHubErrorReportingService {
    constructor() {
        this.isEnabled = false;
        this.config = {
            owner: process.env.GITHUB_REPO_OWNER || 'justinmdougherty',
            repo: process.env.GITHUB_REPO_NAME || 'H10CM',
            token: process.env.GITHUB_TOKEN,
            autoCapture: process.env.GITHUB_AUTO_CAPTURE === 'true' || true // Default to true for testing
        };
        
        // Initialize if token is available
        if (this.config.token) {
            this.initialize();
        } else {
            console.warn('⚠️ GitHub token not found. Error reporting disabled.');
        }
    }

    initialize() {
        console.log('🔧 Initializing backend GitHub error reporting...');
        
        if (this.config.autoCapture) {
            this.enableAutoErrorCapture();
        }
        
        this.isEnabled = true;
        console.log('✅ Backend GitHub error reporting initialized');
    }

    enableAutoErrorCapture() {
        // Capture uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('💥 Uncaught Exception:', error);
            this.reportError(error, 'uncaughtException', {
                captureMethod: 'automatic',
                errorType: 'uncaughtException',
                timestamp: new Date().toISOString()
            });
        });

        // Capture unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('💥 Unhandled Promise Rejection:', reason);
            this.reportError(reason, 'unhandledRejection', {
                captureMethod: 'automatic',
                errorType: 'unhandledRejection',
                timestamp: new Date().toISOString(),
                promise: promise.toString()
            });
        });

        console.log('🔄 Backend automatic error capture enabled');
    }

    async reportError(error, source = 'backend', context = {}) {
        if (!this.isEnabled || !this.config.token) {
            console.log('⚠️ GitHub error reporting disabled or not configured');
            return null;
        }

        // Filter out development noise errors
        if (this.shouldIgnoreError(error, source, context)) {
            console.log('🔇 Ignoring development noise error:', error.code || error.message);
            return null;
        }

        try {
            const errorData = this.extractErrorData(error, source, context);
            const issueData = this.buildIssueData(errorData);
            
            console.log('📝 Reporting backend error to GitHub:', {
                title: issueData.title,
                source,
                errorType: error.constructor.name
            });

            const response = await this.createGitHubIssue(issueData);
            
            if (response.success) {
                console.log('✅ Backend error reported to GitHub:', response.data.html_url);
                return response.data;
            } else {
                console.error('❌ Failed to report backend error to GitHub:', response.error);
                return null;
            }
        } catch (err) {
            console.error('💥 Error in GitHub error reporting service:', err);
            return null;
        }
    }

    shouldIgnoreError(error, source, context) {
        // Ignore port already in use errors (common during development with nodemon)
        if (error.code === 'EADDRINUSE') {
            return true;
        }

        // Ignore specific development-related errors
        const ignoredErrorMessages = [
            'listen EADDRINUSE',
            'address already in use',
            'ECONNRESET', // Connection reset by peer
            'EPIPE' // Broken pipe
        ];

        if (error.message && ignoredErrorMessages.some(msg => error.message.includes(msg))) {
            return true;
        }

        return false;
    }

    extractErrorData(error, source, context) {
        const errorData = {
            message: error.message || 'Unknown error',
            stack: error.stack || 'No stack trace available',
            name: error.constructor.name,
            source,
            timestamp: new Date().toISOString(),
            context: {
                ...context,
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                pid: process.pid,
                uptime: process.uptime()
            }
        };

        // Add specific error properties
        if (error.code) errorData.code = error.code;
        if (error.errno) errorData.errno = error.errno;
        if (error.syscall) errorData.syscall = error.syscall;
        if (error.path) errorData.path = error.path;
        if (error.port) errorData.port = error.port;
        if (error.hostname) errorData.hostname = error.hostname;

        // Database-specific error handling
        if (error.number) errorData.sqlErrorNumber = error.number;
        if (error.severity) errorData.sqlSeverity = error.severity;
        if (error.state) errorData.sqlState = error.state;
        if (error.serverName) errorData.sqlServerName = error.serverName;
        if (error.procName) errorData.sqlProcName = error.procName;
        if (error.lineNumber) errorData.sqlLineNumber = error.lineNumber;

        return errorData;
    }

    buildIssueData(errorData) {
        const isAutomatic = errorData.context.captureMethod === 'automatic';
        const prefix = isAutomatic ? '[AUTO]' : '[MANUAL]';
        
        return {
            title: `${prefix} Backend Error: ${errorData.name} - ${errorData.message}`,
            body: this.buildIssueBody(errorData),
            labels: this.getLabelsForError(errorData)
        };
    }

    buildIssueBody(errorData) {
        const isAutomatic = errorData.context.captureMethod === 'automatic';
        
        return `## ${isAutomatic ? 'Automatic Backend Error Report' : 'Manual Backend Error Report'}

### Error Details
- **Type**: ${errorData.name}
- **Message**: ${errorData.message}
- **Source**: ${errorData.source}
- **Timestamp**: ${errorData.timestamp}
- **Capture Method**: ${errorData.context.captureMethod || 'manual'}

### Environment Information
- **Node.js Version**: ${errorData.context.nodeVersion}
- **Platform**: ${errorData.context.platform}
- **Architecture**: ${errorData.context.arch}
- **Process ID**: ${errorData.context.pid}
- **Uptime**: ${Math.round(errorData.context.uptime)} seconds

${errorData.code ? `### Error Code
\`${errorData.code}\`` : ''}

${errorData.sqlProcName ? `### Database Information
- **Procedure**: ${errorData.sqlProcName}
- **SQL Error Number**: ${errorData.sqlErrorNumber}
- **SQL State**: ${errorData.sqlState}
- **Server**: ${errorData.sqlServerName}
- **Line Number**: ${errorData.sqlLineNumber}` : ''}

### Stack Trace
\`\`\`
${errorData.stack}
\`\`\`

### Context
\`\`\`json
${JSON.stringify(errorData.context, null, 2)}
\`\`\`

---
*This issue was ${isAutomatic ? 'automatically' : 'manually'} generated by the H10CM error reporting system at ${errorData.timestamp}*`;
    }

    getLabelsForError(errorData) {
        const labels = ['bug', 'backend'];
        
        if (errorData.context.captureMethod === 'automatic') {
            labels.push('auto-generated');
        }
        
        if (errorData.source === 'uncaughtException') {
            labels.push('critical', 'uncaught-exception');
        } else if (errorData.source === 'unhandledRejection') {
            labels.push('high-priority', 'promise-rejection');
        }
        
        if (errorData.sqlProcName) {
            labels.push('database', 'sql-error');
        }
        
        if (errorData.code) {
            labels.push('system-error');
        }
        
        return labels;
    }

    async createGitHubIssue(issueData) {
        try {
            const fetch = await initializeFetch();
            
            const response = await fetch(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}/issues`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'H10CM-Backend-Error-Reporter/1.0'
                },
                body: JSON.stringify(issueData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                return {
                    success: false,
                    error: errorData.message || 'GitHub API error',
                    status: response.status
                };
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Middleware for Express error handling
    errorMiddleware() {
        return (error, req, res, next) => {
            console.error('🔥 Express Error Middleware:', error);
            
            // Report error to GitHub with request context
            this.reportError(error, 'express-middleware', {
                captureMethod: 'automatic',
                url: req.url,
                method: req.method,
                userAgent: req.get('User-Agent'),
                ip: req.ip,
                timestamp: new Date().toISOString(),
                headers: req.headers,
                params: req.params,
                query: req.query,
                body: req.body
            });
            
            // Continue with normal error handling
            next(error);
        };
    }

    // Method to manually report API errors
    async reportAPIError(error, req, additionalContext = {}) {
        const context = {
            captureMethod: 'automatic',
            url: req.url,
            method: req.method,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            timestamp: new Date().toISOString(),
            headers: req.headers,
            params: req.params,
            query: req.query,
            body: req.body,
            ...additionalContext
        };
        
        return await this.reportError(error, 'api-endpoint', context);
    }
}

// Create singleton instance
const githubErrorReporting = new GitHubErrorReportingService();

module.exports = githubErrorReporting;
