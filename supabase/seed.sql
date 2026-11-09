-- Seed Data for ABrainoConscious Platform
-- Covers all four pillars: Emotional, Mental, Academic, Personal
-- All UUIDs are strictly valid hexadecimal characters (0-9, a-f)

-- ============================================================================
-- 1. Create Core Test Users in auth.users & profiles
-- ============================================================================
-- Password for all test users: 'Password123!'

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@abrainoconcious.com',
    crypt('Password123!', gen_salt('bf', 10)),
    NOW(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Naman (Creator & Admin)","role":"admin"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'staff@abrainoconcious.com',
    crypt('Password123!', gen_salt('bf', 10)),
    NOW(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Rohit Sharma (Staff Moderator)","role":"staff"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'arjun.enrolled@example.com',
    crypt('Password123!', gen_salt('bf', 10)),
    NOW(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Arjun Mehta","role":"student"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'priya.new@example.com',
    crypt('Password123!', gen_salt('bf', 10)),
    NOW(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Priya Nair","role":"student"}'::jsonb,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Populate auth identities for password sign in
INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '{"sub":"11111111-1111-1111-1111-111111111111","email":"admin@abrainoconcious.com"}'::jsonb, 'email', NOW(), NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '{"sub":"22222222-2222-2222-2222-222222222222","email":"staff@abrainoconcious.com"}'::jsonb, 'email', NOW(), NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '{"sub":"33333333-3333-3333-3333-333333333333","email":"arjun.enrolled@example.com"}'::jsonb, 'email', NOW(), NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', '{"sub":"44444444-4444-4444-4444-444444444444","email":"priya.new@example.com"}'::jsonb, 'email', NOW(), NOW(), NOW())
ON CONFLICT (provider_id, provider) DO NOTHING;

-- Populate profiles with specific roles & goals
UPDATE profiles SET role = 'admin', full_name = 'Naman (Founder)', phone = '+919876543210', goal_tag = 'creator'
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE profiles SET role = 'staff', full_name = 'Rohit Sharma', phone = '+919876543211', goal_tag = 'moderation'
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE profiles SET role = 'student', full_name = 'Arjun Mehta', phone = '+919876543212', goal_tag = 'deep-work'
WHERE id = '33333333-3333-3333-3333-333333333333';

UPDATE profiles SET role = 'student', full_name = 'Priya Nair', phone = '+919876543213', goal_tag = 'overthinking'
WHERE id = '44444444-4444-4444-4444-444444444444';

-- ============================================================================
-- 2. Programs across 4 Pillars
-- ============================================================================
INSERT INTO programs (
  id,
  type,
  category,
  title,
  slug,
  short_description,
  description,
  cover_image_url,
  cover_image_alt,
  poster_image_url,
  poster_image_alt,
  thumbnail_url,
  thumbnail_alt,
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
  faq
)
VALUES
  (
    'c1111111-1111-1111-1111-111111111111',
    'challenge',
    'mental',
    '21-Day Mental Discipline & Focus Sprint',
    'mental-discipline-sprint',
    'Break phone addiction, eliminate daily brain fog, and build 4 hours of non-negotiable daily deep work.',
    'A live guided 21-day cohort with Naman. Daily 45-minute live morning sessions, structured accountability tasks, and a private peer circle designed specifically for Indian students and professionals preparing for high-stakes milestones.',
    '/img/naman-header-960.webp',
    'Naman speaking in modern studio',
    '/img/naman-header-480.webp',
    'Mental Discipline Sprint Poster',
    '/img/naman-header-480.webp',
    'Mental Discipline Sprint Card Thumbnail',
    299900, -- ₹2,999
    499900, -- ₹4,999
    'live',
    NOW() - INTERVAL '3 days',
    NOW() + INTERVAL '18 days',
    NOW() + INTERVAL '2 days',
    150,
    true,
    true,
    1,
    ARRAY['focus', 'dopamine-detox', 'deep-work', 'discipline'],
    '[
      "How to enter deep focus within 5 minutes without resistance",
      "The dopamine-reset protocol to cure endless short-form video cravings",
      "Designing a study/work environment where distraction is physically inconvenient",
      "Mastering energy management so 4 PM fatigue never ruins your evening"
    ]'::jsonb,
    '[
      {"q": "What if I miss a live morning session?", "a": "Every single live session is recorded and uploaded to your dashboard within 60 minutes with full notes and timestamps."},
      {"q": "How much time do I need daily?", "a": "About 45 minutes for the live session at 7:00 AM IST and 20 minutes for the daily action task."}
    ]'::jsonb
  ),
  (
    'c2222222-2222-2222-2222-222222222222',
    'challenge',
    'emotional',
    '14-Day Overthinking & Emotional Calm Challenge',
    'overthinking-emotional-calm',
    'Silence the late-night spirals, decouple self-worth from exam marks, and build quiet inner confidence.',
    'An intimate 14-day cohort targeting the root emotional triggers of chronic worry, social comparison, and catastrophic thinking. Practical mental models that ground you when your mind is racing.',
    '/img/naman-header-960.webp',
    'Naman studio session',
    '/img/naman-header-480.webp',
    'Emotional Calm Poster',
    '/img/naman-header-480.webp',
    'Emotional Calm Thumbnail',
    199900, -- ₹1,999
    349900, -- ₹3,499
    'published',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '21 days',
    NOW() + INTERVAL '6 days',
    200,
    true,
    true,
    2,
    ARRAY['overthinking', 'emotional-resilience', 'calm', 'anxiety-relief'],
    '[
      "Cognitive grounding techniques to stop a runaway worry spiral in 90 seconds",
      "How to stop ruminating over past mistakes or fear of failure",
      "Decoupling your identity and peace of mind from external results",
      "A nighttime mental shut-down routine that eliminates insomnia from anxiety"
    ]'::jsonb,
    '[
      {"q": "Is this therapy?", "a": "No. This is an educational mindset program focused on self-regulation and habits. It is not clinical psychotherapy."},
      {"q": "Can beginners join?", "a": "Absolutely. Everything is explained in simple Hindi and English (Hinglish) without clinical jargon."}
    ]'::jsonb
  ),
  (
    'c3333333-3333-3333-3333-333333333333',
    'course',
    'academic',
    'Mastering Academic Pressure & Deep Work Architecture',
    'deep-work-architecture',
    'The complete self-paced blueprint for active recall, spaced repetition, and marathon study endurance.',
    'A masterclass package with over 18 video lessons, practical Notion study templates, and cognitive retention systems designed to help students master massive syllabi without burning out.',
    '/img/naman-header-960.webp',
    'Deep Work Architecture Banner',
    '/img/naman-header-480.webp',
    'Deep Work Architecture Poster',
    '/img/naman-header-480.webp',
    'Deep Work Architecture Thumbnail',
    499900, -- ₹4,999
    799900, -- ₹7,999
    'published',
    NULL,
    NULL,
    NULL,
    NULL,
    true,
    false,
    3,
    ARRAY['active-recall', 'spaced-repetition', 'exam-prep', 'academic-mastery'],
    '[
      "How to encode complex conceptual topics into long-term memory permanently",
      "Building an active recall schedule that guarantees 90%+ exam retention",
      "Managing exam anxiety and mental blocks under time pressure",
      "Optimizing sleep, hydration, and nutrition for peak cognitive output"
    ]'::jsonb,
    '[
      {"q": "How long do I have access to the course videos?", "a": "You receive lifetime access including all future updates and additions."},
      {"q": "Are there downloadable study templates?", "a": "Yes! Full Notion and print-ready PDF revision trackers are included."}
    ]'::jsonb
  ),
  (
    'c4444444-4444-4444-4444-444444444444',
    'course',
    'personal',
    'Inner Compass: Identity, Habits & Personal Growth',
    'inner-compass-habits',
    'Discover what you actually want, dismantle limiting self-beliefs, and construct durable daily rituals.',
    'Self-paced transformative course that cuts through generic self-help cliches. Practical frameworks for life planning, honest self-inquiry, and emotional autonomy.',
    '/img/naman-header-960.webp',
    'Inner Compass Banner',
    '/img/naman-header-480.webp',
    'Inner Compass Poster',
    '/img/naman-header-480.webp',
    'Inner Compass Thumbnail',
    399900, -- ₹3,999
    599900, -- ₹5,999
    'published',
    NULL,
    NULL,
    NULL,
    NULL,
    false,
    false,
    4,
    ARRAY['habits', 'identity', 'personal-clarity', 'daily-routine'],
    '[
      "Uncovering your core values beyond societal and parental expectations",
      "The micro-habit compounding system that sticks for years",
      "Breaking free from chronic people-pleasing and social comparison",
      "Conducting monthly personal audits to course-correct before burnout"
    ]'::jsonb,
    '[
      {"q": "Is this course video-based?", "a": "Yes, 12 cinematic high-definition video modules plus reflective workbook exercises."}
    ]'::jsonb
  ),
  (
    'c5555555-5555-5555-5555-555555555555',
    'course',
    'emotional',
    'Emotional Resilience Under Crisis',
    'resilience-under-crisis',
    'Navigating setbacks, exam failures, and career rejection with grace and unwavering resolve.',
    'A specialized workshop series recorded with real students who overcame catastrophic career and life setbacks.',
    '/img/naman-header-960.webp',
    'Resilience Under Crisis Banner',
    '/img/naman-header-480.webp',
    'Resilience Under Crisis Poster',
    '/img/naman-header-480.webp',
    'Resilience Under Crisis Thumbnail',
    349900,
    499900,
    'completed',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '30 days',
    NULL,
    NULL,
    false,
    false,
    5,
    ARRAY['resilience', 'crisis-management', 'mental-strength'],
    '["Bouncing back from failure", "Processing grief and disappointment", "Regaining momentum"]'::jsonb,
    '[]'::jsonb
  );

