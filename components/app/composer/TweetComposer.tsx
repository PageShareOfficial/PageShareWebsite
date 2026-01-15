'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlinePhotograph, HiOutlineEmojiHappy, HiX } from 'react-icons/hi';
import { RiFileGifLine, RiBarChartLine } from 'react-icons/ri';
import dynamic from 'next/dynamic';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import { Post } from '@/types';
import { isTweet } from '@/data/mockData';
import { parseCashtags } from '@/utils/core/textFormatting';
import { useMediaUpload } from '@/hooks/composer/useMediaUpload';
import { usePollBuilder } from '@/hooks/composer/usePollBuilder';
import { useEmojiPicker } from '@/hooks/composer/useEmojiPicker';
import { useCharacterCounter } from '@/hooks/composer/useCharacterCounter';
import { useGiphySearch } from '@/hooks/composer/useGiphySearch';
import UserBadge from '@/components/app/common/UserBadge';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';

// Dynamically import emoji picker to avoid SSR issues
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface TweetComposerProps {
  currentUser: {
    displayName: string;
    handle: string;
    avatar: string;
  };
  onSubmit: (text: string, media?: File[], gifUrl?: string, poll?: { options: string[]; duration: number }) => void;
  onClose?: () => void;
  isModal?: boolean;
  originalPostId?: string;
  allPosts?: Post[]; // All posts array to look up original post by ID
}

// Initialize Giphy - will be created with API key from environment
// Get a free API key from https://developers.giphy.com/
// Add NEXT_PUBLIC_GIPHY_API_KEY to your .env.local file
const getGiphyClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY || '';
  if (!apiKey) return null;
  return new GiphyFetch(apiKey);
};

