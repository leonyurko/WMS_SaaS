const permissionsModel = require('../models/permissionsModel');
const userModel = require('../models/userModel');

/**
 * Get permissions for a user
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Permissions data
 */
const getUserPermissions = async (userId) => {
    const user = await userModel.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    const permissions = await permissionsModel.getByUserId(userId);
    const accessiblePages = await permissionsModel.getAccessiblePages(userId, user.role);

    return {
        userId,
        role: user.role,
        permissions: permissions.length > 0 ? permissions : null,
        accessiblePages,
        allPages: permissionsModel.ALL_PAGES
    };
};

/**
 * Update permissions for a user
 * @param {string} userId - User UUID
 * @param {Array<{pageKey: string, hasAccess: boolean}>} permissions - Permissions array
 * @returns {Promise<Object>} Updated permissions
 */
const updateUserPermissions = async (userId, permissions) => {
    const user = await userModel.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    // Don't allow modifying admin permissions
    if (user.role === 'Admin') {
        throw new Error('Cannot modify admin permissions');
    }

    await permissionsModel.setPermissions(userId, permissions);
    return getUserPermissions(userId);
};

/**
 * Get current user's accessible pages
 * @param {string} userId - User UUID
 * @param {string} userRole - User's role
 * @returns {Promise<Array<string>>} Array of accessible page keys
 */
const getMyPermissions = async (userId, userRole) => {
    return permissionsModel.getAccessiblePages(userId, userRole);
};

module.exports = {
    getUserPermissions,
    updateUserPermissions,
    getMyPermissions
};
