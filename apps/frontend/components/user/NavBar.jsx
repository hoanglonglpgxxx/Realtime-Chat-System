"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import "../../public/styles/Navbar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout, loading } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <Link href="/">Realtime Chat System</Link>
      </div>
      <button
        className="menu-toggle"
        onClick={toggleMenu}
        aria-label="Toggle navigation menu"
      >
        {isOpen ? "Close" : "Menu"}
      </button>
      <nav className={`navbar-links ${isOpen ? "active" : ""}`}>
        <ul>
          <li>
            <Link href="/dashboard" onClick={() => setIsOpen(false)}>
              Home
            </Link>
          </li>

          {isAuthenticated && (
            <>
              <li>
                <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/chat" onClick={() => setIsOpen(false)}>
                  Chat
                </Link>
              </li>
            </>
          )}

          {!isAuthenticated && !loading && (
            <>
              <li>
                <Link href="/about" onClick={() => setIsOpen(false)}>
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" onClick={() => setIsOpen(false)}>
                  Contact
                </Link>
              </li>
            </>
          )}
        </ul>

        {/* User section */}
        <div className="navbar-user">
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {user?.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-8 h-8 rounded-full border-2 border-white"
                  />
                )}
                <span className="text-sm font-medium text-white">
                  {user?.fullName || user?.username}
                </span>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
