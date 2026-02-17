'use client';

import { useState } from 'react';
import { TickerDetailData, TickerType } from '@/types/ticker';
import { formatDate } from '@/utils/core/dateUtils';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface TickerOverviewProps {
  data: TickerDetailData;
  type: TickerType;
}

/**
 * Overview component
 * Displays company/coin description and basic info with expand/collapse
 */
export default function TickerOverview({ data }: TickerOverviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const cryptoData = data as import('@/types/ticker').CryptoDetailData;
    const description = cryptoData.description || '';
    const shouldTruncate = description.length > 300;
    const links = cryptoData.links || {};

    return (
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">About {cryptoData.name}</h2>
        
        {/* Description */}
        {description && (
          <div className="mb-6">
            <div 
              className={`text-gray-300 leading-relaxed ${!isExpanded && shouldTruncate ? 'line-clamp-4' : ''}`}
              dangerouslySetInnerHTML={{ __html: description }}
            />
            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 text-sm"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Read Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Read More
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Links */}
        {(links.homepage?.length > 0 || links.whitepaper || links.github || links.blockchainSite?.length > 0) && (
          <div className="pt-4 border-t border-white/10">
            <div className="text-xs text-gray-400 mb-3">Links</div>
            <div className="flex flex-wrap gap-3">
              {links.homepage?.map((url: string, index: number) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Website
                </a>
              ))}
              {links.whitepaper && (
                <a
                  href={links.whitepaper}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Whitepaper
                </a>
              )}
              {links.github && (
                <a
                  href={links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  GitHub
                </a>
              )}
              {links.blockchainSite?.map((url: string, index: number) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Explorer
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
}
