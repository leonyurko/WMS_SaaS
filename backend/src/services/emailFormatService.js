const { query } = require('../config/database');

/**
 * Get all email formats
 */
const getAllFormats = async () => {
  const result = await query(
    `SELECT 
      ef.*,
      u.username as created_by_user
     FROM email_formats ef
     LEFT JOIN users u ON ef.created_by = u.id
     ORDER BY ef.created_at DESC`
  );

  return result.rows;
};

/**
 * Get format by ID
 */
const getFormatById = async (id) => {
  const result = await query('SELECT * FROM email_formats WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * Create new email format
 */
const createFormat = async (data) => {
  const { name, subject, body, formatType, createdBy } = data;

  const result = await query(
    `INSERT INTO email_formats (name, subject, body, format_type, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, subject, body, formatType || 'order', createdBy]
  );

  return result.rows[0];
};

/**
 * Update email format
 */
const updateFormat = async (id, data) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (data.name !== undefined) {
    fields.push(`name = $${paramCount++}`);
    values.push(data.name);
  }
  if (data.subject !== undefined) {
    fields.push(`subject = $${paramCount++}`);
    values.push(data.subject);
  }
  if (data.body !== undefined) {
    fields.push(`body = $${paramCount++}`);
    values.push(data.body);
  }
  if (data.formatType !== undefined) {
    fields.push(`format_type = $${paramCount++}`);
    values.push(data.formatType);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);

  const result = await query(
    `UPDATE email_formats SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  return result.rows[0];
};

/**
 * Delete email format
 */
const deleteFormat = async (id) => {
  const result = await query('DELETE FROM email_formats WHERE id = $1', [id]);
  return result.rowCount > 0;
};

/**
 * Process email format with variables
 * Variables: {userName}, {companyName}, {supplierName}, {itemName}, {quantity}, {notes}
 */
const processFormatTemplate = async (formatId, variables) => {
  const format = await getFormatById(formatId);
  
  if (!format) {
    throw new Error('Email format not found');
  }

  let processedSubject = format.subject;
  let processedBody = format.body;

  // Replace variables in subject and body
  Object.keys(variables).forEach(key => {
    const placeholder = `{${key}}`;
    // Escape special regex characters in the placeholder
    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const value = variables[key] || '';
    processedSubject = processedSubject.split(placeholder).join(value);
    processedBody = processedBody.split(placeholder).join(value);
  });

  return {
    subject: processedSubject,
    body: processedBody
  };
};

module.exports = {
  getAllFormats,
  getFormatById,
  createFormat,
  updateFormat,
  deleteFormat,
  processFormatTemplate
};
