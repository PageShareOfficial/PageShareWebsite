interface UseCharacterCounterProps {
  maxLength: number;
  text: string;
}

interface UseCharacterCounterResult {
  remainingChars: number;
  isOverLimit: boolean;
  charPercentage: number;
}

/**
 * Hook to calculate character count and limit validation
 * Returns remaining characters, over-limit status, and percentage used
 */
export function useCharacterCounter({
  maxLength,
  text,
}: UseCharacterCounterProps): UseCharacterCounterResult {
  const remainingChars = maxLength - text.length;
  const isOverLimit = text.length > maxLength;
  const charPercentage = (text.length / maxLength) * 100;

  return {
    remainingChars,
    isOverLimit,
    charPercentage,
  };
}

