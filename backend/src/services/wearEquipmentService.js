const { query } = require('../config/database');

/**
 * Get all wear reports with optional filters
 */
const getAllWearReports = async (filters = {}) => {
    let sql = `
        SELECT 
            w.*,
            i.name as item_name,
            i.barcode,
            i.image_url as item_image_url,
            i.location as item_location,
            u.username as reported_by_username,
            ru.username as resolved_by_username
        FROM wear_equipment w
        LEFT JOIN inventory i ON w.inventory_id = i.id
        LEFT JOIN users u ON w.reported_by = u.id
        LEFT JOIN users ru ON w.resolved_by = ru.id
        WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.status) {
        sql += ` AND w.status = $${paramCount++}`;
        params.push(filters.status);
    }

    if (filters.search) {
        sql += ` AND (
            i.name ILIKE $${paramCount} OR 
            w.description ILIKE $${paramCount} OR 
            u.username ILIKE $${paramCount}
        )`;
        params.push(`%${filters.search}%`);
        paramCount++;
    }

    if (filters.severity) {
        sql += ` AND w.severity = $${paramCount++}`;
        params.push(filters.severity);
    }

    if (filters.inventoryId) {
        sql += ` AND w.inventory_id = $${paramCount++}`;
        params.push(filters.inventoryId);
    }

    sql += ` ORDER BY 
        CASE w.severity 
            WHEN 'critical' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
        END,
        w.created_at DESC`;

    const result = await query(sql, params);
    return result.rows;
};

/**
 * Get wear report by ID
 */
const getWearReportById = async (id) => {
    const result = await query(`
        SELECT 
            w.*,
            i.name as item_name,
            i.barcode,
            i.image_url as item_image_url,
            i.image_urls as item_image_urls,
            i.location as item_location,
            i.shelf as item_shelf,
            u.username as reported_by_username,
            ru.username as resolved_by_username
        FROM wear_equipment w
        LEFT JOIN inventory i ON w.inventory_id = i.id
        LEFT JOIN users u ON w.reported_by = u.id
        LEFT JOIN users ru ON w.resolved_by = ru.id
        WHERE w.id = $1
    `, [id]);
    return result.rows[0];
};

/**
 * Create new wear report
 */
const createWearReport = async (data) => {
    const { inventoryId, severity, description, mediaUrls, reportedBy } = data;

    const result = await query(`
        INSERT INTO wear_equipment (inventory_id, severity, description, media_urls, reported_by, quantity)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `, [
        inventoryId,
        severity,
        description || null,
        JSON.stringify(mediaUrls || []),
        reportedBy,
        data.quantity || 1
    ]);

    return result.rows[0];
};

/**
 * Update wear report
 */
const updateWearReport = async (id, data) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.severity !== undefined) {
        fields.push(`severity = $${paramCount++}`);
        values.push(data.severity);
    }
    if (data.description !== undefined) {
        fields.push(`description = $${paramCount++}`);
        values.push(data.description);
    }
    if (data.mediaUrls !== undefined) {
        fields.push(`media_urls = $${paramCount++}`);
        values.push(JSON.stringify(data.mediaUrls));
    }
    if (data.quantity !== undefined) {
        fields.push(`quantity = $${paramCount++}`);
        values.push(data.quantity);
    }

    if (fields.length === 0) {
        throw new Error('No fields to update');
    }

    values.push(id);

    const result = await query(
        `UPDATE wear_equipment SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
    );

    return result.rows[0];
};

/**
 * Resolve wear report
 */
const resolveWearReport = async (id, userId) => {
    const result = await query(`
        UPDATE wear_equipment 
        SET status = 'resolved', resolved_by = $1, resolved_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
    `, [userId, id]);

    return result.rows[0];
};

/**
 * Archive wear report
 */
const archiveWearReport = async (id) => {
    const result = await query(`
        UPDATE wear_equipment 
        SET status = 'archived'
        WHERE id = $1
        RETURNING *
    `, [id]);

    return result.rows[0];
};

/**
 * Add media to wear report
 */
const addMedia = async (id, mediaUrl) => {
    const result = await query(`
        UPDATE wear_equipment 
        SET media_urls = media_urls || $1::jsonb
        WHERE id = $2
        RETURNING *
    `, [JSON.stringify([mediaUrl]), id]);

    return result.rows[0];
};

/**
 * Remove media from wear report
 */
const removeMedia = async (id, mediaUrl) => {
    // Get current media urls
    const report = await getWearReportById(id);
    if (!report) return null;

    const mediaUrls = (report.media_urls || []).filter(url => url !== mediaUrl);

    const result = await query(`
        UPDATE wear_equipment 
        SET media_urls = $1
        WHERE id = $2
        RETURNING *
    `, [JSON.stringify(mediaUrls), id]);

    return result.rows[0];
};

/**
 * Get wear equipment stats for dashboard
 */
const getWearStats = async () => {
    const result = await query(`
        SELECT 
            COUNT(*) FILTER (WHERE status = 'open') as total_open,
            COUNT(*) FILTER (WHERE status = 'open' AND severity = 'critical') as critical_count,
            COUNT(*) FILTER (WHERE status = 'open' AND severity = 'high') as high_count,
            COUNT(*) FILTER (WHERE status = 'open' AND severity = 'medium') as medium_count,
            COUNT(*) FILTER (WHERE status = 'open' AND severity = 'low') as low_count,
            COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
            COUNT(*) FILTER (WHERE status = 'archived') as archived_count
        FROM wear_equipment
    `);

    return result.rows[0];
};

/**
 * Delete wear report
 */
const deleteWearReport = async (id) => {
    const result = await query(`
        DELETE FROM wear_equipment WHERE id = $1 RETURNING *
    `, [id]);

    return result.rows[0];
};

module.exports = {
    getAllWearReports,
    getWearReportById,
    createWearReport,
    updateWearReport,
    resolveWearReport,
    archiveWearReport,
    addMedia,
    removeMedia,
    getWearStats,
    deleteWearReport
};
