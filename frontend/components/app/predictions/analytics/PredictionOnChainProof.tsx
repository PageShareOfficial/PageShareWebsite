'use client';

import { ExternalLink, ShieldCheck } from 'lucide-react';
import { polygonExplorerTxUrl } from '@/utils/predictions/polygonExplorer';

interface PredictionOnChainProofProps {
  contentHash: string;
  chainTxHash?: string | null;
  chainId?: number | null;
  explorerUrl?: string | null;
}

export default function PredictionOnChainProof({
  contentHash,
  chainTxHash,
  chainId,
  explorerUrl,
}: PredictionOnChainProofProps) {
  const scanUrl =
    explorerUrl || polygonExplorerTxUrl(chainId, chainTxHash || undefined);

  // When confirmed, show the tx hash — that's what users search on Polygonscan.
  // Fall back to the SHA-256 content hash for pending/submitted states.
  const displayedHash = chainTxHash || contentHash;

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="flex items-center gap-1.5 text-gray-500">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        <p className="text-[11px] font-semibold uppercase tracking-wide">
          On-chain proof
        </p>
      </div>
      <p className="mt-2 break-all font-mono text-xs leading-relaxed text-gray-300">
        {displayedHash}
      </p>
      {scanUrl ? (
        <a
          href={scanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-cyan-300 hover:text-cyan-200"
        >
          View on Polygonscan
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      ) : null}
    </div>
  );
}
