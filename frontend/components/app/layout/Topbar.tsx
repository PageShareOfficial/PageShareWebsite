'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LogOut, Trash2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { useClickOutside } from '@/hooks/common/useClickOutside';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';
import { useCurrentUser } from '@/hooks/user/useCurrentUser';
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';
import { useOfflineOverlay } from '@/contexts/OfflineOverlayContext';

interface TopbarProps {
  onUpgradeLabs: () => void;
}

export default function Topbar({ onUpgradeLabs }: TopbarProps) {
  const { currentUser } = useCurrentUser();
  const { signOut } = useAuth();
  const isOnline = useOnlineStatus();
  const { setShowOfflineOverlay } = useOfflineOverlay();

  const handleUpgradeClick = () => {
    if (isOnline) onUpgradeLabs();
    else setShowOfflineOverlay(true);
  };

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    signOut();
  };

  // Close menu when clicking outside
  useClickOutside({
    ref: profileMenuRef,
    handler: () => setIsProfileMenuOpen(false),
    enabled: isProfileMenuOpen,
  });

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
              <AvatarWithFallback
                src={currentUser.avatar}
                alt={currentUser.displayName}
                size={32}
                className="w-8 h-8"
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute top-full left-0 mt-2 bg-black border border-white/10 rounded-xl shadow-lg overflow-hidden z-50 min-w-[200px]">
                <div className="px-4 py-3 border-b border-white/10">
                  <div className="font-semibold text-white text-sm">{currentUser.displayName}</div>
                  <div className="text-gray-400 text-xs">@{currentUser.handle}</div>
                </div>
                <Link
                  href="/settings?action=delete"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Delete account</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-t border-white/10"
                >
                  <LogOut className="w-4 h-4 text-gray-300" />
                  <span className="text-white text-sm">Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Center: App Logo */}
          <div className="flex-1 flex items-center justify-center">
            <Link href="/home" prefetch={true} className="flex items-center">
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
              type="button"
              onClick={handleUpgradeClick}
              disabled={!isOnline}
              title={!isOnline ? 'Connect to the internet to continue' : undefined}
              className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
            >
              Upgrade
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

