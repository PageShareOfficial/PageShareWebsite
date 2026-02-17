'use client';

import Link from 'next/link';

export type AuthCtaVariant = 'sidebar' | 'mobile';

const SIGN_IN_HREF = '/';
const SIGN_UP_HREF = '/';

const baseSignIn =
  'font-semibold transition-colors text-center';
const baseSignUp =
  'font-semibold transition-colors text-center';

const variantClasses: Record<
  AuthCtaVariant,
  { signIn: string; signUp: string; wrapper: string }
> = {
  sidebar: {
    signIn: [
      baseSignIn,
      'w-full flex items-center justify-center px-4 py-3 rounded-xl',
      'bg-white text-black hover:bg-gray-100',
    ].join(' '),
    signUp: [
      baseSignUp,
      'w-full flex items-center justify-center px-4 py-3 rounded-xl',
      'border border-white/30 text-white hover:bg-white/10',
    ].join(' '),
    wrapper: 'flex flex-col gap-3 w-full min-w-0 items-center lg:items-stretch lg:px-4',
  },
  mobile: {
    signIn: [
      baseSignIn,
      'px-3 py-2 rounded-full text-sm text-white hover:bg-white/10',
    ].join(' '),
    signUp: [
      baseSignUp,
      'px-3 py-2 rounded-full text-sm bg-white text-black hover:bg-gray-100',
    ].join(' '),
    wrapper: 'flex items-center gap-2',
  },
};

type AuthCtaButtonsProps = {
  variant: AuthCtaVariant;
};

/**
 * Shared Sign in / Sign up links for unauthenticated layout (DRY).
 * Used in UnauthSidebar for both desktop sidebar and mobile top bar.
 */
export default function AuthCtaButtons({ variant }: AuthCtaButtonsProps) {
  const classes = variantClasses[variant];
  return (
    <div className={classes.wrapper}>
      <Link href={SIGN_IN_HREF} className={classes.signIn}>
        Sign in
      </Link>
      <Link href={SIGN_UP_HREF} className={classes.signUp}>
        Sign up
      </Link>
    </div>
  );
}
