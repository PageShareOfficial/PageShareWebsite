'use client';

import SavedAnalystCard from '@/components/app/predictions/saved-analysts/SavedAnalystCard';
import ScrollChevronButton from '@/components/app/predictions/saved-analysts/ScrollChevronButton';
import { useHorizontalCardScroll } from '@/hooks/predictions/useHorizontalCardScroll';
import type { SavedAnalyst } from '@/types/savedAnalyst';

const VISIBLE_CARD_COUNT = 3;
const CARD_GAP_PX = 12;

interface SavedAnalystsCarouselProps {
  analysts: SavedAnalyst[];
}

export default function SavedAnalystsCarousel({ analysts }: SavedAnalystsCarouselProps) {
  const { scrollRef, cardWidth, canScrollLeft, canScrollRight, scrollByOneCard } =
    useHorizontalCardScroll({
      visibleCardCount: VISIBLE_CARD_COUNT,
      cardGapPx: CARD_GAP_PX,
      itemCount: analysts.length,
    });

  return (
    <div className="flex items-center gap-2">
      <ScrollChevronButton
        direction="left"
        disabled={!canScrollLeft}
        onClick={() => scrollByOneCard('left')}
      />

      <div
        ref={scrollRef}
        className="saved-analysts-scrollbar min-w-0 flex-1 overflow-x-auto scroll-smooth snap-x snap-mandatory"
      >
        <div className="flex gap-3">
          {analysts.map((analyst) => (
            <SavedAnalystCard key={analyst.id} analyst={analyst} cardWidth={cardWidth} />
          ))}
        </div>
      </div>

      <ScrollChevronButton
        direction="right"
        disabled={!canScrollRight}
        onClick={() => scrollByOneCard('right')}
      />
    </div>
  );
}
