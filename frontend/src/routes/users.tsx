import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { getToken } from '../api/auth';
import { FaUserPlus, FaCheck, FaConciergeBell } from 'react-icons/fa';
import Navbar from './-components/navbar';
import { UserData, sendConnectionRequest } from '../api/connections';

export const Route = createFileRoute('/users')({
  component: DaftarPengguna,
});

async function handleSendConnection(toId: number, setUsers: React.Dispatch<React.SetStateAction<UserData[]>>) {
  const response = await sendConnectionRequest(toId);

  if (response) {
    if (response.ok) {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === toId ? { ...user, is_requested: true } : user
        )
      );
      alert('Connection request sent');
    } else {
      const errorData = await response.json();
      alert(errorData.message || 'Failed to send connection request');
    }
  }
}

function DaftarPengguna() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const checkLoginStatus = () => {
    return document.cookie.split(';').some((item) => item.trim().startsWith('token='));
  };

  useEffect(() => {
    setIsLoggedIn(checkLoginStatus());
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = getToken();
        const response = await fetch(
          `http://localhost:3000/api/users?search=${search}`,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Jika membutuhkan autentikasi
            },
          }
        );
        const data = await response.json();
        setUsers(data.body || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [search]);

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
  };

  return (
    <div className="h-screen w-screen overflow-y-scroll">
      <Navbar inputString="daftar-pengguna" onSearchChange={handleSearchChange} />
      {loading ? (
        <p className="text-center text-gray-500 mt-4">Loading...</p>
      ) : (
        <div className="w-full lg:w-[75%] mx-auto mt-5 px-4 sm:px-6 md:px-8">
          {users.length === 0 ? (
            // Tampilkan gambar kaktus jika daftar pengguna kosong
            <div className="flex flex-col items-center justify-center mt-10">
              <img
                src="./cactus.png" // Ganti dengan path gambar kaktus yang sesuai
                alt="No users"
                className="w-32 h-32"
              />
              <p className="mt-4 text-gray-500 text-center text-sm sm:text-base">
                No users available at the moment
              </p>
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col sm:flex-row items-center justify-between p-4 mb-4 bg-white shadow rounded-lg space-y-4 sm:space-y-0 sm:space-x-4"
              >
                <a href={`/profile?id=${user.id}`} className="flex items-center flex-1">
                  <img
                    src={user.profile_photo_path}
                    alt={user.username}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full mr-4 object-cover"
                  />
                  <div>
                    <p className="font-bold text-left text-sm sm:text-base md:text-lg">
                      {user.full_name}
                    </p>
                    <p className="text-xs sm:text-sm text-left text-gray-600">@{user.username}</p>
                  </div>
                </a>

                {isLoggedIn && (
                  <div className="w-full sm:w-auto">
                    {user.is_connected ? (
                      <a
                        href={`/chat?id=${user.id}`}
                        className="block sm:inline-block px-4 py-2 w-full sm:w-auto text-center border border-[#0a66c2] bg-transparent rounded-[25px] hover:bg-blue-50 focus:outline-none flex items-center justify-center space-x-2 text-blue-500"
                      >
                        <span>Message</span>
                      </a>
                    ) : (
                      <button
                        onClick={() => handleSendConnection(user.id, setUsers)}
                        className={`sm:inline-block px-4 py-2 w-full sm:w-auto bg-white text-center border rounded-[25px] flex items-center justify-center space-x-2
                          ${
                            user.is_requested || user.is_requesting
                              ? 'bg-gray-300 text-black border-black cursor-not-allowed'
                              : 'border-[#0a66c2] text-blue-500 hover:bg-blue-50'
                          }`}
                        disabled={user.is_requested}
                      >
                        {user.is_requested ? (
                          <>
                            <FaCheck /> <span>Requested</span>
                          </>
                        ) : user.is_requesting ? (
                          <>
                            <FaConciergeBell /> <span>Requesting...</span>
                          </>
                        ) : (
                          <>
                            <FaUserPlus /> <span>Connect</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default DaftarPengguna;
