const API_URL = "http://localhost:3000/api"; // URL backend Anda

// Fungsi untuk login
export async function login(email: string, password: string) {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier: email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to login");
    }

    return data;
}

// Fungsi untuk register (jika nanti diperlukan)
export async function register(username: string, fullname: string, email: string, password: string) {
    const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, fullname, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to register");
    }

    return data;
}

// Fungsi untuk mendapatkan token dari cookie
export function getToken() {
    const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="));
    return cookie ? cookie.split("=")[1] : null;
}

// Fungsi untuk memeriksa autentikasi
export async function isAuthenticated() {
    const token = getToken();
    return !!token; // True jika ada token
}

