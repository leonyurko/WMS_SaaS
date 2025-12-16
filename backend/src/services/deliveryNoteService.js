const { query } = require('../config/database');

/**
 * Get all delivery notes with filters and pagination
 */
const getAllDeliveryNotes = async (filters = {}, pagination = {}) => {
    const { search, supplierId, page = 1, limit = 50 } = { ...filters, ...pagination };
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramCount = 1;

    // Search filter
    if (search) {
        whereConditions.push(`(s.name ILIKE $${paramCount} OR u.username ILIKE $${paramCount} OR dn.notes ILIKE $${paramCount})`);
        params.push(`%${search}%`);
        paramCount++;
    }

    // Supplier filter
    if (supplierId) {
        whereConditions.push(`dn.supplier_id = $${paramCount}`);
        params.push(supplierId);
        paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Get total count
    const countQuery = `
    SELECT COUNT(*) as total 
    FROM delivery_notes dn
    LEFT JOIN suppliers s ON dn.supplier_id = s.id
    LEFT JOIN users u ON dn.received_by = u.id
    ${whereClause}
  `;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    params.push(limit, offset);
    const dataQuery = `
    SELECT 
      dn.*,
      s.name as supplier_name,
      u.username as received_by_username
    FROM delivery_notes dn
    LEFT JOIN suppliers s ON dn.supplier_id = s.id
    LEFT JOIN users u ON dn.received_by = u.id
    ${whereClause}
    ORDER BY dn.delivery_date DESC, dn.created_at DESC
    LIMIT $${paramCount} OFFSET $${paramCount + 1}
  `;

    const result = await query(dataQuery, params);

    return {
        deliveryNotes: result.rows,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
    };
};

/**
 * Get delivery note by ID
 */
const getDeliveryNoteById = async (id) => {
    const result = await query(`
    SELECT 
      dn.*,
      s.name as supplier_name,
      s.email as supplier_email,
      s.phone as supplier_phone,
      u.username as received_by_username
    FROM delivery_notes dn
    LEFT JOIN suppliers s ON dn.supplier_id = s.id
    LEFT JOIN users u ON dn.received_by = u.id
    WHERE dn.id = $1
  `, [id]);
    return result.rows[0] || null;
};

/**
 * Create new delivery note
 */
const createDeliveryNote = async (data) => {
    const { supplierId, receivedBy, deliveryDate, notes, mediaUrls } = data;

    const result = await query(
        `INSERT INTO delivery_notes (supplier_id, received_by, delivery_date, notes, media_urls)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
        [
            supplierId || null,
            receivedBy,
            deliveryDate || new Date(),
            notes || null,
            JSON.stringify(mediaUrls || [])
        ]
    );

    return result.rows[0];
};

/**
 * Update delivery note
 */
const updateDeliveryNote = async (id, data) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.supplierId !== undefined) {
        fields.push(`supplier_id = $${paramCount++}`);
        values.push(data.supplierId || null);
    }
    if (data.deliveryDate !== undefined) {
        fields.push(`delivery_date = $${paramCount++}`);
        values.push(data.deliveryDate);
    }
    if (data.notes !== undefined) {
        fields.push(`notes = $${paramCount++}`);
        values.push(data.notes || null);
    }
    if (data.mediaUrls !== undefined) {
        fields.push(`media_urls = $${paramCount++}`);
        values.push(JSON.stringify(data.mediaUrls || []));
    }

    if (fields.length === 0) {
        throw new Error('No fields to update');
    }

    values.push(id);

    const result = await query(
        `UPDATE delivery_notes SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
    );

    return result.rows[0];
};

/**
 * Delete delivery note
 */
const deleteDeliveryNote = async (id) => {
    const result = await query('DELETE FROM delivery_notes WHERE id = $1', [id]);
    return result.rowCount > 0;
};

/**
 * Add media to delivery note
 */
const addMedia = async (id, mediaUrl) => {
    const result = await query(`
    UPDATE delivery_notes 
    SET media_urls = media_urls || $1::jsonb
    WHERE id = $2
    RETURNING *
  `, [JSON.stringify([mediaUrl]), id]);

    return result.rows[0];
};

/**
 * Remove media from delivery note
 */
const removeMedia = async (id, mediaUrl) => {
    // Get current media urls
    const note = await getDeliveryNoteById(id);
    if (!note) return null;

    const mediaUrls = (note.media_urls || []).filter(url => url !== mediaUrl);

    const result = await query(`
    UPDATE delivery_notes 
    SET media_urls = $1
    WHERE id = $2
    RETURNING *
  `, [JSON.stringify(mediaUrls), id]);

    return result.rows[0];
};

module.exports = {
    getAllDeliveryNotes,
    getDeliveryNoteById,
    createDeliveryNote,
    updateDeliveryNote,
    deleteDeliveryNote,
    addMedia,
    removeMedia
};
