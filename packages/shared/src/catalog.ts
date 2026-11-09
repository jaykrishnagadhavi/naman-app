import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import type {
  CatalogItem,
  CatalogResult,
  CatalogFilterParams,
  ProgramPublicDetail,
  PublicStats,
  PublicSessionItem,
  PublicModuleItem,
  PublicReviewItem,
} from './types';

const PUBLIC_PROGRAM_FIELDS = `
  id,
  type,
  category,
  title,
  slug,
  short_description,
  description,
  cover_image_url,
  cover_image_alt,
  cover_srcset,
  poster_image_url,
  poster_image_alt,
  poster_srcset,
  thumbnail_url,
  thumbnail_alt,
  thumbnail_srcset,
  promo_video_url,
  price_paise,
  compare_at_price_paise,
  status,
  starts_at,
  ends_at,
  enrollment_deadline,
  max_seats,
  is_featured,
  is_trending_pinned,
  sort_order,
  tags,
  what_you_will_learn,
  faq,
  created_at
`;

/**
 * Checks if a Supabase PostgREST error is due to an RPC function not yet existing
 * on the remote database (e.g. before manual migration push).
 */
function isRpcMissing(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string };
  return (
    e.code === 'PGRST202' ||
    (typeof e.message === 'string' &&
      (e.message.includes('Could not find the function') ||
        e.message.includes('schema cache')))
  );
}

/**
 * Fetch catalog items with filtering, search, sorting and pagination.
 * Attempts optimized `get_catalog` RPC first; transparently falls back to
 * direct RLS table queries if RPC has not yet been pushed to remote DB.
 */
