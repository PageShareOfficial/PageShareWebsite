'use client';

interface ProfileTabsProps {
  activeTab: 'posts' | 'replies' | 'likes';
  onTabChange: (tab: 'posts' | 'replies' | 'likes') => void;
}

export default function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div className="flex border-b border-white/10">
      <button
        onClick={() => onTabChange('posts')}
        className={`flex-1 px-4 py-4 text-center font-medium transition-colors relative ${
          activeTab === 'posts'
            ? 'text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        Posts
        {activeTab === 'posts' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
        )}
      </button>
      <button
        onClick={() => onTabChange('replies')}
        className={`flex-1 px-4 py-4 text-center font-medium transition-colors relative ${
          activeTab === 'replies'
            ? 'text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        Replies
        {activeTab === 'replies' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
        )}
      </button>
      <button
        onClick={() => onTabChange('likes')}
        className={`flex-1 px-4 py-4 text-center font-medium transition-colors relative ${
          activeTab === 'likes'
            ? 'text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        Likes
        {activeTab === 'likes' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
        )}
      </button>
    </div>
  );
}

