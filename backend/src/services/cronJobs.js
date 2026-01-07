const cron = require('node-cron');
const { getLowStockItems } = require('./inventoryService');
const { getAllWearReports } = require('./wearEquipmentService');
const { sendLowStockAlert, sendWearReportAlert } = require('./emailService');
const settingsModel = require('../models/settingsModel');
require('dotenv').config();

/**
 * Initialize cron jobs
 */
const initCronJobs = () => {
  // Low stock check - runs hourly (to check if interval has passed) instead of fixed daily time
  const schedule = process.env.NOTIFICATION_CHECK_CRON || '0 * * * *';

  console.log(`📅 Scheduling notification check: ${schedule}`);

  cron.schedule(schedule, async () => {
    console.log('🔍 Running scheduled notification check...');

    try {
      // 1. Check if notifications are enabled and due
      const intervalSetting = await settingsModel.getSetting('email_notification_interval_days');
      const lastSentSetting = await settingsModel.getSetting('last_notification_sent_at');

      const intervalDays = parseInt(intervalSetting?.setting_value || '0', 10);

      // If interval is 0, notifications are disabled
      if (intervalDays <= 0) {
        console.log('🔕 Notifications disabled (interval is 0)');
        return;
      }

      // Check if due
      const lastSent = lastSentSetting?.setting_value ? new Date(lastSentSetting.setting_value) : null;
      const now = new Date();

      if (lastSent) {
        const nextDue = new Date(lastSent);
        nextDue.setDate(nextDue.getDate() + intervalDays);
        if (now < nextDue) {
          console.log(`⏳ Notification not due yet. Next due: ${nextDue.toISOString()}`);
          return;
        }
      }

      console.log('🔔 Notifications are due. Checking for issues...');
      let notificationSent = false;

      // 2. Check Low Stock
      const lowStockItems = await getLowStockItems();
      const recipients = process.env.LOW_STOCK_ALERT_EMAILS
        ? process.env.LOW_STOCK_ALERT_EMAILS.split(',').map(email => email.trim())
        : ['admin@wms.com'];

      if (lowStockItems.length > 0) {
        console.log(`⚠️  Found ${lowStockItems.length} low stock items`);
        const result = await sendLowStockAlert(lowStockItems, recipients);
        if (result.success) notificationSent = true;
      } else {
        console.log('✅ No low stock items found');
      }

      // 3. Check Wear Reports (Open)
      try {
        const wearReports = await getAllWearReports({ status: 'open' });
        const criticalOrHighReports = wearReports.filter(r => r.severity === 'critical' || r.severity === 'high');

        if (criticalOrHighReports.length > 0) {
          console.log(`⚠️  Found ${criticalOrHighReports.length} critical/high wear reports`);
          if (typeof sendWearReportAlert === 'function') {
            const result = await sendWearReportAlert(criticalOrHighReports, recipients);
            if (result.success) notificationSent = true;
          } else {
            console.log('ℹ️ sendWearReportAlert not implemented yet or imported incorrectly.');
          }
        }
      } catch (err) {
        console.error('Error checking wear reports:', err);
      }

      // 4. Update last_sent timestamp
      // We update it if we successfully checked, to reset the timer.
      await settingsModel.updateSetting('last_notification_sent_at', now.toISOString(), null);
      console.log('✅ Notification check completed and timestamp updated.');

    } catch (error) {
      console.error('❌ Error in notification cron job:', error);
    }
  });

  console.log('✅ Cron jobs initialized');
};

/**
 * Manual trigger for low stock check (for testing)
 */
const triggerLowStockCheck = async () => {
  console.log('🔍 Manually triggering low stock check...');

  try {
    const lowStockItems = await getLowStockItems();

    if (lowStockItems.length === 0) {
      return { success: true, message: 'No low stock items found' };
    }

    const recipients = process.env.LOW_STOCK_ALERT_EMAILS
      ? process.env.LOW_STOCK_ALERT_EMAILS.split(',').map(email => email.trim())
      : ['admin@wms.com'];

    const result = await sendLowStockAlert(lowStockItems, recipients);

    return {
      success: result.success,
      itemCount: lowStockItems.length,
      recipients,
      ...result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  initCronJobs,
  triggerLowStockCheck
};
