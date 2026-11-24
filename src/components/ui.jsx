/* Small reusable UI pieces used across pages. */
import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { hueFor, projectHue, projectPath, caseStudyPath } from '../lib/utils.js';

/* Puts one word in the pink serif accent: `word` if given and found in the
   text (e.g. projects.title_accent_word), otherwise the part after a comma,
   otherwise the last word. */
export function Accent({ text, word }) {
  const t = String(text || '').trim();
  if (word) {
    const i = t.toLowerCase().lastIndexOf(String(word).toLowerCase());
    if (i !== -1) {
      return <>{t.slice(0, i)}<em className="accent">{t.slice(i, i + word.length)}</em>{t.slice(i + word.length)}</>;
    }
  }
  const comma = t.lastIndexOf(',');
  if (comma > 0 && comma < t.length - 1) {
    return <>{t.slice(0, comma + 1)} <em className="accent">{t.slice(comma + 1).trim()}</em></>;
  }
  const words = t.split(/\s+/);
  if (words.length < 2) return t;
  const last = words.pop();
  return <>{words.join(' ')} <em className="accent">{last}</em></>;
}

/* Placeholder artwork shown until a real image is uploaded in Supabase. */
export function Art({ seed, hue, label, variant, ariaLabel }) {
  const decorative = !ariaLabel;
  return (
    <div
      className={`art${variant ? ` art--${variant}` : ''}`}
      style={{ '--hue': hue ?? hueFor(seed) }}
      role={decorative ? undefined : 'img'}
      aria-label={ariaLabel}
      aria-hidden={decorative || undefined}
    >
      {variant !== 'plain' && (
        <div className="art__screen">
          <span className="art__bar" />
          <span className="art__dial" />
          <span className="art__bar art__bar--short" />
          <span className="art__grid"><i /><i /><i /></span>
        </div>
      )}
      {label && <span className="art__label">{label}</span>}
    </div>
  );
}

/* <img> that swaps to placeholder art if the file is missing (e.g. not uploaded yet). */
export function SmartImage({ src, alt = '', fallback, ...rest }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) return fallback ?? null;
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} {...rest} />;
}

/* A project's image (cover by default), or placeholder art tinted with its accent colour. */
export function Media({ project, variant, src, alt }) {
  const image = src || project?.cover;
  return (
    <SmartImage
      src={image}
      alt={alt ?? `${project?.title || ''} preview`}
      fallback={<Art hue={projectHue(project)} label={project?.category || project?.type || project?.title} variant={variant} ariaLabel={`${project?.title || 'Project'} preview`} />}
    />
  );
}

export function TagList({ tags = [], max = 3 }) {
  if (!tags.length) return null;
  return (
    <ul className="tag-list">
      {tags.slice(0, max).map((t) => <li className="tag" key={t}>{t}</li>)}
    </ul>
  );
}

export function ProjectCard({ project: p, index = 0 }) {
  const meta = [p.category || p.type, p.year].filter(Boolean).join(' · ');
  return (
    <article className="project-card" data-reveal style={{ '--i': index % 4 }}>
      <div className="project-card__inner">
        <div className="project-card__media"><Media project={p} /></div>
        <div className="project-card__body">
          <p className="project-card__meta">{meta}</p>
          <h3 className="project-card__title"><Link to={projectPath(p)}>{p.title}</Link></h3>
          {p.statement && <p className="project-card__summary">{p.statement}</p>}
          <TagList tags={p.tags} />
          <div className="project-card__foot">
            <span className="project-card__cta" aria-hidden="true">View project<span className="btn__arrow">→</span></span>
            {p.caseStudySlug && <Link className="project-card__case" to={caseStudyPath(p)}>Read case study</Link>}
          </div>
        </div>
      </div>
    </article>
  );
}

/* Infinite horizontal loop. Content is rendered twice for a seamless wrap. */
export function Marquee({ items = [], reverse, label, renderItem, className = '' }) {
  const group = (hidden) => (
    <div className="marquee__group" aria-hidden={hidden || undefined}>
      {items.map((item, i) =>
        renderItem ? (
          <span key={i}>{renderItem(item)}</span>
        ) : (
          <Fragment key={i}>
            <span className="marquee__item">{item}</span>
            <span className="marquee__sep" aria-hidden="true">✦</span>
          </Fragment>
        )
      )}
    </div>
  );
  return (
    <div
      className={`marquee${reverse ? ' marquee--reverse' : ''} ${className}`}
      role={label ? 'marquee' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <div className="marquee__track">{group(false)}{group(true)}</div>
    </div>
  );
}

/* Empty / error / info box. */
export function State({ icon = '?', title, text, alert, children }) {
  return (
    <div className="state" role={alert ? 'alert' : 'status'}>
      <span className="state__icon" aria-hidden="true">{icon}</span>
      <h3 className="state__title">{title}</h3>
      {text && <p className="state__text">{text}</p>}
      {children}
    </div>
  );
}

export function ErrorState({ onRetry, title = 'Couldn’t load projects' }) {
  return (
    <State icon="!" alert title={title} text="Something went wrong while fetching the work. Check your connection and try again.">
      <button className="btn btn--ghost btn--sm" type="button" onClick={onRetry}>Try again</button>
    </State>
  );
}

export function SkeletonCards({ count = 3 }) {
  return Array.from({ length: count }, (_, i) => <div key={i} className="skeleton skeleton--card" aria-hidden="true" />);
}

/* Full-page "not found" block used by the 404 page and unknown slugs. */
export function NotFoundBlock({ eyebrow, title, text, children, bg = '404' }) {
  return (
    <section className="not-found">
      <span className="not-found__bg load-in" aria-hidden="true">{bg}</span>
      <div className="not-found__content container">
        <p className="eyebrow load-in" style={{ '--i': 1 }}>{eyebrow}</p>
        <h1 className="display not-found__title load-in" style={{ '--i': 2 }}>{title}</h1>
        {text && <p className="lead load-in" style={{ '--i': 3 }}>{text}</p>}
        <div className="btn-row load-in" style={{ '--i': 4, justifyContent: 'center' }}>{children}</div>
      </div>
    </section>
  );
}

export const Arrow = ({ dir = '→' }) => <span className="btn__arrow" aria-hidden="true">{dir}</span>;
