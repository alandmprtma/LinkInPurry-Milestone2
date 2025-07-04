import React, { useState } from 'react';
import { getToken } from '../../api/auth';

interface ProfileData {
  username: string;
  name: string;
  work_history: string;
  skills: string;
  profile_photo_path: string;
  connection_count: number;
  self?: boolean; // Untuk menandai apakah ini profil pengguna yang sedang login
}

function CreatePost({ onPostCreated, id , profileData}: {onPostCreated: () => void; id : number;profileData?: ProfileData;}) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const MAX_CHARACTERS = 280; // Batas maksimum karakter

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;

    // Periksa apakah panjang karakter melebihi batas
    if (newContent.length <= MAX_CHARACTERS) {
      setContent(newContent);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch('http://localhost:3000/api/feed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        setContent('');
        onPostCreated(); // Refresh feed setelah posting berhasil
      } else {
        console.error('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  console.log("Lah iya",profileData?.profile_photo_path);

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-5">
      <div className="flex items-center space-x-4">
        {/* Foto Profil */}
        <a href={`/profile?id=${id}`} className="flex-shrink-0">
          <img
            src={profileData?.profile_photo_path || '/default/profile.png'}
            alt={'aaa'}
            className="w-14 h-14 rounded-full object-cover"
          />
        </a>

        {/* Form dan Textarea */}
        <form onSubmit={handleSubmit} className="flex-grow">
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Start a post, try writing with AI"
            className="w-full h-14 border border-gray-300 bg-white text-gray-700 placeholder:text-gray-600 rounded-lg p-2 focus:bg-gray-200 focus:outline-none"
          />
          {/* Tampilkan jumlah karakter tersisa */}
          <div className="text-right text-sm text-gray-500">
            {MAX_CHARACTERS - content.length} characters remaining
          </div>
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="bg-blue-600 w-[65%] text-white px-4 py-[3px] mt-2 rounded-[35px] hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreatePost;
