import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { register } from "../api/auth"; // Import fungsi register dari helper API

export const Route = createFileRoute("/register")({
  component: Register,
});

function Register() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State untuk menampilkan/mensembunyikan password
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State untuk menampilkan/mensembunyikan confirm password

  const validatePassword = (password: string): string | null => {
    const requirements = [
      {
        regex: /.{8,}/,
        message: "Password must be at least 8 characters long.",
      },
      {
        regex: /[A-Z]/,
        message: "Password must contain at least one uppercase letter.",
      },
      {
        regex: /[a-z]/,
        message: "Password must contain at least one lowercase letter.",
      },
      {
        regex: /[0-9]/,
        message: "Password must contain at least one number.",
      },
      {
        regex: /[^A-Za-z0-9]/,
        message: "Password must contain at least one special character.",
      },
    ];
  
    for (const req of requirements) {
      if (!req.regex.test(password)) {
        return req.message; // Return the first validation error message
      }
    }
  
    return null; // Return null if all validations pass
  };
  

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); // Reset error
    setSuccess(false); // Reset success state
  
    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
  
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
  
    try {
      const { body } = await register(username, name, email, password); // Panggil API
      setSuccess(true); // Tampilkan pesan sukses
      document.cookie = `token=${body.token}; path=/`; // Simpan token ke cookie
      window.location.href = "/login"; // Redirect ke halaman login
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to register. Please try again.");
      } else {
        setError("Failed to register. Please try again.");
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

      {/* Centering the register form */}
      <div className="flex justify-center min-h-screen items-center">
        {/* Card container */}
        <div className="w-[500px] p-8 bg-white rounded-lg shadow-lg">
          {/* Welcome Back Title */}
          <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6 rounded-md">
            Register
          </h1>

          {/* Error Message */}
          {error && <div className="mb-4 text-sm text-red-500">{error}</div>}

          {/* Success Message */}
          {success && (
            <div className="mb-4 text-sm text-green-500">
              Registration successful! Redirecting...
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 text-left"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 mt-1 text-sm bg-white text-gray-800 border border-gray-300 rounded-lg placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter your username"
                required
              />
            </div>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 text-left"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 mt-1 text-sm bg-white text-gray-800 border border-gray-300 rounded-lg placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter your full name"
                required
              />
            </div>
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
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            </div>


            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 text-left"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 mt-1 text-sm bg-white text-gray-800 border border-gray-300 rounded-lg placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 text-blue-600 bg-transparent border-none hover:underline focus:outline-none"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-blue-600 rounded-[20px] hover:bg-blue-700"
            >
              Sign Up
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-sm text-black">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Log in here
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
