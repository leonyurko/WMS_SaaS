const nodemailer = require('nodemailer');
const { ses } = require('../config/aws');
require('dotenv').config();

// Create transporter based on configuration
let transporter;
let transporterType = 'none';

// Check SMTP first (more common for testing with Mailtrap, etc.)
if (process.env.SMTP_HOST && process.env.SMTP_HOST.trim()) {
  console.log('📧 Email configured with SMTP:', process.env.SMTP_HOST);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  transporterType = 'smtp';
} else if (process.env.AWS_SES_REGION && process.env.AWS_SES_REGION.trim()) {
  // Use AWS SES
  console.log('📧 Email configured with AWS SES');
  transporter = nodemailer.createTransport({
    SES: { ses, aws: require('aws-sdk') }
  });
  transporterType = 'ses';
} else {
  // Fallback to console logging for development
  console.warn('⚠️  No email service configured. Emails will be logged to console.');
}

/**
 * Send email
 * @param {Array<string>} to - Recipient email addresses
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 */
const sendEmail = async (to, subject, html) => {
  try {
    if (!transporter) {
      console.log('📧 Email (not sent - no transporter):', { to, subject });
      return { success: false, message: 'No email service configured' };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@wms.com',
      to: to.join(', '),
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate HTML for low stock alert email
 * @param {Array} items - Low stock items
 * @returns {string} HTML content
 */
const generateLowStockEmailHTML = (items) => {
  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
      <td style="padding: 10px; border: 1px solid #ddd;">${item.barcode}</td>
      <td style="padding: 10px; border: 1px solid #ddd;">${item.location}</td>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.current_stock}</td>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.min_threshold}</td>
      <td style="padding: 10px; border: 1px solid #ddd;">${item.category_name || 'N/A'}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Low Stock Alert</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f44336; color: white; padding: 20px; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">⚠️ Low Stock Alert</h1>
        </div>
        
        <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p>The following items are at or below their minimum stock threshold:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product Name</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Barcode</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Location</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Current Stock</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Min Threshold</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Category</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>
          
          <p style="margin-top: 20px;">
            <strong>Total items requiring attention: ${items.length}</strong>
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This is an automated alert from the Warehouse Management System.
            <br>
            Please take appropriate action to restock these items.
          </p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 0 0 5px 5px; font-size: 12px; color: #666;">
          <p style="margin: 0;">Warehouse Management System © ${new Date().getFullYear()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send low stock alert email
 * @param {Array} items - Low stock items
 * @param {Array<string>} recipients - Email recipients
 */
const sendLowStockAlert = async (items, recipients) => {
  if (!items || items.length === 0) {
    console.log('No low stock items to report');
    return { success: true, message: 'No items to report' };
  }

  const subject = `⚠️ Low Stock Alert - ${items.length} Item(s) Require Attention`;
  const html = generateLowStockEmailHTML(items);

  return await sendEmail(recipients, subject, html);
};

module.exports = {
  sendEmail,
  sendLowStockAlert,
  generateLowStockEmailHTML
};
