import { type RefObject, useEffect, useState } from 'react';

export interface ScrollContainerRect {
  top: number;
  left: number;
  width: number;
}

interface ScrollPastAnchorState {
  isPastAnchor: boolean;
  containerRect: ScrollContainerRect;
}

const INITIAL_RECT: ScrollContainerRect = { top: 0, left: 0, width: 0 };

function getPinBottom(...pinEdgeRefs: RefObject<HTMLElement | null>[]): number {
  return pinEdgeRefs.reduce((maxBottom, ref) => {
    const bottom = ref.current?.getBoundingClientRect().bottom ?? 0;
    return Math.max(maxBottom, bottom);
  }, 0);
}

/** True when the anchor has scrolled above the sticky header edge (window scroll). */
export function useScrollPastAnchor(
  anchorRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  columnRef: RefObject<HTMLElement | null>,
  mobilePinRef: RefObject<HTMLElement | null>,
  desktopPinRef: RefObject<HTMLElement | null>,
): ScrollPastAnchorState {
  const [state, setState] = useState<ScrollPastAnchorState>({
    isPastAnchor: false,
    containerRect: INITIAL_RECT,
  });

  useEffect(() => {
    const anchor = anchorRef.current;
    const column = columnRef.current;

    if (!enabled || !anchor || !column) {
      setState({ isPastAnchor: false, containerRect: INITIAL_RECT });
      return;
    }

    const update = () => {
      const pinBottom = getPinBottom(mobilePinRef, desktopPinRef);
      const anchorBottom = anchor.getBoundingClientRect().bottom;
      const columnRect = column.getBoundingClientRect();

      setState({
        isPastAnchor: anchorBottom < pinBottom + 1,
        containerRect: {
          top: pinBottom,
          left: columnRect.left,
          width: columnRect.width,
        },
      });
    };

    update();
    window.addEventListener('scroll', update, { passive: true, capture: true });
    window.addEventListener('resize', update);

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(anchor);
    resizeObserver.observe(column);
    if (mobilePinRef.current) resizeObserver.observe(mobilePinRef.current);
    if (desktopPinRef.current) resizeObserver.observe(desktopPinRef.current);

    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
      resizeObserver.disconnect();
    };
  }, [enabled, anchorRef, columnRef, mobilePinRef, desktopPinRef]);

  return state;
}
