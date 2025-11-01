const { pool } = require('../config/db');
const crypto = require('crypto');

// Helper: Generate invite token
function generateInviteToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Helper: Calculate expiration date (7 days from now)
function calculateExpirationDate() {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return expiresAt;
}

// Check if bulk invite is enabled for tenant
async function checkBulkInviteEnabled(tenantId) {
    const result = await pool.query(
        `SELECT bulk_invite_enabled FROM feature_flags WHERE tenant_id = $1`,
        [tenantId]
    );
    
    if (result.rows.length === 0) {
        // If no feature flags exist, create default entry
        await pool.query(
            `INSERT INTO feature_flags (tenant_id, bulk_invite_enabled) VALUES ($1, false)`,
            [tenantId]
        );
        return false;
    }
    
    return result.rows[0].bulk_invite_enabled;
}

// Create a single invite
exports.createInvite = async (req, res) => {
    const client = await pool.connect();
    try {
        const { email, role = 'customer', metadata } = req.body;
        const { tenant_id: tenantId, id: adminId } = req.user;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Check if bulk invite is enabled
        const isEnabled = await checkBulkInviteEnabled(tenantId);
        if (!isEnabled) {
            return res.status(403).json({ 
                error: 'Bulk invite feature is not enabled for this tenant',
                code: 'FEATURE_DISABLED'
            });
        }

        await client.query('BEGIN');

        // Cancel any existing pending invites for this email
        await client.query(
            `UPDATE user_invites 
             SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW() 
             WHERE tenant_id = $1 AND email = $2 AND status = 'pending'`,
            [tenantId, email]
        );

        // Create new invite
        const inviteToken = generateInviteToken();
        const expiresAt = calculateExpirationDate();

        const result = await client.query(
            `INSERT INTO user_invites (tenant_id, email, role, invited_by, invite_token, expires_at, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING invite_id, email, role, status, expires_at, created_at`,
            [tenantId, email, role, adminId, inviteToken, expiresAt, metadata ? JSON.stringify(metadata) : null]
        );

        await client.query('COMMIT');

        res.status(201).json({
            invite: result.rows[0],
            inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite?token=${inviteToken}`
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating invite:', err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'An active invite already exists for this email' });
        }
        res.status(500).json({ error: 'Failed to create invite' });
    } finally {
        client.release();
    }
};

// Create bulk invites from array
exports.createBulkInvites = async (req, res) => {
    const client = await pool.connect();
    try {
        const { invites, method = 'manual' } = req.body;
        const { tenant_id: tenantId, id: adminId } = req.user;

        if (!invites || !Array.isArray(invites) || invites.length === 0) {
            return res.status(400).json({ error: 'Invites array is required and must not be empty' });
        }

        if (invites.length > 1000) {
            return res.status(400).json({ error: 'Maximum 1000 invites allowed per batch' });
        }

        // Check if bulk invite is enabled
        const isEnabled = await checkBulkInviteEnabled(tenantId);
        if (!isEnabled) {
            return res.status(403).json({ 
                error: 'Bulk invite feature is not enabled for this tenant',
                code: 'FEATURE_DISABLED'
            });
        }

        await client.query('BEGIN');

        // Create batch record
        const batchResult = await client.query(
            `INSERT INTO bulk_invite_batches (tenant_id, created_by, total_invites, method, status)
             VALUES ($1, $2, $3, $4, 'processing')
             RETURNING batch_id`,
            [tenantId, adminId, invites.length, method]
        );
        const batchId = batchResult.rows[0].batch_id;

        const results = {
            successful: [],
            failed: [],
            skipped: []
        };

        // Process each invite
        for (const invite of invites) {
            try {
                const { email, role = 'customer', metadata } = invite;

                if (!email || !email.includes('@')) {
                    results.failed.push({ email, error: 'Invalid email format' });
                    continue;
                }

                // Check if user already exists
                const existingUser = await client.query(
                    `SELECT customer_id FROM customers WHERE tenant_id = $1 AND email = $2
                     UNION
                     SELECT admin_id as customer_id FROM admins WHERE tenant_id = $1 AND email = $2`,
                    [tenantId, email]
                );

                if (existingUser.rows.length > 0) {
                    results.skipped.push({ email, reason: 'User already exists' });
                    continue;
                }

                // Cancel any existing pending invites
                await client.query(
                    `UPDATE user_invites 
                     SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW() 
                     WHERE tenant_id = $1 AND email = $2 AND status = 'pending'`,
                    [tenantId, email]
                );

                // Create new invite
                const inviteToken = generateInviteToken();
                const expiresAt = calculateExpirationDate();

                const result = await client.query(
                    `INSERT INTO user_invites (tenant_id, email, role, invited_by, invite_token, expires_at, metadata, batch_id)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                     RETURNING invite_id, email, role, status, expires_at`,
                    [tenantId, email, role, adminId, inviteToken, expiresAt, 
                     metadata ? JSON.stringify(metadata) : null, batchId]
                );

                results.successful.push({
                    ...result.rows[0],
                    inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite?token=${inviteToken}`
                });
            } catch (err) {
                console.error('Error processing invite:', err);
                results.failed.push({ email: invite.email, error: err.message });
            }
        }

        // Update batch statistics
        await client.query(
            `UPDATE bulk_invite_batches 
             SET successful_invites = $1, 
                 failed_invites = $2, 
                 status = 'completed',
                 completed_at = NOW()
             WHERE batch_id = $3`,
            [results.successful.length, results.failed.length, batchId]
        );

        await client.query('COMMIT');

        res.status(201).json({
            batchId,
            summary: {
                total: invites.length,
                successful: results.successful.length,
                failed: results.failed.length,
                skipped: results.skipped.length
            },
            results
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating bulk invites:', err);
        res.status(500).json({ error: 'Failed to create bulk invites' });
    } finally {
        client.release();
    }
};

