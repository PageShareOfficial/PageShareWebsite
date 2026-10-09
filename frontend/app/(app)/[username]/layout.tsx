import { notFound } from 'next/navigation';
import { isValidUsernameSegment } from '@/utils/core/routeUtils';

/**
 * Rejects segments that can never be an account (e.g. a mistyped /logo.jpg) on the server,
 * so they 404 instead of rendering the app shell for anyone.
 */
export default async function UsernameLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}>) {
  const { username } = await params;
  if (!isValidUsernameSegment(username)) {
    notFound();
  }
  return children;
}
