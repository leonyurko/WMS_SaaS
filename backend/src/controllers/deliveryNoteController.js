const deliveryNoteService = require('../services/deliveryNoteService');

/**
 * Get all delivery notes
 */
const getAllDeliveryNotes = async (req, res) => {
    try {
        const { search, supplierId, page, limit } = req.query;
        const result = await deliveryNoteService.getAllDeliveryNotes(
            { search, supplierId },
            { page, limit }
        );
        res.json(result);
    } catch (error) {
        console.error('Error getting delivery notes:', error);
        res.status(500).json({ message: 'Failed to get delivery notes', error: error.message });
    }
};

/**
 * Get delivery note by ID
 */
const getDeliveryNoteById = async (req, res) => {
    try {
        const { id } = req.params;
        const note = await deliveryNoteService.getDeliveryNoteById(id);

        if (!note) {
            return res.status(404).json({ message: 'Delivery note not found' });
        }

        res.json(note);
    } catch (error) {
        console.error('Error getting delivery note:', error);
        res.status(500).json({ message: 'Failed to get delivery note', error: error.message });
    }
};

/**
 * Create delivery note
 */
const createDeliveryNote = async (req, res) => {
    try {
        const { supplierId, deliveryDate, notes, mediaUrls } = req.body;
        const receivedBy = req.user.id;

        const note = await deliveryNoteService.createDeliveryNote({
            supplierId,
            receivedBy,
            deliveryDate,
            notes,
            mediaUrls
        });

        res.status(201).json(note);
    } catch (error) {
        console.error('Error creating delivery note:', error);
        res.status(500).json({ message: 'Failed to create delivery note', error: error.message });
    }
};

/**
 * Update delivery note
 */
const updateDeliveryNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { supplierId, deliveryDate, notes, mediaUrls } = req.body;

        const note = await deliveryNoteService.updateDeliveryNote(id, {
            supplierId,
            deliveryDate,
            notes,
            mediaUrls
        });

        if (!note) {
            return res.status(404).json({ message: 'Delivery note not found' });
        }

        res.json(note);
    } catch (error) {
        console.error('Error updating delivery note:', error);
        res.status(500).json({ message: 'Failed to update delivery note', error: error.message });
    }
};

/**
 * Delete delivery note
 */
const deleteDeliveryNote = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await deliveryNoteService.deleteDeliveryNote(id);

        if (!deleted) {
            return res.status(404).json({ message: 'Delivery note not found' });
        }

        res.json({ message: 'Delivery note deleted successfully' });
    } catch (error) {
        console.error('Error deleting delivery note:', error);
        res.status(500).json({ message: 'Failed to delete delivery note', error: error.message });
    }
};

/**
 * Upload media for delivery note
 */
const uploadMedia = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const mediaUrl = `/uploads/delivery-notes/${req.file.filename}`;
        const note = await deliveryNoteService.addMedia(id, mediaUrl);

        if (!note) {
            return res.status(404).json({ message: 'Delivery note not found' });
        }

        res.json({ mediaUrl, note });
    } catch (error) {
        console.error('Error uploading media:', error);
        res.status(500).json({ message: 'Failed to upload media', error: error.message });
    }
};

/**
 * Remove media from delivery note
 */
const removeMedia = async (req, res) => {
    try {
        const { id } = req.params;
        const { mediaUrl } = req.body;

        const note = await deliveryNoteService.removeMedia(id, mediaUrl);

        if (!note) {
            return res.status(404).json({ message: 'Delivery note not found' });
        }

        res.json(note);
    } catch (error) {
        console.error('Error removing media:', error);
        res.status(500).json({ message: 'Failed to remove media', error: error.message });
    }
};

module.exports = {
    getAllDeliveryNotes,
    getDeliveryNoteById,
    createDeliveryNote,
    updateDeliveryNote,
    deleteDeliveryNote,
    uploadMedia,
    removeMedia
};
