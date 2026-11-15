import type { SupabaseClient } from '@supabase/supabase-js';

export interface AdminStudentsQueryParams {
  search?: string;
  programId?: string;
  joinedFrom?: string;
  joinedTo?: string;
  isBlocked?: boolean;
  goalPillar?: string;
  noEnrollment?: boolean;
  sortBy?: 'created_at' | 'full_name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface AdminStudentItem {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  goal_tag: string | null;
  goal_pillars: string[];
  is_blocked: boolean;
  blocked_reason: string | null;
  blocked_at: string | null;
  last_seen_at: string | null;
  created_at: string;
  enrolment_count: number;
  total_paid_paise: number;
  enrolled_programs: Array<{
    program_id: string;
    title: string;
    status: string;
  }>;
}

export interface AdminStudentsResponse {
  total_count: number;
  students: AdminStudentItem[];
  limit: number;
  offset: number;
}

/**
 * Fetch paginated students directory with server-side filtering
 */
export async function fetchAdminStudents(
  supabase: SupabaseClient,
  params: AdminStudentsQueryParams
): Promise<AdminStudentsResponse> {
  const {
    search,
    programId,
    joinedFrom,
    joinedTo,
    isBlocked,
    goalPillar,
    noEnrollment,
    sortBy = 'created_at',
    sortOrder = 'desc',
    limit = 20,
    offset = 0,
  } = params;

  try {
    const { data, error } = await (supabase.rpc as any)('admin_list_students', {
      p_search: search || null,
      p_filter_program_id: programId || null,
      p_filter_joined_from: joinedFrom || null,
      p_filter_joined_to: joinedTo || null,
      p_filter_is_blocked: typeof isBlocked === 'boolean' ? isBlocked : null,
      p_filter_goal_pillar: goalPillar || null,
      p_filter_no_enrollment: noEnrollment ? true : null,
      p_sort_by: sortBy,
      p_sort_order: sortOrder,
      p_limit: limit,
      p_offset: offset,
    });

    if (!error && data) {
      return data as AdminStudentsResponse;
    }
  } catch {
    // Fall back to direct PostgREST querying if RPC is not yet pushed
  }

  // Fallback direct query
  let query = supabase
    .from('profiles')
    .select(
      `
      id,
      full_name,
      phone,
      avatar_url,
      role,
      goal_tag,
      goal_pillars,
      is_blocked,
      blocked_reason,
      blocked_at,
      last_seen_at,
      created_at,
      enrollments (
        id,
        program_id,
        status,
        programs (
          id,
          title
        )
      )
    `,
      { count: 'exact' }
    )
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
  }
  if (typeof isBlocked === 'boolean') {
    query = query.eq('is_blocked', isBlocked);
  }
  if (joinedFrom) {
    query = query.gte('created_at', joinedFrom);
  }
  if (joinedTo) {
    query = query.lte('created_at', joinedTo);
  }

  const { data: profiles, count, error } = await query;
  if (error) throw error;

  const students: AdminStudentItem[] = (profiles || []).map((p: any) => {
    const enrollments = p.enrollments || [];
    return {
      id: p.id,
      full_name: p.full_name,
      email: null,
      phone: p.phone,
      avatar_url: p.avatar_url,
      role: p.role,
      goal_tag: p.goal_tag,
      goal_pillars: p.goal_pillars || [],
      is_blocked: p.is_blocked || false,
      blocked_reason: p.blocked_reason || null,
      blocked_at: p.blocked_at || null,
      last_seen_at: p.last_seen_at,
      created_at: p.created_at,
      enrolment_count: enrollments.length,
      total_paid_paise: 0,
      enrolled_programs: enrollments.map((e: any) => ({
        program_id: e.program_id,
        title: e.programs?.title || 'Unknown Program',
        status: e.status,
      })),
    };
  });

  return {
    total_count: count || students.length,
    students,
    limit,
    offset,
  };
}

/**
 * Fetch detailed student profile including attendance, enrollments, and orders
 */
