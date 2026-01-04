const { query } = require('../config/database');

/**
 * Create transaction record
 */
const createTransaction = async (data) => {
  const { itemId, userId, quantity, reason, transactionType } = data;

  const result = await query(
    `INSERT INTO transactions (item_id, user_id, quantity, reason, transaction_type)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [itemId, userId, quantity, reason, transactionType]
  );

  return result.rows[0];
};

/**
 * Get all transactions with filters and pagination
 */
const getTransactions = async (filters = {}, pagination = {}) => {
  const { dateFrom, dateTo, productId, userId, search, page = 1, limit = 50 } = { ...filters, ...pagination };
  const offset = (page - 1) * limit;

  let whereConditions = [];
  let params = [];
  let paramCount = 1;

  // Search filter (Type, Product Name, User Name)
  if (search) {
    const searchParamPosition = paramCount;
    // Using ILIKE for case-insensitive partial match
    whereConditions.push(`(
      t.transaction_type ILIKE $${searchParamPosition} OR 
      i.name ILIKE $${searchParamPosition} OR 
      u.username ILIKE $${searchParamPosition}
    )`);
    params.push(`%${search}%`);
    paramCount++;
  }

  // Date range filter
  if (dateFrom) {
    whereConditions.push(`t.created_at >= $${paramCount}`);
    params.push(dateFrom);
    paramCount++;
  }

  if (dateTo) {
    whereConditions.push(`t.created_at <= $${paramCount}`);
    params.push(dateTo);
    paramCount++;
  }

  // Product filter
  if (productId) {
    whereConditions.push(`t.item_id = $${paramCount}`);
    params.push(productId);
    paramCount++;
  }

  // User filter
  if (userId) {
    whereConditions.push(`t.user_id = $${paramCount}`);
    params.push(userId);
    paramCount++;
  }

  const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM transactions t ${whereClause}`;
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Get paginated results
  params.push(limit, offset);
  const dataQuery = `
    SELECT 
      t.*,
      i.name as product_name,
      i.barcode as product_barcode,
      u.username as user_name
    FROM transactions t
    LEFT JOIN inventory i ON t.item_id = i.id
    LEFT JOIN users u ON t.user_id = u.id
    ${whereClause}
    ORDER BY t.created_at DESC
    LIMIT $${paramCount} OFFSET $${paramCount + 1}
  `;

  const result = await query(dataQuery, params);

  return {
    transactions: result.rows,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  };
};

/**
 * Get transaction by ID
 */
const getTransactionById = async (id) => {
  const result = await query(
    `SELECT 
      t.*,
      i.name as product_name,
      i.barcode as product_barcode,
      u.username as user_name
    FROM transactions t
    LEFT JOIN inventory i ON t.item_id = i.id
    LEFT JOIN users u ON t.user_id = u.id
    WHERE t.id = $1`,
    [id]
  );

  return result.rows[0] || null;
};

/**
 * Get recent transactions (last N hours)
 */
const getRecentTransactions = async (hours = 24) => {
  const result = await query(
    `SELECT 
      t.*,
      i.name as product_name,
      u.username as user_name
    FROM transactions t
    LEFT JOIN inventory i ON t.item_id = i.id
    LEFT JOIN users u ON t.user_id = u.id
    WHERE t.created_at >= NOW() - INTERVAL '${hours} hours'
    ORDER BY t.created_at DESC
    LIMIT 100`
  );

  return result.rows;
};

/**
 * Get transaction count for last N hours
 */
const getRecentTransactionCount = async (hours = 24) => {
  const result = await query(
    `SELECT COUNT(*) as count
     FROM transactions
     WHERE created_at >= NOW() - INTERVAL '${hours} hours'`
  );

  return parseInt(result.rows[0].count);
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  getRecentTransactions,
  getRecentTransactionCount
};
