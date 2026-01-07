const { query } = require('../config/database');

const getAllSettings = async () => {
    const result = await query('SELECT * FROM system_settings ORDER BY setting_key');
    return result.rows;
};

const getSetting = async (key) => {
    const result = await query('SELECT * FROM system_settings WHERE setting_key = $1', [key]);
    return result.rows[0];
};

const updateSetting = async (key, value, userId) => {
    const result = await query(
        `UPDATE system_settings 
         SET setting_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 
         WHERE setting_key = $3 
         RETURNING *`,
        [value, userId, key]
    );
    return result.rows[0];
};

module.exports = {
    getAllSettings,
    getSetting,
    updateSetting
};
