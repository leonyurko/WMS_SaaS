const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const signatureController = require('../controllers/signatureController');

// PUBLIC ROUTES (no authentication required)
// Get form for signing
router.get('/public/forms/:id', signatureController.getFormForSigning);

// Submit signature
router.post('/public/forms/:id/sign', signatureController.submitSignature);

// ADMIN ROUTES (authentication required)
// Get all forms
router.get('/forms', authenticate, signatureController.getAllForms);

// Get form by ID (admin view)
router.get('/forms/:id', authenticate, signatureController.getFormById);

// Create form
router.post('/forms', authenticate, authorize(['Admin', 'Manager']), signatureController.createForm);

// Update form
router.put('/forms/:id', authenticate, authorize(['Admin', 'Manager']), signatureController.updateForm);

// Delete form
router.delete('/forms/:id', authenticate, authorize(['Admin']), signatureController.deleteForm);

// Get signatures for a form
router.get('/forms/:id/signatures', authenticate, signatureController.getSignatures);

// Get single signature
router.get('/signatures/:signatureId', authenticate, signatureController.getSignatureById);

module.exports = router;
