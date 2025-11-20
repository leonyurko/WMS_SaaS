const QRCode = require('qrcode');
const bwipjs = require('bwip-js');
const fs = require('fs').promises;
const path = require('path');

/**
 * Generate QR Code and save to file
 * @param {string} data - The data to encode
 * @param {string} filename - The filename (without extension)
 * @returns {Promise<string>} - Path to the saved QR code image
 */
const generateQRCode = async (data, filename) => {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads/codes');
    await fs.mkdir(uploadsDir, { recursive: true });

    const filepath = path.join(uploadsDir, `${filename}_qr.png`);
    
    await QRCode.toFile(filepath, data, {
      errorCorrectionLevel: 'M',
      type: 'png',
      quality: 0.92,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return `/uploads/codes/${filename}_qr.png`;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate Barcode (Code128) and save to file
 * @param {string} data - The data to encode
 * @param {string} filename - The filename (without extension)
 * @returns {Promise<string>} - Path to the saved barcode image
 */
const generateBarcode = async (data, filename) => {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads/codes');
    await fs.mkdir(uploadsDir, { recursive: true });

    const filepath = path.join(uploadsDir, `${filename}_barcode.png`);

    // Generate barcode as PNG buffer
    const png = await bwipjs.toBuffer({
      bcid: 'code128',
      text: data,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center',
    });

    await fs.writeFile(filepath, png);

    return `/uploads/codes/${filename}_barcode.png`;
  } catch (error) {
    console.error('Error generating barcode:', error);
    throw new Error('Failed to generate barcode');
  }
};

/**
 * Generate both QR code and Barcode for an item
 * @param {string} barcodeValue - The barcode value (unique identifier)
 * @param {string} itemId - The item's unique ID for filename
 * @returns {Promise<{qrImageUrl: string, barcodeImageUrl: string}>}
 */
const generateBothCodes = async (barcodeValue, itemId) => {
  try {
    const [qrImageUrl, barcodeImageUrl] = await Promise.all([
      generateQRCode(barcodeValue, itemId),
      generateBarcode(barcodeValue, itemId)
    ]);

    return {
      qrImageUrl,
      barcodeImageUrl
    };
  } catch (error) {
    console.error('Error generating codes:', error);
    throw error;
  }
};

module.exports = {
  generateQRCode,
  generateBarcode,
  generateBothCodes
};
