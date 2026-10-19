import { apiGet } from '@/lib/api/client';

/** False when this account already paid, or the check cannot be completed. */
export async function getSaleEligibility(accessToken: string): Promise<boolean> {
  try {
    const response = await apiGet<{ eligible: boolean }>(
      '/billing/sale-eligibility',
      accessToken
    );
    return response.eligible;
  } catch {
    return false;
  }
}
