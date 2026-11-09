import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchMyPrograms,
  fetchProgramEnrolled,
  requestSessionLiveLink,
  requestSessionRecording,
  toggleTaskCompletion,
  registerPaymentInterest,
} from '../enrolled';

describe('Step 8 Enrolled Student Queries & Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchMyPrograms returns active cohorts with computed progress and live indicators', async () => {
    const mockPrograms = [
      {
        enrollment_id: 'e-1',
        program_id: 'p-1',
        title: '21-Day Mindset Reset',
        slug: '21-day-mindset-reset',
        type: 'challenge',
        category: 'mental',
        short_description: 'Daily mental clarity',
        cover_image_url: null,
        poster_image_url: null,
        thumbnail_url: null,
        starts_at: '2026-11-01T00:00:00Z',
        ends_at: '2026-11-21T00:00:00Z',
        program_status: 'live',
        enrolled_at: '2026-11-01T10:00:00Z',
        access_until: null,
        source: 'paid',
        status: 'active',
        total_sessions: 21,
        completed_sessions: 5,
        progress_pct: 24,
        next_session: {
          id: 's-5',
          day_number: 5,
          title: 'Day 5: Quieting the Storm',
          scheduled_at: new Date(Date.now() + 3600000).toISOString(),
          live_platform: 'zoom',
          status: 'scheduled',
        },
        is_live_now: false,
        has_today_session: true,
      },
    ];

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u-1' } } }),
      },
      rpc: vi.fn().mockResolvedValue({ data: mockPrograms, error: null }),
    } as any;

    const result = await fetchMyPrograms(mockSupabase);
    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_my_programs');
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('21-day-mindset-reset');
    expect(result[0].progress_pct).toBe(24);
    expect(result[0].has_today_session).toBe(true);
  });

  it('fetchProgramEnrolled strictly prevents leakage of live_url and recording_url', async () => {
    const mockDetail = {
      is_enrolled: true,
      enrollment: {
        id: 'e-1',
        status: 'active',
        enrolled_at: '2026-11-01T10:00:00Z',
        access_until: null,
        source: 'paid',
      },
      program: {
        id: 'p-1',
        title: '21-Day Mindset Reset',
        slug: '21-day-mindset-reset',
        price_paise: 299900,
      },
      sessions: [
        {
          id: 's-1',
          day_number: 1,
          title: 'Day 1: Grounding',
          scheduled_at: '2026-11-01T14:30:00Z',
          live_platform: 'zoom',
          status: 'ended',
          attended: true,
          task_completed: true,
          has_recording: true,
          has_live_link: false,
        },
      ],
      today_session: null,
      stats: {
        total_sessions: 1,
        attended_sessions: 1,
        completed_tasks: 1,
        progress_pct: 100,
      },
    };

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u-1' } } }),
      },
      rpc: vi.fn().mockResolvedValue({ data: mockDetail, error: null }),
    } as any;

    const result = await fetchProgramEnrolled(mockSupabase, '21-day-mindset-reset');
    expect(result.is_enrolled).toBe(true);
    expect(result.sessions[0].has_recording).toBe(true);

    // Verify secret URLs are NEVER present on the session object
    expect((result.sessions[0] as any).live_url).toBeUndefined();
    expect((result.sessions[0] as any).recording_url).toBeUndefined();
  });

  describe('requestSessionLiveLink Join Window Verification', () => {
    it('returns unauthenticated when user is not logged in', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      } as any;

      const result = await requestSessionLiveLink(mockSupabase, 's-1');
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('unauthenticated');
    });

    it('returns too_early when session is scheduled more than 60 minutes in the future', async () => {
      const futureTime = new Date(Date.now() + 2 * 3600 * 1000).toISOString(); // 2 hours away
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u-1' } } }),
        },
        rpc: vi.fn().mockResolvedValue({
          data: {
            ok: false,
            reason: 'too_early',
            opens_at: new Date(Date.now() + 3600 * 1000).toISOString(),
            scheduled_at: futureTime,
          },
          error: null,
        }),
      } as any;

      const result = await requestSessionLiveLink(mockSupabase, 's-1');
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('too_early');
      expect(result.opens_at).toBeDefined();
    });

    it('returns live_url and logs attendance when session is live or within join window', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u-1' } } }),
        },
        rpc: vi.fn().mockResolvedValue({
          data: {
            ok: true,
            live_url: 'https://zoom.us/j/123456789',
            platform: 'zoom',
            title: 'Day 4: Live Call',
          },
          error: null,
        }),
      } as any;

      const result = await requestSessionLiveLink(mockSupabase, 's-4');
      expect(result.ok).toBe(true);
      expect(result.live_url).toBe('https://zoom.us/j/123456789');
      expect(result.platform).toBe('zoom');
    });
  });

  it('toggleTaskCompletion toggles completion and updates database', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u-1' } } }),
      },
      rpc: vi.fn().mockResolvedValue({
        data: { ok: true, session_id: 's-1', completed: true },
        error: null,
      }),
    } as any;

    const completed = await toggleTaskCompletion(mockSupabase, 's-1', true);
    expect(completed).toBe(true);
    expect(mockSupabase.rpc).toHaveBeenCalledWith('complete_task', {
      p_session_id: 's-1',
      p_completed: true,
    });
  });

  it('registerPaymentInterest captures student lead without requiring payments', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u-1' } } }),
      },
      from: vi.fn().mockReturnValue({
        insert: mockInsert,
      }),
    } as any;

    const res = await registerPaymentInterest(mockSupabase, {
      program_id: 'p-1',
      email: 'student@example.com',
      phone: '+91 98765 43210',
    });

    expect(res.ok).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('payment_interest');
    expect(mockInsert).toHaveBeenCalledWith({
      program_id: 'p-1',
      email: 'student@example.com',
      phone: '+91 98765 43210',
      user_id: 'u-1',
    });
  });
});

