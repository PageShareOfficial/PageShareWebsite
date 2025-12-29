'use client';

import { X } from 'lucide-react';

interface ManageWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageWatchlistModal({ isOpen, onClose }: ManageWatchlistModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Manage Watchlist</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Watchlist management will go here...</p>
          {/* Add form for managing watchlist */}
        </div>
      </div>
    </div>
  );
}

