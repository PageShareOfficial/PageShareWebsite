import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coming Soon',
  description: 'This page is coming soon. Check back later.',
  robots: { index: false, follow: false },
};

export default async function ComingSoonPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const pageName = page ? decodeURIComponent(page).replace(/-/g, ' ') : 'This page';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <Link href={ROUTES.landing} className="absolute top-6 left-6">
        <Image src="/pageshare_final.png" alt="PageShare" width={80} height={80} />
      </Link>
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-3xl sm:text-4xl font-bold">
          {pageName} is coming soon
        </h1>
        <p className="text-gray-400">
          We&apos;re working on it. Check back later.
        </p>
        <Link
          href={ROUTES.landing}
          className="inline-block px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
