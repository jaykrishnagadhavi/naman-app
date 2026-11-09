import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  useAuth,
  ContentRail,
  PosterCard,
  CategoryChips,
  SearchBar,
  Button,
  ErrorDetailsAlert,
} from '@abrainoconscious/ui';
import {
  fetchCatalog,
  getRootDomain,
  GrowthPillar,
  PILLARS,
  type CatalogItem,
  type CatalogFilterParams,
} from '@abrainoconscious/shared';
import {
  Sparkles,
  RefreshCw,
  LayoutGrid,
  Rows,
  X,
} from 'lucide-react';

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { supabase } = useAuth();
  const rootDomain = getRootDomain();

  // URL state synchronization
  const initialCategory = searchParams.get('category') || 'all';
  const initialSearch = searchParams.get('search') || '';
  const initialType = (searchParams.get('type') as 'all' | 'challenge' | 'course') || 'all';
  const initialPrice = (searchParams.get('price') as 'all' | 'free' | 'paid' | 'under_1000') || 'all';
  const initialSort = (searchParams.get('sort') as any) || 'sort_order';
  const initialView = searchParams.get('view') === 'grid' ? 'grid' : 'rails';

  const [selectedPillar, setSelectedPillar] = useState<string>(initialCategory);
  const [searchInput, setSearchInput] = useState<string>(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(initialSearch);
  const [selectedType, setSelectedType] = useState<'all' | 'challenge' | 'course'>(initialType);
  const [selectedPrice, setSelectedPrice] = useState<'all' | 'free' | 'paid' | 'under_1000'>(initialPrice);
  const [selectedSort, setSelectedSort] = useState<string>(initialSort);
  const [viewMode, setViewMode] = useState<'rails' | 'grid'>(initialView);
  const [pageLimit, setPageLimit] = useState<number>(30);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Sync state back to URL query parameters
  useEffect(() => {
    const params: Record<string, string> = {};
    if (selectedPillar !== 'all') params.category = selectedPillar;
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (selectedType !== 'all') params.type = selectedType;
    if (selectedPrice !== 'all') params.price = selectedPrice;
    if (selectedSort !== 'sort_order') params.sort = selectedSort;
    if (viewMode !== 'rails') params.view = viewMode;

    setSearchParams(params, { replace: true });
  }, [selectedPillar, debouncedSearch, selectedType, selectedPrice, selectedSort, viewMode, setSearchParams]);

  // Query catalog using fetchCatalog
  const queryParams: CatalogFilterParams = {
    search: debouncedSearch,
    type: selectedType,
    category: selectedPillar as any,
    priceFilter: selectedPrice,
    sort: selectedSort as any,
    limit: pageLimit,
  };

  const {
    data: catalogResult,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['explore-catalog', queryParams],
    queryFn: () => fetchCatalog(supabase, queryParams),
    staleTime: 1000 * 60 * 5,
  });

  const programs: CatalogItem[] = catalogResult?.items || [];
  const totalCount = catalogResult?.total_count || 0;
  const hasMore = programs.length < totalCount;

  // Distinct list of pillar categories for grouping in rails view
  const growthPillars: GrowthPillar[] = ['emotional', 'mental', 'academic', 'personal'];

  const groupedByPillar = useMemo(() => {
    const map: Record<GrowthPillar, CatalogItem[]> = {
      emotional: [],
      mental: [],
      academic: [],
      personal: [],
    };

    for (const prog of programs) {
      if (map[prog.category as GrowthPillar]) {
        map[prog.category as GrowthPillar].push(prog);
      }
    }

    return map;
  }, [programs]);

  const resetFilters = () => {
    setSelectedPillar('all');
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedType('all');
    setSelectedPrice('all');
    setSelectedSort('sort_order');
  };

  const hasActiveFilters =
    selectedPillar !== 'all' ||
    debouncedSearch.trim() !== '' ||
    selectedType !== 'all' ||
    selectedPrice !== 'all' ||
    selectedSort !== 'sort_order';

  return (
    <div className="space-y-8 pb-16">
      <Helmet>
        <title>Course & Challenge Library | ABrainoConscious</title>
        <meta
          name="description"
          content="Explore all live cohorts and masterclasses across Emotional Resilience, Mental Clarity, Academic Focus, and Personal Momentum."
        />
        <meta property="og:title" content="Course & Challenge Library | ABrainoConscious" />
        <meta property="og:url" content={`https://app.${rootDomain}/explore`} />
      </Helmet>

      {/* Page Title & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#F8FAFA]">Explore Library</h1>
          <p className="text-xs text-[#8D9FA4] mt-1">
            Browse live cohorts and video masterclasses across the four growth pillars.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex rounded-lg border border-[#1A373E] bg-[#0E2024] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('rails')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === 'rails' ? 'bg-amber-500 text-black font-bold' : 'text-[#8D9FA4] hover:text-white'
              }`}
            >
              <Rows className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Rails</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-amber-500 text-black font-bold' : 'text-[#8D9FA4] hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Pillar Chips & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <CategoryChips
          selectedCategory={selectedPillar}
          onSelectCategory={setSelectedPillar}
        />
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search challenges, courses, frameworks..."
        />
      </div>

      {/* Secondary Filter Dropdowns & Sorters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1A373E] bg-[#0E2024]/60 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="rounded-lg border border-[#1A373E] bg-[#081619] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Formats</option>
            <option value="challenge">Live Cohort Challenges</option>
            <option value="course">Structured Courses</option>
          </select>

          {/* Price Filter */}
          <select
            value={selectedPrice}
            onChange={(e) => setSelectedPrice(e.target.value as any)}
            className="rounded-lg border border-[#1A373E] bg-[#081619] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Prices</option>
            <option value="free">Free Access</option>
            <option value="under_1000">Under ₹1,000</option>
            <option value="paid">Paid Programs</option>
          </select>

          {/* Sort Filter */}
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="rounded-lg border border-[#1A373E] bg-[#081619] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="sort_order">Featured Order</option>
            <option value="popular">Most Popular</option>
            <option value="newest">Recently Added</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-amber-400 hover:bg-amber-500/10 transition-colors"
            >
              <X className="h-3 w-3" /> Reset
            </button>
          )}
        </div>

        <div className="text-[11px] text-[#8D9FA4]">
          {isLoading ? 'Loading programs...' : `${programs.length} of ${totalCount} programs`}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-10" data-testid="explore-loading-skeleton">
          {[1, 2].map((railIdx) => (
            <div key={railIdx} className="space-y-4">
              <div className="space-y-1">
                <div className="h-6 w-48 rounded-lg bg-[#0E2024] animate-pulse" />
                <div className="h-3 w-64 rounded-md bg-[#081619] animate-pulse" />
              </div>
              <div className="flex gap-4 overflow-hidden pt-1">
                {[1, 2, 3, 4].map((cardIdx) => (
                  <div
                    key={cardIdx}
                    className="w-48 sm:w-56 shrink-0 overflow-hidden rounded-xl border border-[#1A373E] bg-[#0E2024]"
                  >
                    <div className="aspect-[2/3] w-full bg-[#152B30] animate-pulse" />
                    <div className="p-3.5 space-y-2">
                      <div className="h-3 w-20 rounded bg-[#1A373E] animate-pulse" />
                      <div className="h-4 w-full rounded bg-[#1A373E] animate-pulse" />
                      <div className="h-4 w-3/4 rounded bg-[#1A373E] animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        /* Error Alert with Dev Toggle */
        <div data-testid="explore-error-state" className="space-y-4">
          <ErrorDetailsAlert
            title="Unable to load catalog"
            error={error}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Try Again</span>
          </Button>
        </div>
      ) : programs.length === 0 ? (
        /* Empty State */
        <div
          data-testid="explore-empty-state"
          className="rounded-2xl border border-[#1A373E] bg-[#0E2024] p-12 text-center space-y-4"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-white">No programs match your filters</h3>
            <p className="mx-auto max-w-md text-xs text-[#8D9FA4] leading-relaxed">
              New cohorts and self-paced courses are continuously scheduled. Try selecting a different growth pillar
              or clear your search filters.
            </p>
          </div>
          {hasActiveFilters && (
            <Button size="sm" variant="primary" onClick={resetFilters}>
              Reset All Filters
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' || selectedPillar !== 'all' ? (
        /* Multi-column Grid View */
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {programs.map((prog) => (
              <PosterCard
                key={prog.id}
                id={prog.id}
                title={prog.title}
                category={prog.category}
                aspectRatio="2:3"
                coverImage={prog.poster_image_url || undefined}
                coverSrcset={prog.poster_srcset || undefined}
                lessonCount={prog.total_lessons || prog.total_sessions}
                pricePaise={prog.price_paise}
                compareAtPricePaise={prog.compare_at_price_paise || undefined}
                progressPercent={prog.is_enrolled ? 10 : undefined}
                onSelect={() => navigate(`/programs/${prog.slug}`)}
                onPreview={() => navigate(`/programs/${prog.slug}`)}
                className="w-full"
              />
            ))}
          </div>

          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                size="md"
                onClick={() => setPageLimit((prev) => prev + 20)}
                disabled={isFetching}
              >
                {isFetching ? 'Loading more...' : 'Load More Programs'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Rails View (Grouped by Pillar) */
        <div className="space-y-10">
          {growthPillars.map((pillarKey) => {
            const pillarPrograms = groupedByPillar[pillarKey];
            if (pillarPrograms.length === 0) return null;
            const info = PILLARS[pillarKey];

            return (
              <ContentRail
                key={pillarKey}
                title={info.title}
                subtitle={info.tagline}
              >
                {pillarPrograms.map((prog) => (
                  <PosterCard
                    key={prog.id}
                    id={prog.id}
                    title={prog.title}
                    category={prog.category}
                    aspectRatio="2:3"
                    coverImage={prog.poster_image_url || undefined}
                    coverSrcset={prog.poster_srcset || undefined}
                    lessonCount={prog.total_lessons || prog.total_sessions}
                    pricePaise={prog.price_paise}
                    compareAtPricePaise={prog.compare_at_price_paise || undefined}
                    progressPercent={prog.is_enrolled ? 10 : undefined}
                    onSelect={() => navigate(`/programs/${prog.slug}`)}
                    onPreview={() => navigate(`/programs/${prog.slug}`)}
                  />
                ))}
              </ContentRail>
            );
          })}

          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                size="md"
                onClick={() => setPageLimit((prev) => prev + 20)}
                disabled={isFetching}
              >
                {isFetching ? 'Loading more...' : 'Load More Programs'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
