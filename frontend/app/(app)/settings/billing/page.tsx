import type { Metadata } from 'next';
import BillingPageContent from '@/components/app/settings/BillingPageContent';

export const metadata: Metadata = {
  title: 'Billing',
  description: 'Manage your PageShare subscription and billing',
  robots: { index: false, follow: false },
};

export default function BillingPage() {
  return <BillingPageContent />;
}
