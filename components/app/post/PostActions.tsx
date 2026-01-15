'use client';

import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Post } from '@/types';
import RepostButton from './RepostButton';
import IconActionButton from '@/components/app/common/IconActionButton';

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
      <IconActionButton
        icon={MessageCircle}
        count={displayStats.comments}
        label="Comment"
        onClick={(e) => {
          e.stopPropagation();
          onComment();
        }}
        hoverColor="cyan-400"
      />
      
      <RepostButton
        isReposted={isReposted}
        repostCount={displayStats.reposts}
        onNormalRepost={onNormalRepost}
        onQuoteRepost={onQuoteRepost}
        canUndoRepost={canUndoRepost}
      />
      
      <IconActionButton
        icon={Heart}
        count={displayStats.likes}
        label={isLiked ? 'Unlike' : 'Like'}
        onClick={(e) => {
          e.stopPropagation();
          onLike();
        }}
        isActive={isLiked}
        activeColor="red-400"
        hoverColor="red-400"
      />
      
      <IconActionButton
        icon={Share2}
        label="Share"
        onClick={() => {}}
        hoverColor="blue-400"
        showCount={false}
      />
    </div>
  );
}

