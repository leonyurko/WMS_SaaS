const permissionsService = require('../services/permissionsService');

/**
 * Get permissions for a specific user (Admin only)
 * GET /api/permissions/:userId
 */
const getUserPermissions = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const permissions = await permissionsService.getUserPermissions(userId);

        res.json({
            status: 'success',
            data: permissions
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update permissions for a user (Admin only)
 * PUT /api/permissions/:userId
 */
const updateUserPermissions = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { permissions } = req.body;

        if (!Array.isArray(permissions)) {
            return res.status(400).json({
                status: 'error',
                message: 'Permissions must be an array'
            });
        }

        const updated = await permissionsService.updateUserPermissions(userId, permissions);

        res.json({
            status: 'success',
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user's accessible pages
 * GET /api/permissions/me
 */
const getMyPermissions = async (req, res, next) => {
    try {
        const accessiblePages = await permissionsService.getMyPermissions(
            req.user.id,
            req.user.role
        );

        res.json({
            status: 'success',
            data: { accessiblePages }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUserPermissions,
    updateUserPermissions,
    getMyPermissions
};
