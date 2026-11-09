import { describe, it, expect, vi } from 'vitest';
import {
  formatPaise,
  paiseToRupees,
  rupeesToPaise,
  formatDateIST,
  slugify,
  buildSrcSetString,
} from '../utils';
import { fetchCatalog, fetchTrendingPrograms, fetchProgramPublicDetail } from '../catalog';

describe('Pricing & Currency Helpers (Step 6)', () => {
  it('formats paise correctly into INR currency format', () => {
    expect(formatPaise(0)).toContain('0');
    expect(formatPaise(99900)).toContain('999');
    expect(formatPaise(129900)).toContain('1,299');
    expect(formatPaise(249900)).toContain('2,499');
  });

  it('converts rupees to paise and vice versa accurately', () => {
    expect(rupeesToPaise(999)).toBe(99900);
    expect(paiseToRupees(99900)).toBe(999);
    expect(rupeesToPaise(0)).toBe(0);
    expect(paiseToRupees(0)).toBe(0);
  });
});

describe('IST Date & Slug Helpers', () => {
  it('formats dates in Indian Standard Time (IST)', () => {
    const isoString = '2026-11-14T01:30:00Z'; // 7:00 AM IST
    const formatted = formatDateIST(isoString);
    expect(formatted).toContain('IST');
    expect(formatted).toContain('Nov');
  });

  it('creates clean URL slugs', () => {
    expect(slugify('21-Day Mental Discipline & Focus Sprint!')).toBe(
      '21-day-mental-discipline-focus-sprint'
    );
    expect(slugify('Emotional Calm: Regulating Anxiety Under Stress')).toBe(
      'emotional-calm-regulating-anxiety-under-stress'
    );
  });

  it('builds HTML srcset string from map', () => {
    const srcsetMap = { '480': 'img-480.webp', '960': 'img-960.webp' };
    const srcsetString = buildSrcSetString(srcsetMap);
    expect(srcsetString).toContain('img-480.webp 480w');
    expect(srcsetString).toContain('img-960.webp 960w');
  });
});

describe('Catalog Data Access Fallback Logic', () => {
  it('fetchCatalog gracefully falls back to direct select when RPC does not exist', async () => {
    const mockPrograms = [
      {
        id: 'p1',
        title: 'Mindset Sprint',
        slug: 'mindset-sprint',
        type: 'challenge',
        category: 'mental',
        price_paise: 99900,
        status: 'published',
        max_seats: 50,
      },
    ];

    const mockQueryBuilder = {
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: mockPrograms, count: 1, error: null }),
    };

    const mockSupabase = {
      rpc: vi.fn().mockRejectedValue({ code: 'PGRST202', message: 'Could not find the function get_catalog' }),
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(mockQueryBuilder),
      }),
    };

    const result = await fetchCatalog(mockSupabase as any, { category: 'mental' });
    expect(result.items.length).toBe(1);
    expect(result.items[0].slug).toBe('mindset-sprint');
    expect(result.total_count).toBe(1);
  });

  it('fetchTrendingPrograms falls back and ranks programs', async () => {
    const mockPrograms = [
      { id: 't1', title: 'Trend 1', slug: 'trend-1', max_seats: 100 },
      { id: 't2', title: 'Trend 2', slug: 'trend-2', max_seats: 100 },
    ];

    const mockQueryBuilder = {
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: mockPrograms, error: null }),
    };

    const mockSupabase = {
      rpc: vi.fn().mockRejectedValue({ code: 'PGRST202' }),
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(mockQueryBuilder),
      }),
    };

    const result = await fetchTrendingPrograms(mockSupabase as any, 5);
    expect(result.length).toBe(2);
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(2);
  });

  it('fetchProgramPublicDetail returns null when slug is empty or program is missing', async () => {
    const mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      }),
      auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    };

    const emptyResult = await fetchProgramPublicDetail(mockSupabase as any, '');
    expect(emptyResult).toBeNull();

    const notFoundResult = await fetchProgramPublicDetail(mockSupabase as any, 'unknown-slug');
    expect(notFoundResult).toBeNull();
  });
});
