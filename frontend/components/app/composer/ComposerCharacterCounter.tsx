interface ComposerCharacterCounterProps {
  textLength: number;
  remainingChars: number;
  charPercentage: number;
  isOverLimit: boolean;
  sizeClassName?: string;
}

function remainingToneClass(remainingChars: number, isOverLimit: boolean): string {
  if (isOverLimit || remainingChars <= 10) return 'text-red-400';
  if (remainingChars <= 20) return 'text-yellow-400';
  if (remainingChars <= 30) return 'text-cyan-400';
  return 'text-white/20';
}

/** Circular remaining-character meter for post and comment composers. */
export default function ComposerCharacterCounter({
  textLength,
  remainingChars,
  charPercentage,
  isOverLimit,
  sizeClassName = 'w-8 h-8',
}: ComposerCharacterCounterProps) {
  if (textLength <= 0) return null;

  const tone = remainingToneClass(remainingChars, isOverLimit);
  const circumference = 2 * Math.PI * 15;

  return (
    <div className={`relative shrink-0 ${sizeClassName}`}>
      <svg className={`-rotate-90 transform ${sizeClassName}`} viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r="15"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          className="text-white/10"
        />
        <circle
          cx="18"
          cy="18"
          r="15"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={`${circumference * (1 - Math.min(charPercentage, 100) / 100)}`}
          className={`transition-all ${tone}`}
          strokeLinecap="round"
        />
      </svg>
      {remainingChars <= 30 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-[10px] font-semibold leading-none md:text-xs ${tone}`}>
            {remainingChars}
          </span>
        </div>
      ) : null}
    </div>
  );
}
