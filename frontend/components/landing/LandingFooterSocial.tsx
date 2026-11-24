import { PAGE_SHARE_SOCIAL_LINKS } from '@/lib/social/socialLinks';
import {
  getFooterSocialStyles,
  type FooterSocialDensity,
} from '@/lib/social/footerSocialStyles';

type LandingFooterSocialProps = {
  /** Tighter icons for app sidebar rails (LinkedIn-style). */
  compact?: boolean;
};

export default function LandingFooterSocial({ compact = false }: LandingFooterSocialProps) {
  const density: FooterSocialDensity = compact ? 'compact' : 'default';
  const styles = getFooterSocialStyles(density);

  return (
    <div className={`flex shrink-0 flex-wrap items-center ${styles.container}`}>
      {PAGE_SHARE_SOCIAL_LINKS.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`PageShare on ${label}`}
          className={styles.button}
        >
          <Icon className={styles.icon} aria-hidden />
        </a>
      ))}
    </div>
  );
}
