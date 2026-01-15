/**
 * Share content using Web Share API or fallback to clipboard
 * @param data - The share data object
 * @returns Promise that resolves when sharing is complete
 */
export async function shareContent(data: {
  title?: string;
  text?: string;
  url: string;
}): Promise<boolean> {
  // Try Web Share API first (mobile-friendly)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
      });
      return true;
    } catch (error) {
      // User cancelled or error occurred, fall through to clipboard
      if ((error as Error).name === 'AbortError') {
        return false; // User cancelled
      }
    }
  }

  // Fallback: Copy to clipboard
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(data.url);
      return true;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
  }

  return false;
}

/**
 * Copy text to clipboard
 * @param text - The text to copy
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
  }
  return false;
}
