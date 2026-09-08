import { useCallback, useEffect, useRef, useState } from 'react';

interface UseHorizontalCardScrollOptions {
  visibleCardCount: number;
  cardGapPx: number;
  itemCount: number;
}

export function useHorizontalCardScroll({
  visibleCardCount,
  cardGapPx,
  itemCount,
}: UseHorizontalCardScrollOptions) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const gaps = cardGapPx * (visibleCardCount - 1);
    const nextCardWidth = (container.clientWidth - gaps) / visibleCardCount;
    setCardWidth(nextCardWidth);
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft + container.clientWidth < container.scrollWidth - 1
    );
  }, [cardGapPx, visibleCardCount]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    updateScrollState();

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(container);
    container.addEventListener('scroll', updateScrollState, { passive: true });

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('scroll', updateScrollState);
    };
  }, [itemCount, updateScrollState]);

  const scrollByOneCard = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container || cardWidth <= 0) return;

    const offset = direction === 'left' ? -(cardWidth + cardGapPx) : cardWidth + cardGapPx;
    container.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return {
    scrollRef,
    cardWidth,
    canScrollLeft,
    canScrollRight,
    scrollByOneCard,
  };
}
