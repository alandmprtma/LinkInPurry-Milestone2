import React, { useState } from 'react';
import { FaEllipsisH, FaEdit, FaTrashAlt } from 'react-icons/fa';
import { getToken } from '../../api/auth';

interface PostProps {
  post: {
    id: number;
    profile_photo_path: string; // Path gambar profil
    username: string; // Nama pengguna
    user_id: number; // ID pengguna
    full_name: string; // Nama lengkap
    updated_at: string; // Waktu posting
    content: string; // Konten postingan
    is_editable?: boolean;
  };
  onPostUpdated: () => void;
}

const Post: React.FC<PostProps> = ({ post, onPostUpdated }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(post.content);
  const MAX_CHARACTERS = 280; // Batas maksimal karakter

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  };

  const handleDropdownToggle = () => {
    setDropdownOpen((prev) => !prev);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDelete = async () => {
    const token = getToken();
    const response = await fetch('http://localhost:3000/api/feed', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: post.id }),
    });
    console.log(response);
    onPostUpdated();
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    if (newContent.length <= MAX_CHARACTERS) {
      setContent(newContent);
    }
  };

  const handleSave = async () => {
    const token = getToken();
    const response = await fetch('http://localhost:3000/api/feed', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: post.id, content }),
    });
    console.log(response);
    onPostUpdated();
    setIsEditing(false);
  };

  return (
    <div className="border border-gray-300 rounded-lg bg-white shadow-md p-5 mb-6">
      {/* Header */}
      <div className="flex items-center mb-5">
        <img
          src={post.profile_photo_path}
          alt={`${post.username}'s profile`}
          className="w-16 h-16 rounded-full mr-4 object-cover"
        />
        <div className="flex-1">
        <a href={`/profile?id=${post.user_id}`} className="hover:underline hover:text-black">
          <h3 className="text-lg font-semibold text-gray-800 text-left">{post.full_name}</h3>
          <p className="text-sm text-gray-500 text-left">@{post.username}</p>
        </a>
          <small className="text-xs text-gray-400 block text-left">{formatDate(post.updated_at)}</small>
        </div>
        {post.is_editable && (
          <div className="relative">
            <button
              className="text-gray-500 bg-white hover:text-gray-700 focus:outline-none"
              onClick={handleDropdownToggle}
            >
              <FaEllipsisH size={20} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg">
                <ul>
                  <li
                    onClick={handleEdit}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    <FaEdit className="inline mr-2" /> Edit
                  </li>
                  <li
                    onClick={handleDelete}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    <FaTrashAlt className="inline mr-2" /> Delete
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        {isEditing ? (
          <div>
            <textarea
              value={content}
              onChange={handleContentChange}
              rows={4}
              className="w-full p-2 border bg-white border-gray-300 rounded-md"
            />
            <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
              <span>{MAX_CHARACTERS - content.length} characters remaining</span>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-[25px] hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 text-justify leading-relaxed">{post.content}</p>
        )}
      </div>
    </div>
  );
};

export default Post;
