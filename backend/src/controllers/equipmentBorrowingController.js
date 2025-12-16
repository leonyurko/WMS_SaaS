const equipmentBorrowingService = require('../services/equipmentBorrowingService');

// ==================== REGULATIONS (Admin) ====================

/**
 * Get all regulations
 */
const getAllRegulations = async (req, res) => {
    try {
        const regulations = await equipmentBorrowingService.getAllRegulations();
        res.json(regulations);
    } catch (error) {
        console.error('Error getting regulations:', error);
        res.status(500).json({ message: 'Failed to get regulations', error: error.message });
    }
};

/**
 * Get regulation by ID for signing (public)
 */
const getRegulationForSigning = async (req, res) => {
    try {
        const { id } = req.params;
        const regulation = await equipmentBorrowingService.getRegulationById(id);

        if (!regulation) {
            return res.status(404).json({ message: 'Regulation not found or inactive' });
        }

        res.json(regulation);
    } catch (error) {
        console.error('Error getting regulation:', error);
        res.status(500).json({ message: 'Failed to get regulation', error: error.message });
    }
};

/**
 * Get regulation by ID (admin)
 */
const getRegulationById = async (req, res) => {
    try {
        const { id } = req.params;
        const regulation = await equipmentBorrowingService.getRegulationByIdAdmin(id);

        if (!regulation) {
            return res.status(404).json({ message: 'Regulation not found' });
        }

        res.json(regulation);
    } catch (error) {
        console.error('Error getting regulation:', error);
        res.status(500).json({ message: 'Failed to get regulation', error: error.message });
    }
};

/**
 * Create regulation
 */
const createRegulation = async (req, res) => {
    try {
        const { name, regulationText } = req.body;
        const createdBy = req.user.id;

        if (!name || !regulationText) {
            return res.status(400).json({ message: 'Name and regulation text are required' });
        }

        const regulation = await equipmentBorrowingService.createRegulation({
            name,
            regulationText,
            createdBy
        });

        res.status(201).json(regulation);
    } catch (error) {
        console.error('Error creating regulation:', error);
        res.status(500).json({ message: 'Failed to create regulation', error: error.message });
    }
};

/**
 * Update regulation
 */
const updateRegulation = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, regulationText, isActive } = req.body;

        const regulation = await equipmentBorrowingService.updateRegulation(id, {
            name,
            regulationText,
            isActive
        });

        if (!regulation) {
            return res.status(404).json({ message: 'Regulation not found' });
        }

        res.json(regulation);
    } catch (error) {
        console.error('Error updating regulation:', error);
        res.status(500).json({ message: 'Failed to update regulation', error: error.message });
    }
};

/**
 * Delete regulation
 */
const deleteRegulation = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await equipmentBorrowingService.deleteRegulation(id);

        if (!deleted) {
            return res.status(404).json({ message: 'Regulation not found' });
        }

        res.json({ message: 'Regulation deleted successfully' });
    } catch (error) {
        console.error('Error deleting regulation:', error);
        res.status(500).json({ message: 'Failed to delete regulation', error: error.message });
    }
};

// ==================== TICKETS ====================

/**
 * Get all tickets
 */
const getAllTickets = async (req, res) => {
    try {
        const { formId, status, page, limit } = req.query;
        const result = await equipmentBorrowingService.getAllTickets({ formId, status, page, limit });
        res.json(result);
    } catch (error) {
        console.error('Error getting tickets:', error);
        res.status(500).json({ message: 'Failed to get tickets', error: error.message });
    }
};

/**
 * Get ticket by ID
 */
const getTicketById = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await equipmentBorrowingService.getTicketById(id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.json(ticket);
    } catch (error) {
        console.error('Error getting ticket:', error);
        res.status(500).json({ message: 'Failed to get ticket', error: error.message });
    }
};

/**
 * Submit borrowing ticket (public)
 */
const submitTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            firstName, lastName, companyName, phone, idNumber,
            equipmentName, signatureData
        } = req.body;

        if (!firstName || !lastName || !phone || !equipmentName || !signatureData) {
            return res.status(400).json({
                message: 'First name, last name, phone, equipment name, and signature are required'
            });
        }

        // Check regulation exists and is active
        const regulation = await equipmentBorrowingService.getRegulationById(id);
        if (!regulation) {
            return res.status(404).json({ message: 'Regulation form not found or inactive' });
        }

        // Get uploaded file URLs if any
        let idPhotoUrl = null;
        let equipmentPhotoUrl = null;

        if (req.files) {
            if (req.files.idPhoto && req.files.idPhoto[0]) {
                idPhotoUrl = `/uploads/equipment-borrowing/${req.files.idPhoto[0].filename}`;
            }
            if (req.files.equipmentPhoto && req.files.equipmentPhoto[0]) {
                equipmentPhotoUrl = `/uploads/equipment-borrowing/${req.files.equipmentPhoto[0].filename}`;
            }
        }

        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        const ticket = await equipmentBorrowingService.submitTicket(id, {
            firstName,
            lastName,
            companyName,
            phone,
            idNumber,
            idPhotoUrl,
            equipmentName,
            equipmentPhotoUrl,
            signatureData,
            ipAddress
        });

        res.status(201).json({ message: 'Ticket submitted successfully', ticket });
    } catch (error) {
        console.error('Error submitting ticket:', error);
        res.status(500).json({ message: 'Failed to submit ticket', error: error.message });
    }
};

