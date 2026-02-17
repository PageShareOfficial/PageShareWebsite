'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { Home, Search, FlaskConical, User, MoreHorizontal, LogOut, Pencil, List, Bookmark, Settings, Trash2 } from 'lucide-react';
import { MdOutlineWorkspacePremium } from 'react-icons/md';
import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/user/useCurrentUser';
import { useAuth } from '@/contexts/AuthContext';
import { useClickOutside } from '@/hooks/common/useClickOutside';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';
import Skeleton from '@/components/app/common/Skeleton';

const TweetComposer = dynamic(() => import('../composer/TweetComposer'), { ssr: false });

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const { signOut, loading: authLoading } = useAuth();
  const [activeNav, setActiveNav] = useState('Home');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isComposerModalOpen, setIsComposerModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // Close menus when clicking outside
  useClickOutside({
    ref: desktopMenuRef,
    handler: () => setIsProfileMenuOpen(false),
    enabled: isProfileMenuOpen,
  });

  useClickOutside({
    ref: moreMenuRef,
    handler: () => setIsMoreMenuOpen(false),
    enabled: isMoreMenuOpen,
  });

  // Handle scroll for watchlist button fade
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const handleLogout = () => {
    signOut();
  };

  const handleTweetSubmit = (text: string, media?: File[], gifUrl?: string, poll?: { options: string[]; duration: number }) => {
    // TODO: Submit tweet/post
    setIsComposerModalOpen(false);
  };

  // All nav items including watchlist for mobile and tablet
  // Profile uses prefetch={false} to avoid compiling /[username] before login (prevents 401s)
  const profileHref = currentUser?.handle ? `/${currentUser.handle}` : '/home';
  const allNavItems = [
    { name: 'Home', icon: Home, href: '/home', prefetch: true },
    { name: 'Discover', icon: Search, href: '/discover', prefetch: true },
    { name: 'Labs', icon: FlaskConical, href: '/labs', prefetch: true },
    { name: 'Watchlist', icon: List, href: '/watchlist', prefetch: true },
    { name: 'Bookmarks', icon: Bookmark, href: '/bookmarks', prefetch: true },
    { name: 'Settings', icon: Settings, href: '/settings', prefetch: true },
    { name: 'Profile', icon: User, href: profileHref, prefetch: false },
    { name: 'Premium', icon: MdOutlineWorkspacePremium, href: '/plans', prefetch: true },
  ];

  // Desktop nav items (without watchlist since it's in right rail, but with Premium and Settings)
  const desktopNavItems = allNavItems.filter(item => item.name !== 'Watchlist');
  
  // Mobile nav items: Home, Discover, Labs, Watchlist, More, Profile (More will have dropdown with Settings and Bookmarks)
  const mobileNavItems = [
    { name: 'Home', icon: Home, href: '/home', prefetch: true },
    { name: 'Discover', icon: Search, href: '/discover', prefetch: true },
    { name: 'Labs', icon: FlaskConical, href: '/labs', prefetch: true },
    { name: 'Watchlist', icon: List, href: '/watchlist', prefetch: true },
    { name: 'More', icon: MoreHorizontal, href: '#', isMore: true, prefetch: true },
    { name: 'Profile', icon: User, href: profileHref, prefetch: false },
  ];
  
  // Tablet nav items (without watchlist since it's a floating button, but with Premium and Settings)
  const tabletNavItems = allNavItems.filter(item => item.name !== 'Watchlist');

  // Determine active nav based on current pathname
  const getActiveNav = (href: string) => {
    if (href === '#') return false;
    return pathname === href || (href === '/home' && pathname === '/');
  };

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex flex-col h-screen sticky top-0 border-r border-white/10 bg-black transition-all duration-300 md:w-20 lg:w-[275px] flex-shrink-0 z-10">
        {/* Logo Header */}
        <div className="p-4 lg:pl-2 lg:pr-2 flex items-center justify-center lg:justify-start">
          <Link href="/home" prefetch={true} className="flex items-center lg:px-6">
            <Image
              src="/pageshare_final.png"
              alt="PageShare Logo"
              width={48}
              height={48}
              className="w-12 h-12 rounded"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-1 lg:px-4 py-2 space-y-1" aria-label="Main navigation">
          {/* Tablet (md-lg): Show nav items without watchlist (watchlist is floating button) */}
          <div className="lg:hidden">
            {tabletNavItems.map((item: typeof allNavItems[0]) => {
              const Icon = item.icon;
              const isActive = getActiveNav(item.href);
              const isProfile = item.name === 'Profile';
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={item.prefetch !== false}
                  onMouseEnter={isProfile && profileHref !== '/home' ? () => router.prefetch(profileHref) : undefined}
                  onFocus={isProfile && profileHref !== '/home' ? () => router.prefetch(profileHref) : undefined}
                  onClick={() => setActiveNav(item.name)}
                  className={`flex items-center justify-center lg:justify-start lg:space-x-3 px-2 lg:px-4 py-3 rounded-xl transition-colors group ${
                    isActive
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                  title={item.name}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="hidden lg:inline">{item.name}</span>
                </Link>
              );
            })}
          </div>
          <div className="hidden lg:block">
            {desktopNavItems.map((item: typeof allNavItems[0]) => {
              const Icon = item.icon;
              const isActive = getActiveNav(item.href);
              const isProfile = item.name === 'Profile';
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={item.prefetch !== false}
                  onMouseEnter={isProfile && profileHref !== '/home' ? () => router.prefetch(profileHref) : undefined}
                  onFocus={isProfile && profileHref !== '/home' ? () => router.prefetch(profileHref) : undefined}
                  onClick={() => setActiveNav(item.name)}
                  className={`flex items-center justify-center lg:justify-start lg:space-x-3 px-2 lg:px-4 py-3 rounded-xl transition-colors group ${
                    isActive
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                  title={item.name}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="hidden lg:inline">{item.name}</span>
                </Link>
              );
            })}
          </div>
          
          {/* Post Button - Desktop & Tablet */}
          <button
            onClick={() => setIsComposerModalOpen(true)}
            className="w-full flex items-center justify-center lg:justify-start lg:space-x-3 px-2 lg:px-4 py-3 rounded-xl transition-colors group bg-white text-black font-semibold hover:bg-gray-100 mt-2"
            title="Post"
          >
            <Pencil className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:inline">Post</span>
          </button>
        </nav>

        {/* User Profile Section */}
        <div className="px-1 lg:px-4 py-4 border-t border-white/10 relative" ref={desktopMenuRef}>
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-full flex items-center justify-center lg:justify-start lg:space-x-3 px-2 lg:px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group"
          >
            {authLoading ? (
              <>
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 min-w-0 hidden lg:block space-y-2">
                  <Skeleton variant="text" width={120} height={14} className="rounded" />
                  <Skeleton variant="text" width={80} height={12} className="rounded" />
                </div>
              </>
            ) : (
              <>
                <AvatarWithFallback
                  src={currentUser.avatar}
                  alt={currentUser.displayName}
                  size={40}
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0 text-left hidden lg:block">
                  <div className="font-semibold text-white text-sm truncate">
                    {currentUser.displayName}
                  </div>
                  <div className="text-gray-400 text-xs truncate">
                    @{currentUser.handle}
                  </div>
                </div>
                <MoreHorizontal className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors flex-shrink-0 hidden lg:block" />
              </>
            )}
          </button>

          {/* Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-full left-0 lg:left-4 lg:right-4 right-0 mb-2 bg-black border border-white/10 rounded-xl shadow-lg overflow-hidden z-50 min-w-[200px] lg:min-w-0">
              <Link
                href="/settings?action=delete"
                onClick={() => setIsProfileMenuOpen(false)}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Delete account</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-t border-white/10"
              >
                <LogOut className="w-4 h-4 text-gray-300" />
                <span className="text-white text-sm">Logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Tweet Composer Modal - Desktop & Tablet */}
      {isComposerModalOpen && (
        <TweetComposer
          currentUser={currentUser}
          onSubmit={handleTweetSubmit}
          onClose={() => setIsComposerModalOpen(false)}
          isModal={true}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around h-16 max-w-full">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isMore ? false : getActiveNav(item.href);
            const isMore = (item as any).isMore;
            
            if (isMore) {
              return (
                <div key={item.name} className="relative flex-1 h-full" ref={moreMenuRef}>
                  <button
                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                    className={`flex flex-col items-center justify-center w-full h-full transition-colors min-w-0 ${
                      isMoreMenuOpen
                        ? 'text-white'
                        : 'text-gray-400'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1 flex-shrink-0" />
                    <span className="text-[10px] font-medium truncate px-1">{item.name}</span>
                  </button>
                  
                  {/* More Menu Dropdown */}
                  {isMoreMenuOpen && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black border border-white/10 rounded-xl shadow-lg overflow-hidden z-50 min-w-[150px]">
                      <Link
                        href="/bookmarks"
                        prefetch={true}
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setActiveNav('Bookmarks');
                        }}
                        className={`flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors ${
                          getActiveNav('/bookmarks') ? 'bg-white/10 text-white' : 'text-white'
                        }`}
                      >
                        <Bookmark className="w-4 h-4" />
                        <span className="text-sm">Bookmarks</span>
                      </Link>
                      <Link
                        href="/settings"
                        prefetch={true}
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setActiveNav('Settings');
                        }}
                        className={`flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors border-t border-white/10 ${
                          getActiveNav('/settings') ? 'bg-white/10 text-white' : 'text-white'
                        }`}
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm">Settings</span>
                      </Link>
                    </div>
                  )}
                </div>
              );
            }
            
            const isProfileNav = item.name === 'Profile';
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={(item as { prefetch?: boolean }).prefetch !== false}
                onMouseEnter={isProfileNav && profileHref !== '/home' ? () => router.prefetch(profileHref) : undefined}
                onFocus={isProfileNav && profileHref !== '/home' ? () => router.prefetch(profileHref) : undefined}
                onClick={() => setActiveNav(item.name)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors min-w-0 ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-400'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 mb-1 flex-shrink-0" />
                <span className="text-[10px] font-medium truncate px-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Tablet Floating Watchlist Button - Opens Watchlist Page */}
      <Link
        href="/watchlist"
        prefetch={true}
        className={`hidden md:flex lg:hidden fixed bottom-6 right-6 z-40 items-center space-x-2 px-4 py-3 bg-white text-black rounded-lg shadow-lg hover:bg-gray-100 transition-all duration-300 ${
          isScrolling ? 'opacity-30' : 'opacity-100'
        }`}
        aria-label="Watchlist"
      >
        <List className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium whitespace-nowrap">
          Watchlist
        </span>
      </Link>
    </>
  );
}

