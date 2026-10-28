import { useEffect, useState } from 'react';

/** Matches Tailwind `sm` (640px). False until mounted. */
const SM_MIN_WIDTH_QUERY = '(min-width: 640px)';

export function useMinSmViewport(): boolean {
  const [isSmUp, setIsSmUp] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(SM_MIN_WIDTH_QUERY);
    const update = () => setIsSmUp(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return isSmUp;
}
