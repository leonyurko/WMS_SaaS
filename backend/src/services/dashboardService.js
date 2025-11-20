const { query } = require('../config/database');

/**
 * Get total products count
 */
const getTotalProducts = async () => {
  const result = await query('SELECT COUNT(*) as count FROM inventory');
  return parseInt(result.rows[0].count);
};

/**
 * Get low stock items count
 */
const getLowStockCount = async () => {
  const result = await query(
    'SELECT COUNT(*) as count FROM inventory WHERE current_stock <= min_threshold AND current_stock > 0'
  );
  return parseInt(result.rows[0].count);
};

/**
 * Get out of stock items count
 */
const getOutOfStockCount = async () => {
  const result = await query(
    'SELECT COUNT(*) as count FROM inventory WHERE current_stock = 0'
  );
  return parseInt(result.rows[0].count);
};

/**
 * Get recent transactions count (last 24 hours)
 */
const getRecentTransactionsCount = async (hours = 24) => {
  const result = await query(
    `SELECT COUNT(*) as count FROM transactions WHERE created_at >= NOW() - INTERVAL '${hours} hours'`
  );
  return parseInt(result.rows[0].count);
};

/**
 * Get all dashboard metrics
 */
const getDashboardMetrics = async () => {
  const [totalProducts, lowStockCount, outOfStockCount, recentTransactions] = await Promise.all([
    getTotalProducts(),
    getLowStockCount(),
    getOutOfStockCount(),
    getRecentTransactionsCount()
  ]);

  return {
    totalProducts,
    lowStockCount,
    outOfStockCount,
    recentTransactions
  };
};

module.exports = {
  getTotalProducts,
  getLowStockCount,
  getOutOfStockCount,
  getRecentTransactionsCount,
  getDashboardMetrics
};
