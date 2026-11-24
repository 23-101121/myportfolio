import { useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { gsap, useGSAP, ScrollTrigger, MOTION_OK } from '../../lib/gsap.js';
import { filterProjects, pad, projectHue, projectPath } from '../../lib/utils.js';
import { getLenis } from '../../lib/smoothScroll.js';
import { Accent, Arrow, ErrorState, State } from '../ui.jsx';
import FanImages from './FanImages.jsx';

function Panel({ p, index }) {
  const ref = useRef(null);
  /* Fan = up to 4 gallery images (placeholders fill the gaps until uploaded). */
  const gallery = p.gallery.map((g) => g.src).filter((src) => src && src !== p.cover).slice(0, 4);
  while (gallery.length < 4) gallery.push(null);

  return (
    <article className="ps-panel" ref={ref} style={{ '--hue': projectHue(p), zIndex: index + 1 }} aria-label={p.title}>
      <div className="ps-panel__inner">
        <div className="container ps-panel__grid">
          <div className="ps-panel__copy">
            <span className="ps-panel__num" aria-hidden="true">{pad(index + 1)}</span>
            <h3 className="display ps-panel__title"><Accent text={p.title} word={p.titleAccent} /></h3>
            {p.tags.length > 0 && (
              <ul className="ps-panel__tags">
                {p.tags.slice(0, 3).map((t) => <li key={t}>{t}</li>)}
              </ul>
            )}
            <Link className="btn btn--pink" to={projectPath(p)}>View project <Arrow /></Link>
            <p className="ps-panel__meta">{[p.year, 'Selected work'].filter(Boolean).join(' · ')}</p>
          </div>
          <div className="ps-panel__media">
            <FanImages cover={p.cover} gallery={gallery} title={p.title} hue={projectHue(p)} seed={p.slug} panelRef={ref} />
          </div>
        </div>
      </div>
      <div className="ps-panel__shade" aria-hidden="true" />
    </article>
  );
}

/* Section 2: "Choose your category" + full-screen project panels that stack:
   each panel is sticky, the next one slides up over it, and the covered one
   shrinks to ~0.92 and darkens. */
export default function ProjectStack({ projects, categories, loading, error, retry }) {
  const root = useRef(null);
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();

  const requested = params.get('cat') || 'all';
  const activeCat = requested === 'all' || categories.some((c) => c.slug === requested) ? requested : 'all';
  const activeName = categories.find((c) => c.slug === activeCat)?.name;

  const list = useMemo(() => filterProjects(projects, '', activeCat), [projects, activeCat]);
  const listKey = list.map((p) => p.slug).join('|');

  /* Stacking effect: scale down + darken each panel while the next one covers it. */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const panels = gsap.utils.toArray('.ps-panel');
        panels.forEach((panel, i) => {
          const next = panels[i + 1];
          if (!next) return;
          gsap.timeline({ scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true } })
            .to(panel.querySelector('.ps-panel__inner'), { scale: 0.92, ease: 'none' }, 0)
            .to(panel.querySelector('.ps-panel__shade'), { opacity: 0.65, ease: 'none' }, 0);
        });
        /* Animate the change after filtering. */
        gsap.from(panels, { opacity: 0, y: 50, duration: 0.7, ease: 'power3.out', stagger: 0.06 });
      });
      ScrollTrigger.refresh();
    },
    { scope: root, dependencies: [listKey], revertOnUpdate: true }
  );

  /* Arriving with #choose (e.g. from a Home category card): scroll there once loaded. */
  useEffect(() => {
    if (loading || hash !== '#choose') return;
    const el = document.getElementById('choose');
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el, { offset: -80 });
    else el?.scrollIntoView({ behavior: 'smooth' });
  }, [loading, hash]);

  const setCategory = (slug) => {
    const next = new URLSearchParams(params);
    if (slug === 'all') next.delete('cat'); else next.set('cat', slug);
    setParams(next, { replace: true, preventScrollReset: true });
    /* Jump back to the top of the stack so the new first panel is in view. */
    const el = document.getElementById('choose');
    const lenis = getLenis();
    if (el && el.getBoundingClientRect().top < 0) {
      if (lenis) lenis.scrollTo(el, { offset: -80, duration: 0.8 });
      else el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="ps" id="choose" aria-labelledby="choose-title" ref={root}>
      <div className="container ps__head">
        <h2 className="display h2" id="choose-title" data-reveal>Choose your<br /><em className="accent">category</em></h2>
        <div className="chip-group" role="group" aria-label="Filter by category">
          {[{ slug: 'all', name: 'All' }, ...categories].map((c) => (
            <button key={c.slug} className="chip" type="button" aria-pressed={c.slug === activeCat} onClick={() => setCategory(c.slug)}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {!loading && !error ? `${list.length} project${list.length === 1 ? '' : 's'}${activeName ? ` in ${activeName}` : ''}` : ''}
      </p>

      {loading && <div className="container"><div className="skeleton ps-skeleton" aria-hidden="true" /></div>}
      {error && <div className="container"><ErrorState onRetry={retry} /></div>}
      {!loading && !error && !list.length && (
        <div className="container">
          <State icon="∅" title="Nothing in this category yet" text="Try another category, or see everything at once.">
            <button className="btn btn--ghost btn--sm" type="button" onClick={() => setCategory('all')}>Show all projects</button>
          </State>
        </div>
      )}

      <div className="ps__stack" key={listKey}>
        {list.map((p, i) => <Panel p={p} index={i} key={p.slug} />)}
      </div>
    </section>
  );
}
