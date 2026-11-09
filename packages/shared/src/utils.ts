import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Converts Indian Rupees to integer paise.
 * Example: 2999 -> 299900 paise
 */
export function rupeesToPaise(rupees: number): number {
  if (isNaN(rupees) || rupees < 0) return 0;
  return Math.round(rupees * 100);
}

/**
 * Converts integer paise to Indian Rupees.
 * Example: 299900 -> 2999
 */
export function paiseToRupees(paise: number): number {
  if (isNaN(paise) || paise < 0) return 0;
  return Math.round(paise) / 100;
}

/**
 * Formats integer paise into a human-readable Indian Rupee string.
 * Example: 99900 paise -> ₹999
 */
export function formatPaise(paise: number): string {
  const rupees = Math.floor(paise / 100);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(rupees);
}

/**
 * Formats rupees directly into a human-readable Indian Rupee string.
 */
export function formatRupees(rupees: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(rupees);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Converts an arbitrary title into a clean, URL-safe slug.
 * Example: "21-Day Mental Discipline & Focus Sprint!" -> "21-day-mental-discipline-focus-sprint"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
    .replace(/[\s_-]+/g, '-')  // Replace spaces, underscores and multiple dashes with single dash
    .replace(/^-+|-+$/g, '');  // Strip leading and trailing dashes
}

/**
 * Formats an ISO date/timestamp into human-readable IST with label.
 * Example: "2026-11-14T01:30:00Z" -> "14 Nov 2026, 07:00 AM IST"
 */
export function formatDateIST(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '—';

    const formatted = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);

    return `${formatted} IST`;
  } catch {
    return '—';
  }
}

/**
 * Inspects file header magic bytes to detect real image MIME type.
 * Blocks spoofed extensions (.jpg on an .exe).
 */
