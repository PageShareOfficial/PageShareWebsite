'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Home, Search, FlaskConical, User, MoreHorizontal, LogOut, UserPlus, Pencil, List } from 'lucide-react';
import { MdOutlineWorkspacePremium } from 'react-icons/md';
import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import TweetComposer from './TweetComposer';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('Home');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isComposerModalOpen, setIsComposerModalOpen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  // Mock user data - in real implementation, get from session/auth context
  const currentUser = {
    displayName: 'John Doe',
    handle: 'johndoe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(event.target as Node)) {
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
    // TODO: Clear session/tokens
    router.push('/');
  };

  const handleAddAccount = () => {
    // TODO: Handle add account logic
    router.push('/');
  };

  const handleTweetSubmit = (text: string, media?: File[], gifUrl?: string, poll?: { options: string[]; duration: number }) => {
    // TODO: Submit tweet/post
    setIsComposerModalOpen(false);
  };

  // All nav items including watchlist for mobile and tablet
  const allNavItems = [
    { name: 'Home', icon: Home, href: '/home' },
    { name: 'Discover', icon: Search, href: '/discover' },
    { name: 'Labs', icon: FlaskConical, href: '/labs' },
    { name: 'Watchlist', icon: List, href: '/watchlist' },
    { name: 'Profile', icon: User, href: '/profile' },
    { name: 'Premium', icon: MdOutlineWorkspacePremium, href: '/plans' },
  ];

  // Desktop nav items (without watchlist since it's in right rail, but with Premium)
  const desktopNavItems = allNavItems.filter(item => item.name !== 'Watchlist');
  
  // Mobile nav items (with watchlist, but without Premium - Premium is only for desktop/tablet)
  const mobileNavItems = allNavItems.filter(item => item.name !== 'Premium');
  
  // Tablet nav items (without watchlist since it's a floating button, but with Premium)
  const tabletNavItems = allNavItems.filter(item => item.name !== 'Watchlist');

  // Determine active nav based on current pathname
  const getActiveNav = (href: string) => {
    return pathname === href || (href === '/home' && pathname === '/');
  };

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex flex-col h-screen sticky top-0 border-r border-white/10 bg-black transition-all duration-300 md:w-20 lg:w-[275px] flex-shrink-0 z-10">
        {/* Logo Header */}
        <div className="p-4 lg:pl-2 lg:pr-2 flex items-center justify-center lg:justify-start">
          <Link href="/home" className="flex items-center">
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
              return (
                <Link
                  key={item.name}
                  href={item.href}
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
              return (
                <Link
                  key={item.name}
                  href={item.href}
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
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-full flex items-center justify-center lg:justify-start lg:space-x-3 px-2 lg:px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <Image
              src={currentUser.avatar}
              alt={currentUser.displayName}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full flex-shrink-0"
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
          </button>

          {/* Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-full left-0 lg:left-4 lg:right-4 right-0 mb-2 bg-black border border-white/10 rounded-xl shadow-lg overflow-hidden z-50 min-w-[200px] lg:min-w-0">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-gray-300" />
                <span className="text-white text-sm">Logout</span>
              </button>
              <button
                onClick={handleAddAccount}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-t border-white/10"
              >
                <UserPlus className="w-4 h-4 text-gray-300" />
                <span className="text-white text-sm">Add another account</span>
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
          {mobileNavItems.map((item: typeof allNavItems[0]) => {
            const Icon = item.icon;
            const isActive = getActiveNav(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
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
      <button
        onClick={() => router.push('/watchlist')}
        className={`hidden md:flex lg:hidden fixed bottom-6 right-6 z-40 items-center space-x-2 px-4 py-3 bg-white text-black rounded-lg shadow-lg hover:bg-gray-100 transition-all duration-300 ${
          isScrolling ? 'opacity-30' : 'opacity-100'
        }`}
        aria-label="Watchlist"
      >
        <List className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium whitespace-nowrap">
          Watchlist
        </span>
      </button>
    </>
  );
}

