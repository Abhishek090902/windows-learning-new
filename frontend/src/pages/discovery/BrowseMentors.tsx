import { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Code, BarChart3, Palette, TrendingUp, Briefcase, PenTool, ArrowLeft, Sparkles } from 'lucide-react';
import MentorCard from '@/components/MentorCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useMentors, useCategories } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { appRoutes, getDashboardRoute } from '@/lib/appRoutes';
import api from '@/lib/api';

const iconMap: Record<string, React.ElementType> = {
  Code, BarChart3, Palette, TrendingUp, Briefcase, PenTool,
};

const quickSearches = ['React', 'Machine Learning', 'SEO', 'AWS', 'Interview Preparation'];

type AiFilterState = {
  interpretation?: string;
  match_size?: number;
  action?: 'questions_first' | 'skills_with_questions' | 'skills';
  questions?: string[];
  suggested_queries?: string[];
  skills?: { name: string; category: string }[];
  problem_summary?: string;
  next_step?: string;
};

const BrowseMentors = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [submittedQuery, setSubmittedQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'mid' | 'high'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [aiMentors, setAiMentors] = useState<any[] | null>(null);
  const [aiFilters, setAiFilters] = useState<AiFilterState | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const deferredQuery = useDeferredValue(query.trim());

  const getDashboardLink = () => {
    if (!user) return appRoutes.home;
    return getDashboardRoute(user.role);
  };

  const { data: categories = [] } = useCategories();

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (deferredQuery) next.set('q', deferredQuery);
    else next.delete('q');
    if (selectedCategory) next.set('category', selectedCategory);
    else next.delete('category');
    setSearchParams(next, { replace: true });
  }, [deferredQuery, selectedCategory, searchParams, setSearchParams]);

  useEffect(() => {
    if (!submittedQuery.trim()) {
      setAiMentors(null);
      setAiFilters(null);
      return;
    }

    let cancelled = false;

    const runAiSearch = async () => {
      setIsAiLoading(true);
      try {
        const response = await api.post('/ai/search-intent', { query: submittedQuery.trim() });
        if (cancelled) return;
        setAiMentors(response.data.mentors?.length ? response.data.mentors : null);
        setAiFilters(response.data.aiOutput || null);
      } catch (_error) {
        if (cancelled) return;
        setAiMentors(null);
        setAiFilters(null);
      } finally {
        if (!cancelled) {
          setIsAiLoading(false);
        }
      }
    };

    runAiSearch();

    return () => {
      cancelled = true;
    };
  }, [submittedQuery]);

  const filters = useMemo(() => {
    const f: any = { limit: 18 };
    if (deferredQuery) f.search = deferredQuery;
    if (selectedCategory) f.category = selectedCategory;
    if (priceRange === 'low') { f.minPrice = 500; f.maxPrice = 1200; }
    else if (priceRange === 'mid') { f.minPrice = 1200; f.maxPrice = 2000; }
    else if (priceRange === 'high') { f.minPrice = 2000; }
    return f;
  }, [deferredQuery, selectedCategory, priceRange]);

  const { data: mentors = [], isLoading } = useMentors(filters);
  const displayMentors = aiMentors?.length ? aiMentors : mentors;
  const showAiSummary = Boolean(
    aiFilters?.interpretation ||
    aiFilters?.problem_summary ||
    aiFilters?.skills?.length ||
    aiFilters?.questions?.length,
  );

  const clearAllFilters = () => {
    setQuery('');
    setSubmittedQuery('');
    setSelectedCategory('');
    setPriceRange('all');
    setAiMentors(null);
    setAiFilters(null);
  };

  const hasActiveFilters = query || selectedCategory || priceRange !== 'all';

  const handleSearchSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const nextQuery = query.trim();
    setSubmittedQuery(nextQuery);
    if (!nextQuery) {
      setAiMentors(null);
      setAiFilters(null);
    }
  };

  const handleQuickSearch = (term: string) => {
    setQuery(term);
    setSubmittedQuery(term);
  };

  const activeFilterLabels = [
    query ? 'search' : '',
    selectedCategory ? 'category' : '',
    priceRange !== 'all' ? 'price range' : '',
    submittedQuery && aiMentors?.length ? 'AI ranked' : '',
  ].filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container-main py-8">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              {user && (
                <Link
                  to={getDashboardLink()}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Find your mentor</h1>
            <p className="text-muted-foreground">Search by skill, category, or learning goal and connect with verified mentors faster.</p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Try "React", "Data Science", or "Interview Preparation"'
                className="w-full h-11 pl-10 pr-4 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <button
              type="submit"
              className="hidden md:inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              AI Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 h-11 px-4 rounded-lg border text-sm font-medium"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
          </form>

          <div className="mb-8 flex flex-wrap gap-2">
            {quickSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleQuickSearch(term)}
                className="rounded-full border px-3 py-1.5 text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors"
              >
                {term}
              </button>
            ))}
          </div>

          {showAiSummary ? (
            <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">AI skill discovery</p>
              </div>
              {aiFilters?.interpretation ? (
                <p className="text-sm font-medium text-foreground mb-2">{aiFilters.interpretation}</p>
              ) : null}
              {typeof aiFilters?.match_size === 'number' ? (
                <p className="text-sm text-muted-foreground mb-3">~{aiFilters.match_size} possible skills found</p>
              ) : null}
              {aiFilters?.problem_summary ? (
                <p className="text-sm text-foreground mb-3">{aiFilters.problem_summary}</p>
              ) : null}
              {aiFilters?.skills?.length ? (
                <div className="flex flex-wrap gap-2">
                  {aiFilters.skills.map((skill) => (
                    <span key={skill.name} className="inline-flex items-center rounded-full bg-background px-3 py-1 text-xs font-medium border">
                      {skill.name}
                    </span>
                  ))}
                </div>
              ) : null}
              {aiFilters?.questions?.length ? (
                <div className="mt-4 space-y-2">
                  {aiFilters.questions.map((question) => (
                    <p key={question} className="text-sm text-foreground">{question}</p>
                  ))}
                </div>
              ) : null}
              {aiFilters?.suggested_queries?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {aiFilters.suggested_queries.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleQuickSearch(suggestion)}
                      className="rounded-full border bg-background px-3 py-1.5 text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : null}
              {aiFilters?.next_step ? (
                <p className="mt-4 text-sm text-muted-foreground">{aiFilters.next_step}</p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 shrink-0 space-y-6`}>
              {hasActiveFilters && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold">Active Filters</h4>
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-2">
                    {query && <div className="text-xs"><span className="px-2 py-1 bg-background rounded">Search: {query}</span></div>}
                    {selectedCategory && <div className="text-xs"><span className="px-2 py-1 bg-background rounded">Category: {selectedCategory}</span></div>}
                    {priceRange !== 'all' && <div className="text-xs"><span className="px-2 py-1 bg-background rounded">Price: {priceRange}</span></div>}
                  </div>
                </div>
              )}

              <div className="border rounded-lg bg-card p-4">
                <h4 className="text-sm font-semibold mb-3">Categories</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`block text-sm w-full text-left px-3 py-1.5 rounded-md transition-colors ${!selectedCategory ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat: any) => {
                    const Icon = iconMap[cat.icon] || Code;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center gap-2 text-sm w-full text-left px-3 py-1.5 rounded-md transition-colors ${selectedCategory === cat.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                      >
                        <Icon className="h-4 w-4" /> {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border rounded-lg bg-card p-4">
                <h4 className="text-sm font-semibold mb-3">Price Range</h4>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Prices' },
                    { value: 'low', label: 'Rs.500 - Rs.1,200/hr' },
                    { value: 'mid', label: 'Rs.1,200 - Rs.2,000/hr' },
                    { value: 'high', label: 'Rs.2,000+/hr' },
                  ].map((range) => (
                    <button
                      key={range.value}
                      onClick={() => setPriceRange(range.value as any)}
                      className={`block text-sm w-full text-left px-3 py-1.5 rounded-md transition-colors ${priceRange === range.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {hasActiveFilters ? <>Showing <span className="font-medium text-foreground">{displayMentors.length}</span> mentors</> : <><span className="font-medium text-foreground">{displayMentors.length}</span> mentor{displayMentors.length !== 1 ? 's' : ''} found</>}
                      </p>
                      {hasActiveFilters && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Filtered by: {activeFilterLabels.join(' • ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {submittedQuery ? (
                        <span className="text-xs text-muted-foreground">{isAiLoading ? 'AI refining...' : aiMentors?.length ? 'AI results ready' : 'Instant results'}</span>
                      ) : null}
                      {hasActiveFilters && (
                        <button onClick={clearAllFilters} className="text-sm text-primary hover:text-primary/80 transition-colors">
                          Clear filters
                        </button>
                      )}
                    </div>
                  </div>

                  {displayMentors.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {displayMentors.map((mentor: any, i: number) => (
                        <MentorCard key={mentor.id} mentor={mentor} index={i} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-6">
                        <Search className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No mentors found</h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                        {hasActiveFilters ? 'Try a broader keyword, switch category, or remove one filter.' : 'No mentors are available at the moment. Check back later!'}
                      </p>
                      {hasActiveFilters && (
                        <button onClick={clearAllFilters} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BrowseMentors;
