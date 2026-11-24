import LandingSiteFooter from '@/components/app/layout/footer/LandingSiteFooter';
import SidebarSiteFooter from '@/components/app/layout/footer/SidebarSiteFooter';

export type SiteFooterLayout = 'landing' | 'sidebar';

type SiteFooterProps = {
  layout: SiteFooterLayout;
};

export default function SiteFooter({ layout }: SiteFooterProps) {
  if (layout === 'landing') {
    return <LandingSiteFooter />;
  }
  return <SidebarSiteFooter />;
}