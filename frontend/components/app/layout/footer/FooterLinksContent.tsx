import Link from 'next/link';
import {
  SITE_FOOTER_LINKS,
  type SiteFooterLink,
} from '@/components/app/layout/footer/siteFooterLinks';
import type { FooterNavVariant } from '@/components/app/layout/footer/FooterLinkList';

function FooterSeparator({ variant }: { variant: FooterNavVariant }) {
  if (variant === 'landing') {
    return <span className="hidden text-gray-600 sm:inline">|</span>;
  }
  return (
    <span className="select-none text-gray-600" aria-hidden>
      ·
    </span>
  );
}

function FooterLinkItem({
  link,
  showSeparator,
  variant,
}: {
  link: SiteFooterLink;
  showSeparator: boolean;
  variant: FooterNavVariant;
}) {
  const linkClass =
    variant === 'landing'
      ? 'px-1 transition-colors hover:text-white'
      : 'hover:text-gray-300 hover:underline';

  return (
    <span className={variant === 'sidebar' ? 'inline-flex items-center gap-1' : 'contents'}>
      {showSeparator ? <FooterSeparator variant={variant} /> : null}
      <Link href={link.href} className={linkClass}>
        {link.label}
      </Link>
    </span>
  );
}

type FooterLinksContentProps = {
  variant: FooterNavVariant;
};

export default function FooterLinksContent({ variant }: FooterLinksContentProps) {
  return SITE_FOOTER_LINKS.map((link, index) => (
    <FooterLinkItem
      key={link.href}
      link={link}
      showSeparator={index > 0}
      variant={variant}
    />
  ));
}
