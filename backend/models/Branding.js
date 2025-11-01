const mongoose = require('mongoose');

const brandingSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  // Logo and Visual Assets
  logo: {
    url: String,
    width: Number,
    height: Number,
    format: String, // 'png', 'svg', 'jpg'
  },
  favicon: {
    url: String,
    format: String,
  },
  mobileLogo: {
    url: String,
    width: Number,
    height: Number,
  },
  // Mobile App Icons
  mobileAppIcons: {
    ios: {
      icon57: String,
      icon72: String,
      icon76: String,
      icon114: String,
      icon120: String,
      icon144: String,
      icon152: String,
      icon180: String,
    },
    android: {
      icon36: String,
      icon48: String,
      icon72: String,
      icon96: String,
      icon144: String,
      icon192: String,
      icon512: String,
    },
  },
  // Color Scheme
  colors: {
    primary: {
      type: String,
      default: '#3B82F6',
    },
    secondary: {
      type: String,
      default: '#10B981',
    },
    accent: {
      type: String,
      default: '#F59E0B',
    },
    background: {
      type: String,
      default: '#FFFFFF',
    },
    text: {
      type: String,
      default: '#1F2937',
    },
    border: {
      type: String,
      default: '#E5E7EB',
    },
    error: {
      type: String,
      default: '#EF4444',
    },
    success: {
      type: String,
      default: '#10B981',
    },
    warning: {
      type: String,
      default: '#F59E0B',
    },
  },
  // Theme Configuration
  theme: {
    name: String,
    mode: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light',
    },
    fontFamily: {
      type: String,
      default: 'Inter, system-ui, sans-serif',
    },
    fontSize: {
      base: {
        type: String,
        default: '16px',
      },
      scale: {
        type: Number,
        default: 1.125, // Major second scale
      },
    },
    borderRadius: {
      type: String,
      default: '0.5rem',
    },
    spacing: {
      unit: {
        type: String,
        default: '0.25rem',
      },
    },
  },
  // CSS Overrides
  customCSS: {
    global: String,
    login: String,
    dashboard: String,
    checkout: String,
  },
  // Custom Domain
  customDomain: {
    domain: String,
    isVerified: {
      type: Boolean,
      default: false,
    },
    sslEnabled: {
      type: Boolean,
      default: false,
    },
    sslCertificate: {
      issuer: String,
      expiresAt: Date,
      autoRenew: {
        type: Boolean,
        default: true,
      },
    },
    dnsRecords: [{
      type: {
        type: String,
        enum: ['A', 'CNAME', 'TXT'],
      },
      name: String,
      value: String,
      verified: {
        type: Boolean,
        default: false,
      },
    }],
  },
  // Email Branding
  emailBranding: {
    headerLogo: String,
    footerText: String,
    signature: String,
    socialLinks: {
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String,
    },
    contactInfo: {
      email: String,
      phone: String,
      address: String,
    },
  },
  // Notification Branding
  notificationBranding: {
    icon: String,
    badgeColor: String,
    soundEnabled: {
      type: Boolean,
      default: true,
    },
  },
  // Invoice Branding
  invoiceBranding: {
    logo: String,
    companyName: String,
    companyAddress: String,
    taxId: String,
    footerText: String,
    termsAndConditions: String,
  },
  // Feature Toggles (controlled by super admin)
  features: {
    customLogo: {
      type: Boolean,
      default: true,
    },
    customColors: {
      type: Boolean,
      default: true,
    },
    customDomain: {
      type: Boolean,
      default: false,
    },
    customCSS: {
      type: Boolean,
      default: false,
    },
    whiteLabel: {
      type: Boolean,
      default: false,
    },
    emailBranding: {
      type: Boolean,
      default: true,
    },
    mobileBranding: {
      type: Boolean,
      default: true,
    },
    advancedTheming: {
      type: Boolean,
      default: false,
    },
  },
  // Metadata
  metadata: {
    createdBy: String,
    updatedBy: String,
    version: {
      type: Number,
      default: 1,
    },
    lastPublished: Date,
    isDraft: {
      type: Boolean,
      default: false,
    },
  },
}, {
  timestamps: true,
  collection: 'brandings',
});

// Indexes for performance
brandingSchema.index({ 'customDomain.domain': 1 });
brandingSchema.index({ 'metadata.isDraft': 1 });
brandingSchema.index({ createdAt: -1 });

// Methods
brandingSchema.methods.publish = function() {
  this.metadata.isDraft = false;
  this.metadata.lastPublished = new Date();
  this.metadata.version += 1;
  return this.save();
};

brandingSchema.methods.createDraft = function() {
  this.metadata.isDraft = true;
  return this.save();
};

// Statics
brandingSchema.statics.findByTenantId = function(tenantId) {
  return this.findOne({ tenantId, 'metadata.isDraft': false });
};

brandingSchema.statics.findDraftByTenantId = function(tenantId) {
  return this.findOne({ tenantId, 'metadata.isDraft': true });
};

const Branding = mongoose.model('Branding', brandingSchema);

module.exports = Branding;
