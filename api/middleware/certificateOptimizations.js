// Certificate Authentication Performance Optimizations
// Enhances existing certificate auth without replacing it

const NodeCache = require('node-cache');

// User cache with 5-minute TTL (balance between performance and real-time access)
const userCache = new NodeCache({ 
    stdTTL: 300, // 5 minutes
    checkperiod: 60, // Check for expired keys every minute
    useClones: false // Better performance
});

// Session tracking for logout capability
const activeSessions = new NodeCache({
    stdTTL: 28800, // 8 hours
    checkperiod: 300 // Check every 5 minutes
});

/**
 * Enhanced certificate authentication with caching
 * Maintains certificate security while improving performance
 */
const enhancedCertificateAuth = async (req, res, next) => {
    try {
        const pool = req.app.locals.db;
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        // Get certificate from header
        const clientCert = req.headers['x-arr-clientcert'];
        if (!clientCert) {
            return res.status(401).json({ error: 'Certificate required' });
        }

        const certSubject = extractCertificateSubject(clientCert);
        const cacheKey = `user:${certSubject}`;
        const sessionKey = `session:${certSubject}:${req.ip}`;

        // Check if session is blacklisted (for logout support)
        if (activeSessions.get(`blacklist:${sessionKey}`)) {
            return res.status(401).json({ error: 'Session terminated' });
        }

        // Try to get user from cache first
        let user = userCache.get(cacheKey);
        
        if (!user) {
            // Cache miss - fetch from database
            console.log(`🔍 Cache miss for user: ${certSubject}`);
            
            const userResult = await pool.request()
                .input('CertificateSubject', sql.NVarChar, certSubject)
                .execute('usp_GetUserWithProgramAccess');

            if (userResult.recordset.length === 0) {
                return res.status(401).json({ error: 'User not found or not authorized' });
            }

            user = userResult.recordset[0];
            user.program_access = user.program_access ? JSON.parse(user.program_access) : [];
            user.accessible_programs = user.program_access.map(p => p.program_id);

            // Cache the user data
            userCache.set(cacheKey, user);
            console.log(`💾 Cached user data for: ${user.user_name}`);
        } else {
            console.log(`⚡ Cache hit for user: ${user.user_name}`);
        }

        // Track active session
        activeSessions.set(sessionKey, {
            user_id: user.user_id,
            login_time: new Date(),
            last_activity: new Date(),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        // Attach user info to request
        req.user = user;
        req.sessionKey = sessionKey;
        
        next();
    } catch (error) {
        console.error('Enhanced certificate authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

/**
 * Logout endpoint - blacklists the current session
 * Provides session management without replacing certificates
 */
const logoutUser = (req, res) => {
    if (req.sessionKey) {
        // Blacklist the current session
        activeSessions.set(`blacklist:${req.sessionKey}`, true);
        
        // Remove from active sessions
        activeSessions.del(req.sessionKey);
        
        console.log(`🚪 User ${req.user.user_name} logged out from session ${req.sessionKey}`);
    }
    
    res.json({ 
        message: 'Logout successful',
        instruction: 'Remove certificate from browser or close browser to complete logout'
    });
};

/**
 * Get active sessions for admin monitoring
 */
const getActiveSessions = (req, res) => {
    if (!req.user.is_system_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const sessions = [];
    const keys = activeSessions.keys().filter(key => !key.startsWith('blacklist:'));
    
    keys.forEach(key => {
        const session = activeSessions.get(key);
        if (session) {
            sessions.push({
                session_id: key,
                ...session
            });
        }
    });
    
    res.json({
        total_sessions: sessions.length,
        sessions: sessions.sort((a, b) => new Date(b.last_activity) - new Date(a.last_activity))
    });
};

/**
 * Invalidate user cache when permissions change
 * Call this when user program access is modified
 */
const invalidateUserCache = (certificateSubject) => {
    const cacheKey = `user:${certificateSubject}`;
    userCache.del(cacheKey);
    console.log(`🗑️ Invalidated cache for user: ${certificateSubject}`);
};

/**
 * Force logout for specific user (admin function)
 */
const forceLogoutUser = (req, res) => {
    if (!req.user.is_system_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { certificate_subject } = req.body;
    if (!certificate_subject) {
        return res.status(400).json({ error: 'certificate_subject required' });
    }
    
    // Find and blacklist all sessions for this user
    const sessionKeys = activeSessions.keys().filter(key => 
        key.includes(certificate_subject) && !key.startsWith('blacklist:')
    );
    
    let loggedOutSessions = 0;
    sessionKeys.forEach(sessionKey => {
        activeSessions.set(`blacklist:${sessionKey}`, true);
        activeSessions.del(sessionKey);
        loggedOutSessions++;
    });
    
    // Also invalidate their cache
    invalidateUserCache(certificate_subject);
    
    res.json({
        message: `Force logout completed`,
        sessions_terminated: loggedOutSessions,
        user: certificate_subject
    });
};

module.exports = {
    enhancedCertificateAuth,
    logoutUser,
    getActiveSessions,
    invalidateUserCache,
    forceLogoutUser,
    userCache,
    activeSessions
};
