/** Sale price in dollars, rounded to the cent Stripe will charge. */
export function saleDisplayAmount(listAmount: number, percentOff: number): number {
  if (percentOff <= 0 || percentOff >= 100) return listAmount;
  const listCents = Math.round(listAmount * 100);
  const discountedCents = Math.round((listCents * (100 - percentOff)) / 100);
  return discountedCents / 100;
}