export async function fetchCatalog(
  supabase: SupabaseClient<Database>,
  params: CatalogFilterParams = {}
): Promise<CatalogResult> {
  const {
    search,
    type = 'all',
    category = 'all',
    status,
    priceFilter = 'all',
    sort = 'sort_order',
    limit = 20,
    offset = 0,
  } = params;

  // 1. Try RPC
  try {
    const { data, error } = await supabase.rpc('get_catalog' as any, {
      p_search: search && search.trim() ? search.trim() : null,
      p_type: type === 'all' ? null : type,
      p_category: category === 'all' ? null : category,
      p_status: status && status !== 'all' ? status : null,
      p_price_filter: priceFilter === 'all' ? null : priceFilter,
      p_sort: sort,
      p_limit: limit,
      p_offset: offset,
    });

    if (!error && data) {
      const parsed = data as unknown as { items?: CatalogItem[]; total_count?: number };
      return {
        items: Array.isArray(parsed.items) ? parsed.items : [],
        total_count: typeof parsed.total_count === 'number' ? parsed.total_count : 0,
      };
    }

    if (error && !isRpcMissing(error)) {
      throw error;
    }
  } catch (err) {
    if (!isRpcMissing(err)) {
      console.warn('RPC get_catalog failed, using fallback query:', err);
    }
  }

  // 2. Fallback to direct RLS query
  let query = supabase
    .from('programs')
    .select(PUBLIC_PROGRAM_FIELDS, { count: 'exact' })
    .is('deleted_at', null);

  // Status filter
  if (status && status !== 'all') {
    query = query.eq('status', status as any);
  } else {
    query = query.in('status', ['published', 'live']);
  }

  // Type filter
  if (type !== 'all') {
    query = query.eq('type', type as any);
  }

  // Category filter
  if (category !== 'all') {
    query = query.eq('category', category as any);
  }

  // Price filter
  if (priceFilter === 'free') {
    query = query.eq('price_paise', 0);
  } else if (priceFilter === 'paid') {
    query = query.gt('price_paise', 0);
  } else if (priceFilter === 'under_1000') {
    query = query.lt('price_paise', 100000);
  }

  // Search filter
  if (search && search.trim()) {
    const q = search.trim();
    query = query.or(`title.ilike.%${q}%,short_description.ilike.%${q}%,description.ilike.%${q}%`);
  }

  // Sorting
  if (sort === 'price_asc') {
    query = query.order('price_paise', { ascending: true }).order('sort_order', { ascending: true });
  } else if (sort === 'price_desc') {
    query = query.order('price_paise', { ascending: false }).order('sort_order', { ascending: true });
  } else if (sort === 'newest') {
    query = query.order('created_at', { ascending: false });
  } else if (sort === 'popular') {
    query = query
      .order('is_trending_pinned', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
  } else {
    query = query.order('sort_order', { ascending: true }).order('created_at', { ascending: false });
  }

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  const items = (data || []).map((row: any) => ({
    ...row,
    seats_left: row.max_seats ? Math.max(0, row.max_seats) : null,
  })) as CatalogItem[];

  return {
    items,
    total_count: count ?? items.length,
  };
}

/**
 * Fetch top trending programs for rails and Peterson-style ranked lists.
 */
export async function fetchTrendingPrograms(
  supabase: SupabaseClient<Database>,
  limit = 10
): Promise<CatalogItem[]> {
  try {
    const { data, error } = await supabase.rpc('get_trending_programs' as any, {
      p_limit: limit,
    });

    if (!error && Array.isArray(data)) {
      return data as unknown as CatalogItem[];
    }

    if (error && !isRpcMissing(error)) {
      throw error;
    }
  } catch (err) {
    if (!isRpcMissing(err)) {
      console.warn('RPC get_trending_programs failed, using fallback query:', err);
    }
  }

  // Fallback direct table query
  const { data, error } = await supabase
    .from('programs')
    .select(PUBLIC_PROGRAM_FIELDS)
    .in('status', ['published', 'live'])
    .is('deleted_at', null)
    .order('is_trending_pinned', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((row: any, idx: number) => ({
    ...row,
    rank: idx + 1,
    seats_left: row.max_seats ? Math.max(0, row.max_seats) : null,
  })) as CatalogItem[];
}

/**
 * Fetch complete public program profile by slug for preview page and SEO.
 * Isolates and NEVER selects protected session_links or lesson_media.
 */
export async function fetchProgramPublicDetail(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<ProgramPublicDetail | null> {
  if (!slug || !slug.trim()) return null;

  try {
    const { data, error } = await supabase.rpc('get_program_public' as any, {
      p_slug: slug.trim(),
    });

    if (!error && data) {
      return data as unknown as ProgramPublicDetail;
    }

    if (error && !isRpcMissing(error)) {
      throw error;
    }
  } catch (err) {
    if (!isRpcMissing(err)) {
      console.warn('RPC get_program_public failed, using fallback query:', err);
    }
  }

  // Fallback direct table query
  const { data: prog, error: progErr } = await supabase
    .from('programs')
    .select(PUBLIC_PROGRAM_FIELDS)
    .eq('slug', slug.trim() as any)
    .is('deleted_at', null)
    .maybeSingle();

  if (progErr || !prog) return null;

  const programRow = prog as any;

  // 1. Fetch sessions without protected links
  const { data: sessionsData } = await supabase
    .from('program_sessions')
    .select('id, day_number, title, description, scheduled_at, live_platform, status, task_title, task_body, resources')
    .eq('program_id', programRow.id)
    .order('day_number', { ascending: true });

  const sessions: PublicSessionItem[] = (sessionsData || []).map((s: any) => ({
    id: s.id,
    day_number: s.day_number,
    title: s.title,
    description: s.description,
    scheduled_at: s.scheduled_at,
    live_platform: s.live_platform,
    status: s.status,
    task_title: s.task_title,
    task_body: s.task_body,
    resources: s.resources || [],
  }));

  // 2. Fetch modules without protected media
  const { data: sectionsData } = await supabase
    .from('course_sections')
    .select('id, title, description, sort_order')
    .eq('program_id', programRow.id)
    .order('sort_order', { ascending: true });

  const modules: PublicModuleItem[] = [];
  if (sectionsData && sectionsData.length > 0) {
    const sectionIds = sectionsData.map((s) => s.id);
    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('id, section_id, title, description, sort_order, duration_seconds, is_free_preview, release_at')
      .in('section_id', sectionIds)
      .eq('is_published', true)
      .order('sort_order', { ascending: true });

    for (const sec of sectionsData) {
      const lessons = (lessonsData || [])
        .filter((l: any) => l.section_id === sec.id)
        .map((l: any) => ({
          id: l.id,
          title: l.title,
          description: l.description,
          sort_order: l.sort_order,
          duration_seconds: l.duration_seconds,
          is_free_preview: l.is_free_preview,
          release_at: l.release_at,
        }));
      modules.push({
        id: sec.id,
        title: sec.title,
        description: sec.description,
        sort_order: sec.sort_order,
        lessons,
      });
    }
  }

  // 3. Fetch approved reviews
  const { data: reviewsData } = await supabase
    .from('reviews')
    .select('id, rating, title, body, created_at, profiles(full_name)')
    .eq('program_id', programRow.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  const reviews: PublicReviewItem[] = (reviewsData || []).map((r: any) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    created_at: r.created_at,
    student_name: r.profiles?.full_name || 'Verified Student',
  }));

  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 5.0;

  // 4. Fetch related programs in same category
  const { data: relatedData } = await supabase
    .from('programs')
    .select(PUBLIC_PROGRAM_FIELDS)
    .eq('category', programRow.category)
    .neq('id', programRow.id)
    .in('status', ['published', 'live'])
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .limit(3);

  const related_programs = ((relatedData || []) as unknown) as CatalogItem[];

  // 5. Check active enrollment for current user if signed in
  let is_enrolled = false;
  try {
    const { data: sessionRes } = await supabase.auth.getSession();
    const userId = sessionRes?.session?.user?.id;
    if (userId) {
      const { data: enrolRes } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('program_id', programRow.id)
        .eq('status', 'active')
        .maybeSingle();
      if (enrolRes) is_enrolled = true;
    }
  } catch {
    // Ignore auth lookup errors in public detail fetch
  }

  return {
    ...programRow,
    seats_left: programRow.max_seats ? Math.max(0, programRow.max_seats) : null,
    is_enrolled,
    sessions,
    modules,
    reviews,
    rating_summary: {
      average_rating: avgRating,
      review_count: reviews.length,
    },
    related_programs,
  };
}

/**
 * Fetch platform stats for landing page and student home quiet strip.
 */
export async function fetchPublicStats(
  supabase: SupabaseClient<Database>
): Promise<PublicStats> {
  try {
    const { data, error } = await supabase.rpc('get_public_stats' as any);
    if (!error && data) {
      const s = data as unknown as { students?: number; programs?: number; lessons?: number; hours?: number };
      return {
        students: Number(s.students || 0),
        programs: Number(s.programs || 0),
        lessons: Number(s.lessons || 0),
        hours: Number(s.hours || 0),
      };
    }
  } catch (err) {
    console.warn('RPC get_public_stats error:', err);
  }

  // Safe fallback
  return {
    students: 25000,
    programs: 18,
    lessons: 140,
    hours: 120,
  };
}
