import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCaseStudyBySlug } from '../lib/supabase.js';
import { ScrollTrigger } from '../lib/gsap.js';
import { isValidSlug, pad, projectPath, safeUrl } from '../lib/utils.js';
import { useAsync } from '../hooks/useAsync.js';
import { useTitle } from '../hooks/useTitle.js';
import { Accent, Art, Arrow, Media, NotFoundBlock, SmartImage, State } from '../components/ui.jsx';
import { DetailSkeleton } from './ProjectDetail.jsx';
import '../styles/pages/project.css';
import '../styles/pages/case-study.css';

/* "The process": the big number on the left follows the scroll — it rolls to
   01, 02, 03… as each step reaches the middle of the screen, and that step
   lights up while the others dim. */
function ProcessSteps({ sections, project: p }) {
  const stepsRef = useRef(null);
  const [active, setActive] = useState(0);
  const total = sections.length;

  useEffect(() => {
    const steps = [...stepsRef.current.querySelectorAll('.cs-step')];
    const triggers = steps.map((el, i) =>
      ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => { if (self.isActive) setActive(i); },
      })
    );
    return () => triggers.forEach((t) => t.kill());
  }, [total]);

  return (
    <section className="container section" aria-labelledby="process-title">
      <div className="cs-process">
        <div className="cs-process__aside">
          <div className="cs-process__counter" aria-hidden="true">
            <span className="cs-process__num">
              <span className="cs-process__roll" style={{ '--n': active }}>
                {sections.map((_, i) => <span key={i}>{pad(i + 1)}</span>)}
              </span>
            </span>
            <span className="cs-process__total">/ {pad(total)}</span>
          </div>
          <h2 className="display h3" id="process-title">The <em className="accent">process</em></h2>
          <p className="cs-process__current" aria-live="polite">{sections[active]?.title}</p>
        </div>
        <div className="cs-steps" ref={stepsRef}>
          {sections.map((s, i) => {
            const img = p.gallery[i];
            return (
              <article className={`cs-step${i === active ? ' is-active' : ''}`} key={`${s.title}-${i}`}>
                <span className="cs-step__num">{pad(i + 1)}</span>
                <h3 className="display cs-step__title">{s.title}</h3>
                {s.body && <p className="cs-step__body">{s.body}</p>}
                <div className="cs-step__media">
                  {img
                    ? <SmartImage src={img.src} alt={img.caption || s.title} fallback={<Art seed={`${p.slug}${i}`} label={s.title} />} />
                    : <Art seed={`${p.slug}${i}`} label={s.title} ariaLabel={`${s.title} placeholder`} />}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* /case-study/:slug — one reusable template for every case study. */
export default function CaseStudy() {
  const { slug } = useParams();
  const valid = isValidSlug(slug);
  const { data, error, loading, retry } = useAsync(() => (valid ? getCaseStudyBySlug(slug) : Promise.resolve(null)), [slug]);

  const found = data?.caseStudy;
  useTitle(loading ? 'Case study' : found ? `${data.project.title} case study` : 'Case study not found');

  if (loading) return <DetailSkeleton />;
  if (error) {
    return (
      <div className="container section">
        <State icon="!" alert title="Couldn’t load this case study" text="Something went wrong while loading. Check your connection and try again.">
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <button className="btn btn--pink btn--sm" type="button" onClick={retry}>Try again</button>
            <Link className="btn btn--ghost btn--sm" to="/projects/list">All projects</Link>
          </div>
        </State>
      </div>
    );
  }
  if (!found) {
    const project = data?.project;
    return (
      <NotFoundBlock
        eyebrow="Case study not found"
        title={<>This story isn’t <em className="accent">written yet.</em></>}
        text={project
          ? `There’s no case study for “${project.title}” yet, but you can still see the project.`
          : `We couldn’t find a case study called “${slug}”.`}
      >
        {project && <Link className="btn btn--pink" to={projectPath(project)}>View the project <Arrow /></Link>}
        <Link className={`btn ${project ? 'btn--ghost' : 'btn--pink'}`} to="/projects/list">Browse all projects</Link>
      </NotFoundBlock>
    );
  }

  const { project: p, caseStudy: cs } = data;
  const sections = (cs.sections || []).filter((s) => s && (s.title || s.body));
  const video = safeUrl(cs.video_url);

  return (
    <article>
      <header className="container">
        <div className="detail-hero__top" style={{ paddingTop: 'clamp(1.5rem,5vw,3rem)' }}>
          <Link className="back-link load-in" to={projectPath(p)}>← Project details</Link>
          <Link className="back-link load-in" style={{ '--i': 1 }} to="/projects/list">All projects →</Link>
        </div>
        <div className="cs-hero">
          <div>
            <p className="eyebrow load-in" style={{ '--i': 1 }}>{p.title} · Case study</p>
            <h1 className="display cs-hero__title load-in" style={{ '--i': 2 }}><Accent text={cs.problem_statement || p.title} /></h1>
          </div>
          <div className="cs-hero__brief load-in" style={{ '--i': 3 }}>
            {cs.brief && <p className="lead">{cs.brief}</p>}
            {(p.role || p.timeline) && (
              <dl className="facts">
                {p.role && <div className="fact"><dt>Role</dt><dd>{p.role}</dd></div>}
                {p.timeline && <div className="fact"><dt>Timeline</dt><dd>{p.timeline}</dd></div>}
              </dl>
            )}
          </div>
        </div>
      </header>

      <div className="container load-in" style={{ '--i': 4 }}>
        <div className="detail-cover"><Media project={p} /></div>
      </div>

      {cs.challenges && (
        <section className="container section">
          <blockquote className="cs-quote" data-reveal>
            <p>{cs.challenges}</p>
            <cite>The challenge</cite>
          </blockquote>
        </section>
      )}

      {sections.length > 0 && <ProcessSteps sections={sections} project={p} />}

      {cs.solution && (
        <section className="container section" aria-labelledby="decision-title">
          <div className="cs-decision">
            <div data-reveal>
              <p className="eyebrow">The key decision</p>
              <h2 className="display cs-decision__title" id="decision-title"><Accent text={cs.solution} /></h2>
            </div>
            <div className="cs-decision__media" data-reveal>
              <div><Art seed={p.slug} label="Before" /></div>
              <div><Art seed={`${p.slug}x`} variant="phone" /></div>
              <div><Art seed={`${p.slug}y`} variant="plain" /></div>
            </div>
          </div>
        </section>
      )}

      <section className="container section" aria-labelledby="final-title">
        <p className="eyebrow" data-reveal>Final design walkthrough</p>
        <h2 className="display cs-final__title" id="final-title" data-reveal><Accent text={cs.outcome_heading || 'The final result'} /></h2>
        <div className="cs-video" data-reveal>
          {video ? (
            <Video url={video} title={p.title} />
          ) : (
            <>
              <div className="cs-video__poster"><Art seed={p.slug} /></div>
              <div className="cs-video__play"><span aria-hidden="true">▶</span><span>Walkthrough video coming soon</span></div>
            </>
          )}
        </div>
        {(cs.walkthrough || p.result) && (
          <div className="cs-outcome">
            {cs.walkthrough && <article className="detail-block" data-reveal><h3 className="detail-block__title">Walkthrough</h3><p>{cs.walkthrough}</p></article>}
            {p.result && <article className="detail-block" data-reveal><h3 className="detail-block__title">Result</h3><p>{p.result}</p></article>}
          </div>
        )}
      </section>

      <section className="container story-cta">
        <h2 className="display story-cta__title" data-reveal>( Back to the <em className="accent">screens?</em> )</h2>
        <div className="btn-row" data-reveal style={{ justifyContent: 'center' }}>
          <Link className="btn btn--pink" to={projectPath(p)}>Project details <Arrow /></Link>
          <Link className="btn btn--ghost" to="/projects/list">All projects</Link>
        </div>
      </section>
    </article>
  );
}

/* YouTube / Vimeo get an iframe, anything else a native <video>. */
function Video({ url, title }) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (yt) return <iframe src={`https://www.youtube-nocookie.com/embed/${yt[1]}`} title={`${title} walkthrough`} allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return <iframe src={`https://player.vimeo.com/video/${vimeo[1]}`} title={`${title} walkthrough`} allow="fullscreen; picture-in-picture" allowFullScreen loading="lazy" />;
  return <video src={url} controls playsInline preload="metadata" />;
}
