'use client';

export interface AdminFilterOption<V extends string> {
  value: V;
  label: string;
}

interface AdminFilterChipsProps<V extends string> {
  options: AdminFilterOption<V>[];
  value: V;
  onChange: (value: V) => void;
  ariaLabel: string;
}

export default function AdminFilterChips<V extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: AdminFilterChipsProps<V>) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              isActive
                ? 'border-violet-400/60 bg-violet-500/15 text-violet-200'
                : 'border-white/10 text-gray-300 hover:bg-white/5'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
