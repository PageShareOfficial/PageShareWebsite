import FooterLinksContent from '@/components/app/layout/footer/FooterLinksContent';

export type FooterNavVariant = 'landing' | 'sidebar';

type FooterLinkListProps = {
  variant: 'sidebar';
};

export default function FooterLinkList({ variant }: FooterLinkListProps) {
  return (
    <nav
      className="flex flex-wrap gap-x-1 gap-y-1 text-[11px] leading-4 text-gray-500"
      aria-label="Site links"
    >
      <FooterLinksContent variant={variant} />
    </nav>
  );
}
