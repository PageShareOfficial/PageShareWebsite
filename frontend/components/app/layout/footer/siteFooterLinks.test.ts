import { describe, expect, it } from 'vitest';
import {
  SITE_FOOTER_LINKS,
  formatPageShareCopyright,
} from '@/components/app/layout/footer/siteFooterLinks';

describe('SITE_FOOTER_LINKS', () => {
  it('includes legal and about routes', () => {
    const labels = SITE_FOOTER_LINKS.map((link) => link.label);
    expect(labels).toContain('Terms of Service');
    expect(labels).toContain('Disclaimer');
    expect(SITE_FOOTER_LINKS.length).toBeGreaterThan(5);
  });
});

describe('formatPageShareCopyright', () => {
  it('formats year', () => {
    expect(formatPageShareCopyright(2025)).toBe('PageShare © 2025');
  });
});