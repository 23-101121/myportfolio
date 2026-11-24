import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap, useGSAP } from '../../lib/gsap.js';
import { pad } from '../../lib/utils.js';
import { Art, Arrow } from '../ui.jsx';

/* TO ADD IMAGES LATER: give a card an `image` (e.g. import from src/assets)
   and it replaces the placeholder art. `slug` links to /projects?cat=slug. */
const CATEGORIES = [
  { title: 'UI/UX Design', meta: 'Apps · Systems · Interfaces', slug: 'ui-ux-design', hue: 145 },
  { title: 'Web Development', meta: 'Websites · Frontend · Supabase', slug: 'web-development', hue: 188 },
  { title: 'Branding & Identity', meta: 'Logos · Type · Guidelines', slug: 'branding-identity', hue: 335 },
  { title: 'Motion Design', meta: 'After Effects · Micro-interactions', slug: 'motion-design', hue: 265 },
  { title: 'Dashboard & Automotive UI', meta: 'In-car · Data · Systems', slug: 'dashboards-systems', hue: 160 },
  { title: 'Graphic Design', meta: 'Posters · Print · Social', slug: 'graphic-design', hue: 22 },
  { title: '3D & Visuals', meta: 'Blender · Renders · Mockups', slug: '3d-visuals', hue: 210 },
  { title: 'Photography', meta: 'Moments · Places · Light', slug: 'photography', hue: 48 },
];

/* Pinned horizontal scroll on tablet/desktop; native swipe row on phones
   (and for reduced motion). The pink counter follows the active card. */
const PIN_MQ = '(min-width: 768px) and (prefers-reduced-motion: no-preference)';

export default function CategoriesScroller() {
  const wrap = useRef(null);
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const total = CATEGORIES.length;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(PIN_MQ, () => {
        const track = trackRef.current;
        const viewport = track.parentElement;
        /* Move until the last card's right edge sits at the page margin. */
        const distance = () => {
          const last = track.lastElementChild;
          const gutter = parseFloat(getComputedStyle(track).paddingRight) || 0;
          return Math.max(0, last.offsetLeft + last.offsetWidth + gutter - viewport.clientWidth);
        };

        gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: '.cats',
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => setIndex(Math.round(self.progress * (total - 1))),
          },
        });
      });
    },
    { scope: wrap }
  );

  /* Phone / reduced motion: counter follows the native horizontal scroll. */
  useEffect(() => {
    const track = trackRef.current;
    const onScroll = () => {
      if (window.matchMedia(PIN_MQ).matches) return;
      const card = track.querySelector('.cat-card');
      if (!card) return;
      const step = card.offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0);
      const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
      setIndex(atEnd ? total - 1 : Math.round(track.scrollLeft / step));
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, [total]);

  return (
    <div ref={wrap}>
      <section className="cats" aria-labelledby="cat-title">
        <div className="container cats__head">
          <div className="cats__labels">
            <p className="eyebrow">Categories</p>
            <span className="cats__hint" aria-hidden="true">Scroll <span>→</span></span>
          </div>
          <div className="cats__intro">
            <div className="cats__copy">
              <h2 className="display h2" id="cat-title">A world of different <em className="accent">creations.</em></h2>
              <p className="section-head__text">
                A collection of creative and technical work, from digital experiences and tools to visual arts and experimental ideas. Each project tells a different story.
              </p>
            </div>
            <p className="cats__counter" aria-live="polite">
              <span className="sr-only">Category </span>
              <span className="cats__counter-num">{pad(index + 1)}</span>
              <span className="cats__counter-total">/ {pad(total)}</span>
            </p>
          </div>
        </div>

        <div className="cats__viewport">
          <div className="cats__track" ref={trackRef} role="list" aria-label="Project categories">
            {CATEGORIES.map((c, i) => (
              <article className={`cat-card${i === index ? ' is-active' : ''}`} role="listitem" key={c.title}>
                <div className="cat-card__media">
                  {c.image ? <img src={c.image} alt="" loading="lazy" /> : <Art hue={c.hue} label={c.title} />}
                </div>
                <div className="cat-card__body">
                  <div className="cat-card__text">
                    <span className="cat-card__index">{pad(i + 1)}</span>
                    <h3 className="cat-card__title">{c.title}</h3>
                    <p className="cat-card__meta">{c.meta}</p>
                  </div>
                  <Link className="btn btn--pink" to={`/projects?cat=${c.slug}#choose`}>
                    Browse projects <Arrow />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