-- ============================================================================
-- 3. Sessions and Protected Session Links (for Challenge c1111111)
-- ============================================================================
INSERT INTO program_sessions (
  id, program_id, day_number, title, description, scheduled_at, live_platform, status, task_title, task_body, resources
)
VALUES
  (
    'e1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    1,
    'Day 1: The Dopamine Baseline & The Friction Rule',
    'Auditing your current distraction triggers and establishing non-negotiables.',
    NOW() - INTERVAL '3 days',
    'zoom',
    'ended',
    'Task 1: Complete Your 24-Hour Screen Time Audit',
    'Export your phone battery and screen time usage. Categorize apps into Green (Tools), Yellow (Utility), and Red (Addictive loops). Post your top Red app in the community feed.',
    '[{"title": "Day 1 Audit Sheet (PDF)", "url": "/resources/day-1-audit.pdf"}]'::jsonb
  ),
  (
    'e2222222-2222-2222-2222-222222222222',
    'c1111111-1111-1111-1111-111111111111',
    2,
    'Day 2: Physical Environmental Architecture',
    'Why willpower is a myth and how physical space dictates attention.',
    NOW() - INTERVAL '2 days',
    'zoom',
    'ended',
    'Task 2: The Two-Room Separation Rule',
    'Place your phone charger in another room overnight. Study with zero devices on your desk for at least one 60-minute block.',
    '[{"title": "Desk Setup Checklist", "url": "/resources/desk-setup.pdf"}]'::jsonb
  ),
  (
    'e3333333-3333-3333-3333-333333333333',
    'c1111111-1111-1111-1111-111111111111',
    3,
    'Day 3: The 90-Minute Ultradian Rhythm',
    'Aligning your deepest study sessions with natural biological attention cycles.',
    NOW() - INTERVAL '1 day',
    'zoom',
    'ended',
    'Task 3: Execute Two 90-Minute Focus Blocks',
    'Log start and end times for two 90-minute blocks with a 20-minute walk break in between.',
    '[]'::jsonb
  ),
  (
    'e4444444-4444-4444-4444-444444444444',
    'c1111111-1111-1111-1111-111111111111',
    4,
    'Day 4: Taming the Procrastination Resistance',
    'Live workshop on how to overcome the painful first 10 minutes of starting hard work.',
    NOW() + INTERVAL '4 hours',
    'zoom',
    'scheduled',
    'Task 4: The 5-Minute Ugly Draft Rule',
    'Commit to writing or solving the hardest topic for just 5 minutes without judging quality.',
    '[]'::jsonb
  ),
  (
    'e5555555-5555-5555-5555-555555555555',
    'c1111111-1111-1111-1111-111111111111',
    5,
    'Day 5: Dealing with Mental Fog & Mid-Day Crash',
    'Nutritional timing, hydration, and non-sleep deep rest protocols.',
    NOW() + INTERVAL '1 day',
    'zoom',
    'scheduled',
    'Task 5: Afternoon NSDR Session',
    'Practice 15 minutes of guided Non-Sleep Deep Rest instead of scrolling.',
    '[]'::jsonb
  ),
  (
    'e6666666-6666-6666-6666-666666666666',
    'c1111111-1111-1111-1111-111111111111',
    6,
    'Day 6: Handling External Interruptions & Family Expectations',
    'Setting kind, clear boundaries with friends, roommates, and family.',
    NOW() + INTERVAL '2 days',
    'zoom',
    'scheduled',
    'Task 6: Set Your Daily Focus Window Boundary',
    'Communicate your 3-hour focus window clearly to those around you.',
    '[]'::jsonb
  ),
  (
    'e7777777-7777-7777-7777-777777777777',
    'c1111111-1111-1111-1111-111111111111',
    7,
    'Day 7: The Weekly Review & Reset Ritual',
    'Reflecting on Week 1 data, celebrating wins, and upgrading for Week 2.',
    NOW() + INTERVAL '3 days',
    'zoom',
    'scheduled',
    'Task 7: Submit Week 1 Accountability Report',
    'Calculate your total deep hours and share your breakthrough in the group.',
    '[]'::jsonb
  );

