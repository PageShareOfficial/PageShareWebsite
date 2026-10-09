// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSafeBack } from '@/hooks/common/useSafeBack';
import { canGoBackInApp } from '@/utils/core/navigationHistory';

const router = { back: vi.fn(), replace: vi.fn() };

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}));

vi.mock('@/utils/core/navigationHistory', () => ({
  canGoBackInApp: vi.fn(),
}));

const mockedCanGoBackInApp = vi.mocked(canGoBackInApp);

beforeEach(() => {
  router.back.mockClear();
  router.replace.mockClear();
});

afterEach(() => {
  mockedCanGoBackInApp.mockReset();
});

describe('useSafeBack', () => {
  it('goes back when there is an earlier in-app page', () => {
    mockedCanGoBackInApp.mockReturnValue(true);
    const { result } = renderHook(() => useSafeBack());

    result.current();

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('replaces with /home when the user landed directly', () => {
    mockedCanGoBackInApp.mockReturnValue(false);
    const { result } = renderHook(() => useSafeBack());

    result.current();

    expect(router.replace).toHaveBeenCalledWith('/home');
    expect(router.back).not.toHaveBeenCalled();
  });

  it('uses a custom fallback path when given', () => {
    mockedCanGoBackInApp.mockReturnValue(false);
    const { result } = renderHook(() => useSafeBack('/predictions'));

    result.current();

    expect(router.replace).toHaveBeenCalledWith('/predictions');
  });
});
