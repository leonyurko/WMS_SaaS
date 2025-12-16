const { query } = require('../config/database');

/**
 * Get all signing forms
 */
const getAllForms = async () => {
    const result = await query(`
    SELECT 
      sf.*,
      u.username as created_by_username,
      (SELECT COUNT(*) FROM equipment_signatures es WHERE es.form_id = sf.id) as signature_count
    FROM signing_forms sf
    LEFT JOIN users u ON sf.created_by = u.id
    ORDER BY sf.created_at DESC
  `);
    return result.rows;
};

/**
 * Get form by ID (for signing - public access)
 */
const getFormById = async (id) => {
    const result = await query(`
    SELECT id, name, regulation_text, is_active
    FROM signing_forms
    WHERE id = $1 AND is_active = true
  `, [id]);
    return result.rows[0] || null;
};

/**
 * Get form by ID with full details (admin)
 */
const getFormByIdAdmin = async (id) => {
    const result = await query(`
    SELECT 
      sf.*,
      u.username as created_by_username
    FROM signing_forms sf
    LEFT JOIN users u ON sf.created_by = u.id
    WHERE sf.id = $1
  `, [id]);
    return result.rows[0] || null;
};

/**
 * Create new signing form
 */
const createForm = async (data) => {
    const { name, regulationText, createdBy } = data;

    const result = await query(
        `INSERT INTO signing_forms (name, regulation_text, created_by)
     VALUES ($1, $2, $3)
     RETURNING *`,
        [name, regulationText, createdBy]
    );

    return result.rows[0];
};

/**
 * Update signing form
 */
const updateForm = async (id, data) => {
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
        `UPDATE signing_forms SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
    );

    return result.rows[0];
};

/**
 * Delete signing form
 */
const deleteForm = async (id) => {
    const result = await query('DELETE FROM signing_forms WHERE id = $1', [id]);
    return result.rowCount > 0;
};

/**
 * Submit customer signature (public)
 */
const submitSignature = async (formId, data) => {
    const { customerName, customerEmail, customerPhone, signatureData, ipAddress } = data;

    const result = await query(
        `INSERT INTO equipment_signatures (form_id, customer_name, customer_email, customer_phone, signature_data, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
        [formId, customerName, customerEmail || null, customerPhone || null, signatureData, ipAddress || null]
    );

    return result.rows[0];
};

/**
 * Get signatures for a form (admin)
 */
const getSignatures = async (formId, pagination = {}) => {
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;

    const countResult = await query(
        'SELECT COUNT(*) as total FROM equipment_signatures WHERE form_id = $1',
        [formId]
    );
    const total = parseInt(countResult.rows[0].total);

    const result = await query(`
    SELECT *
    FROM equipment_signatures
    WHERE form_id = $1
    ORDER BY signed_at DESC
    LIMIT $2 OFFSET $3
  `, [formId, limit, offset]);

    return {
        signatures: result.rows,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
    };
};

/**
 * Get signature by ID
 */
const getSignatureById = async (id) => {
    const result = await query(`
    SELECT 
      es.*,
      sf.name as form_name
    FROM equipment_signatures es
    LEFT JOIN signing_forms sf ON es.form_id = sf.id
    WHERE es.id = $1
  `, [id]);
    return result.rows[0] || null;
};

module.exports = {
    getAllForms,
    getFormById,
    getFormByIdAdmin,
    createForm,
    updateForm,
    deleteForm,
    submitSignature,
    getSignatures,
    getSignatureById
};
