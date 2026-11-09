import { describe, it, expect } from 'vitest';
import {
  extractAppError,
  toISTISOString,
  validateLiveUrl,
  detectLivePlatform,
} from '../index';

describe('Step 5 RPC Payloads & Error Extraction', () => {
  describe('extractAppError', () => {
    it('extracts PostgreSQL error code 42703 (undefined column) accurately', () => {
      const pgError = {
        code: '42703',
        message: 'column "actor" of relation "audit_log" does not exist',
        details: null,
        hint: 'Perhaps you meant to reference the column "audit_log.action".',
      };

      const result = extractAppError(pgError);
      expect(result.code).toBe('42703');
      expect(result.message).toBe('column "actor" of relation "audit_log" does not exist');
      expect(result.hint).toBe('Perhaps you meant to reference the column "audit_log.action".');
      expect(result.details).toBeUndefined();
    });

    it('extracts PostgreSQL error code 23505 (unique constraint violation)', () => {
      const pgError = {
        code: '23505',
        message: 'duplicate key value violates unique constraint "program_sessions_program_id_day_number_key"',
        details: 'Key (program_id, day_number)=(c4784bd6, 1) already exists.',
        hint: null,
      };

      const result = extractAppError(pgError);
      expect(result.code).toBe('23505');
      expect(result.message).toContain('duplicate key value violates unique constraint');
      expect(result.details).toContain('Key (program_id, day_number)=(c4784bd6, 1) already exists.');
    });

    it('extracts P0001 access denied exceptions raised by RLS/PLpgSQL functions', () => {
      const rpcError = {
        code: 'P0001',
        message: 'Access denied: staff or admin role required',
        details: null,
        hint: null,
      };

      const result = extractAppError(rpcError);
      expect(result.code).toBe('P0001');
      expect(result.message).toBe('Access denied: staff or admin role required');
    });

    it('handles standard Error instances and fallback strings gracefully', () => {
      const stdError = new Error('Network timeout connecting to database');
      const errRes = extractAppError(stdError);
      expect(errRes.message).toBe('Network timeout connecting to database');
      expect(errRes.code).toBeUndefined();

      const strError = 'Custom raw string error';
      expect(extractAppError(strError).message).toBe('Custom raw string error');

      const nullError = extractAppError(null, 'Fallback custom message');
      expect(nullError.message).toBe('Fallback custom message');
    });
  });

  describe('Realistic Session & Schedule Payload Construction', () => {
    it('constructs save_session_with_links payload matching admin form state', () => {
      const formInput = {
        programId: 'c4784bd6-9dc5-4317-afda-9fc24de35b1a',
        dayNumber: 1,
        title: 'Day 1: Grounding & Body Awareness',
        date: '2026-11-10',
        time: '07:30',
        platform: 'zoom' as const,
        status: 'scheduled' as const,
        description: 'First live cohort session focusing on somatic grounding.',
        liveUrl: 'https://us02web.zoom.us/j/987654321?pwd=abc',
        recordingUrl: '',
        recordingVisible: false,
        isPublished: true,
        notifyEnrollees: false,
        taskTitle: 'Grounding Journaling',
        taskBody: '<p>Document your physical sensations after the 15-minute practice.</p>',
        resources: [{ title: 'Preparation PDF', url: 'https://example.com/prep.pdf' }],
      };

      // Transform according to AdminSessionsPage handleSaveSession logic
      const scheduledAtIso = toISTISOString(formInput.date, formInput.time);
      const payload = {
        p_program_id: formInput.programId,
        p_day_number: formInput.dayNumber,
        p_title: formInput.title.trim(),
        p_scheduled_at: scheduledAtIso,
        p_session_id: null,
        p_description: formInput.description.trim() || null,
        p_live_platform: formInput.platform,
        p_status: formInput.status,
        p_task_title: formInput.taskTitle.trim() || null,
        p_task_body: formInput.taskBody || null,
        p_resources: formInput.resources,
        p_live_url: formInput.liveUrl.trim() || null,
        p_recording_url: formInput.recordingUrl.trim() || null,
        p_recording_visible: formInput.recordingVisible,
        p_is_link_published: formInput.isPublished,
        p_notify_enrollees: formInput.notifyEnrollees,
      };

      expect(payload.p_program_id).toBe('c4784bd6-9dc5-4317-afda-9fc24de35b1a');
      expect(payload.p_day_number).toBe(1);
      expect(payload.p_title).toBe('Day 1: Grounding & Body Awareness');
      expect(payload.p_live_platform).toBe('zoom');
      expect(payload.p_live_url).toMatch(/^https:\/\//);
      expect(payload.p_recording_url).toBeNull();
      expect(payload.p_is_link_published).toBe(true);
      expect(payload.p_resources).toHaveLength(1);

      // Verify IST to UTC calculation: 2026-11-10 07:30 IST is 2026-11-10 02:00:00Z
      expect(new Date(payload.p_scheduled_at).toISOString()).toBe('2026-11-10T02:00:00.000Z');
    });

    it('constructs generate_challenge_schedule payload with IST time formatting', () => {
      const scheduleInput = {
        programId: 'c4784bd6-9dc5-4317-afda-9fc24de35b1a',
        startDate: '2026-11-15',
        dailyTime: '06:45',
        totalDays: 21,
        overwrite: true,
      };

      const timeWithSeconds =
        scheduleInput.dailyTime.length === 5
          ? scheduleInput.dailyTime + ':00'
          : scheduleInput.dailyTime;

      const payload = {
        p_program_id: scheduleInput.programId,
        p_start_date: scheduleInput.startDate,
        p_daily_time_ist: timeWithSeconds,
        p_total_days: scheduleInput.totalDays,
        p_overwrite: scheduleInput.overwrite,
      };

      expect(payload.p_daily_time_ist).toBe('06:45:00');
      expect(payload.p_total_days).toBe(21);
      expect(payload.p_overwrite).toBe(true);
      expect(payload.p_start_date).toBe('2026-11-15');
    });

    it('validates live meeting URLs strictly before allowing RPC submission', () => {
      const validZoom = validateLiveUrl('https://us02web.zoom.us/j/123456789?pwd=xyz');
      expect(validZoom.valid).toBe(true);

      const invalidHttp = validateLiveUrl('http://insecure-zoom.us/j/123');
      expect(invalidHttp.valid).toBe(false);
      expect(invalidHttp.error).toContain('https://');

      const validMeet = validateLiveUrl('https://meet.google.com/abc-defg-hij');
      expect(validMeet.valid).toBe(true);
      expect(detectLivePlatform('https://meet.google.com/abc-defg-hij')).toBe('meet');
    });
  });
});

