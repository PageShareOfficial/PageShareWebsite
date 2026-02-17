'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart } from 'lucide-react';
import Sidebar from '@/components/app/layout/Sidebar';
import RightRail from '@/components/app/layout/RightRail';

const ReportModal = dynamic(
  () => import('@/components/app/modals/ReportModal'),
  { ssr: false }
);
import PostCard from '@/components/app/post/PostCard';
import PostMedia from '@/components/app/post/PostMedia';
import PollComponent from '@/components/app/post/PollComponent';
import TweetComposer from '@/components/app/composer/TweetComposer';
import CommentComposer from '@/components/app/composer/CommentComposer';
import ImageViewerModal from '@/components/app/modals/ImageViewerModal';
import ContentMenu from '@/components/app/common/ContentMenu';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';
import UserBadge from '@/components/app/common/UserBadge';
import LoadingState from '@/components/app/common/LoadingState';
import ErrorState from '@/components/app/common/ErrorState';
import { formatDateTime } from '@/utils/core/dateUtils';
import { parseCashtags } from '@/utils/core/textFormatting';
import type { Comment, Post, User, WatchlistItem } from '@/types';

export type AuthenticatedPostDetailProps = {
  post: Post;
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  postId: string;
  username: string;
  currentUser: User;
  handleLike: (postId: string) => void;
  handleRepost: (postId: string) => void;
  handleComment: (postId: string) => void;
  handleVote: (postId: string, optionIndex: number) => void;
  handleDelete: (postId: string) => void;
  hasUserReposted: (postId: string) => boolean;
  isQuoteRepostOpen: boolean;
  setIsQuoteRepostOpen: (open: boolean) => void;
  quoteRepostPostId: string | null;
  setQuoteRepostPostId: (id: string | null) => void;
  handleQuoteRepostSubmit: (text: string) => void;
  comments: Comment[];
  commentsLoading: boolean;
  commentsError: string | null;
  filterComments: (comments: Comment[]) => Comment[];
  filterReportedComments: (comments: Comment[], userHandle: string) => Comment[];
  handleAddComment: (
    text: string,
    mediaFiles?: File[],
    gifUrl?: string,
    poll?: { options: string[]; duration: number },
    previewUrls?: string[]
  ) => Promise<void>;
  handleDeleteComment: (commentId: string) => void;
  handleToggleLikeComment: (commentId: string) => void;
  handleVoteOnCommentPoll: (commentId: string, optionIndex: number) => void;
  reportModalOpen: boolean;
  reportContentType: 'post' | 'comment';
  reportContentId: string;
  reportPostId: string | undefined;
  reportUserHandle: string;
  reportUserDisplayName: string;
  handleReportClick: (
    contentType: 'post' | 'comment',
    contentId: string,
    userHandle: string,
    userDisplayName: string,
    commentPostId?: string
  ) => void;
  handleReportSubmitted: () => void;
  watchlist: WatchlistItem[];
  openManageModal: () => void;
  setWatchlist: React.Dispatch<React.SetStateAction<WatchlistItem[]>>;
  watchlistLoading: boolean;
  selectedImageIndex: number | null;
  setSelectedImageIndex: React.Dispatch<React.SetStateAction<number | null>>;
  selectedImageUrls: string[];
  setSelectedImageUrls: React.Dispatch<React.SetStateAction<string[]>>;
};

/**
 * Authenticated post detail: main content column, comments, right rail, modals.
 * Keeps PostDetailPage focused on routing and auth state (single responsibility).
 */
