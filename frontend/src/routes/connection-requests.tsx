import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getToken } from "../api/auth";
import { FaUserPlus } from "react-icons/fa"; // Import ikon
import Navbar from "./-components/navbar";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/connection-requests")({
  component: PermintaanKoneksi,
});

interface ConnectionRequest {
  from_id: number;
  created_at: string;
  username: string;
  full_name: string;
}

function PermintaanKoneksi() {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = getToken();
        const response = await fetch(
          "http://localhost:3000/api/connection-requests",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (response.ok) {
          setRequests(data.body || []);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        navigate({ to: "/" });
        console.error("Error fetching connection requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const respondToRequest = async (fromId: number, action: string) => {
    try {
      const token = getToken();
      const tokenPayload = getTokenPayload();
      const toId = tokenPayload?.userId;

      if (!toId) {
        alert("User is not logged in.");
        return;
      }

      const response = await fetch(
        `http://localhost:3000/api/connection-requests/${fromId}/respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ toId, action }),
        }
      );

      if (response.ok) {
        setRequests((prevRequests) =>
          prevRequests.filter((req) => req.from_id !== fromId)
        );
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to respond to connection request");
      }
    } catch (error) {
      console.error("Error responding to connection request:", error);
    }
  };

  function getTokenPayload() {
    const token = getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload;
    } catch (error) {
      console.error("Invalid token:", error);
      return null;
    }
  }

  return (
    <div className="h-screen w-screen overflow-y-scroll">
      <Navbar inputString="connection-requests" onSearchChange={setSearch} />
      <div className="flex justify-center">
        {/* Wrapper Card */}
        <div className="w-11/12 sm:w-10/12 lg:w-1/2 bg-white shadow-lg rounded-lg mt-6 sm:mt-10 p-4 sm:p-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full mb-4 space-y-2 sm:space-y-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">
              Invitations
            </h1>
            <p className="text-blue-600 text-sm font-medium cursor-pointer">
              {requests.length} Invitations
            </p>
          </div>
          {/* Content Section */}
          {loading ? (
            <p className="text-center text-gray-500 mt-4">Loading...</p>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center mt-10 space-y-4">
              <img
                src="/cactus.png" // Ganti dengan URL atau path gambar kaktus
                alt="No Invitations"
                className="w-32 h-32"
              />
              <p className="text-gray-500 text-center">
                No invitations available at the moment
              </p>
            </div>
          ) : (
            <div className="mt-5 bg-white rounded-lg p-2 sm:p-4">
              {requests.map((request, index) => (
                <div key={request.from_id}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-4 space-y-2 sm:space-y-0">
                    <div>
                      <p className="font-bold text-left text-sm sm:text-base">
                        {request.full_name}
                      </p>
                      <p className="text-sm text-gray-600 text-left">
                        @{request.username}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <button
                        onClick={() =>
                          respondToRequest(request.from_id, "reject")
                        }
                        className="px-4 py-2 w-full sm:w-auto bg-transparent rounded-[25px] text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        Ignore
                      </button>
                      <button
                        onClick={() =>
                          respondToRequest(request.from_id, "accept")
                        }
                        className="px-4 py-2 w-full sm:w-auto border border-[#0a66c2] bg-transparent rounded-[25px] hover:bg-blue-50 focus:outline-none text-blue-500 flex items-center space-x-2"
                      >
                        <FaUserPlus />
                        <span className="hidden lg:block">Accept</span>
                      </button>
                    </div>
                  </div>
                  {index < requests.length - 1 && (
                    <hr className="border-gray-300" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PermintaanKoneksi;
