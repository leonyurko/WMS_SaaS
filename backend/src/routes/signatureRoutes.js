const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const signatureController = require('../controllers/signatureController');

// PUBLIC ROUTES (no authentication required)
// Get form for signing
router.get('/public/forms/:id', signatureController.getFormForSigning);

// Submit signature
router.post('/public/forms/:id/sign', signatureController.submitSignature);

// ADMIN ROUTES (authentication required)
// Get all forms
router.get('/forms', authenticateToken, signatureController.getAllForms);

// Get form by ID (admin view)
router.get('/forms/:id', authenticateToken, signatureController.getFormById);

// Create form
router.post('/forms', authenticateToken, requireRole(['Admin', 'Manager']), signatureController.createForm);

// Update form
router.put('/forms/:id', authenticateToken, requireRole(['Admin', 'Manager']), signatureController.updateForm);

// Delete form
router.delete('/forms/:id', authenticateToken, requireRole(['Admin']), signatureController.deleteForm);

// Get signatures for a form
router.get('/forms/:id/signatures', authenticateToken, signatureController.getSignatures);

// Get single signature
router.get('/signatures/:signatureId', authenticateToken, signatureController.getSignatureById);

module.exports = router;