export function detectImageMimeType(
  bytes: Uint8Array | number[] | ArrayBuffer
): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  const arr = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (arr.length < 12) return null;

  // JPEG: FF D8 FF
  if (arr[0] === 0xff && arr[1] === 0xd8 && arr[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    arr[0] === 0x89 &&
    arr[1] === 0x50 &&
    arr[2] === 0x4e &&
    arr[3] === 0x47 &&
    arr[4] === 0x0d &&
    arr[5] === 0x0a &&
    arr[6] === 0x1a &&
    arr[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
  // 'R' 'I' 'F' 'F' = 0x52, 0x49, 0x46, 0x46
  // 'W' 'E' 'B' 'P' = 0x57, 0x45, 0x42, 0x50
  if (
    arr[0] === 0x52 &&
    arr[1] === 0x49 &&
    arr[2] === 0x46 &&
    arr[3] === 0x46 &&
    arr[8] === 0x57 &&
    arr[9] === 0x45 &&
    arr[10] === 0x42 &&
    arr[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

/**
 * Builds HTML srcset string from a JSON srcset map.
 * Example: {"480": "url1", "960": "url2"} -> "url1 480w, url2 960w"
 */
export function buildSrcSetString(
  srcsetMap?: Record<string, string> | null
): string | undefined {
  if (!srcsetMap || Object.keys(srcsetMap).length === 0) return undefined;
  return Object.entries(srcsetMap)
    .sort(([w1], [w2]) => Number(w1) - Number(w2))
    .map(([width, url]) => `${url} ${width}w`)
    .join(', ');
}

export interface PublishChecklistItem {
  id: string;
  label: string;
  description: string;
  passed: boolean;
}

export interface PublishChecklistResult {
  canPublish: boolean;
  items: PublishChecklistItem[];
  failedCount: number;
}

/**
 * Evaluates the required publish checklist before a program can be published.
 * Validates metadata, pricing, image uploads, and schedule dates per brand rules.
 */
export function evaluatePublishChecklist(program: {
  title?: string | null;
  slug?: string | null;
  short_description?: string | null;
  description?: string | null;
  category?: string | null;
  price_paise?: number | null;
  thumbnail_url?: string | null;
  thumbnail_alt?: string | null;
  poster_image_url?: string | null;
  poster_image_alt?: string | null;
  type?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  learning_outcomes?: string[] | null;
  faqs?: Array<{ question: string; answer: string }> | null;
}): PublishChecklistResult {
  const isChallenge = program.type === 'challenge';

  const items: PublishChecklistItem[] = [
    {
      id: 'title',
      label: 'Program Title',
      description: 'Clear, compelling title for the challenge or course',
      passed: Boolean(program.title && program.title.trim().length >= 3),
    },
    {
      id: 'slug',
      label: 'Unique URL Slug',
      description: 'Clean URL path for students to find this program',
      passed: Boolean(program.slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(program.slug)),
    },
    {
      id: 'category',
      label: 'Growth Pillar',
      description: 'Must belong to Emotional, Mental, Academic, or Personal',
      passed: Boolean(program.category && ['emotional', 'mental', 'academic', 'personal'].includes(program.category)),
    },
    {
      id: 'short_description',
      label: 'Short Description',
      description: '10 to 160 characters for catalog cards and previews',
      passed: Boolean(
        program.short_description &&
        program.short_description.trim().length >= 10 &&
        program.short_description.trim().length <= 160
      ),
    },
    {
      id: 'description',
      label: 'Full Description',
      description: 'Comprehensive curriculum overview and guidance',
      passed: Boolean(program.description && program.description.trim().length >= 10),
    },
    {
      id: 'price',
      label: 'Program Pricing',
      description: 'A valid price in Rupees or set to 0 (free)',
      passed: typeof program.price_paise === 'number' && program.price_paise >= 0,
    },
    {
      id: 'thumbnail',
      label: '16:9 Thumbnail Image',
      description: 'Card preview image for catalog grids',
      passed: Boolean(program.thumbnail_url && program.thumbnail_url.trim().length > 0),
    },
    {
      id: 'poster',
      label: '2:3 Poster Image',
      description: 'Streaming-style poster for rails and Trending shelf',
      passed: Boolean(program.poster_image_url && program.poster_image_url.trim().length > 0),
    },
    {
      id: 'learning_outcomes',
      label: 'What You Will Learn',
      description: 'At least 3 clear key learning takeaways',
      passed: Boolean(
        program.learning_outcomes &&
        program.learning_outcomes.filter((item) => item && item.trim().length > 0).length >= 3
      ),
    },
    {
      id: 'faqs',
      label: 'Frequently Asked Questions',
      description: 'At least 1 helpful question and answer pair',
      passed: Boolean(
        program.faqs &&
        program.faqs.filter((f) => f.question && f.question.trim().length > 0 && f.answer && f.answer.trim().length > 0).length >= 1
      ),
    },
  ];

  if (isChallenge) {
    const hasStarts = Boolean(program.starts_at);
    const hasEnds = Boolean(program.ends_at);
    const validDates = hasStarts && hasEnds && new Date(program.ends_at!).getTime() > new Date(program.starts_at!).getTime();

    items.push({
      id: 'dates',
      label: 'Challenge Dates (IST)',
      description: 'Start and end dates with end after start',
      passed: validDates,
    });
  }

  const failedCount = items.filter((item) => !item.passed).length;
  const canPublish = failedCount === 0;

  return {
    canPublish,
    items,
    failedCount,
  };
}

// ============================================================================
// Step 5 Utilities: IST Time, Schedules, Live URLs & Announcements
// ============================================================================

/**
 * Formats any date string or Date object in Indian Standard Time (IST).
 * Example: "05 Nov 2026, 07:30 PM IST"
 */
export function formatIST(date: string | Date, includeTime = true): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const formatted = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }
      : {}),
  }).format(d);

  const normalized = formatted.replace(/am|pm/i, (m) => m.toUpperCase());
  return normalized + (includeTime ? ' IST' : '');
}

/**
 * Formats only the time in IST.
 * Example: "07:30 PM IST"
 */
export function formatISTTimeOnly(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const formatted = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);

  return formatted.replace(/am|pm/i, (m) => m.toUpperCase()) + ' IST';
}

/**
 * Formats only the date in IST.
 * Example: "05 Nov 2026"
 */