-- Protected links: 3 with live_url, 2 with recording_url
INSERT INTO session_links (session_id, live_url, recording_url)
VALUES
  (
    'e1111111-1111-1111-1111-111111111111',
    'https://us02web.zoom.us/j/82736481920?pwd=secretDay1Join',
    'https://video.abrainoconcious.com/recordings/sprint-day-1-recording.m3u8'
  ),
  (
    'e2222222-2222-2222-2222-222222222222',
    'https://us02web.zoom.us/j/82736481920?pwd=secretDay2Join',
    'https://video.abrainoconcious.com/recordings/sprint-day-2-recording.m3u8'
  ),
  (
    'e4444444-4444-4444-4444-444444444444',
    'https://us02web.zoom.us/j/82736481920?pwd=secretDay4JoinLiveNow',
    NULL
  );

-- ============================================================================
-- 4. Course Curriculum (Sections, Lessons & Protected Media for Course c3333333)
-- ============================================================================
INSERT INTO course_sections (id, program_id, title, description, sort_order)
VALUES
  ('dec11111-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333', 'Module 1: The Psychology of Deep Attention', 'Overcoming mental inertia and cognitive friction', 1),
  ('dec22222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333', 'Module 2: High-Retention Active Recall Systems', 'Methods that guarantee 90%+ syllabus recall', 2),
  ('dec33333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'Module 3: Exam Execution & Pressure Management', 'Performing at your peak under actual test conditions', 3);

INSERT INTO lessons (id, section_id, title, description, sort_order, duration_seconds, is_free_preview, is_published)
VALUES
  ('fee11111-1111-1111-1111-111111111111', 'dec11111-1111-1111-1111-111111111111', '01. Why Traditional Studying Fails Indian Students', 'Understanding passive reading vs active mental engagement.', 1, 840, true, true),
  ('fee22222-2222-2222-2222-222222222222', 'dec11111-1111-1111-1111-111111111111', '02. The Friction Index: Why Starting Is 80% of the Battle', 'How to reduce the activation energy of demanding study blocks.', 2, 920, true, true),
  ('fee33333-3333-3333-3333-333333333333', 'dec11111-1111-1111-1111-111111111111', '03. Building Your Personal Focus Sanctuary', 'Physical and digital hygiene for marathon study endurance.', 3, 1150, false, true),
  ('fee44444-4444-4444-4444-444444444444', 'dec22222-2222-2222-2222-222222222222', '04. The Feynman-Leitner Hybrid Revision Protocol', 'Combining conceptual simplification with spaced box intervals.', 1, 1420, false, true),
  ('fee55555-5555-5555-5555-555555555555', 'dec22222-2222-2222-2222-222222222222', '05. Mind Maps That Actually Work for Revision', 'Structuring non-linear visual memory associations.', 2, 980, false, true),
  ('fee66666-6666-6666-6666-666666666666', 'dec22222-2222-2222-2222-222222222222', '06. Designing Custom Flashcard Decks in Anki', 'Digital spaced repetition without wasting hours creating cards.', 3, 1310, false, true),
  ('fee77777-7777-7777-7777-777777777777', 'dec33333-3333-3333-3333-333333333333', '07. Conquering the 3-Hour Exam Panic Spike', 'Physiological breathing and time management hacks for the exam hall.', 1, 1260, false, true),
  ('fee88888-8888-8888-8888-888888888888', 'dec33333-3333-3333-3333-333333333333', '08. The Post-Exam Debrief & Continuous Iteration', 'How top performers turn errors into unfair strategic advantages.', 2, 890, false, true);

-- Add sample self-hosted video entries
INSERT INTO videos (id, lesson_id, original_filename, size_bytes, duration_seconds, status, progress, renditions)
VALUES
  ('f1111111-1111-1111-1111-111111111111', 'fee11111-1111-1111-1111-111111111111', 'module_1_lesson_1_master.mp4', 482910240, 840, 'ready', 100, '[{"quality":"360p","file":"360p.m3u8"},{"quality":"720p","file":"720p.m3u8"}]'::jsonb),
  ('f2222222-2222-2222-2222-222222222222', 'fee22222-2222-2222-2222-222222222222', 'module_1_lesson_2_master.mp4', 512940120, 920, 'ready', 100, '[{"quality":"360p","file":"360p.m3u8"},{"quality":"720p","file":"720p.m3u8"}]'::jsonb);

-- Protected lesson media
INSERT INTO lesson_media (lesson_id, video_id, content_url, attachments)
VALUES
  (
    'fee11111-1111-1111-1111-111111111111',
    'f1111111-1111-1111-1111-111111111111',
    'https://video.abrainoconcious.com/hls/f1111111/master.m3u8',
    '[{"title": "Lesson 1 Summary PDF", "url": "/attachments/lesson-1-notes.pdf"}]'::jsonb
  ),
  (
    'fee22222-2222-2222-2222-222222222222',
    'f2222222-2222-2222-2222-222222222222',
    'https://video.abrainoconcious.com/hls/f2222222/master.m3u8',
    '[{"title": "Friction Index Calculator", "url": "/attachments/friction-calc.pdf"}]'::jsonb
  );

-- ============================================================================
-- 5. Bundles & Bundle Items
-- ============================================================================
INSERT INTO bundles (id, title, slug, description, price_paise, compare_at_price_paise, thumbnail_url, is_published)
VALUES
  (
    'b1111111-1111-1111-1111-111111111111',
    'The Complete Mindset & Academic Mastery Suite',
    'complete-mindset-academic-suite',
    'Combine the 21-Day Live Mental Discipline Sprint with the complete Deep Work Architecture course at an exclusive bundled saving.',
    599900, -- ₹5,999
    799800, -- ₹7,998 (2999 + 4999)
    '/img/naman-header-480.webp',
    true
  );

INSERT INTO bundle_items (bundle_id, program_id)
VALUES
  ('b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111'),
  ('b1111111-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333');

-- ============================================================================
-- 6. Coupons
-- ============================================================================
INSERT INTO coupons (id, code, discount_type, value, max_uses, used_count, per_user_limit, valid_from, valid_until, is_active)
VALUES
  (
    'cf111111-1111-1111-1111-111111111111',
    'WELCOME20',
    'percent',
    20,
    100,
    1,
    1,
    NOW() - INTERVAL '10 days',
    NOW() + INTERVAL '30 days',
    true
  ),
  (
    'cf222222-2222-2222-2222-222222222222',
    'NAMAN500',
    'flat',
    50000, -- ₹500
    50,
    0,
    1,
    NOW() - INTERVAL '5 days',
    NOW() + INTERVAL '15 days',
    true
  ),
  (
    'cf333333-3333-3333-3333-333333333333',
    'EARLYBIRD',
    'percent',
    30,
    25,
    25,
    1,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '1 day',
    false
  );

-- ============================================================================
-- 7. Orders, Payments, Coupon Redemptions & Enrollment for student_enrolled
-- ============================================================================
INSERT INTO orders (
  id,
  user_id,
  program_id,
  razorpay_order_id,
  amount_paise,
  discount_paise,
  coupon_id,
  status
)
VALUES
  (
    '0ad11111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    'c1111111-1111-1111-1111-111111111111',
    'order_seed_rzp_001',
    239920, -- 299900 - 20% (59980)
    59980,
    'cf111111-1111-1111-1111-111111111111',
    'paid'
  );

INSERT INTO payments (
  id,
  order_id,
  razorpay_payment_id,
  razorpay_signature,
  method,
  amount_paise,
  status,
  captured_at
)
VALUES
  (
    'fa111111-1111-1111-1111-111111111111',
    '0ad11111-1111-1111-1111-111111111111',
    'pay_seed_rzp_001',
    'seed_signature_verified_mock',
    'upi',
    239920,
    'captured',
    NOW() - INTERVAL '3 days'
  );

INSERT INTO coupon_redemptions (coupon_id, user_id, order_id, discount_paise)
VALUES (
  'cf111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  '0ad11111-1111-1111-1111-111111111111',
  59980
);

INSERT INTO enrollments (
  id,
  user_id,
  program_id,
  status,
  payment_id,
  order_id,
  enrolled_at,
  source
)
VALUES
  (
    'ea111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    'c1111111-1111-1111-1111-111111111111',
    'active',
    'fa111111-1111-1111-1111-111111111111',
    '0ad11111-1111-1111-1111-111111111111',
    NOW() - INTERVAL '3 days',
    'paid'
  );

-- ============================================================================
-- 8. Announcements & Notifications
-- ============================================================================
INSERT INTO announcements (id, title, body, kind, audience, program_id, cta_label, cta_url, is_pinned, publish_at)
VALUES
  (
    'a0011111-1111-1111-1111-111111111111',
    'Live Q&A Tonight at 8:00 PM IST',
    'Join Naman for a live open-mic troubleshooting session on Day 4 resistance and study fatigue.',
    'urgent',
    'all',
    NULL,
    'Join Live Session',
    '/my-programs',
    true,
    NOW() - INTERVAL '1 hour'
  ),
  (
    'a0022222-2222-2222-2222-222222222222',
    'Day 3 Workbook Uploaded',
    'The ultradian rhythm tracking template is now available under resources for sprint members.',
    'info',
    'program',
    'c1111111-1111-1111-1111-111111111111',
    'Download Sheet',
    '/resources/day-3-ultradian.pdf',
    false,
    NOW() - INTERVAL '12 hours'
  ),
  (
    'a0033333-3333-3333-3333-333333333333',
    'Deep Work Architecture Course Released!',
    'Master high-retention study architecture with lifetime access and our custom Notion revision systems.',
    'success',
    'all',
    NULL,
    'Explore Course',
    '/courses/deep-work-architecture',
    false,
    NOW() - INTERVAL '2 days'
  );

INSERT INTO notifications (user_id, title, body, type, link_url, is_read)
VALUES
  (
    '33333333-3333-3333-3333-333333333333',
    'Welcome to 21-Day Mental Discipline Sprint!',
    'Your enrollment is active. Explore your dashboard and get ready for Day 1.',
    'enrollment',
    '/my-programs',
    true
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Session Reminder: Day 4 Starts in 4 Hours',
    'Get your notebook ready. Today we tackle the ugly draft rule.',
    'reminder',
    '/my-programs',
    false
  );

-- ============================================================================
-- 9. Progress, Attendance, Reviews, Certificates, Quizzes & Badges
-- ============================================================================
-- Attendance for student_enrolled in Day 1 and Day 2
INSERT INTO session_attendance (user_id, session_id, attended_at, duration_minutes)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '3 days', 45),
  ('33333333-3333-3333-3333-333333333333', 'e2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '2 days', 42);

-- Progress on free preview lesson
INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at, watch_time_seconds, last_position_seconds)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'fee11111-1111-1111-1111-111111111111', true, NOW() - INTERVAL '1 day', 840, 840);

