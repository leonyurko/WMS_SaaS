const transactionService = require('../services/transactionService');

/**
 * Get all transactions
 * GET /api/transactions
 */
const getAllTransactions = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, productId, userId, page, limit } = req.query;

    const result = await transactionService.getTransactions(
      { dateFrom, dateTo, productId, userId },
      { page, limit }
    );

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get transaction by ID
 * GET /api/transactions/:id
 */
const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await transactionService.getTransactionById(id);

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    res.json({
      status: 'success',
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById
};
