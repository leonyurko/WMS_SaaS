const postService = require('../services/postService');

const getPosts = async (req, res) => {
    try {
        const { type } = req.query;
        if (!type || (type !== 'admin' && type !== 'staff')) {
            return res.status(400).json({ message: 'Invalid or missing type parameter' });
        }
        const posts = await postService.getPosts(type);
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const createPost = async (req, res) => {
    try {
        const { content, type } = req.body;
        if (!content || !type) {
            return res.status(400).json({ message: 'Content and type are required' });
        }
        const post = await postService.createPost(req.user, content, type);
        res.status(201).json(post);
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const post = await postService.updatePost(req.user, id, content);
        res.json(post);
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        await postService.deletePost(req.user, id);
        res.json({ message: 'Post deleted' });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

module.exports = {
    getPosts,
    createPost,
    updatePost,
    deletePost
};
