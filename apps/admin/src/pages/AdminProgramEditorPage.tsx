import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useAuth,
  Button,
  Badge,
  ImageUploader,
  RichTextEditor,
  PosterCard,
} from '@abrainoconscious/ui';
import {
  rupeesToPaise,
  paiseToRupees,
  formatRupees,
  formatDateIST,
  slugify,
  evaluatePublishChecklist,
  ProgramType,
  ProgramStatus,
  ImageSrcSetMap,
  ProgramFaqItem,
  CATEGORY_LABELS,
  PillarCategory,
} from '@abrainoconscious/shared';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  DollarSign,
  Calendar,
  Image as ImageIcon,
  BookOpen,
  Eye,
  Check,
  ChevronRight,
  Plus,
  Trash2,
  Lock,
} from 'lucide-react';

type TabKey = 'basics' | 'pricing' | 'schedule' | 'images' | 'content' | 'visibility' | 'preview';

interface FormData {
  type: ProgramType;
  category: PillarCategory;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  price_rupees: number;
  compare_at_rupees: number | '';
  is_free: boolean;
  max_seats: number | '';
  enrollment_deadline: string;
  starts_at: string;
  ends_at: string;
  thumbnail_url: string;
  thumbnail_alt: string;
  thumbnail_srcset: ImageSrcSetMap | null;
  poster_image_url: string;
  poster_image_alt: string;
  poster_srcset: ImageSrcSetMap | null;
  cover_image_url: string;
  cover_image_alt: string;
  cover_srcset: ImageSrcSetMap | null;
  promo_video_url: string;
  learning_outcomes: string[];
  faqs: ProgramFaqItem[];
  tags: string[];
  status: ProgramStatus;
  is_featured: boolean;
  is_trending_pinned: boolean;
  sort_order: number;
}

const DEFAULT_FORM: FormData = {
  type: 'challenge',
  category: 'emotional',
  title: '',
  slug: '',
  short_description: '',
  description: '',
  price_rupees: 999,
  compare_at_rupees: 1999,
  is_free: false,
  max_seats: 100,
  enrollment_deadline: '',
  starts_at: '',
  ends_at: '',
  thumbnail_url: '',
  thumbnail_alt: '',
  thumbnail_srcset: null,
  poster_image_url: '',
  poster_image_alt: '',
  poster_srcset: null,
  cover_image_url: '',
  cover_image_alt: '',
  cover_srcset: null,
  promo_video_url: '',
  learning_outcomes: [
    'Master emotional triggers and develop instant calm under pressure',
    'Build enduring focus habits with daily progressive accountability',
    'Transform stress into actionable cognitive clarity',
  ],
  faqs: [
    {
      question: 'What is the daily time commitment for this challenge?',
      answer: 'Each session is 45 minutes live, with a 15-minute daily reflective micro-task.',
    },
  ],
  tags: ['mental-resilience', 'habits', 'focus'],
  status: 'draft',
  is_featured: false,
  is_trending_pinned: false,
  sort_order: 0,
};

