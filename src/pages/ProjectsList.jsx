import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { filterProjects } from '../lib/utils.js';
import { useProjects } from '../hooks/useProjects.js';
import { useTitle } from '../hooks/useTitle.js';
import { ErrorState, ProjectCard, SkeletonCards, State } from '../components/ui.jsx';
import '../styles/pages/list-projects.css';

/* Search (title/tags) + category chips work together. State lives in the URL
   (?q=...&cat=...) so a filtered view can be shared or bookmarked. */
export default function ProjectsList() {
  useTitle('Projects List');
  const [params, setParams] = useSearchParams();
  const { projects, categories, error, loading, retry } = useProjects();
  const inputRef = useRef(null);

  const [query, setQuery] = useState(params.get('q') || '');
  const [debounced, setDebounced] = useState(query);
  const requested = params.get('cat') || 'all';
  const activeCat = requested === 'all' || categories.some((c) => c.slug === requested) ? requested : 'all';
  const activeName = categories.find((c) => c.slug === activeCat)?.name;

  /* Debounce typing so filtering feels smooth. */
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  /* Keep ?q= in sync with the search box. */
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (debounced.trim()) next.set('q', debounced.trim()); else next.delete('q');
    if (next.toString() !== params.toString()) setParams(next, { replace: true, preventScrollReset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const setCategory = (slug) => {
    const next = new URLSearchParams(params);
    if (slug === 'all') next.delete('cat'); else next.set('cat', slug);
    setParams(next, { replace: true, preventScrollReset: true });
  };

  const reset = () => {
    setQuery('');
    setDebounced('');
    setParams(new URLSearchParams(), { replace: true, preventScrollReset: true });
    inputRef.current?.focus();
  };

  const list = useMemo(() => filterProjects(projects, debounced, activeCat), [projects, debounced, activeCat]);
  const q = debounced.trim();

  return (
    <section className="section list-page">
      <div className="container">
        <div className="list-head">
          <div>
            <p className="eyebrow load-in" style={{ '--i': 0 }}>Every project</p>
            <h1 className="display list-head__title load-in" style={{ '--i': 1 }}>Projects <em className="accent">List</em></h1>
          </div>
          <Link className="back-link load-in" style={{ '--i': 2 }} to="/projects">← Back to categories</Link>
        </div>

        <form className="list-controls load-in" style={{ '--i': 2 }} role="search" onSubmit={(e) => e.preventDefault()}>
          <div className="search">
            <label className="sr-only" htmlFor="search">Search projects by title or tag</label>
            <svg className="search__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              className="field__input search__input"
              type="search"
              id="search"
              placeholder="Search by title or tag (e.g. dashboard, Figma, apps)"
              autoComplete="off"
              maxLength={80}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && query) { e.preventDefault(); setQuery(''); }
              }}
            />
            {query && (
              <button className="search__clear" type="button" aria-label="Clear search" onClick={() => { setQuery(''); inputRef.current?.focus(); }}>
                ✕
              </button>
            )}
          </div>
          <div className="chip-group" role="group" aria-label="Filter by category">
            {[{ slug: 'all', name: 'All' }, ...categories].map((c) => (
              <button key={c.slug} className="chip" type="button" aria-pressed={c.slug === activeCat} onClick={() => setCategory(c.slug)}>
                {c.name}
              </button>
            ))}
          </div>
        </form>

        <p className="list-count" aria-live="polite">
          {loading ? 'Loading projects…' : error ? '' : (
            <>
              Showing <strong>{list.length}</strong> of {projects.length} project{projects.length === 1 ? '' : 's'}
              {q && <> matching “<strong>{q}</strong>”</>}
              {activeName && <> in <strong>{activeName}</strong></>}
            </>
          )}
        </p>

        <div className="card-grid" aria-busy={loading}>
          {loading && <SkeletonCards count={3} />}
          {error && <ErrorState onRetry={retry} />}
          {!loading && !error && !list.length && (
            <State
              icon="∅"
              title="No projects match"
              text={q
                ? `Nothing matches “${q}”${activeName ? ` in ${activeName}` : ''}. Try a different word or another category.`
                : 'There are no projects in this category yet.'}
            >
              <button className="btn btn--ghost btn--sm" type="button" onClick={reset}>Clear search &amp; filters</button>
            </State>
          )}
          {list.map((p, i) => <ProjectCard key={p.slug} project={p} index={i} />)}
        </div>
      </div>
    </section>
  );
}
