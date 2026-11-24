import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap, useGSAP, ScrollTrigger, MOTION_OK } from '../../lib/gsap.js';
import { projectPath } from '../../lib/utils.js';
import { Art, Arrow, Media } from '../ui.jsx';

const MIN_PER_ROW = 8;

/* Fill a row to at least MIN_PER_ROW cards by cycling through the real projects
   (from Supabase). Only if there are no projects at all do we show blanks. */
function buildRow(projects, offset) {
  if (!projects.length) {
    return Array.from({ length: MIN_PER_ROW }, (_, i) => ({ key: `ph-${i}`, placeholder: 'Coming soon', seed: `disc${offset}${i}` }));
  }
  const count = Math.max(MIN_PER_ROW, projects.length);
  return Array.from({ length: count }, (_, i) => {
    const p = projects[(i + offset) % projects.length];
    return { key: `${p.slug}-${i}`, project: p };
  });
}

function Card({ item }) {
  if (item.project) {
    const p = item.project;
    return (
      <Link className="disc-card" to={projectPath(p)}>
        <span className="disc-card__media"><Media project={p} /></span>
        <span className="disc-card__body">
          <span className="disc-card__title">{p.title}</span>
          <span className="disc-card__meta">{p.category || p.type}</span>
        </span>
      </Link>
    );
  }
  return (
    <div className="disc-card">
      <span className="disc-card__media"><Art seed={item.seed} label="Placeholder" /></span>
      <span className="disc-card__body">
        <span className="disc-card__title">{item.placeholder}</span>
      </span>
    </div>
  );
}

function Row({ items, label }) {
  /* Content is rendered twice so the loop wraps with no gap or jump. */
  return (
    <div className="disc-row" aria-label={label} role="region">
      <div className="disc-row__track">
        {[0, 1].map((copy) => (
          <div className="disc-row__group" key={copy} aria-hidden={copy === 1 || undefined} inert={copy === 1 ? '' : undefined}>
            {items.map((item) => <Card item={item} key={`${copy}-${item.key}`} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

/* Section 5: two rows drifting in opposite directions. Scrolling speeds them
   up (by scroll velocity); scrolling up flips both directions; hover slows a row. */
export default function DiscoverMarquee({ projects }) {
  const wrap = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const rows = gsap.utils.toArray('.disc-row');
        const state = rows.map((row, i) => ({
          row,
          track: row.querySelector('.disc-row__track'),
          group: row.querySelector('.disc-row__group'),
          x: 0,
          width: 0,
          dirSign: i === 0 ? -1 : 1, /* row 1 → left, row 2 → right (when scrolling down) */
          hover: 1,
          hoverTarget: 1,
        }));

        const measure = () => state.forEach((s) => { s.width = s.group.offsetWidth; });
        measure();
        const ro = new ResizeObserver(measure);
        state.forEach((s) => ro.observe(s.group));

        let direction = 1;
        let boost = 0;
        ScrollTrigger.create({
          trigger: wrap.current,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate(self) {
            const v = self.getVelocity();
            if (v) direction = v > 0 ? 1 : -1;
            boost = Math.min(Math.abs(v) / 180, 14);
          },
        });

        const BASE = 0.55; /* px per frame when idle */
        const tick = (_time, deltaTime) => {
          const f = deltaTime / 16.67;
          boost *= Math.pow(0.93, f); /* ease back to idle speed once scrolling stops */
          state.forEach((s) => {
            if (!s.width) return;
            s.hover += (s.hoverTarget - s.hover) * 0.08 * f;
            s.x += (BASE + boost) * s.hover * direction * s.dirSign * f;
            s.x = gsap.utils.wrap(-s.width, 0, s.x);
            gsap.set(s.track, { x: s.x });
          });
        };
        gsap.ticker.add(tick);

        const handlers = state.map((s) => {
          const enter = (e) => { if (e.pointerType === 'mouse') s.hoverTarget = 0.12; };
          const leave = () => { s.hoverTarget = 1; };
          s.row.addEventListener('pointerenter', enter);
          s.row.addEventListener('pointerleave', leave);
          return () => {
            s.row.removeEventListener('pointerenter', enter);
            s.row.removeEventListener('pointerleave', leave);
          };
        });

        return () => {
          gsap.ticker.remove(tick);
          ro.disconnect();
          handlers.forEach((off) => off());
        };
      });
    },
    { scope: wrap }
  );

  const row1 = buildRow(projects, 0);
  const row2 = buildRow([...projects].reverse(), Math.min(3, Math.max(projects.length - 1, 0)));

  return (
    <section className="section discover" aria-labelledby="discover-title" ref={wrap}>
      <div className="container">
        <div className="discover__head" data-reveal>
          <div>
            <p className="eyebrow">Selected works</p>
            <h2 className="display discover__title" id="discover-title">Discover</h2>
          </div>
          <div className="discover__side">
            <p className="section-head__text">A collection of designs, experiments and visual explorations across different mediums.</p>
            <Link className="btn btn--pink" to="/projects/list">Explore all projects <Arrow /></Link>
          </div>
        </div>
      </div>
      <div className="disc-rows">
        <Row items={row1} label="Projects, row 1" />
        <Row items={row2} label="Projects, row 2" />
      </div>
    </section>
  );
}
