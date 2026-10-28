import { X } from '@/constants/icons';

interface ComposerPollEditorProps {
  pollOptions: string[];
  pollDuration: number;
  onClose: () => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onUpdateOption: (index: number, value: string) => void;
  onDurationChange: (days: number) => void;
}

/** Poll choices and duration controls for post and comment composers. */
export default function ComposerPollEditor({
  pollOptions,
  pollDuration,
  onClose,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
  onDurationChange,
}: ComposerPollEditorProps) {
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-white">Add poll</span>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-3 space-y-2">
        {pollOptions.map((option, index) => (
          <div key={index} className="flex items-center space-x-2">
            <input
              type="text"
              value={option}
              onChange={(event) => onUpdateOption(index, event.target.value)}
              placeholder={`Choice ${index + 1}`}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
              maxLength={25}
            />
            {pollOptions.length > 2 ? (
              <button
                type="button"
                onClick={() => onRemoveOption(index)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {pollOptions.length < 4 ? (
        <button
          type="button"
          onClick={onAddOption}
          className="text-sm text-cyan-400 hover:text-cyan-300"
        >
          Add option
        </button>
      ) : null}
      <div className="mt-3 border-t border-white/10 pt-3">
        <label className="mb-2 block text-sm text-gray-400">Poll duration</label>
        <select
          value={pollDuration}
          onChange={(event) => onDurationChange(Number(event.target.value))}
          className="cursor-pointer appearance-none rounded-lg border border-white/10 bg-black px-3 py-2 pr-10 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500 sm:text-base"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.75rem center',
            minWidth: '120px',
          }}
        >
          <option value={1}>1 day</option>
          <option value={3}>3 days</option>
          <option value={7}>7 days</option>
        </select>
      </div>
    </div>
  );
}
