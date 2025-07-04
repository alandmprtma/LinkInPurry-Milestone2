import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { getToken } from '../api/auth';
import Navbar from './-components/navbar';

export const Route = createFileRoute('/connections')({
  component: Connections,
});

interface Connection {
  id: number;
  username: string;
  full_name: string;
  profile_photo_path: string;
}

function Connections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const token = getToken();
        const response = await fetch('http://localhost:3000/api/connections', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (response.ok) {
          setConnections(data.body || []);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error('Error fetching connections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, []);

  const handleUnconnect = async (userId: number) => {
    const confirmUnconnect = window.confirm('Are you sure you want to unconnect this user?');
    if (!confirmUnconnect) return;

    try {
      const token = getToken();
      const response = await fetch('http://localhost:3000/api/connections', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId1: getTokenPayload()?.userId, userId2: userId }),
      });

      if (response.ok) {
        alert('Connection removed successfully');
        setConnections(connections.filter((connection) => connection.id !== userId)); // Update UI
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to unconnect');
      }
    } catch (error) {
      console.error('Error unconnecting:', error);
    }
  };

  function getTokenPayload() {
    const token = getToken();
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  if (loading) {
    return <p className="text-center mt-4">Loading...</p>;
  }

  return (
    <div className="h-screen w-screen bg-gray-100 text-black">
      <Navbar inputString="connections" onSearchChange={setSearch} />
      <div className="container mx-auto px-4">
        <h2 className="text-center text-2xl font-bold mt-4">Connections</h2>
        {connections.length === 0 ? (
          <p className="text-center mt-4">No connections yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-5">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="flex flex-col items-center p-4 bg-white shadow rounded-lg hover:shadow-lg transition"
              >
                <img
                  src={connection.profile_photo_path || '/default/profile.png'}
                  alt={connection.username}
                  className="w-16 h-16 rounded-full mb-3"
                />
                <div className="text-center">
                  <p className="font-bold text-lg">{connection.full_name}</p>
                  <p className="text-sm text-gray-600">@{connection.username}</p>
                </div>
                <button
                  className="mt-4 px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600"
                  onClick={() => handleUnconnect(connection.id)}
                >
                  Unconnect
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Connections;
