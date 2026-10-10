import { describe, expect, it, vi } from 'vitest';
import {
  navigateToPost,
  navigateToProfile,
  navigateToTicker,
} from '@/utils/core/navigationUtils';

function createRouter() {
  return { push: vi.fn<(path: string) => void>() };
}

describe('navigateToProfile', () => {
  it('pushes the profile path', () => {
    const router = createRouter();
    navigateToProfile('alice', router);
    expect(router.push).toHaveBeenCalledWith('/alice');
  });

  it('does nothing for an empty handle', () => {
    const router = createRouter();
    navigateToProfile('', router);
    expect(router.push).not.toHaveBeenCalled();
  });
});

describe('navigateToTicker', () => {
  it('pushes the ticker path', () => {
    const router = createRouter();
    navigateToTicker('ETH', router);
    expect(router.push).toHaveBeenCalledWith('/ticker/ETH');
  });

  it('does nothing for an empty ticker', () => {
    const router = createRouter();
    navigateToTicker('', router);
    expect(router.push).not.toHaveBeenCalled();
  });
});

describe('navigateToPost', () => {
  it('pushes the post path', () => {
    const router = createRouter();
    navigateToPost('alice', 'post-1', router);
    expect(router.push).toHaveBeenCalledWith('/alice/posts/post-1');
  });

  it('does nothing when the username or post id is missing', () => {
    const router = createRouter();
    navigateToPost('', 'post-1', router);
    navigateToPost('alice', '', router);
    expect(router.push).not.toHaveBeenCalled();
  });
});
