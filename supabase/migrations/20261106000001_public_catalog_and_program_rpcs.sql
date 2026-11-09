-- Migration: 20261106000001_public_catalog_and_program_rpcs.sql
-- Description: Public read-only RPCs for student catalog, trending programs, and single program detail.
-- Security: Never exposes protected session_links (live_url, recording_url) or lesson_media (video_id, content_url).

-- 1. Public Catalog RPC
CREATE OR REPLACE FUNCTION get_catalog(
  p_search TEXT DEFAULT NULL,
  p_type TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_price_filter TEXT DEFAULT NULL,
  p_sort TEXT DEFAULT 'sort_order',
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_items JSONB;
  v_total_count INTEGER;
  v_is_staff BOOLEAN;
BEGIN
  v_is_staff := is_staff_or_admin();

  -- Get total count matching the filters
  SELECT COUNT(*)
  INTO v_total_count
  FROM programs p
  WHERE p.deleted_at IS NULL
    AND (
      (v_is_staff AND (p_status IS NULL OR p_status = 'all' OR p.status::text = p_status))
      OR (NOT v_is_staff AND (
        (p_status = 'completed' AND p.status = 'completed')
        OR (p_status = 'archived' AND p.status = 'archived')
        OR (p.status IN ('published', 'live'))
      ))
    )
    AND (p_type IS NULL OR p_type = 'all' OR p.type::text = p_type)
    AND (p_category IS NULL OR p_category = 'all' OR p.category::text = p_category)
    AND (
      p_price_filter IS NULL OR p_price_filter = 'all'
      OR (p_price_filter = 'free' AND p.price_paise = 0)
      OR (p_price_filter = 'paid' AND p.price_paise > 0)
      OR (p_price_filter = 'under_1000' AND p.price_paise < 100000)
    )
    AND (
      p_search IS NULL OR trim(p_search) = ''
      OR p.title ILIKE '%' || trim(p_search) || '%'
      OR p.short_description ILIKE '%' || trim(p_search) || '%'
      OR p.description ILIKE '%' || trim(p_search) || '%'
      OR EXISTS (
        SELECT 1 FROM unnest(p.tags) t
        WHERE t ILIKE '%' || trim(p_search) || '%'
      )
    );

  -- Get paginated items with computed seats_left and lesson/session counts
  WITH filtered_programs AS (
    SELECT
      p.id,
      p.type,
      p.category,
      p.title,
      p.slug,
      p.short_description,
      p.description,
      p.cover_image_url,
      p.cover_image_alt,
      p.cover_srcset,
      p.poster_image_url,
      p.poster_image_alt,
      p.poster_srcset,
      p.thumbnail_url,
      p.thumbnail_alt,
      p.thumbnail_srcset,
      p.promo_video_url,
      p.price_paise,
      p.compare_at_price_paise,
      p.status,
      p.starts_at,
      p.ends_at,
      p.enrollment_deadline,
      p.max_seats,
      p.is_featured,
      p.is_trending_pinned,
      p.sort_order,
      p.tags,
      p.what_you_will_learn,
      p.faq,
      p.created_at,
      CASE
        WHEN p.max_seats IS NOT NULL THEN
          GREATEST(0, p.max_seats - (
            SELECT COUNT(*)::INTEGER
            FROM enrollments e
            WHERE e.program_id = p.id AND e.status = 'active'
          ))
        ELSE NULL
      END AS seats_left,
      (
        SELECT COUNT(*)::INTEGER
        FROM program_sessions ps
        WHERE ps.program_id = p.id
      ) AS total_sessions,
      (
        SELECT COUNT(*)::INTEGER
        FROM lessons l
        JOIN course_sections cs ON l.section_id = cs.id
        WHERE cs.program_id = p.id AND l.is_published = true
      ) AS total_lessons,
      CASE
        WHEN auth.uid() IS NOT NULL THEN
          EXISTS (
            SELECT 1 FROM enrollments e
            WHERE e.user_id = auth.uid()
              AND e.program_id = p.id
              AND e.status = 'active'
              AND (e.access_until IS NULL OR e.access_until > NOW())
          )
        ELSE false
      END AS is_enrolled
    FROM programs p
    WHERE p.deleted_at IS NULL
      AND (
        (v_is_staff AND (p_status IS NULL OR p_status = 'all' OR p.status::text = p_status))
        OR (NOT v_is_staff AND (
          (p_status = 'completed' AND p.status = 'completed')
          OR (p_status = 'archived' AND p.status = 'archived')
          OR (p.status IN ('published', 'live'))
        ))
      )
      AND (p_type IS NULL OR p_type = 'all' OR p.type::text = p_type)
      AND (p_category IS NULL OR p_category = 'all' OR p.category::text = p_category)
      AND (
        p_price_filter IS NULL OR p_price_filter = 'all'
        OR (p_price_filter = 'free' AND p.price_paise = 0)
        OR (p_price_filter = 'paid' AND p.price_paise > 0)
        OR (p_price_filter = 'under_1000' AND p.price_paise < 100000)
      )
      AND (
        p_search IS NULL OR trim(p_search) = ''
        OR p.title ILIKE '%' || trim(p_search) || '%'
        OR p.short_description ILIKE '%' || trim(p_search) || '%'
        OR p.description ILIKE '%' || trim(p_search) || '%'
        OR EXISTS (
          SELECT 1 FROM unnest(p.tags) t
          WHERE t ILIKE '%' || trim(p_search) || '%'
        )
      )
    ORDER BY
      CASE WHEN p_sort = 'price_asc' THEN p.price_paise END ASC,
      CASE WHEN p_sort = 'price_desc' THEN p.price_paise END DESC,
      CASE WHEN p_sort = 'newest' THEN p.created_at END DESC,
      CASE WHEN p_sort = 'popular' THEN p.is_trending_pinned END DESC,
      p.sort_order ASC,
      p.created_at DESC
    LIMIT LEAST(GREATEST(p_limit, 1), 100)
    OFFSET GREATEST(p_offset, 0)
  )
  SELECT jsonb_agg(to_jsonb(fp))
  INTO v_items
  FROM filtered_programs fp;

  RETURN jsonb_build_object(
    'items', COALESCE(v_items, '[]'::jsonb),
    'total_count', v_total_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_catalog(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER) TO anon, authenticated, service_role;

-- 2. Trending Programs RPC
CREATE OR REPLACE FUNCTION get_trending_programs(
  p_limit INTEGER DEFAULT 10
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH ranked_programs AS (
    SELECT
      ROW_NUMBER() OVER (
        ORDER BY
          p.is_trending_pinned DESC,
          (
            SELECT COUNT(*)
            FROM enrollments e
            WHERE e.program_id = p.id
              AND e.enrolled_at > (NOW() - INTERVAL '30 days')
          ) DESC,
          p.sort_order ASC,
          p.created_at DESC
      ) AS rank,
      p.id,
      p.type,
      p.category,
      p.title,
      p.slug,
      p.short_description,
      p.cover_image_url,
      p.cover_image_alt,
      p.cover_srcset,
      p.poster_image_url,
      p.poster_image_alt,
      p.poster_srcset,
      p.thumbnail_url,
      p.thumbnail_alt,
      p.thumbnail_srcset,
      p.price_paise,
      p.compare_at_price_paise,
      p.status,
      p.starts_at,
      p.ends_at,
      p.enrollment_deadline,
      p.max_seats,
      p.is_featured,
      p.is_trending_pinned,
      CASE
        WHEN p.max_seats IS NOT NULL THEN
          GREATEST(0, p.max_seats - (
            SELECT COUNT(*)::INTEGER
            FROM enrollments e
            WHERE e.program_id = p.id AND e.status = 'active'
          ))
        ELSE NULL
      END AS seats_left,
      (
        SELECT COUNT(*)::INTEGER
        FROM program_sessions ps
        WHERE ps.program_id = p.id
      ) AS total_sessions,
      (
        SELECT COUNT(*)::INTEGER
        FROM lessons l
        JOIN course_sections cs ON l.section_id = cs.id
        WHERE cs.program_id = p.id AND l.is_published = true
      ) AS total_lessons,
      CASE
        WHEN auth.uid() IS NOT NULL THEN
          EXISTS (
            SELECT 1 FROM enrollments e
            WHERE e.user_id = auth.uid()
              AND e.program_id = p.id
              AND e.status = 'active'
              AND (e.access_until IS NULL OR e.access_until > NOW())
          )
        ELSE false
      END AS is_enrolled
    FROM programs p
    WHERE p.deleted_at IS NULL
      AND p.status IN ('published', 'live')
    LIMIT LEAST(GREATEST(p_limit, 1), 50)
  )
  SELECT jsonb_agg(to_jsonb(rp))
  INTO v_result
  FROM ranked_programs rp;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION get_trending_programs(INTEGER) TO anon, authenticated, service_role;

-- 3. Program Public Detail RPC
-- Returns public metadata, schedule (NO links), modules/lessons (NO video media), reviews, stats.
CREATE OR REPLACE FUNCTION get_program_public(
  p_slug CITEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_prog RECORD;
  v_is_staff BOOLEAN;
  v_seats_left INTEGER;
  v_is_enrolled BOOLEAN;
  v_sessions JSONB;
  v_modules JSONB;
  v_reviews JSONB;
  v_rating_summary JSONB;
  v_related JSONB;
BEGIN
  v_is_staff := is_staff_or_admin();

  -- Fetch program header
  SELECT *
  INTO v_prog
  FROM programs p
  WHERE p.slug = p_slug
    AND p.deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Protect drafts from public eyes
  IF v_prog.status = 'draft' AND NOT v_is_staff THEN
    RETURN NULL;
  END IF;

  -- Compute seats left
  IF v_prog.max_seats IS NOT NULL THEN
    v_seats_left := GREATEST(0, v_prog.max_seats - (
      SELECT COUNT(*)::INTEGER
      FROM enrollments e
      WHERE e.program_id = v_prog.id AND e.status = 'active'
    ));
  ELSE
    v_seats_left := NULL;
  END IF;

  -- Check enrollment for authenticated student
  IF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.user_id = auth.uid()
        AND e.program_id = v_prog.id
        AND e.status = 'active'
        AND (e.access_until IS NULL OR e.access_until > NOW())
    ) INTO v_is_enrolled;
  ELSE
    v_is_enrolled := false;
  END IF;

  -- Fetch program sessions (Day schedule with task details, ABSOLUTELY NEVER session_links!)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ps.id,
      'day_number', ps.day_number,
      'title', ps.title,
      'description', ps.description,
      'scheduled_at', ps.scheduled_at,
      'live_platform', ps.live_platform,
      'status', ps.status,
      'task_title', ps.task_title,
      'task_body', ps.task_body,
      'resources', ps.resources
    )
    ORDER BY ps.day_number ASC
  )
  INTO v_sessions
  FROM program_sessions ps
  WHERE ps.program_id = v_prog.id;

  -- Fetch course modules and lessons outline (NO lesson_media or video_id!)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', cs.id,
      'title', cs.title,
      'description', cs.description,
      'sort_order', cs.sort_order,
      'lessons', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', l.id,
            'title', l.title,
            'description', l.description,
            'sort_order', l.sort_order,
            'duration_seconds', l.duration_seconds,
            'is_free_preview', l.is_free_preview,
            'release_at', l.release_at
          )
          ORDER BY l.sort_order ASC
        )
        FROM lessons l
        WHERE l.section_id = cs.id
          AND l.is_published = true
      )
    )
    ORDER BY cs.sort_order ASC
  )
  INTO v_modules
  FROM course_sections cs
  WHERE cs.program_id = v_prog.id;

  -- Fetch approved published reviews with student names
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'rating', r.rating,
      'title', r.title,
      'body', r.body,
      'created_at', r.created_at,
      'student_name', COALESCE(pr.full_name, 'Verified Student')
    )
    ORDER BY r.created_at DESC
  )
  INTO v_reviews
  FROM reviews r
  LEFT JOIN profiles pr ON r.user_id = pr.id
  WHERE r.program_id = v_prog.id
    AND r.is_published = true;

  -- Rating summary
  SELECT jsonb_build_object(
    'average_rating', COALESCE(ROUND(AVG(r.rating)::NUMERIC, 1), 5.0),
    'review_count', COUNT(r.id)::INTEGER
  )
  INTO v_rating_summary
  FROM reviews r
  WHERE r.program_id = v_prog.id
    AND r.is_published = true;

  -- Related programs (up to 3 in same category, published or live)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', rel.id,
      'slug', rel.slug,
      'title', rel.title,
      'type', rel.type,
      'category', rel.category,
      'short_description', rel.short_description,
      'price_paise', rel.price_paise,
      'compare_at_price_paise', rel.compare_at_price_paise,
      'poster_image_url', rel.poster_image_url,
      'poster_srcset', rel.poster_srcset,
      'thumbnail_url', rel.thumbnail_url,
      'thumbnail_srcset', rel.thumbnail_srcset
    )
  )
  INTO v_related
  FROM (
    SELECT *
    FROM programs rel
    WHERE rel.id != v_prog.id
      AND rel.category = v_prog.category
      AND rel.deleted_at IS NULL
      AND rel.status IN ('published', 'live')
    ORDER BY rel.sort_order ASC, rel.created_at DESC
    LIMIT 3
  ) rel;

  RETURN jsonb_build_object(
    'id', v_prog.id,
    'slug', v_prog.slug,
    'type', v_prog.type,
    'category', v_prog.category,
    'title', v_prog.title,
    'short_description', v_prog.short_description,
    'description', v_prog.description,
    'cover_image_url', v_prog.cover_image_url,
    'cover_image_alt', v_prog.cover_image_alt,
    'cover_srcset', v_prog.cover_srcset,
    'poster_image_url', v_prog.poster_image_url,
    'poster_image_alt', v_prog.poster_image_alt,
    'poster_srcset', v_prog.poster_srcset,
    'thumbnail_url', v_prog.thumbnail_url,
    'thumbnail_alt', v_prog.thumbnail_alt,
    'thumbnail_srcset', v_prog.thumbnail_srcset,
    'promo_video_url', v_prog.promo_video_url,
    'price_paise', v_prog.price_paise,
    'compare_at_price_paise', v_prog.compare_at_price_paise,
    'status', v_prog.status,
    'starts_at', v_prog.starts_at,
    'ends_at', v_prog.ends_at,
    'enrollment_deadline', v_prog.enrollment_deadline,
    'max_seats', v_prog.max_seats,
    'seats_left', v_seats_left,
    'is_enrolled', v_is_enrolled,
    'is_featured', v_prog.is_featured,
    'is_trending_pinned', v_prog.is_trending_pinned,
    'tags', v_prog.tags,
    'what_you_will_learn', v_prog.what_you_will_learn,
    'faq', v_prog.faq,
    'created_at', v_prog.created_at,
    'sessions', COALESCE(v_sessions, '[]'::jsonb),
    'modules', COALESCE(v_modules, '[]'::jsonb),
    'reviews', COALESCE(v_reviews, '[]'::jsonb),
    'rating_summary', v_rating_summary,
    'related_programs', COALESCE(v_related, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_program_public(CITEXT) TO anon, authenticated, service_role;

