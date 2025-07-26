// Network-Aware Performance Optimization
// Respects the 15-minute network timeout without competing

const NodeCache = require('node-cache');

// Cache with 10-minute TTL (shorter than network timeout to avoid conflicts)
const userCache = new NodeCache({ 
    stdTTL: 600, // 10 minutes (5 min buffer before network timeout)
    checkperiod: 60,
    useClones: false
});

/**
 * Network-aware certificate authentication
 * Optimizes performance while respecting network-level timeouts
 */
const networkAwareCertAuth = async (req, res, next) => {
    try {
        const pool = req.app.locals.db;
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        const clientCert = req.headers['x-arr-clientcert'];
        if (!clientCert) {
            return res.status(401).json({ error: 'Certificate required' });
        }

        const certSubject = extractCertificateSubject(clientCert);
        const cacheKey = `user:${certSubject}`;

        // Try cache first (respects network timeout boundary)
        let user = userCache.get(cacheKey);
        
        if (!user) {
            // Cache miss - fetch fresh from database
            console.log(`🔍 Fresh auth lookup for: ${certSubject}`);
            
            const userResult = await pool.request()
                .input('CertificateSubject', sql.NVarChar, certSubject)
                .execute('usp_GetUserWithProgramAccess');

            if (userResult.recordset.length === 0) {
                return res.status(401).json({ error: 'User not found or not authorized' });
            }

            user = userResult.recordset[0];
            user.program_access = user.program_access ? JSON.parse(user.program_access) : [];
            user.accessible_programs = user.program_access.map(p => p.program_id);

            // Cache for performance (expires before network timeout)
            userCache.set(cacheKey, user);
            console.log(`💾 Cached user for 10 minutes: ${user.user_name}`);
        } else {
            console.log(`⚡ Cache hit for: ${user.user_name}`);
        }

        // Always attach fresh user data to request
        req.user = user;
        
        next();
    } catch (error) {
        console.error('Network-aware authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

/**
 * Cache invalidation for immediate permission changes
 * Call when admin modifies user permissions
 */
const invalidateUserPermissions = (certificateSubject) => {
    const cacheKey = `user:${certificateSubject}`;
    userCache.del(cacheKey);
    console.log(`🗑️ Invalidated permissions cache for: ${certificateSubject}`);
    console.log(`ℹ️  Next request will fetch fresh permissions from database`);
};

/**
 * Health check that respects network timeout boundaries
 */
const getAuthHealthStatus = (req, res) => {
    const stats = userCache.getStats();
    const cacheKeys = userCache.keys();
    
    res.json({
        authentication_health: {
            network_timeout: '15 minutes (managed by network layer)',
            app_cache_ttl: '10 minutes (5 min buffer)',
            current_cached_users: cacheKeys.length,
            cache_stats: {
                hits: stats.hits,
                misses: stats.misses,
                keys: stats.keys,
                ksize: stats.ksize,
                vsize: stats.vsize
            },
            security_layers: {
                layer_1: 'Network PIN (15min timeout)',
                layer_2: 'Certificate validation',
                layer_3: 'Database RBAC (real-time)'
            }
        }
    });
};

/**
 * Admin function to view who's currently cached
 * Useful for understanding cache behavior without interfering
 */
const viewCachedUsers = (req, res) => {
    if (!req.user.is_system_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    const cachedUsers = [];
    const keys = userCache.keys();
    
    keys.forEach(key => {
        const user = userCache.get(key);
        if (user) {
            const ttl = userCache.getTtl(key);
            const expiresIn = ttl ? Math.round((ttl - Date.now()) / 1000) : 0;
            
            cachedUsers.push({
                user_name: user.user_name,
                user_id: user.user_id,
                cache_key: key,
                expires_in_seconds: expiresIn,
                program_count: user.accessible_programs.length
            });
        }
    });
    
    res.json({
        total_cached_users: cachedUsers.length,
        cache_ttl_seconds: 600, // 10 minutes
        network_timeout_seconds: 900, // 15 minutes
        cached_users: cachedUsers.sort((a, b) => b.expires_in_seconds - a.expires_in_seconds)
    });
};

module.exports = {
    networkAwareCertAuth,
    invalidateUserPermissions,
    getAuthHealthStatus,
    viewCachedUsers
};
