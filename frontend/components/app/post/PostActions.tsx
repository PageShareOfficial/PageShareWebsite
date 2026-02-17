'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Post } from '@/types';
import RepostButton from './RepostButton';
import IconActionButton from '@/components/app/common/IconActionButton';
import { shareContent } from '@/utils/core/clipboardUtils';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';

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
  const isOnline = useOnlineStatus();
  const actionsDisabled = !isOnline;

  // For normal reposts, use original post's stats
  // For quote reposts and regular posts, use the post's own stats
  const displayStats = (post.repostType === 'normal' && originalPost) 
    ? originalPost.stats 
    : post.stats;

  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined') return;

    const url = `${window.location.origin}/${post.author.handle}/posts/${post.id}`;
    const success = await shareContent({
      title: `${post.author.displayName} on PageShare`,
      text: post.content,
      url,
    });

    if (success) {
      setIsSharing(true);
      setTimeout(() => setIsSharing(false), 2000);
    }
  };

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
        disabled={actionsDisabled}
      />
      
      <RepostButton
        isReposted={isReposted}
        repostCount={displayStats.reposts}
        onNormalRepost={onNormalRepost}
        onQuoteRepost={onQuoteRepost}
        canUndoRepost={canUndoRepost}
        disabled={actionsDisabled}
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
        disabled={actionsDisabled}
      />
      
      <div className="relative">
        <IconActionButton
          icon={Share2}
          label="Share"
          onClick={handleShare}
          hoverColor="blue-400"
          showCount={false}
        />
        {isSharing && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-black text-xs text-white shadow">
            Link copied
          </div>
        )}
      </div>
    </div>
  );
}

