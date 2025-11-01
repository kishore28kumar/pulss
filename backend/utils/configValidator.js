/**
 * Configuration Validator
 * Validates environment variables and service configurations at startup
 */

class ConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate required environment variables
   */
  validateRequired(varName, value, description) {
    if (!value || value.trim() === '') {
      this.errors.push({
        variable: varName,
        description,
        message: `Missing required environment variable: ${varName}`,
        suggestion: `Set ${varName} in your .env file. ${description}`
      });
      return false;
    }
    return true;
  }

  /**
   * Validate optional environment variables (warnings only)
   */
  validateOptional(varName, value, description) {
    if (!value || value.trim() === '') {
      this.warnings.push({
        variable: varName,
        description,
        message: `Optional environment variable not set: ${varName}`,
        suggestion: `Consider setting ${varName} for ${description}`
      });
      return false;
    }
    return true;
  }

  /**
   * Validate FCM configuration
   */
  validateFCMConfig() {
    const enabled = process.env.FCM_ENABLED === 'true';
    
    if (enabled) {
      this.validateRequired(
        'FCM_SERVER_KEY',
        process.env.FCM_SERVER_KEY,
        'Required for Firebase Cloud Messaging push notifications'
      );
    } else {
      this.warnings.push({
        service: 'FCM',
        message: 'FCM push notifications are disabled',
        suggestion: 'Set FCM_ENABLED=true and configure FCM_SERVER_KEY to enable'
      });
    }

    return this.errors.length === 0;
  }

  /**
   * Validate Web Push configuration
   */
  validateWebPushConfig() {
    const enabled = process.env.WEB_PUSH_ENABLED === 'true';
    
    if (enabled) {
      this.validateRequired(
        'VAPID_PUBLIC_KEY',
        process.env.VAPID_PUBLIC_KEY,
        'Required for Web Push notifications'
      );
      this.validateRequired(
        'VAPID_PRIVATE_KEY',
        process.env.VAPID_PRIVATE_KEY,
        'Required for Web Push notifications'
      );
    } else {
      this.warnings.push({
        service: 'Web Push',
        message: 'Web Push notifications are disabled',
        suggestion: 'Set WEB_PUSH_ENABLED=true and configure VAPID keys to enable'
      });
    }

    return this.errors.length === 0;
  }

  /**
   * Validate Email/SMTP configuration
   */
  validateEmailConfig() {
    const enabled = process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true';
    
    if (enabled) {
      const provider = process.env.EMAIL_PROVIDER || 'smtp';
      
      switch (provider) {
        case 'sendgrid':
          this.validateRequired(
            'SENDGRID_API_KEY',
            process.env.SENDGRID_API_KEY,
            'Required for SendGrid email service'
          );
          this.validateRequired(
            'SENDGRID_FROM_EMAIL',
            process.env.SENDGRID_FROM_EMAIL,
            'Required sender email address for SendGrid'
          );
          break;
          
        case 'ses':
          this.validateRequired(
            'AWS_REGION',
            process.env.AWS_REGION,
            'Required for AWS SES'
          );
          this.validateRequired(
            'AWS_ACCESS_KEY_ID',
            process.env.AWS_ACCESS_KEY_ID,
            'Required for AWS SES'
          );
          this.validateRequired(
            'AWS_SECRET_ACCESS_KEY',
            process.env.AWS_SECRET_ACCESS_KEY,
            'Required for AWS SES'
          );
          break;
          
        case 'smtp':
          this.validateRequired(
            'SMTP_HOST',
            process.env.SMTP_HOST,
            'Required SMTP server hostname'
          );
          this.validateOptional(
            'SMTP_USER',
            process.env.SMTP_USER,
            'SMTP authentication username'
          );
          this.validateOptional(
            'SMTP_PASS',
            process.env.SMTP_PASS,
            'SMTP authentication password'
          );
          break;
          
        default:
          this.warnings.push({
            service: 'Email',
            message: `Unknown email provider: ${provider}`,
            suggestion: 'Set EMAIL_PROVIDER to sendgrid, ses, or smtp'
          });
      }
    } else {
      this.warnings.push({
        service: 'Email',
        message: 'Email notifications are disabled',
        suggestion: 'Set EMAIL_NOTIFICATIONS_ENABLED=true and configure email provider'
      });
    }

    return this.errors.length === 0;
  }

  /**
   * Validate SMS configuration
   */
  validateSMSConfig() {
    const enabled = process.env.SMS_NOTIFICATIONS_ENABLED === 'true';
    
    if (enabled) {
      const provider = process.env.SMS_PROVIDER || 'twilio';
      
      switch (provider) {
        case 'twilio':
          this.validateRequired(
            'TWILIO_ACCOUNT_SID',
            process.env.TWILIO_ACCOUNT_SID,
            'Required for Twilio SMS service'
          );
          this.validateRequired(
            'TWILIO_AUTH_TOKEN',
            process.env.TWILIO_AUTH_TOKEN,
            'Required for Twilio SMS service'
          );
          this.validateRequired(
            'TWILIO_PHONE_NUMBER',
            process.env.TWILIO_PHONE_NUMBER,
            'Required sender phone number for Twilio'
          );
          break;
          
        case 'msg91':
          this.validateRequired(
            'MSG91_AUTH_KEY',
            process.env.MSG91_AUTH_KEY,
            'Required for MSG91 SMS service'
          );
          this.validateRequired(
            'MSG91_SENDER_ID',
            process.env.MSG91_SENDER_ID,
            'Required sender ID for MSG91'
          );
          break;
          
        default:
          this.warnings.push({
            service: 'SMS',
            message: `SMS provider ${provider} configuration not validated`,
            suggestion: 'Ensure all required credentials are configured'
          });
      }
    } else {
      this.warnings.push({
        service: 'SMS',
        message: 'SMS notifications are disabled',
        suggestion: 'Set SMS_NOTIFICATIONS_ENABLED=true and configure SMS provider'
      });
    }

    return this.errors.length === 0;
  }

  /**
   * Validate all notification service configurations
   */
  validateAll() {
    this.errors = [];
    this.warnings = [];

    this.validateFCMConfig();
    this.validateWebPushConfig();
    this.validateEmailConfig();
    this.validateSMSConfig();

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  /**
   * Print validation results
   */
  printResults() {
    if (this.errors.length > 0) {
      console.error('\n❌ Configuration Errors:');
      this.errors.forEach((error, index) => {
        console.error(`\n${index + 1}. ${error.message}`);
        if (error.suggestion) {
          console.error(`   💡 ${error.suggestion}`);
        }
      });
    }

    if (this.warnings.length > 0) {
      console.warn('\n⚠️  Configuration Warnings:');
      this.warnings.forEach((warning, index) => {
        console.warn(`\n${index + 1}. ${warning.message}`);
        if (warning.suggestion) {
          console.warn(`   💡 ${warning.suggestion}`);
        }
      });
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ All notification service configurations are valid');
    }

    return this.errors.length === 0;
  }
}

module.exports = new ConfigValidator();
