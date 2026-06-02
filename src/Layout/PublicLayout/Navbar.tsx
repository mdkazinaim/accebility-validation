import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/hooks/useRedux";
import { logOut } from "@/store/features/AuthSlice/authSlice";
import UserProfile from "@/common/UserProfile";
import NavItems from "./NavItems";
import { ThemeToggle } from "@/common/ThemeToggle";

import CommonWrapper from "@/common/CommonWrapper";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);

  const handleLogout = () => {
    dispatch(logOut());
    navigate("/login");
    setIsOpen(false);
  };

  return (
    <nav className="bg-primary-brand shadow-lg">
      <CommonWrapper className="px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-white text-2xl font-bold">
            accessibility-validation
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <NavItems />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Profile Dropdown */}
            <UserProfile />
          </div>

          {/* Mobile toggle */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-white focus:outline-none"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              )}
            </svg>
          </button>
        </div>
      </CommonWrapper>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden px-4 pb-4 space-y-4">
          <NavItems
            className="flex flex-col gap-2"
            classNameNC="block px-3 py-2 rounded-md hover:bg-website-color-lightGreen"
            classNameC="block px-3 py-2 rounded-md hover:bg-website-color-lightGreen"
          />

          <div className="flex items-center justify-between px-3 py-2 border-t border-white/10">
            <span className="text-white text-sm">Theme Mode</span>
            <ThemeToggle />
          </div>

          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-white rounded-md hover:bg-website-color-lightGray"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
