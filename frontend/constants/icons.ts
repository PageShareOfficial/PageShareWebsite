/**
 * Single entry point for every icon used in the app.
 * Components import icons from '@/constants/icons' instead of the icon libraries directly,
 * so swapping a library or an individual glyph only touches this file.
 * Names are kept identical to the source library so call sites need no renaming.
 */

export type { LucideIcon } from 'lucide-react';
export type { IconType } from 'react-icons';

// Lucide: navigation & layout
export {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Ellipsis,
  ExternalLink,
  House,
  List,
  Settings,
  X,
} from 'lucide-react';

// Lucide: status & feedback
export {
  BadgeCheck,
  Check,
  CircleAlert,
  CircleCheck,
  CircleX,
  Inbox,
  LoaderCircle,
  RefreshCw,
  SearchX,
  Sparkles,
  TriangleAlert,
  WifiOff,
} from 'lucide-react';

// Lucide: content actions
export {
  Bookmark,
  Camera,
  Heart,
  Link2,
  MessageCircle,
  Pencil,
  PencilLine,
  Plus,
  Repeat2,
  Search,
  Share2,
  Trash,
  Upload,
} from 'lucide-react';

// Lucide: users & account
export {
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Mail,
  Shield,
  ShieldCheck,
  User,
  UserMinus,
  UserPlus,
  UserRoundSearch,
  Users,
} from 'lucide-react';

// Lucide: markets, predictions & analytics
export {
  Calendar,
  CalendarClock,
  ChartColumn,
  ChartLine,
  Clock,
  FlaskConical,
  Globe,
  Package,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
// React Icons: Font Awesome
export { FaMedal, FaUserSlash, FaDiscord } from 'react-icons/fa';
export { FaFacebookF, FaInstagram, FaLinkedinIn, FaTelegram, FaYoutube, FaXTwitter } from 'react-icons/fa6';

// React Icons: Game Icons
export { GiBinoculars } from 'react-icons/gi';

// React Icons: Github Octicons
export { GoVerified } from 'react-icons/go';

// React Icons: Heroicons
export { HiOutlineEmojiHappy, HiOutlinePhotograph } from 'react-icons/hi';

// React Icons: Lucide (react-icons build)
export { LuChartCandlestick } from 'react-icons/lu';

// React Icons: Material Design
export { MdLeaderboard, MdOutlineWorkspacePremium, MdSpaceDashboard } from 'react-icons/md';

// React Icons: Remix Icon
export { RiBarChartLine, RiFileGifLine } from 'react-icons/ri';
