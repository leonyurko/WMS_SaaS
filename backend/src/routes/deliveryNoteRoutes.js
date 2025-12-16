const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, authorize } = require('../middleware/auth');
const deliveryNoteController = require('../controllers/deliveryNoteController');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/delivery-notes');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for delivery note media
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `delivery-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
            'application/pdf'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images (JPEG, PNG, WebP) and PDFs are allowed.'));
        }
    }
});

// All routes require authentication
router.use(authenticate);

// Get all delivery notes
router.get('/', deliveryNoteController.getAllDeliveryNotes);

// Get single delivery note
router.get('/:id', deliveryNoteController.getDeliveryNoteById);

// Create delivery note
router.post('/', deliveryNoteController.createDeliveryNote);

// Update delivery note
router.put('/:id', deliveryNoteController.updateDeliveryNote);

// Delete delivery note (Admin/Manager only)
router.delete('/:id', authorize(['Admin', 'Manager']), deliveryNoteController.deleteDeliveryNote);

// Upload media to delivery note
router.post('/:id/media', upload.single('file'), deliveryNoteController.uploadMedia);

// Remove media from delivery note
router.delete('/:id/media', deliveryNoteController.removeMedia);

module.exports = router;
