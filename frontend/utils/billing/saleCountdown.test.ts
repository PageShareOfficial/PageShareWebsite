import { describe, expect, it } from 'vitest';
import { formatSaleCountdown, saleFaceClock, saleTimeLeft } from './saleCountdown';

const END = '2026-11-12T00:00:00Z';

describe('saleTimeLeft', () => {
  it('splits the remaining time into days, hours, minutes, and seconds', () => {
    const now = Date.parse('2026-11-10T22:58:58Z');
    expect(saleTimeLeft(END, now)).toEqual({
      days: 1,
      hours: 1,
      minutes: 1,
      seconds: 2,
    });
  });

  it('returns null once the phase has ended', () => {
    expect(saleTimeLeft(END, Date.parse(END))).toBeNull();
    expect(saleTimeLeft('not-a-date', Date.now())).toBeNull();
  });
});

describe('saleFaceClock', () => {
  const startsAt = '2026-11-12T00:00:00Z';
  const endsAt = '2026-11-27T00:00:00Z';

  it('counts down to the start before the phase opens', () => {
    const now = Date.parse('2026-11-10T22:58:58Z');
    expect(saleFaceClock(startsAt, endsAt, now)).toBe('starts in 1d 01h 01m 02s');
  });

  it('counts down to the end while the phase is live', () => {
    const now = Date.parse('2026-11-25T22:58:58Z');
    expect(saleFaceClock(startsAt, endsAt, now)).toBe('1d 01h 01m 02s left');
  });

  it('returns null after the phase ends', () => {
    expect(saleFaceClock(startsAt, endsAt, Date.parse(endsAt))).toBeNull();
    expect(saleFaceClock('bad', endsAt, Date.now())).toBeNull();
  });
});

describe('formatSaleCountdown', () => {
  it('pads hours, minutes, and seconds', () => {
    expect(
      formatSaleCountdown({ days: 12, hours: 4, minutes: 5, seconds: 9 })
    ).toBe('12d 04h 05m 09s');
  });
});
