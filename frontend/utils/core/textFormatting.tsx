import React from 'react';

/**
 * Parses text and highlights cashtags (words starting with $)
 * Cashtags end at: space, newline, or end of string
 * @param text - The text content to parse
 * @param interactive - If true, adds hover effects and cursor pointer (default: true)
 * @returns Array of React elements with cashtags highlighted
 */
export function parseCashtags(text: string, interactive: boolean = true): (string | React.ReactElement)[] {
  if (!text) return [];

  // Regex to match cashtags: $ followed by alphanumeric characters (and underscores)
  // Cashtags end at: space, newline, or end of string (using positive lookahead)
  const cashtagRegex = /\$[A-Za-z0-9_]+(?=\s|$|\n)/g;
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = cashtagRegex.exec(text)) !== null) {
    // Add text before the cashtag
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add the highlighted cashtag
    const cashtag = match[0];
    const className = interactive 
      ? "text-cyan-400 font-medium hover:underline cursor-pointer"
      : "text-cyan-400 font-medium";
    
    parts.push(
      <span key={match.index} className={className}>
        {cashtag}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last cashtag
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no cashtags were found, return the original text
  return parts.length > 0 ? parts : [text];
}

/**
 * Get initials from a name (first letter of each word, up to 2 characters)
 * @param name - The name to extract initials from
 * @returns String with initials (e.g., "John Doe" -> "JD", "John" -> "J")
 */
export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) return '';
  
  const words = name.trim().split(/\s+/);
  if (words.length === 0) return '';
  
  // Get first letter of each word, up to 2 words
  const initials = words
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
  
  return initials;
}
