import { useEffect, RefObject } from 'react';

interface UseClickOutsideOptions {
  ref: RefObject<HTMLElement>;
  handler: (event: MouseEvent) => void;
  enabled?: boolean;
  additionalRefs?: RefObject<HTMLElement>[];
}

/**
 * Hook to detect clicks outside of a referenced element
 * Useful for closing dropdowns, modals, menus, etc.
 * 
 * @param ref - Main element ref to detect clicks outside of
 * @param handler - Callback function when click outside is detected
 * @param enabled - Whether the hook is active (default: true)
 * @param additionalRefs - Additional refs to exclude from "outside" detection
 */
export function useClickOutside({
  ref,
  handler,
  enabled = true,
  additionalRefs = [],
}: UseClickOutsideOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is inside the main ref
      if (ref.current && ref.current.contains(event.target as Node)) {
        return;
      }

      // Check if click is inside any additional refs
      const isInsideAdditional = additionalRefs.some(
        (additionalRef) => additionalRef.current && additionalRef.current.contains(event.target as Node)
      );

      if (isInsideAdditional) {
        return;
      }

      // Click is outside all refs, call handler
      handler(event);
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, handler, enabled, additionalRefs]);
}
