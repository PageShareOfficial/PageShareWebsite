"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { FiUser, FiBookmark, FiSettings, FiLogOut, FiLayers, FiBell, FiStar } from "react-icons/fi";

interface ProfileDropdownProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: string;
  };
}

export function ProfileDropdown({ user }: ProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 hover:bg-white/5 px-3 py-2.5 rounded-lg transition-all duration-200 hover:scale-105"
      >
        {user.image ? (
          <img src={user.image} alt={user.name || ""} className="w-9 h-9 rounded-full border-2 border-white/20" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20">
            <FiUser size={18} />
          </div>
        )}
        <span className="hidden sm:block font-medium">{user.name || user.email}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-black border border-white/20 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-white/10 mb-2">
              <div className="font-medium">{user.name || user.email}</div>
              <div className="text-xs text-white/60 capitalize">{user.role.toLowerCase()}</div>
            </div>

            {/* Quick Links */}
            <Link
              href={`/author/${user.id}`}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setOpen(false)}
            >
              <FiUser size={18} />
              <span>My Profile</span>
            </Link>
            <Link
              href="/reading-list"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setOpen(false)}
            >
              <FiBookmark size={18} />
              <span>Reading List</span>
            </Link>
            <Link
              href="/collections"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setOpen(false)}
            >
              <FiLayers size={18} />
              <span>Collections</span>
            </Link>
            <Link
              href="/subscriptions"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setOpen(false)}
            >
              <FiBell size={18} />
              <span>Subscriptions</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setOpen(false)}
            >
              <FiSettings size={18} />
              <span>Settings</span>
            </Link>
            {user.role === "AUTHOR" && (
              <Link
                href="/writer/dashboard"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 transition-colors border-t border-white/10 mt-2 pt-2"
                onClick={() => setOpen(false)}
              >
                <FiStar size={18} />
                <span>Writer Dashboard</span>
              </Link>
            )}
            <div className="border-t border-white/10 my-2"></div>
            <button
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
            >
              <FiLogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

