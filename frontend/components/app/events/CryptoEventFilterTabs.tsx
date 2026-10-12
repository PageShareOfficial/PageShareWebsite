import { CRYPTO_EVENT_FILTERS, type CryptoEventFilter } from '@/utils/events/cryptoEventFilters';

interface CryptoEventFilterTabsProps {
  activeFilter: CryptoEventFilter;
  onChange: (filter: CryptoEventFilter) => void;
}

export default function CryptoEventFilterTabs({ activeFilter, onChange }: CryptoEventFilterTabsProps) {
  return (
    <div role="tablist" aria-label="Filter events" className="flex flex-wrap gap-2">
      {CRYPTO_EVENT_FILTERS.map(({ id, label }) => {
        const isActive = id === activeFilter;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'border-white bg-white text-black'
                : 'border-white/15 text-gray-300 hover:border-white/30 hover:text-white'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
