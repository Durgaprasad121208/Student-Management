import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 shadow-xl border-b border-blue-200 rounded-b-2xl">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-full text-white font-bold">
            {/* Graduation Cap Icon */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M22 7.42l-10-4.19-10 4.19 10 4.18 10-4.18z" fill="#6366f1" />
              <path d="M6 10.6V16a2 2 0 002 2h8a2 2 0 002-2v-5.4" fill="#fff" />
              <path d="M6 10.6V16a2 2 0 002 2h8a2 2 0 002-2v-5.4" stroke="#6366f1" />
              <path d="M12 21v-7" stroke="#6366f1" />
            </svg>
          </span>
          <Link to="/" className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-blue-400 to-cyan-400 drop-shadow-md hover:from-indigo-600 hover:to-cyan-500 transition-colors">Student Management</Link>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-3">
          <Link to="/about" className="text-sm px-3 py-1 rounded-full text-gray-700 hover:text-indigo-700 hover:bg-indigo-100 transition-all font-medium">About</Link>

          {!user && (
            <>
              <Link to="/login" className="px-4 py-1.5 text-sm rounded-full text-white bg-gradient-to-r from-indigo-500 to-blue-400 hover:from-indigo-600 hover:to-blue-500 shadow font-medium transition-all">Login</Link>
              <Link to="/register" className="px-4 py-1.5 text-sm rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 text-white hover:from-blue-500 hover:to-cyan-500 shadow font-semibold transition-all">Register</Link>
            </>
          )}

          {/* User Info and Logout */}
          {user && (
            <>
              <div className="ml-3 flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-r from-indigo-200 to-cyan-100 text-indigo-700 rounded-full flex items-center justify-center font-bold uppercase shadow">
                  {user.name ? user.name[0] : '?'}
                </div>
                <span className="hidden md:block text-sm font-semibold text-gray-700">{user.name}</span>
                <LogoutButton handleLogout={handleLogout} />
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// Reusable Link Button
const NavLink = ({ label, to }) => (
  <Link to={to} className="text-sm px-4 py-1.5 rounded-full text-gray-700 hover:text-indigo-700 hover:bg-indigo-100 transition-all font-medium">
    {label}
  </Link>
);

// Logout Button
const LogoutButton = ({ handleLogout }) => (
  <button
    onClick={handleLogout}
    className="text-sm px-4 py-1.5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 shadow font-semibold transition-all"
  >
    Logout
  </button>
);
