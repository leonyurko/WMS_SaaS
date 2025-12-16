const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireRole } = require('../middleware/auth');
const equipmentBorrowingController = require('../controllers/equipmentBorrowingController');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/equipment-borrowing');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for equipment borrowing media
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `borrowing-${uniqueSuffix}${ext}`);
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

// Multiple file fields for ID photo and equipment photo
const uploadFields = upload.fields([
    { name: 'idPhoto', maxCount: 1 },
    { name: 'equipmentPhoto', maxCount: 1 }
]);

// ==================== PUBLIC ROUTES (no authentication) ====================

// Get regulation for signing (legacy - keep for backwards compatibility)
router.get('/public/regulations/:id', equipmentBorrowingController.getRegulationForSigning);

// Submit borrowing ticket (legacy - keep for backwards compatibility)
router.post('/public/regulations/:id/submit', uploadFields, equipmentBorrowingController.submitTicket);

// TOKEN-BASED PUBLIC ROUTES (one-time use links)
// Get form using token
router.get('/public/token/:token', equipmentBorrowingController.getTokenForm);

// Submit form using token (marks token as used)
router.post('/public/token/:token/submit', uploadFields, equipmentBorrowingController.submitWithToken);

// ==================== ADMIN ROUTES (authentication required) ====================

// Regulations CRUD
router.get('/regulations', authenticateToken, equipmentBorrowingController.getAllRegulations);
router.get('/regulations/:id', authenticateToken, equipmentBorrowingController.getRegulationById);
router.post('/regulations', authenticateToken, requireRole(['Admin', 'Manager']), equipmentBorrowingController.createRegulation);
router.put('/regulations/:id', authenticateToken, requireRole(['Admin', 'Manager']), equipmentBorrowingController.updateRegulation);
router.delete('/regulations/:id', authenticateToken, requireRole(['Admin']), equipmentBorrowingController.deleteRegulation);

// Tickets management
router.get('/tickets', authenticateToken, equipmentBorrowingController.getAllTickets);
router.get('/tickets/:id', authenticateToken, equipmentBorrowingController.getTicketById);
router.post('/tickets/:id/archive', authenticateToken, requireRole(['Admin', 'Manager']), equipmentBorrowingController.archiveTicket);

// Tokens management (one-time use links)
router.get('/tokens', authenticateToken, equipmentBorrowingController.getAllTokens);
router.post('/tokens', authenticateToken, requireRole(['Admin', 'Manager']), equipmentBorrowingController.createToken);
router.post('/tokens/:id/expire', authenticateToken, requireRole(['Admin', 'Manager']), equipmentBorrowingController.expireToken);

module.exports = router;

