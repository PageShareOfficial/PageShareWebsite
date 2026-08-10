import { useEffect, useState } from 'react';

/** Matches Tailwind `md` (768px). False until mounted to avoid layout flash assumptions. */
const MD_MIN_WIDTH_QUERY = '(min-width: 768px)';

export function useMinMdViewport(): boolean {
  const [isMdUp, setIsMdUp] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(MD_MIN_WIDTH_QUERY);
    const update = () => setIsMdUp(media.matches);

    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return isMdUp;
}