-- Reviews
INSERT INTO reviews (program_id, user_id, rating, title, body, is_published)
VALUES
  (
    'c1111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    5,
    'Cut my screen time from 7 hours to 2.5 hours in 3 days',
    'Naman’s friction protocol changed everything. For the first time in 2 years of UPSC prep, I am actually studying without grabbing my phone every 10 minutes.',
    true
  ),
  (
    'c3333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    5,
    'The Feynman-Leitner revision system is a game-changer',
    'Finally a course that gives practical study systems instead of generic motivational talk. The templates alone are worth 5x the price.',
    true
  );

-- Certificate for student_enrolled
INSERT INTO certificates (certificate_code, user_id, program_id, title, issued_at)
VALUES
  ('ABC-2026-FOCUS-001', '33333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', '21-Day Mental Discipline & Focus Sprint', NOW() - INTERVAL '1 day');

-- Quiz on Lesson 1
INSERT INTO quizzes (id, lesson_id, title, description, passing_score_percent)
VALUES
  ('00000001-1111-1111-1111-111111111111', 'fee11111-1111-1111-1111-111111111111', 'Deep Work & Attention Baseline Quiz', 'Test your understanding of passive reading traps and active recall foundations.', 70);

INSERT INTO quiz_questions (quiz_id, question_text, options, correct_option_index, explanation, sort_order)
VALUES
  (
    '00000001-1111-1111-1111-111111111111',
    'Why does highlighting textbook paragraphs lead to an illusion of competence?',
    '["It uses too much physical ink", "Recognition is passive and creates familiarity without synaptic recall", "It takes longer than writing flashcards", "It strains eyesight"]'::jsonb,
    1,
    'Highlighting relies on recognition memory (seeing familiar words), which tricks the brain into believing it can reproduce the knowledge actively from scratch without cues.',
    1
  ),
  (
    '00000001-1111-1111-1111-111111111111',
    'According to the Friction Rule, what is the best way to prevent phone distraction while studying?',
    '["Relying purely on willpower", "Leaving the phone on silent face-down on your desk", "Physically putting the phone in another room or behind high friction", "Checking it once every 15 minutes"]'::jsonb,
    2,
    'Physical distance and effort create cognitive pause time, interrupting unconscious craving loops before they take over.',
    2
  ),
  (
    '00000001-1111-1111-1111-111111111111',
    'What is the optimal duration of a natural human ultradian focus cycle?',
    '["15-20 minutes", "45-60 minutes", "90-120 minutes followed by rest", "4 continuous hours without water"]'::jsonb,
    2,
    'Biological ultradian rhythms peak around 90 minutes before mental fatigue sets in, requiring a 15-20 minute cognitive break.',
    3
  );

