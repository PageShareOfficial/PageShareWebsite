'use client';

import { Check, Share2, Trash2 } from 'lucide-react';
import { Post } from '@/types';

interface PostMenuProps {
  post: Post;
  currentUserHandle?: string;
  onClose: () => void;
  onDelete?: (postId: string) => void;
}

export default function PostMenu({ post, currentUserHandle, onClose, onDelete }: PostMenuProps) {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/${post.author.handle}/posts/${post.id}`);
    onClose();
  };

  return (
    <div className="absolute right-0 top-full mt-2 bg-black border border-white/10 rounded-xl shadow-lg overflow-hidden z-50 min-w-[200px]">
      <button
        onClick={handleCopyLink}
        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-white text-sm"
      >
        <Share2 className="w-4 h-4" />
        <span>Copy link</span>
      </button>
      <button
        onClick={() => {
          // TODO: Implement bookmark
          onClose();
        }}
        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-white text-sm border-t border-white/10"
      >
        <Check className="w-4 h-4" />
        <span>Bookmark</span>
      </button>
      {currentUserHandle && post.author.handle === currentUserHandle && (
        <button
          onClick={() => {
            if (onDelete) {
              onDelete(post.id);
            }
            onClose();
          }}
          className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-red-400 text-sm border-t border-white/10"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>
      )}
      {(!currentUserHandle || post.author.handle !== currentUserHandle) && (
        <>
          <button
            onClick={() => {
              // TODO: Implement mute
              onClose();
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-white text-sm border-t border-white/10"
          >
            <span>Mute @{post.author.handle}</span>
          </button>
          <button
            onClick={() => {
              // TODO: Implement block
              onClose();
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-white text-sm border-t border-white/10"
          >
            <span>Block @{post.author.handle}</span>
          </button>
          <button
            onClick={() => {
              // TODO: Implement report
              onClose();
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-red-400 text-sm border-t border-white/10"
          >
            <span>Report post</span>
          </button>
        </>
      )}
    </div>
  );
}

