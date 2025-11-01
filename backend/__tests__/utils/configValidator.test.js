/**
 * Unit tests for Configuration Validator
 */

describe('ConfigValidator', () => {
  let configValidator;
  let originalEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };
    
    // Clear require cache to get fresh instance
    jest.resetModules();
    
    // Reset environment
    delete process.env.FCM_ENABLED;
    delete process.env.FCM_SERVER_KEY;
    delete process.env.WEB_PUSH_ENABLED;
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    delete process.env.EMAIL_NOTIFICATIONS_ENABLED;
    delete process.env.EMAIL_PROVIDER;
    delete process.env.SMTP_HOST;
    delete process.env.SMS_NOTIFICATIONS_ENABLED;
    
    configValidator = require('../../utils/configValidator');
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('validateRequired', () => {
    test('should return true for valid value', () => {
      configValidator.errors = [];
      const result = configValidator.validateRequired('TEST_VAR', 'test-value', 'Test description');
      expect(result).toBe(true);
      expect(configValidator.errors).toHaveLength(0);
    });

    test('should return false and add error for missing value', () => {
      configValidator.errors = [];
      const result = configValidator.validateRequired('TEST_VAR', '', 'Test description');
      expect(result).toBe(false);
      expect(configValidator.errors).toHaveLength(1);
      expect(configValidator.errors[0].variable).toBe('TEST_VAR');
    });

    test('should return false and add error for undefined value', () => {
      configValidator.errors = [];
      const result = configValidator.validateRequired('TEST_VAR', undefined, 'Test description');
      expect(result).toBe(false);
      expect(configValidator.errors).toHaveLength(1);
    });
  });

  describe('validateOptional', () => {
    test('should return true for valid value', () => {
      configValidator.warnings = [];
      const result = configValidator.validateOptional('TEST_VAR', 'test-value', 'Test description');
      expect(result).toBe(true);
      expect(configValidator.warnings).toHaveLength(0);
    });

    test('should return false and add warning for missing value', () => {
      configValidator.warnings = [];
      const result = configValidator.validateOptional('TEST_VAR', '', 'Test description');
      expect(result).toBe(false);
      expect(configValidator.warnings).toHaveLength(1);
      expect(configValidator.warnings[0].variable).toBe('TEST_VAR');
    });
  });

  describe('validateFCMConfig', () => {
    test('should pass when FCM is disabled', () => {
      process.env.FCM_ENABLED = 'false';
      configValidator.errors = [];
      configValidator.warnings = [];
      
      const result = configValidator.validateFCMConfig();
      
      expect(result).toBe(true);
      expect(configValidator.errors).toHaveLength(0);
      expect(configValidator.warnings.length).toBeGreaterThan(0);
    });

    test('should fail when FCM is enabled but server key is missing', () => {
      process.env.FCM_ENABLED = 'true';
      configValidator.errors = [];
      
      const result = configValidator.validateFCMConfig();
      
      expect(result).toBe(false);
      expect(configValidator.errors).toHaveLength(1);
      expect(configValidator.errors[0].variable).toBe('FCM_SERVER_KEY');
    });

    test('should pass when FCM is enabled and server key is provided', () => {
      process.env.FCM_ENABLED = 'true';
      process.env.FCM_SERVER_KEY = 'test-server-key';
      configValidator.errors = [];
      
      const result = configValidator.validateFCMConfig();
      
      expect(result).toBe(true);
      expect(configValidator.errors).toHaveLength(0);
    });
  });

  describe('validateWebPushConfig', () => {
    test('should pass when Web Push is disabled', () => {
      process.env.WEB_PUSH_ENABLED = 'false';
      configValidator.errors = [];
      configValidator.warnings = [];
      
      const result = configValidator.validateWebPushConfig();
      
      expect(result).toBe(true);
      expect(configValidator.errors).toHaveLength(0);
      expect(configValidator.warnings.length).toBeGreaterThan(0);
    });

    test('should fail when Web Push is enabled but VAPID keys are missing', () => {
      process.env.WEB_PUSH_ENABLED = 'true';
      configValidator.errors = [];
      
      const result = configValidator.validateWebPushConfig();
      
      expect(result).toBe(false);
      expect(configValidator.errors.length).toBeGreaterThan(0);
    });

    test('should pass when Web Push is enabled and VAPID keys are provided', () => {
      process.env.WEB_PUSH_ENABLED = 'true';
      process.env.VAPID_PUBLIC_KEY = 'test-public-key';
      process.env.VAPID_PRIVATE_KEY = 'test-private-key';
      configValidator.errors = [];
      
      const result = configValidator.validateWebPushConfig();
      
      expect(result).toBe(true);
      expect(configValidator.errors).toHaveLength(0);
    });
  });

  describe('validateEmailConfig', () => {
    test('should pass when email is disabled', () => {
      process.env.EMAIL_NOTIFICATIONS_ENABLED = 'false';
      configValidator.errors = [];
      configValidator.warnings = [];
      
      const result = configValidator.validateEmailConfig();
      
      expect(result).toBe(true);
      expect(configValidator.errors).toHaveLength(0);
      expect(configValidator.warnings.length).toBeGreaterThan(0);
    });

    test('should validate SMTP configuration when provider is smtp', () => {
      process.env.EMAIL_NOTIFICATIONS_ENABLED = 'true';
      process.env.EMAIL_PROVIDER = 'smtp';
      process.env.SMTP_HOST = 'smtp.test.com';
      configValidator.errors = [];
      
      const result = configValidator.validateEmailConfig();
      
      expect(result).toBe(true);
    });

    test('should validate SendGrid configuration when provider is sendgrid', () => {
      process.env.EMAIL_NOTIFICATIONS_ENABLED = 'true';
      process.env.EMAIL_PROVIDER = 'sendgrid';
      configValidator.errors = [];
      
      const result = configValidator.validateEmailConfig();
      
      expect(result).toBe(false);
      expect(configValidator.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateAll', () => {
    test('should validate all services and return results', () => {
      const result = configValidator.validateAll();
      
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    test('should mark as invalid when there are errors', () => {
      process.env.FCM_ENABLED = 'true';
      // No FCM_SERVER_KEY set
      
      const result = configValidator.validateAll();
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should mark as valid when all required configs are present', () => {
      process.env.FCM_ENABLED = 'false';
      process.env.WEB_PUSH_ENABLED = 'false';
      process.env.EMAIL_NOTIFICATIONS_ENABLED = 'false';
      process.env.SMS_NOTIFICATIONS_ENABLED = 'false';
      
      const result = configValidator.validateAll();
      
      expect(result.valid).toBe(true);
    });
  });
});
