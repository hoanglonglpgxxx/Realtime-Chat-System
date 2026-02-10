"use client";
import React, { useState } from "react";
// Import NavLink from react-router-dom to handle navigation links and active states
// import { NavLink } from 'react-router-dom';
import "../../public/styles/Navbar.css";
import Link from "next/link";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">{/* <NavLink href="/">MyBrand</NavLink> */}</div>
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
            <Link href="/dashboard" activeClassName="active-link">
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              activeClassName="active-link"
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              href="/chat"
              onClick={() => setIsOpen(false)}
              activeClassName="active-link"
            >
              Chat
            </Link>
          </li>
          <li>
            <Link
              href="/about"
              onClick={() => setIsOpen(false)}
              activeClassName="active-link"
            >
              About
            </Link>
          </li>
          <li>
            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              activeClassName="active-link"
            >
              Contact
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
