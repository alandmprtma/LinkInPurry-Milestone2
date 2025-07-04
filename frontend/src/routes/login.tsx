import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { login } from "../api/auth"; // Import fungsi login dari helper API

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State untuk menampilkan/mensembunyikan password

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); // Reset error

    try {
      const { body } = await login(email, password); // Panggil API
      document.cookie = `token=${body.token}; path=/`; // Simpan token ke cookie
      alert("Login successful!");
      window.location.href = "/feed"; // Redirect ke halaman feed
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to login. Please try again.");
      } else {
        setError("Failed to login. Please try again.");
      }
    }
  };

  return (
    <div className="relative w-screen h-screen">
      {/* Logo in the top right corner */}
      <img
        src="./LinkInPurry-crop.png" // Logo URL
        alt="LinkedIn Logo"
        className="absolute top-4 right-4 h-10" // Positioning the logo in the top right corner
      />

      {/* Centering the login form */}
      <div className="flex justify-center min-h-screen items-center">
        {/* Card container */}
        <div className="w-[500px] p-8 bg-white rounded-lg shadow-lg">
          {/* Welcome Back Title */}
          <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6 rounded-md">
            Login
          </h1>

          {/* Error Message */}
          {error && <div className="mb-4 text-sm text-red-500">{error}</div>}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 text-left"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 mt-1 text-sm bg-white text-gray-800 border border-gray-300 rounded-lg placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 text-left"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 mt-1 text-sm bg-white text-gray-800 border border-gray-300 rounded-lg placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 text-blue-600 bg-transparent border-none hover:underline focus:outline-none"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-blue-600 rounded-[20px] hover:bg-blue-700"
            >
              Sign In
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center text-sm text-black">
            Don't have an account?{" "}
            <a href="/register" className="text-blue-600 hover:underline">
              Sign up here
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
