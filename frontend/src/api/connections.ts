import { getToken } from "./auth";
// Fungsi untuk mengirim permintaan koneksi

export interface UserData {
    id: number;
    username: string;
    full_name: string;
    profile_photo_path: string;
    is_requested?: boolean;
    is_requesting?: boolean;
    is_connected?: boolean;
  }

export const sendConnectionRequest = async (toId: number) => {
    try {
      const token = getToken(); // Mendapatkan token autentikasi dari cookie
  
      const response = await fetch('http://localhost:3000/api/connection-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Sertakan token di header
        },
        body: JSON.stringify({ toId }), // Hanya kirim toId, fromId akan diatur di backend
      });
  
      return response
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
};

export const getConnectionInfo = async (toId: number) => {
    try {
        const token = getToken(); // Mendapatkan token autentikasi dari cookie
        const response = await fetch(('http://localhost:3000/api/users/' + toId), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`, // Sertakan token di header
          }
        });
        const data = await response.json()
        if (response) {
            return data
        } else {
            throw new Error("Response was empty! user doesnt exist")
        }
        
      } catch (error) {
        console.error('Error getting userinfo:', error);
      }
}