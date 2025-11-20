const { generateBarcode } = require('../services/barcodeService');

/**
 * Middleware to generate barcode before creating inventory
 */
const generateBarcodeMiddleware = async (req, res, next) => {
  try {
    const location = req.body.location || 'WH';
    const barcode = await generateBarcode(location);
    req.barcode = barcode;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateBarcodeMiddleware
};
