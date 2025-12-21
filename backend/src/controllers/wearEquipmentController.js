const wearEquipmentService = require('../services/wearEquipmentService');

/**
 * Get all wear reports
 * GET /api/wear-equipment
 */
const getAllWearReports = async (req, res) => {
    try {
        const { status, severity, inventoryId } = req.query;
        const reports = await wearEquipmentService.getAllWearReports({ status, severity, inventoryId });
        res.json({ reports });
    } catch (error) {
        console.error('Error getting wear reports:', error);
        res.status(500).json({ message: 'Failed to get wear reports', error: error.message });
    }
};

/**
 * Get wear report by ID
 * GET /api/wear-equipment/:id
 */
const getWearReportById = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await wearEquipmentService.getWearReportById(id);

        if (!report) {
            return res.status(404).json({ message: 'Wear report not found' });
        }

        res.json({ report });
    } catch (error) {
        console.error('Error getting wear report:', error);
        res.status(500).json({ message: 'Failed to get wear report', error: error.message });
    }
};

/**
 * Create wear report
 * POST /api/wear-equipment
 */
const createWearReport = async (req, res) => {
    try {
        const { inventoryId, severity, description } = req.body;
        const reportedBy = req.user.id;

        if (!inventoryId || !severity) {
            return res.status(400).json({ message: 'Inventory ID and severity are required' });
        }

        // Get uploaded media URLs if any
        const mediaUrls = req.files ? req.files.map(f => `/uploads/wear-equipment/${f.filename}`) : [];

        const report = await wearEquipmentService.createWearReport({
            inventoryId,
            severity,
            description,
            mediaUrls,
            reportedBy
        });

        res.status(201).json({ message: 'Wear report created successfully', report });
    } catch (error) {
        console.error('Error creating wear report:', error);
        res.status(500).json({ message: 'Failed to create wear report', error: error.message });
    }
};

/**
 * Update wear report
 * PUT /api/wear-equipment/:id
 */
const updateWearReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { severity, description, mediaUrls } = req.body;

        const report = await wearEquipmentService.updateWearReport(id, {
            severity,
            description,
            mediaUrls
        });

        if (!report) {
            return res.status(404).json({ message: 'Wear report not found' });
        }

        res.json({ message: 'Wear report updated successfully', report });
    } catch (error) {
        console.error('Error updating wear report:', error);
        res.status(500).json({ message: 'Failed to update wear report', error: error.message });
    }
};

/**
 * Resolve wear report
 * POST /api/wear-equipment/:id/resolve
 */
const resolveWearReport = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const report = await wearEquipmentService.resolveWearReport(id, userId);

        if (!report) {
            return res.status(404).json({ message: 'Wear report not found' });
        }

        res.json({ message: 'Wear report resolved successfully', report });
    } catch (error) {
        console.error('Error resolving wear report:', error);
        res.status(500).json({ message: 'Failed to resolve wear report', error: error.message });
    }
};

/**
 * Archive wear report
 * POST /api/wear-equipment/:id/archive
 */
const archiveWearReport = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await wearEquipmentService.archiveWearReport(id);

        if (!report) {
            return res.status(404).json({ message: 'Wear report not found' });
        }

        res.json({ message: 'Wear report archived successfully', report });
    } catch (error) {
        console.error('Error archiving wear report:', error);
        res.status(500).json({ message: 'Failed to archive wear report', error: error.message });
    }
};

/**
 * Upload media for wear report
 * POST /api/wear-equipment/:id/media
 */
const uploadMedia = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const mediaUrl = `/uploads/wear-equipment/${req.file.filename}`;
        const report = await wearEquipmentService.addMedia(id, mediaUrl);

        if (!report) {
            return res.status(404).json({ message: 'Wear report not found' });
        }

        res.json({ message: 'Media uploaded successfully', mediaUrl, report });
    } catch (error) {
        console.error('Error uploading media:', error);
        res.status(500).json({ message: 'Failed to upload media', error: error.message });
    }
};

/**
 * Remove media from wear report
 * DELETE /api/wear-equipment/:id/media
 */
const removeMedia = async (req, res) => {
    try {
        const { id } = req.params;
        const { mediaUrl } = req.body;

        if (!mediaUrl) {
            return res.status(400).json({ message: 'Media URL is required' });
        }

        const report = await wearEquipmentService.removeMedia(id, mediaUrl);

        if (!report) {
            return res.status(404).json({ message: 'Wear report not found' });
        }

        res.json({ message: 'Media removed successfully', report });
    } catch (error) {
        console.error('Error removing media:', error);
        res.status(500).json({ message: 'Failed to remove media', error: error.message });
    }
};

/**
 * Get wear equipment stats
 * GET /api/wear-equipment/stats
 */
const getWearStats = async (req, res) => {
    try {
        const stats = await wearEquipmentService.getWearStats();
        res.json({ stats });
    } catch (error) {
        console.error('Error getting wear stats:', error);
        res.status(500).json({ message: 'Failed to get wear stats', error: error.message });
    }
};

/**
 * Delete wear report
 * DELETE /api/wear-equipment/:id
 */
const deleteWearReport = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await wearEquipmentService.deleteWearReport(id);

        if (!report) {
            return res.status(404).json({ message: 'Wear report not found' });
        }

        res.json({ message: 'Wear report deleted successfully' });
    } catch (error) {
        console.error('Error deleting wear report:', error);
        res.status(500).json({ message: 'Failed to delete wear report', error: error.message });
    }
};

module.exports = {
    getAllWearReports,
    getWearReportById,
    createWearReport,
    updateWearReport,
    resolveWearReport,
    archiveWearReport,
    uploadMedia,
    removeMedia,
    getWearStats,
    deleteWearReport
};
