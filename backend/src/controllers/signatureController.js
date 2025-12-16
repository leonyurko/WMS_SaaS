const signatureService = require('../services/signatureService');

/**
 * Get all signing forms (admin)
 */
const getAllForms = async (req, res) => {
    try {
        const forms = await signatureService.getAllForms();
        res.json(forms);
    } catch (error) {
        console.error('Error getting forms:', error);
        res.status(500).json({ message: 'Failed to get forms', error: error.message });
    }
};

/**
 * Get form by ID for signing (public - no auth required)
 */
const getFormForSigning = async (req, res) => {
    try {
        const { id } = req.params;
        const form = await signatureService.getFormById(id);

        if (!form) {
            return res.status(404).json({ message: 'Form not found or inactive' });
        }

        res.json(form);
    } catch (error) {
        console.error('Error getting form:', error);
        res.status(500).json({ message: 'Failed to get form', error: error.message });
    }
};

/**
 * Get form by ID with details (admin)
 */
const getFormById = async (req, res) => {
    try {
        const { id } = req.params;
        const form = await signatureService.getFormByIdAdmin(id);

        if (!form) {
            return res.status(404).json({ message: 'Form not found' });
        }

        res.json(form);
    } catch (error) {
        console.error('Error getting form:', error);
        res.status(500).json({ message: 'Failed to get form', error: error.message });
    }
};

/**
 * Create signing form (admin)
 */
const createForm = async (req, res) => {
    try {
        const { name, regulationText } = req.body;
        const createdBy = req.user.id;

        if (!name || !regulationText) {
            return res.status(400).json({ message: 'Name and regulation text are required' });
        }

        const form = await signatureService.createForm({
            name,
            regulationText,
            createdBy
        });

        res.status(201).json(form);
    } catch (error) {
        console.error('Error creating form:', error);
        res.status(500).json({ message: 'Failed to create form', error: error.message });
    }
};

/**
 * Update signing form (admin)
 */
const updateForm = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, regulationText, isActive } = req.body;

        const form = await signatureService.updateForm(id, {
            name,
            regulationText,
            isActive
        });

        if (!form) {
            return res.status(404).json({ message: 'Form not found' });
        }

        res.json(form);
    } catch (error) {
        console.error('Error updating form:', error);
        res.status(500).json({ message: 'Failed to update form', error: error.message });
    }
};

/**
 * Delete signing form (admin)
 */
const deleteForm = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await signatureService.deleteForm(id);

        if (!deleted) {
            return res.status(404).json({ message: 'Form not found' });
        }

        res.json({ message: 'Form deleted successfully' });
    } catch (error) {
        console.error('Error deleting form:', error);
        res.status(500).json({ message: 'Failed to delete form', error: error.message });
    }
};

/**
 * Submit signature (public - no auth required)
 */
const submitSignature = async (req, res) => {
    try {
        const { id } = req.params;
        const { customerName, customerEmail, customerPhone, signatureData } = req.body;

        if (!customerName || !signatureData) {
            return res.status(400).json({ message: 'Customer name and signature are required' });
        }

        // Check form exists and is active
        const form = await signatureService.getFormById(id);
        if (!form) {
            return res.status(404).json({ message: 'Form not found or inactive' });
        }

        // Get client IP
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        const signature = await signatureService.submitSignature(id, {
            customerName,
            customerEmail,
            customerPhone,
            signatureData,
            ipAddress
        });

        res.status(201).json({ message: 'Signature submitted successfully', signature });
    } catch (error) {
        console.error('Error submitting signature:', error);
        res.status(500).json({ message: 'Failed to submit signature', error: error.message });
    }
};

/**
 * Get signatures for a form (admin)
 */
const getSignatures = async (req, res) => {
    try {
        const { id } = req.params;
        const { page, limit } = req.query;

        const result = await signatureService.getSignatures(id, { page, limit });
        res.json(result);
    } catch (error) {
        console.error('Error getting signatures:', error);
        res.status(500).json({ message: 'Failed to get signatures', error: error.message });
    }
};

/**
 * Get signature by ID (admin)
 */
const getSignatureById = async (req, res) => {
    try {
        const { signatureId } = req.params;
        const signature = await signatureService.getSignatureById(signatureId);

        if (!signature) {
            return res.status(404).json({ message: 'Signature not found' });
        }

        res.json(signature);
    } catch (error) {
        console.error('Error getting signature:', error);
        res.status(500).json({ message: 'Failed to get signature', error: error.message });
    }
};

module.exports = {
    getAllForms,
    getFormForSigning,
    getFormById,
    createForm,
    updateForm,
    deleteForm,
    submitSignature,
    getSignatures,
    getSignatureById
};
