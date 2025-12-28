const { query } = require('../config/database');

// Default permissions by role
const DEFAULT_PERMISSIONS = {
    Admin: ['dashboard', 'inventory', 'scanner', 'inventory-history', 'suppliers', 'delivery-notes', 'equipment-borrowing', 'wear-equipment', 'email-formats', 'users'],
    Manager: ['dashboard', 'inventory', 'scanner', 'inventory-history', 'suppliers', 'delivery-notes', 'equipment-borrowing', 'wear-equipment'],
    Staff: ['dashboard', 'inventory', 'scanner', 'delivery-notes', 'wear-equipment']
};

// All available pages
const ALL_PAGES = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'scanner', label: 'Scanner' },
    { key: 'inventory-history', label: 'Inventory History' },
    { key: 'suppliers', label: 'Suppliers' },
    { key: 'delivery-notes', label: 'Delivery Notes' },
    { key: 'equipment-borrowing', label: 'Equipment Borrowing' },
    { key: 'wear-equipment', label: 'Wear Equipment' },
    { key: 'email-formats', label: 'Email Formats' },
    { key: 'users', label: 'Users' }
];

/**
 * Get all permissions for a user
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} Array of permission objects
 */
const getByUserId = async (userId) => {
    const result = await query(
        'SELECT page_key, has_access FROM user_permissions WHERE user_id = $1',
        [userId]
    );
    return result.rows;
};

/**
 * Get accessible pages for a user (including role defaults if no explicit permissions)
 * @param {string} userId - User UUID
 * @param {string} userRole - User's role (Admin, Manager, Staff)
 * @returns {Promise<Array<string>>} Array of page keys user can access
 */
const getAccessiblePages = async (userId, userRole) => {
    // Admins always have full access
    if (userRole === 'Admin') {
        return ALL_PAGES.map(p => p.key);
    }

    const result = await query(
        'SELECT page_key, has_access FROM user_permissions WHERE user_id = $1',
        [userId]
    );

    // If user has explicit permissions, use those
    if (result.rows.length > 0) {
        const accessiblePages = result.rows
            .filter(p => p.has_access)
            .map(p => p.page_key);
        // Dashboard is always accessible
        if (!accessiblePages.includes('dashboard')) {
            accessiblePages.push('dashboard');
        }
        return accessiblePages;
    }

    // Otherwise, use role defaults
    return DEFAULT_PERMISSIONS[userRole] || DEFAULT_PERMISSIONS.Staff;
};

/**
 * Set permissions for a user
 * @param {string} userId - User UUID
 * @param {Array<{pageKey: string, hasAccess: boolean}>} permissions - Array of permission objects
 * @returns {Promise<void>}
 */
const setPermissions = async (userId, permissions) => {
    // Delete existing permissions
    await query('DELETE FROM user_permissions WHERE user_id = $1', [userId]);

    // Insert new permissions
    if (permissions.length > 0) {
        const values = permissions.map((p, i) =>
            `($1, $${i * 2 + 2}, $${i * 2 + 3})`
        ).join(', ');

        const params = [userId];
        permissions.forEach(p => {
            params.push(p.pageKey, p.hasAccess);
        });

        await query(
            `INSERT INTO user_permissions (user_id, page_key, has_access) VALUES ${values}`,
            params
        );
    }
};

/**
 * Initialize default permissions for a new user based on their role
 * @param {string} userId - User UUID
 * @param {string} role - User's role
 * @returns {Promise<void>}
 */
const initializeDefaultPermissions = async (userId, role) => {
    const defaultPages = DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.Staff;
    const permissions = ALL_PAGES.map(page => ({
        pageKey: page.key,
        hasAccess: defaultPages.includes(page.key)
    }));
    await setPermissions(userId, permissions);
};

/**
 * Check if user has access to a specific page
 * @param {string} userId - User UUID
 * @param {string} userRole - User's role
 * @param {string} pageKey - Page key to check
 * @returns {Promise<boolean>}
 */
const hasPageAccess = async (userId, userRole, pageKey) => {
    // Admins always have access
    if (userRole === 'Admin') return true;

    // Dashboard is always accessible
    if (pageKey === 'dashboard') return true;

    const accessiblePages = await getAccessiblePages(userId, userRole);
    return accessiblePages.includes(pageKey);
};

module.exports = {
    getByUserId,
    getAccessiblePages,
    setPermissions,
    initializeDefaultPermissions,
    hasPageAccess,
    ALL_PAGES,
    DEFAULT_PERMISSIONS
};
