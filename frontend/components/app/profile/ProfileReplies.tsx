'use client';

import { Post, Comment } from '@/types';
import ReplyCard from './ReplyCard';
import Feed from '@/components/app/feed/Feed';

export type ReplyTabItem =
  | { type: 'comment'; comment: Comment; post: Post }
  | { type: 'quote'; post: Post };

interface ProfileRepliesProps {
  items: ReplyTabItem[];
  allPosts: Post[];
  onLike: (postId: string) => void;
  onRepost: (postId: string, type?: 'normal' | 'quote') => void;
  onComment: (postId: string) => void;
  onVote?: (postId: string, optionIndex: number) => void;
  hasUserReposted: (postId: string) => boolean;
  currentUserHandle: string;
  onCommentLike?: (commentId: string) => void;
  onCommentPollVote?: (commentId: string, optionIndex: number) => void;
  onCommentDelete?: (commentId: string, postId: string) => void;
  onReportClick?: (contentType: 'post' | 'comment', contentId: string, userHandle: string, userDisplayName: string) => void;
}

export default function ProfileReplies({
  items,
  allPosts,
  onLike,
  onRepost,
  onComment,
  onVote,
  hasUserReposted,
  onCommentLike,
  onCommentPollVote,
  onCommentDelete,
  currentUserHandle,
  onReportClick,
}: ProfileRepliesProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No replies yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {items.map((item) =>
        item.type === 'comment' ? (
          <ReplyCard
            key={`comment-${item.comment.id}`}
            originalPost={item.post}
            reply={item.comment}
            onCommentLike={onCommentLike}
            onCommentPollVote={onCommentPollVote}
            onCommentDelete={onCommentDelete}
            currentUserHandle={currentUserHandle}
            allPosts={allPosts}
            onLike={onLike}
            onRepost={onRepost}
            onComment={onComment}
            onVote={onVote}
            hasUserReposted={hasUserReposted}
            onReportClick={onReportClick}
          />
        ) : (
          <Feed
            key={`quote-${item.post.id}`}
            posts={[item.post]}
            onNewIdeaClick={() => {}}
            onLike={onLike}
            onRepost={onRepost}
            onComment={onComment}
            onVote={onVote ?? (() => {})}
            hasUserReposted={hasUserReposted}
            currentUserHandle={currentUserHandle}
            allPosts={allPosts}
            showAllReposts={true}
            onReportClick={onReportClick}
          />
        )
      )}
    </div>
  );
}
