import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTelegram,
  FaYoutube,
} from 'react-icons/fa6';
import type { IconType } from 'react-icons';

type SocialLink = {
  label: string;
  href: string;
  Icon: IconType;
};

const SOCIAL_LINKS: SocialLink[] = [
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61587705572199', Icon: FaFacebookF },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/pageshare-io/', Icon: FaLinkedinIn },
  { label: 'Instagram', href: 'https://www.instagram.com/pagesharehq/', Icon: FaInstagram },
  { label: 'YouTube', href: 'https://www.youtube.com/@PageShare-Crypto', Icon: FaYoutube },
  { label: 'Telegram', href: 'https://t.me/+akC9c_yKeGdlNDM1', Icon: FaTelegram },
];

const SOCIAL_ICON_CLASS =
  'inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-500 transition-colors hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50';

export default function LandingFooterSocial() {
  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      {SOCIAL_LINKS.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`PageShare on ${label}`}
          className={SOCIAL_ICON_CLASS}
        >
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
        </a>
      ))}
    </div>
  );
}
