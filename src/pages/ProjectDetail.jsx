import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { caseStudyPath, pad, projectHue, projectPath } from '../lib/utils.js';
import { useProject } from '../hooks/useProjects.js';
import { useTitle } from '../hooks/useTitle.js';
import { useProjectAnimations } from '../hooks/useProjectAnimations.js';
import { Art, Arrow, Marquee, Media, NotFoundBlock, SmartImage, State } from '../components/ui.jsx';
import '../styles/pages/project.css';

/* Sets <meta name="description"> for the current page and restores it after. */
function useMetaDescription(text) {
  useEffect(() => {
    if (!text) return undefined;
    const tag = document.querySelector('meta[name="description"]');
    if (!tag) return undefined;
    const previous = tag.getAttribute('content');
    tag.setAttribute('content', text.slice(0, 160));
    return () => tag.setAttribute('content', previous);
  }, [text]);
}

/* Title split into masked words (they rise in one by one). The accent word
   (projects.title_accent_word, or the last word) is pink italic. */
function TitleWords({ text, accent }) {
  const words = String(text || '').trim().split(/\s+/);
  const target = (accent || words[words.length - 1] || '').toLowerCase();
  let accentIndex = words.map((w) => w.toLowerCase()).lastIndexOf(target);
  if (accentIndex === -1) accentIndex = words.length - 1;
  return words.map((w, i) => (
    <span key={i}>
      <span className="pd-word">
        <span>{i === accentIndex ? <em className="accent">{w}</em> : w}</span>
      </span>
      {i < words.length - 1 ? ' ' : ''}
    </span>
  ));
}

/* Statement split into words that light up with the scroll; the part after
   the last comma is the pink accent. */
function StatementWords({ text }) {
  const t = String(text || '').trim();
  const comma = t.lastIndexOf(',');
  const words = t.split(/\s+/);
  let chars = 0;
  return words.map((w, i) => {
    const start = chars;
    chars += w.length + 1;
    const isAccent = comma > 0 && comma < t.length - 1 && start > comma;
    return (
      <span key={i}>
        <span className={`pd-sw${isAccent ? ' accent' : ''}`}>{w}</span>
        {i < words.length - 1 ? ' ' : ''}
      </span>
    );
  });
}

/* /project/:slug — ONE template for every project. Every section below the
   hero only renders when the project actually has that data. */
