import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap, REDUCED } from '../../lib/gsap.js';
import { TRAIL_PHOTOS } from '../../assets/about/index.js';
import { Arrow } from '../ui.jsx';

const SPAWN_DISTANCE = 80; /* px the pointer must travel before the next photo */
const MAX_PHOTOS = 10;     /* never more than this many in the DOM */
const STAY = 0.7;          /* seconds a photo stays before leaving */

/* Static collage for reduced motion: [left %, top %, rotation] */
const STATIC = [[12, 18, -6], [78, 14, 5], [20, 70, 4], [70, 72, -5], [48, 8, 2]];

/* Section 4: photos spawn along the cursor (or finger) path behind a huge
   "A LITTLE ABOUT me." heading that inverts over them (mix-blend-mode: difference). */
export default function AboutTrail() {
  const sectionRef = useRef(null);
  const layerRef = useRef(null);
  const [reduced, setReduced] = useState(() => window.matchMedia(REDUCED).matches);

  useEffect(() => {
    const mq = window.matchMedia(REDUCED);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    if (reduced) return undefined;
    const section = sectionRef.current;
    const layer = layerRef.current;
    let last = null;
    let index = 0;
    let lastInteraction = 0;
    let inView = false;
    let raf = 0;
    let t = 0;

    /* Preload so photos pop in instantly. */
    TRAIL_PHOTOS.forEach((src) => { const i = new Image(); i.src = src; });

    function spawn(x, y) {
      const img = document.createElement('img');
      img.src = TRAIL_PHOTOS[index % TRAIL_PHOTOS.length];
      index += 1;
      img.alt = '';
      img.className = 'trail__photo';
      img.draggable = false;
      layer.appendChild(img);

      gsap.set(img, { x, y, xPercent: -50, yPercent: -50, rotation: gsap.utils.random(-8, 8), scale: 0.3, opacity: 0 });
      gsap
        .timeline({ onComplete: () => img.remove() })
        .to(img, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.8)' })
        .to(img, { scale: 0.5, opacity: 0, duration: 0.5, ease: 'power2.in' }, `+=${STAY}`);

      /* Keep the DOM light: drop the oldest photos beyond the limit. */
      while (layer.children.length > MAX_PHOTOS) {
        const oldest = layer.firstElementChild;
        gsap.killTweensOf(oldest);
        oldest.remove();
      }
    }

    function track(clientX, clientY) {
      const rect = section.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      if (!last || Math.hypot(x - last.x, y - last.y) >= SPAWN_DISTANCE) {
        spawn(x, y);
        last = { x, y };
      }
    }

    const onPointerMove = (e) => {
      if (e.pointerType !== 'mouse') return;
      lastInteraction = performance.now();
      track(e.clientX, e.clientY);
    };
    /* Touch: follow the finger while dragging (touchmove keeps firing while the page scrolls). */
    const onTouchMove = (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      lastInteraction = performance.now();
      track(touch.clientX, touch.clientY);
    };
    const onLeave = () => { last = null; };

    section.addEventListener('pointermove', onPointerMove);
    section.addEventListener('pointerleave', onLeave);
    section.addEventListener('touchmove', onTouchMove, { passive: true });
    section.addEventListener('touchend', onLeave);

    /* Touch devices: if nobody interacts, auto-play the trail along a smooth
       figure-of-eight path while the section is on screen. */
    const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    function autoplay() {
      raf = requestAnimationFrame(autoplay);
      if (!inView || performance.now() - lastInteraction < 2500) return;
      t += 0.016;
      const rect = section.getBoundingClientRect();
      const cx = rect.left + rect.width / 2 + Math.sin(t * 0.9) * rect.width * 0.36;
      const cy = rect.top + rect.height * 0.45 + Math.sin(t * 1.8) * rect.height * 0.28;
      track(cx, cy);
    }
    const io = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; }, { threshold: 0.35 });
    io.observe(section);
    if (isTouch) raf = requestAnimationFrame(autoplay);

    return () => {
      section.removeEventListener('pointermove', onPointerMove);
      section.removeEventListener('pointerleave', onLeave);
      section.removeEventListener('touchmove', onTouchMove);
      section.removeEventListener('touchend', onLeave);
      io.disconnect();
      cancelAnimationFrame(raf);
      gsap.killTweensOf(layer.children);
      layer.replaceChildren();
    };
  }, [reduced]);

  return (
    <section className="trail" ref={sectionRef} aria-labelledby="me-title">
      {/* Live trail: filled by JS only (React never renders into it). */}
      <div className="trail__layer" ref={layerRef} aria-hidden="true" />
      {reduced && (
        <div className="trail__layer" aria-hidden="true">
          {STATIC.map(([left, top, rot], i) => (
            <img
              key={i}
              className="trail__photo trail__photo--static"
              src={TRAIL_PHOTOS[i % TRAIL_PHOTOS.length]}
              alt=""
              style={{ left: `${left}%`, top: `${top}%`, transform: `translate(-50%, 0) rotate(${rot}deg)` }}
            />
          ))}
        </div>
      )}

      <h2 className="display trail__title" id="me-title">
        A little <br className="trail__br" />about <em className="accent">me.</em>
      </h2>

      <div className="container trail__content">
        <div className="trail__panel" data-reveal>
          <p className="trail__bio">
            I’m Ganna, a digital creator and UI/UX designer. I care about intentional design, meaningful experiences,
            creative freedom, and the little moments that inspire me.
          </p>
          <figure className="trail__quote">
            <figcaption>Guestbook</figcaption>
            <blockquote>“I really enjoyed working with Ganna!”</blockquote>
          </figure>
          <div className="btn-row">
            <Link className="btn btn--pink" to="/resume">View my CV <Arrow /></Link>
            <Link className="btn btn--ghost" to="/contact">Open guestbook <Arrow /></Link>
          </div>
        </div>
      </div>

      <p className="trail__hint" aria-hidden="true">{reduced ? '' : 'Move around ✦'}</p>
    </section>
  );
}
