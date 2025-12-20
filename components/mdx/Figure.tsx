import Image from "next/image";

interface FigureProps {
  src: string;
  caption?: string;
  alt?: string;
}

export function Figure({ src, caption, alt }: FigureProps) {
  return (
    <figure className="my-8">
      <div className="relative aspect-video overflow-hidden border border-white/10">
        <Image src={src} alt={alt || caption || ""} fill className="object-cover" />
      </div>
      {caption && (
        <figcaption className="mt-4 text-sm text-white/60 text-center italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

