const postModel = require('../models/postModel');

const createPost = async (user, content, type) => {
    // Permission Check: Admin type posts can only be created by Admins
    if (type === 'admin' && user.role !== 'Admin') {
        throw new Error('Only admins can create admin updates');
    }
    return await postModel.create(user.id, content, type);
};

const getPosts = async (type) => {
    return await postModel.findAllByType(type);
};

const updatePost = async (user, postId, content) => {
    const post = await postModel.findById(postId);
    if (!post) throw new Error('Post not found');

    // Permission: Admin can edit any post (optional requirement, usually edit own or all? Assuming generally user edits own, admin edits all if needed, but requirements said "stuff board they can also do all the crud functions but deleting and editing only their own posts")
    // Re-reading requirements:
    // "make sure only admin users can make all the crud functions to both of the boards"
    // "stuff ... viewing the admin board"
    // "stuff board they can also do all the crud functions but deleting and editing only their own 'posts'"

    if (user.role === 'Admin') {
        // Admin can edit anything (implied by "all the crud functions to both of the boards")
    } else if (post.user_id !== user.id) {
        throw new Error('You can only edit your own posts');
    }

    return await postModel.update(postId, content);
};

const deletePost = async (user, postId) => {
    const post = await postModel.findById(postId);
    if (!post) throw new Error('Post not found');

    // Permission: Admin can delete any post. Staff can only delete their own.
    if (user.role === 'Admin') {
        // Allowed
    } else if (post.user_id !== user.id) {
        throw new Error('You can only delete your own posts');
    }

    return await postModel.deletePost(postId);
};

module.exports = {
    createPost,
    getPosts,
    updatePost,
    deletePost
};
