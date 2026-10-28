'use client';

import { Post } from '@/types';
import { isPost } from '@/utils/content/postUtils';
import AuthorBadges from '@/components/app/common/AuthorBadges';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';

interface ComposerQuoteOriginalPostProps {
  originalPost: Post;
}

/** Compact original-post preview shown when composing a quote repost. */
export default function ComposerQuoteOriginalPost({
  originalPost,
}: ComposerQuoteOriginalPostProps) {
  const media = isPost(originalPost) ? originalPost.media : undefined;
  const mediaCount = media?.length ?? 0;

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 flex items-center space-x-2">
        <AvatarWithFallback
          src={originalPost.author.avatar}
          alt={originalPost.author.displayName}
          size={20}
          className="h-5 w-5"
        />
        <span className="text-sm font-semibold text-white">
          {originalPost.author.displayName}
        </span>
        <span className="text-xs text-gray-400">@{originalPost.author.handle}</span>
        <AuthorBadges
          subscriptionPlanId={originalPost.author.subscriptionPlanId}
          isAdmin={originalPost.author.isAdmin}
          size="sm"
        />
        <span className="text-xs text-gray-500">· {originalPost.createdAt}</span>
      </div>
      {isPost(originalPost) ? (
        <>
          <p className="mb-2 wrap-break-word text-sm leading-relaxed whitespace-pre-wrap text-white">
            {originalPost.content}
          </p>
          {mediaCount > 0 ? (
            <div
              className={`mt-2 overflow-hidden rounded-lg ${
                mediaCount === 1 ? 'max-w-full' : 'grid grid-cols-2 gap-1'
              }`}
            >
              {media!.map((url, index) => (
                <div
                  key={url}
                  className={`relative ${mediaCount === 3 && index === 0 ? 'row-span-2' : ''}`}
                >
                  <img
                    src={url}
                    alt={`Media ${index + 1}`}
                    className="h-full w-full object-cover"
                    style={{ aspectRatio: mediaCount === 1 ? '16/9' : '1/1' }}
                  />
                </div>
              ))}
            </div>
          ) : null}
          {originalPost.gifUrl ? (
            <div className="mt-2 overflow-hidden rounded-lg">
              <img src={originalPost.gifUrl} alt="GIF" className="w-full rounded-lg" />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
