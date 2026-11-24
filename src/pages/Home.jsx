import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pad, projectPath } from '../lib/utils.js';
import { ScrollTrigger } from '../lib/gsap.js';
import { useProjects } from '../hooks/useProjects.js';
import { useTitle } from '../hooks/useTitle.js';
import { Arrow, ErrorState, Media, State } from '../components/ui.jsx';
import HomeHero from '../components/home/HomeHero.jsx';
import ScrollTextReveal from '../components/home/ScrollTextReveal.jsx';
import CategoriesScroller from '../components/home/CategoriesScroller.jsx';
import DiscoverMarquee from '../components/home/DiscoverMarquee.jsx';
import '../styles/pages/home.css';

export default function Home() {
  useTitle('');
  const { projects: list, error, loading, retry } = useProjects();
  /* 'A few things I've made' = the first projects by sort_order. */
  const featured = list.slice(0, 5);

  /* Content height changes when Supabase data arrives: re-measure pinned sections. */
  useEffect(() => {
    if (!loading) requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [loading]);

  return (
    <>
      {/* 1) Hero */}
      <HomeHero projects={list} />

      {/* 2) Scroll text reveal (pinned) */}
      <ScrollTextReveal />

      {/* 3) Categories — pinned horizontal scroll */}
      <CategoriesScroller />

      {/* 4) Featured */}
      <section className="section featured" aria-labelledby="featured-title">
        <div className="container">
          <div className="section-head" data-reveal>
            <p className="eyebrow">Featured files</p>
            <h2 className="display h2" id="featured-title">A few things <em className="accent">I’ve made.</em></h2>
          </div>
          <ol className="featured-list" aria-busy={loading}>
            {loading && [0, 1, 2].map((i) => <li key={i} className="skeleton skeleton--row" aria-hidden="true" />)}
            {error && <li><ErrorState onRetry={retry} /></li>}
            {!loading && !error && !featured.length && <li><State icon="∅" title="Projects coming soon" /></li>}
            {featured.map((p, i) => (
              <li className="featured-row" data-reveal style={{ '--i': i }} key={p.slug}>
                <Link to={projectPath(p)}>
                  <span className="featured-row__num">{pad(i + 1)}</span>
                  <span className="featured-row__title">{p.title}</span>
                  <span className="featured-row__type">{p.category || p.type}</span>
                  <span className="featured-row__preview" aria-hidden="true"><Media project={p} /></span>
                  <span className="featured-row__arrow" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ol>
          <div data-reveal>
            <Link className="btn btn--pink" to="/projects">View all projects <Arrow /></Link>
          </div>
        </div>
      </section>

      {/* 5) Discover — two scroll-linked marquee rows */}
      <DiscoverMarquee projects={list} />

      {/* 6) Footer CTA comes from the shared <Footer /> */}
    </>
  );
}