-- Badges
INSERT INTO badges (id, slug, title, description, icon_url)
VALUES
  ('bda11111-1111-1111-1111-111111111111', 'first-step', 'First Step Taken', 'Enrolled in your first transformational program on ABrainoConscious.', '/badges/first-step.svg'),
  ('bda22222-2222-2222-2222-222222222222', 'seven-day-streak', '7-Day Focus Streak', 'Attended live sessions or logged study tasks 7 days consecutively.', '/badges/seven-day-streak.svg'),
  ('bda33333-3333-3333-3333-333333333333', 'challenge-finisher', 'Challenge Finisher', 'Completed 100% of tasks and earned graduation certificate.', '/badges/challenge-finisher.svg');

INSERT INTO user_badges (user_id, badge_id)
VALUES ('33333333-3333-3333-3333-333333333333', 'bda11111-1111-1111-1111-111111111111');

-- ============================================================================
-- 10. Community Posts & Interactions
-- ============================================================================
INSERT INTO posts (id, program_id, user_id, title, body, is_pinned, likes_count, comments_count)
VALUES
  (
    '0000a111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    'Day 2 Task Done: My Screen Time Shock',
    'Did the Day 2 phone audit. I unlocked my phone 114 times yesterday! Moving the phone to the hallway during morning study cut unlocks down to 18 today. Small friction, massive difference.',
    false,
    6,
    2
  ),
  (
    '0000a222-2222-2222-2222-222222222222',
    'c1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Welcome to Day 4 Sprint Cohort Members!',
    'Remember: perfection is the enemy of progress. If you missed yesterday’s task, do not spiral into guilt. Show up today at 7 AM. We reset together.',
    true,
    14,
    3
  );