export function formatISTDateOnly(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Combines YYYY-MM-DD and HH:mm in IST into a standard UTC ISO string.
 */
export function toISTISOString(dateStr: string, timeStr = '07:00'): string {
  return new Date(`${dateStr}T${timeStr}:00+05:30`).toISOString();
}

export interface GeneratedScheduleDay {
  day_number: number;
  title: string;
  scheduled_at: string;
  display_date_ist: string;
  display_time_ist: string;
}

/**
 * Generates an array of challenge session days starting from startDateStr (YYYY-MM-DD).
 * Correctly crosses month and leap year boundaries.
 */
export function generateScheduleDates(
  startDateStr: string,
  dailyTimeIST: string,
  totalDays: number
): GeneratedScheduleDay[] {
  const [yearStr, monthStr, dayStr] = startDateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed
  const day = parseInt(dayStr, 10);

  const results: GeneratedScheduleDay[] = [];

  for (let i = 0; i < totalDays; i++) {
    const targetDate = new Date(Date.UTC(year, month, day + i));
    const y = targetDate.getUTCFullYear();
    const m = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getUTCDate()).padStart(2, '0');
    const isoDateStr = `${y}-${m}-${d}`;

    const scheduledAt = new Date(`${isoDateStr}T${dailyTimeIST}:00+05:30`).toISOString();

    results.push({
      day_number: i + 1,
      title: `Day ${i + 1}`,
      scheduled_at: scheduledAt,
      display_date_ist: formatISTDateOnly(scheduledAt),
      display_time_ist: formatISTTimeOnly(scheduledAt),
    });
  }

  return results;
}

/**
 * Shifts session scheduled_at timestamps by N days.
 */
export function shiftScheduleDates<T extends { scheduled_at: string }>(
  sessions: T[],
  shiftDays: number
): T[] {
  return sessions.map((s) => {
    const original = new Date(s.scheduled_at);
    const shifted = new Date(original.getTime() + shiftDays * 24 * 60 * 60 * 1000);
    return {
      ...s,
      scheduled_at: shifted.toISOString(),
    };
  });
}

/**
 * Auto-detects video conferencing platform from live URL.
 */
export function detectLivePlatform(url: string): 'zoom' | 'meet' | 'youtube' | 'other' {
  if (!url || typeof url !== 'string') return 'other';
  const lower = url.trim().toLowerCase();
  if (lower.includes('zoom.us')) return 'zoom';
  if (lower.includes('meet.google.com')) return 'meet';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  return 'other';
}

/**
 * Validates that live URLs use HTTPS, are syntactically valid, and optionally belong to allowed hosts.
 */
export function validateLiveUrl(
  url: string,
  allowedHosts?: string[]
): { valid: boolean; error?: string; platform: 'zoom' | 'meet' | 'youtube' | 'other' } {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { valid: false, error: 'Live URL cannot be empty', platform: 'other' };
  }
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://')) {
    return {
      valid: false,
      error: 'Live URL must start with https:// for student safety',
      platform: 'other',
    };
  }

  try {
    const parsed = new URL(trimmed);
    const platform = detectLivePlatform(trimmed);

    if (allowedHosts && allowedHosts.length > 0) {
      const host = parsed.hostname.toLowerCase();
      const isAllowed = allowedHosts.some(
        (allowed) => host === allowed.toLowerCase() || host.endsWith('.' + allowed.toLowerCase())
      );
      if (!isAllowed) {
        return {
          valid: false,
          error: `Host "${host}" is not on the allowed live platforms list (${allowedHosts.join(', ')})`,
          platform,
        };
      }
    }

    return { valid: true, platform };
  } catch {
    return { valid: false, error: 'Invalid URL format', platform: 'other' };
  }
}

/**
 * Resolves the computed lifecycle status of an announcement.
 */
export function getAnnouncementStatus(announcement: {
  is_draft?: boolean;
  publish_at: string;
  expires_at?: string | null;
}): 'draft' | 'scheduled' | 'live' | 'expired' {
  if (announcement.is_draft) return 'draft';
  const now = new Date();
  const publishAt = new Date(announcement.publish_at);
  if (now < publishAt) return 'scheduled';
  if (announcement.expires_at) {
    const expiresAt = new Date(announcement.expires_at);
    if (now >= expiresAt) return 'expired';
  }
  return 'live';
}

/**
 * Checks whether a scheduled session starts within the next N minutes (default 2 hours)
 * and is currently missing a verified published live link.
 */
export function isSessionStartingSoonWithoutLink(
  scheduledAt: string,
  liveUrl?: string | null,
  linkPublishedAt?: string | null,
  windowMinutes = 120
): boolean {
  if (liveUrl && linkPublishedAt) return false;
  const now = Date.now();
  const sessionTime = new Date(scheduledAt).getTime();
  const windowMs = windowMinutes * 60 * 1000;

  // Session is in the future and within the warning window
  return sessionTime >= now && sessionTime <= now + windowMs;
}



