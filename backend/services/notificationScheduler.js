/**
 * Notification Scheduler
 * Handles periodic processing of pending notifications
 */

const cron = require('node-cron');
const billingNotificationService = require('./billingNotificationService');

class NotificationScheduler {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Notification scheduler is already running');
      return;
    }

    // Process pending billing notifications every 5 minutes
    const billingJob = cron.schedule('*/5 * * * *', async () => {
      console.log('📧 Processing pending billing notifications...');
      try {
        const result = await billingNotificationService.processPendingNotifications(50);
        if (result.success) {
          console.log(`✅ Processed ${result.processed} notifications, ${result.failed || 0} failed`);
        } else {
          console.error('❌ Failed to process notifications:', result.error);
        }
      } catch (error) {
        console.error('❌ Notification scheduler error:', error);
      }
    });

    this.jobs.push({ name: 'billing-notifications', job: billingJob });
    this.isRunning = true;

    console.log('✅ Notification scheduler started');
    console.log('   - Billing notifications: Every 5 minutes');
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️  Notification scheduler is not running');
      return;
    }

    this.jobs.forEach(({ name, job }) => {
      job.stop();
      console.log(`⏹️  Stopped ${name} job`);
    });

    this.jobs = [];
    this.isRunning = false;
    console.log('⏹️  Notification scheduler stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      running: this.isRunning,
      jobs: this.jobs.map(({ name, job }) => ({
        name,
        running: job.getStatus ? job.getStatus() : 'unknown'
      }))
    };
  }

  /**
   * Manually trigger billing notification processing
   */
  async triggerBillingNotifications(limit = 50) {
    console.log('🔔 Manually triggering billing notification processing...');
    try {
      const result = await billingNotificationService.processPendingNotifications(limit);
      if (result.success) {
        console.log(`✅ Processed ${result.processed} notifications, ${result.failed || 0} failed`);
      } else {
        console.error('❌ Failed to process notifications:', result.error);
      }
      return result;
    } catch (error) {
      console.error('❌ Error triggering billing notifications:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationScheduler();