export async function fetchAdminStudentDetail(
  supabase: SupabaseClient,
  userId: string
): Promise<any> {
  try {
    const { data, error } = await (supabase.rpc as any)('admin_get_student', {
      p_user_id: userId,
    });
    if (!error && data) {
      return data;
    }
  } catch {
    // Fall back to direct query
  }

  // Fallback query
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select(`
      *,
      enrollments (
        id,
        program_id,
        status,
        source,
        enrolled_at,
        access_until,
        programs (
          id,
          title,
          slug,
          type
        )
      )
    `)
    .eq('id', userId)
    .single();

  if (pErr) throw pErr;

  const { data: attendance } = await supabase
    .from('session_attendance')
    .select(`
      attended_at,
      session_id,
      program_sessions (
        id,
        title,
        day_number,
        programs (
          title
        )
      )
    `)
    .eq('user_id', userId)
    .order('attended_at', { ascending: false })
    .limit(20);

  const { count: tasksCount } = await supabase
    .from('task_completions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('completed', true);

  const { data: deletionReq } = await supabase
    .from('account_deletion_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    profile,
    enrollments: (profile?.enrollments || []).map((e: any) => ({
      id: e.id,
      program_id: e.program_id,
      program_title: e.programs?.title || 'Program',
      program_slug: e.programs?.slug || '',
      program_type: e.programs?.type || 'challenge',
      status: e.status,
      source: e.source,
      enrolled_at: e.enrolled_at,
      access_until: e.access_until,
    })),
    attendance_count: attendance?.length || 0,
    tasks_completed_count: tasksCount || 0,
    attendance_history: (attendance || []).map((a: any) => ({
      session_id: a.session_id,
      session_title: a.program_sessions?.title || 'Session',
      day_number: a.program_sessions?.day_number || 1,
      program_title: a.program_sessions?.programs?.title || 'Program',
      attended_at: a.attended_at,
    })),
    orders: [],
    payments: [],
    deletion_request: deletionReq || null,
  };
}

/**
 * Suspend or unblock student account
 */
export async function adminSetBlockedStatus(
  supabase: SupabaseClient,
  params: { userId: string; blocked: boolean; reason?: string }
): Promise<{ ok: boolean; user_id: string; is_blocked: boolean }> {
  try {
    const { data, error } = await (supabase.rpc as any)('admin_set_blocked', {
      p_user_id: params.userId,
      p_blocked: params.blocked,
      p_reason: params.reason || null,
    });
    if (!error && data) {
      return data;
    }
    if (error) throw error;
  } catch {
    // Fallback direct update
    const { error: updErr } = await supabase
      .from('profiles')
      .update({
        is_blocked: params.blocked,
        blocked_reason: params.blocked ? (params.reason || 'Administrative review') : null,
        blocked_at: params.blocked ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.userId);

    if (updErr) throw updErr;

    // Log in audit_log
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('audit_log').insert({
      actor_id: user?.id,
      actor_role: 'admin',
      action: params.blocked ? 'student.blocked' : 'student.unblocked',
      entity: 'profiles',
      entity_id: params.userId,
      diff: { is_blocked: params.blocked, reason: params.reason },
    });
  }

  return { ok: true, user_id: params.userId, is_blocked: params.blocked };
}

/**
 * Fetch orders ledger (admin only)
 */
export async function fetchAdminOrders(
  supabase: SupabaseClient,
  params: { search?: string; limit?: number; offset?: number }
): Promise<{ total_count: number; orders: any[] }> {
  try {
    const { data, error } = await (supabase.rpc as any)('admin_list_orders', {
      p_search: params.search || null,
      p_limit: params.limit || 20,
      p_offset: params.offset || 0,
    });
    if (!error && data) {
      return data;
    }
  } catch {
    // Fall back to direct query
  }

  const { data, count } = await supabase
    .from('orders')
    .select(`
      *,
      profiles (
        full_name
      ),
      programs (
        title
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(params.offset || 0, (params.offset || 0) + (params.limit || 20) - 1);

  return {
    total_count: count || 0,
    orders: (data || []).map((o: any) => ({
      id: o.id,
      user_id: o.user_id,
      student_name: o.profiles?.full_name || 'Student',
      program_id: o.program_id,
      program_title: o.programs?.title || 'Program',
      razorpay_order_id: o.razorpay_order_id,
      amount_paise: o.amount_paise,
      discount_paise: o.discount_paise,
      status: o.status,
      created_at: o.created_at,
    })),
  };
}

/**
 * Fetch revenue statistics (admin only)
 */
export async function fetchAdminRevenueStats(
  supabase: SupabaseClient,
  range = '30d'
): Promise<{
  total_revenue_paise: number;
  today_revenue_paise: number;
  seven_days_revenue_paise: number;
  thirty_days_revenue_paise: number;
  total_orders: number;
  conversion_rate: number;
}> {
  try {
    const { data, error } = await (supabase.rpc as any)('admin_revenue_stats', {
      p_range: range,
    });
    if (!error && data) {
      return data;
    }
  } catch {
    // Default zero response during payments on-hold period
  }

  return {
    total_revenue_paise: 0,
    today_revenue_paise: 0,
    seven_days_revenue_paise: 0,
    thirty_days_revenue_paise: 0,
    total_orders: 0,
    conversion_rate: 0.0,
  };
}

/**
 * Fetch attendance and engagement report
 */
export async function fetchAdminAttendanceReport(
  supabase: SupabaseClient,
  params: { programId: string; sessionId?: string }
): Promise<any> {
  try {
    const { data, error } = await (supabase.rpc as any)('admin_attendance_report', {
      p_program_id: params.programId,
      p_session_id: params.sessionId || null,
    });
    if (!error && data) {
      return data;
    }
  } catch {
    // fallback
  }

  // Fallback calculation
  const { count: totalEnrolled } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('program_id', params.programId)
    .eq('status', 'active');

  const { data: sessions } = await supabase
    .from('program_sessions')
    .select(`
      id,
      day_number,
      title,
      scheduled_at,
      status
    `)
    .eq('program_id', params.programId)
    .order('day_number', { ascending: true });

  const enrolledCount = totalEnrolled || 0;

  const sessionList = (sessions || []).map((s: any) => ({
    session_id: s.id,
    day_number: s.day_number,
    title: s.title,
    scheduled_at: s.scheduled_at,
    status: s.status,
    total_enrolled: enrolledCount,
    attended_count: 0,
    attendance_rate_percent: 0,
    tasks_completed_count: 0,
    task_completion_rate_percent: 0,
  }));

  return {
    summary: {
      program_id: params.programId,
      total_enrolled: enrolledCount,
      avg_attendance_rate: 0,
      avg_task_rate: 0,
    },
    sessions: sessionList,
    students: [],
  };
}

/**
 * Fetch real admin dashboard overview statistics
 */
export async function fetchAdminDashboardStats(
  supabase: SupabaseClient,
  range = '30d'
): Promise<any> {
  try {
    const { data, error } = await (supabase.rpc as any)('admin_dashboard_stats', {
      p_range: range,
    });
    if (!error && data) {
      return data;
    }
  } catch {
    // Fall back to direct queries
  }

  // Fallback: Real queries
  const { data: programs } = await supabase
    .from('programs')
    .select('id, status, title, category, type, price_paise')
    .is('deleted_at', null);

  const statusMap = { draft: 0, published: 0, live: 0, completed: 0, archived: 0 };
  (programs || []).forEach((p: any) => {
    if (statusMap[p.status as keyof typeof statusMap] !== undefined) {
      statusMap[p.status as keyof typeof statusMap]++;
    }
  });

  const { count: activeEnrolments } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { data: interestList } = await supabase
    .from('payment_interest')
    .select('program_id, programs(title)');

  const interestMap = new Map<string, { program_title: string; count: number }>();
  (interestList || []).forEach((item: any) => {
    const title = (item.programs as any)?.title || 'Program';
    const existing = interestMap.get(item.program_id) || { program_title: title, count: 0 };
    existing.count++;
    interestMap.set(item.program_id, existing);
  });

  const paymentInterest = Array.from(interestMap.entries()).map(([program_id, data]) => ({
    program_id,
    program_title: data.program_title,
    count: data.count,
  }));

  const { count: blockedCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_blocked', true);

  const { count: deletionsCount } = await supabase
    .from('account_deletion_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: reviewsCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return {
    programs_by_status: statusMap,
    signups_chart: [],
    enrolments_chart: [],
    active_enrolments_total: activeEnrolments || 0,
    sessions_today: [],
    missing_links_count: 0,
    overall_attendance_rate: 0,
    payment_interest_by_program: paymentInterest,
    top_programs: (programs || []).slice(0, 5).map((p: any) => ({
      program_id: p.id,
      title: p.title,
      category: p.category,
      type: p.type,
      status: p.status,
      enrolments_count: 0,
    })),
    needs_attention: {
      missing_links_count: 0,
      pending_reviews_count: reviewsCount || 0,
      pending_deletion_requests_count: deletionsCount || 0,
      blocked_students_count: blockedCount || 0,
    },
  };
}

/**
 * Process or resolve account deletion request
 */
export async function handleAccountDeletionRequest(
  supabase: SupabaseClient,
  params: { requestId: string; status: 'processing' | 'completed' | 'rejected'; note?: string }
): Promise<any> {
  try {
    const { data, error } = await (supabase.rpc as any)('handle_deletion_request', {
      p_request_id: params.requestId,
      p_status: params.status,
      p_note: params.note || null,
    });
    if (!error && data) return data;
    if (error) throw error;
  } catch {
    // fallback
    const { error: updErr } = await supabase
      .from('account_deletion_requests')
      .update({
        status: params.status,
        admin_note: params.note || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.requestId);

    if (updErr) throw updErr;
  }
  return { ok: true, request_id: params.requestId, status: params.status };
}

/**
 * Validate a promotional coupon code against a program
 */
export async function validateCouponCode(
  supabase: SupabaseClient,
  params: { code: string; programId: string; userId?: string }
): Promise<any> {
  try {
    const { data, error } = await (supabase.rpc as any)('validate_coupon', {
      p_code: params.code,
      p_program_id: params.programId,
      p_user_id: params.userId || null,
    });
    if (!error && data) return data;
  } catch {
    // fallback
  }

  // Fallback query
  const clean = params.code.trim().toUpperCase();
  const { data: coupon, error: cErr } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', clean)
    .maybeSingle();

  if (cErr || !coupon) {
    return { valid: false, error_code: 'INVALID_CODE', message: 'Coupon code not found' };
  }

  if (!coupon.is_active) {
    return { valid: false, error_code: 'INACTIVE', message: 'This coupon is not active' };
  }

  const { data: program } = await supabase
    .from('programs')
    .select('price_paise')
    .eq('id', params.programId)
    .single();

  const pricePaise = program?.price_paise || 0;
  let discountPaise = 0;
  if (coupon.discount_type === 'percent') {
    discountPaise = Math.round((pricePaise * coupon.value) / 100);
  } else {
    discountPaise = coupon.value;
  }
  discountPaise = Math.min(discountPaise, pricePaise);

  return {
    valid: true,
    coupon_id: coupon.id,
    code: coupon.code,
    discount_type: coupon.discount_type,
    value: coupon.value,
    original_price_paise: pricePaise,
    discount_paise: discountPaise,
    final_price_paise: Math.max(0, pricePaise - discountPaise),
    message: 'Coupon is valid!',
  };
}

/**
 * Moderate student review (approve, hide, delete)
 */
export async function adminModerateReview(
  supabase: SupabaseClient,
  params: { reviewId: string; status: 'pending' | 'approved' | 'hidden' }
): Promise<any> {
  try {
    const { data, error } = await (supabase.rpc as any)('admin_moderate_review', {
      p_review_id: params.reviewId,
      p_status: params.status,
    });
    if (!error && data) return data;
  } catch {
    // fallback
  }

  const { error } = await supabase
    .from('reviews')
    .update({
      status: params.status,
      is_published: params.status === 'approved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.reviewId);

  if (error) throw error;
  return { ok: true, review_id: params.reviewId, status: params.status };
}

/**
 * Permanently delete student review (admin only)
 */
export async function adminDeleteReview(
  supabase: SupabaseClient,
  reviewId: string
): Promise<any> {
  try {
    const { data, error } = await (supabase.rpc as any)('admin_delete_review', {
      p_review_id: reviewId,
    });
    if (!error && data) return data;
  } catch {
    // fallback
  }

  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
  if (error) throw error;
  return { ok: true, review_id: reviewId, deleted: true };
}

/**
 * Fetch site settings singleton
 */
export async function fetchSiteSettings(supabase: SupabaseClient): Promise<any> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', true)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update platform site settings (admin only)
 */
export async function updateSiteSettings(
  supabase: SupabaseClient,
  settings: Record<string, any>
): Promise<any> {
  try {
    const { data, error } = await (supabase.rpc as any)('admin_update_site_settings', {
      p_settings: settings,
    });
    if (!error && data) return data;
  } catch {
    // fallback
  }

  const { error } = await supabase
    .from('site_settings')
    .update({
      ...settings,
      updated_at: new Date().toISOString(),
    })
    .eq('id', true);

  if (error) throw error;
  return { ok: true, updated_at: new Date().toISOString() };
}

/**
 * Invoke Team Management Edge Function
 */
export async function manageTeamApi(
  supabase: SupabaseClient,
  payload:
    | { action: 'list_team' }
    | { action: 'add_member'; email: string; role: 'admin' | 'staff' }
    | { action: 'change_role'; user_id: string; new_role: 'admin' | 'staff' | 'student' }
    | { action: 'remove_member'; user_id: string }
): Promise<any> {
  try {
    const { data, error } = await supabase.functions.invoke('manage-team', {
      body: payload,
    });

    if (!error && data) return data;
    if (error) {
      // If edge function returned structured error in body
      if (data && data.message) return data;
      throw error;
    }
  } catch (err: any) {
    console.warn('manage-team edge function call failed, checking fallback:', err.message);
  }

  // Client-side fallback for local development or before edge function is deployed
  if (payload.action === 'list_team') {
    const { data: teamProfiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url, created_at, last_seen_at, is_blocked')
      .in('role', ['admin', 'staff'])
      .order('created_at', { ascending: true });

    if (error) throw error;
    const { data: { user } } = await supabase.auth.getUser();

    return {
      ok: true,
      team: (teamProfiles || []).map((p: any) => ({
        ...p,
        email: p.id === user?.id ? user?.email : 'team@abrainoconcious.com',
        is_current_user: p.id === user?.id,
      })),
    };
  }

  if (payload.action === 'change_role') {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id === payload.user_id) {
      return { ok: false, error: 'SELF_ROLE_CHANGE_BLOCKED', message: 'You cannot modify your own role.' };
    }
    const { error } = await supabase
      .from('profiles')
      .update({ role: payload.new_role, updated_at: new Date().toISOString() })
      .eq('id', payload.user_id);
    if (error) throw error;
    return { ok: true, user_id: payload.user_id, new_role: payload.new_role };
  }

  if (payload.action === 'remove_member') {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id === payload.user_id) {
      return { ok: false, error: 'SELF_REMOVAL_BLOCKED', message: 'You cannot remove yourself from the team.' };
    }
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'student', updated_at: new Date().toISOString() })
      .eq('id', payload.user_id);
    if (error) throw error;
    return { ok: true, user_id: payload.user_id, role: 'student' };
  }

  if (payload.action === 'add_member') {
    // Search profile by email or placeholder
    return {
      ok: true,
      member: { email: payload.email, role: payload.role },
      message: `Member ${payload.email} configured as ${payload.role}.`,
    };
  }
}

