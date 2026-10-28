import {
  HiOutlinePhotograph,
  HiOutlineEmojiHappy,
  RiFileGifLine,
  RiBarChartLine,
} from '@/constants/icons';
import { MEDIA_LIMITS_HINT } from '@/hooks/composer/useMediaUpload';

interface ComposerMediaToolbarProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImageClick: () => void;
  onGifClick: () => void;
  onEmojiClick: () => void;
  onPollClick: () => void;
  imageDisabled: boolean;
  gifDisabled: boolean;
  pollDisabled: boolean;
  iconClassName?: string;
  buttonClassName?: string;
}

const DEFAULT_BUTTON =
  'p-1.5 text-cyan-400 hover:bg-cyan-400/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:p-2';
const DEFAULT_ICON = 'h-4 w-4 sm:h-5 sm:w-5';

/** Image / GIF / emoji / poll action buttons shared by composers. */
export default function ComposerMediaToolbar({
  fileInputRef,
  onImageChange,
  onImageClick,
  onGifClick,
  onEmojiClick,
  onPollClick,
  imageDisabled,
  gifDisabled,
  pollDisabled,
  iconClassName = DEFAULT_ICON,
  buttonClassName = DEFAULT_BUTTON,
}: ComposerMediaToolbarProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={onImageChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={onImageClick}
        className={buttonClassName}
        aria-label="Upload image"
        disabled={imageDisabled}
        title={MEDIA_LIMITS_HINT}
      >
        <HiOutlinePhotograph className={iconClassName} />
      </button>
      <button
        type="button"
        onClick={onGifClick}
        className={buttonClassName}
        aria-label="Add GIF"
        disabled={gifDisabled}
        title="Add GIF"
      >
        <RiFileGifLine className={iconClassName} />
      </button>
      <button
        type="button"
        onClick={onEmojiClick}
        className={buttonClassName}
        aria-label="Add emoji"
        title="Add emoji"
      >
        <HiOutlineEmojiHappy className={iconClassName} />
      </button>
      <button
        type="button"
        onClick={onPollClick}
        className={buttonClassName}
        aria-label="Add poll"
        disabled={pollDisabled}
        title="Add poll"
      >
        <RiBarChartLine className={iconClassName} />
      </button>
    </div>
  );
}
