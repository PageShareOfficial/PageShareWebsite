'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LogOut, UserPlus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TopbarProps {
  onUpgradeLabs: () => void;
}

export default function Topbar({ onUpgradeLabs }: TopbarProps) {
  const router = useRouter();
  
  // Mock user data - in real implementation, get from session/auth context
  const currentUser = {
    displayName: 'John Doe',
    handle: 'johndoe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
  };

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    // TODO: Clear session/tokens
    router.push('/');
  };

  const handleAddAccount = () => {
    // TODO: Handle add account logic
    router.push('/');
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  return (
    <header className="md:hidden sticky top-0 z-40 bg-black border-b border-white/10">
      <div className="px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: Profile Image */}
          <div className="flex-shrink-0 relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center"
            >
              <Image
                src={currentUser.avatar}
                alt={currentUser.displayName}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full"
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute top-full left-0 mt-2 bg-black border border-white/10 rounded-xl shadow-lg overflow-hidden z-50 min-w-[200px]">
                <div className="px-4 py-3 border-b border-white/10">
                  <div className="font-semibold text-white text-sm">{currentUser.displayName}</div>
                  <div className="text-gray-400 text-xs">@{currentUser.handle}</div>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-gray-300" />
                  <span className="text-white text-sm">Logout</span>
                </button>
                <button
                  onClick={() => {
                    handleAddAccount();
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-t border-white/10"
                >
                  <UserPlus className="w-4 h-4 text-gray-300" />
                  <span className="text-white text-sm">Add another account</span>
                </button>
              </div>
            )}
          </div>

          {/* Center: App Logo */}
          <div className="flex-1 flex items-center justify-center">
            <Link href="/home" className="flex items-center">
              <Image
                src="/pageshare_final.png"
                alt="PageShare Logo"
                width={32}
                height={32}
                className="w-12 h-12 rounded"
              />
            </Link>
          </div>

          {/* Right: Upgrade Button */}
          <div className="flex-shrink-0">
            <button
              onClick={onUpgradeLabs}
              className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm"
            >
              Upgrade
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

