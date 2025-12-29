'use client';

import { X } from 'lucide-react';

interface NewIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewIdeaModal({ isOpen, onClose }: NewIdeaModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">New Idea</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Idea composer will go here...</p>
          {/* Add form fields for creating a new idea */}
        </div>
      </div>
    </div>
  );
}