export const AdminProgramEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { supabase, profile } = useAuth();
  const isNew = !id || id === 'new';
  const isAdmin = profile?.role === 'admin';
  const isStaff = profile?.role === 'staff';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<TabKey>('basics');
  const [previewSubTab, setPreviewSubTab] = useState<'poster' | 'trending' | 'pricing' | 'hero'>('poster');

  // Form State
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [activeEnrollmentsCount, setActiveEnrollmentsCount] = useState(0);

  // Slug check state
  const [isSlugUnique, setIsSlugUnique] = useState(true);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Save State
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Track previous storage paths for atomic replacement
  const oldStoragePathsRef = useRef<{ [key: string]: string[] }>({});

  // Auto-clear toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load existing program if editing
  useEffect(() => {
    if (isNew) return;

    const fetchProgram = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('programs')
          .select('*, enrollments(count)')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) {
          const enrollmentsCount = (data as unknown as { enrollments?: { count: number }[] })
            ?.enrollments?.[0]?.count || 0;
          setActiveEnrollmentsCount(enrollmentsCount);

          setFormData({
            type: data.type as ProgramType,
            category: data.category as PillarCategory,
            title: data.title,
            slug: data.slug,
            short_description: data.short_description || '',
            description: data.description || '',
            price_rupees: paiseToRupees(data.price_paise || 0),
            compare_at_rupees:
              data.compare_at_price_paise !== null && data.compare_at_price_paise !== undefined
                ? paiseToRupees(data.compare_at_price_paise)
                : '',
            is_free: data.price_paise === 0,
            max_seats: data.max_seats || '',
            enrollment_deadline: data.enrollment_deadline
              ? data.enrollment_deadline.slice(0, 16)
              : '',
            starts_at: data.starts_at ? data.starts_at.slice(0, 16) : '',
            ends_at: data.ends_at ? data.ends_at.slice(0, 16) : '',
            thumbnail_url: data.thumbnail_url || '',
            thumbnail_alt: data.thumbnail_alt || '',
            thumbnail_srcset: data.thumbnail_srcset as ImageSrcSetMap | null,
            poster_image_url: data.poster_image_url || '',
            poster_image_alt: data.poster_image_alt || '',
            poster_srcset: data.poster_srcset as ImageSrcSetMap | null,
            cover_image_url: data.cover_image_url || '',
            cover_image_alt: data.cover_image_alt || '',
            cover_srcset: data.cover_srcset as ImageSrcSetMap | null,
            promo_video_url: data.promo_video_url || '',
            learning_outcomes: Array.isArray(data.what_you_will_learn)
              ? (data.what_you_will_learn as string[])
              : DEFAULT_FORM.learning_outcomes,
            faqs: Array.isArray(data.faq)
              ? (data.faq as unknown as ProgramFaqItem[])
              : DEFAULT_FORM.faqs,
            tags: data.tags || [],
            status: data.status as ProgramStatus,
            is_featured: data.is_featured,
            is_trending_pinned: Boolean(data.is_trending_pinned),
            sort_order: data.sort_order || 0,
          });
          setSlugManuallyEdited(true);
        }
      } catch (err: unknown) {
        console.error('Error fetching program:', err);
        setSaveError('Failed to load program data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProgram();
  }, [id, isNew, supabase]);

  // Live slug uniqueness check
  useEffect(() => {
    if (!formData.slug.trim()) return;

    let isMounted = true;
    const checkSlug = async () => {
      setCheckingSlug(true);
      try {
        let query = supabase.from('programs').select('id').eq('slug', formData.slug.trim());
        if (!isNew && id) {
          query = query.neq('id', id);
        }
        const { data } = await query;
        if (isMounted) {
          setIsSlugUnique(!data || data.length === 0);
        }
      } catch (err) {
        console.error('Error checking slug:', err);
      } finally {
        if (isMounted) setCheckingSlug(false);
      }
    };

    const debounce = setTimeout(checkSlug, 350);
    return () => {
      isMounted = false;
      clearTimeout(debounce);
    };
  }, [formData.slug, id, isNew, supabase]);

  // Title change: auto-slugify if user hasn't edited slug manually
  const handleTitleChange = (val: string) => {
    setFormData((prev) => {
      const updated = { ...prev, title: val };
      if (!slugManuallyEdited && isNew) {
        updated.slug = slugify(val);
      }
      return updated;
    });
    setSaveStatus('unsaved');
  };

  // Field change helper
  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setSaveStatus('unsaved');
  };

  // Evaluate Publish Checklist
  const checklist = useMemo(() => {
    return evaluatePublishChecklist({
      title: formData.title,
      slug: formData.slug,
      category: formData.category,
      short_description: formData.short_description,
      description: formData.description,
      type: formData.type,
      price_paise: formData.is_free ? 0 : rupeesToPaise(formData.price_rupees),
      starts_at: formData.starts_at || null,
      ends_at: formData.ends_at || null,
      thumbnail_url: formData.thumbnail_url || null,
      poster_image_url: formData.poster_image_url || null,
      learning_outcomes: formData.learning_outcomes,
      faqs: formData.faqs,
    });
  }, [formData]);

  // Save implementation
  const handleSave = useCallback(
    async (targetStatus?: ProgramStatus) => {
      setSaveStatus('saving');
      setSaveError(null);

      const statusToSave = targetStatus || formData.status;

      // Staff cannot publish
      if (statusToSave === 'published' && isStaff && !isAdmin) {
        setSaveError('Staff cannot publish programs without Super Admin approval.');
        setSaveStatus('unsaved');
        return false;
      }

      // Check checklist if publishing
      if (statusToSave === 'published' && !checklist.canPublish) {
        setSaveError('Cannot publish: Checklist requirements are not fully satisfied.');
        setSaveStatus('unsaved');
        return false;
      }

      const pricePaise = formData.is_free ? 0 : rupeesToPaise(formData.price_rupees || 0);
      const compareAtPaise =
        formData.compare_at_rupees !== ''
          ? rupeesToPaise(Number(formData.compare_at_rupees))
          : null;

      const payload = {
        type: formData.type,
        category: formData.category,
        title: formData.title.trim(),
        slug: formData.slug.trim().toLowerCase(),
        short_description: formData.short_description.trim(),
        description: formData.description.trim(),
        price_paise: pricePaise,
        compare_at_price_paise: compareAtPaise,
        status: statusToSave,
        starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
        ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
        enrollment_deadline: formData.enrollment_deadline
          ? new Date(formData.enrollment_deadline).toISOString()
          : null,
        max_seats: formData.max_seats !== '' ? Number(formData.max_seats) : null,
        thumbnail_url: formData.thumbnail_url || null,
        thumbnail_alt: formData.thumbnail_alt || null,
        thumbnail_srcset: formData.thumbnail_srcset || null,
        poster_image_url: formData.poster_image_url || null,
        poster_image_alt: formData.poster_image_alt || null,
        poster_srcset: formData.poster_srcset || null,
        cover_image_url: formData.cover_image_url || null,
        cover_image_alt: formData.cover_image_alt || null,
        cover_srcset: formData.cover_srcset || null,
        promo_video_url: formData.promo_video_url || null,
        what_you_will_learn: formData.learning_outcomes.filter((item) => item.trim().length > 0) as unknown as NonNullable<import('@abrainoconscious/shared').Json>,
        faq: formData.faqs.filter((f) => f.question.trim().length > 0 && f.answer.trim().length > 0) as unknown as NonNullable<import('@abrainoconscious/shared').Json>,
        tags: formData.tags,
        is_featured: formData.is_featured,
        is_trending_pinned: formData.is_trending_pinned,
        sort_order: Number(formData.sort_order) || 0,
      };

      try {
        if (isNew) {
          const { data, error } = await supabase
            .from('programs')
            .insert(payload)
            .select()
            .single();

          if (error) throw error;
          setSaveStatus('saved');
          setToastMessage('Program created successfully.');
          if (data?.id) {
            navigate(`/programs/${data.id}`, { replace: true });
          }
          return true;
        } else {
          const { error } = await supabase
            .from('programs')
            .update(payload)
            .eq('id', id);

          if (error) throw error;
          setSaveStatus('saved');
          setToastMessage(targetStatus === 'published' ? 'Program published!' : 'Changes saved.');
          if (targetStatus) {
            setFormData((prev) => ({ ...prev, status: targetStatus }));
          }
          return true;
        }
      } catch (err: unknown) {
        console.error('Error saving program:', err);
        // Map database constraint error
        const msg =
          err instanceof Error
            ? err.message.includes('check_published_program')
              ? 'Database rule: Published programs must have valid price, thumbnail, and poster images.'
              : err.message
            : 'Save failed.';
        setSaveError(msg);
        setSaveStatus('unsaved');
        return false;
      }
    },
    [formData, isNew, id, isStaff, isAdmin, checklist, supabase, navigate]
  );

  // Keyboard shortcut: Cmd/Ctrl + S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Unsaved changes beforeunload prompt
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'unsaved') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  // Autosave Draft (debounced 2s for drafts when title and slug exist)
  useEffect(() => {
    if (saveStatus !== 'unsaved' || formData.status !== 'draft' || isNew) return;
    if (!formData.title.trim() || !formData.slug.trim() || !isSlugUnique) return;

    const autoTimer = setTimeout(() => {
      handleSave();
    }, 2000);

    return () => clearTimeout(autoTimer);
  }, [saveStatus, formData, isSlugUnique, isNew, handleSave]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        <p className="text-xs text-[#8D9FA4]">Loading program editor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-[#0E2024] px-4 py-3 text-xs font-semibold text-amber-300 shadow-2xl backdrop-blur-md animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sticky Save Bar */}
      <div className="sticky top-0 z-40 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#1A373E] bg-[#040C0E]/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/programs')}
            className="flex items-center gap-1.5 rounded-lg border border-[#1A373E] bg-[#081619] px-3 py-1.5 text-xs font-semibold text-white hover:border-[#2C525A] hover:bg-[#0E2024] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Programs
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-sm font-bold text-white line-clamp-1">
                {formData.title || 'Untitled Program'}
              </h2>
              <Badge variant={formData.status === 'published' ? 'amber' : 'neutral'}>
                {formData.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-amber-400 animate-pulse">
                <Clock className="h-3.5 w-3.5" /> Saving...
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="flex items-center gap-1 text-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> Unsaved changes
              </span>
            )}
          </div>

          {/* Save Draft */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave('draft')}
            disabled={saveStatus === 'saving'}
            className="text-xs"
          >
            Save Draft
          </Button>

          {/* Publish Button */}
          {formData.status === 'published' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave('draft')}
              className="text-xs"
            >
              Unpublish to Draft
            </Button>
          ) : (
            <div className="relative group">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSave('published')}
                disabled={!checklist.canPublish || (isStaff && !isAdmin) || saveStatus === 'saving'}
                className="text-xs font-semibold"
              >
                Publish Program
              </Button>
              {(!checklist.canPublish || (isStaff && !isAdmin)) && (
                <div className="absolute right-0 top-full mt-2 hidden w-64 rounded-xl border border-[#1A373E] bg-[#0E2024] p-2.5 text-[11px] text-[#8D9FA4] shadow-2xl group-hover:block z-50">
                  {isStaff && !isAdmin ? (
                    <span>Publishing requires Super Admin approval.</span>
                  ) : (
                    <span>
                      Complete all {checklist.failedCount} remaining checklist requirements before
                      publishing.
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save Error Banner */}
      {saveError && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{saveError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            className="text-red-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Left Tabs & Forms + Right Publish Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Editor Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Editor Tabs Navigation */}
          <div className="flex overflow-x-auto border-b border-[#1A373E] pb-px">
            {(
              [
                { key: 'basics', label: '1. Basics', icon: Layers },
                { key: 'pricing', label: '2. Pricing & Seats', icon: DollarSign },
                { key: 'schedule', label: '3. Schedule', icon: Calendar },
                { key: 'images', label: '4. Images', icon: ImageIcon },
                { key: 'content', label: '5. Content & FAQs', icon: BookOpen },
                { key: 'visibility', label: '6. Visibility', icon: Sparkles },
                { key: 'preview', label: '7. Live Preview', icon: Eye },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-[#8D9FA4] hover:border-[#2C525A] hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: BASICS */}
          {activeTab === 'basics' && (
            <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-6 space-y-5">
              <h3 className="font-serif text-base font-bold text-white">Program Foundation</h3>

              {/* Type Selection (Locked if active enrollments exist) */}
              <div>
                <label className="block text-xs font-semibold text-[#8D9FA4] mb-1.5">
                  Program Type {activeEnrollmentsCount > 0 && <span className="text-amber-400">(Locked: Enrolled Students Active)</span>}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={activeEnrollmentsCount > 0}
                    onClick={() => updateField('type', 'challenge')}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      formData.type === 'challenge'
                        ? 'border-amber-500 bg-amber-500/10 text-white'
                        : 'border-[#1A373E] bg-[#040C0E] text-[#8D9FA4] hover:border-[#2C525A]'
                    } ${activeEnrollmentsCount > 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <div className="font-serif text-xs font-bold text-white">Live Challenge (Cohort)</div>
                    <div className="text-[11px] text-[#8D9FA4] mt-1">
                      21-day immersive cohort with daily live sessions and tasks.
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={activeEnrollmentsCount > 0}
                    onClick={() => updateField('type', 'course')}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      formData.type === 'course'
                        ? 'border-amber-500 bg-amber-500/10 text-white'
                        : 'border-[#1A373E] bg-[#040C0E] text-[#8D9FA4] hover:border-[#2C525A]'
                    } ${activeEnrollmentsCount > 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <div className="font-serif text-xs font-bold text-white">Self-Paced Video Course</div>
                    <div className="text-[11px] text-[#8D9FA4] mt-1">
                      Pre-recorded video curriculum with modules and quizzes.
                    </div>
                  </button>
                </div>
              </div>

              {/* Title & Slug */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8D9FA4] mb-1.5">
                    Program Title <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. 21-Day Mind & Emotion Mastery"
                    className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#8D9FA4]">
                      URL Slug <span className="text-amber-400">*</span>
                    </label>
                    <span className="text-[11px]">
                      {checkingSlug ? (
                        <span className="text-amber-400">Checking uniqueness...</span>
                      ) : isSlugUnique ? (
                        <span className="text-emerald-400">✓ Slug is available</span>
                      ) : (
                        <span className="text-red-400">✗ Slug already in use</span>
                      )}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 font-mono text-xs text-[#8D9FA4]">
                      /programs/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        updateField('slug', slugify(e.target.value));
                      }}
                      placeholder="mind-emotion-mastery"
                      className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] pl-24 pr-3.5 py-2.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Pillar Category */}
              <div>
                <label className="block text-xs font-semibold text-[#8D9FA4] mb-1.5">
                  Growth Pillar Category <span className="text-amber-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(
                    [
                      { key: 'emotional', label: 'Emotional', desc: 'Inner peace & regulation' },
                      { key: 'mental', label: 'Mental', desc: 'Resilience & mental habits' },
                      { key: 'academic', label: 'Academic', desc: 'Deep focus & study craft' },
                      { key: 'personal', label: 'Personal', desc: 'Identity & life vision' },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => updateField('category', p.key)}
                      className={`rounded-xl border p-2.5 text-left transition-colors ${
                        formData.category === p.key
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-[#1A373E] bg-[#040C0E] text-[#8D9FA4] hover:border-[#2C525A]'
                      }`}
                    >
                      <div className="font-serif text-xs font-bold text-white">{p.label}</div>
                      <div className="text-[10px] text-[#8D9FA4] mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Short Description (160 char counter) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#8D9FA4]">
                    Short Description (Catalog cards & meta) <span className="text-amber-400">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      formData.short_description.length > 160
                        ? 'text-red-400 font-bold'
                        : formData.short_description.length >= 10
                        ? 'text-emerald-400'
                        : 'text-[#8D9FA4]'
                    }`}
                  >
                    {formData.short_description.length} / 160 characters
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={formData.short_description}
                  onChange={(e) => updateField('short_description', e.target.value)}
                  placeholder="A concise, punchy description shown on catalog cards and mobile rails (max 160 chars)."
                  className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] p-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Full Description with Tiptap RichTextEditor */}
              <div>
                <label className="block text-xs font-semibold text-[#8D9FA4] mb-1.5">
                  Full Description & Curriculum Overview <span className="text-amber-400">*</span>
                </label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(cleanHtml) => updateField('description', cleanHtml)}
                  placeholder="Detail the complete journey, who this is for, and student transformation expectations..."
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-[#8D9FA4] mb-1.5">
                  Tags & Search Keywords
                </label>
                <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#1A373E] bg-[#040C0E] p-2">
                  {formData.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1 rounded-md bg-[#152B30] px-2 py-0.5 text-xs text-amber-300"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() =>
                          updateField(
                            'tags',
                            formData.tags.filter((_, i) => i !== idx)
                          )
                        }
                        className="text-[#8D9FA4] hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Type tag and press Enter..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim().toLowerCase().replace(/^#/, '');
                        if (val && !formData.tags.includes(val)) {
                          updateField('tags', [...formData.tags, val]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                    className="flex-1 bg-transparent px-2 py-1 text-xs text-white placeholder-[#8D9FA4]/60 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRICING AND SEATS */}
          {activeTab === 'pricing' && (
            <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-6 space-y-6">
              <h3 className="font-serif text-base font-bold text-white">Commercial Settings</h3>

              {/* Staff lock notice for published program pricing */}
              {isStaff && !isAdmin && formData.status === 'published' && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-300">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>
                    Staff cannot modify pricing on an active published program. Contact a Super Admin.
                  </span>
                </div>
              )}

              {/* Free Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-[#1A373E] bg-[#040C0E] p-4">
                <div>
                  <div className="font-serif text-xs font-bold text-white">Free Program</div>
                  <div className="text-[11px] text-[#8D9FA4] mt-0.5">
                    Allow all students to enroll without entering credit card or payment details.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_free}
                  disabled={isStaff && !isAdmin && formData.status === 'published'}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData((prev) => ({
                      ...prev,
                      is_free: checked,
                      price_rupees: checked ? 0 : prev.price_rupees || 999,
                    }));
                    setSaveStatus('unsaved');
                  }}
                  className="h-4 w-4 rounded border-[#1A373E] bg-[#081619] text-amber-500 focus:ring-0"
                />
              </div>

              {/* Pricing in INR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8D9FA4] mb-1.5">
                    Program Price (INR ₹) <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-[#8D9FA4]">₹</span>
                    <input
                      type="number"
                      min={0}
                      disabled={formData.is_free || (isStaff && !isAdmin && formData.status === 'published')}
                      value={formData.is_free ? 0 : formData.price_rupees}
                      onChange={(e) => updateField('price_rupees', Math.max(0, Number(e.target.value)))}
                      className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] pl-7 pr-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-[#8D9FA4]">
                    Stored internally as {rupeesToPaise(formData.is_free ? 0 : formData.price_rupees)} paise.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8D9FA4] mb-1.5">
                    Compare-At Price (INR ₹ strike-through)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-[#8D9FA4]">₹</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="Optional, e.g. 1999"
                      disabled={formData.is_free || (isStaff && !isAdmin && formData.status === 'published')}
                      value={formData.compare_at_rupees}
                      onChange={(e) =>
                        updateField(
                          'compare_at_rupees',
                          e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                        )
                      }
                      className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] pl-7 pr-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  {formData.compare_at_rupees !== '' &&
                    Number(formData.compare_at_rupees) <= formData.price_rupees && (
                      <p className="mt-1 text-[11px] text-amber-400">
                        Compare-at price must be greater than current price for strike-through to show.
                      </p>
                    )}
                </div>
              </div>

              {/* Seats and Enrollment Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#1A373E]">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#8D9FA4]">Max Seat Capacity</label>
                    {activeEnrollmentsCount > 0 && (
                      <span className="text-[11px] text-amber-400">
                        {activeEnrollmentsCount} seats taken
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min={1}
                    placeholder="Leave blank for unlimited"
                    value={formData.max_seats}
                    onChange={(e) =>
                      updateField('max_seats', e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8D9FA4] mb-1.5">
                    Enrollment Deadline (IST)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.enrollment_deadline}
                    onChange={(e) => updateField('enrollment_deadline', e.target.value)}
                    className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                  {formData.enrollment_deadline && (
                    <p className="mt-1 text-[11px] text-[#8D9FA4]">
                      {formatDateIST(formData.enrollment_deadline)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SCHEDULE */}
          {activeTab === 'schedule' && (
            <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-6 space-y-6">
              <h3 className="font-serif text-base font-bold text-white">Cohort & Timeline</h3>

              {formData.type === 'challenge' ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-300">
                    All challenge session times are scheduled and displayed in Indian Standard Time (IST, UTC+5:30).
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#8D9FA4] mb-1.5">
                        Challenge Starts At (IST) <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.starts_at}
                        onChange={(e) => updateField('starts_at', e.target.value)}
                        className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                      {formData.starts_at && (
                        <p className="mt-1 text-[11px] text-[#8D9FA4]">
                          {formatDateIST(formData.starts_at)}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#8D9FA4] mb-1.5">
                        Challenge Ends At (IST) <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.ends_at}
                        onChange={(e) => updateField('ends_at', e.target.value)}
                        className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                      {formData.ends_at && (
                        <p className="mt-1 text-[11px] text-[#8D9FA4]">
                          {formatDateIST(formData.ends_at)}
                        </p>
                      )}
                    </div>
                  </div>

                  {formData.starts_at &&
                    formData.ends_at &&
                    new Date(formData.ends_at).getTime() <= new Date(formData.starts_at).getTime() && (
                      <div className="rounded-xl bg-red-500/10 p-3 text-xs text-red-300">
                        Error: Challenge End Date must be after the Start Date.
                      </div>
                    )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl bg-[#040C0E] p-4 text-xs text-[#8D9FA4]">
                    Video courses are self-paced. Students gain access upon purchase. Modules and DRM lessons are configured in the course builder.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: IMAGES */}
          {activeTab === 'images' && (
            <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-6 space-y-6">
              <div>
                <h3 className="font-serif text-base font-bold text-white">Visual Assets Pipeline</h3>
                <p className="text-xs text-[#8D9FA4] mt-1">
                  Upload high-resolution images. Our client-side canvas engine automatically strips EXIF/GPS
                  tags and produces 3 responsive WebP renditions for fast, secure delivery.
                </p>
              </div>

              {/* 1. Thumbnail Uploader (16:9) */}
              <div className="rounded-xl border border-[#1A373E] bg-[#040C0E] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-sm font-bold text-white">
                    1. Catalog Thumbnail (16:9) <span className="text-amber-400">*</span>
                  </h4>
                  <Badge variant="outline">Recommended: 1280 × 720</Badge>
                </div>
                <ImageUploader
                  programId={id || 'temp'}
                  kind="thumbnail"
                  initialRatio="16:9"
                  initialAlt={formData.thumbnail_alt}
                  currentImageUrl={formData.thumbnail_url}
                  currentSrcset={formData.thumbnail_srcset}
                  supabase={supabase}
                  onUploadSuccess={({ primaryUrl, srcset, uploadedPaths }) => {
                    if (uploadedPaths && uploadedPaths.length > 0) {
                      oldStoragePathsRef.current['thumbnail'] = uploadedPaths;
                    }
                    setFormData((prev) => ({
                      ...prev,
                      thumbnail_url: primaryUrl,
                      thumbnail_srcset: srcset,
                    }));
                    setSaveStatus('unsaved');
                    setToastMessage('Thumbnail uploaded with responsive WebP renditions.');
                  }}
                  onAltChange={(alt) => updateField('thumbnail_alt', alt)}
                  onRemove={() => {
                    setFormData((prev) => ({
                      ...prev,
                      thumbnail_url: '',
                      thumbnail_srcset: null,
                    }));
                    setSaveStatus('unsaved');
                  }}
                />
              </div>

              {/* 2. Poster Uploader (2:3) */}
              <div className="rounded-xl border border-[#1A373E] bg-[#040C0E] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-sm font-bold text-white">
                    2. Streaming-Style Poster (2:3) <span className="text-amber-400">*</span>
                  </h4>
                  <Badge variant="outline">Recommended: 600 × 900</Badge>
                </div>
                <ImageUploader
                  programId={id || 'temp'}
                  kind="poster"
                  initialRatio="2:3"
                  initialAlt={formData.poster_image_alt}
                  currentImageUrl={formData.poster_image_url}
                  currentSrcset={formData.poster_srcset}
                  supabase={supabase}
                  onUploadSuccess={({ primaryUrl, srcset, uploadedPaths }) => {
                    if (uploadedPaths && uploadedPaths.length > 0) {
                      oldStoragePathsRef.current['poster'] = uploadedPaths;
                    }
                    setFormData((prev) => ({
                      ...prev,
                      poster_image_url: primaryUrl,
                      poster_srcset: srcset,
                    }));
                    setSaveStatus('unsaved');
                    setToastMessage('Poster uploaded with responsive WebP renditions.');
                  }}
                  onAltChange={(alt) => updateField('poster_image_alt', alt)}
                  onRemove={() => {
                    setFormData((prev) => ({
                      ...prev,
                      poster_image_url: '',
                      poster_srcset: null,
                    }));
                    setSaveStatus('unsaved');
                  }}
                />
              </div>

              {/* 3. Cover Wide Hero Uploader */}
              <div className="rounded-xl border border-[#1A373E] bg-[#040C0E] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-sm font-bold text-white">
                    3. Wide Hero Cover (16:9 or 21:9)
                  </h4>
                  <Badge variant="outline">Recommended: 1920 × 1080</Badge>
                </div>
                <ImageUploader
                  programId={id || 'temp'}
                  kind="cover"
                  initialRatio="16:9"
                  initialAlt={formData.cover_image_alt}
                  currentImageUrl={formData.cover_image_url}
                  currentSrcset={formData.cover_srcset}
                  supabase={supabase}
                  onUploadSuccess={({ primaryUrl, srcset, uploadedPaths }) => {
                    if (uploadedPaths && uploadedPaths.length > 0) {
                      oldStoragePathsRef.current['cover'] = uploadedPaths;
                    }
                    setFormData((prev) => ({
                      ...prev,
                      cover_image_url: primaryUrl,
                      cover_srcset: srcset,
                    }));
                    setSaveStatus('unsaved');
                    setToastMessage('Cover uploaded with responsive WebP renditions.');
                  }}
                  onAltChange={(alt) => updateField('cover_image_alt', alt)}
                  onRemove={() => {
                    setFormData((prev) => ({
                      ...prev,
                      cover_image_url: '',
                      cover_srcset: null,
                    }));
                    setSaveStatus('unsaved');
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 5: CONTENT AND FAQS */}
          {activeTab === 'content' && (
            <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-6 space-y-6">
              <h3 className="font-serif text-base font-bold text-white">Course Curriculum & FAQs</h3>

              {/* Promo Video URL */}
              <div>
                <label className="block text-xs font-semibold text-[#8D9FA4] mb-1.5">
                  Promo Video URL (YouTube or Vimeo)
                </label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                  value={formData.promo_video_url}
                  onChange={(e) => updateField('promo_video_url', e.target.value)}
                  className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
                {/* Embed Preview if valid */}
                {formData.promo_video_url && (
                  <div className="mt-3 aspect-video w-full max-w-md overflow-hidden rounded-xl border border-[#1A373E] bg-black">
                    {formData.promo_video_url.includes('youtube.com') ||
                    formData.promo_video_url.includes('youtu.be') ? (
                      <iframe
                        title="Promo Preview"
                        className="h-full w-full"
                        src={formData.promo_video_url.replace('watch?v=', 'embed/')}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[#8D9FA4]">
                        External Video Preview
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* What You Will Learn List Builder */}
              <div className="space-y-3 pt-4 border-t border-[#1A373E]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-serif text-xs font-bold text-white">
                      What You Will Learn <span className="text-amber-400">*</span>
                    </h4>
                    <p className="text-[11px] text-[#8D9FA4]">At least 3 key transformative takeaways.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateField('learning_outcomes', [...formData.learning_outcomes, ''])
                    }
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Outcome
                  </Button>
                </div>

                <div className="space-y-2">
                  {formData.learning_outcomes.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#152B30] text-[11px] font-bold text-amber-400">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={item}
                        placeholder="e.g. Master emotional triggers and cultivate deep presence"
                        onChange={(e) => {
                          const updated = [...formData.learning_outcomes];
                          updated[idx] = e.target.value;
                          updateField('learning_outcomes', updated);
                        }}
                        className="flex-1 rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateField(
                            'learning_outcomes',
                            formData.learning_outcomes.filter((_, i) => i !== idx)
                          )
                        }
                        className="p-1.5 text-[#8D9FA4] hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ Item Builder */}
              <div className="space-y-3 pt-4 border-t border-[#1A373E]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-serif text-xs font-bold text-white">
                      Frequently Asked Questions <span className="text-amber-400">*</span>
                    </h4>
                    <p className="text-[11px] text-[#8D9FA4]">Provide at least 1 helpful question and answer.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateField('faqs', [
                        ...formData.faqs,
                        { question: '', answer: '' },
                      ])
                    }
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add FAQ
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-[#1A373E] bg-[#040C0E] p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-400">FAQ #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateField(
                              'faqs',
                              formData.faqs.filter((_, i) => i !== idx)
                            )
                          }
                          className="p-1 text-[#8D9FA4] hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Question (e.g. Do I receive a certificate?)"
                        value={faq.question}
                        onChange={(e) => {
                          const updated = [...formData.faqs];
                          updated[idx] = { ...faq, question: e.target.value };
                          updateField('faqs', updated);
                        }}
                        className="w-full rounded-lg border border-[#1A373E] bg-[#081619] px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                      <textarea
                        rows={2}
                        placeholder="Answer..."
                        value={faq.answer}
                        onChange={(e) => {
                          const updated = [...formData.faqs];
                          updated[idx] = { ...faq, answer: e.target.value };
                          updateField('faqs', updated);
                        }}
                        className="w-full rounded-lg border border-[#1A373E] bg-[#081619] px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: VISIBILITY */}
          {activeTab === 'visibility' && (
            <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-6 space-y-6">
              <h3 className="font-serif text-base font-bold text-white">Catalog Placement & Ranks</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8D9FA4] mb-1.5">
                    Lifecycle Status
                  </label>
                  <select
                    aria-label="Lifecycle Status"
                    value={formData.status}
                    onChange={(e) => updateField('status', e.target.value as ProgramStatus)}
                    className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="draft">Draft (Private, not visible in catalog)</option>
                    <option value="published">Published (Visible in store)</option>
                    <option value="live">Live (Cohort active right now)</option>
                    <option value="completed">Completed (Archived live session access)</option>
                    <option value="archived">Archived (Retired)</option>
                  </select>
                </div>

                {/* Featured Toggle */}
                <div className="flex items-center justify-between rounded-xl border border-[#1A373E] bg-[#040C0E] p-4">
                  <div>
                    <div className="font-serif text-xs font-bold text-white">Featured Program</div>
                    <div className="text-[11px] text-[#8D9FA4] mt-0.5">
                      Showcases program in the primary Hero spotlight and Featured banner rails.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => updateField('is_featured', e.target.checked)}
                    className="h-4 w-4 rounded border-[#1A373E] bg-[#081619] text-amber-500 focus:ring-0"
                  />
                </div>

                {/* Pin to Trending Toggle */}
                <div className="flex items-center justify-between rounded-xl border border-[#1A373E] bg-[#040C0E] p-4">
                  <div>
                    <div className="font-serif text-xs font-bold text-white">Pin to Trending Rail</div>
                    <div className="text-[11px] text-[#8D9FA4] mt-0.5">
                      Highlights program in the Trending shelf with high visibility.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.is_trending_pinned}
                    onChange={(e) => updateField('is_trending_pinned', e.target.checked)}
                    className="h-4 w-4 rounded border-[#1A373E] bg-[#081619] text-amber-500 focus:ring-0"
                  />
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-xs font-semibold text-[#8D9FA4] mb-1.5">
                    Manual Catalog Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => updateField('sort_order', Number(e.target.value) || 0)}
                    className="w-32 rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[#8D9FA4]">
                    Lower numbers appear earlier in catalog lists and default ordering.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: LIVE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-white">Multi-Device Live Preview</h3>
                  <p className="text-xs text-[#8D9FA4]">
                    Inspect how this program renders across student components and landing pages.
                  </p>
                </div>
                <div className="flex items-center rounded-lg border border-[#1A373E] bg-[#040C0E] p-1 text-xs">
                  {(
                    [
                      { key: 'poster', label: 'Poster Card' },
                      { key: 'trending', label: 'Trending Rank' },
                      { key: 'pricing', label: 'Landing Price Card' },
                      { key: 'hero', label: 'Mobile Hero' },
                    ] as const
                  ).map((sub) => (
                    <button
                      key={sub.key}
                      type="button"
                      onClick={() => setPreviewSubTab(sub.key)}
                      className={`rounded px-3 py-1 transition-colors ${
                        previewSubTab === sub.key
                          ? 'bg-amber-500 text-black font-semibold'
                          : 'text-[#8D9FA4] hover:text-white'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-view: Poster Card */}
              {previewSubTab === 'poster' && (
                <div className="flex flex-col items-center justify-center p-8 bg-[#040C0E] rounded-xl border border-[#1A373E]">
                  <div className="w-56">
                    <PosterCard
                      id={id || 'preview-id'}
                      title={formData.title || 'Untitled Program'}
                      category={CATEGORY_LABELS[formData.category]}
                      coverImage={formData.poster_image_url || formData.thumbnail_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136'}
                      coverSrcset={formData.poster_srcset as Record<string, string> | undefined}
                      pricePaise={formData.is_free ? 0 : rupeesToPaise(formData.price_rupees)}
                      compareAtPricePaise={
                        formData.compare_at_rupees !== ''
                          ? rupeesToPaise(Number(formData.compare_at_rupees))
                          : undefined
                      }
                      onSelect={() => {}}
                    />
                  </div>
                </div>
              )}

              {/* Sub-view: Trending Rank Poster */}
              {previewSubTab === 'trending' && (
                <div className="flex flex-col items-center justify-center p-8 bg-[#040C0E] rounded-xl border border-[#1A373E]">
                  <div className="relative flex items-end">
                    <span className="font-serif text-8xl font-black text-amber-500 -mr-6 z-10 drop-shadow-2xl select-none">
                      1
                    </span>
                    <div className="w-56 overflow-hidden rounded-xl border border-[#1A373E] bg-[#081619] shadow-2xl">
                      <div className="aspect-[2/3] w-full bg-black">
                        <img
                          src={formData.poster_image_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136'}
                          alt={formData.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <h4 className="font-serif text-xs font-bold text-white line-clamp-1">
                          {formData.title || 'Untitled Program'}
                        </h4>
                        <span className="text-[10px] text-amber-400 font-semibold">
                          {CATEGORY_LABELS[formData.category]}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-view: Landing Page Pricing Card */}
              {previewSubTab === 'pricing' && (
                <div className="flex justify-center p-8 bg-[#040C0E] rounded-xl border border-[#1A373E]">
                  <div className="w-full max-w-sm rounded-2xl border border-amber-500/50 bg-[#081619] p-6 shadow-2xl space-y-4">
                    <Badge variant="amber">{CATEGORY_LABELS[formData.category]}</Badge>
                    <h3 className="font-serif text-xl font-bold text-white">
                      {formData.title || 'Program Title'}
                    </h3>
                    <p className="text-xs text-[#8D9FA4]">
                      {formData.short_description || 'Concise overview of student transformation.'}
                    </p>

                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-3xl font-bold text-white">
                        {formData.is_free ? 'FREE' : formatRupees(formData.price_rupees)}
                      </span>
                      {formData.compare_at_rupees !== '' &&
                        Number(formData.compare_at_rupees) > formData.price_rupees && (
                          <span className="text-xs text-[#8D9FA4] line-through">
                            {formatRupees(Number(formData.compare_at_rupees))}
                          </span>
                        )}
                    </div>

                    <div className="space-y-2 border-t border-[#1A373E] pt-4">
                      <span className="text-xs font-bold text-white">Curriculum Highlights:</span>
                      {formData.learning_outcomes.slice(0, 4).map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-[#E1E8EA]">
                          <Check className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                          <span>{item || 'Learning outcome'}</span>
                        </div>
                      ))}
                    </div>

                    <Button variant="primary" size="md" className="w-full mt-4">
                      Join Cohort Now
                    </Button>
                  </div>
                </div>
              )}

              {/* Sub-view: Mobile Hero */}
              {previewSubTab === 'hero' && (
                <div className="flex justify-center p-8 bg-[#040C0E] rounded-xl border border-[#1A373E]">
                  <div className="w-72 overflow-hidden rounded-3xl border-4 border-[#1A373E] bg-[#040C0E] shadow-2xl">
                    <div className="relative aspect-video w-full bg-black">
                      <img
                        src={formData.cover_image_url || formData.thumbnail_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136'}
                        alt={formData.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#040C0E] via-transparent to-transparent" />
                    </div>
                    <div className="p-4 space-y-2">
                      <Badge variant="outline">{CATEGORY_LABELS[formData.category]}</Badge>
                      <h4 className="font-serif text-sm font-bold text-white">
                        {formData.title || 'Untitled Program'}
                      </h4>
                      <p className="text-[11px] text-[#8D9FA4] line-clamp-2">
                        {formData.short_description || 'Student journey preview.'}
                      </p>
                      <Button variant="primary" size="sm" className="w-full text-xs">
                        {formData.is_free ? 'Enroll Free' : `Enroll ${formatRupees(formData.price_rupees)}`}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Publish Checklist Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="sticky top-20 rounded-2xl border border-[#1A373E] bg-[#081619] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#1A373E]">
              <div>
                <h3 className="font-serif text-sm font-bold text-white">Publish Checklist</h3>
                <span className="text-[11px] text-[#8D9FA4]">
                  {checklist.canPublish
                    ? 'All requirements satisfied'
                    : `${checklist.failedCount} items remaining`}
                </span>
              </div>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  checklist.canPublish
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {checklist.canPublish ? '✓' : checklist.failedCount}
              </span>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2.5">
              {checklist.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    // Navigate to appropriate tab when clicked
                    if (['title', 'slug', 'category', 'short_description', 'description'].includes(item.id)) {
                      setActiveTab('basics');
                    } else if (item.id === 'price') {
                      setActiveTab('pricing');
                    } else if (item.id === 'dates') {
                      setActiveTab('schedule');
                    } else if (['thumbnail', 'poster', 'alt_text'].includes(item.id)) {
                      setActiveTab('images');
                    } else if (['learning_outcomes', 'faqs'].includes(item.id)) {
                      setActiveTab('content');
                    }
                  }}
                  className={`flex items-start gap-2.5 rounded-xl border p-2.5 cursor-pointer transition-colors ${
                    item.passed
                      ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50'
                      : 'border-[#1A373E] bg-[#040C0E] hover:border-amber-500/40'
                  }`}
                >
                  <div className="mt-0.5">
                    {item.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-[#8D9FA4]/40" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div
                      className={`text-xs font-semibold ${
                        item.passed ? 'text-[#E1E8EA]' : 'text-white'
                      }`}
                    >
                      {item.label}
                    </div>
                    <div className="text-[10px] text-[#8D9FA4] mt-0.5">{item.description}</div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-[#8D9FA4]/50 mt-1" />
                </div>
              ))}
            </div>

            {/* Bottom summary and publish shortcut */}
            <div className="pt-2 border-t border-[#1A373E]">
              {checklist.canPublish ? (
                <div className="rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-400 text-center font-semibold">
                  Program is ready to be published!
                </div>
              ) : (
                <div className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-300 text-center">
                  Resolve grey circles above to enable instant publishing.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
