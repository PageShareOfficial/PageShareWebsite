'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  UNAUTH_LOGO_SIZE_DESKTOP,
  UNAUTH_LOGO_SIZE_MOBILE,
} from '@/utils/core/layoutConstants';
import AuthCtaButtons from '@/components/app/layout/AuthCtaButtons';

/** Single source for logo asset; widths 200/275 from layoutConstants. */
const LOGO_SRC = '/pageshare_final.png';

const asideClasses = [
  'hidden md:flex flex-col h-screen sticky top-0 border-r border-white/10',
  'bg-black flex-shrink-0 z-10 w-[200px] lg:w-[275px]',
  'md:min-w-[200px] lg:min-w-[275px]',
].join(' ');

const headerClasses = [
  'md:hidden sticky top-0 z-20 bg-black/95 backdrop-blur-sm',
  'border-b border-white/10 flex items-center justify-between px-4 h-14 flex-shrink-0',
].join(' ');

/**
 * Sidebar for unauthenticated users (e.g. shared post view).
 * Shows app logo and Sign in / Sign up to convert visitors.
 * - Desktop & tablet: left sidebar with logo + buttons.
 * - Mobile: compact top bar with logo left, buttons right.
 */
export default function UnauthSidebar() {
  return (
    <div
      className={
        'flex flex-col md:flex-row flex-shrink-0 md:w-[200px] lg:w-[275px] md:min-w-0'
      }
    >
      <aside className={asideClasses} aria-label="Sign in or sign up">
        <div className="p-4 lg:pl-2 lg:pr-2 flex flex-col items-center lg:items-stretch gap-6 pt-8 min-w-0">
          <Link
            href="/"
            className="flex items-center justify-center lg:justify-start lg:px-6 shrink-0"
            aria-label="PageShare home"
          >
            <Image
              src={LOGO_SRC}
              alt="PageShare"
              width={UNAUTH_LOGO_SIZE_DESKTOP}
              height={UNAUTH_LOGO_SIZE_DESKTOP}
              className="w-12 h-12 rounded"
            />
          </Link>
          <AuthCtaButtons variant="sidebar" />
        </div>
      </aside>

      <header className={headerClasses} aria-label="Sign in or sign up">
        <Link href="/" className="flex items-center shrink-0" aria-label="PageShare home">
          <Image
            src={LOGO_SRC}
            alt="PageShare"
            width={UNAUTH_LOGO_SIZE_MOBILE}
            height={UNAUTH_LOGO_SIZE_MOBILE}
            className="w-10 h-10 rounded"
          />
        </Link>
        <AuthCtaButtons variant="mobile" />
      </header>
    </div>
  );
}
