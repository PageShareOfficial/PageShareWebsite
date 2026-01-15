'use client';

import { NewsArticle } from '@/types/discover';
import { Calendar } from 'lucide-react';
import { formatTimeAgo } from '@/utils/core/dateUtils';
import CategoryBadge from '../common/CategoryBadge';

interface NewsCardProps {
  article: NewsArticle;
  onArticleClick?: (article: NewsArticle) => void;
}

/**
 * Individual news article card
 * Displays article title, source, image, date, and description
 */
export default function NewsCard({
  article,
  onArticleClick,
}: NewsCardProps) {
  const handleClick = () => {
    if (onArticleClick) {
      onArticleClick(article);
    }
  };



  return (
    <article
      onClick={handleClick}
      className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
    >
      <div className="flex gap-4">
        {/* Image */}
        {article.imageUrl && (
          <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-white/5 relative">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide image container on error
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.style.display = 'none';
                }
              }}
              loading="lazy"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Category Badge */}
          <div className="flex items-center gap-2 mb-2">
            <CategoryBadge category={article.category} size="sm" />
            <span className="text-xs text-gray-400 truncate">{article.source}</span>
          </div>

          {/* Title */}
          <h3 className="text-white font-semibold text-sm md:text-base mb-2 line-clamp-2 hover:underline">
            {article.title}
          </h3>

          {/* Description */}
          {article.description && (
            <p className="text-sm text-gray-400 line-clamp-2 mb-2">
              {article.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatTimeAgo(article.publishedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
