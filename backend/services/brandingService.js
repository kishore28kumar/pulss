const Branding = require('../models/Branding');
const EmailTemplate = require('../models/EmailTemplate');
const BrandingAuditLog = require('../models/BrandingAuditLog');

class BrandingService {
  // Create or update branding for a tenant
  async upsertBranding(tenantId, brandingData, user) {
    try {
      let branding = await Branding.findOne({ tenantId });
      const isNew = !branding;
      
      if (isNew) {
        branding = new Branding({
          tenantId,
          ...brandingData,
          metadata: {
            createdBy: user.userId,
            updatedBy: user.userId,
          },
        });
      } else {
        // Store old values for audit
        const oldValues = branding.toObject();
        
        // Update fields
        Object.assign(branding, brandingData);
        branding.metadata.updatedBy = user.userId;
        
        // Log the change
        await BrandingAuditLog.logChange({
          tenantId,
          action: 'update',
          entity: 'branding',
          changes: {
            before: oldValues,
            after: branding.toObject(),
          },
          userId: user.userId,
          userName: user.userName,
          userRole: user.role,
          ipAddress: user.ipAddress,
          userAgent: user.userAgent,
        });
      }
      
      await branding.save();
      
      if (isNew) {
        await BrandingAuditLog.logChange({
          tenantId,
          action: 'create',
          entity: 'branding',
          changes: {
            after: branding.toObject(),
          },
          userId: user.userId,
          userName: user.userName,
          userRole: user.role,
          ipAddress: user.ipAddress,
          userAgent: user.userAgent,
        });
      }
      
      return branding;
    } catch (error) {
      throw new Error(`Failed to upsert branding: ${error.message}`);
    }
  }

  // Get branding by tenant ID
  async getBranding(tenantId, includeDraft = false) {
    try {
      if (includeDraft) {
        return await Branding.findOne({ tenantId });
      }
      return await Branding.findByTenantId(tenantId);
    } catch (error) {
      throw new Error(`Failed to get branding: ${error.message}`);
    }
  }

  // Update logo
  async updateLogo(tenantId, logoData, user) {
    try {
      const branding = await Branding.findOne({ tenantId });
      if (!branding) {
        throw new Error('Branding not found');
      }

      const oldLogo = branding.logo;
      branding.logo = logoData;
      branding.metadata.updatedBy = user.userId;
      await branding.save();

      await BrandingAuditLog.logChange({
        tenantId,
        action: 'update',
        entity: 'logo',
        changes: {
          before: oldLogo,
          after: logoData,
        },
        userId: user.userId,
        userName: user.userName,
        userRole: user.role,
        ipAddress: user.ipAddress,
        userAgent: user.userAgent,
      });

      return branding;
    } catch (error) {
      throw new Error(`Failed to update logo: ${error.message}`);
    }
  }

  // Update colors
  async updateColors(tenantId, colors, user) {
    try {
      const branding = await Branding.findOne({ tenantId });
      if (!branding) {
        throw new Error('Branding not found');
      }

      const oldColors = branding.colors;
      branding.colors = { ...branding.colors, ...colors };
      branding.metadata.updatedBy = user.userId;
      await branding.save();

      await BrandingAuditLog.logChange({
        tenantId,
        action: 'update',
        entity: 'colors',
        changes: {
          before: oldColors,
          after: branding.colors,
        },
        userId: user.userId,
        userName: user.userName,
        userRole: user.role,
        ipAddress: user.ipAddress,
        userAgent: user.userAgent,
      });

      return branding;
    } catch (error) {
      throw new Error(`Failed to update colors: ${error.message}`);
    }
  }

  // Update custom domain
  async updateCustomDomain(tenantId, domainData, user) {
    try {
      const branding = await Branding.findOne({ tenantId });
      if (!branding) {
        throw new Error('Branding not found');
      }

      if (!branding.features.customDomain) {
        throw new Error('Custom domain feature is not enabled for this tenant');
      }

      const oldDomain = branding.customDomain;
      branding.customDomain = { ...branding.customDomain, ...domainData };
      branding.metadata.updatedBy = user.userId;
      await branding.save();

      await BrandingAuditLog.logChange({
        tenantId,
        action: 'update',
        entity: 'custom_domain',
        changes: {
          before: oldDomain,
          after: branding.customDomain,
        },
        userId: user.userId,
        userName: user.userName,
        userRole: user.role,
        ipAddress: user.ipAddress,
        userAgent: user.userAgent,
      });

      return branding;
    } catch (error) {
      throw new Error(`Failed to update custom domain: ${error.message}`);
    }
  }

