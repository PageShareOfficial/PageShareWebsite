import { HiX } from 'react-icons/hi';

interface MediaPreviewGridProps {
  previews: string[];
  onRemove: (index: number) => void;
  imageClassName?: string;
  containerClassName?: string;
}

export default function MediaPreviewGrid({
  previews,
  onRemove,
  imageClassName = 'w-full h-24 object-cover rounded-xl',
  containerClassName = 'mt-3 grid grid-cols-2 gap-2',
}: MediaPreviewGridProps) {
  if (previews.length === 0) {
    return null;
  }

  return (
    <div className={containerClassName}>
      {previews.map((preview, index) => (
        <div key={`${preview}-${index}`} className="relative group">
          <img src={preview} alt={`Preview ${index + 1}`} className={imageClassName} loading="lazy" />
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute top-1 right-1 sm:top-2 sm:right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            aria-label={`Remove image ${index + 1}`}
          >
            <HiX className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </button>
        </div>
      ))}
    </div>
  );
}