INSERT INTO comments (post_id, user_id, body)
VALUES
  ('0000a111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Proud of this shift Arjun! The first 72 hours are always the hardest. Keep going!'),
  ('0000a111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Brilliant execution. When you remove visual triggers, willpower doesn’t even have to fight.');

INSERT INTO post_likes (post_id, user_id)
VALUES
  ('0000a111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('0000a111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

-- ============================================================================
-- 11. Site Content, Testimonials, FAQs & Settings
-- ============================================================================
INSERT INTO site_content (key, value)
VALUES
  (
    'hero',
    '{
      "headline": "Master your mind, emotions, studies and habits — with a friend in your corner.",
      "subhead": "Real, grounded self-growth for ambitious Indian students and professionals. Zero fluff, zero fake urgency — just practical daily systems that stick.",
      "primary_cta": "Explore Programs",
      "primary_cta_link": "#trending",
      "secondary_link_text": "Already a member? Sign In",
      "secondary_link_url": "http://localhost:5173/login",
      "trust_line": "7-day risk-free money-back guarantee • Over 14,000 students guided"
    }'::jsonb
  ),
  (
    'stats',
    '{
      "students": 14200,
      "programs": 8,
      "lessons": 64,
      "hours": 52
    }'::jsonb
  ),
  (
    'story_panels',
    '[
      {"num": "01", "pillar": "Academic", "title": "The Exam Pressure Trap", "problem": "Staring at a massive syllabus, paralyzed by the fear of disappointing your parents.", "solution": "A daily active recall system that breaks revision into manageable 90-minute blocks."},
      {"num": "02", "pillar": "Mental", "title": "The Late-Night Overthinking Loop", "problem": "Tossing in bed replay past conversations and catastrophizing your entire future.", "solution": "A 5-minute cognitive mental audit routine that empties your mind before sleep."},
      {"num": "03", "pillar": "Personal", "title": "The Dopamine & Scrolling Pit", "problem": "Picking up your phone for a two-minute break and losing three hours to reels.", "solution": "Physical environmental friction that stops addiction before willpower even engages."},
      {"num": "04", "pillar": "Emotional", "title": "The Isolation & Self-Doubt Wave", "problem": "Feeling completely alone in your struggles while everyone on LinkedIn seems ahead.", "solution": "A supportive peer accountability group where honest struggle is met with mentorship."},
      {"num": "05", "pillar": "Academic", "title": "Passive Reading vs Real Retention", "problem": "Reading textbooks for 8 hours only to forget 90% by mock exam morning.", "solution": "The Feynman-Leitner hybrid method that encodes concepts into permanent memory."},
      {"num": "06", "pillar": "Personal", "title": "The Monday Reset That Dies by Wednesday", "problem": "Starting every week with burst motivation and burning out 48 hours later.", "solution": "Micro-habits built around biological energy cycles rather than unreliable hype."}
    ]'::jsonb
  ),
  (
    'empathy_questions',
    '[
      {"q": "Do you sit down to study with good intentions, only to find yourself scrolling reels 45 minutes later?", "tag": "Personal"},
      {"q": "Do you feel like you are working all day, yet your syllabus never seems to move?", "tag": "Academic"},
      {"q": "Does a single critical comment or low mock test score ruin your entire week?", "tag": "Emotional"},
      {"q": "Are you exhausted before your day has even started, overwhelmed by mental fog?", "tag": "Mental"},
      {"q": "Do you wish you had an honest mentor who actually understands the reality of Indian competitive exams?", "tag": "Community"}
    ]'::jsonb
  ),
  (
    'how_it_works',
    '[
      {"step": "01", "title": "Watch the Concept", "description": "Crisp 15-minute lessons explaining the neuroscience and psychology behind the habit."},
      {"step": "02", "title": "Execute the Daily Task", "description": "A single tangible, actionable exercise designed to take 20 minutes max."},
      {"step": "03", "title": "Attend the Live Session", "description": "Daily live Q&A with Naman to troubleshoot roadblocks and maintain accountability."},
      {"step": "04", "title": "Reflect in Community", "description": "Share your progress in a private circle of peers on the exact same journey."}
    ]'::jsonb
  ),
  (
    'creator_bio',
    '{
      "name": "Naman",
      "title": "Creator & Mentor, ABrainoConscious",
      "bio": "Having built ABrainoConscious from a small YouTube community into a platform serving thousands of learners across India, Naman focuses on practical, human, and sustainable self-development. He believes in honest discipline over toxic productivity.",
      "youtube_subscribers": "150K+",
      "quote": "You do not need more motivation. You need a clearer system, kind self-talk, and a friend who keeps you honest."
    }'::jsonb
  ),
  (
    'timeline',
    '[
      {"year": "2023", "milestone": "The YouTube Journey Begins", "detail": "Starting ABrainoConscious to share raw, unvarnished lessons on mental discipline and focus."},
      {"year": "2024", "milestone": "First 10,000 Students & 7-Day Sprints", "detail": "Launching live cohorts that proved community accountability is 10x more effective than solitary study."},
      {"year": "2026", "milestone": "The Comprehensive Platform", "detail": "Uniting live cohorts, self-paced video packages, and anti-piracy tech under one bespoke roof."}
    ]'::jsonb
  ),
  (
    'plans_copy',
    '{
      "guarantee_title": "7-Day 100% Money-Back Guarantee",
      "guarantee_body": "Join any live challenge or course. Attend the sessions and try the daily tasks. If you don’t feel significantly more focused and calm within 7 days, email support for a full, prompt refund. No questions asked."
    }'::jsonb
  ),
  (
    'footer',
    '{
      "helpline_notice": "ABrainoConscious is an educational platform, not a clinical mental health provider. If you or someone you know is in crisis, please call Tele-MANAS (14416) or KIRAN (1800-599-0019) for free 24/7 confidential professional support in India.",
      "copyright": "© 2026 ABrainoConscious. All rights reserved."
    }'::jsonb
  );

