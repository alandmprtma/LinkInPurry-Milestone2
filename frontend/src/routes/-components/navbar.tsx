import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { FaHome, FaSignInAlt, FaUserPlus, FaSuitcase, FaSignOutAlt, FaUserFriends, FaUsers, FaBars, FaTimes } from 'react-icons/fa';

interface NavbarProps {
  inputString: string; // Menerima input string dari parent component
  onSearchChange: (searchTerm: string) => void; // Fungsi untuk menangani perubahan pencarian
}

const Navbar: React.FC<NavbarProps> = ({ inputString, onSearchChange }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State untuk mengatur toggle menu
  const navigate = useNavigate();

  const checkLoginStatus = () => {
    return document.cookie.split(";").some((item) => item.trim().startsWith("token="));
  };

  const handleSearchInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchKeyword(value);
    onSearchChange(value);
  };

  useEffect(() => {
    setIsLoggedIn(checkLoginStatus());
  }, []);

  const handleLogout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    setIsLoggedIn(false);
    navigate({ to: "/" });
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="sticky top-0 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-300 z-10">
      {/* Logo and Search Bar Container */}
      <div className="flex items-center space-x-4 w-full lg:w-auto">
        {/* Logo */}
        <img className="h-12" src="/LinkInPurry-crop.png" alt="Logo" />

        {/* Search Bar */}
        {inputString === 'daftar-pengguna' && (
          <form method="GET" action="/search" className="relative flex-grow">
            <div className="flex items-center border rounded-md bg-[#edf3f8] shadow-sm transition-all duration-300 ease-in-out focus-within:w-[200px] w-[150px] md:w-[225px] md:focus-within:w-[290px] lg:w-[300px] lg:focus-within:w-[450px] focus-within:ring-1 focus-within:ring-gray-800 focus-within:border-gray-800">
              <div className="px-3">
                <img
                  className="w-5 h-5"
                  src="./search-icon-removebg-preview-mirror.png"
                  alt="Search Icon"
                />
              </div>
              <input
                type="text"
                name="search_keyword"
                value={searchKeyword}
                onChange={handleSearchInput}
                placeholder="Search by position or company"
                className="flex-1 px-2 py-2 outline-none bg-[#edf3f8] w-[100px] rounded-md text-gray-700 placeholder-gray-400"
              />
            </div>
          </form>
        )}
      </div>

      {/* Hamburger Icon */}
      <div  className="bg-transparent border-none focus:outline-none lg:hidden text-black outline-none p-2 rounded">
        <button onClick={toggleMenu} className='bg-white focus:outline-none outline-none border-0 hover:text-gray-700'>
          {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      {/* Navigation Links (Desktop and Mobile) */}
      <div className={`lg:flex lg:items-center space-x-10 ${isMenuOpen ? 'block absolute top-full left-0 w-full bg-white border-t border-gray-300 shadow-lg' : 'hidden'} lg:block`}>
        <ul className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-10 py-4 lg:py-0">
          {isLoggedIn ? (
            <>
              <li>
                <a
                  className={`flex flex-col items-center font-medium ${
                    inputString === 'home' ? 'text-black hover:text-black' : 'text-gray-600 hover:text-black'
                  }`}
                  href="/feed"
                >
                  <FaHome /> Home
                </a>
              </li>
              <li>
                <a
                  className={`flex flex-col items-center font-medium ${
                    inputString === 'daftar-pengguna' ? 'text-black hover:text-black' : 'text-gray-600 hover:text-black'
                  }`}
                  href="/users"
                >
                  <FaUsers /> Daftar Pengguna
                </a>
              </li>
              <li>
                <a
                  className={`flex flex-col items-center font-medium ${
                    inputString === 'connection-requests' ? 'text-black hover:text-black' : 'text-gray-600 hover:text-black'
                  }`}
                  href="/connection-requests"
                >
                  <FaUserFriends /> Connection Requests
                </a>
              </li>
              <li>
                <a
                  className={`flex flex-col items-center font-medium ${
                    inputString === 'connections' ? 'text-black hover:text-black' : 'text-gray-600 hover:text-black'
                  }`}
                  href="/connections"
                >
                  <FaSuitcase /> Connections
                </a>
              </li>
              <li onClick={handleLogout}>
                <a className="flex flex-col items-center text-gray-600 hover:text-black font-medium">
                  <FaSignOutAlt /> Log Out
                </a>
              </li>
            </>
          ) : (
            <>
              <li>
                <a
                  className={`flex flex-col items-center font-medium ${
                    inputString === 'home' || inputString === 'daftar-pengguna' ? 'text-black' : 'text-gray-600 hover:text-black'
                  }`}
                  href="/feed"
                >
                  <FaHome /> Home
                </a>
              </li>
              <li>
                <a
                  className="flex flex-col items-center text-gray-600 hover:text-black font-medium"
                  href="/register"
                >
                  <FaUserPlus /> Register
                </a>
              </li>
              <li>
                <a
                  className="flex flex-col items-center text-gray-600 hover:text-black font-medium"
                  href="/"
                >
                  <FaSignInAlt /> Log In
                </a>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
