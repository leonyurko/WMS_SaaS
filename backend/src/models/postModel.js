const { query } = require('../config/database');

const create = async (userId, content, type, direction = 'ltr') => {
    const result = await query(
        `INSERT INTO posts (user_id, content, type, direction) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
        [userId, content, type, direction]
    );
    return result.rows[0];
};

const findAllByType = async (type) => {
    const result = await query(
        `SELECT p.*, u.username, u.role 
     FROM posts p 
     JOIN users u ON p.user_id = u.id 
     WHERE p.type = $1 
     ORDER BY p.created_at DESC`,
        [type]
    );
    return result.rows;
};

const update = async (id, content) => {
    const result = await query(
        `UPDATE posts 
     SET content = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 
     RETURNING *`,
        [content, id]
    );
    return result.rows[0];
};

const deletePost = async (id) => {
    const result = await query('DELETE FROM posts WHERE id = $1', [id]);
    return result.rowCount > 0;
};

const findById = async (id) => {
    const result = await query('SELECT * FROM posts WHERE id = $1', [id]);
    return result.rows[0];
};

module.exports = {
    create,
    findAllByType,
    update,
    deletePost,
    findById
};
