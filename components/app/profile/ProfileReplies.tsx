'use client';

import { Post, Comment } from '@/types';
import ReplyCard from './ReplyCard';

interface ProfileRepliesProps {
  comments: Comment[];
  posts: Post[];
  onLike: (postId: string) => void;
  onRepost: (postId: string, type?: 'normal' | 'quote') => void;
  onComment: (postId: string) => void;
  onVote?: (postId: string, optionIndex: number) => void;
  hasUserReposted: (postId: string) => boolean;
  currentUserHandle: string;
  onCommentLike?: (commentId: string) => void;
}

export default function ProfileReplies({
  comments,
  posts,
  onLike,
  onRepost,
  onComment,
  onVote,
  hasUserReposted,
  onCommentLike,
  currentUserHandle,
}: ProfileRepliesProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No replies yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {comments.map((comment) => {
        const originalPost = posts.find((p) => p.id === comment.postId);
        if (!originalPost) return null;

        return (
          <ReplyCard
            key={comment.id}
            originalPost={originalPost}
            reply={comment}
            onCommentLike={onCommentLike}
            currentUserHandle={currentUserHandle}
            allPosts={posts}
            onLike={onLike}
            onRepost={onRepost}
            onComment={onComment}
            onVote={onVote}
            hasUserReposted={hasUserReposted}
          />
        );
      })}
    </div>
  );
}