  // Verify custom domain
  async verifyCustomDomain(tenantId, user) {
    try {
      const branding = await Branding.findOne({ tenantId });
      if (!branding || !branding.customDomain?.domain) {
        throw new Error('Custom domain not configured');
      }

      // Here you would implement actual DNS verification logic
      // For now, we'll just mark it as verified
      branding.customDomain.isVerified = true;
      branding.metadata.updatedBy = user.userId;
      await branding.save();

      await BrandingAuditLog.logChange({
        tenantId,
        action: 'domain_verify',
        entity: 'custom_domain',
        description: `Domain ${branding.customDomain.domain} verified`,
        userId: user.userId,
        userName: user.userName,
        userRole: user.role,
        ipAddress: user.ipAddress,
        userAgent: user.userAgent,
      });

      return branding;
    } catch (error) {
      throw new Error(`Failed to verify custom domain: ${error.message}`);
    }
  }

  // Enable SSL for custom domain
  async enableSSL(tenantId, user) {
    try {
      const branding = await Branding.findOne({ tenantId });
      if (!branding || !branding.customDomain?.isVerified) {
        throw new Error('Custom domain not verified');
      }

      if (!branding.features.customDomain) {
        throw new Error('Custom domain feature is not enabled');
      }

      // Here you would implement actual SSL provisioning logic (e.g., Let's Encrypt)
      branding.customDomain.sslEnabled = true;
      branding.customDomain.sslCertificate = {
        issuer: "Let's Encrypt",
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        autoRenew: true,
      };
      branding.metadata.updatedBy = user.userId;
      await branding.save();

      await BrandingAuditLog.logChange({
        tenantId,
        action: 'ssl_enable',
        entity: 'custom_domain',
        description: `SSL enabled for ${branding.customDomain.domain}`,
        userId: user.userId,
        userName: user.userName,
        userRole: user.role,
        ipAddress: user.ipAddress,
        userAgent: user.userAgent,
      });

      return branding;
    } catch (error) {
      throw new Error(`Failed to enable SSL: ${error.message}`);
    }
  }

  // Toggle feature (super admin only)
  async toggleFeature(tenantId, featureName, enabled, user) {
    try {
      if (user.role !== 'super_admin') {
        throw new Error('Only super admins can toggle features');
      }

      const branding = await Branding.findOne({ tenantId });
      if (!branding) {
        throw new Error('Branding not found');
      }

      const oldValue = branding.features[featureName];
      branding.features[featureName] = enabled;
      branding.metadata.updatedBy = user.userId;
      await branding.save();

      await BrandingAuditLog.logChange({
        tenantId,
        action: 'feature_toggle',
        entity: 'branding',
        description: `Feature '${featureName}' ${enabled ? 'enabled' : 'disabled'}`,
        changes: {
          before: { [featureName]: oldValue },
          after: { [featureName]: enabled },
        },
        userId: user.userId,
        userName: user.userName,
        userRole: user.role,
        ipAddress: user.ipAddress,
        userAgent: user.userAgent,
      });

      return branding;
    } catch (error) {
      throw new Error(`Failed to toggle feature: ${error.message}`);
    }
  }

  // Get audit logs
  async getAuditLogs(tenantId, options = {}) {
    try {
      return await BrandingAuditLog.getAuditTrail(tenantId, options);
    } catch (error) {
      throw new Error(`Failed to get audit logs: ${error.message}`);
    }
  }

  // Publish branding (make it live)
  async publishBranding(tenantId, user) {
    try {
      const branding = await Branding.findOne({ tenantId });
      if (!branding) {
        throw new Error('Branding not found');
      }

      await branding.publish();

      await BrandingAuditLog.logChange({
        tenantId,
        action: 'publish',
        entity: 'branding',
        description: `Branding version ${branding.metadata.version} published`,
        userId: user.userId,
        userName: user.userName,
        userRole: user.role,
        ipAddress: user.ipAddress,
        userAgent: user.userAgent,
      });

      return branding;
    } catch (error) {
      throw new Error(`Failed to publish branding: ${error.message}`);
    }
  }

  // Create email template
  async createEmailTemplate(templateData, user) {
    try {
      const template = new EmailTemplate({
        ...templateData,
        metadata: {
          createdBy: user.userId,
          updatedBy: user.userId,
        },
      });

      await template.save();
      return template;
    } catch (error) {
      throw new Error(`Failed to create email template: ${error.message}`);
    }
  }

  // Get email template
  async getEmailTemplate(tenantId, type) {
    try {
      return await EmailTemplate.findOne({ tenantId, type, isActive: true });
    } catch (error) {
      throw new Error(`Failed to get email template: ${error.message}`);
    }
  }

  // Render email with branding
  async renderEmail(tenantId, templateType, data) {
    try {
      const [branding, template] = await Promise.all([
        this.getBranding(tenantId),
        this.getEmailTemplate(tenantId, templateType),
      ]);

      if (!template) {
        throw new Error(`Email template '${templateType}' not found`);
      }

      return template.render(data, branding);
    } catch (error) {
      throw new Error(`Failed to render email: ${error.message}`);
    }
  }
}

module.exports = new BrandingService();
