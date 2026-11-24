import LandingFooterNav from '@/components/app/layout/footer/LandingFooterNav';
import { SITE_FOOTER_DISCLAIMER } from '@/components/app/layout/footer/siteFooterLinks';

export default function LandingSiteFooter() {
  return (
    <footer className="relative z-10 mt-auto border-t border-white/10 bg-black">
      <div className="mx-auto max-w-[1800px] px-4 py-4 sm:px-6 sm:py-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <LandingFooterNav />
        <div className="mt-3 text-center sm:mt-4">
          <p className="px-4 text-[10px] leading-relaxed text-gray-500 sm:text-xs">
            {SITE_FOOTER_DISCLAIMER}
          </p>
        </div>
      </div>
    </footer>
  );
}
