const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Create S3 client
const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  signatureVersion: 'v4'
});

// S3 bucket name
const S3_BUCKET = process.env.S3_BUCKET_NAME || 'wms-inventory-images';

// Local uploads directory
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Upload file to S3 or Local Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name
 * @param {string} mimeType - MIME type
 * @returns {Promise<string>} URL
 */
const uploadToS3 = async (fileBuffer, fileName, mimeType) => {
  // Check if AWS credentials are provided
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    const params = {
      Bucket: S3_BUCKET,
      Key: `inventory/${Date.now()}-${fileName}`,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: 'public-read' // Make images publicly accessible
    };

    try {
      const result = await s3.upload(params).promise();
      return result.Location;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload image to S3: ' + error.message);
    }
  } else {
    // Fallback to local storage
    try {
      const uniqueFileName = `${Date.now()}-${fileName}`;
      const filePath = path.join(UPLOADS_DIR, uniqueFileName);
      
      fs.writeFileSync(filePath, fileBuffer);
      
      // Return relative URL
      // Assuming server is running on localhost:5000 or similar
      // The frontend should handle the base URL or we return a full URL if we knew the host
      // For now, returning a relative path that the frontend can prepend API_URL to, 
      // OR better yet, return a path that the backend serves.
      // Since we added app.use('/uploads', ...), the URL is /uploads/filename
      
      // Note: If the frontend expects a full URL, it might break. 
      // But usually src="/uploads/..." works if on same domain or proxy.
      // Since frontend is on 3000 and backend on 5000, we might need the full URL.
      // Let's try to return a relative path and see if frontend handles it.
      // Actually, let's return the full URL assuming localhost for dev
      const baseUrl = process.env.API_URL || 'http://localhost:5000';
      return `${baseUrl}/uploads/${uniqueFileName}`;
    } catch (error) {
      console.error('Local upload error:', error);
      throw new Error('Failed to save image locally: ' + error.message);
    }
  }
};

/**
 * Delete file from S3 or Local Storage
 * @param {string} fileUrl - File URL
 * @returns {Promise<boolean>}
 */
const deleteFromS3 = async (fileUrl) => {
  try {
    if (fileUrl.includes(S3_BUCKET)) {
      // It's an S3 URL
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1); // Remove leading slash

      const params = {
        Bucket: S3_BUCKET,
        Key: key
      };

      await s3.deleteObject(params).promise();
      return true;
    } else {
      // It's likely a local file
      const fileName = path.basename(fileUrl);
      const filePath = path.join(UPLOADS_DIR, fileName);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};

/**
 * Generate signed URL for private files
 * @param {string} key - S3 object key
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {string} Signed URL
 */
const getSignedUrl = (key, expiresIn = 3600) => {
  const params = {
    Bucket: S3_BUCKET,
    Key: key,
    Expires: expiresIn
  };

  return s3.getSignedUrl('getObject', params);
};

// Configure SES for email
const ses = new AWS.SES({
  apiVersion: '2010-12-01',
  region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'us-east-1'
});

module.exports = {
  s3,
  ses,
  uploadToS3,
  deleteFromS3,
  getSignedUrl,
  S3_BUCKET
};
