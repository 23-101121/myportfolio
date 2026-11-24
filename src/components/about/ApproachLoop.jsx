import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { projectPath } from '../../lib/utils.js';
import { useVelocityLoop } from '../../hooks/useVelocityLoop.js';
import { Art, Media } from '../ui.jsx';

const PER_GROUP = 8; /* even number keeps the up/down stagger seamless across the loop */
const FILLERS = ['Sketch', 'Wireframe', 'Prototype', 'Motion', 'Build', 'Launch', 'Iterate', 'Explore'];

/* Section 2: "Ideas → Experiences" — staggered boxes in an infinite loop. */
export default function ApproachLoop({ projects }) {
  const wrap = useRef(null);
  useVelocityLoop(wrap, { base: 0.45, dirs: [-1] });

  /* Cycle through the real projects to fill the row; filler boxes only if there are none. */
  const count = projects.length ? Math.max(PER_GROUP, projects.length + (projects.length % 2)) : PER_GROUP;
  const items = Array.from({ length: count }, (_, i) =>
    projects.length
      ? { key: `${projects[i % projects.length].slug}-${i}`, project: projects[i % projects.length] }
      : { key: `f-${i}`, filler: FILLERS[i % FILLERS.length], seed: `idea${i}` }
  );

  return (
    <section className="section approach" aria-labelledby="ideas-title" ref={wrap}>
      <div className="container">
        <div className="approach__head" data-reveal>
          <div>
            <p className="eyebrow">My approach</p>
            <h2 className="display approach__title" id="ideas-title">
              Ideas <span className="approach__arrow" aria-hidden="true">→</span>
              <br />
              <em className="accent">Experiences</em>
            </h2>
          </div>
          <p className="section-head__text approach__text">
            I blend design, code and storytelling to create digital experiences that are not only functional but also expressive and memorable.
          </p>
        </div>
      </div>

      <div className="vloop approach__row" role="region" aria-label="Projects and ideas">
        <div className="vloop__track">
          {[0, 1].map((copy) => (
            <div className="vloop__group" key={copy} aria-hidden={copy === 1 || undefined} inert={copy === 1 ? '' : undefined}>
              {items.map((item) =>
                item.project ? (
                  <Link className="idea-box" to={projectPath(item.project)} key={`${copy}-${item.key}`}>
                    <span className="idea-box__media"><Media project={item.project} variant="phone" /></span>
                    <span className="idea-box__caption">{item.project.title}</span>
                  </Link>
                ) : (
                  <figure className="idea-box" key={`${copy}-${item.key}`}>
                    <span className="idea-box__media"><Art seed={item.seed} variant="phone" /></span>
                    <figcaption className="idea-box__caption">{item.filler}</figcaption>
                  </figure>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
