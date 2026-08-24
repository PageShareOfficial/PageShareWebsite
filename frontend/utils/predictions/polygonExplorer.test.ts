import { describe, expect, it } from 'vitest';
import {
  POLYGON_AMOY_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  polygonExplorerTxUrl,
  shouldShowOnChainProof,
} from '@/utils/predictions/polygonExplorer';

describe('polygonExplorerTxUrl', () => {
  it('builds a Polygonscan URL for mainnet', () => {
    expect(polygonExplorerTxUrl(POLYGON_MAINNET_CHAIN_ID, '0xabc')).toBe(
      'https://polygonscan.com/tx/0xabc'
    );
  });

  it('builds an Amoy URL for testnet', () => {
    expect(polygonExplorerTxUrl(POLYGON_AMOY_CHAIN_ID, '0xdef')).toBe(
      'https://amoy.polygonscan.com/tx/0xdef'
    );
  });

  it('returns null when chain or hash is missing', () => {
    expect(polygonExplorerTxUrl(POLYGON_MAINNET_CHAIN_ID, null)).toBeNull();
    expect(polygonExplorerTxUrl(null, '0xabc')).toBeNull();
    expect(polygonExplorerTxUrl(1, '0xabc')).toBeNull();
  });
});

describe('shouldShowOnChainProof', () => {
  it('shows proof only after a confirmed hash', () => {
    expect(
      shouldShowOnChainProof({ anchor_status: 'confirmed', content_hash: 'ab' })
    ).toBe(true);
    expect(
      shouldShowOnChainProof({ anchor_status: 'pending', content_hash: 'ab' })
    ).toBe(false);
    expect(
      shouldShowOnChainProof({ anchor_status: 'confirmed', content_hash: null })
    ).toBe(false);
  });
});
