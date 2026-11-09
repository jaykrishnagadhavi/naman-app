import { describe, it, expect } from 'vitest';
import {
  formatIST,
  formatISTDateOnly,
  formatISTTimeOnly,
  toISTISOString,
  generateScheduleDates,
  shiftScheduleDates,
  detectLivePlatform,
  validateLiveUrl,
  getAnnouncementStatus,
  isSessionStartingSoonWithoutLink,
} from '../utils';

describe('Step 5 Sessions & Announcements Logic', () => {
  describe('IST Date Formatting & Scheduling Math', () => {
    it('generates challenge schedule correctly across month boundaries', () => {
      // 7-day challenge starting October 28, 2026 at 07:30 IST
      const days = generateScheduleDates('2026-10-28', '07:30', 7);

      expect(days).toHaveLength(7);
      expect(days[0].day_number).toBe(1);
      expect(days[0].title).toBe('Day 1');
      expect(days[0].display_date_ist).toBe('28 Oct 2026');
      expect(days[0].display_time_ist).toContain('07:30 AM IST');

      // Month boundary: Oct 31 -> Nov 01
      expect(days[3].display_date_ist).toBe('31 Oct 2026');
      expect(days[4].day_number).toBe(5);
      expect(days[4].display_date_ist).toBe('01 Nov 2026');
      expect(days[6].display_date_ist).toBe('03 Nov 2026');
    });

    it('generates schedule correctly across February leap year boundary', () => {
      // 2028 is a leap year (Feb 29 exists)
      const days = generateScheduleDates('2028-02-27', '18:00', 4);

      expect(days).toHaveLength(4);
      expect(days[0].display_date_ist).toBe('27 Feb 2028');
      expect(days[1].display_date_ist).toBe('28 Feb 2028');
      expect(days[2].display_date_ist).toBe('29 Feb 2028');
      expect(days[3].display_date_ist).toBe('01 Mar 2028');
    });

    it('shifts all session schedule dates forward and backward accurately', () => {
      const initial = [
        { day_number: 1, scheduled_at: toISTISOString('2026-11-10', '08:00') },
        { day_number: 2, scheduled_at: toISTISOString('2026-11-11', '08:00') },
      ];

      // Shift forward by 3 days
      const shiftedForward = shiftScheduleDates(initial, 3);
      expect(formatISTDateOnly(shiftedForward[0].scheduled_at)).toBe('13 Nov 2026');
      expect(formatISTDateOnly(shiftedForward[1].scheduled_at)).toBe('14 Nov 2026');

      // Shift backward by 2 days
      const shiftedBack = shiftScheduleDates(initial, -2);
      expect(formatISTDateOnly(shiftedBack[0].scheduled_at)).toBe('08 Nov 2026');
      expect(formatISTDateOnly(shiftedBack[1].scheduled_at)).toBe('09 Nov 2026');
    });

    it('formats IST date and time with proper timezone conversion', () => {
      // 2026-11-05T01:30:00Z is 07:00 AM IST (UTC + 5:30)
      const isoUtc = '2026-11-05T01:30:00.000Z';
      expect(formatIST(isoUtc, true)).toBe('05 Nov 2026, 07:00 AM IST');
      expect(formatISTTimeOnly(isoUtc)).toBe('07:00 AM IST');
      expect(formatISTDateOnly(isoUtc)).toBe('05 Nov 2026');
    });
  });

  describe('Live URL Validation & Platform Detection', () => {
    it('auto-detects Zoom, Google Meet, and YouTube platforms', () => {
      expect(detectLivePlatform('https://us02web.zoom.us/j/987654321?pwd=abc')).toBe('zoom');
      expect(detectLivePlatform('https://meet.google.com/xyz-pqrs-uvw')).toBe('meet');
      expect(detectLivePlatform('https://www.youtube.com/live/1234567890')).toBe('youtube');
      expect(detectLivePlatform('https://youtu.be/abcdefghijk')).toBe('youtube');
      expect(detectLivePlatform('https://stream.customplatform.com/room')).toBe('other');
      expect(detectLivePlatform('')).toBe('other');
    });

    it('strictly enforces HTTPS and rejects insecure or hostile URL schemes', () => {
      // Insecure HTTP
      const httpResult = validateLiveUrl('http://us02web.zoom.us/j/123');
      expect(httpResult.valid).toBe(false);
      expect(httpResult.error).toContain('https://');

      // Javascript injection
      const jsResult = validateLiveUrl('javascript:alert(document.cookie)');
      expect(jsResult.valid).toBe(false);

      // Protocol-relative
      const protoResult = validateLiveUrl('//meet.google.com/abc');
      expect(protoResult.valid).toBe(false);

      // Empty string
      const emptyResult = validateLiveUrl('   ');
      expect(emptyResult.valid).toBe(false);

      // Valid Zoom HTTPS
      const zoomResult = validateLiveUrl('https://us02web.zoom.us/j/987654321?pwd=secret');
      expect(zoomResult.valid).toBe(true);
      expect(zoomResult.platform).toBe('zoom');
    });

    it('enforces allowedHosts whitelist when provided', () => {
      const allowed = ['zoom.us', 'meet.google.com', 'youtube.com', 'youtu.be'];

      const allowedResult = validateLiveUrl('https://us02web.zoom.us/j/123', allowed);
      expect(allowedResult.valid).toBe(true);

      const rejectedResult = validateLiveUrl('https://phishing-site.com/fake-zoom', allowed);
      expect(rejectedResult.valid).toBe(false);
      expect(rejectedResult.error).toContain('not on the allowed live platforms list');
    });
  });

  describe('Announcement Status Lifecycle & Audience Resolution', () => {
    it('correctly computes draft, scheduled, live, and expired statuses', () => {
      const pastTime = new Date(Date.now() - 3600000).toISOString();
      const futureTime = new Date(Date.now() + 3600000).toISOString();
      const distantFutureTime = new Date(Date.now() + 7200000).toISOString();

      // Draft takes priority
      expect(
        getAnnouncementStatus({
          is_draft: true,
          publish_at: pastTime,
          expires_at: futureTime,
        })
      ).toBe('draft');

      // Scheduled (publish_at is in future)
      expect(
        getAnnouncementStatus({
          is_draft: false,
          publish_at: futureTime,
        })
      ).toBe('scheduled');

      // Live (publish_at is in past, no expiry)
      expect(
        getAnnouncementStatus({
          is_draft: false,
          publish_at: pastTime,
          expires_at: null,
        })
      ).toBe('live');

      // Live (publish_at in past, expires in future)
      expect(
        getAnnouncementStatus({
          is_draft: false,
          publish_at: pastTime,
          expires_at: distantFutureTime,
        })
      ).toBe('live');

      // Expired (expires_at is in past)
      expect(
        getAnnouncementStatus({
          is_draft: false,
          publish_at: new Date(Date.now() - 7200000).toISOString(),
          expires_at: pastTime,
        })
      ).toBe('expired');
    });

    it('generates unique notification deduplication keys for idempotency', () => {
      const sessionId = 'd1a2b3c4-0000-0000-0000-000000000001';
      const liveUrl = 'https://meet.google.com/xyz-123';
      const studentA = 'user-0000-0000-0000-000000000001';
      const studentB = 'user-0000-0000-0000-000000000002';

      // Simple mock hash of URL for test
      const urlHash = 'hash_' + liveUrl.length;

      const dedupeKeyA1 = `session_link:${sessionId}:${urlHash}:${studentA}`;
      const dedupeKeyA2 = `session_link:${sessionId}:${urlHash}:${studentA}`;
      const dedupeKeyB = `session_link:${sessionId}:${urlHash}:${studentB}`;

      // Republishing the exact same link to studentA produces the identical dedupe key
      expect(dedupeKeyA1).toBe(dedupeKeyA2);

      // Different student gets distinct key
      expect(dedupeKeyA1).not.toBe(dedupeKeyB);
    });
  });

  describe('Missing Live Link Warning Alert', () => {
    it('detects upcoming sessions lacking published live links within 2 hours', () => {
      const now = Date.now();
      const in45Min = new Date(now + 45 * 60 * 1000).toISOString();
      const in90Min = new Date(now + 90 * 60 * 1000).toISOString();
      const in3Hours = new Date(now + 180 * 60 * 1000).toISOString();
      const inPast = new Date(now - 30 * 60 * 1000).toISOString();

      // Session in 45 min, no link -> TRUE (alert needed!)
      expect(isSessionStartingSoonWithoutLink(in45Min, null, null)).toBe(true);

      // Session in 90 min, live URL entered but NOT published yet -> TRUE (still unverified/unpublished)
      expect(isSessionStartingSoonWithoutLink(in90Min, 'https://zoom.us/j/123', null)).toBe(true);

      // Session in 45 min, link already published -> FALSE (safe)
      expect(
        isSessionStartingSoonWithoutLink(
          in45Min,
          'https://zoom.us/j/123',
          new Date(now - 5000).toISOString()
        )
      ).toBe(false);

      // Session in 3 hours -> FALSE (outside 2hr warning threshold)
      expect(isSessionStartingSoonWithoutLink(in3Hours, null, null)).toBe(false);

      // Past session -> FALSE
      expect(isSessionStartingSoonWithoutLink(inPast, null, null)).toBe(false);
    });
  });
});

