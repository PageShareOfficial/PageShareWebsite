import { X } from '@/constants/icons';
import MediaPreviewGrid from '@/components/app/common/MediaPreviewGrid';

interface ComposerSelectedMediaProps {
  mediaPreviews: string[];
  selectedGif: string | null;
  onRemoveMedia: (index: number) => void;
  onClearGif: () => void;
  imageClassName?: string;
}

/** Image and GIF previews shown under the composer textarea. */
export default function ComposerSelectedMedia({
  mediaPreviews,
  selectedGif,
  onRemoveMedia,
  onClearGif,
  imageClassName = 'w-full h-24 object-cover rounded-xl sm:h-32',
}: ComposerSelectedMediaProps) {
  if (mediaPreviews.length === 0 && !selectedGif) return null;

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <MediaPreviewGrid
        previews={mediaPreviews}
        onRemove={onRemoveMedia}
        containerClassName="col-span-2 grid grid-cols-2 gap-2"
        imageClassName={imageClassName}
      />
      {selectedGif ? (
        <div className="relative group">
          <img
            src={selectedGif}
            alt="Selected GIF"
            className={imageClassName}
            loading="lazy"
          />
          <button
            type="button"
            onClick={onClearGif}
            className="absolute top-1 right-1 rounded-full bg-black/50 p-1 transition-colors hover:bg-black/70 sm:top-2 sm:right-2"
          >
            <X className="h-3 w-3 text-white sm:h-4 sm:w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
