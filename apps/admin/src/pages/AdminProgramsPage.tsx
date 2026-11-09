import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useAuth,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  CATEGORY_LABELS,
  PillarCategory,
} from '@abrainoconscious/ui';
import {
  formatPaise,
  formatDateIST,
  evaluatePublishChecklist,
  ProgramRow,
  ProgramType,
  ProgramStatus,
  ProgramFaqItem,
} from '@abrainoconscious/shared';
import {
  Plus,
  Search,
  Grid,
  List,
  ArrowUpDown,
  Edit2,
  Copy,
  Eye,
  Archive,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  GripVertical,
  Check,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProgramWithEnrollments extends ProgramRow {
  enrollments?: { count: number }[];
}

// Sortable item wrapper for DnD reordering
const SortableProgramRow: React.FC<{
  program: ProgramWithEnrollments;
  index: number;
}> = ({ program, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: program.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between gap-4 rounded-xl border border-[#1A373E] bg-[#081619] p-4 transition-colors ${
        isDragging ? 'border-amber-500 shadow-xl' : 'hover:border-[#2C525A]'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="cursor-grab touch-none p-1 text-[#8D9FA4] hover:text-white"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#040C0E] text-xs font-bold text-amber-500">
          {index + 1}
        </div>
        {program.thumbnail_url ? (
          <img
            src={program.thumbnail_url}
            alt={program.title}
            className="h-10 w-16 rounded object-cover"
          />
        ) : (
          <div className="flex h-10 w-16 items-center justify-center rounded bg-[#040C0E] text-[10px] text-[#8D9FA4]">
            No img
          </div>
        )}
        <div>
          <h4 className="font-serif text-sm font-semibold text-white">{program.title}</h4>
          <span className="text-[11px] text-[#8D9FA4]">
            {CATEGORY_LABELS[program.category as PillarCategory] || program.category} • {program.type}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={program.status === 'published' ? 'amber' : 'neutral'}>
          {program.status}
        </Badge>
        <span className="text-xs text-[#8D9FA4]">Sort order: {program.sort_order}</span>
      </div>
    </div>
  );
};

export const AdminProgramsPage: React.FC = () => {
  const navigate = useNavigate();
  const { supabase, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  // Data State
  const [programs, setPrograms] = useState<ProgramWithEnrollments[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // View & Filter States
  const [viewMode, setViewMode] = useState<'table' | 'card' | 'reorder'>('table');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [featuredFilter, setFeaturedFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updated_at' | 'created_at' | 'title' | 'sort_order' | 'price_paise'>('sort_order');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const pageSize = 12;

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkCategoryModalOpen, setBulkCategoryModalOpen] = useState(false);
  const [targetCategory, setTargetCategory] = useState<PillarCategory>('emotional');

  // Modals
  const [deleteModalProgram, setDeleteModalProgram] = useState<ProgramWithEnrollments | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [unpublishConfirmProgram, setUnpublishConfirmProgram] = useState<ProgramWithEnrollments | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Query programs from Supabase
  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('programs')
        .select('*, enrollments(count)', { count: 'exact' })
        .is('deleted_at', null);

      if (search.trim()) {
        query = query.ilike('title', `%${search.trim()}%`);
      }
      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter as ProgramType);
      }
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter as PillarCategory);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as ProgramStatus);
      }
      if (featuredFilter === 'featured') {
        query = query.eq('is_featured', true);
      } else if (featuredFilter === 'standard') {
        query = query.eq('is_featured', false);
      }

      // Ordering
      query = query.order(sortBy, { ascending: sortAsc });

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      setPrograms((data as unknown as ProgramWithEnrollments[]) || []);
      setTotalCount(count || 0);
    } catch (err: unknown) {
      console.error('Error fetching programs:', err);
      setToastMessage('Failed to load programs.');
    } finally {
      setLoading(false);
    }
  }, [supabase, search, typeFilter, categoryFilter, statusFilter, featuredFilter, sortBy, sortAsc, page]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  // Reset page to 1 on filter changes
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [search, typeFilter, categoryFilter, statusFilter, featuredFilter, sortBy, sortAsc]);

  // Bulk Selection Helpers
  const allCurrentIds = useMemo(() => programs.map((p) => p.id), [programs]);
  const isAllSelected = allCurrentIds.length > 0 && allCurrentIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allCurrentIds);
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Duplicate Program
  const handleDuplicate = async (program: ProgramWithEnrollments) => {
    try {
      const uniqueSuffix = Math.random().toString(36).substring(2, 6);
      const newTitle = `Copy of ${program.title}`;
      const newSlug = `${program.slug}-copy-${uniqueSuffix}`;

      const { data: newProg, error } = await supabase
        .from('programs')
        .insert({
          type: program.type,
          category: program.category,
          title: newTitle,
          slug: newSlug,
          short_description: program.short_description,
          description: program.description,
          thumbnail_url: program.thumbnail_url,
          thumbnail_alt: program.thumbnail_alt,
          thumbnail_srcset: program.thumbnail_srcset,
          poster_image_url: program.poster_image_url,
          poster_image_alt: program.poster_image_alt,
          poster_srcset: program.poster_srcset,
          cover_image_url: program.cover_image_url,
          cover_image_alt: program.cover_image_alt,
          cover_srcset: program.cover_srcset,
          promo_video_url: program.promo_video_url,
          price_paise: program.price_paise,
          compare_at_price_paise: program.compare_at_price_paise,
          status: 'draft',
          starts_at: program.starts_at,
          ends_at: program.ends_at,
          enrollment_deadline: program.enrollment_deadline,
          max_seats: program.max_seats,
          is_featured: false,
          is_trending_pinned: false,
          sort_order: (program.sort_order || 0) + 1,
          tags: program.tags || [],
          what_you_will_learn: program.what_you_will_learn || [],
          faq: program.faq || [],
        })
        .select()
        .single();

      if (error) throw error;
      setToastMessage(`Created draft duplicate "${newTitle}"`);
      fetchPrograms();
      if (newProg?.id) {
        navigate(`/programs/${newProg.id}`);
      }
    } catch (err: unknown) {
      console.error('Failed to duplicate:', err);
      setToastMessage('Could not duplicate program.');
    }
  };

  // Publish or Unpublish
  const handleTogglePublish = async (program: ProgramWithEnrollments) => {
    const activeCount = program.enrollments?.[0]?.count || 0;

    if (program.status === 'published') {
      // Unpublishing
      if (activeCount > 0) {
        setUnpublishConfirmProgram(program);
        return;
      }
      await executeStatusChange(program.id, 'draft');
    } else {
      // Publishing - check checklist first
      const checklist = evaluatePublishChecklist({
        title: program.title,
        slug: program.slug,
        category: program.category,
        short_description: program.short_description,
        description: program.description,
        type: program.type,
        price_paise: program.price_paise,
        starts_at: program.starts_at,
        ends_at: program.ends_at,
        thumbnail_url: program.thumbnail_url,
        poster_image_url: program.poster_image_url,
        learning_outcomes: Array.isArray(program.what_you_will_learn)
          ? (program.what_you_will_learn as string[])
          : [],
        faqs: Array.isArray(program.faq)
          ? (program.faq as unknown as ProgramFaqItem[])
          : [],
      });

      if (!checklist.canPublish) {
        const missing = checklist.items.filter((i) => !i.passed).map((i) => i.label);
        setToastMessage(`Cannot publish: Missing required fields (${missing.join(', ')})`);
        return;
      }

      await executeStatusChange(program.id, 'published');
    }
  };

  const executeStatusChange = async (programId: string, newStatus: ProgramStatus) => {
    try {
      const { error } = await supabase
        .from('programs')
        .update({ status: newStatus })
        .eq('id', programId);

      if (error) throw error;
      setToastMessage(`Program status updated to ${newStatus}`);
      fetchPrograms();
    } catch (err: unknown) {
      console.error('Failed to update status:', err);
      setToastMessage('Failed to update status. Check database constraints.');
    } finally {
      setUnpublishConfirmProgram(null);
    }
  };

  // Archive or Restore (Soft delete)
  const handleArchive = async (programId: string) => {
    try {
      const { error } = await supabase
        .from('programs')
        .update({ status: 'archived', deleted_at: new Date().toISOString() })
        .eq('id', programId);

      if (error) throw error;
      setToastMessage('Program archived.');
      fetchPrograms();
    } catch (err: unknown) {
      console.error('Failed to archive:', err);
      setToastMessage('Failed to archive program.');
    }
  };

  // Delete Program (Admin Only)
  const handleDeleteProgram = async () => {
    if (!deleteModalProgram || !isAdmin) return;
    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', deleteModalProgram.id);

      if (error) throw error;
      setToastMessage(`Permanently deleted "${deleteModalProgram.title}"`);
      setDeleteModalProgram(null);
      setDeleteConfirmationInput('');
      fetchPrograms();
    } catch (err: unknown) {
      console.error('Failed to delete program:', err);
      setToastMessage('Deletion failed. Enrollments or foreign keys may be attached.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Bulk Operations
  const handleBulkStatus = async (status: ProgramStatus) => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('programs')
        .update({ status })
        .in('id', selectedIds);

      if (error) throw error;
      setToastMessage(`Updated ${selectedIds.length} programs to ${status}`);
      setSelectedIds([]);
      fetchPrograms();
    } catch (err: unknown) {
      console.error('Bulk update error:', err);
      setToastMessage('Bulk status change failed.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkFeature = async (is_featured: boolean) => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('programs')
        .update({ is_featured })
        .in('id', selectedIds);

      if (error) throw error;
      setToastMessage(`Updated featured status for ${selectedIds.length} programs`);
      setSelectedIds([]);
      fetchPrograms();
    } catch (err: unknown) {
      console.error('Bulk feature error:', err);
      setToastMessage('Bulk feature update failed.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkCategory = async () => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('programs')
        .update({ category: targetCategory })
        .in('id', selectedIds);

      if (error) throw error;
      setToastMessage(`Updated category to ${CATEGORY_LABELS[targetCategory]} for ${selectedIds.length} programs`);
      setSelectedIds([]);
      setBulkCategoryModalOpen(false);
      fetchPrograms();
    } catch (err: unknown) {
      console.error('Bulk category error:', err);
      setToastMessage('Bulk category change failed.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // DnD Sensors and Handlers
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = programs.findIndex((p) => p.id === active.id);
    const newIndex = programs.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(programs, oldIndex, newIndex);
    setPrograms(reordered);

    // Optimistically update orders in Supabase
    try {
      const updates = reordered.map((item, index) => ({
        id: item.id,
        sort_order: index * 10,
      }));

      for (const u of updates) {
        await supabase.from('programs').update({ sort_order: u.sort_order }).eq('id', u.id);
      }
      setToastMessage('Order saved successfully');
    } catch (err: unknown) {
      console.error('Failed to save reordered programs:', err);
      setToastMessage('Failed to persist order changes.');
      fetchPrograms();
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-[#0E2024] px-4 py-3 text-xs font-semibold text-amber-300 shadow-2xl backdrop-blur-md animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Primary Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">Programs Manager</h1>
          <p className="text-xs text-[#8D9FA4]">
            Create and organize live transformative challenges and video courses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-[#1A373E] bg-[#081619] p-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Table view"
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === 'table' ? 'bg-amber-500 text-black font-bold' : 'text-[#8D9FA4] hover:text-white'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('card')}
              title="Card view"
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === 'card' ? 'bg-amber-500 text-black font-bold' : 'text-[#8D9FA4] hover:text-white'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('reorder')}
              title="Drag & drop sort view"
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === 'reorder' ? 'bg-amber-500 text-black font-bold' : 'text-[#8D9FA4] hover:text-white'
              }`}
            >
              <ArrowUpDown className="h-4 w-4" />
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/programs/new')}
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Create Program
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-[#1A373E] bg-[#081619] p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
          {/* Trigram Search Input */}
          <div className="sm:col-span-2 md:col-span-4 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8D9FA4]" />
            <input
              type="text"
              placeholder="Search by title (trigram index)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] pl-9 pr-3 py-2 text-xs text-white placeholder-[#8D9FA4]/60 focus:border-amber-500 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-[#8D9FA4] hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="sm:col-span-1 md:col-span-2">
            <select
              aria-label="Filter by program type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="challenge">Challenge</option>
              <option value="course">Video Course</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-1 md:col-span-2">
            <select
              aria-label="Filter by pillar category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="all">All Pillars</option>
              <option value="emotional">Emotional Resilience</option>
              <option value="mental">Mental Clarity</option>
              <option value="academic">Academic Mastery</option>
              <option value="personal">Personal Momentum</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-1 md:col-span-2">
            <select
              aria-label="Filter by publication status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Featured Filter */}
          <div className="sm:col-span-1 md:col-span-2">
            <select
              aria-label="Filter by featured status"
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value)}
              className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="all">All Placement</option>
              <option value="featured">Featured Only</option>
              <option value="standard">Standard</option>
            </select>
          </div>
        </div>

        {/* Sorting options */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1A373E]/60 text-xs text-[#8D9FA4]">
          <div className="flex items-center gap-2">
            <span>Sort by:</span>
            <button
              type="button"
              onClick={() => {
                if (sortBy === 'sort_order') setSortAsc(!sortAsc);
                else { setSortBy('sort_order'); setSortAsc(true); }
              }}
              className={`rounded px-2 py-0.5 transition-colors ${
                sortBy === 'sort_order' ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'hover:text-white'
              }`}
            >
              Custom Order {sortBy === 'sort_order' && (sortAsc ? '↑' : '↓')}
            </button>
            <button
              type="button"
              onClick={() => {
                if (sortBy === 'title') setSortAsc(!sortAsc);
                else { setSortBy('title'); setSortAsc(true); }
              }}
              className={`rounded px-2 py-0.5 transition-colors ${
                sortBy === 'title' ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'hover:text-white'
              }`}
            >
              Title {sortBy === 'title' && (sortAsc ? '↑' : '↓')}
            </button>
            <button
              type="button"
              onClick={() => {
                if (sortBy === 'price_paise') setSortAsc(!sortAsc);
                else { setSortBy('price_paise'); setSortAsc(false); }
              }}
              className={`rounded px-2 py-0.5 transition-colors ${
                sortBy === 'price_paise' ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'hover:text-white'
              }`}
            >
              Price {sortBy === 'price_paise' && (sortAsc ? '↑' : '↓')}
            </button>
            <button
              type="button"
              onClick={() => {
                if (sortBy === 'updated_at') setSortAsc(!sortAsc);
                else { setSortBy('updated_at'); setSortAsc(false); }
              }}
              className={`rounded px-2 py-0.5 transition-colors ${
                sortBy === 'updated_at' ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'hover:text-white'
              }`}
            >
              Recently Updated {sortBy === 'updated_at' && (sortAsc ? '↑' : '↓')}
            </button>
          </div>
          <span>Total: {totalCount} programs</span>
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-2 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500 bg-[#0E2024] p-3 shadow-2xl animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-black">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold text-white">Programs selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={bulkActionLoading}
              onClick={() => handleBulkStatus('published')}
            >
              Publish
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={bulkActionLoading}
              onClick={() => handleBulkStatus('draft')}
            >
              Unpublish (Draft)
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={bulkActionLoading}
              onClick={() => handleBulkFeature(true)}
            >
              Feature
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={bulkActionLoading}
              onClick={() => handleBulkFeature(false)}
            >
              Unfeature
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={bulkActionLoading}
              onClick={() => setBulkCategoryModalOpen(true)}
            >
              Set Pillar
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={bulkActionLoading}
              onClick={() => handleBulkStatus('archived')}
            >
              Archive
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="text-[#8D9FA4] hover:text-white"
            >
              Deselect
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-16 w-full animate-pulse rounded-xl border border-[#1A373E] bg-[#081619]"
            />
          ))}
        </div>
      ) : programs.length === 0 ? (
        // Empty State in Brand Voice
        <div className="rounded-2xl border border-dashed border-[#1A373E] bg-[#081619] p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-4">
            <SlidersHorizontal className="h-7 w-7" />
          </div>
          <h3 className="font-serif text-lg font-bold text-white">
            {search || typeFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'No matching programs found'
              : 'No programs yet'}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs text-[#8D9FA4]">
            {search || typeFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Try clearing your search query or relaxing your filters to discover other courses and cohorts.'
              : 'Create your first challenge to give students a transformative 21-day journey of emotional and mental excellence.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            {search || typeFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setTypeFilter('all');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setFeaturedFilter('all');
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/programs/new')}
                className="flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Create First Challenge
              </Button>
            )}
          </div>
        </div>
      ) : viewMode === 'reorder' ? (
        // Reordering Drag-and-Drop View
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-amber-500/10 p-3 text-xs text-amber-400">
            <span>Drag items vertically to reorder. Changes persist automatically to catalog sort order.</span>
            <Button variant="ghost" size="sm" onClick={() => setViewMode('table')}>
              Done
            </Button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={programs.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {programs.map((program, index) => (
                  <SortableProgramRow
                    key={program.id}
                    program={program}
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : viewMode === 'card' ? (
        // Responsive Cards Grid
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {programs.map((program) => {
            const seatsUsed = program.enrollments?.[0]?.count || 0;
            const maxSeats = program.max_seats;
            return (
              <div
                key={program.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#1A373E] bg-[#081619] transition-all hover:border-amber-500/50 hover:shadow-2xl"
              >
                {/* Poster / Thumbnail image */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
                  {program.thumbnail_url ? (
                    <img
                      src={program.thumbnail_url}
                      alt={program.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#040C0E] text-xs text-[#8D9FA4]">
                      No Image Uploaded
                    </div>
                  )}
                  {/* Status & Pillar overlay */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <Badge variant={program.status === 'published' ? 'amber' : 'neutral'}>
                      {program.status}
                    </Badge>
                    <Badge variant="outline">{program.type}</Badge>
                  </div>
                  {program.is_featured && (
                    <span className="absolute top-2 right-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black">
                      Featured
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[11px] font-semibold text-amber-400">
                      {CATEGORY_LABELS[program.category as PillarCategory] || program.category}
                    </span>
                    <h3 className="font-serif text-base font-bold text-white line-clamp-2 mt-0.5">
                      {program.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#8D9FA4] line-clamp-2">
                      {program.short_description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#1A373E]/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8D9FA4]">Price:</span>
                      <span className="font-serif font-bold text-white">
                        {program.price_paise === 0
                          ? 'FREE'
                          : formatPaise(program.price_paise)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8D9FA4]">Seats:</span>
                      <span className="text-white">
                        {seatsUsed} / {maxSeats ? maxSeats : 'Unlimited'}
                      </span>
                    </div>

                    {program.starts_at && (
                      <div className="flex items-center justify-between text-[11px] text-[#8D9FA4]">
                        <span>Starts (IST):</span>
                        <span>{formatDateIST(program.starts_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="border-t border-[#1A373E] bg-[#040C0E]/60 p-3 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/programs/${program.id}`)}
                    className="text-xs text-amber-400 hover:text-amber-300"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Duplicate"
                      onClick={() => handleDuplicate(program)}
                      className="rounded-lg p-1.5 text-[#8D9FA4] hover:bg-[#1A373E] hover:text-white"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title={program.status === 'published' ? 'Unpublish' : 'Publish'}
                      onClick={() => handleTogglePublish(program)}
                      className="rounded-lg p-1.5 text-[#8D9FA4] hover:bg-[#1A373E] hover:text-white"
                    >
                      {program.status === 'published' ? <Eye className="h-3.5 w-3.5 text-amber-400" /> : <Check className="h-3.5 w-3.5" />}
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        title="Delete Program"
                        onClick={() => setDeleteModalProgram(program)}
                        className="rounded-lg p-1.5 text-[#8D9FA4] hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Table View
        <div className="overflow-x-auto rounded-2xl border border-[#1A373E] bg-[#081619]">
          <table className="w-full text-left text-xs text-white">
            <thead className="border-b border-[#1A373E] bg-[#040C0E] text-[11px] font-semibold text-[#8D9FA4]">
              <tr>
                <th className="p-3 w-8">
                  <input
                    type="checkbox"
                    aria-label="Select all programs on current page"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-[#1A373E] bg-[#081619] text-amber-500 focus:ring-0"
                  />
                </th>
                <th className="p-3">Program</th>
                <th className="p-3">Type</th>
                <th className="p-3">Pillar</th>
                <th className="p-3">Status</th>
                <th className="p-3">Price</th>
                <th className="p-3">Seats</th>
                <th className="p-3">Dates (IST)</th>
                <th className="p-3">Updated</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A373E]/60">
              {programs.map((program) => {
                const isSelected = selectedIds.includes(program.id);
                const seatsUsed = program.enrollments?.[0]?.count || 0;

                return (
                  <tr
                    key={program.id}
                    className={`transition-colors hover:bg-[#0E2024] ${
                      isSelected ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        aria-label={`Select program ${program.title}`}
                        checked={isSelected}
                        onChange={() => toggleSelectRow(program.id)}
                        className="rounded border-[#1A373E] bg-[#081619] text-amber-500 focus:ring-0"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {program.thumbnail_url ? (
                          <img
                            src={program.thumbnail_url}
                            alt={program.title}
                            className="h-9 w-14 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-14 items-center justify-center rounded-md bg-[#040C0E] text-[9px] text-[#8D9FA4]">
                            No img
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              onClick={() => navigate(`/programs/${program.id}`)}
                              className="font-serif font-semibold text-white hover:text-amber-400 cursor-pointer"
                            >
                              {program.title}
                            </span>
                            {program.is_featured && (
                              <Badge variant="amber" className="text-[9px] px-1.5 py-0">
                                Featured
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-[#8D9FA4] font-mono">
                            /{program.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="capitalize">{program.type}</span>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">
                        {CATEGORY_LABELS[program.category as PillarCategory] || program.category}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          program.status === 'published'
                            ? 'amber'
                            : program.status === 'live'
                            ? 'teal'
                            : 'neutral'
                        }
                      >
                        {program.status}
                      </Badge>
                    </td>
                    <td className="p-3 font-medium">
                      {program.price_paise === 0 ? (
                        <span className="text-emerald-400 font-semibold">FREE</span>
                      ) : (
                        <div>
                          <span>{formatPaise(program.price_paise)}</span>
                          {program.compare_at_price_paise &&
                            program.compare_at_price_paise > program.price_paise && (
                              <span className="ml-1 text-[10px] text-[#8D9FA4] line-through">
                                {formatPaise(program.compare_at_price_paise)}
                              </span>
                            )}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-[#8D9FA4]">
                      <span className="text-white font-medium">{seatsUsed}</span> /{' '}
                      {program.max_seats || '∞'}
                    </td>
                    <td className="p-3 text-[11px] text-[#8D9FA4]">
                      {program.starts_at ? (
                        <div>
                          <div>{formatDateIST(program.starts_at)}</div>
                          {program.ends_at && (
                            <div className="text-[10px] opacity-75">
                              to {formatDateIST(program.ends_at)}
                            </div>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3 text-[11px] text-[#8D9FA4]">
                      {formatDateIST(program.updated_at || program.created_at)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => navigate(`/programs/${program.id}`)}
                          className="rounded p-1 text-[#8D9FA4] hover:bg-[#1A373E] hover:text-white"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Duplicate"
                          onClick={() => handleDuplicate(program)}
                          className="rounded p-1 text-[#8D9FA4] hover:bg-[#1A373E] hover:text-white"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title={program.status === 'published' ? 'Unpublish to draft' : 'Publish'}
                          onClick={() => handleTogglePublish(program)}
                          className="rounded p-1 text-[#8D9FA4] hover:bg-[#1A373E] hover:text-white"
                        >
                          {program.status === 'published' ? (
                            <Eye className="h-3.5 w-3.5 text-amber-400" />
                          ) : (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          )}
                        </button>
                        <button
                          type="button"
                          title="Archive"
                          onClick={() => handleArchive(program.id)}
                          className="rounded p-1 text-[#8D9FA4] hover:bg-[#1A373E] hover:text-white"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                        {isAdmin ? (
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => setDeleteModalProgram(program)}
                            className="rounded p-1 text-[#8D9FA4] hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <span
                            title="Admin permission required to delete"
                            className="rounded p-1 text-[#8D9FA4]/40 cursor-not-allowed"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && viewMode !== 'reorder' && (
        <div className="flex items-center justify-between rounded-xl border border-[#1A373E] bg-[#081619] p-3 text-xs text-[#8D9FA4]">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modal: Unpublish Confirmation when Enrollments Exist */}
      <Dialog
        open={!!unpublishConfirmProgram}
        onOpenChange={(open) => !open && setUnpublishConfirmProgram(null)}
      >
        <DialogContent size="md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="font-serif text-lg">Active Enrollments Detected</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-[#8D9FA4]">
              Notice regarding existing enrolled students
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="text-xs text-[#8D9FA4] space-y-2">
            <p>
              "{unpublishConfirmProgram?.title}" currently has{' '}
              <strong className="text-white">
                {unpublishConfirmProgram?.enrollments?.[0]?.count || 0} active student enrollments
              </strong>
              .
            </p>
            <p>
              Unpublishing will hide this program from the student store and catalog, but existing
              enrolled students will retain access in their student dashboard.
            </p>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setUnpublishConfirmProgram(null)}>
              Cancel
            </Button>
            <Button
              variant="cta"
              size="sm"
              onClick={() => {
                if (unpublishConfirmProgram) {
                  executeStatusChange(unpublishConfirmProgram.id, 'draft');
                }
              }}
            >
              Confirm Unpublish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Delete Program (Admin Only - Requires Typed Title Confirmation) */}
      <Dialog
        open={!!deleteModalProgram}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteModalProgram(null);
            setDeleteConfirmationInput('');
          }
        }}
      >
        <DialogContent size="md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="font-serif text-lg">Delete Program Permanently</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-[#8D9FA4]">
              This action cannot be undone. Permanent audit entry will be logged.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4 text-xs">
            <p className="text-[#8D9FA4]">
              This action <strong className="text-red-400">CANNOT</strong> be undone. It will
              permanently delete the program and record a permanent deletion entry in the audit log.
            </p>
            <p className="text-[#8D9FA4]">
              To confirm, please type the exact title:{' '}
              <span className="font-semibold text-white">"{deleteModalProgram?.title}"</span>
            </p>

            <input
              type="text"
              placeholder="Type program title exactly..."
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
              className="w-full rounded-xl border border-red-500/40 bg-[#040C0E] px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
            />
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteModalProgram(null);
                setDeleteConfirmationInput('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={
                deleteConfirmationInput.trim() !== deleteModalProgram?.title || deleteLoading
              }
              onClick={handleDeleteProgram}
              className="bg-red-500 hover:bg-red-600 text-white font-bold disabled:opacity-40"
            >
              {deleteLoading ? 'Deleting...' : 'Delete Forever'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Bulk Set Pillar */}
      <Dialog
        open={bulkCategoryModalOpen}
        onOpenChange={(open) => !open && setBulkCategoryModalOpen(false)}
      >
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Set Pillar Category</DialogTitle>
            <DialogDescription className="text-xs text-[#8D9FA4]">
              Select the new pillar category for the {selectedIds.length} selected programs.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-3">
            <select
              aria-label="Pillar Category"
              value={targetCategory}
              onChange={(e) => setTargetCategory(e.target.value as PillarCategory)}
              className="w-full rounded-xl border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="emotional">Emotional Resilience</option>
              <option value="mental">Mental Clarity</option>
              <option value="academic">Academic Mastery</option>
              <option value="personal">Personal Momentum</option>
            </select>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBulkCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="cta"
              size="sm"
              disabled={bulkActionLoading}
              onClick={handleBulkCategory}
            >
              Apply to {selectedIds.length} Programs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
