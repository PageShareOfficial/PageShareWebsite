'use client';

interface PostMediaProps {
  media: string[];
  onImageClick: (urls: string[], index: number) => void;
  className?: string;
}

export default function PostMedia({ media, onImageClick, className = '' }: PostMediaProps) {
  if (!media || media.length === 0) return null;

  return (
    <div className={`${className} rounded-xl overflow-hidden ${
      media.length === 1 ? 'max-w-full' :
      media.length === 2 ? 'grid grid-cols-2 gap-1' :
      media.length === 3 ? 'grid grid-cols-2 gap-1' :
      'grid grid-cols-2 gap-1'
    }`}>
      {media.map((url, index) => (
        <div 
          key={index} 
          className={`relative cursor-pointer ${
            media.length === 3 && index === 0 ? 'row-span-2' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onImageClick(media, index);
          }}
        >
          <img
            src={url}
            alt={`Media ${index + 1}`}
            className="w-full h-full object-cover"
            style={{ aspectRatio: media.length === 1 ? '16/9' : '1/1' }}
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}

