const cron = require('node-cron');
const { getLowStockItems } = require('./inventoryService');
const { sendLowStockAlert } = require('./emailService');
require('dotenv').config();

/**
 * Initialize cron jobs
 */
const initCronJobs = () => {
  // Low stock check - runs daily at 9 AM by default
  const schedule = process.env.LOW_STOCK_CHECK_CRON || '0 9 * * *';
  
  console.log(`📅 Scheduling low stock check: ${schedule}`);
  
  cron.schedule(schedule, async () => {
    console.log('🔍 Running scheduled low stock check...');
    
    try {
      // Get low stock items
      const lowStockItems = await getLowStockItems();
      
      if (lowStockItems.length === 0) {
        console.log('✅ No low stock items found');
        return;
      }
      
      console.log(`⚠️  Found ${lowStockItems.length} low stock items`);
      
      // Get email recipients from environment variable
      const recipients = process.env.LOW_STOCK_ALERT_EMAILS 
        ? process.env.LOW_STOCK_ALERT_EMAILS.split(',').map(email => email.trim())
        : ['admin@wms.com'];
      
      // Send alert email
      const result = await sendLowStockAlert(lowStockItems, recipients);
      
      if (result.success) {
        console.log('✅ Low stock alert email sent successfully');
      } else {
        console.error('❌ Failed to send low stock alert:', result.error || result.message);
      }
    } catch (error) {
      console.error('❌ Error in low stock check cron job:', error);
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
