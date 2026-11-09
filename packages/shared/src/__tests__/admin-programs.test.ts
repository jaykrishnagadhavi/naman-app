import { describe, it, expect } from 'vitest';
import {
  rupeesToPaise,
  paiseToRupees,
  formatRupees,
  slugify,
  evaluatePublishChecklist,
  detectImageMimeType,
} from '../utils';

describe('Admin Programs: Price Conversion and Formatting', () => {
  it('correctly converts rupees to paise', () => {
    expect(rupeesToPaise(0)).toBe(0);
    expect(rupeesToPaise(999)).toBe(99900);
    expect(rupeesToPaise(1499.50)).toBe(149950);
    expect(rupeesToPaise(49.99)).toBe(4999);
  });

  it('correctly converts paise to rupees', () => {
    expect(paiseToRupees(0)).toBe(0);
    expect(paiseToRupees(99900)).toBe(999);
    expect(paiseToRupees(149950)).toBe(1499.5);
    expect(paiseToRupees(4999)).toBe(49.99);
  });

  it('guarantees round-trip mathematical integrity', () => {
    const testPrices = [0, 1, 99, 499, 999, 1499, 2999, 49999];
    for (const price of testPrices) {
      expect(paiseToRupees(rupeesToPaise(price))).toBe(price);
    }
  });

  it('formats rupees with currency symbol and locale grouping', () => {
    expect(formatRupees(0)).toBe('₹0');
    expect(formatRupees(999)).toBe('₹999');
    expect(formatRupees(1499)).toBe('₹1,499');
    expect(formatRupees(250000)).toBe('₹2,50,000');
  });
});

describe('Admin Programs: Slug Generation & Sanitization', () => {
  it('converts titles into clean, lowercase hyphenated slugs', () => {
    expect(slugify('21-Day Mind & Emotion Mastery')).toBe('21-day-mind-emotion-mastery');
    expect(slugify('Habit Architecture 101')).toBe('habit-architecture-101');
  });

  it('strips hostile, special, and punctuation characters', () => {
    expect(slugify('Hello! World @ 2026? & Co.')).toBe('hello-world-2026-co');
    expect(slugify('Course: "Mastering Focus" (v2.0)')).toBe('course-mastering-focus-v20');
  });

  it('collapses multiple hyphens and trims leading/trailing hyphens', () => {
    expect(slugify('   ---Leading and Trailing---   ')).toBe('leading-and-trailing');
    expect(slugify('Multiple     Spaces    And --- Hyphens')).toBe('multiple-spaces-and-hyphens');
  });
});

