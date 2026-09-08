export const POLYGON_MAINNET_CHAIN_ID = 137;
export const POLYGON_AMOY_CHAIN_ID = 80002;

const EXPLORER_TX_URLS: Record<number, string> = {
  [POLYGON_MAINNET_CHAIN_ID]: 'https://polygonscan.com/tx/{tx}',
  [POLYGON_AMOY_CHAIN_ID]: 'https://amoy.polygonscan.com/tx/{tx}',
};

export function polygonExplorerTxUrl(
  chainId: number | null | undefined,
  txHash: string | null | undefined
): string | null {
  if (chainId == null || !txHash) {
    return null;
  }
  const template = EXPLORER_TX_URLS[chainId];
  if (!template) {
    return null;
  }
  return template.replace('{tx}', txHash);
}

export function shouldShowOnChainProof(prediction: {
  anchor_status?: string | null;
  content_hash?: string | null;
}): boolean {
  return prediction.anchor_status === 'confirmed' && Boolean(prediction.content_hash);
}
