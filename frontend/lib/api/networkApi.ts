import { apiGet } from '@/lib/api/client';

export interface NetworkStats {
  total_predictions: number;
  verified_predictions: number;
  publishing_analysts: number;
  saved_analysts: number;
  saving_investors: number;
}

export async function getNetworkStats(): Promise<NetworkStats> {
  return apiGet<NetworkStats>('/network/stats');
}
