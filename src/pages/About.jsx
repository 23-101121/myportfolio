import { useEffect } from 'react';
import { getTools } from '../lib/supabase.js';
import { useProjects } from '../hooks/useProjects.js';
import { ScrollTrigger } from '../lib/gsap.js';
import { useAsync } from '../hooks/useAsync.js';
import { useTitle } from '../hooks/useTitle.js';
import { Marquee } from '../components/ui.jsx';
import AboutHero from '../components/about/AboutHero.jsx';
import ApproachLoop from '../components/about/ApproachLoop.jsx';
import AboutTrail from '../components/about/AboutTrail.jsx';
import '../styles/pages/about.css';

const FALLBACK_TOOLS = ['Figma', 'Illustrator', 'Photoshop', 'After Effects', 'HTML', 'CSS', 'JavaScript'].map((name) => ({ name }));

export default function About() {
  useTitle('About');
  const projectsReq = useProjects();
  const toolsReq = useAsync(() => getTools());
  const projects = projectsReq.projects;
  const tools = toolsReq.data?.length ? toolsReq.data : FALLBACK_TOOLS;

  /* Content changes size when Supabase data arrives: re-measure the pinned hero. */
  useEffect(() => {
    if (!projectsReq.loading) requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [projectsReq.loading]);

  return (
    <>
      {/* 1) Hero — pinned; words then images reveal on scroll */}
      <AboutHero />

      {/* 2) My approach — staggered infinite loop */}
      <ApproachLoop projects={projects} />

      {/* 3) My toolkit — unchanged */}
      <section className="section toolkit" id="toolkit" aria-labelledby="toolkit-title">
        <div className="container center" data-reveal>
          <p className="eyebrow">The digital architect’s</p>
          <h2 className="display h2" id="toolkit-title">My <em className="accent">Toolkit</em>.</h2>
          <p className="section-head__text toolkit__text">The tools I reach for every day, from first sketch to final build.</p>
        </div>
        <div className="toolkit__marquee" data-reveal="fade">
          <Marquee
            label="Tools I use"
            items={tools}
            renderItem={(t) => (
              <span className="tool-pill">
                {t.icon_url
                  ? <img src={t.icon_url} alt="" loading="lazy" />
                  : <span className="tool-pill__badge" aria-hidden="true">{t.name.slice(0, 2)}</span>}
                {t.name}
              </span>
            )}
          />
        </div>
      </section>

      {/* 4) A little about me — image trail */}
      <AboutTrail />
    </>
  );
}
