'use client';

import { useEffect, useState, useRef } from 'react';
import { ExternalLink, Calendar, Globe, Loader2, X } from 'lucide-react';
import { NewsArticle } from '@/types/discover';
import { formatDateTime } from '@/utils/core/dateUtils';
import CategoryBadge from '@/components/app/common/CategoryBadge';

interface NewsArticleModalProps {
  article: NewsArticle | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal component to display full news article content
 * Shows article in-page instead of opening new tab
 */
export default function NewsArticleModal({
  article,
  isOpen,
  onClose,
}: NewsArticleModalProps) {
  const [articleContent, setArticleContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [useIframe, setUseIframe] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeFailed, setIframeFailed] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      // Try to load article in iframe
      if (article) {
        fetchArticleContent(article.url);
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      setArticleContent(null);
      setContentError(null);
      setUseIframe(false);
      setIframeFailed(false);
    };
  }, [isOpen, article]);

  const fetchArticleContent = async (url: string) => {
    setIsLoadingContent(true);
    setContentError(null);
    setIframeFailed(false);
    
    // Fetch article HTML via Next.js route only (when available).
    // When using backend (NEXT_PUBLIC_API_URL), article content is handled by iframe - no backend call.
    try {
      const response = await fetch(`/api/news/article?url=${encodeURIComponent(url)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.html) {
          // Try to extract readable content from HTML
          const extractedContent = extractReadableContent(data.html);
          if (extractedContent && extractedContent.length > 500) { // Make sure we got substantial content
            setArticleContent(extractedContent);
            setUseIframe(false);
            setIsLoadingContent(false);
            return;
          }
        }
      }
      
      // If extraction failed or API failed, try iframe approach
      const errorData = response.ok ? null : await response.json().catch(() => ({}));
      setUseIframe(true);
      setArticleContent(url);
      if (errorData) {
        setContentError('Could not extract content. Loading article directly...');
      }
    } catch (error) {
      console.error('Error fetching article content:', error);
      // Fallback: try iframe with direct URL
      setUseIframe(true);
      setArticleContent(url);
      setContentError('Could not fetch full content. Loading article directly...');
    }
    
    // Set timeout to stop loading state for iframe approach
    setTimeout(() => {
      setIsLoadingContent(false);
    }, 2000);
  };

  const extractReadableContent = (html: string): string | null => {
    try {
      // Create a temporary DOM element to parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Try to find article content using common selectors
      const articleSelectors = [
        'article',
        '[role="article"]',
        '.article-content',
        '.article-body',
        '.post-content',
        '.entry-content',
        'main article',
        '.content article',
        '#article-body',
        '.story-body',
      ];
      
      let articleElement: Element | null = null;
      
      for (const selector of articleSelectors) {
        articleElement = doc.querySelector(selector);
        if (articleElement) break;
      }
      
      // If no article element found, try to get main content
      if (!articleElement) {
        articleElement = doc.querySelector('main') || doc.querySelector('[role="main"]');
      }
      
      // If still not found, try body
      if (!articleElement) {
        articleElement = doc.body;
      }
      
      if (articleElement) {
        // Remove script, style, nav, header, footer elements
        const unwanted = articleElement.querySelectorAll('script, style, nav, header, footer, .ad, .advertisement, .social-share, .comments');
        unwanted.forEach(el => el.remove());
        
        // Get text content with some HTML structure preserved
        const content = articleElement.innerHTML;
        
        // Clean up the HTML
        const cleaned = content
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<!--[\s\S]*?-->/g, '');
        
        return cleaned || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting content:', error);
      return null;
    }
  };

  if (!isOpen || !article) {
    return null;
  }



  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-black border border-white/10 rounded-xl max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Mobile optimized with close button */}
        <div className="flex items-start justify-between p-4 md:p-6 border-b border-white/10 bg-black/95 backdrop-blur-sm sticky top-0 z-10 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            {/* Date and source - prominently displayed on mobile */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <CategoryBadge category={article.category} size="md" />
                <span className="text-sm text-gray-400 truncate">{article.source}</span>
              </div>
              {/* Date/Time - More visible on mobile */}
              <div className="flex items-center gap-1.5 text-sm md:text-xs text-gray-300 font-medium">
                <Calendar className="w-4 h-4 md:w-3 md:h-3 flex-shrink-0" />
                <span className="whitespace-nowrap">{formatDateTime(article.publishedAt)}</span>
              </div>
            </div>
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white leading-tight pr-2">{article.title}</h2>
          </div>
          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 ml-2"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
          </button>
        </div>

        {/* Image */}
        {article.imageUrl && !useIframe && !iframeFailed && (
          <div className="w-full h-48 md:h-64 lg:h-80 bg-white/5 overflow-hidden flex-shrink-0">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Read Full Article Button - Below Image or Header if no image */}
        {!isLoadingContent && (
          <div className={`px-4 md:px-6 ${article.imageUrl && !useIframe && !iframeFailed ? 'pt-4 pb-2' : 'py-4'} flex-shrink-0 border-b border-white/10`}>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm w-full justify-center"
            >
              <ExternalLink className="w-4 h-4" />
              Read Full Article on {article.source}
            </a>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar min-h-0">
          {isLoadingContent && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
              <p className="text-gray-400 text-sm">Loading article content...</p>
            </div>
          )}

          {contentError && !isLoadingContent && !useIframe && (
            <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-300 text-sm mb-3">{contentError}</p>
            </div>
          )}

          {/* Iframe for full article */}
          {useIframe && articleContent && !isLoadingContent && !iframeFailed && (
            <div className="relative w-full h-[600px] md:h-[700px] border border-white/10 rounded-lg overflow-hidden bg-black mb-4">
              <iframe
                ref={iframeRef}
                src={articleContent}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
                title={article.title}
                onLoad={() => {
                  setIsLoadingContent(false);
                  // Check if iframe actually loaded content (not blocked)
                  try {
                    if (iframeRef.current?.contentWindow) {
                      // Iframe loaded successfully
                      setContentError(null);
                    }
                  } catch (e) {
                    // Cross-origin, likely blocked - that's ok, iframe will show what it can
                  }
                }}
                onError={() => {
                  setIframeFailed(true);
                  setIsLoadingContent(false);
                  setContentError('Could not load article in iframe. Showing article summary instead.');
                }}
              />
            </div>
          )}

          {/* Extracted HTML content */}
          {!useIframe && articleContent && !isLoadingContent && (
            <>
              <style dangerouslySetInnerHTML={{ __html: `
                .article-content-wrapper p { margin-bottom: 1rem; line-height: 1.7; color: #e5e7eb; }
                .article-content-wrapper h1, .article-content-wrapper h2, .article-content-wrapper h3, .article-content-wrapper h4 { color: #ffffff; font-weight: 600; margin-top: 1.5rem; margin-bottom: 1rem; }
                .article-content-wrapper img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1rem 0; }
                .article-content-wrapper a { color: #60a5fa; text-decoration: underline; }
                .article-content-wrapper ul, .article-content-wrapper ol { margin-left: 1.5rem; margin-bottom: 1rem; }
                .article-content-wrapper li { margin-bottom: 0.5rem; }
                .article-content-wrapper blockquote { border-left: 4px solid #60a5fa; padding-left: 1rem; margin: 1rem 0; color: #9ca3af; }
                .article-content-wrapper code { background: rgba(255,255,255,0.1); padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-size: 0.9em; }
                .article-content-wrapper pre { background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0; }
              `}} />
              <div 
                className="article-content-wrapper text-gray-200 text-base md:text-lg leading-relaxed"
                dangerouslySetInnerHTML={{ __html: articleContent }}
              />
            </>
          )}

          {/* Fallback to description if content extraction failed */}
          {!useIframe && !articleContent && !isLoadingContent && article.description && (
            <div className="prose prose-invert max-w-none">
              <div className="text-gray-200 text-base md:text-lg leading-relaxed">
                {article.description.split('\n').filter(p => p.trim()).map((paragraph, index) => (
                  <p key={index} className="mb-4 last:mb-0">
                    {paragraph.trim()}
                  </p>
                ))}
              </div>
            </div>
          )}

          {!isLoadingContent && !articleContent && !article.description && iframeFailed && (
            <div className="text-center py-12 text-gray-400">
              <p>Could not load article content.</p>
            </div>
          )}
        </div>

        {/* Footer - Minimal, just source info */}
        <div className="p-3 md:p-4 border-t border-white/10 bg-black/95 backdrop-blur-sm flex items-center text-xs md:text-sm text-gray-400 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{article.source}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
