const QRCode = require('qrcode');
const { query } = require('../config/database');

/**
 * Generate unique barcode for product
 * Format: WMS-{LOCATION}-{SEQUENCE}
 */
const generateBarcode = async (location = 'WH') => {
  // Get count of existing items to generate sequence
  const result = await query('SELECT COUNT(*) as count FROM inventory');
  const count = parseInt(result.rows[0].count) + 1;
  
  // Format: WMS-A-001, WMS-B-002, etc.
  const sequence = count.toString().padStart(3, '0');
  const barcode = `WMS-${location.substring(0, 1).toUpperCase()}-${sequence}`;
  
  // Check if barcode already exists
  const existing = await query('SELECT id FROM inventory WHERE barcode = $1', [barcode]);
  
  if (existing.rows.length > 0) {
    // If exists, add timestamp to make it unique
    return `${barcode}-${Date.now()}`;
  }
  
  return barcode;
};

/**
 * Generate QR code image from data
 * @param {string} data - Data to encode in QR code
 * @returns {Promise<Buffer>} QR code image buffer
 */
const generateQRCodeImage = async (data) => {
  try {
    const qrCodeBuffer = await QRCode.toBuffer(data, {
      errorCorrectionLevel: 'M',
      type: 'png',
      width: 300,
      margin: 1
    });
    return qrCodeBuffer;
  } catch (error) {
    throw new Error('Failed to generate QR code: ' + error.message);
  }
};

/**
 * Generate QR code as data URL
 * @param {string} data - Data to encode in QR code
 * @returns {Promise<string>} QR code data URL
 */
const generateQRCodeDataURL = async (data) => {
  try {
    const dataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      width: 300,
      margin: 1
    });
    return dataURL;
  } catch (error) {
    throw new Error('Failed to generate QR code: ' + error.message);
  }
};

/**
 * Validate barcode format
 * @param {string} barcode
 * @returns {boolean}
 */
const validateBarcode = (barcode) => {
  // Basic validation: should start with WMS- and have proper format
  const pattern = /^WMS-[A-Z]-\d{3}(-\d+)?$/;
  return pattern.test(barcode);
};

module.exports = {
  generateBarcode,
  generateQRCodeImage,
  generateQRCodeDataURL,
  validateBarcode
};
