import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import {
  SITE_FOOTER_INVESTMENT_NOTE,
  formatPageShareCopyright,
} from '@/components/app/layout/footer/siteFooterLinks';

export default function SidebarFooterLegal() {
  return (
    <p className="text-[11px] leading-4 text-gray-600">
      <span>{formatPageShareCopyright()}</span>
      {' · '}
      <Link href={ROUTES.disclaimer} className="hover:text-gray-400 hover:underline">
        {SITE_FOOTER_INVESTMENT_NOTE}
      </Link>
    </p>
  );
}
