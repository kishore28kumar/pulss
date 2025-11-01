const mongoose = require('mongoose');

const brandingAuditLogSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'create',
      'update',
      'delete',
      'publish',
      'draft',
      'feature_toggle',
      'domain_verify',
      'ssl_enable',
      'ssl_renew',
    ],
  },
  entity: {
    type: String,
    required: true,
    enum: [
      'branding',
      'logo',
      'colors',
      'theme',
      'custom_domain',
      'email_template',
      'css_override',
      'mobile_icons',
    ],
  },
  // Changed fields
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
  },
  // User who made the change
  userId: {
    type: String,
    required: true,
  },
  userName: String,
  userRole: {
    type: String,
    enum: ['super_admin', 'admin', 'tenant', 'partner', 'reseller'],
  },
  // IP and device info
  ipAddress: String,
  userAgent: String,
  // Additional context
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
}, {
  timestamps: true,
  collection: 'branding_audit_logs',
});

// Indexes
brandingAuditLogSchema.index({ tenantId: 1, createdAt: -1 });
brandingAuditLogSchema.index({ userId: 1, createdAt: -1 });
brandingAuditLogSchema.index({ action: 1, entity: 1 });
brandingAuditLogSchema.index({ createdAt: -1 });

// Statics
brandingAuditLogSchema.statics.logChange = async function(data) {
  return this.create(data);
};

brandingAuditLogSchema.statics.getAuditTrail = function(tenantId, options = {}) {
  const query = { tenantId };
  
  if (options.entity) {
    query.entity = options.entity;
  }
  
  if (options.action) {
    query.action = options.action;
  }
  
  if (options.userId) {
    query.userId = options.userId;
  }
  
  if (options.startDate || options.endDate) {
    query.createdAt = {};
    if (options.startDate) {
      query.createdAt.$gte = new Date(options.startDate);
    }
    if (options.endDate) {
      query.createdAt.$lte = new Date(options.endDate);
    }
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0);
};

const BrandingAuditLog = mongoose.model('BrandingAuditLog', brandingAuditLogSchema);

module.exports = BrandingAuditLog;
