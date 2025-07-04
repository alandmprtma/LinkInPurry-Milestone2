import React from 'react';
import { createFileRoute, } from "@tanstack/react-router";
import { FaUserFriends } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import Post from './-components/post';
import Navbar from './-components/navbar';
import { getToken } from '../api/auth';
import CreatePost from './-components/createpost';
import { useSearch } from '@tanstack/react-router';
import { FaUserPlus, FaCheck, FaConciergeBell } from 'react-icons/fa';
import { useNavigate } from '@tanstack/react-router';


export const Route = createFileRoute("/feed")({
  component: Feed,
});

interface PostData {
  id: number;
  profile_photo_path: string; // URL gambar profil
  username: string; // Nama pengguna
  full_name: string;
  user_id: number;
  // workHistory: string; // Riwayat pekerjaan
  updated_at: string; // Waktu posting
  content: string; // Konten postingan
  is_editable?: boolean;
}

interface UserData {
  id: number;                  // ID pengguna
  username: string;            // Nama pengguna (username)
  full_name: string;           // Nama lengkap pengguna
  profile_photo_path: string;  // Path atau URL foto profil pengguna
  depth_connection: number;    // Kedalaman koneksi (depth) pengguna terhadap pengguna yang diminta
  is_requested: boolean;       // Status apakah pengguna sudah mengirim permintaan koneksi
  is_connected: boolean;       // Status apakah pengguna sudah terhubung (koneksi mutual)
  is_requesting: boolean;      // Status apakah pengguna sedang meminta koneksi
}

interface ProfileData {
  username: string;
  name: string;
  work_history: string;
  skills: string;
  profile_photo_path: string;
  connection_count: number;
  self?: boolean; // Untuk menandai apakah ini profil pengguna yang sedang login
}