// Get all invites for tenant with filtering
exports.getInvites = async (req, res) => {
    try {
        const { tenant_id: tenantId } = req.user;
        const { status, role, page = 1, limit = 50 } = req.query;

        let query = `
            SELECT 
                i.invite_id, i.email, i.role, i.status, 
                i.expires_at, i.accepted_at, i.created_at,
                i.batch_id, i.metadata,
                a.full_name as invited_by_name,
                a.email as invited_by_email
            FROM user_invites i
            LEFT JOIN admins a ON i.invited_by = a.admin_id
            WHERE i.tenant_id = $1
        `;
        const params = [tenantId];
        let paramCount = 1;

        if (status) {
            paramCount++;
            query += ` AND i.status = $${paramCount}`;
            params.push(status);
        }

        if (role) {
            paramCount++;
            query += ` AND i.role = $${paramCount}`;
            params.push(role);
        }

        query += ` ORDER BY i.created_at DESC`;
        query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, (page - 1) * limit);

        const result = await pool.query(query, params);

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM user_invites
            WHERE tenant_id = $1
            ${status ? ' AND status = $2' : ''}
            ${role ? ` AND role = $${status ? 3 : 2}` : ''}
        `;
        const countParams = [tenantId];
        if (status) countParams.push(status);
        if (role) countParams.push(role);
        
        const countResult = await pool.query(countQuery, countParams);

        res.json({
            invites: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].total),
                pages: Math.ceil(countResult.rows[0].total / limit)
            }
        });
    } catch (err) {
        console.error('Error fetching invites:', err);
        res.status(500).json({ error: 'Failed to fetch invites' });
    }
};

// Get invite statistics
exports.getInviteStats = async (req, res) => {
    try {
        const { tenant_id: tenantId } = req.user;

        const result = await pool.query(
            `SELECT 
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
                COUNT(*) FILTER (WHERE status = 'expired') as expired,
                COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
                COUNT(*) as total
             FROM user_invites
             WHERE tenant_id = $1`,
            [tenantId]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching invite stats:', err);
        res.status(500).json({ error: 'Failed to fetch invite statistics' });
    }
};

// Resend invite
exports.resendInvite = async (req, res) => {
    const client = await pool.connect();
    try {
        const { inviteId } = req.params;
        const { tenant_id: tenantId } = req.user;

        await client.query('BEGIN');

        // Get existing invite
        const existingInvite = await client.query(
            `SELECT * FROM user_invites WHERE invite_id = $1 AND tenant_id = $2`,
            [inviteId, tenantId]
        );

        if (existingInvite.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Invite not found' });
        }

        const invite = existingInvite.rows[0];

        if (invite.status !== 'pending' && invite.status !== 'expired') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Can only resend pending or expired invites' });
        }

        // Update invite with new token and expiration
        const newToken = generateInviteToken();
        const newExpiresAt = calculateExpirationDate();

        const result = await client.query(
            `UPDATE user_invites 
             SET invite_token = $1, 
                 expires_at = $2, 
                 status = 'pending',
                 updated_at = NOW()
             WHERE invite_id = $3
             RETURNING invite_id, email, role, status, expires_at`,
            [newToken, newExpiresAt, inviteId]
        );

        await client.query('COMMIT');

        res.json({
            invite: result.rows[0],
            inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite?token=${newToken}`
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error resending invite:', err);
        res.status(500).json({ error: 'Failed to resend invite' });
    } finally {
        client.release();
    }
};

