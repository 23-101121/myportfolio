import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { gsap, useGSAP, ScrollTrigger } from '../lib/gsap.js';
import { getLenis } from '../lib/smoothScroll.js';
import { filterProjects, pad, projectPath } from '../lib/utils.js';
import { useProjects } from '../hooks/useProjects.js';
import { useTitle } from '../hooks/useTitle.js';
import { Arrow, ErrorState, Media } from '../components/ui.jsx';
import '../styles/pages/list-projects.css';

/* Filter pills. A project matches when its tags, category or type contain one of `words`. */
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'ui', label: 'UI', words: ['ui'] },
  { key: 'ux', label: 'UX', words: ['ux'] },
  { key: 'branding', label: 'Branding', words: ['branding', 'brand', 'identity'] },
  { key: 'experiments', label: 'Experiments', words: ['experiment', 'experiments', 'lab', 'playground'] },
];
const wordsOf = (p) => [p.category, p.type, ...(p.tags || [])].join(' ').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

/* Pinned scroll carousel on desktop with motion; swipe carousel otherwise. */
const PIN_MQ = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)';
function useMedia(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
}

function scrollToY(y, duration = 1) {
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(y, { duration });
  else window.scrollTo({ top: y, behavior: 'smooth' });
}

export default function ProjectsList() {
  useTitle('Projects List');
  const { projects, error, loading, retry } = useProjects();
  const [params, setParams] = useSearchParams();
  const pinned = useMedia(PIN_MQ);
  const sectionRef = useRef(null);
  const inputRef = useRef(null);

  const requested = params.get('category') || 'all';
  const activeFilter = FILTERS.some((f) => f.key === requested) ? requested : 'all';
  const [query, setQuery] = useState(params.get('q') || '');
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 180);
    return () => clearTimeout(t);
  }, [query]);

  /* Keep ?category=…&q=… in the URL so the view can be shared / survives refresh. */
  const updateUrl = (category, q) => {
    const next = new URLSearchParams(params);
    if (category && category !== 'all') next.set('category', category); else next.delete('category');
    if (q.trim()) next.set('q', q.trim()); else next.delete('q');
    if (next.toString() !== params.toString()) setParams(next, { replace: true, preventScrollReset: true });
  };
  useEffect(() => { updateUrl(activeFilter, debounced); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [debounced]);

  const list = useMemo(() => {
    const f = FILTERS.find((x) => x.key === activeFilter);
    const byFilter = f?.words ? projects.filter((p) => f.words.some((w) => wordsOf(p).includes(w))) : projects;
    return filterProjects(byFilter, debounced, 'all');
  }, [projects, activeFilter, debounced]);
  const listKey = `${pinned ? 'pin' : 'swipe'}:${list.map((p) => p.slug).join('|')}`;

  /* After a filter/search change, bring the carousel back into view. */
  const backToTop = () => {
    const el = sectionRef.current;
    if (el && el.getBoundingClientRect().top < -5) scrollToY(el.getBoundingClientRect().top + window.scrollY, 0.6);
  };
  const setFilter = (key) => { updateUrl(key, debounced); backToTop(); };
  const clearAll = () => { setQuery(''); setDebounced(''); updateUrl('all', ''); inputRef.current?.focus(); };

  return (
    <div>
      <section className={`plx ${pinned ? 'plx--pinned' : 'plx--swipe'}`} ref={sectionRef} aria-labelledby="pl-title">
        <div className="container plx__head">
          <h1 className="display plx__title" id="pl-title">Projects <em className="accent">List</em></h1>
          <div className="plx__tools">
            <div className="pl-pills" role="group" aria-label="Filter projects">
              {FILTERS.map((f) => (
                <button key={f.key} type="button" className="pl-pill" aria-pressed={f.key === activeFilter} onClick={() => setFilter(f.key)}>
                  {f.label}
                </button>
              ))}
            </div>
            <form className="pl-search" role="search" onSubmit={(e) => e.preventDefault()}>
              <label className="sr-only" htmlFor="pl-search-input">Search projects by title or tag</label>
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                id="pl-search-input"
                type="search"
                placeholder="Search projects"
                autoComplete="off"
                maxLength={80}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape' && query) { e.preventDefault(); setQuery(''); } }}
              />
              {query && <button type="button" className="pl-search__clear" aria-label="Clear search" onClick={() => { setQuery(''); inputRef.current?.focus(); }}>✕</button>}
            </form>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {!loading && !error ? `${list.length} project${list.length === 1 ? '' : 's'} found` : ''}
        </p>

        {loading && <div className="plx__stage"><div className="skeleton pl-skeleton" aria-hidden="true" /></div>}
        {error && <div className="container plx__stage"><ErrorState onRetry={retry} /></div>}
        {!loading && !error && list.length === 0 && (
          <div className="container plx__stage">
            <div className="pl-empty" role="status">
              <span className="pl-empty__icon" aria-hidden="true">∅</span>
              <h2 className="display pl-empty__title">No projects <em className="accent">found</em></h2>
              <p>Nothing matches {debounced.trim() ? <>“{debounced.trim()}”</> : 'this filter'}. Try another word or filter.</p>
              <button type="button" className="btn btn--pink" onClick={clearAll}>Clear filters <Arrow /></button>
            </div>
          </div>
        )}
        {!loading && !error && list.length > 0 && (
          pinned
            ? <PinnedCarousel key={listKey} items={list} sectionRef={sectionRef} />
            : <SwipeCarousel key={listKey} items={list} />
        )}
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Desktop: pinned, scroll-controlled expanding carousel.
   The active project sits in the centre, expanded; the others are narrow strips.
   --------------------------------------------------------------------------- */
const STRIP = 46; /* strip width = thumbnail size (px) */
const GAP = 14;
const SIDE = 12;  /* strips shown on EACH side of the active project (enough for wide screens) */

function PinnedCarousel({ items, sectionRef }) {
  const root = useRef(null);
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);
  const api = useRef({ jump: () => {} });
  const n = items.length;

  /* The row is a loop: the projects are repeated so there are always strips on
     BOTH sides of the active one. `base` is where the "real" (middle) copy starts;
     project idx sits at position base + idx. Extra copies are decorative only. */
  const copies = n > 1 ? 1 + 2 * Math.ceil(SIDE / n) : 1;
  const base = Math.floor(copies / 2) * n;
  const ring = useMemo(
    () => Array.from({ length: copies * n }, (_, v) => ({ p: items[v % n], v, idx: v % n, real: v >= base && v < base + n })),
    [items, copies, n, base]
  );

  useGSAP(
    () => {
      const track = trackRef.current;
      const stage = root.current;
      const els = gsap.utils.toArray('.pl-item');
      let size = { vw: 0, w: 0, h: 0 };
      let current = 0;

      const measure = () => {
        const vw = stage.clientWidth;
        const availH = stage.clientHeight - 150; /* room for title + button under the image */
        let w = Math.min(vw * 0.44, 720);
        let h = w * 0.56;
        if (h > availH) { h = Math.max(150, availH); w = h / 0.56; }
        size = { vw, w, h };
        gsap.set(track, { '--active-w': `${w}px` });
      };

      /* Expand project `idx` (its middle-copy position), shrink the rest, and
         slide the row so it's centred — with strips on both sides. */
      const layout = (idx, animate) => {
        const { vw, w, h } = size;
        const d = animate ? 0.7 : 0;
        const ease = 'power3.inOut';
        const pos = base + idx;
        els.forEach((el, i) => {
          const on = i === pos;
          el.classList.toggle('is-active', on);
          gsap.to(el, { width: on ? w : STRIP, duration: d, ease, overwrite: 'auto' });
          gsap.to(el.querySelector('.pl-item__media'), { height: on ? h : STRIP, borderRadius: on ? 12 : 6, duration: d, ease, overwrite: 'auto' });
          gsap.to(el.querySelector('.pl-item__vtitle'), { autoAlpha: on ? 0 : 1, duration: animate ? (on ? 0.2 : 0.4) : 0, delay: animate && !on ? 0.35 : 0, overwrite: 'auto' });
          gsap.to(el.querySelector('.pl-item__info'), on
            ? { autoAlpha: 1, y: 0, duration: animate ? 0.5 : 0, delay: animate ? 0.45 : 0, ease: 'power3.out', overwrite: 'auto' }
            : { autoAlpha: 0, y: 16, duration: animate ? 0.2 : 0, overwrite: 'auto' });
        });
        gsap.to(track, { x: vw / 2 - (pos * (STRIP + GAP) + w / 2), duration: d, ease, overwrite: 'auto' });
      };

      const go = (idx, animate = true) => {
        if (idx === current) return;
        current = idx;
        setActive(idx);
        layout(idx, animate);
      };

      measure();
      layout(0, false);
      gsap.from(els, { opacity: 0, y: 40, duration: 0.7, ease: 'power3.out', stagger: { each: 0.025, from: base } });

      if (n < 2) return undefined;

      /* Pin: each step of scroll = one project. */
      const stepPx = () => Math.round(window.innerHeight * 0.6);
      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        /* pin just below the top bar (the section is one screen minus the bar) */
        start: () => `top ${parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72}px`,
        end: () => `+=${(n - 1) * stepPx()}`,
        pin: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => go(Math.round(self.progress * (n - 1))),
        onRefresh: () => { measure(); layout(current, false); },
      });

      const yFor = (idx) => st.start + (idx / (n - 1)) * (st.end - st.start);
      api.current.jump = (idx) => scrollToY(yFor(Math.max(0, Math.min(n - 1, idx))), 0.9);

      /* Snap: when scrolling stops inside the pin, settle exactly on the nearest project. */
      const onScrollEnd = () => {
        if (!st.isActive) return;
        const idx = Math.round(st.progress * (n - 1));
        if (Math.abs(window.scrollY - yFor(idx)) > 2) scrollToY(yFor(idx), 0.5);
      };
      ScrollTrigger.addEventListener('scrollEnd', onScrollEnd);

      /* Keyboard: ← / → while the carousel is on screen. */
      const onKey = (e) => {
        if (!st.isActive || e.target.closest('input, textarea')) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); api.current.jump(current + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); api.current.jump(current - 1); }
      };
      window.addEventListener('keydown', onKey);

      return () => {
        ScrollTrigger.removeEventListener('scrollEnd', onScrollEnd);
        window.removeEventListener('keydown', onKey);
      };
    },
    { scope: root }
  );

  /* New list = new pin length. */
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      <div className="plx__stage" ref={root}>
        <div className="pl-track" ref={trackRef}>
          {ring.map(({ p, v, idx, real }) => {
            const isActive = v === base + active;
            return (
              <article
                className="pl-item"
                key={`${p.slug}-${v}`}
                aria-current={isActive ? 'true' : undefined}
                aria-hidden={real ? undefined : true}
              >
                {!isActive && (
                  <button
                    type="button"
                    className="pl-item__hit"
                    onClick={() => api.current.jump(idx)}
                    aria-label={`Show ${p.title}`}
                    tabIndex={real ? 0 : -1}
                  />
                )}
                <div className="pl-item__media"><Media project={p} /></div>
                <span className="pl-item__vtitle" aria-hidden="true">{p.title}</span>
                <div className="pl-item__info">
                  <h2 className="pl-item__title">{p.title}</h2>
                  <Link className="btn btn--pink btn--sm" to={projectPath(p)} tabIndex={isActive ? 0 : -1}>
                    View project <Arrow />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <p className="plx__counter" aria-live="polite">
        <span className="plx__counter-num">{pad(active + 1)}</span> / {pad(n)}
        {n > 1 && <span className="plx__hint" aria-hidden="true"> · scroll or use ← →</span>}
      </p>
    </>
  );
}

/* ---------------------------------------------------------------------------
   Mobile / tablet / reduced motion: native swipe carousel with scroll-snap.
   The centred card is full size; neighbours shrink and dim as you swipe.
   --------------------------------------------------------------------------- */
function SwipeCarousel({ items }) {
  const scrollerRef = useRef(null);
  const [active, setActive] = useState(0);
  const n = items.length;

  useEffect(() => {
    const scroller = scrollerRef.current;
    let raf = 0;
    const update = () => {
      const center = scroller.scrollLeft + scroller.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      [...scroller.children].forEach((card, i) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.min(Math.abs(cardCenter - center) / card.offsetWidth, 1);
        card.style.transform = `scale(${1 - dist * 0.16})`;
        card.style.opacity = String(1 - dist * 0.55);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      setActive(best);
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    update();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [n]);

  const goTo = (i) => {
    const card = scrollerRef.current?.children[Math.max(0, Math.min(n - 1, i))];
    card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  return (
    <>
      <div
        className="pl-swipe"
        ref={scrollerRef}
        role="region"
        aria-label="Projects"
        tabIndex={0}
        data-lenis-prevent-touch
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); goTo(active + 1); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(active - 1); }
        }}
      >
        {items.map((p, i) => (
          <article className={`pl-card${i === active ? ' is-active' : ''}`} key={p.slug}>
            <button type="button" className="pl-card__media" onClick={() => goTo(i)} aria-label={`Show ${p.title}`} tabIndex={-1}>
              <Media project={p} />
            </button>
            <div className="pl-card__info">
              <h2 className="pl-card__title">{p.title}</h2>
              <Link className="btn btn--pink btn--sm" to={projectPath(p)} tabIndex={i === active ? 0 : -1}>View project <Arrow /></Link>
            </div>
          </article>
        ))}
      </div>
      <p className="plx__counter" aria-live="polite">
        <span className="plx__counter-num">{pad(active + 1)}</span> / {pad(n)}
      </p>
    </>
  );
}
