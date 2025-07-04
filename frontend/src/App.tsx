import { createRouter, RouterProvider } from "@tanstack/react-router";
import "./App.css";
import { routeTree } from "./routeTree.gen";
import { getToken } from "./api/auth"; // Helper untuk autentikasi
import React from "react";

const router = createRouter({
  routeTree,
  context: {
    async beforeEnter({ route }: { route: { path: string } }) {
      if (route.path !== "/login" && !getToken()) {
        console.warn("Unauthorized access, redirecting to /login");
        return "/login";
      }
    },
  },
});

// Fungsi untuk mengambil VAPID Public Key dari backend
const fetchVAPIDPublicKey = async (): Promise<string> => {
  try {
    const response = await fetch("http://localhost:3000/api/vapid-public-key");
    if (!response.ok) {
      throw new Error("Failed to fetch VAPID public key");
    }
    const data = await response.json();
    return data.publicKey;
  } catch (error) {
    console.error("Error fetching VAPID public key:", error);
    return "";
  }
};

// Fungsi untuk mendaftarkan Push Notification
const subscribeToPushNotifications = async () => {
  const token = getToken();
  if (!token) {
    console.warn("User not logged in, skipping push subscription.");
    return;
  }

  try {
    if ("serviceWorker" in navigator) {
      // Daftarkan Service Worker
      const registration = await navigator.serviceWorker.register("/service-worker.js");
      console.log("Service Worker registered:", registration);

      // Ambil VAPID public key dari backend
      const publicKey = await fetchVAPIDPublicKey();

      // Daftarkan Push Manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Kirim subscription ke server
      const response = await fetch("http://localhost:3000/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(subscription),
      });

      if (response.ok) {
        console.log("Push subscription saved successfully.");
      } else {
        console.error("Failed to save push subscription.");
      }
    }
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
  }
};

// Konversi VAPID key dari base64 ke Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function App() {
  React.useEffect(() => {
    subscribeToPushNotifications();
  }, []);

  return <RouterProvider router={router} />;
}

export default App;
