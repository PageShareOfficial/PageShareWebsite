'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlinePhotograph, HiOutlineEmojiHappy, HiX } from 'react-icons/hi';
import { RiFileGifLine, RiBarChartLine } from 'react-icons/ri';
import dynamic from 'next/dynamic';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import { Post, Comment, User } from '@/types';
import { useMediaUpload, MEDIA_LIMITS_HINT } from '@/hooks/composer/useMediaUpload';
import { usePollBuilder } from '@/hooks/composer/usePollBuilder';
import { useEmojiPicker } from '@/hooks/composer/useEmojiPicker';
import { useCharacterCounter } from '@/hooks/composer/useCharacterCounter';
import { useGiphySearch } from '@/hooks/composer/useGiphySearch';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';

// Dynamically import emoji picker to avoid SSR issues
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

// Initialize Giphy
const getGiphyClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY || '';
  if (!apiKey) return null;
  return new GiphyFetch(apiKey);
};

interface CommentComposerProps {
  postId: string;
  currentUser: User;
  onSubmit: (
    text: string,
    media?: File[],
    gifUrl?: string,
    poll?: { options: string[]; duration: number },
    previewUrls?: string[]
  ) => Promise<void> | void;
}

export default function CommentComposer({
  postId,
  currentUser,
  onSubmit,
}: CommentComposerProps) {
  const router = useRouter();
  const [commentText, setCommentText] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxLength = 280;

  // Use hooks
  const {
    mediaFiles,
    mediaPreviews,
    selectedGif,
    mediaError,
    handleImageUpload,
    handleRemoveMedia,
    handleGifSelect,
    clearMedia,
    clearMediaError,
    setSelectedGif,
    setMediaFiles,
    setMediaPreviews,
  } = useMediaUpload();

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
  } = usePollBuilder();

  const {
    showEmojiPicker,
    emojiPickerRef,
    setShowEmojiPicker,
    handleEmojiClick,
  } = useEmojiPicker();

  const { gifSearchQuery, debouncedGifSearch, setGifSearchQuery } = useGiphySearch();

  const { remainingChars, isOverLimit, charPercentage } = useCharacterCounter({
    maxLength,
    text: commentText,
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
      setCommentText((prev) => prev + emojiData.emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleCommentSubmit = async (text: string, media?: File[], gifUrl?: string, poll?: { options: string[]; duration: number }) => {
    if (text.length > maxLength) {
      // Redirect to plans page
      router.push('/plans');
      return;
    }
    
    const trimmed = text.trim();
    if (!trimmed && !media?.length && !gifUrl && !poll) {
      return; // Don't submit empty comments
    }

    try {
      // Optimistically clear input and media immediately on submit
      setCommentText('');
      clearMedia();
      resetPoll();
      await onSubmit(trimmed, media, gifUrl, poll, mediaPreviews);
    } catch (error) {
      console.error('Failed to submit comment', error);
    }
  };

  return (
    <div className="border-b border-white/10 px-4 py-3">
      <div className="flex items-start space-x-3">
        <AvatarWithFallback
          src={currentUser.avatar}
          alt={currentUser.displayName}
          size={40}
          className="flex-shrink-0"
        />
        <div className="flex-1 min-w-0 relative">
          <div className="relative">
            <textarea
              ref={(textarea) => {
                if (textarea) {
                  // Auto-resize on mount and when value changes
                  textarea.style.height = 'auto';
                  const scrollHeight = textarea.scrollHeight;
                  const lineHeight = 24;
                  const minHeight = lineHeight * 2; // 2 lines minimum
                  const maxHeight = lineHeight * 15; // 15 lines maximum
                  const newHeight = Math.min(Math.max(minHeight, scrollHeight), maxHeight);
                  textarea.style.height = `${newHeight}px`;
                }
              }}
              value={commentText}
              onChange={(e) => {
                const newValue = e.target.value;
                setCommentText(newValue);
                
                // Auto-resize textarea based on content
                e.target.style.height = 'auto';
                const scrollHeight = e.target.scrollHeight;
                const lineHeight = 24;
                const minHeight = lineHeight * 2; // Start with 2 lines
                const maxHeight = lineHeight * 15; // Max 15 lines
                const newHeight = Math.min(Math.max(minHeight, scrollHeight), maxHeight);
                e.target.style.height = `${newHeight}px`;
              }}
              placeholder={isOverLimit ? "Upgrade to Premium to post longer content" : (showPoll ? "Ask a question..." : "Add a comment...")}
              className={`w-full bg-transparent text-white placeholder-gray-500 text-[15px] resize-none focus:outline-none overflow-hidden ${
                isOverLimit ? 'placeholder-red-400' : ''
              }`}
              style={{ 
                height: '48px', // Start with 2 lines
                minHeight: '48px',
                maxHeight: '360px', // Max 15 lines
                paddingBottom: isOverLimit ? '40px' : '0' // Add padding for mobile upgrade button
              }}
              rows={2}
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
                    className="w-full h-24 object-cover rounded-xl"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(index)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <HiX className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {selectedGif && (
                <div className="relative group">
                  <img
                    src={selectedGif}
                    alt="Selected GIF"
                    className="w-full h-24 object-cover rounded-xl"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedGif(null)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <HiX className="w-3 h-3 text-white" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Poll Options */}
          {showPoll && (
            <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/10">
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
                {pollOptions.map((option, index) => (
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
              <div className="mt-3">
                <label className="text-sm text-gray-400 mb-2 block">Poll duration</label>
                <select
                  value={pollDuration}
                  onChange={(e) => setPollDuration(Number(e.target.value))}
                  className="px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none cursor-pointer pr-10"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                  }}
                >
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                </select>
              </div>
            </div>
          )}

          {/* GIF Picker */}
          {showGifPicker && (
            <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/10 max-h-96 overflow-y-auto">
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
              <div className="mb-3">
                <input
                  type="text"
                  value={gifSearchQuery}
                  onChange={(e) => setGifSearchQuery(e.target.value)}
                  placeholder="Search for GIFs..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                />
              </div>
              {(() => {
                const giphyClient = getGiphyClient();
                if (!giphyClient) return null;
                return (
                  <div className="w-full">
                    <Grid
                      key={debouncedGifSearch}
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

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="mt-3 relative" ref={emojiPickerRef}>
              <div className="absolute z-20 left-0">
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

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap flex-1 min-w-0">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => {
                  clearMediaError();
                  fileInputRef.current?.click();
                  setShowGifPicker(false);
                  setShowPoll(false);
                  setSelectedGif(null);
                }}
                className="p-1.5 text-cyan-400 hover:bg-cyan-400/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={showPoll || !!selectedGif}
                aria-label="Upload image"
                title={MEDIA_LIMITS_HINT}
              >
                <HiOutlinePhotograph className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowGifPicker(!showGifPicker);
                  setShowEmojiPicker(false);
                  setShowPoll(false);
                  setMediaFiles([]);
                  setMediaPreviews([]);
                }}
                className="p-1.5 text-cyan-400 hover:bg-cyan-400/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={showPoll || mediaPreviews.length > 0}
                aria-label="Add GIF"
              >
                <RiFileGifLine className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowGifPicker(false);
                }}
                className="p-1.5 text-cyan-400 hover:bg-cyan-400/10 rounded-full transition-colors"
                aria-label="Add emoji"
              >
                <HiOutlineEmojiHappy className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPoll(!showPoll);
                  setShowGifPicker(false);
                  setMediaFiles([]);
                  setMediaPreviews([]);
                  setSelectedGif(null);
                }}
                className="p-1.5 text-cyan-400 hover:bg-cyan-400/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={mediaPreviews.length > 0 || !!selectedGif}
                aria-label="Add poll"
              >
                <RiBarChartLine className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-row items-center justify-end gap-2 flex-shrink-0">
              {/* Character Counter - Always show circle, show number only when 30 or less characters remaining */}
              {commentText.length > 0 && (
                <div className="relative w-8 h-8 flex-shrink-0">
                  <svg className="transform -rotate-90 w-8 h-8" viewBox="0 0 36 36">
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
                        className={`text-[10px] font-semibold leading-none ${
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
                onClick={() => {
                  const poll = showPoll && pollOptions.filter(opt => opt.trim()).length >= 2
                    ? { options: pollOptions.filter(opt => opt.trim()), duration: pollDuration }
                    : undefined;
                  handleCommentSubmit(commentText, mediaFiles, selectedGif || undefined, poll);
                }}
                disabled={isOverLimit || (!commentText.trim() && mediaPreviews.length === 0 && !selectedGif && !(showPoll && pollOptions.filter(opt => opt.trim()).length >= 2))}
                className="px-4 py-1.5 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                Reply
              </button>
            </div>
          </div>
          {mediaError && (
            <p className="mt-2 text-xs text-amber-400" title={mediaError}>
              {mediaError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

