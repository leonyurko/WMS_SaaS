const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Get all borrowing regulations (forms)
 */
const getAllRegulations = async () => {
    const result = await query(`
    SELECT 
      br.*,
      u.username as created_by_username,
      (SELECT COUNT(*) FROM equipment_borrowing eb WHERE eb.form_id = br.id) as ticket_count,
      (SELECT COUNT(*) FROM equipment_borrowing eb WHERE eb.form_id = br.id AND eb.status = 'open') as open_count
    FROM borrowing_regulations br
    LEFT JOIN users u ON br.created_by = u.id
    ORDER BY br.created_at DESC
  `);
    return result.rows;
};

/**
 * Get regulation by ID (public access for signing)
 */
const getRegulationById = async (id) => {
    const result = await query(`
    SELECT id, name, regulation_text, is_active
    FROM borrowing_regulations
    WHERE id = $1 AND is_active = true
  `, [id]);
    return result.rows[0] || null;
};

/**
 * Get regulation by ID with full details (admin)
 */
const getRegulationByIdAdmin = async (id) => {
    const result = await query(`
    SELECT 
      br.*,
      u.username as created_by_username
    FROM borrowing_regulations br
    LEFT JOIN users u ON br.created_by = u.id
    WHERE br.id = $1
  `, [id]);
    return result.rows[0] || null;
};

/**
 * Create new regulation form
 */
const createRegulation = async (data) => {
    const { name, regulationText, createdBy } = data;

    const result = await query(
        `INSERT INTO borrowing_regulations (name, regulation_text, created_by)
     VALUES ($1, $2, $3)
     RETURNING *`,
        [name, regulationText, createdBy]
    );

    return result.rows[0];
};

/**
 * Update regulation form
 */
const updateRegulation = async (id, data) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.name !== undefined) {
        fields.push(`name = $${paramCount++}`);
        values.push(data.name);
    }
    if (data.regulationText !== undefined) {
        fields.push(`regulation_text = $${paramCount++}`);
        values.push(data.regulationText);
    }
    if (data.isActive !== undefined) {
        fields.push(`is_active = $${paramCount++}`);
        values.push(data.isActive);
    }

    if (fields.length === 0) {
        throw new Error('No fields to update');
    }

    values.push(id);

    const result = await query(
        `UPDATE borrowing_regulations SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
    );

    return result.rows[0];
};

/**
 * Delete regulation form
 */
const deleteRegulation = async (id) => {
    const result = await query('DELETE FROM borrowing_regulations WHERE id = $1', [id]);
    return result.rowCount > 0;
};

/**
 * Get all borrowing tickets with optional status filter
 */
const getAllTickets = async (filters = {}) => {
    const { formId, status, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramCount = 1;

    if (formId) {
        whereConditions.push(`eb.form_id = $${paramCount++}`);
        params.push(formId);
    }
    if (status) {
        whereConditions.push(`eb.status = $${paramCount++}`);
        params.push(status);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const countResult = await query(
        `SELECT COUNT(*) as total FROM equipment_borrowing eb ${whereClause}`,
        params
    );
    const total = parseInt(countResult.rows[0].total);

    params.push(limit, offset);
    const result = await query(`
    SELECT 
      eb.*,
      br.name as regulation_name,
      u.username as closed_by_username
    FROM equipment_borrowing eb
    LEFT JOIN borrowing_regulations br ON eb.form_id = br.id
    LEFT JOIN users u ON eb.closed_by = u.id
    ${whereClause}
    ORDER BY eb.signed_at DESC
    LIMIT $${paramCount} OFFSET $${paramCount + 1}
  `, params);

    return {
        tickets: result.rows,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
    };
};

/**
 * Get ticket by ID
 */
const getTicketById = async (id) => {
    const result = await query(`
    SELECT 
      eb.*,
      br.name as regulation_name,
      br.regulation_text,
      u.username as closed_by_username
    FROM equipment_borrowing eb
    LEFT JOIN borrowing_regulations br ON eb.form_id = br.id
    LEFT JOIN users u ON eb.closed_by = u.id
    WHERE eb.id = $1
  `, [id]);
    return result.rows[0] || null;
};

/**
 * Submit borrowing ticket (public)
 */
const submitTicket = async (formId, data) => {
    const {
        firstName, lastName, companyName, phone, idNumber,
        idPhotoUrl, equipmentName, equipmentPhotoUrl,
        signatureData, ipAddress
    } = data;

    // Keep customer_name for backwards compatibility
    const customerName = `${firstName} ${lastName}`.trim();

    const result = await query(
        `INSERT INTO equipment_borrowing (
      form_id, customer_name, first_name, last_name, company_name, phone,
      id_number, id_photo_url, equipment_name, equipment_photo_url,
      signature_data, ip_address, status
    )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'open')
     RETURNING *`,
        [
            formId, customerName, firstName, lastName, companyName || null, phone,
            idNumber || null, idPhotoUrl || null, equipmentName, equipmentPhotoUrl || null,
            signatureData, ipAddress || null
        ]
    );

    return result.rows[0];
};

/**
 * Archive ticket - close it and delete media files
 */
const archiveTicket = async (ticketId, closedBy) => {
    // Get ticket first to find media files
    const ticket = await getTicketById(ticketId);
    if (!ticket) {
        throw new Error('Ticket not found');
    }
    if (ticket.status === 'archived') {
        throw new Error('Ticket is already archived');
    }

    // Delete media files if they exist
    const mediaToDelete = [ticket.id_photo_url, ticket.equipment_photo_url].filter(Boolean);

    for (const mediaUrl of mediaToDelete) {
        try {
            // Convert URL to file path
            const filePath = path.join(__dirname, '../../', mediaUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted media file: ${filePath}`);
            }
        } catch (err) {
            console.error(`Failed to delete media file ${mediaUrl}:`, err.message);
        }
    }

    // Update ticket to archived status and clear media URLs
    const result = await query(`
    UPDATE equipment_borrowing 
    SET status = 'archived',
        closed_by = $1,
        closed_at = CURRENT_TIMESTAMP,
        id_photo_url = NULL,
        equipment_photo_url = NULL
    WHERE id = $2
    RETURNING *
  `, [closedBy, ticketId]);

    return result.rows[0];
};

module.exports = {
    getAllRegulations,
    getRegulationById,
    getRegulationByIdAdmin,
    createRegulation,
    updateRegulation,
    deleteRegulation,
    getAllTickets,
    getTicketById,
    submitTicket,
    archiveTicket
};
