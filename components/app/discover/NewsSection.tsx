'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { NewsCategory, NewsArticle } from '@/types/discover';
import { useNewsFeed } from '@/hooks/discover/useNewsFeed';
import NewsCard from './NewsCard';
import NewsArticleModal from './NewsArticleModal';
import Skeleton from '@/components/app/common/Skeleton';
import ErrorState from '@/components/app/common/ErrorState';

interface NewsSectionProps {
  initialCategory?: NewsCategory;
  className?: string;
}

/**
 * News feed container with category tabs
 * Supports infinite scroll and auto-refresh
 * Includes debounced category switching to reduce API calls
 */
export default function NewsSection({
  initialCategory = 'all',
  className = '',
}: NewsSectionProps) {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localCategory, setLocalCategory] = useState<NewsCategory>(initialCategory);
  const [debouncedCategory, setDebouncedCategory] = useState<NewsCategory>(initialCategory);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    articles,
    category,
    setCategory,
    isLoading,
    error,
    hasMore,
    loadMore,
    isSearching,
    refresh,
  } = useNewsFeed({
    category: debouncedCategory,
    autoRefresh: false, // Disabled to control API calls
    refreshInterval: 5 * 60 * 1000,
  });

  // Debounce category changes (500ms delay) - only trigger API call after user stops switching
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedCategory(localCategory);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [localCategory]);

  // Handle category tab click - update UI immediately, API call debounced
  const handleCategoryChange = (newCategory: NewsCategory) => {
    setLocalCategory(newCategory);
  };

  const handleArticleClick = (article: NewsArticle) => {
    setSelectedArticle(article);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedArticle(null);
  };

  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite scroll implementation
  useEffect(() => {
    if (!hasMore || isLoading || isSearching) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isSearching) {
          loadMore();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px' // Start loading when 100px away from bottom
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, isSearching, loadMore]);

  const categories: { value: NewsCategory; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'finance', label: 'Finance' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'politics', label: 'Politics' },
    { value: 'business', label: 'Business' },
    { value: 'technology', label: 'Technology' },
  ];

  return (
    <div className={className}>
      {/* Header with Tabs */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Trending News</h2>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategoryChange(cat.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              localCategory === cat.value || debouncedCategory === cat.value
                ? 'bg-white text-black'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title="Failed to load news"
          message={error}
          onRetry={() => refresh()}
          className="py-8"
        />
      )}

      {/* Loading State (Initial) - Skeleton Loaders */}
      {isLoading && articles.length === 0 && !error && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <article
              key={`skeleton-${index}`}
              className="p-4 bg-white/5 border border-white/10 rounded-xl"
            >
              <div className="flex gap-4">
                {/* Image skeleton */}
                <Skeleton variant="rectangular" width={128} height={128} rounded="rounded-lg" className="flex-shrink-0 hidden md:block" />
                <Skeleton variant="rectangular" width={96} height={96} rounded="rounded-lg" className="flex-shrink-0 md:hidden" />
                {/* Content skeleton */}
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Category + Source skeleton */}
                  <div className="flex items-center gap-2">
                    <Skeleton variant="text" width={64} height={16} />
                    <Skeleton variant="text" width={96} height={16} />
                  </div>
                  {/* Title skeleton */}
                  <div className="space-y-2">
                    <Skeleton variant="text" width="100%" height={16} />
                    <Skeleton variant="text" width="75%" height={16} />
                  </div>
                  {/* Description skeleton */}
                  <div className="space-y-2">
                    <Skeleton variant="text" width="100%" height={12} />
                    <Skeleton variant="text" width="83%" height={12} />
                  </div>
                  {/* Date skeleton */}
                  <Skeleton variant="text" width={80} height={12} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* News Articles */}
      {articles.length > 0 && (
        <div className="space-y-4">
          {articles.map((article) => (
            <NewsCard 
              key={article.id} 
              article={article}
              onArticleClick={handleArticleClick}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && articles.length === 0 && !error && (
        <div className="text-center py-12 text-gray-400">
          <p>No news articles found</p>
          <p className="text-sm mt-2 text-gray-500">
            Try refreshing or selecting a different category
          </p>
        </div>
      )}

      {/* Loading More Indicator */}
      {isLoading && articles.length > 0 && (
        <div className="text-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      {hasMore && !isLoading && articles.length > 0 && (
        <div ref={observerTarget} className="h-20 flex items-center justify-center py-4">
          <p className="text-sm text-gray-500">Scroll down for more articles...</p>
        </div>
      )}

      {/* No More Articles */}
      {!hasMore && articles.length > 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No more articles to load
        </div>
      )}

      {/* Article Modal */}
      <NewsArticleModal
        article={selectedArticle}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
