'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import UnauthSidebar from '@/components/app/layout/UnauthSidebar';
import PostCard from '@/components/app/post/PostCard';
import { formatDateTime } from '@/utils/core/dateUtils';
import type { Post } from '@/types';

/** Layout widths: 800/875 (group), 600 (midrail) — see utils/core/layoutConstants. */

const outerClasses = [
  'min-h-screen w-full bg-black flex flex-col',
  'md:flex-row md:flex-nowrap md:justify-center md:min-w-0',
].join(' ');

const wrapperClasses = [
  'flex flex-col md:flex-row md:flex-shrink-0',
  'md:max-w-[800px] lg:max-w-[875px] w-full md:w-auto',
].join(' ');

const midrailOuterClasses = [
  'flex-1 flex justify-center md:justify-start min-w-0',
  'md:flex-none md:w-[600px] md:min-w-[600px]',
].join(' ');

const midrailInnerClasses = [
  'flex-1 flex flex-col min-w-0 w-full border-l border-r border-white/10',
  'max-w-[600px] md:w-[600px] md:min-w-[600px]',
].join(' ');

const stickyHeaderClasses = [
  'sticky top-0 z-20 bg-black/80 backdrop-blur-sm',
  'border-b border-white/10 md:top-0',
].join(' ');

type UnauthPostViewProps = {
  post: Post;
};

/**
 * Renders the unauthenticated single-post view: sidebar + middle rail.
 * Uses shared date formatting and layout constants (quality_code: DRY, single responsibility).
 */
export default function UnauthPostView({ post }: UnauthPostViewProps) {
  const formattedDateTime = formatDateTime(post.createdAtRaw ?? undefined);

  return (
    <div className={outerClasses}>
      <div className={wrapperClasses}>
        <UnauthSidebar />
        <div className={midrailOuterClasses}>
          <div className={midrailInnerClasses}>
            <div className={stickyHeaderClasses}>
              <div className="flex items-center px-4 h-14">
                <Link
                  href="/"
                  className={
                    'mr-4 p-2 hover:bg-white/10 rounded-full transition-colors inline-flex'
                  }
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
        </div>
      </div>
    </div>
  );
}
