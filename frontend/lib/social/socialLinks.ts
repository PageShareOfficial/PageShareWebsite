import {
  FaDiscord,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTelegram,
  FaXTwitter,
  FaYoutube,
  type IconType,
} from '@/constants/icons';

export type SocialLink = {
  label: string;
  href: string;
  Icon: IconType;
};

export const PAGE_SHARE_SOCIAL_LINKS: SocialLink[] = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61587705572199',
    Icon: FaFacebookF,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/pageshare-io/',
    Icon: FaLinkedinIn,
  },
  { label: 'Instagram', href: 'https://www.instagram.com/pageshareio/', Icon: FaInstagram },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@PageShare-Crypto',
    Icon: FaYoutube,
  },
  { label: 'Telegram', href: 'https://t.me/+akC9c_yKeGdlNDM1', Icon: FaTelegram },
  { label: 'X', href: 'https://x.com/PageShareio', Icon: FaXTwitter },
  { label: 'Discord', href: 'https://discord.gg/jhwXvY9R6J', Icon: FaDiscord },
];
