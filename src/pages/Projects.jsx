import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ScrollTrigger } from '../lib/gsap.js';
import { useProjects } from '../hooks/useProjects.js';
import { useTitle } from '../hooks/useTitle.js';
import { Art, Arrow, SmartImage } from '../components/ui.jsx';
import CurvedLoop from '../components/CurvedLoop/CurvedLoop.jsx';
import WorkHero from '../components/work/WorkHero.jsx';
import ProjectStack from '../components/work/ProjectStack.jsx';
import '../styles/pages/projects.css';

const MARQUEE = ['UI/UX', 'Case studies', 'Apps', 'Dashboards', 'Branding', 'Experiments', 'Motion'];

export default function Projects() {
  useTitle('Projects');
  const { projects, categories, error, loading, retry } = useProjects();

  /* Data changes the page height: re-measure every ScrollTrigger once it's in. */
  useEffect(() => {
    if (!loading) requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [loading]);

  return (
    <>
      {/* 1) Hero */}
      <WorkHero />

      {/* Categories strip — React Bits CurvedLoop (drag it, it speeds up with scroll) */}
      <div className="work-loop">
        <CurvedLoop
          marqueeText={MARQUEE.join(' · ')}
          separator="✦"
          separatorColor="#e2457c"
          className="work-loop__text"
          color="#ffffff"
          speed={1.6}
          curveAmount={160}
          fontSize={88}
          fontWeight={400}
          edgeFade={0.12}
          scrollBoost={1}
          interactive
        />
      </div>

      {/* 2 + 3) Category filter + stacking project panels with fan-out images */}
      <ProjectStack projects={projects} categories={categories} loading={loading} error={error} retry={retry} />

      {/* 4) Every moment has its place — unchanged */}
      <section className="drift" aria-labelledby="drift-title">
        <DriftWall projects={projects} />
        <div className="drift__overlay">
          <h2 className="display drift__title" id="drift-title" data-reveal>
            Every <em className="accent">moment</em><br />has its place
          </h2>
          <Link className="btn btn--light" to="/projects/list" data-reveal>Explore everything <Arrow /></Link>
        </div>
      </section>
    </>
  );
}

/* Five columns of tiles drifting up/down forever (paused for reduced motion). */
function DriftWall({ projects }) {
  const seeds = projects.length ? projects : [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }];
  const variants = ['phone', undefined, 'plain'];
  return (
    <div className="drift__wall" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((c) => {
        const tiles = [0, 1, 2, 3].map((t) => {
          const p = seeds[(c + t) % seeds.length];
          return <SmartImage src={p.cover} alt="" fallback={<Art seed={`${p.slug}${c}${t}`} variant={variants[(c + t) % 3]} />} />;
        });
        return (
          <div className="drift__col" key={c}>
            {[...tiles, ...tiles].map((tile, i) => <div className="drift__tile" key={i}>{tile}</div>)}
          </div>
        );
      })}
    </div>
  );
}
