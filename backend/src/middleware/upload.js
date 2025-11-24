const multer = require('multer');
const { uploadImage } = require('../services/imageService');

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
  }
});

/**
 * Middleware to handle single image upload
 */
const uploadSingleImage = upload.single('image');

/**
 * Middleware to handle multiple images upload (up to 5)
 */
const uploadMultipleImages = upload.array('images', 5);

/**
 * Middleware to process uploaded image and upload to S3
 */
const processImageUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      // No file uploaded, continue
      return next();
    }

    // Generate product ID or use existing
    const productId = req.params.id || 'new-product';

    // Upload to S3
    const imageUrl = await uploadImage(req.file, productId);

    // Attach image URL to request
    req.imageUrl = imageUrl;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to process multiple uploaded images and upload to S3
 */
const processMultipleImageUpload = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      // No files uploaded, continue
      return next();
    }

    // Generate product ID or use existing
    const productId = req.params.id || req.body.itemId || 'new-product';

    // Upload all images to S3
    const uploadPromises = req.files.map((file, index) =>
      uploadImage(file, `${productId}-${index}`)
    );

    const imageUrls = await Promise.all(uploadPromises);

    // Attach image URLs to request
    req.imageUrls = imageUrls;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Conditional middleware that only applies multer for multipart requests
 * For JSON requests, it skips multer entirely to preserve req.body
 */
const conditionalUploadMultiple = (req, res, next) => {
  const contentType = req.get('Content-Type') || '';

  // Only use multer for multipart/form-data requests
  if (contentType.includes('multipart/form-data')) {
    return uploadMultipleImages(req, res, next);
  }

  // For JSON requests, skip multer and go straight to next middleware
  next();
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  conditionalUploadMultiple,
  processImageUpload,
  processMultipleImageUpload
};