describe('Admin Programs: Publish Checklist Validation', () => {
  const fullyValidChallenge = {
    title: '21-Day Emotional Mastery Challenge',
    slug: '21-day-emotional-mastery',
    category: 'emotional',
    short_description: 'Transform anxiety and reactivity into deep presence and quiet emotional strength.',
    description: '<p>Comprehensive 21-day syllabus with daily live sessions and practical micro-tasks.</p>',
    type: 'challenge',
    price_paise: 99900,
    starts_at: '2026-12-01T06:00:00.000Z',
    ends_at: '2026-12-21T07:00:00.000Z',
    thumbnail_url: 'https://storage.example.com/programs/123/thumbnail.webp',
    poster_image_url: 'https://storage.example.com/programs/123/poster.webp',
    learning_outcomes: [
      'Master autonomic nervous system calming techniques',
      'Build daily progressive habit accountability',
      'Neutralize emotional overwhelm in real time',
    ],
    faqs: [
      {
        question: 'Are sessions recorded?',
        answer: 'Yes, all enrolled students receive 24/7 recording replays.',
      },
    ],
  };

  it('passes completely for a fully configured challenge', () => {
    const result = evaluatePublishChecklist(fullyValidChallenge);
    expect(result.canPublish).toBe(true);
    expect(result.failedCount).toBe(0);
    expect(result.items.every((i) => i.passed)).toBe(true);
  });

  it('fails when title is missing or too short', () => {
    const result = evaluatePublishChecklist({ ...fullyValidChallenge, title: 'No' });
    expect(result.canPublish).toBe(false);
    const titleCheck = result.items.find((i) => i.id === 'title');
    expect(titleCheck?.passed).toBe(false);
  });

  it('fails when slug is invalid', () => {
    const result = evaluatePublishChecklist({ ...fullyValidChallenge, slug: 'Invalid Slug with Spaces!' });
    expect(result.canPublish).toBe(false);
    const slugCheck = result.items.find((i) => i.id === 'slug');
    expect(slugCheck?.passed).toBe(false);
  });

  it('fails when category is not one of the four growth pillars', () => {
    const result = evaluatePublishChecklist({ ...fullyValidChallenge, category: 'gaming' });
    expect(result.canPublish).toBe(false);
    const catCheck = result.items.find((i) => i.id === 'category');
    expect(catCheck?.passed).toBe(false);
  });

  it('validates short description length strictly between 10 and 160 characters', () => {
    // Too short (< 10)
    const tooShort = evaluatePublishChecklist({ ...fullyValidChallenge, short_description: 'Too short' });
    expect(tooShort.items.find((i) => i.id === 'short_description')?.passed).toBe(false);

    // Too long (> 160)
    const tooLong = evaluatePublishChecklist({
      ...fullyValidChallenge,
      short_description: 'A'.repeat(161),
    });
    expect(tooLong.items.find((i) => i.id === 'short_description')?.passed).toBe(false);

    // Exactly 160 characters: valid
    const exact160 = evaluatePublishChecklist({
      ...fullyValidChallenge,
      short_description: 'A'.repeat(160),
    });
    expect(exact160.items.find((i) => i.id === 'short_description')?.passed).toBe(true);
  });

  it('allows free programs with price_paise = 0', () => {
    const freeProg = evaluatePublishChecklist({ ...fullyValidChallenge, price_paise: 0 });
    expect(freeProg.items.find((i) => i.id === 'price')?.passed).toBe(true);
    expect(freeProg.canPublish).toBe(true);
  });

  it('fails when thumbnail or poster image is missing', () => {
    const noThumb = evaluatePublishChecklist({ ...fullyValidChallenge, thumbnail_url: '' });
    expect(noThumb.canPublish).toBe(false);
    expect(noThumb.items.find((i) => i.id === 'thumbnail')?.passed).toBe(false);

    const noPoster = evaluatePublishChecklist({ ...fullyValidChallenge, poster_image_url: null });
    expect(noPoster.canPublish).toBe(false);
    expect(noPoster.items.find((i) => i.id === 'poster')?.passed).toBe(false);
  });

  it('validates challenge dates (must have starts_at, ends_at, and ends_at > starts_at)', () => {
    // Missing ends_at
    const noEnds = evaluatePublishChecklist({ ...fullyValidChallenge, ends_at: null });
    expect(noEnds.items.find((i) => i.id === 'dates')?.passed).toBe(false);

    // Ends before starts
    const invalidOrder = evaluatePublishChecklist({
      ...fullyValidChallenge,
      starts_at: '2026-12-20T00:00:00.000Z',
      ends_at: '2026-12-10T00:00:00.000Z',
    });
    expect(invalidOrder.items.find((i) => i.id === 'dates')?.passed).toBe(false);
  });

  it('does not require schedule dates for self-paced courses', () => {
    const course = {
      ...fullyValidChallenge,
      type: 'course',
      starts_at: null,
      ends_at: null,
    };
    const result = evaluatePublishChecklist(course);
    expect(result.items.find((i) => i.id === 'dates')).toBeUndefined();
    expect(result.canPublish).toBe(true);
  });

  it('requires at least 3 learning outcomes', () => {
    const twoOutcomes = evaluatePublishChecklist({
      ...fullyValidChallenge,
      learning_outcomes: ['Point 1', 'Point 2'],
    });
    expect(twoOutcomes.canPublish).toBe(false);
    expect(twoOutcomes.items.find((i) => i.id === 'learning_outcomes')?.passed).toBe(false);
  });

  it('requires at least 1 valid FAQ question and answer', () => {
    const emptyFaq = evaluatePublishChecklist({
      ...fullyValidChallenge,
      faqs: [],
    });
    expect(emptyFaq.canPublish).toBe(false);
    expect(emptyFaq.items.find((i) => i.id === 'faqs')?.passed).toBe(false);
  });
});

describe('Admin Programs: Image Magic Bytes Verification', () => {
  it('identifies JPEG headers (FF D8 FF)', () => {
    const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    expect(detectImageMimeType(jpegHeader)).toBe('image/jpeg');
  });

  it('identifies PNG headers (89 50 4E 47 0D 0A 1A 0A)', () => {
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    expect(detectImageMimeType(pngHeader)).toBe('image/png');
  });

  it('identifies WebP headers (RIFF .... WEBP)', () => {
    const webpHeader = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x24, 0x00, 0x00, 0x00, // length
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    expect(detectImageMimeType(webpHeader)).toBe('image/webp');
  });

  it('rejects renamed Windows PE executables (4D 5A "MZ" header)', () => {
    const exeHeader = new Uint8Array([
      0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00,
    ]);
    expect(detectImageMimeType(exeHeader)).toBeNull();
  });

  it('rejects XML / SVG markup disguised as images', () => {
    const svgHeader = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg">');
    expect(detectImageMimeType(svgHeader)).toBeNull();
  });

  it('rejects buffers smaller than 12 bytes', () => {
    const shortBuffer = new Uint8Array([0xff, 0xd8, 0xff]);
    expect(detectImageMimeType(shortBuffer)).toBeNull();
  });
});
