'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Home, Search, FlaskConical, User } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const [activeNav, setActiveNav] = useState('Home');

  const navItems = [
    { name: 'Home', icon: Home, href: '/home' },
    { name: 'Discover', icon: Search, href: '/discover' },
    { name: 'Labs', icon: FlaskConical, href: '/labs' },
    { name: 'Profile', icon: User, href: '/profile' },
  ];

  return (
    <aside className="hidden md:flex flex-col h-screen sticky top-0 w-64 border-r border-gray-200 bg-white">
      {/* Logo Header */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/home" className="flex items-center space-x-3 mb-2">
          <Image
            src="/pageshare_final.png"
            alt="PageShare Logo"
            width={32}
            height={32}
            className="w-8 h-8 rounded"
          />
          <span className="text-xl font-bold text-gray-900">PageShare</span>
        </Link>
        <p className="text-xs text-gray-500 mt-1">
          Ideas → outcomes • AI tools • credibility
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.name;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setActiveNav(item.name)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Platform DNA Card */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Platform DNA</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <div>
              <span className="font-medium">Engagement</span> = discovery
            </div>
            <div>
              <span className="font-medium">Credibility</span> = influence
            </div>
            <div>
              <span className="font-medium">Labs</span> = experimentation
            </div>
          </div>
          <p className="text-[10px] text-gray-500 pt-2 border-t border-gray-200">
            Informational only. Not financial advice.
          </p>
        </div>
      </div>
    </aside>
  );
}

