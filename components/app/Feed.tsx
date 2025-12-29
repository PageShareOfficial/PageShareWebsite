'use client';

import { Filter, Plus } from 'lucide-react';
import { useState } from 'react';
import PostCard from './PostCard';
import { Post, FeedTab } from '@/types';

interface FeedProps {
  posts: Post[];
  onNewIdeaClick: () => void;
  onLike: (postId: string) => void;
  onBookmark: (postId: string) => void;
  onRepost: (postId: string) => void;
  onComment: (postId: string) => void;
}

export default function Feed({
  posts,
  onNewIdeaClick,
  onLike,
  onBookmark,
  onRepost,
  onComment,
}: FeedProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>('For you');

  const tabs: FeedTab[] = ['For you', 'Following', 'Outcomes'];

  return (
    <main className="flex-1 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Home</h1>
        <p className="text-sm text-gray-500">Feed blends discovery + credibility signals.</p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        {/* Tabs */}
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-current={activeTab === tab ? 'page' : undefined}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
            aria-label="Filters"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          <button
            onClick={onNewIdeaClick}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center space-x-2 md:hidden"
          >
            <Plus className="w-4 h-4" />
            <span>New Idea</span>
          </button>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4" role="feed" aria-label="Post feed">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={onLike}
            onBookmark={onBookmark}
            onRepost={onRepost}
            onComment={onComment}
          />
        ))}
      </div>
    </main>
  );
}

