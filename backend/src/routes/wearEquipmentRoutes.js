const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireRole } = require('../middleware/auth');
const wearEquipmentController = require('../controllers/wearEquipmentController');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/wear-equipment');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for wear equipment media
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `wear-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images (JPEG, PNG, WebP) are allowed.'));
        }
    }
});

// All routes require authentication
router.use(authenticateToken);

// Get wear stats (must be before :id route)
router.get('/stats', wearEquipmentController.getWearStats);

// Get all wear reports
router.get('/', wearEquipmentController.getAllWearReports);

// Get wear report by ID
router.get('/:id', wearEquipmentController.getWearReportById);

// Create wear report (with optional media upload)
router.post('/', upload.array('media', 5), wearEquipmentController.createWearReport);

// Update wear report
router.put('/:id', wearEquipmentController.updateWearReport);

// Resolve wear report
router.post('/:id/resolve', wearEquipmentController.resolveWearReport);

// Archive wear report
router.post('/:id/archive', wearEquipmentController.archiveWearReport);

// Upload media to wear report
router.post('/:id/media', upload.single('media'), wearEquipmentController.uploadMedia);

// Remove media from wear report
router.delete('/:id/media', wearEquipmentController.removeMedia);

// Delete wear report (Admin only)
router.delete('/:id', requireRole(['Admin']), wearEquipmentController.deleteWearReport);

module.exports = router;
