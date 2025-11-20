const dashboardService = require('../services/dashboardService');

/**
 * Get dashboard metrics
 * GET /api/dashboard/metrics
 */
const getMetrics = async (req, res, next) => {
  try {
    const metrics = await dashboardService.getDashboardMetrics();

    res.json({
      status: 'success',
      data: metrics
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMetrics
};
