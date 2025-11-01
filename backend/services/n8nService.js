const axios = require('axios');

/**
 * n8n Service - Handles communication with n8n workflow automation server
 * Provides methods to trigger workflows, check health, and manage webhooks
 */
class N8nService {
  constructor() {
    this.baseUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678';
    this.apiKey = process.env.N8N_API_KEY || '';
    this.enabled = process.env.N8N_ENABLED === 'true';
    this.timeout = parseInt(process.env.N8N_TIMEOUT || '5000', 10);
  }

  /**
   * Check if n8n is enabled and configured
   */
  isEnabled() {
    return this.enabled && this.baseUrl;
  }

  /**
   * Check n8n server health
   */
  async checkHealth() {
    if (!this.isEnabled()) {
      return { status: 'disabled', message: 'n8n integration is disabled' };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/healthz`, {
        timeout: 2000
      });
      return { status: 'healthy', data: response.data };
    } catch (error) {
      console.warn('n8n health check failed:', error.message);
      return { status: 'unhealthy', message: error.message };
    }
  }

  /**
   * Trigger a webhook workflow
   * @param {string} webhookPath - The webhook path (e.g., 'order-placed')
   * @param {object} data - The data to send to the webhook
   * @param {object} options - Additional options (tenant_id, headers, etc.)
   */
  async triggerWebhook(webhookPath, data, options = {}) {
    if (!this.isEnabled()) {
      console.log('n8n is disabled, skipping webhook trigger:', webhookPath);
      return { skipped: true, reason: 'n8n disabled' };
    }

    const url = `${this.baseUrl}/webhook/${webhookPath}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'X-N8N-API-KEY': this.apiKey }),
      ...(options.tenant_id && { 'X-Tenant-ID': options.tenant_id }),
      ...options.headers
    };

    try {
      const response = await axios.post(url, data, {
        headers,
        timeout: this.timeout
      });

      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      console.error('n8n webhook trigger failed:', {
        webhook: webhookPath,
        error: error.message,
        tenant_id: options.tenant_id
      });

      // Don't throw error - graceful degradation
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Execute a specific workflow by ID
   * @param {string} workflowId - The workflow ID in n8n
   * @param {object} data - The data to pass to the workflow
   */
  async executeWorkflow(workflowId, data) {
    if (!this.isEnabled() || !this.apiKey) {
      return { skipped: true, reason: 'n8n disabled or API key not configured' };
    }

    const url = `${this.baseUrl}/api/v1/workflows/${workflowId}/execute`;
    
    try {
      const response = await axios.post(url, data, {
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      });

      return {
        success: true,
        executionId: response.data.executionId,
        data: response.data
      };
    } catch (error) {
      console.error('n8n workflow execution failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test a webhook endpoint
   */
  async testWebhook(webhookPath, testData = {}) {
    return this.triggerWebhook(webhookPath, {
      test: true,
      timestamp: new Date().toISOString(),
      ...testData
    });
  }
}

// Export singleton instance
module.exports = new N8nService();