function Feed() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<ProfileData>();
  const [userId, setUserId] = useState<number>();
  const navigate = useNavigate();

  const { postId }: { postId?: number } = useSearch({ from: Route.id }); // Ambil postId dari parameter URL


  const checkAuth = () => {
    const token = getToken();
    // Jika tidak ada token atau token invalid, arahkan ke halaman login
    if (!token) {
      navigate({ to: '/login' });
      return false; // Menghentikan eksekusi lebih lanjut
    }
    return true; // Token valid
  };


  useEffect(() => {
    if (postId) {
      const targetPost = document.getElementById(`post-${postId}`);
      if (targetPost) {
        targetPost.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [postId]);

  const fetchUsers = async () => {
    try {
      if (!checkAuth()) return;
      const token = getToken();
      const response = await fetch(
        'http://localhost:3000/api/connection-recommendation', // Endpoint API baru
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      // Pastikan data yang diterima sudah sesuai dengan tipe UserData
      if (data.success) {
        setUsers(data.body);  // Menggunakan data body yang mengandung array pengguna
        console.log(data.body);
        console.log(users);
      } else {
        console.error("Failed to fetch users:", data.message);
      }
    } catch (error) {
      navigate({ to: '/' });
      console.error('Error fetching recommended users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      if (!checkAuth()) return;
      const token = getToken();
      const response = await fetch('http://localhost:3000/api/feed', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, // Use the stored token
        },
      });
      const data = await response.json();
      setPosts(data.body); // Assuming the response contains posts in the `body` field
      console.log(posts);
      setLoading(false);
    } catch (error) {
      navigate({ to: '/' });
      console.error('Error fetching posts:', error);
      setLoading(false);
    }
  };

  // Fetch data hanya sekali saat komponen pertama kali dimuat
  useEffect(() => {
    checkAuth();

    const fetchProfile = async () => {
      try {
        const profileId = -1; // bisa disesuaikan sesuai kebutuhan
        const API_URL = "http://localhost:3000/api";
        const url = profileId ? `${API_URL}/profile?id=${profileId}` : `${API_URL}/profile`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        if (data.success) {
          setProfile(data.body);
        } else {
          console.error('Error fetching profile:', data.message);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    const fetchPosts = async () => {
      try {
        if (!checkAuth()) return;
        const token = getToken();
        const response = await fetch('http://localhost:3000/api/feed', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // Gunakan token yang sudah disimpan
          },
        });
        const data = await response.json();
        console.log(data.body);
        const fetchedPosts = data.body.map((post: PostData) => ({
          id: Number(post.id),
          profile_photo_path: post.profile_photo_path || '/default/profile.png', // Default fallback
          full_name: post.full_name,
          username: post.username,
          updated_at: post.updated_at,
          user_id: post.user_id,
          content: post.content,
          is_editable: post.is_editable,
        }));
        setPosts(fetchedPosts);
        setLoading(false);
      } catch (error) {
        navigate({ to: '/' });
        console.error('Error fetching posts:', error);
        setLoading(false);
      }
    };

    const fetchUserId = async () => {
      try {
        if (!checkAuth()) return;
        const token = getToken(); // Pastikan token diambil dengan benar
        const response = await fetch('http://localhost:3000/api/userId', {
          headers: {
            'Authorization': `Bearer ${token}`, // Sertakan token pada header Authorization
          },
        });
        const data = await response.json();
        setUserId(data.body.userId);

        // Periksa apakah berhasil mendapatkan userId
        if (data.success) {
          console.log('User ID:', data.body.userId);
          // Set userId di state atau lakukan aksi lainnya
        } else {
          console.error('Failed to retrieve user ID:', data.message);
        }
      } catch (error) {
        navigate({ to: '/' });
        console.error('Error fetching user ID:', error);
      }
    };

    const fetchUsers = async () => {
      try {
        if (!checkAuth()) return;
        const token = getToken();
        const response = await fetch(
          'http://localhost:3000/api/connection-recommendation', // Endpoint API baru
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();

        // Pastikan data yang diterima sudah sesuai dengan tipe UserData
        if (data.success) {
          setUsers(data.body);  // Menggunakan data body yang mengandung array pengguna
        } else {
          console.error("Failed to fetch users:", data.message);
        }
      } catch (error) {
        navigate({ to: '/login' });
        console.error('Error fetching recommended users:', error);
      } finally {
        setLoading(false);
      }
    };

    // Memanggil fetch untuk profile, posts, dan users hanya sekali saat komponen dimuat
    fetchProfile();
    fetchPosts();
    fetchUsers();
    fetchUserId();

  }, []);

  const filteredUsers = users.filter(
    (user) => user.is_requested || user.is_connected || user.is_requesting
  );
  

  const handleSendConnection = async (userId: number, fetchUsers: () => void) => {
    try {
      const token = getToken(); // Mendapatkan token autentikasi dari cookie

      await fetch('http://localhost:3000/api/connection-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Sertakan token di header
        },
        body: JSON.stringify({ userId }),
      });

      // Panggil ulang fetchUsers untuk memperbarui data pengguna
      fetchUsers();
      alert('Connection request sent successfully!');
    } catch (error) {
      navigate({ to: '/login' });
      console.error('Error sending connection request:', error);
      alert('Error sending connection request!');
    }
  };


  if (loading) {
    return <p className="text-center text-gray-500 mt-4">Loading...</p>;
  }

  return (
    <div className="h-screen w-screen overflow-y-scroll">
       <Navbar  inputString="home" onSearchChange={setSearch} />
    <div className="flex flex-col lg:flex-row justify-around items-center lg:items-start">
    <div className="w-[90%] lg:w-[20%] mt-5 h-fit mx-5 bg-white rounded-lg shadow-lg">
      {/* Header with Avatar */}
      <div className="relative bg-gray-200 p-6 text-center rounded-t-lg">
        <div className="absolute bottom-[-40px] left-1/2 transform -translate-x-1/2">
          <img
            src={profile?.profile_photo_path || '/default/profile.png'}
            alt="Profile Avatar"
            className="w-20 h-20 rounded-full border-4 border-white object-cover"
          />
        </div>
      </div>

          {/* Body */}
          <div className="pt-16 pb-6 text-center">
            {/* Name and Username as clickable links */}
            <a href={`/profile?id=${userId}`} className="block hover:underline  hover:decoration-black">
              <h3 className="text-xl font-bold text-gray-800">{profile?.name}</h3>
              <p className="text-gray-600">@{profile?.username}</p>
            </a>

            {/* Work History and Skills */}
            {profile?.work_history || profile?.skills ? (
              <div className="mt-4">
                <p className="text-gray-600">
                  <strong>Work History:</strong> {profile.work_history || 'Not provided'}
                </p>
                <p className="text-gray-600">
                  <strong>Skills:</strong> {profile.skills || 'Not provided'}
                </p>
              </div>
            ) : null}

            {/* Connection Count */}
          </div>

      {/* Footer */}
      <div className="bg-gray-100 text-center py-3 rounded-b-lg">
      <div className="flex items-center justify-between mx-[10px]">
        <div className="flex items-center space-x-2">
          <FaUserFriends className="text-gray-600" />
          <p className="text-gray-600 font-medium">Connections</p>
        </div>
        <p className="text-gray-600">{profile?.connection_count || '0'}</p>
      </div>
      </div>
    </div>
    <div className="w-[90%] lg:w-[45%] mt-5">
      <CreatePost onPostCreated={fetchPosts} id={userId? userId : -1} profileData={profile? profile : undefined}/>
      {posts.map((post) => (
        <Post key={post.id} post={post} onPostUpdated={fetchPosts} />
      ))}
    </div>
    <div className="bg-white w-[90%] lg:w-[25%] shadow-md rounded-lg mt-5 h-fit overflow-hidden">
  <div className="border-b border-gray-300 bg-gray-100">
    <h2 className="text-xl text-start font-bold py-2 px-4">
      Connection Recommendation
    </h2>
  </div>
  
  {/* Menampilkan daftar rekomendasi koneksi */}
  <ul className="divide-y divide-gray-200">
  {filteredUsers.length > 0 ? (
      <ul className="space-y-4">
        {filteredUsers.map((user) => (
          <React.Fragment key={user.id}>
            <li className="flex items-center justify-between p-4 mb-4 rounded-lg">
              <a href={`/profile?id=${user.id}`}>
                <div className="flex items-center space-x-4">
                  <img
                    src={user.profile_photo_path || '/default/profile.png'}
                    alt={`${user.username}'s profile`}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="text-lg font-medium text-left">{user.full_name}</p>
                    <p className="text-gray-500 text-left">@{user.username}</p>
                    {/* Menampilkan depth_connection */}
                    <p className="text-sm text-left text-gray-400">{`${user.depth_connection}nd`}</p>
                  </div>
                </div>
              </a>

              {/* Tombol Connect sesuai dengan status */}
              <button
                onClick={() => handleSendConnection(user.id, fetchUsers)}
                className="px-4 py-2 border border-[#0a66c2] bg-transparent rounded-[25px] hover:bg-blue-50 focus:outline-none flex items-center space-x-2 text-blue-500"
              >
                <FaUserPlus /> <span>Connect</span>
              </button>
            </li>
            {/* Garis pemisah */}
            {user !== filteredUsers[filteredUsers.length - 1] && (
              <hr className="border-t border-gray-300 w-[95%] m-0 mx-auto" />
            )}
          </React.Fragment>
        ))}
      </ul>
    ) : (
      <div className="flex flex-col items-center justify-center p-8">
      <img src='./cactus.png' className='w-[180px]'/>
      <p className="text-gray-500 text-center">No users available.</p>
    </div>
    )}
  </ul>

          {/* Tombol "View all recommendations" */}
          <div className="mt-4 flex justify-center">
            <a
              href="/users"
              className="inline-flex items-center px-4 py-[3px] mb-[7px] text-black font-medium rounded-lg hover:bg-gray-200 transition"
            >
              View all recommendations
              <span className="ml-2 text-lg">→</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};