import AppShellClient from '@/components/app/layout/AppShellClient';

/**
 * Shared three-column shell for signed-in app routes (route group does not affect URLs).
 * Pages render only the middle column: headers, Topbar, and scrollable content.
 */
export default function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShellClient>{children}</AppShellClient>;
}
