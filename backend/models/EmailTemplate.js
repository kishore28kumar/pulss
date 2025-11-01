const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'welcome',
      'order_confirmation',
      'order_shipped',
      'order_delivered',
      'password_reset',
      'invoice',
      'promotional',
      'notification',
      'custom',
    ],
  },
  subject: {
    type: String,
    required: true,
  },
  // HTML template with branding variables
  htmlTemplate: {
    type: String,
    required: true,
  },
  // Plain text fallback
  textTemplate: String,
  // Template variables that can be used
  variables: [{
    name: String,
    description: String,
    required: {
      type: Boolean,
      default: false,
    },
  }],
  // Branding support
  useBranding: {
    type: Boolean,
    default: true,
  },
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  // Preview
  previewData: {
    type: mongoose.Schema.Types.Mixed,
  },
  // Metadata
  metadata: {
    createdBy: String,
    updatedBy: String,
    lastSent: Date,
    sendCount: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
  collection: 'email_templates',
});

// Indexes
emailTemplateSchema.index({ tenantId: 1, type: 1 });
emailTemplateSchema.index({ isActive: 1 });

// Methods
emailTemplateSchema.methods.render = function(data, branding) {
  let html = this.htmlTemplate;
  let text = this.textTemplate || '';
  
  // Replace branding variables
  if (branding && this.useBranding) {
    html = html
      .replace(/{{logo}}/g, branding.logo?.url || '')
      .replace(/{{primaryColor}}/g, branding.colors?.primary || '#3B82F6')
      .replace(/{{secondaryColor}}/g, branding.colors?.secondary || '#10B981')
      .replace(/{{companyName}}/g, branding.invoiceBranding?.companyName || '')
      .replace(/{{footerText}}/g, branding.emailBranding?.footerText || '')
      .replace(/{{contactEmail}}/g, branding.emailBranding?.contactInfo?.email || '')
      .replace(/{{contactPhone}}/g, branding.emailBranding?.contactInfo?.phone || '');
  }
  
  // Replace data variables
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, value);
    text = text.replace(regex, value);
  }
  
  return { html, text };
};

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);

module.exports = EmailTemplate;
