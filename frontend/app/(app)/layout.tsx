import Sidebar from '@/components/app/layout/Sidebar';
import RightSidebar from '@/components/app/layout/RightSidebar';

/**
 * Shared three-column shell for signed-in app routes (route group does not affect URLs).
 * Pages render only the middle column: headers, Topbar, and scrollable content.
 */
export default function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-black">
      <div className="flex justify-center">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 max-w-[600px]">{children}</div>
        <RightSidebar />
      </div>
    </div>
  );
}
