import LandingFooterSocial from '@/components/landing/LandingFooterSocial';
import FooterLinkList from '@/components/app/layout/footer/FooterLinkList';
import SidebarFooterLegal from '@/components/app/layout/footer/SidebarFooterLegal';

export default function SidebarSiteFooter() {
  return (
    <footer className="shrink-0 space-y-3 px-1 pt-1">
      <FooterLinkList variant="sidebar" />
      <LandingFooterSocial compact />
      <SidebarFooterLegal />
    </footer>
  );
}