-- Testimonials
INSERT INTO testimonials (author_name, author_role, content, rating, is_featured, sort_order)
VALUES
  (
    'Kavita R.',
    'NEET 2026 Aspirant, Kota',
    'Before joining Naman’s sprint, I was having near-daily panic attacks over mock test ranks. The cognitive grounding methods gave me back control of my nervous system.',
    5,
    true,
    1
  ),
  (
    'Devendra Patel',
    'Software Engineer, Bengaluru',
    'The ultradian rhythm technique doubled my coding output without burnout. The live morning calls create accountability you simply can’t get from a book.',
    5,
    true,
    2
  ),
  (
    'Sanya Malhotra',
    'CA Finalist, Delhi',
    'Studying 10 hours alone in a room was making me feel isolated and depressed. Being part of this community made me realize everyone struggles — and gave me the tools to push through.',
    5,
    true,
    3
  ),
  (
    'Ankit Tiwari',
    'UPSC CSE Aspirant',
    'No toxic hustle culture or fake hype. Naman speaks to you like an older brother who genuinely cares about your wellbeing.',
    5,
    true,
    4
  );

-- FAQs
INSERT INTO faqs (question, answer, category, sort_order, is_published)
VALUES
  (
    'What happens if I miss a live session?',
    'Every live session is recorded and published inside your dashboard within 60 minutes with full timestamps and resource links.',
    'general',
    1,
    true
  ),
  (
    'Is this program suitable for working professionals or just students?',
    'Both! Over 40% of our members are early-career professionals balancing demanding workloads while preparing for entrance exams or career shifts.',
    'general',
    2,
    true
  ),
  (
    'What is your refund policy?',
    'We offer a 7-day no-questions-asked money-back guarantee on all programs. If you participate and don’t find it genuinely transformative, you get 100% of your fee back.',
    'billing',
    3,
    true
  ),
  (
    'What language are the sessions conducted in?',
    'Sessions are conducted in clear, conversational Hinglish (a natural blend of Hindi and English) ensuring clarity and ease of understanding for everyone.',
    'general',
    4,
    true
  ),
  (
    'Are live links accessible on mobile devices?',
    'Yes, the platform is fully responsive and installable as a Progressive Web App (PWA) on Android and iOS.',
    'technical',
    5,
    true
  ),
  (
    'Is ABrainoConscious a mental healthcare service?',
    'No. ABrainoConscious is strictly an educational self-development platform. It is not psychotherapy or psychiatric medical care.',
    'general',
    6,
    true
  );

-- Single-Row Site Settings
INSERT INTO site_settings (
  id,
  brand_name,
  support_email,
  support_whatsapp,
  gst_number,
  legal_text,
  maintenance_mode,
  razorpay_mode
)
VALUES (
  true,
  'ABrainoConscious',
  'support@abrainoconcious.com',
  '+919876543210',
  '07AAAAA0000A1Z5',
  'All educational content and trademarks are property of ABrainoConscious. Unauthorized recording, downloading, or distribution of video courses is strictly prohibited and subject to legal prosecution under the Indian Copyright Act, 1957.',
  false,
  'test'
)
ON CONFLICT (id) DO UPDATE SET
  brand_name = EXCLUDED.brand_name,
  support_email = EXCLUDED.support_email,
  support_whatsapp = EXCLUDED.support_whatsapp,
  gst_number = EXCLUDED.gst_number,
  legal_text = EXCLUDED.legal_text,
  maintenance_mode = EXCLUDED.maintenance_mode,
  razorpay_mode = EXCLUDED.razorpay_mode;
