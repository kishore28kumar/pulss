/* Advanced Notifications Controller (cleaned)
 *
 * Defensive minimal implementations so the backend can start.
 */

const { pool } = require('../config/db');

// Helper: safely stringify objects for DB
function maybeStringify(v) {
  return v === undefined || v === null ? null : (typeof v === 'object' ? JSON.stringify(v) : v);
}

// =========================================================================
// TEMPLATES
// =========================================================================

exports.getTemplates = async (req, res) => {
  try {
    const tenantId = (req.user && (req.user.tenantId || req.user.tenant_id)) || null;
    const { category, language } = req.query || {};

    let sql = `SELECT * FROM notification_templates WHERE (tenant_id = ? OR tenant_id IS NULL)`;
    const params = [tenantId];

    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }
    if (language) {
      sql += ` AND language = ?`;
      params.push(language);
    }
    sql += ` ORDER BY created_at DESC`;

    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows || result });
  } catch (err) {
    console.error('getTemplates error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get templates', error: err.message });
  }
};

exports.getTemplate = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: 'Template id required' });

    const result = await pool.query('SELECT * FROM notification_templates WHERE template_id = ? OR id = ?', [id, id]);
    const row = (result.rows && result.rows[0]) || (Array.isArray(result) && result[0]) || null;
    if (!row) return res.status(404).json({ success: false, message: 'Template not found' });
    return res.json({ success: true, data: row });
  } catch (err) {
    console.error('getTemplate error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get template', error: err.message });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const tenantId = (req.user && (req.user.tenantId || req.user.tenant_id)) || null;
    const userId = (req.user && req.user.id) || null;
    const body = req.body || {};
    const { template_key, template_name, category = null, language = 'en', email_subject = null, email_body = null } = body;

    if (!template_key || !template_name) {
      return res.status(400).json({ success: false, message: 'template_key and template_name are required' });
    }

    const sql =
      `INSERT INTO notification_templates (tenant_id, template_key, template_name, category, language, email_subject, email_body, created_by, created_at) ` +
      `VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`;
    const params = [tenantId, template_key, template_name, category, language, email_subject, email_body, userId];

    const result = await pool.query(sql, params);
    return res.status(201).json({ success: true, message: 'Template created', data: (result.rows && result.rows[0]) || {} });
  } catch (err) {
    console.error('createTemplate error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create template', error: err.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const id = req.params.id || req.params.templateId;
    if (!id) return res.status(400).json({ success: false, message: 'Template id required' });
    const updates = req.body || {};

    const allowed = ['template_name', 'description', 'email_subject', 'email_body', 'is_active', 'variables', 'branding'];
    const set = [];
    const params = [];

    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(updates, k)) {
        set.push(`${k} = ?`);
        params.push(maybeStringify(updates[k]));
      }
    }
    if (set.length === 0) return res.status(400).json({ success: false, message: 'No valid fields to update' });

    const sql = `UPDATE notification_templates SET ${set.join(', ')}, updated_at = datetime('now') WHERE template_id = ? OR id = ?`;
    params.push(id, id);
    await pool.query(sql, params);
    return res.json({ success: true, message: 'Template updated' });
  } catch (err) {
    console.error('updateTemplate error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update template', error: err.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const id = req.params.id || req.params.templateId;
    if (!id) return res.status(400).json({ success: false, message: 'Template id required' });
    await pool.query('DELETE FROM notification_templates WHERE template_id = ? OR id = ?', [id, id]);
    return res.json({ success: true, message: 'Template deleted' });
  } catch (err) {
    console.error('deleteTemplate error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete template', error: err.message });
  }
};

// =========================================================================
// NOTIFICATIONS (basic persistence for in-app notifications)
// =========================================================================

exports.sendNotification = async (req, res) => {
  try {
    const body = req.body || {};
    const tenantId = body.tenantId || (req.user && (req.user.tenantId || req.user.tenant_id)) || null;
    const title = body.title || null;
    const message = body.message || null;
    const channel = body.channel || 'in_app';
    const data = body.data || null;
    const recipientAdminId = body.adminId || body.recipientAdminId || null;
    const recipientCustomerId = body.customerId || body.recipientCustomerId || null;

    if (!title || !message) return res.status(400).json({ success: false, message: 'title and message are required' });

    const sql =
      `INSERT INTO notifications_enhanced (tenant_id, admin_id, customer_id, title, message, channel, data, created_at) ` +
      `VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`;
    const params = [tenantId, recipientAdminId, recipientCustomerId, title, message, channel, maybeStringify(data)];
    await pool.query(sql, params);
    return res.json({ success: true, message: 'Notification queued' });
  } catch (err) {
    console.error('sendNotification error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send notification', error: err.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const tenantId = (req.user && (req.user.tenantId || req.user.tenant_id)) || null;
    const adminId = (req.user && (req.user.adminId || req.user.id)) || null;
    const customerId = (req.user && req.user.customerId) || null;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    const sql =
      `SELECT * FROM notifications_enhanced WHERE tenant_id = ? AND (admin_id = ? OR customer_id = ?) ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const params = [tenantId, adminId, customerId, limit, offset];
    const result = await pool.query(sql, params);
    return res.json({ success: true, data: result.rows || result, pagination: { page, limit } });
  } catch (err) {
    console.error('getNotifications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get notifications', error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: 'Notification id required' });
    await pool.query("UPDATE notifications_enhanced SET read = 1, read_at = datetime('now'), updated_at = datetime('now') WHERE notification_id = ? OR id = ?", [id, id]);
    return res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    console.error('markAsRead error:', err);
    return res.status(500).json({ success: false, message: 'Failed to mark as read', error: err.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const tenantId = (req.user && (req.user.tenantId || req.user.tenant_id)) || null;
    const adminId = (req.user && (req.user.adminId || req.user.id)) || null;
    const customerId = (req.user && req.user.customerId) || null;
    await pool.query(
      "UPDATE notifications_enhanced SET read = 1, read_at = datetime('now'), updated_at = datetime('now') WHERE tenant_id = ? AND (admin_id = ? OR customer_id = ?) AND read = 0",
      [tenantId, adminId, customerId]
    );
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('markAllAsRead error:', err);
    return res.status(500).json({ success: false, message: 'Failed to mark all as read', error: err.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: 'Notification id required' });
    await pool.query('DELETE FROM notifications_enhanced WHERE notification_id = ? OR id = ?', [id, id]);
    return res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    console.error('deleteNotification error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete notification', error: err.message });
  }
};

// alias
exports.exportNotifications = exports.exportHistory || (async (req, res) => { res.status(501).json({ success: false, message: 'exportHistory not implemented' }); });
