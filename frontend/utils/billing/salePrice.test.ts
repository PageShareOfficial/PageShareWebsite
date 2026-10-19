import { describe, expect, it } from 'vitest';
import { saleDisplayAmount } from './salePrice';

describe('saleDisplayAmount', () => {
  it('applies the phase percent to monthly and yearly display prices', () => {
    expect(saleDisplayAmount(79, 15)).toBe(67.15);
    expect(saleDisplayAmount(59, 30)).toBe(41.3);
    expect(saleDisplayAmount(999, 26)).toBe(739.26);
    expect(saleDisplayAmount(799, 27)).toBe(583.27);
  });

  it('leaves the list price alone when the percent is not a discount', () => {
    expect(saleDisplayAmount(79, 0)).toBe(79);
    expect(saleDisplayAmount(79, 100)).toBe(79);
  });
});
