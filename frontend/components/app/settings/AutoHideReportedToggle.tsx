'use client';

interface AutoHideReportedToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

/** Toggle for auto-hiding content the user has reported. */
export default function AutoHideReportedToggle({
  enabled,
  onToggle,
}: AutoHideReportedToggleProps) {
  return (
    <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="mb-1 font-medium text-white">Auto-hide reported content</h3>
          <p className="text-sm text-gray-400">
            Automatically hide posts and comments you've reported from your feed
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? 'bg-cyan-500' : 'bg-gray-600'
          }`}
          role="switch"
          aria-checked={enabled}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