export default function TweetComposer({
  currentUser,
  onSubmit,
  onClose,
  isModal = false,
  originalPostId,
  allPosts = [],
}: TweetComposerProps) {
  const router = useRouter();
  // Look up original post by ID
  const originalPost = originalPostId ? allPosts.find(p => p.id === originalPostId) : undefined;
  // Load state from sessionStorage on mount
  // Use performance.navigation or performance.getEntriesByType to detect refresh vs navigation
  const loadStateFromStorage = () => {
    if (typeof window === 'undefined') return null;
    
    // Check if this is a refresh (not a navigation)
    // If navigation flag exists, it means we navigated (not refreshed)
    const navigationFlag = sessionStorage.getItem('tweetComposerNavFlag');
    
    if (!navigationFlag) {
      // This is likely a refresh, clear saved state
      sessionStorage.removeItem('tweetComposerState');
      // Set flag for future navigations
      sessionStorage.setItem('tweetComposerNavFlag', 'true');
      return null;
    }
    
    // This is navigation, load saved state
    const saved = sessionStorage.getItem('tweetComposerState');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  };

  // Set navigation flag on mount (for next navigation)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tweetComposerNavFlag', 'true');
    }
  }, []);

  const savedState = loadStateFromStorage();
  
  const [tweetText, setTweetText] = useState(savedState?.tweetText || '');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const maxLength = 280;

  // Use hooks
  const {
    mediaFiles,
    mediaPreviews,
    selectedGif,
    handleImageUpload,
    handleRemoveMedia,
    handleGifSelect,
    clearMedia,
    setSelectedGif,
  } = useMediaUpload(savedState?.selectedGif || null);

  const {
    showPoll,
    pollOptions,
    pollDuration,
    setShowPoll,
    addPollOption,
    removePollOption,
    updatePollOption,
    setPollDuration,
    getPollData,
    resetPoll,
  } = usePollBuilder(
    savedState?.showPoll || false,
    savedState?.pollOptions || ['', ''],
    savedState?.pollDuration || 1
  );

  const {
    showEmojiPicker,
    emojiPickerRef,
    setShowEmojiPicker,
    handleEmojiClick,
  } = useEmojiPicker();

  const { gifSearchQuery, debouncedGifSearch, setGifSearchQuery } = useGiphySearch();

  const { remainingChars, isOverLimit, charPercentage } = useCharacterCounter({
    maxLength,
    text: tweetText,
  });

  // Handle GIF select with proper format
  const handleGifSelectWrapper = (gif: any) => {
    handleGifSelect(gif.images.original.url);
    setShowGifPicker(false);
  };

  // Handle emoji click with proper format
  const handleEmojiClickWrapper = (emojiData: any) => {
    if (textareaRef.current) {
      handleEmojiClick(emojiData.emoji, textareaRef);
    } else {
      setTweetText((prev: string) => prev + emojiData.emoji);
    }
    setShowEmojiPicker(false);
  };

  // Sync overlay padding with textarea
  useEffect(() => {
    if (textareaRef.current && overlayRef.current) {
      const syncPadding = () => {
        if (textareaRef.current && overlayRef.current) {
          const computedStyle = window.getComputedStyle(textareaRef.current);
          overlayRef.current.style.padding = computedStyle.padding;
          overlayRef.current.style.paddingTop = computedStyle.paddingTop;
          overlayRef.current.style.paddingRight = computedStyle.paddingRight;
          overlayRef.current.style.paddingBottom = computedStyle.paddingBottom;
          overlayRef.current.style.paddingLeft = computedStyle.paddingLeft;
        }
      };
      
      syncPadding();
      // Sync on resize
      const resizeObserver = new ResizeObserver(syncPadding);
      if (textareaRef.current) {
        resizeObserver.observe(textareaRef.current);
      }
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [tweetText]);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stateToSave = {
      tweetText,
      selectedGif,
      showPoll,
      pollOptions,
      pollDuration,
    };
    sessionStorage.setItem('tweetComposerState', JSON.stringify(stateToSave));
  }, [tweetText, selectedGif, showPoll, pollOptions, pollDuration]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tweetText.trim().length === 0) return;
    if (tweetText.length > maxLength) {
      // Redirect to plans page
      router.push('/plans');
      return;
    }
    
    const poll = getPollData();
    
    onSubmit(
      tweetText,
      mediaFiles.length > 0 ? mediaFiles : undefined,
      selectedGif || undefined,
      poll || undefined
    );
    setTweetText('');
    clearMedia();
    resetPoll();
    // Clear sessionStorage after successful submit
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('tweetComposerState');
    }
    if (onClose) {
      onClose();
    }
  };


  const composerContent = (
    <form onSubmit={handleSubmit}>
      <div className="flex space-x-2 sm:space-x-3 md:space-x-3 lg:space-x-4">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          <AvatarWithFallback
            src={currentUser.avatar}
            alt={currentUser.displayName}
            size={40}
            className="w-8 h-8 md:w-10 md:h-10"
          />
        </div>

        {/* Text Area */}
        <div className="flex-1 min-w-0 relative">
          <div className="relative">
            {/* Overlay div for cashtag highlighting */}
            <div
              ref={overlayRef}
              className="absolute inset-0 pointer-events-none whitespace-pre-wrap break-words overflow-hidden"
              style={{
                fontFamily: 'inherit',
                fontSize: 'inherit',
                lineHeight: 'inherit',
                color: 'transparent',
                zIndex: 1,
              }}
              aria-hidden="true"
            >
              <div className="text-white text-base md:text-lg lg:text-xl">
                {parseCashtags(tweetText, false)}
              </div>
            </div>
            <textarea
              ref={(textarea) => {
                if (textarea) {
                  (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = textarea;
                  // Auto-resize on mount and when value changes
                  textarea.style.height = 'auto';
                  const scrollHeight = textarea.scrollHeight;
                  const lineHeight = 24;
                  const minHeight = lineHeight * 2; // 2 lines minimum
                  const maxHeight = lineHeight * 15; // 15 lines maximum
                  const newHeight = Math.min(Math.max(minHeight, scrollHeight), maxHeight);
                  textarea.style.height = `${newHeight}px`;
                  
                  // Sync overlay padding with textarea
                  if (overlayRef.current) {
                    const computedStyle = window.getComputedStyle(textarea);
                    overlayRef.current.style.padding = computedStyle.padding;
                    overlayRef.current.style.paddingTop = computedStyle.paddingTop;
                    overlayRef.current.style.paddingRight = computedStyle.paddingRight;
                    overlayRef.current.style.paddingBottom = computedStyle.paddingBottom;
                    overlayRef.current.style.paddingLeft = computedStyle.paddingLeft;
                  }
                }
              }}
              value={tweetText}
              onChange={(e) => {
                const newValue = e.target.value;
                setTweetText(newValue);
                
                // Auto-resize textarea based on content
                e.target.style.height = 'auto';
                const scrollHeight = e.target.scrollHeight;
                const lineHeight = 24;
                const minHeight = lineHeight * 2; // Start with 2 lines
                const maxHeight = lineHeight * 15; // Max 15 lines
                const newHeight = Math.min(Math.max(minHeight, scrollHeight), maxHeight);
                e.target.style.height = `${newHeight}px`;
                
                // Sync overlay padding with textarea
                if (overlayRef.current) {
                  const computedStyle = window.getComputedStyle(e.target);
                  overlayRef.current.style.padding = computedStyle.padding;
                  overlayRef.current.style.paddingTop = computedStyle.paddingTop;
                  overlayRef.current.style.paddingRight = computedStyle.paddingRight;
                  overlayRef.current.style.paddingBottom = computedStyle.paddingBottom;
                  overlayRef.current.style.paddingLeft = computedStyle.paddingLeft;
                }
              }}
              placeholder={isOverLimit ? "Upgrade to Premium to post longer content" : (showPoll ? "Ask a question..." : (originalPost ? "Add a comment..." : "What's happening?"))}
              className={`w-full bg-transparent text-white placeholder-gray-500 text-base md:text-lg lg:text-xl resize-none focus:outline-none overflow-hidden relative z-10 ${
                isOverLimit ? 'placeholder-red-400' : ''
              }`}
              style={{ 
                height: '48px', // Start with 2 lines
                minHeight: '48px',
                maxHeight: '360px', // Max 15 lines
                paddingBottom: isOverLimit ? '40px' : '0', // Add padding for mobile upgrade button
                caretColor: 'white',
                color: 'transparent', // Make text transparent so overlay shows through
              }}
              rows={2}
              autoFocus={isModal}
            />
            {/* Upgrade to Premium overlay message when over limit - Mobile only (inside textarea area) */}
            {isOverLimit && (
              <div className="absolute bottom-1 left-0 right-0 flex items-center justify-center pointer-events-none md:hidden" style={{ paddingBottom: '8px' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push('/plans');
                  }}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-full text-xs font-semibold hover:bg-blue-600 transition-colors pointer-events-auto shadow-lg"
                >
                  Upgrade to Premium
                </button>
              </div>
            )}
          </div>
          {/* Upgrade to Premium message when over limit - Desktop/Tablet (below textarea) */}
          {isOverLimit && (
            <div className="hidden md:flex items-center justify-center mt-2 pointer-events-none">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push('/plans');
                }}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-full text-xs font-semibold hover:bg-blue-600 transition-colors pointer-events-auto shadow-lg"
              >
                Upgrade to Premium
              </button>
            </div>
          )}
          
          {/* Media Previews */}
          {(mediaPreviews.length > 0 || selectedGif) && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 sm:h-32 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(index)}
                    className="absolute top-1 right-1 sm:top-2 sm:right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <HiX className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </button>
                </div>
              ))}
              {selectedGif && (
                <div className="relative group">
                  <img
                    src={selectedGif}
                    alt="Selected GIF"
                    className="w-full h-24 sm:h-32 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedGif(null)}
                    className="absolute top-1 right-1 sm:top-2 sm:right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <HiX className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Poll Options */}
          {showPoll && (
            <div className="mt-3 p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">Add poll</span>
                <button
                  type="button"
                  onClick={() => {
                    resetPoll();
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <HiX className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 mb-3">
                {pollOptions.map((option: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updatePollOption(index, e.target.value)}
                      placeholder={`Choice ${index + 1}`}
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      maxLength={25}
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removePollOption(index)}
                        className="p-2 text-gray-400 hover:text-white"
                      >
                        <HiX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {pollOptions.length < 4 && (
                <button
                  type="button"
                  onClick={addPollOption}
                  className="text-sm text-cyan-400 hover:text-cyan-300"
                >
                  Add option
                </button>
              )}
              <div className="mt-3 pt-3 border-t border-white/10">
                <label className="text-sm text-gray-400 mb-2 block">Poll duration</label>
                <div className="inline-block relative">
                  <select
                    value={pollDuration}
                    onChange={(e) => setPollDuration(Number(e.target.value))}
                    className="px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none cursor-pointer pr-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.75rem center',
                      width: 'auto',
                      minWidth: '120px'
                    }}
                  >
                    <option value={1} style={{ backgroundColor: '#000000', color: '#ffffff' }}>1 day</option>
                    <option value={3} style={{ backgroundColor: '#000000', color: '#ffffff' }}>3 days</option>
                    <option value={7} style={{ backgroundColor: '#000000', color: '#ffffff' }}>7 days</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* GIF Picker */}
          {showGifPicker && (
            <div className="mt-3 p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">Choose a GIF</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowGifPicker(false);
                    setGifSearchQuery('');
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <HiX className="w-4 h-4" />
                </button>
              </div>
              {/* GIF Search */}
              <div className="mb-3">
                <input
                  type="text"
                  value={gifSearchQuery}
                  onChange={(e) => setGifSearchQuery(e.target.value)}
                  placeholder="Search for GIFs..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm sm:text-base"
                />
              </div>
              {(() => {
                const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
                const giphyClient = getGiphyClient();
                
                if (!apiKey || !giphyClient) {
                  return (
                    <div className="text-center py-8 text-gray-400">
                      <p className="mb-2">Giphy API key not configured</p>
                      <p className="text-sm">Add NEXT_PUBLIC_GIPHY_API_KEY to your .env.local file</p>
                      <p className="text-xs mt-2">Get a free API key from https://developers.giphy.com/</p>
                    </div>
                  );
                }
                
                return (
                  <div className="w-full">
                    <Grid
                      key={debouncedGifSearch} // Force re-render when debounced search changes
                      onGifClick={handleGifSelectWrapper}
                      fetchGifs={(offset) => {
                        const searchQuery = debouncedGifSearch.trim();
                        if (searchQuery) {
                          return giphyClient.search(searchQuery, { offset, limit: 10 });
                        }
                        return giphyClient.trending({ offset, limit: 10 });
                      }}
                      width={typeof window !== 'undefined' ? Math.min(window.innerWidth - 80, 400) : 400}
                      columns={2}
                      gutter={6}
                      noLink={true}
                      hideAttribution={true}
                    />
                  </div>
                );
              })()}
            </div>
          )}

          {/* Emoji Picker - Desktop/Tablet only (Mobile handled in modal portal) */}
          {showEmojiPicker && (!isModal || (typeof window !== 'undefined' && window.innerWidth >= 640)) && (
            <div className="mt-3 relative" ref={emojiPickerRef}>
              <div className="absolute z-20 left-0 sm:left-auto sm:right-0">
                <div className="bg-black border border-white/10 rounded-xl overflow-hidden shadow-xl">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClickWrapper}
                    width={350}
                    height={400}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Original Post Card for Quote Repost - Shown below comment input */}
          {originalPost && (
            <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <AvatarWithFallback
                  src={originalPost.author.avatar}
                  alt={originalPost.author.displayName}
                  size={20}
                  className="w-5 h-5"
                />
                <span className="font-semibold text-white text-sm">{originalPost.author.displayName}</span>
                <span className="text-xs text-gray-400">@{originalPost.author.handle}</span>
                {originalPost.author.badge && (
                  <UserBadge badge={originalPost.author.badge} size="sm" />
                )}
                <span className="text-xs text-gray-500">· {originalPost.createdAt}</span>
              </div>
              {/* Render content based on post type */}
              {isTweet(originalPost) ? (
                <>
                  <p className="text-white text-sm leading-relaxed mb-2 whitespace-pre-wrap break-words">
                    {originalPost.content}
                  </p>
                  {/* Original tweet media */}
                  {originalPost.media && originalPost.media.length > 0 && (
                    <div className={`mt-2 rounded-lg overflow-hidden ${
                      originalPost.media.length === 1 ? 'max-w-full' :
                      originalPost.media.length === 2 ? 'grid grid-cols-2 gap-1' :
                      originalPost.media.length === 3 ? 'grid grid-cols-2 gap-1' :
                      'grid grid-cols-2 gap-1'
                    }`}>
                      {originalPost.media.map((url: string, index: number) => (
                        <div key={index} className={`relative ${
                          originalPost.media!.length === 3 && index === 0 ? 'row-span-2' : ''
                        }`}>
                          <img
                            src={url}
                            alt={`Media ${index + 1}`}
                            className="w-full h-full object-cover"
                            style={{ aspectRatio: originalPost.media!.length === 1 ? '16/9' : '1/1' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {originalPost.gifUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden">
                      <img
                        src={originalPost.gifUrl}
                        alt="GIF"
                        className="w-full rounded-lg"
                      />
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}

          {/* Media Upload Buttons & Character Counter */}
          <div className="flex flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4 flex-wrap flex-1 min-w-0">
              {/* Image Upload */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 sm:p-2 text-cyan-400 hover:bg-cyan-400/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Upload image"
                disabled={mediaFiles.length >= 4 || selectedGif !== null}
                title="Add photos"
              >
                <HiOutlinePhotograph className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {/* GIF Picker */}
              <button
                type="button"
                onClick={() => {
                  setShowGifPicker(!showGifPicker);
                  setShowEmojiPicker(false);
                  setShowPoll(false);
                }}
                className="p-1.5 sm:p-2 text-cyan-400 hover:bg-cyan-400/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Add GIF"
                disabled={mediaFiles.length > 0 || selectedGif !== null}
                title="Add GIF"
              >
                <RiFileGifLine className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Emoji Picker */}
              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowGifPicker(false);
                  setShowPoll(false);
                }}
                className="p-1.5 sm:p-2 text-cyan-400 hover:bg-cyan-400/10 rounded-full transition-colors"
                aria-label="Add emoji"
                title="Add emoji"
              >
                <HiOutlineEmojiHappy className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Poll */}
              <button
                type="button"
                onClick={() => {
                  setShowPoll(!showPoll);
                  setShowGifPicker(false);
                  setShowEmojiPicker(false);
                }}
                className="p-1.5 sm:p-2 text-cyan-400 hover:bg-cyan-400/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Add poll"
                disabled={mediaFiles.length > 0 || selectedGif !== null}
                title="Add poll"
              >
                <RiBarChartLine className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            
            <div className="flex flex-row items-center justify-end gap-2 md:gap-3 flex-shrink-0">
              {/* Character Counter - Always show circle, show number only when 30 or less characters remaining */}
              {tweetText.length > 0 && (
                <div className="relative w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
                  <svg className="transform -rotate-90 w-8 h-8 md:w-10 md:h-10" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      className="text-white/10"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 15}`}
                      strokeDashoffset={`${2 * Math.PI * 15 * (1 - Math.min(charPercentage, 100) / 100)}`}
                      className={`transition-all ${
                        isOverLimit
                          ? 'text-red-400'
                          : remainingChars <= 10
                          ? 'text-red-400'
                          : remainingChars <= 20
                          ? 'text-yellow-400'
                          : remainingChars <= 30
                          ? 'text-cyan-400'
                          : 'text-white/20'
                      }`}
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Show number only when 30 or less characters remaining */}
                  {remainingChars <= 30 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className={`text-[10px] md:text-xs font-semibold leading-none ${
                          isOverLimit
                            ? 'text-red-400'
                            : remainingChars <= 10
                            ? 'text-red-400'
                            : remainingChars <= 20
                            ? 'text-yellow-400'
                            : 'text-cyan-400'
                        }`}
                      >
                        {remainingChars}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              <button
                type="submit"
                disabled={tweetText.trim().length === 0 || isOverLimit}
                className="px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base bg-white text-black rounded-full font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );

  if (isModal) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-2 sm:pt-4 bg-black bg-opacity-80" onClick={onClose}>
          <div
            className="bg-black border border-white/10 rounded-xl w-full max-w-[600px] mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10 sticky top-0 bg-black z-10">
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 sm:p-4">
              {composerContent}
            </div>
          </div>
        </div>
        {/* Emoji Picker Portal for Mobile */}
        {showEmojiPicker && isModal && typeof window !== 'undefined' && window.innerWidth < 640 && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black bg-opacity-80" onClick={() => setShowEmojiPicker(false)}>
            <div className="w-full max-w-md bg-black border-t border-white/10 rounded-t-xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <span className="text-white font-medium">Choose an emoji</span>
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <HiX className="w-5 h-5" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                <EmojiPicker
                    onEmojiClick={handleEmojiClickWrapper}
                  width="100%"
                  height={400}
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="border-b border-white/10 pb-4 mb-0">
      {composerContent}
    </div>
  );
}

