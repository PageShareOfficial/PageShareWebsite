interface ComposerPremiumLimitBannerProps {
  visible: boolean;
  onUpgrade: () => void;
}

/** Shown when a free user types past the free content limit. */
export default function ComposerPremiumLimitBanner({
  visible,
  onUpgrade,
}: ComposerPremiumLimitBannerProps) {
  if (!visible) return null;

  return (
    <div className="mt-2 flex items-center justify-center">
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onUpgrade();
        }}
        className="rounded-full bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-blue-600"
      >
        Upgrade to Premium
      </button>
    </div>
  );
}