/**
 * Archive ticket (close and delete media)
 */
const archiveTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const closedBy = req.user.id;

        const ticket = await equipmentBorrowingService.archiveTicket(id, closedBy);

        res.json({ message: 'Ticket archived successfully', ticket });
    } catch (error) {
        console.error('Error archiving ticket:', error);
        res.status(500).json({ message: error.message || 'Failed to archive ticket' });
    }
};

// ==================== TOKENS (One-time use links) ====================

/**
 * Create token (generates one-time use link)
 */
const createToken = async (req, res) => {
    try {
        const { regulationId, customerName, customerPhone, equipmentName, expiresInHours } = req.body;
        const createdBy = req.user.id;

        if (!regulationId) {
            return res.status(400).json({ message: 'Regulation ID is required' });
        }

        const token = await equipmentBorrowingService.createToken({
            regulationId,
            customerName,
            customerPhone,
            equipmentName,
            createdBy,
            expiresInHours
        });

        res.status(201).json(token);
    } catch (error) {
        console.error('Error creating token:', error);
        res.status(500).json({ message: 'Failed to create token', error: error.message });
    }
};

/**
 * Get all tokens (admin)
 */
const getAllTokens = async (req, res) => {
    try {
        const { regulationId, status } = req.query;
        const tokens = await equipmentBorrowingService.getAllTokens({ regulationId, status });
        res.json(tokens);
    } catch (error) {
        console.error('Error getting tokens:', error);
        res.status(500).json({ message: 'Failed to get tokens', error: error.message });
    }
};

/**
 * Get form data for token (public - for the borrower)
 */
const getTokenForm = async (req, res) => {
    try {
        const { token } = req.params;
        const validation = await equipmentBorrowingService.validateToken(token);

        if (!validation.valid) {
            return res.status(400).json({ message: validation.error });
        }

        const tokenData = validation.token;
        res.json({
            regulationName: tokenData.regulation_name,
            regulationText: tokenData.regulation_text,
            customerName: tokenData.customer_name,
            customerPhone: tokenData.customer_phone,
            equipmentName: tokenData.equipment_name
        });
    } catch (error) {
        console.error('Error getting token form:', error);
        res.status(500).json({ message: 'Failed to get form', error: error.message });
    }
};

/**
 * Submit form using token (public - marks token as used)
 */
const submitWithToken = async (req, res) => {
    try {
        const { token } = req.params;
        const {
            firstName, lastName, companyName, phone, idNumber,
            equipmentName, signatureData
        } = req.body;

        if (!firstName || !lastName || !phone || !equipmentName || !signatureData) {
            return res.status(400).json({
                message: 'First name, last name, phone, equipment name, and signature are required'
            });
        }

        // Get uploaded file URLs if any
        let idPhotoUrl = null;
        let equipmentPhotoUrl = null;

        if (req.files) {
            if (req.files.idPhoto && req.files.idPhoto[0]) {
                idPhotoUrl = `/uploads/equipment-borrowing/${req.files.idPhoto[0].filename}`;
            }
            if (req.files.equipmentPhoto && req.files.equipmentPhoto[0]) {
                equipmentPhotoUrl = `/uploads/equipment-borrowing/${req.files.equipmentPhoto[0].filename}`;
            }
        }

        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        const ticket = await equipmentBorrowingService.submitTicketWithToken(token, {
            firstName,
            lastName,
            companyName,
            phone,
            idNumber,
            idPhotoUrl,
            equipmentName,
            equipmentPhotoUrl,
            signatureData,
            ipAddress
        });

        res.status(201).json({ message: 'Form submitted successfully', ticket });
    } catch (error) {
        console.error('Error submitting with token:', error);
        res.status(400).json({ message: error.message || 'Failed to submit form' });
    }
};

/**
 * Expire token manually (admin)
 */
const expireToken = async (req, res) => {
    try {
        const { id } = req.params;
        const token = await equipmentBorrowingService.expireToken(id);

        if (!token) {
            return res.status(404).json({ message: 'Token not found or already used/expired' });
        }

        res.json({ message: 'Token expired successfully', token });
    } catch (error) {
        console.error('Error expiring token:', error);
        res.status(500).json({ message: 'Failed to expire token', error: error.message });
    }
};

module.exports = {
    getAllRegulations,
    getRegulationForSigning,
    getRegulationById,
    createRegulation,
    updateRegulation,
    deleteRegulation,
    getAllTickets,
    getTicketById,
    submitTicket,
    archiveTicket,
    // Token functions
    createToken,
    getAllTokens,
    getTokenForm,
    submitWithToken,
    expireToken
};

