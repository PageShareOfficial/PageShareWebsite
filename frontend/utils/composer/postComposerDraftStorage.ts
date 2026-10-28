const DRAFT_KEY = 'postComposerState';
const NAV_FLAG_KEY = 'postComposerNavFlag';

export interface PostComposerDraft {
  postText?: string;
  selectedGif?: string | null;
  showPoll?: boolean;
  pollOptions?: string[];
  pollDuration?: number;
}

/** Mark this tab as soft-navigated so the next mount can restore a draft. */
export function markPostComposerNavigation(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(NAV_FLAG_KEY, 'true');
}

/**
 * Restore draft after soft nav; clear it on hard refresh (no nav flag).
 */
export function loadPostComposerDraft(): PostComposerDraft | null {
  if (typeof window === 'undefined') return null;

  const navigationFlag = sessionStorage.getItem(NAV_FLAG_KEY);
  if (!navigationFlag) {
    sessionStorage.removeItem(DRAFT_KEY);
    sessionStorage.setItem(NAV_FLAG_KEY, 'true');
    return null;
  }

  const saved = sessionStorage.getItem(DRAFT_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved) as PostComposerDraft;
  } catch {
    sessionStorage.removeItem(DRAFT_KEY);
    return null;
  }
}

export function savePostComposerDraft(draft: PostComposerDraft): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearPostComposerDraft(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(DRAFT_KEY);
}