export default function ProjectDetail() {
  const { slug } = useParams();
  const { project: p, prev, next, notFound, error, loading, retry } = useProject(slug);
  const rootRef = useRef(null);

  useTitle(loading ? 'Project' : p ? p.title : 'Project not found');
  useMetaDescription(p ? p.statement || p.overview : null);
  useProjectAnimations(rootRef, p ? p.slug : null);

  if (loading) return <DetailSkeleton />;
  if (error) {
    return (
      <div className="container section">
        <State icon="!" alert title="Couldn’t load this project" text="Something went wrong while loading. Check your connection and try again.">
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <button className="btn btn--pink btn--sm" type="button" onClick={retry}>Try again</button>
            <Link className="btn btn--ghost btn--sm" to="/projects">All projects</Link>
          </div>
        </State>
      </div>
    );
  }
  if (notFound || !p) {
    return (
      <NotFoundBlock
        eyebrow="Project not found"
        title={<>This project <em className="accent">wandered off.</em></>}
        text={`There’s no published project called “${slug}”. It may have been renamed, unpublished or removed.`}
      >
        <Link className="btn btn--pink" to="/projects">See all projects <Arrow /></Link>
        <Link className="btn btn--ghost" to="/">Go home</Link>
      </NotFoundBlock>
    );
  }

  const facts = [
    ['Role', p.role],
    ['Timeline', p.timeline],
    ['Year', p.year],
    ['Type', p.type],
  ].filter(([, v]) => v);
  const story = [
    ['The challenge', p.challenge],
    ['The solution', p.solution],
    ['The result', p.result],
  ].filter(([, v]) => v);
  const hue = projectHue(p);
  const heroFallback = <Art hue={hue} label={p.title} ariaLabel={`${p.title} preview`} />;

  return (
    <article className="pd" ref={rootRef} style={{ '--accent': p.accent || 'var(--pink)', '--hue': hue }}>
      <div className="pd-progress" aria-hidden="true" />

      {/* Hero */}
      <header className="container pd-hero">
        <div className="pd-hero__top">
          <Link className="back-link load-in" to="/projects">← All projects</Link>
          <p className="eyebrow load-in" style={{ '--i': 1 }}>{[p.type, p.year].filter(Boolean).join(' · ')}</p>
        </div>
        <h1 className="display pd-hero__title" aria-label={p.title}>
          <span aria-hidden="true"><TitleWords text={p.title} accent={p.titleAccent} /></span>
        </h1>
        {p.tags.length > 0 && (
          <ul className="pd-tags">
            {p.tags.map((t) => <li key={t}>{t}</li>)}
          </ul>
        )}
      </header>

      <div className="container">
        <div className="pd-cover">
          <div className="pd-cover__media">
            {p.heroVideo ? (
              <video src={p.heroVideo} poster={p.heroImage || p.cover || undefined} autoPlay muted loop playsInline preload="metadata" aria-label={`${p.title} video`} />
            ) : (
              <SmartImage src={p.heroImage || p.cover} alt={`${p.title} hero image`} fallback={heroFallback} />
            )}
          </div>
        </div>
      </div>

      {/* Facts */}
      {(facts.length > 0 || p.tools.length > 0) && (
        <section className="container pd-facts-wrap" aria-label="Project facts">
          <dl className="pd-facts">
            {facts.map(([label, value]) => (
              <div className="pd-fact" key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
            {p.tools.length > 0 && (
              <div className="pd-fact pd-fact--wide"><dt>Tools</dt><dd className="pd-tools">{p.tools.map((t) => <span key={t}>{t}</span>)}</dd></div>
            )}
          </dl>
        </section>
      )}

      {/* Overview + statement */}
      {(p.overview || p.statement) && (
        <section className="container pd-intro">
          {p.overview && (
            <div className="pd-intro__aside">
              <span className="pd-label">(Overview)</span>
              <p>{p.overview}</p>
            </div>
          )}
          {p.statement && (
            <p className="display pd-intro__statement" aria-label={p.statement}>
              <span aria-hidden="true"><StatementWords text={p.statement} /></span>
            </p>
          )}
        </section>
      )}

      {/* Stats */}
      {p.stats.length > 0 && (
        <section className="container" aria-label="Key numbers">
          <div className="pd-stats">
            {p.stats.map((s, i) => (
              <div className="pd-stat" key={`${s.label}-${i}`}>
                {s.value && <span className="pd-stat__value" data-value={s.value}>{s.value}</span>}
                {s.label && <span className="pd-stat__label">{s.label}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Challenge / solution / result */}
      {story.length > 0 && (
        <section className="container section pd-story" aria-label="The story">
          {story.map(([title, text], i) => (
            <article className="pd-story__item" key={title}>
              <span className="pd-story__line" aria-hidden="true" />
              <div className="pd-story__body">
                <span className="pd-story__num">{pad(i + 1)}</span>
                <h2 className="display pd-story__title">{title}</h2>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Gallery */}
      {p.gallery.length > 0 && (
        <section className="container section pd-gallery-wrap" aria-labelledby="gallery-title">
          <h2 className="pd-label" id="gallery-title">(Screens)</h2>
          <div className="pd-gallery">
            {p.gallery.map((g, i) => (
              <figure className={`pd-shot pd-shot--${g.size}`} key={`${g.src}-${i}`}>
                <div className="pd-shot__frame">
                  <div className="pd-shot__media">
                    <SmartImage src={g.src} alt={g.caption || `${p.title} screen ${i + 1}`} fallback={<Art hue={hue} label={`Screen ${pad(i + 1)}`} ariaLabel={g.caption || `${p.title} screen ${i + 1}`} />} />
                  </div>
                </div>
                {g.caption && <figcaption>{g.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Process words */}
      {p.processWords.length > 0 && <Marquee items={p.processWords} label="Process" className="pd-marquee" />}

      {/* Case study */}
      {p.caseStudySlug && (
        <section className="container pd-cta">
          <h2 className="display pd-cta__title">( Want the <em className="accent">whole story?</em> )</h2>
          <Link className="btn btn--pink" to={caseStudyPath(p)}>Read the case study <Arrow /></Link>
        </section>
      )}

      {/* Previous / next */}
      {(prev || next) && (
        <nav className="pd-pager" aria-label="More projects">
          <div className="container pd-pager__grid">
            {prev && (
              <Link className="pd-pager__link pd-pager__link--prev" to={projectPath(prev)}>
                <span className="pd-pager__label">← Previous</span>
                <span className="display pd-pager__title">{prev.title}</span>
              </Link>
            )}
            {next && (
              <Link className="pd-pager__link pd-pager__link--next" to={projectPath(next)}>
                <span className="pd-pager__label">Next →</span>
                <span className="display pd-pager__title">{next.title}</span>
                <span className="pd-pager__thumb" aria-hidden="true"><Media project={next} /></span>
              </Link>
            )}
          </div>
        </nav>
      )}
    </article>
  );
}

export function DetailSkeleton() {
  return (
    <div className="container detail-loading" role="status" aria-busy="true">
      <span className="sr-only">Loading project…</span>
      <div className="skeleton skeleton--text" style={{ width: '30%' }} />
      <div className="skeleton" style={{ height: 'clamp(120px,20vw,220px)', width: '85%' }} />
      <div className="skeleton" style={{ height: '1.5rem', width: '40%' }} />
      <div className="skeleton" style={{ aspectRatio: '16/8' }} />
    </div>
  );
}
