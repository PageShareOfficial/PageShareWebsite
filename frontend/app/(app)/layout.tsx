import { cookies } from 'next/headers';
import AppShellClient from '@/components/app/layout/AppShellClient';
import { hasSupabaseAuthCookie } from '@/lib/supabase/authCookie';

/**
 * Shared three-column shell for app routes (route group does not affect URLs).
 * Pages render only the middle column: headers, Topbar, and scrollable content.
 * The auth cookie picks the first-paint chrome so signed-out visitors never see the
 * signed-in sidebars, even before the client session loads.
 */
export default async function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialSignedIn = hasSupabaseAuthCookie(cookieStore.getAll().map(({ name }) => name));
  return <AppShellClient initialSignedIn={initialSignedIn}>{children}</AppShellClient>;
}
