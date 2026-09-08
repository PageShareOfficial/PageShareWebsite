import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollChevronButtonProps {
  direction: 'left' | 'right';
  disabled: boolean;
  onClick: () => void;
}

export default function ScrollChevronButton({
  direction,
  disabled,
  onClick,
}: ScrollChevronButtonProps) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
  const label =
    direction === 'left' ? 'Scroll saved analysts left' : 'Scroll saved analysts right';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/25"
    >
      <Icon className="h-5 w-5" strokeWidth={2.5} aria-hidden />
    </button>
  );
}
