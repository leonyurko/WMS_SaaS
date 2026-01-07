const settingsModel = require('../models/settingsModel');

const getSettings = async (req, res) => {
    try {
        const settings = await settingsModel.getAllSettings();
        // Convert to object for easier frontend consumption, or send array. Object is often nicer.
        // Let's send array as it preserves metadata like description/updated_at easily
        res.json({ settings });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Failed to fetch settings' });
    }
};

const updateSettings = async (req, res) => {
    try {
        const { settings } = req.body; // Expects object or array of { key, value }
        const userId = req.user.id;

        const results = [];

        // Handle array of updates
        if (Array.isArray(settings)) {
            for (const setting of settings) {
                const updated = await settingsModel.updateSetting(setting.key, setting.value, userId);
                results.push(updated);
            }
        } else if (typeof settings === 'object') {
            for (const [key, value] of Object.entries(settings)) {
                const updated = await settingsModel.updateSetting(key, value, userId);
                results.push(updated);
            }
        }

        res.json({ message: 'Settings updated successfully', settings: results });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ message: 'Failed to update settings' });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
