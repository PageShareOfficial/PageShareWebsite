import type { Metadata } from 'next';
import { ROUTES } from '@/constants/routes';

const EVENTS_TITLE = `Crypto Events & Conferences ${new Date().getFullYear()}`;
const EVENTS_DESCRIPTION =
  'Upcoming crypto, blockchain and Web3 conferences, summits, hackathons and meetups worldwide. ' +
  'See what is happening now and which events are free to attend.';

export const metadata: Metadata = {
  title: EVENTS_TITLE,
  description: EVENTS_DESCRIPTION,
  alternates: { canonical: ROUTES.events },
  openGraph: {
    title: EVENTS_TITLE,
    description: EVENTS_DESCRIPTION,
    url: ROUTES.events,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: EVENTS_TITLE,
    description: EVENTS_DESCRIPTION,
  },
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
