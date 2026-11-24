import LandingFooterSocial from '@/components/landing/LandingFooterSocial';
import FooterLinksContent from '@/components/app/layout/footer/FooterLinksContent';

export default function LandingFooterNav() {
  return (
    <nav className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-xs text-gray-500 sm:gap-x-3 sm:text-sm md:gap-x-4">
      <FooterLinksContent variant="landing" />
      <span className="hidden text-gray-600 sm:inline">|</span>
      <LandingFooterSocial />
    </nav>
  );
}
