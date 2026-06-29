const CHECKOUT_SUCCESS_PARAM = 'checkout=success';
const CHECKOUT_CANCELED_PARAM = 'checkout=canceled';

export function buildCheckoutReturnUrls(): {
  success_url: string;
  cancel_url: string;
} {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : '';

  return {
    success_url: `${origin}/home?${CHECKOUT_SUCCESS_PARAM}`,
    cancel_url: `${origin}/home?${CHECKOUT_CANCELED_PARAM}`,
  };
}

export type CheckoutReturnStatus = 'success' | 'canceled';

export function getCheckoutReturnStatus(
  searchParams: URLSearchParams
): CheckoutReturnStatus | null {
  const checkout = searchParams.get('checkout');
  if (checkout === 'success' || checkout === 'canceled') {
    return checkout;
  }
  return null;
}

export function clearCheckoutReturnParams(): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  if (!url.searchParams.has('checkout')) return;

  url.searchParams.delete('checkout');
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, '', nextUrl);
}
