const { query } = require('../config/database');

/**
 * Get all suppliers with filters and pagination
 */
const getAllSuppliers = async (filters = {}, pagination = {}) => {
  const { search, page = 1, limit = 50 } = { ...filters, ...pagination };
  const offset = (page - 1) * limit;

  let whereConditions = [];
  let params = [];
  let paramCount = 1;

  // Search filter
  if (search) {
    whereConditions.push(`(s.name ILIKE $${paramCount} OR s.email ILIKE $${paramCount} OR s.contact_person ILIKE $${paramCount})`);
    params.push(`%${search}%`);
    paramCount++;
  }

  // Only active suppliers by default
  whereConditions.push('s.is_active = true');

  const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM suppliers s ${whereClause}`;
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Get paginated results
  params.push(limit, offset);
  const dataQuery = `
    SELECT s.*
    FROM suppliers s
    ${whereClause}
    ORDER BY s.name ASC
    LIMIT $${paramCount} OFFSET $${paramCount + 1}
  `;

  const result = await query(dataQuery, params);

  return {
    suppliers: result.rows,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  };
};

/**
 * Get supplier by ID
 */
const getSupplierById = async (id) => {
  const result = await query('SELECT * FROM suppliers WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * Create new supplier
 */
const createSupplier = async (data) => {
  const { name, contactPerson, phone, email, location, notes, operatingHours, additionalPhones, additionalEmails } = data;

  const result = await query(
    `INSERT INTO suppliers (name, contact_person, phone, email, location, notes, operating_hours, additional_phones, additional_emails)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      name,
      contactPerson || null,
      phone || null,
      email,
      location || null,
      notes || null,
      operatingHours || null,
      JSON.stringify(additionalPhones || []),
      JSON.stringify(additionalEmails || [])
    ]
  );

  return result.rows[0];
};

/**
 * Update supplier
 */
const updateSupplier = async (id, data) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (data.name !== undefined) {
    fields.push(`name = $${paramCount++}`);
    values.push(data.name);
  }
  if (data.contactPerson !== undefined) {
    fields.push(`contact_person = $${paramCount++}`);
    values.push(data.contactPerson || null);
  }
  if (data.phone !== undefined) {
    fields.push(`phone = $${paramCount++}`);
    values.push(data.phone || null);
  }
  if (data.email !== undefined) {
    fields.push(`email = $${paramCount++}`);
    values.push(data.email);
  }
  if (data.location !== undefined) {
    fields.push(`location = $${paramCount++}`);
    values.push(data.location || null);
  }
  if (data.notes !== undefined) {
    fields.push(`notes = $${paramCount++}`);
    values.push(data.notes || null);
  }
  if (data.operatingHours !== undefined) {
    fields.push(`operating_hours = $${paramCount++}`);
    values.push(data.operatingHours || null);
  }
  if (data.additionalPhones !== undefined) {
    fields.push(`additional_phones = $${paramCount++}`);
    values.push(JSON.stringify(data.additionalPhones || []));
  }
  if (data.additionalEmails !== undefined) {
    fields.push(`additional_emails = $${paramCount++}`);
    values.push(JSON.stringify(data.additionalEmails || []));
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
    `UPDATE suppliers SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  return result.rows[0];
};

/**
 * Delete supplier
 */
const deleteSupplier = async (id) => {
  const result = await query('DELETE FROM suppliers WHERE id = $1', [id]);
  return result.rowCount > 0;
};

/**
 * Create supplier order
 */
const createSupplierOrder = async (data) => {
  const { supplierId, itemId, quantity, notes, sentBy } = data;

  const result = await query(
    `INSERT INTO supplier_orders (supplier_id, item_id, quantity, notes, sent_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [supplierId, itemId || null, quantity, notes || null, sentBy]
  );

  return result.rows[0];
};

/**
 * Get orders by supplier
 */
const getOrdersBySupplier = async (supplierId) => {
  const result = await query(
    `SELECT 
      so.*,
      i.name as item_name,
      u.username as sent_by_user
     FROM supplier_orders so
     LEFT JOIN inventory i ON so.item_id = i.id
     LEFT JOIN users u ON so.sent_by = u.id
     WHERE so.supplier_id = $1
     ORDER BY so.created_at DESC`,
    [supplierId]
  );

  return result.rows;
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  createSupplierOrder,
  getOrdersBySupplier
};
