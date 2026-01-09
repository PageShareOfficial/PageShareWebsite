import { useState, useRef, useEffect } from 'react';

interface UseEmojiPickerResult {
  showEmojiPicker: boolean;
  emojiPickerRef: React.RefObject<HTMLDivElement>;
  setShowEmojiPicker: (show: boolean) => void;
  handleEmojiClick: (emoji: string, textareaRef: React.RefObject<HTMLTextAreaElement>) => void;
}

/**
 * Hook to manage emoji picker state and interactions
 * Handles click-outside-to-close and emoji insertion
 */
export function useEmojiPicker(): UseEmojiPickerResult {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleEmojiClick = (
    emoji: string,
    textareaRef: React.RefObject<HTMLTextAreaElement>
  ) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const newText = text.substring(0, start) + emoji + text.substring(end);
      
      // Update textarea value
      textarea.value = newText;
      
      // Set cursor position after emoji
      const newCursorPos = start + emoji.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      
      // Trigger input event to update React state
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);
    }
    
    setShowEmojiPicker(false);
  };

  return {
    showEmojiPicker,
    emojiPickerRef,
    setShowEmojiPicker,
    handleEmojiClick,
  };
}

