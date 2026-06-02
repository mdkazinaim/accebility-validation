import { useState, useRef, useEffect } from "react";
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/common/ThemeToggle";


import CommonWrapper from "@/common/CommonWrapper";

const Header = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-primary-background border-b border-border sticky top-0 z-30 flex items-center">
      <CommonWrapper className="flex items-center justify-between w-full px-6">
        {/* Left Side: Search */}
        <div className="relative w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-4 h-4 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search for products, orders..."
            className="w-full pl-10 pr-4 py-2 bg-light-background border border-border rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-primary-brand/10 transition-all text-primary-text placeholder:text-secondary-text"
          />
        </div>

        {/* Right Side: Actions & Profile */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="p-2 text-secondary-text hover:bg-light-background rounded-full relative transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-primary-background"></span>
          </button>

          <ThemeToggle />

          <div className="h-8 w-[1px] bg-border mx-2"></div>

          {/* User Profile Dropdown Container */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 p-1 rounded-lg hover:bg-light-background transition-all group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-primary-text leading-none">
                  John Doe
                </p>
                <p className="text-[10px] text-secondary-text uppercase mt-1 text-left">
                  Admin
                </p>
              </div>

              <div className="relative">
                <div className="w-10 h-10 bg-primary-brand rounded-full flex items-center justify-center text-white font-bold border-2 border-border group-hover:border-primary-brand transition-all">
                  JD
                </div>
                {/* Status Indicator */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-primary-background rounded-full"></div>
              </div>

              <ChevronDown
                className={`w-4 h-4 text-secondary-text transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Actual Dropdown Card */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-primary-background border border-border rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-border mb-1">
                  <p className="text-xs text-secondary-text uppercase font-bold tracking-wider">
                    Account
                  </p>
                </div>

                <Link
                  to="/admin/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-primary-text hover:bg-light-background transition-colors no-underline"
                >
                  <User className="w-4 h-4 text-secondary-text" />
                  Profile Details
                </Link>

                <Link
                  to="/admin/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-primary-text hover:bg-light-background transition-colors no-underline"
                >
                  <Settings className="w-4 h-4 text-secondary-text" />
                  Account Settings
                </Link>

                <div className="border-t border-border mt-2 pt-2">
                  <button
                    onClick={() => console.log("Logging out...")}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50/10 w-full text-left transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CommonWrapper>
    </header>
  );
};

export default Header;
