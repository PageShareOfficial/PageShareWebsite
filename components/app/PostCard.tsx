'use client';

import Image from 'next/image';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { Post } from '@/types';
import { useState } from 'react';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onBookmark: (postId: string) => void;
  onRepost: (postId: string) => void;
  onComment: (postId: string) => void;
}

export default function PostCard({
  post,
  onLike,
  onBookmark,
  onRepost,
  onComment,
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.userInteractions.liked);
  const [isBookmarked, setIsBookmarked] = useState(post.userInteractions.bookmarked);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike(post.id);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark(post.id);
  };

  // Simple sparkline SVG
  const Sparkline = ({ data }: { data: number[] }) => {
    const width = 60;
    const height = 20;
    const padding = 2;
    const max = Math.max(...data.map(Math.abs));
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = ((index / (data.length - 1)) * (width - padding * 2)) + padding;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    const color = post.priceChange >= 0 ? '#10b981' : '#ef4444';

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <article className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Image
            src={post.author.avatar}
            alt={post.author.displayName}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900">{post.author.displayName}</span>
              <span className="text-sm text-gray-500">@{post.author.handle}</span>
              {post.author.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded">
                  {post.author.badge}
                </span>
              )}
              <span className="text-sm text-gray-400">· {post.createdAt}</span>
            </div>
          </div>
        </div>

        {/* Stats Block */}
        <div className="text-right text-xs space-y-1">
          <div className={`font-medium ${post.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Since posted {post.priceChange >= 0 ? '+' : ''}{post.priceChange.toFixed(1)}%
          </div>
          <div className="text-gray-600">Confidence {post.confidence}%</div>
          <Sparkline data={post.sparkline} />
        </div>
      </div>

      {/* Asset Pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {post.assets.map((asset) => (
          <span
            key={asset}
            className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200"
          >
            {asset}
          </span>
        ))}
        <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
          {post.horizon}
        </span>
        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-200">
          {post.type}
        </span>
        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200">
          {post.status}
        </span>
      </div>

      {/* Thesis */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-700 mb-1">Thesis snapshot</h4>
        <p className="text-sm text-gray-900 leading-relaxed">{post.thesis}</p>
      </div>

      {/* Catalysts & Risks */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h5 className="text-xs font-semibold text-gray-700 mb-2">Catalysts</h5>
          <div className="flex flex-wrap gap-1.5">
            {post.catalysts.map((catalyst, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded border border-green-200"
              >
                {catalyst}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h5 className="text-xs font-semibold text-gray-700 mb-2">Risks</h5>
          <div className="flex flex-wrap gap-1.5">
            {post.risks.map((risk, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded border border-red-200"
              >
                {risk}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-3">
          {post.linkedNews && (
            <span className="text-xs text-gray-500">
              Linked: <a href={post.linkedNews.url} className="text-blue-600 hover:underline">{post.linkedNews.title}</a>
            </span>
          )}
          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            Open in Labs
          </button>
        </div>

        {/* Action Icons */}
        <div className="flex items-center justify-between text-gray-500">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              className="flex items-center space-x-1.5 hover:text-red-500 transition-colors"
              aria-label={`${isLiked ? 'Unlike' : 'Like'} post`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              <span className="text-xs">{post.stats.likes}</span>
            </button>
            <button
              onClick={() => onComment(post.id)}
              className="flex items-center space-x-1.5 hover:text-blue-500 transition-colors"
              aria-label="Comment"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{post.stats.comments}</span>
            </button>
            <button
              onClick={() => onRepost(post.id)}
              className="flex items-center space-x-1.5 hover:text-green-500 transition-colors"
              aria-label="Repost"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-xs">{post.stats.reposts}</span>
            </button>
            <button
              onClick={handleBookmark}
              className="flex items-center space-x-1.5 hover:text-yellow-500 transition-colors"
              aria-label={`${isBookmarked ? 'Remove bookmark' : 'Bookmark'}`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              <span className="text-xs">{post.stats.bookmarks}</span>
            </button>
          </div>
          <span className="text-[10px] text-gray-400">Archived • edits logged</span>
        </div>
      </div>
    </article>
  );
}

