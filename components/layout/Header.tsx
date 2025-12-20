"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import {
  FiSearch,
  FiMenu,
  FiX,
  FiBook,
  FiTrendingUp,
  FiStar,
  FiTag,
  FiUsers,
  FiBookmark,
  FiBell,
  FiSettings,
  FiZap,
} from "react-icons/fi";
import { ProfileDropdown } from "./ProfileDropdown";

export function Header() {
  const { data: session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-white/10 backdrop-blur-sm">
      {/* Top Bar - Additional Info */}
      <div className="border-b border-white/5 bg-white/2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10 text-xs text-white/60">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <FiTrendingUp size={14} />
                <span>12 Trending Stories</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <FiUsers size={14} />
                <span>2,847 Active Readers</span>
              </div>
              <div className="hidden lg:flex items-center gap-2">
                <FiBook size={14} />
                <span>156 New Posts This Week</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/about" className="hover:text-white transition-colors">
                About
              </Link>
              <Link href="/guidelines" className="hover:text-white transition-colors">
                Guidelines
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-white/10 blur-xl group-hover:bg-white/20 transition-all"></div>
              <div className="relative text-3xl font-serif font-bold text-white tracking-tight">
                PageShare
              </div>
            </div>
            <div className="hidden sm:block text-xs text-white/40 font-medium uppercase tracking-wider">
              Premium Editorial
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-all duration-200 group"
            >
              <FiZap size={16} className="group-hover:scale-110 transition-transform" />
              <span>Home</span>
            </Link>
            <Link
              href="/explore"
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-all duration-200 group"
            >
              <FiBook size={16} className="group-hover:scale-110 transition-transform" />
              <span>Explore</span>
            </Link>
            <Link
              href="/tags"
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-all duration-200 group"
            >
              <FiTag size={16} className="group-hover:scale-110 transition-transform" />
              <span>Tags</span>
            </Link>
            <Link
              href="/trending"
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-all duration-200 group"
            >
              <FiTrendingUp size={16} className="group-hover:scale-110 transition-transform" />
              <span>Trending</span>
            </Link>
            {session && (
              <>
                <Link
                  href="/write"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-all duration-200 group"
                >
                  <FiBook size={16} className="group-hover:scale-110 transition-transform" />
                  <span>Write</span>
                </Link>
                <Link
                  href="/writer/dashboard"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-all duration-200 group"
                >
                  <FiStar size={16} className="group-hover:scale-110 transition-transform" />
                  <span>Dashboard</span>
                </Link>
              </>
            )}
            <Link
              href="/subscriptions"
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-all duration-200 group"
            >
              <FiBell size={16} className="group-hover:scale-110 transition-transform" />
              <span>Subscriptions</span>
            </Link>
            {session?.user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-all duration-200 group border-l border-white/10 pl-4 ml-2"
              >
                <FiSettings size={16} className="group-hover:scale-110 transition-transform" />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              {searchOpen ? (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right">
                  <div className="relative">
                    <FiSearch
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Search articles, authors, tags..."
                      className="bg-white/5 border border-white/20 px-10 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 w-80 text-sm"
                      autoFocus
                      onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                    />
                  </div>
                  <button
                    onClick={() => setSearchOpen(false)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2.5 hover:bg-white/5 rounded-lg transition-all duration-200 hover:scale-110"
                  aria-label="Search"
                >
                  <FiSearch size={20} />
                </button>
              )}
            </div>

            {/* Notifications */}
            {session && (
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2.5 hover:bg-white/5 rounded-lg transition-all duration-200 hover:scale-110 relative"
                  aria-label="Notifications"
                >
                  <FiBell size={20} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full border-2 border-black"></span>
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-black border border-white/20 rounded-lg shadow-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-serif font-bold">Notifications</h3>
                      <button
                        onClick={() => setNotificationsOpen(false)}
                        className="text-white/60 hover:text-white"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 border border-white/10 rounded hover:bg-white/5 transition-colors">
                        <div className="font-medium mb-1">New story from Sarah Chen</div>
                        <div className="text-white/60 text-xs">2 hours ago</div>
                      </div>
                      <div className="p-3 border border-white/10 rounded hover:bg-white/5 transition-colors">
                        <div className="font-medium mb-1">Your post got 5 new likes</div>
                        <div className="text-white/60 text-xs">5 hours ago</div>
                      </div>
                      <div className="text-center pt-2">
                        <Link
                          href="/notifications"
                          className="text-sm text-white/60 hover:text-white transition-colors"
                        >
                          View all
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bookmarks Quick Access */}
            {session && (
              <Link
                href="/reading-list"
                className="p-2.5 hover:bg-white/5 rounded-lg transition-all duration-200 hover:scale-110 relative hidden sm:flex"
                aria-label="Reading List"
              >
                <FiBookmark size={20} />
              </Link>
            )}

            {/* Profile or Sign In */}
            {session ? (
              <ProfileDropdown user={session.user} />
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 border border-white/20 hover:border-white/40 transition-all duration-200 rounded-lg text-sm"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-white text-black hover:bg-white/90 transition-all duration-200 rounded-lg text-sm font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2.5 hover:bg-white/5 rounded-lg transition-all duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-black/95 backdrop-blur-sm">
          <nav className="px-4 py-4 space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <FiZap size={18} />
              <span>Home</span>
            </Link>
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <FiBook size={18} />
              <span>Explore</span>
            </Link>
            <Link
              href="/tags"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <FiTag size={18} />
              <span>Tags</span>
            </Link>
            <Link
              href="/trending"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <FiTrendingUp size={18} />
              <span>Trending</span>
            </Link>
            {session && (
              <>
                <Link
                  href="/write"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <FiBook size={18} />
                  <span>Write</span>
                </Link>
                <Link
                  href="/writer/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <FiStar size={18} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/reading-list"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <FiBookmark size={18} />
                  <span>Reading List</span>
                </Link>
              </>
            )}
            <Link
              href="/subscriptions"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <FiBell size={18} />
              <span>Subscriptions</span>
            </Link>
            {session?.user?.role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors border-t border-white/10 pt-3 mt-3"
              >
                <FiSettings size={18} />
                <span>Admin</span>
              </Link>
            )}
            <div className="border-t border-white/10 pt-3 mt-3 space-y-2">
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                About
              </Link>
              <Link
                href="/guidelines"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                Guidelines
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                Contact
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