// Cancel invite
exports.cancelInvite = async (req, res) => {
    try {
        const { inviteId } = req.params;
        const { tenant_id: tenantId } = req.user;

        const result = await pool.query(
            `UPDATE user_invites 
             SET status = 'cancelled', 
                 cancelled_at = NOW(),
                 updated_at = NOW()
             WHERE invite_id = $1 AND tenant_id = $2 AND status = 'pending'
             RETURNING invite_id, email, status`,
            [inviteId, tenantId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invite not found or cannot be cancelled' });
        }

        res.json({ invite: result.rows[0] });
    } catch (err) {
        console.error('Error cancelling invite:', err);
        res.status(500).json({ error: 'Failed to cancel invite' });
    }
};

// Accept invite (public endpoint)
exports.acceptInvite = async (req, res) => {
    const client = await pool.connect();
    try {
        const { token, password, name, phone } = req.body;

        if (!token || !password) {
            return res.status(400).json({ error: 'Token and password are required' });
        }

        await client.query('BEGIN');

        // Get invite by token
        const inviteResult = await client.query(
            `SELECT * FROM user_invites WHERE invite_token = $1`,
            [token]
        );

        if (inviteResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Invalid invite token' });
        }

        const invite = inviteResult.rows[0];

        // Check if invite is valid
        if (invite.status !== 'pending') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Invite has already been used or cancelled' });
        }

        if (new Date(invite.expires_at) < new Date()) {
            await client.query('UPDATE user_invites SET status = \'expired\', updated_at = NOW() WHERE invite_id = $1', [invite.invite_id]);
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Invite has expired' });
        }

        // Create user account based on role
        const bcrypt = require('bcrypt');
        const passwordHash = await bcrypt.hash(password, 12);

        let userId;
        if (invite.role === 'admin') {
            const result = await client.query(
                `INSERT INTO admins (tenant_id, email, password_hash, full_name, role)
                 VALUES ($1, $2, $3, $4, 'admin')
                 RETURNING admin_id`,
                [invite.tenant_id, invite.email, passwordHash, name || invite.email]
            );
            userId = result.rows[0].admin_id;
        } else {
            const result = await client.query(
                `INSERT INTO customers (tenant_id, email, password_hash, name, phone)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING customer_id`,
                [invite.tenant_id, invite.email, passwordHash, name || invite.email, phone]
            );
            userId = result.rows[0].customer_id;
        }

        // Mark invite as accepted
        await client.query(
            `UPDATE user_invites 
             SET status = 'accepted', 
                 accepted_at = NOW(),
                 updated_at = NOW()
             WHERE invite_id = $1`,
            [invite.invite_id]
        );

        await client.query('COMMIT');

        res.json({
            message: 'Invite accepted successfully',
            userId,
            email: invite.email,
            role: invite.role,
            tenantId: invite.tenant_id
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error accepting invite:', err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'User with this email already exists' });
        }
        res.status(500).json({ error: 'Failed to accept invite' });
    } finally {
        client.release();
    }
};

// Get bulk invite batches
exports.getBatches = async (req, res) => {
    try {
        const { tenant_id: tenantId } = req.user;
        const { page = 1, limit = 20 } = req.query;

        const result = await pool.query(
            `SELECT 
                b.batch_id, b.total_invites, b.successful_invites, 
                b.failed_invites, b.method, b.status, 
                b.created_at, b.completed_at,
                a.full_name as created_by_name,
                a.email as created_by_email
             FROM bulk_invite_batches b
             LEFT JOIN admins a ON b.created_by = a.admin_id
             WHERE b.tenant_id = $1
             ORDER BY b.created_at DESC
             LIMIT $2 OFFSET $3`,
            [tenantId, limit, (page - 1) * limit]
        );

        // Get total count
        const countResult = await pool.query(
            `SELECT COUNT(*) as total FROM bulk_invite_batches WHERE tenant_id = $1`,
            [tenantId]
        );

        res.json({
            batches: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].total),
                pages: Math.ceil(countResult.rows[0].total / limit)
            }
        });
    } catch (err) {
        console.error('Error fetching batches:', err);
        res.status(500).json({ error: 'Failed to fetch invite batches' });
    }
};

// Expire old invites (can be called by a cron job)
exports.expireOldInvites = async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE user_invites 
             SET status = 'expired', updated_at = NOW()
             WHERE status = 'pending' AND expires_at < NOW()
             RETURNING invite_id`
        );

        res.json({
            message: 'Old invites expired successfully',
            count: result.rows.length
        });
    } catch (err) {
        console.error('Error expiring invites:', err);
        res.status(500).json({ error: 'Failed to expire old invites' });
    }
};
