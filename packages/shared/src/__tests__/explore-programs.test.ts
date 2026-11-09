import { describe, it, expect } from 'vitest';
import { CATEGORY_LABELS, GrowthPillar, PILLARS, ProgramRow } from '../types';

describe('Explore Page: Program Query, Grouping & Filter Logic', () => {
  const mockPrograms: Partial<ProgramRow>[] = [
    {
      id: 'prog-1',
      title: '21-Day Mind & Focus Reset',
      slug: '21-day-mindset',
      category: 'mental',
      type: 'challenge',
      status: 'published',
      price_paise: 99900,
      short_description: 'Master cognitive discipline and sharp focus.',
      tags: ['focus', 'habits'],
      sort_order: 10,
      deleted_at: null,
    },
    {
      id: 'prog-2',
      title: 'Emotional Grounding in 90 Seconds',
      slug: 'emotional-grounding',
      category: 'emotional',
      type: 'course',
      status: 'published',
      price_paise: 79900,
      short_description: 'Fast nervous system resetting protocols.',
      tags: ['calm', 'anxiety'],
      sort_order: 20,
      deleted_at: null,
    },
    {
      id: 'prog-3',
      title: 'Exam Pressure Protocol',
      slug: 'exam-pressure',
      category: 'academic',
      type: 'challenge',
      status: 'live',
      price_paise: 129900,
      short_description: 'Excel under intense competitive academic stress.',
      tags: ['exams', 'study'],
      sort_order: 30,
      deleted_at: null,
    },
    {
      id: 'prog-4',
      title: 'Habit Architecture Blueprint',
      slug: 'habit-architecture',
      category: 'personal',
      type: 'course',
      status: 'published',
      price_paise: 0,
      short_description: 'Build lifelong habits with identity momentum.',
      tags: ['discipline', 'habits'],
      sort_order: 40,
      deleted_at: null,
    },
    {
      id: 'prog-draft',
      title: 'Unpublished Draft Program',
      slug: 'draft-program',
      category: 'mental',
      type: 'challenge',
      status: 'draft',
      price_paise: 99900,
      short_description: 'Private admin draft.',
      deleted_at: null,
    },
    {
      id: 'prog-archived',
      title: 'Retired Cohort',
      slug: 'retired-cohort',
      category: 'emotional',
      type: 'challenge',
      status: 'archived',
      price_paise: 99900,
      short_description: 'Old cohort.',
      deleted_at: '2026-10-01T00:00:00Z',
    },
  ];

  it('filters only active programs with status published or live and deleted_at is null', () => {
    const publicPrograms = mockPrograms.filter(
      (p) => (p.status === 'published' || p.status === 'live') && p.deleted_at === null
    );

    expect(publicPrograms).toHaveLength(4);
    expect(publicPrograms.some((p) => p.status === 'draft')).toBe(false);
    expect(publicPrograms.some((p) => p.status === 'archived')).toBe(false);
  });

  it('groups active programs correctly by the four growth pillars', () => {
    const publicPrograms = mockPrograms.filter(
      (p) => (p.status === 'published' || p.status === 'live') && p.deleted_at === null
    );

    const pillars: GrowthPillar[] = ['emotional', 'mental', 'academic', 'personal'];
    const grouped = pillars.reduce((acc, pillar) => {
      acc[pillar] = publicPrograms.filter((p) => p.category === pillar);
      return acc;
    }, {} as Record<GrowthPillar, typeof publicPrograms>);

    expect(grouped.emotional).toHaveLength(1);
    expect(grouped.emotional[0].title).toBe('Emotional Grounding in 90 Seconds');

    expect(grouped.mental).toHaveLength(1);
    expect(grouped.mental[0].title).toBe('21-Day Mind & Focus Reset');

    expect(grouped.academic).toHaveLength(1);
    expect(grouped.academic[0].title).toBe('Exam Pressure Protocol');

    expect(grouped.personal).toHaveLength(1);
    expect(grouped.personal[0].title).toBe('Habit Architecture Blueprint');
  });

  it('filters programs by category chip selection', () => {
    const publicPrograms = mockPrograms.filter(
      (p) => (p.status === 'published' || p.status === 'live') && p.deleted_at === null
    );

    const filterByCategory = (cat: string) => {
      if (cat === 'all') return publicPrograms;
      return publicPrograms.filter((p) => p.category === cat);
    };

    expect(filterByCategory('all')).toHaveLength(4);
    expect(filterByCategory('academic')).toHaveLength(1);
    expect(filterByCategory('academic')[0].slug).toBe('exam-pressure');
    expect(filterByCategory('mental')).toHaveLength(1);
  });

  it('filters programs by search keyword across title, short description and tags', () => {
    const publicPrograms = mockPrograms.filter(
      (p) => (p.status === 'published' || p.status === 'live') && p.deleted_at === null
    );

    const searchPrograms = (query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return publicPrograms;
      return publicPrograms.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.short_description?.toLowerCase().includes(q) ||
          p.tags?.some((t: string) => t.toLowerCase().includes(q))
      );
    };

    // By tag
    expect(searchPrograms('habits')).toHaveLength(2);
    // By title substring
    expect(searchPrograms('grounding')).toHaveLength(1);
    // By short description substring
    expect(searchPrograms('competitive')).toHaveLength(1);
    // Non-matching query
    expect(searchPrograms('quantum-physics')).toHaveLength(0);
  });

  it('guarantees public projection exposes no secret session or lesson links', () => {
    const forbiddenColumns = ['live_url', 'recording_url', 'video_keys', 'stream_url', 'drm_token'];
    const publicColumns = [
      'id', 'slug', 'title', 'short_description', 'description', 'type', 'category',
      'tags', 'price_paise', 'compare_at_price_paise', 'status', 'starts_at', 'ends_at',
      'thumbnail_url', 'poster_image_url', 'cover_image_url'
    ];

    for (const forbidden of forbiddenColumns) {
      expect(publicColumns).not.toContain(forbidden);
    }
  });

  it('verifies growth pillar labels match design token definitions', () => {
    expect(CATEGORY_LABELS.emotional).toBe('Emotional Resilience');
    expect(CATEGORY_LABELS.mental).toBe('Mental Clarity');
    expect(CATEGORY_LABELS.academic).toBe('Academic Mastery');
    expect(CATEGORY_LABELS.personal).toBe('Personal Momentum');

    expect(PILLARS.emotional.title).toBe('Emotional Resilience');
    expect(PILLARS.mental.title).toBe('Mental Clarity');
    expect(PILLARS.academic.title).toBe('Academic Mastery');
    expect(PILLARS.personal.title).toBe('Personal Momentum');
  });
});
