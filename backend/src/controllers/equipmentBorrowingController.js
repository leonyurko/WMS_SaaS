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
    archiveTicket
};
