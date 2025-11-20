const { uploadToS3, deleteFromS3 } = require('../config/aws');

// Allowed image MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Validate image file
 * @param {object} file - Multer file object
 * @returns {boolean}
 */
const validateImageFile = (file) => {
  if (!file) {
    return false;
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 5MB limit.');
  }

  return true;
};

/**
 * Upload image to S3
 * @param {object} file - Multer file object
 * @param {string} productId - Product ID for naming
 * @returns {Promise<string>} S3 URL
 */
const uploadImage = async (file, productId) => {
  try {
    // Validate file
    validateImageFile(file);

    // Generate unique filename
    const fileName = `${productId}-${file.originalname}`;

    // Upload to S3
    const imageUrl = await uploadToS3(file.buffer, fileName, file.mimetype);

    return imageUrl;
  } catch (error) {
    throw new Error('Image upload failed: ' + error.message);
  }
};

/**
 * Delete image from S3
 * @param {string} imageUrl - S3 image URL
 * @returns {Promise<boolean>}
 */
const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl) {
      return false;
    }

    return await deleteFromS3(imageUrl);
  } catch (error) {
    console.error('Image deletion failed:', error);
    return false;
  }
};

module.exports = {
  validateImageFile,
  uploadImage,
  deleteImage,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE
};
