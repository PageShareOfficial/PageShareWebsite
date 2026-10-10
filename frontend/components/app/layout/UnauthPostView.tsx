'use client';

import React from 'react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { ArrowLeft } from '@/constants/icons';
import PostCard from '@/components/app/post/PostCard';
import { formatDateTime } from '@/utils/core/dateUtils';
import type { Post } from '@/types';

const columnClasses = 'flex-1 flex flex-col min-w-0 w-full border-l border-r border-white/10';

const stickyHeaderClasses = [
  'sticky top-0 z-20 bg-black/80 backdrop-blur-xs',
  'border-b border-white/10 md:top-0',
].join(' ');

type UnauthPostViewProps = {
  post: Post;
};

/**
 * Renders the unauthenticated single-post middle column; the `(app)` shell provides
 * the public sidebar (PublicAppChrome).
 */
export default function UnauthPostView({ post }: UnauthPostViewProps) {
  const formattedDateTime = formatDateTime(post.createdAtRaw ?? undefined);

  return (
    <div className={columnClasses}>
      <div className={stickyHeaderClasses}>
        <div className="flex items-center px-4 h-14">
          <Link
            href={ROUTES.landing}
            className={'mr-4 p-2 hover:bg-white/10 rounded-full transition-colors inline-flex'}
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-xl font-bold text-white">Post</h1>
        </div>
      </div>
      <div className="border-b border-white/10">
        <div className="px-4">
          <PostCard
            post={post}
            onLike={() => {}}
            onRepost={() => {}}
            onComment={() => {}}
            onVote={() => {}}
            hasUserReposted={() => false}
            currentUserHandle={undefined}
            allPosts={[post]}
            isDetailPage={true}
            readOnly={true}
          />
        </div>
        <div className="px-4 py-3 border-t border-white/10">
          <div className="text-sm text-gray-400">{formattedDateTime}</div>
        </div>
      </div>
      <div className="px-4 py-8 text-center text-gray-500 text-sm">
        Sign in to like, comment, or repost.
      </div>
    </div>
  );
}
