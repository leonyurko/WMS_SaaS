import { useState } from 'react';

const PostCard = ({ post, currentUser, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);

    const canEdit = currentUser.role === 'Admin' || currentUser.id === post.user_id;
    const canDelete = currentUser.role === 'Admin' || currentUser.id === post.user_id;

    const handleSave = () => {
        onUpdate(post.id, editContent);
        setIsEditing(false);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow mb-4 border border-gray-100">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                    <div className="font-semibold text-gray-900">{post.username}</div>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${post.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                        {post.role}
                    </span>
                    <span className="text-xs text-gray-500">
                        {new Date(post.created_at).toLocaleString()}
                    </span>
                </div>

                {(canEdit || canDelete) && (
                    <div className="flex space-x-2">
                        {canEdit && !isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-blue-500 hover:text-blue-700 text-sm"
                            >
                                <i className="fas fa-edit"></i>
                            </button>
                        )}
                        {canDelete && !isEditing && (
                            <button
                                onClick={() => onDelete(post.id)}
                                className="text-red-500 hover:text-red-700 text-sm"
                            >
                                <i className="fas fa-trash"></i>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {isEditing ? (
                <div className="mt-2">
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                        style={{ direction: post.direction || 'ltr' }}
                        dir={post.direction || 'ltr'}
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Save
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    className="text-gray-800 whitespace-pre-wrap mt-1"
                    style={{ direction: post.direction || 'ltr' }}
                    dir={post.direction || 'ltr'}
                >
                    {post.content}
                </div>
            )}
        </div>
    );
};

export default PostCard;
