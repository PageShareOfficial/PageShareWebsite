'use client';

import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Post } from '@/types';
import RepostButton from './RepostButton';

interface PostActionsProps {
  post: Post;
  originalPost?: Post; // Original post for reposts
  isLiked: boolean;
  isReposted: boolean;
  onLike: () => void;
  onComment: () => void;
  onNormalRepost: () => void;
  onQuoteRepost: () => void;
  canUndoRepost?: boolean; // Whether repost can be undone (only for normal reposts)
}

export default function PostActions({
  post,
  originalPost,
  isLiked,
  isReposted,
  onLike,
  onComment,
  onNormalRepost,
  onQuoteRepost,
  canUndoRepost = false,
}: PostActionsProps) {
  // For normal reposts, use original post's stats
  // For quote reposts and regular posts, use the post's own stats
  const displayStats = (post.repostType === 'normal' && originalPost) 
    ? originalPost.stats 
    : post.stats;

  return (
    <div className="flex items-center text-gray-400 mt-3 pt-3 w-full">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onComment();
        }}
        className="flex items-center justify-center space-x-2 hover:text-cyan-400 transition-colors group flex-1"
        aria-label="Comment"
        title="Comment"
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-cyan-400/10 transition-colors">
          <MessageCircle className="w-5 h-5" />
        </div>
        <span className="text-sm">{displayStats.comments}</span>
      </button>
      
      <RepostButton
        isReposted={isReposted}
        repostCount={displayStats.reposts}
        onNormalRepost={onNormalRepost}
        onQuoteRepost={onQuoteRepost}
        canUndoRepost={canUndoRepost}
      />
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onLike();
        }}
        className="flex items-center justify-center space-x-2 hover:text-red-400 transition-colors group flex-1"
        aria-label={`${isLiked ? 'Unlike' : 'Like'} post`}
        title={isLiked ? 'Unlike' : 'Like'}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          isLiked 
            ? 'bg-red-400/20 group-hover:bg-red-400/30' 
            : 'group-hover:bg-red-400/10'
        }`}>
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-400 text-red-400' : ''}`} />
        </div>
        <span className="text-sm">{displayStats.likes}</span>
      </button>
      
      <button
        onClick={() => {}}
        className="flex items-center justify-center space-x-2 hover:text-blue-400 transition-colors group flex-1"
        aria-label="Share"
        title="Share"
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-blue-400/10 transition-colors">
          <Share2 className="w-5 h-5" />
        </div>
      </button>
    </div>
  );
}

