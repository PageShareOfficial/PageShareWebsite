import { ROUTES, comingSoonPath } from '@/constants/routes';

export type SiteFooterLink = {
  href: string;
  label: string;
};

export const SITE_FOOTER_LINKS: SiteFooterLink[] = [
  { href: ROUTES.about, label: 'About' },
  { href: comingSoonPath('Help-Center'), label: 'Help Center' },
  { href: ROUTES.terms, label: 'Terms of Service' },
  { href: ROUTES.privacy, label: 'Privacy Policy' },
  { href: ROUTES.cookies, label: 'Cookie Policy' },
  { href: comingSoonPath('Accessibility'), label: 'Accessibility' },
  { href: ROUTES.disclaimer, label: 'Disclaimer' },
  { href: comingSoonPath('Blog'), label: 'Blog' },
  { href: comingSoonPath('Careers'), label: 'Careers' },
  { href: comingSoonPath('Brand-Resources'), label: 'Brand Resources' },
  { href: comingSoonPath('API'), label: 'API' },
  { href: comingSoonPath('Contact'), label: 'Contact' },
];

export const SITE_FOOTER_DISCLAIMER =
  '© 2025 PageShare is not a securities broker-dealer, investment adviser, or any other type of financial professional. No content on the PageShare platform should be considered an offer, solicitation of an offer, or advice to buy or sell securities or any other type of investment or financial product. By using the PageShare platform, you understand and agree that PageShare does not provide investment advice, recommend any security, transaction, or order, issue securities, produce or provide research.';

export const SITE_FOOTER_INVESTMENT_NOTE = 'Not investment advice';

export function formatPageShareCopyright(year: number = new Date().getFullYear()): string {
  return `PageShare © ${year}`;
}