export default function AuthenticatedPostDetail(props: AuthenticatedPostDetailProps) {
  const router = useRouter();
  const {
    post,
    posts,
    setPosts,
    postId,
    username,
    currentUser,
    handleLike,
    handleRepost,
    handleComment,
    handleVote,
    handleDelete,
    hasUserReposted,
    isQuoteRepostOpen,
    setIsQuoteRepostOpen,
    quoteRepostPostId,
    setQuoteRepostPostId,
    handleQuoteRepostSubmit,
    comments,
    commentsLoading,
    commentsError,
    filterComments,
    filterReportedComments,
    handleAddComment,
    handleDeleteComment,
    handleToggleLikeComment,
    handleVoteOnCommentPoll,
    reportModalOpen,
    reportContentType,
    reportContentId,
    reportPostId,
    reportUserHandle,
    reportUserDisplayName,
    handleReportClick,
    handleReportSubmitted,
    watchlist,
    openManageModal,
    setWatchlist,
    watchlistLoading,
    selectedImageIndex,
    setSelectedImageIndex,
    selectedImageUrls,
    setSelectedImageUrls,
  } = props;

  const stickyHeaderClasses = [
    'sticky top-0 z-20 bg-black/80 backdrop-blur-sm border-b border-white/10',
  ].join(' ');

  return (
    <div className="min-h-screen bg-black">
      <div className="flex justify-center">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 max-w-[600px]">
          <div className="flex-1 flex pb-16 md:pb-0">
            <div className="w-full border-l border-r border-white/10">
              <div className={stickyHeaderClasses}>
                <div className="flex items-center px-4 h-14">
                  <button
                    onClick={() => router.back()}
                    className="mr-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                  <h1 className="text-xl font-bold text-white">Post</h1>
                </div>
              </div>

              <div className="border-b border-white/10">
                <div className="px-4">
                  <PostCard
                    post={post}
                    onLike={handleLike}
                    onRepost={handleRepost}
                    onComment={handleComment}
                    onVote={handleVote}
                    onDelete={handleDelete}
                    hasUserReposted={hasUserReposted}
                    currentUserHandle={currentUser.handle}
                    allPosts={posts}
                    isDetailPage={true}
                  />
                </div>
                <div className="px-4 py-3 border-t border-white/10">
                  <div className="text-sm text-gray-400">
                    {formatDateTime(post.createdAtRaw ?? undefined) || 'Loading...'}
                  </div>
                </div>
              </div>

              <CommentComposer
                postId={postId}
                currentUser={currentUser}
                onSubmit={async (text, mediaFiles, gifUrl, poll, previewUrls) => {
                  await handleAddComment(text, mediaFiles, gifUrl, poll, previewUrls);
                  setPosts((prev) =>
                    prev.map((p) =>
                      p.id === postId
                        ? {
                            ...p,
                            stats: {
                              ...p.stats,
                              comments: p.stats.comments + 1,
                            },
                          }
                        : p
                    )
                  );
                }}
              />

              <div>
                {commentsLoading && (
                  <LoadingState text="Loading comments..." />
                )}
                {!commentsLoading && commentsError && (
                  <ErrorState message={commentsError} />
                )}

                {!commentsLoading && !commentsError && (() => {
                  let filtered = filterComments(comments);
                  if (currentUser.handle) {
                    filtered = filterReportedComments(filtered, currentUser.handle);
                  }
                  if (filtered.length === 0) {
                    return (
                      <div className="text-white text-sm text-gray-400 px-4 py-8 text-center">
                        No comments yet. Be the first to comment!
                      </div>
                    );
                  }
                  return filtered.map((comment) => (
                    <div
                      key={comment.id}
                      className="border-b border-white/10 px-4 py-3 hover:bg-white/5 transition-colors"
                    >
                      <p className="text-gray-500 text-sm mb-2">
                        Replying to{' '}
                        <span className="text-[#1d9bf0]">@{username}</span>
                      </p>
                      <div className="flex items-start space-x-3">
                        <AvatarWithFallback
                          src={comment.author.avatar}
                          alt={comment.author.displayName}
                          size={40}
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1 w-full">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-white text-sm">
                                {comment.author.displayName}
                              </span>
                              <span className="text-xs text-gray-400">
                                @{comment.author.handle}
                              </span>
                              {comment.author.badge && (
                                <UserBadge
                                  badge={comment.author.badge}
                                  size="sm"
                                />
                              )}
                              <span className="text-xs text-gray-500">
                                · {comment.createdAt}
                              </span>
                            </div>
                            <ContentMenu
                              type="comment"
                              authorId={comment.author.id}
                              authorHandle={comment.author.handle}
                              authorDisplayName={comment.author.displayName}
                              currentUserHandle={currentUser.handle}
                              linkUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/${username}/posts/${postId}#comment-${comment.id}`}
                              contentId={comment.id}
                              onDelete={() => {
                                handleDeleteComment(comment.id);
                                setPosts((prev) =>
                                  prev.map((p) =>
                                    p.id === postId
                                      ? {
                                          ...p,
                                          stats: {
                                            ...p.stats,
                                            comments: Math.max(
                                              0,
                                              p.stats.comments - 1
                                            ),
                                          },
                                        }
                                      : p
                                  )
                                );
                              }}
                              onReportClick={(
                                contentType,
                                contentId,
                                userHandle,
                                userDisplayName,
                                commentPostId
                              ) => {
                                handleReportClick(
                                  contentType,
                                  contentId,
                                  userHandle,
                                  userDisplayName,
                                  commentPostId
                                );
                              }}
                            />
                          </div>
                          {comment.content && (
                            <p className="text-white text-[15px] leading-relaxed whitespace-pre-wrap break-words mb-2">
                              {parseCashtags(comment.content)}
                            </p>
                          )}
                          {comment.media && comment.media.length > 0 && (
                            <div className="mb-3">
                              <PostMedia
                                media={comment.media}
                                onImageClick={(urls, index) => {
                                  setSelectedImageUrls(urls);
                                  setSelectedImageIndex(index);
                                }}
                                className="rounded-xl"
                              />
                            </div>
                          )}
                          {comment.gifUrl && (
                            <div className="mb-3 rounded-xl overflow-hidden">
                              <img
                                src={comment.gifUrl}
                                alt="GIF"
                                className="w-full rounded-xl"
                                loading="lazy"
                              />
                            </div>
                          )}
                          {comment.poll && (
                            <div className="mb-3">
                              <PollComponent
                                poll={comment.poll}
                                postId={comment.id}
                                onVote={(commentId, optionIndex) => {
                                  handleVoteOnCommentPoll(
                                    commentId,
                                    optionIndex
                                  );
                                }}
                              />
                            </div>
                          )}
                          <div className="flex items-center space-x-6 mt-3 text-gray-400">
                            <button
                              onClick={() =>
                                handleToggleLikeComment(comment.id)
                              }
                              className="flex items-center space-x-1 hover:text-red-500 transition-colors"
                            >
                              <Heart
                                className={`w-4 h-4 ${comment.userLiked ? 'fill-red-500 text-red-500' : ''}`}
                              />
                              <span className="text-xs">
                                {comment.likes}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block w-[350px] flex-shrink-0 pl-4">
          <RightRail
            watchlist={watchlist}
            onManageWatchlist={openManageModal}
            onUpgradeLabs={() => router.push('/plans')}
            onUpdateWatchlist={setWatchlist}
            isLoading={watchlistLoading}
          />
        </div>
      </div>

      {isQuoteRepostOpen && quoteRepostPostId && (
        <TweetComposer
          currentUser={currentUser}
          onSubmit={(text) => handleQuoteRepostSubmit(text)}
          onClose={() => {
            setIsQuoteRepostOpen(false);
            setQuoteRepostPostId(null);
          }}
          isModal={true}
          originalPostId={quoteRepostPostId}
          allPosts={posts}
        />
      )}

      {selectedImageIndex !== null && selectedImageUrls.length > 0 && (
        <ImageViewerModal
          imageUrls={selectedImageUrls}
          selectedIndex={selectedImageIndex}
          onClose={() => {
            setSelectedImageIndex(null);
            setSelectedImageUrls([]);
          }}
          onPrevious={() => {
            setSelectedImageIndex((prev) =>
              prev !== null
                ? prev > 0
                  ? prev - 1
                  : selectedImageUrls.length - 1
                : null
            );
          }}
          onNext={() => {
            setSelectedImageIndex((prev) =>
              prev !== null
                ? prev < selectedImageUrls.length - 1
                  ? prev + 1
                  : 0
                : null
            );
          }}
        />
      )}

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => handleReportSubmitted()}
        contentType={reportContentType}
        contentId={reportContentId}
        postId={reportPostId}
        reportedUserHandle={reportUserHandle}
        reportedUserDisplayName={reportUserDisplayName}
        reportedUserId={undefined}
        currentUserHandle={currentUser.handle}
        onReport={handleReportSubmitted}
      />
    </div>
  );
}
