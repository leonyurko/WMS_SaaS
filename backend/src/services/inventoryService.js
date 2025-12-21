const { query, transaction } = require('../config/database');

/**
 * Get all inventory with filters and pagination
 */
const getAllInventory = async (filters = {}, pagination = {}) => {
  const { search, category, status, page = 1, limit = 50 } = { ...filters, ...pagination };
  const offset = (page - 1) * limit;

  let whereConditions = [];
  let params = [];
  let paramCount = 1;

  // Search filter
  if (search) {
    whereConditions.push(`(i.name ILIKE $${paramCount} OR i.barcode ILIKE $${paramCount} OR i.location ILIKE $${paramCount})`);
    params.push(`%${search}%`);
    paramCount++;
  }

  // Category filter
  if (category) {
    whereConditions.push(`i.category_id = $${paramCount}`);
    params.push(category);
    paramCount++;
  }

  // Status filter - accept both short and full format
  if (status) {
    const statusLower = status.toLowerCase();
    if (statusLower === 'low' || statusLower === 'low stock') {
      whereConditions.push('i.current_stock <= i.min_threshold AND i.current_stock > 0');
    } else if (statusLower === 'out' || statusLower === 'out of stock') {
      whereConditions.push('i.current_stock = 0');
    } else if (statusLower === 'in' || statusLower === 'in stock') {
      whereConditions.push('i.current_stock > i.min_threshold');
    }
  }

  // Warehouse filter (Location)
  if (filters.warehouse) {
    whereConditions.push(`i.location = $${paramCount}`);
    params.push(filters.warehouse);
    paramCount++;
  }

  // Shelf filter (Row)
  if (filters.shelf) {
    whereConditions.push(`i.shelf = $${paramCount}`);
    params.push(filters.shelf);
    paramCount++;
  }

  // Shelf Column filter
  if (filters.shelfColumn) {
    whereConditions.push(`i.shelf_column = $${paramCount}`);
    params.push(filters.shelfColumn);
    paramCount++;
  }

  // Part Number filter (Barcode or Name)
  if (filters.partNumber) {
    whereConditions.push(`(i.barcode ILIKE $${paramCount} OR i.name ILIKE $${paramCount})`);
    params.push(`%${filters.partNumber}%`);
    paramCount++;
  }

  const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM inventory i ${whereClause}`;
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Get paginated results
  params.push(limit, offset);
  const dataQuery = `
    SELECT 
      i.*,
      c.name as category_name,
      sc.name as sub_category_name,
      CASE 
        WHEN i.current_stock = 0 THEN 'Out of Stock'
        WHEN i.current_stock <= i.min_threshold THEN 'Low Stock'
        ELSE 'In Stock'
      END as status
    FROM inventory i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN categories sc ON i.sub_category_id = sc.id
    ${whereClause}
    ORDER BY i.updated_at DESC
    LIMIT $${paramCount} OFFSET $${paramCount + 1}
  `;

  const result = await query(dataQuery, params);

  return {
    items: result.rows,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  };
};

/**
 * Get inventory item by ID
 */
const getInventoryById = async (id) => {
  const result = await query(
    `SELECT 
      i.*,
      c.name as category_name,
      sc.name as sub_category_name,
      CASE 
        WHEN i.current_stock = 0 THEN 'Out of Stock'
        WHEN i.current_stock <= i.min_threshold THEN 'Low Stock'
        ELSE 'In Stock'
      END as status
    FROM inventory i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN categories sc ON i.sub_category_id = sc.id
    WHERE i.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Get inventory item by barcode
 */
const getInventoryByBarcode = async (barcode) => {
  const result = await query(
    `SELECT 
      i.*,
      c.name as category_name,
      sc.name as sub_category_name,
      CASE 
        WHEN i.current_stock = 0 THEN 'Out of Stock'
        WHEN i.current_stock <= i.min_threshold THEN 'Low Stock'
        ELSE 'In Stock'
      END as status
    FROM inventory i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN categories sc ON i.sub_category_id = sc.id
    WHERE i.barcode = $1`,
    [barcode]
  );
  return result.rows[0] || null;
};

/**
 * Create new inventory item
 */
const createInventory = async (data, barcode, codeImages = {}) => {
  const {
    name,
    location,
    categoryId,
    subCategoryId,
    shelf,
    description,
    imageUrl,
    imageUrls,
    currentStock,
    minThreshold
  } = data;

  const { qrImageUrl, barcodeImageUrl } = codeImages;

  const result = await query(
    `INSERT INTO inventory 
      (name, location, category_id, sub_category_id, shelf, shelf_column, description, image_url, image_urls, barcode, barcode_image_url, qr_image_url, current_stock, min_threshold, additional_locations, location_details)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *`,
    [
      name,
      location,
      categoryId || null,
      subCategoryId || null,
      shelf || null,
      data.shelfColumn || null,
      description || null,
      imageUrl || null,
      imageUrls ? JSON.stringify(imageUrls) : '[]',
      barcode,
      barcodeImageUrl || null,
      qrImageUrl || null,
      currentStock,
      minThreshold || 10,
      JSON.stringify(data.additionalLocations || []),
      data.locationDetails || null
    ]
  );

  return result.rows[0];
};

/**
 * Update inventory item
 */
const updateInventory = async (id, data) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (data.name !== undefined) {
    fields.push(`name = $${paramCount++}`);
    values.push(data.name);
  }
  if (data.location !== undefined) {
    fields.push(`location = $${paramCount++}`);
    values.push(data.location);
  }
  if (data.categoryId !== undefined) {
    fields.push(`category_id = $${paramCount++}`);
    values.push(data.categoryId || null);
  }
  if (data.subCategoryId !== undefined) {
    fields.push(`sub_category_id = $${paramCount++}`);
    values.push(data.subCategoryId || null);
  }
  if (data.shelf !== undefined) {
    fields.push(`shelf = $${paramCount++}`);
    values.push(data.shelf || null);
  }
  if (data.shelfColumn !== undefined) {
    fields.push(`shelf_column = $${paramCount++}`);
    values.push(data.shelfColumn || null);
  }
  if (data.additionalLocations !== undefined) {
    fields.push(`additional_locations = $${paramCount++}`);
    values.push(JSON.stringify(data.additionalLocations || []));
  }
  if (data.locationDetails !== undefined) {
    fields.push(`location_details = $${paramCount++}`);
    values.push(data.locationDetails || null);
  }
  if (data.description !== undefined) {
    fields.push(`description = $${paramCount++}`);
    values.push(data.description || null);
  }
  if (data.imageUrl !== undefined) {
    fields.push(`image_url = $${paramCount++}`);
    values.push(data.imageUrl || null);
  }
  if (data.imageUrls !== undefined) {
    console.log('🔍 Updating image_urls:', data.imageUrls);
    console.log('🔍 Stringified:', JSON.stringify(data.imageUrls));
    fields.push(`image_urls = $${paramCount++}`);
    values.push(JSON.stringify(data.imageUrls));
  }
  if (data.minThreshold !== undefined) {
    fields.push(`min_threshold = $${paramCount++}`);
    values.push(data.minThreshold);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);

  console.log('🔍 Update query:', `UPDATE inventory SET ${fields.join(', ')} WHERE id = $${paramCount}`);
  console.log('🔍 Update values:', values);

  const result = await query(
    `UPDATE inventory SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  console.log('🔍 Updated item image_urls:', result.rows[0].image_urls);

  return result.rows[0];
};

/**
 * Delete inventory item
 */
const deleteInventory = async (id) => {
  const result = await query('DELETE FROM inventory WHERE id = $1', [id]);
  return result.rowCount > 0;
};

/**
 * Update stock and create transaction
 */
const updateStock = async (id, quantity, reason, type, userId) => {
  return await transaction(async (client) => {
    // Get current item
    const itemResult = await client.query('SELECT * FROM inventory WHERE id = $1', [id]);
    const item = itemResult.rows[0];

    if (!item) {
      throw new Error('Item not found');
    }

    // Calculate new stock
    let newStock = item.current_stock;
    if (type === 'addition') {
      newStock += quantity;
    } else if (type === 'deduction') {
      newStock -= quantity;
      if (newStock < 0) {
        throw new Error('Insufficient stock');
      }
    }

    // Update inventory
    const updateResult = await client.query(
      'UPDATE inventory SET current_stock = $1 WHERE id = $2 RETURNING *',
      [newStock, id]
    );

    // Create transaction record
    const transactionResult = await client.query(
      `INSERT INTO transactions (item_id, user_id, quantity, reason, transaction_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, userId, quantity, reason, type]
    );

    return {
      item: updateResult.rows[0],
      transaction: transactionResult.rows[0]
    };
  });
};

/**
 * Get low stock items
 */
const getLowStockItems = async () => {
  const result = await query('SELECT * FROM v_low_stock_items');
  return result.rows;
};

module.exports = {
  getAllInventory,
  getInventoryById,
  getInventoryByBarcode,
  createInventory,
  updateInventory,
  deleteInventory,
  updateStock,
  getLowStockItems
};
