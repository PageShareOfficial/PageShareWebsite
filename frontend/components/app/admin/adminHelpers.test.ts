import { describe, expect, it } from 'vitest';
import {
  canRemoveReportedContent,
  getReportTargetHref,
} from '@/components/app/admin/AdminReportCard';
import { buildMetricTiles, formatGrowth } from '@/components/app/admin/AdminMetricsPanel';
import { resolveTickVariant } from '@/components/app/common/AuthorBadges';
import type { AdminReport, MetricsDashboard } from '@/lib/api/adminApi';

function makeReport(overrides: Partial<AdminReport>): AdminReport {
  return {
    id: 'r1',
    status: 'pending',
    report_type: 'spam',
    reason: null,
    created_at: '2026-10-12T00:00:00Z',
    reviewed_at: null,
    reporter_username: 'reporter',
    content_type: 'post',
    content_id: 'p1',
    post_id: 'p1',
    content_preview: 'hello',
    content_deleted: false,
    target_username: 'author',
    ...overrides,
  };
}

describe('resolveTickVariant', () => {
  it('shows the admin tick over any plan tick', () => {
    expect(resolveTickVariant('investor', true)).toBe('admin');
  });

  it('falls back to the plan tick, or none', () => {
    expect(resolveTickVariant('analyst', false)).toBe('analyst');
    expect(resolveTickVariant(undefined, undefined)).toBeNull();
  });
});

describe('getReportTargetHref', () => {
  it('links posts to the post page', () => {
    expect(getReportTargetHref(makeReport({}))).toBe('/author/posts/p1');
  });

  it('links comments to the comment anchor on the parent post', () => {
    const report = makeReport({ content_type: 'comment', content_id: 'c1', post_id: 'p9' });
    expect(getReportTargetHref(report)).toBe('/author/posts/p9#comment-c1');
  });

  it('links user reports to the profile', () => {
    const report = makeReport({ content_type: 'user', post_id: null });
    expect(getReportTargetHref(report)).toBe('/author');
  });

  it('has no link once content is removed or the author is unknown', () => {
    expect(getReportTargetHref(makeReport({ content_deleted: true }))).toBeNull();
    expect(getReportTargetHref(makeReport({ target_username: null }))).toBeNull();
  });
});

describe('canRemoveReportedContent', () => {
  it('allows removing live posts and comments only', () => {
    expect(canRemoveReportedContent(makeReport({}))).toBe(true);
    expect(canRemoveReportedContent(makeReport({ content_type: 'comment' }))).toBe(true);
    expect(canRemoveReportedContent(makeReport({ content_type: 'user' }))).toBe(false);
    expect(canRemoveReportedContent(makeReport({ content_deleted: true }))).toBe(false);
  });
});

describe('admin metrics formatting', () => {
  it('formats fractional growth as signed percent', () => {
    expect(formatGrowth(0.25)).toBe('+25.0%');
    expect(formatGrowth(-0.1)).toBe('-10.0%');
    expect(formatGrowth(undefined)).toBe('—');
  });

  it('builds tiles from the dashboard payload', () => {
    const metrics: MetricsDashboard = {
      user_metrics: { dau: 3, mau: 10, total_users: 1200, new_signups: { this_week: 7 } },
      engagement_metrics: {
        total_posts: 50,
        total_comments: 20,
        total_reactions: 9,
        total_reposts: 1,
      },
      growth_metrics: { user_growth: { week_over_week: 0.5 }, content_growth: {} },
      platform_health: { errors: { total_today: 2 } },
      timestamp: null,
    };
    const tiles = buildMetricTiles(metrics);
    expect(tiles.find((tile) => tile.label === 'Signups this week')?.value).toBe('7');
    expect(tiles.find((tile) => tile.label === 'User growth (WoW)')?.value).toBe('+50.0%');
    expect(tiles.find((tile) => tile.label === 'Content growth (WoW)')?.value).toBe('—');
    expect(tiles.find((tile) => tile.label === 'Critical today')?.value).toBe('0');
  });
});
