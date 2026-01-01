import { useState, useEffect } from 'react';
import api from '../../services/api';
import PostCard from './PostCard';

const PostFeed = ({ type, title, currentUser }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [direction, setDirection] = useState('rtl'); // Default to RTL as requested

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
            await api.post('/posts', { content: newPostContent, type, direction });
            setNewPostContent('');
            setDirection('rtl'); // Reset to default
            setShowModal(false);
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
        <div className="bg-gray-50 rounded-lg p-4 h-full flex flex-col relative">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">
                    {title}
                </h3>
                {canPost && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-3 py-1 bg-brand-red text-white text-sm rounded hover:bg-red-700 flex items-center"
                    >
                        <i className="fas fa-plus mr-1"></i> Add Update
                    </button>
                )}
            </div>

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

            {/* Create Post Modal */}
            {showModal && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-25 rounded-lg p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm border border-gray-200">
                        <div className="flex justify-between items-center p-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                            <h4 className="font-semibold text-gray-700">New Update</h4>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleCreatePost} className="p-4">
                            <div className="mb-3">
                                <div className="flex space-x-4 mb-2">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={direction === 'rtl'}
                                            onChange={() => setDirection('rtl')}
                                            className="text-brand-red focus:ring-brand-red"
                                        />
                                        <span className="text-sm text-gray-700">RTL (Hebrew)</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={direction === 'ltr'}
                                            onChange={() => setDirection('ltr')}
                                            className="text-brand-red focus:ring-brand-red"
                                        />
                                        <span className="text-sm text-gray-700">LTR (English)</span>
                                    </label>
                                </div>
                                <textarea
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    placeholder={`Write an update for ${title}...`}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-red min-h-[120px]"
                                    style={{ direction: direction }}
                                    dir={direction}
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 bg-brand-red text-white text-sm font-medium rounded hover:bg-red-700"
                                    disabled={!newPostContent.trim()}
                                >
                                    Post
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostFeed;
