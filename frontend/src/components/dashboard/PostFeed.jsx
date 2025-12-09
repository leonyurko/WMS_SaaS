import { useState, useEffect } from 'react';
import api from '../../services/api';
import PostCard from './PostCard';

const PostFeed = ({ type, title, currentUser }) => {
    const [posts, setPosts] = useState([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Determine if current user can post in this feed
    const canPost = type === 'staff' || (type === 'admin' && currentUser.role === 'Admin');

    useEffect(() => {
        fetchPosts();
    }, [type]);

    const fetchPosts = async () => {
        try {
            const response = await api.get(`/posts?type=${type}`);
            setPosts(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load posts');
            setLoading(false);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPostContent.trim()) return;

        try {
            await api.post('/posts', { content: newPostContent, type });
            setNewPostContent('');
            fetchPosts(); // Refresh list
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create post');
        }
    };

    const handleUpdatePost = async (postId, content) => {
        try {
            await api.put(`/posts/${postId}`, { content });
            fetchPosts();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update post');
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        try {
            await api.delete(`/posts/${postId}`);
            fetchPosts();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete post');
        }
    };

    return (
        <div className="bg-gray-50 rounded-lg p-4 h-full flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                {title}
            </h3>

            {/* Create Post Input */}
            {canPost && (
                <form onSubmit={handleCreatePost} className="mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
                        <textarea
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder={`Write an update for ${title}...`}
                            className="w-full resize-none outline-none text-gray-700 min-h-[80px]"
                        />
                        <div className="flex justify-end mt-2 pt-2 border-t border-gray-100">
                            <button
                                type="submit"
                                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                                disabled={!newPostContent.trim()}
                            >
                                Post
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Posts List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {loading ? (
                    <div className="text-center text-gray-500 py-4">Loading updates...</div>
                ) : error ? (
                    <div className="text-center text-red-500 py-4">{error}</div>
                ) : posts.length === 0 ? (
                    <div className="text-center text-gray-400 py-8 italic">No updates yet.</div>
                ) : (
                    posts.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            currentUser={currentUser}
                            onUpdate={handleUpdatePost}
                            onDelete={handleDeletePost}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default PostFeed;
