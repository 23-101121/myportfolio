import { useRef } from 'react';
import { gsap, useGSAP, MOTION_OK } from '../../lib/gsap.js';
import { WORK_HERO_BG, WORK_MOCKUPS } from '../../assets/work/index.js';
import { Arrow } from '../ui.jsx';

/* Where each mockup slides in from on load. */
const ENTER_FROM = {
  tl: { xPercent: -140, yPercent: -30 },
  tr: { xPercent: 140, yPercent: -30 },
  bc: { yPercent: 120 },
};

/* Section 1: full-screen hero — background collage under a dark overlay,
   centred heading, three tilted mockups that float, parallax on scroll and
   follow the mouse a little. Each mockup has separate layers so the
   entrance, scroll parallax, mouse parallax and float never fight:
   .wh-mock (enter) > __scroll (scroll) > __mouse (mouse) > __float (float). */
export default function WorkHero() {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const mocks = gsap.utils.toArray('.wh-mock');

        /* Load: heading lines rise out of their masks, mockups slide in from their sides. */
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        tl.from('.wh-line > span', { yPercent: 115, duration: 1.1, stagger: 0.12 }, 0.15)
          .from('.wh-sub', { opacity: 0, y: 20, duration: 0.8 }, 0.6)
          .from('.wh-bg', { scale: 1.15, duration: 2, ease: 'power2.out' }, 0);
        mocks.forEach((m, i) => {
          tl.from(m, { ...ENTER_FROM[m.dataset.pos], opacity: 0, duration: 1.4 }, 0.2 + i * 0.12);
        });

        /* Gentle float, each on its own rhythm. */
        gsap.utils.toArray('.wh-mock__float').forEach((el, i) => {
          gsap.to(el, { y: -14 - i * 4, rotation: i % 2 ? 1.5 : -1.5, duration: 3.4 + i * 0.7, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.4 + i * 0.3 });
        });

        /* Scroll parallax: mockups drift at different speeds as the hero leaves. */
        gsap.utils.toArray('.wh-mock__scroll').forEach((el, i) => {
          gsap.to(el, {
            yPercent: [-35, -50, -20][i] ?? -30,
            ease: 'none',
            scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
          });
        });
        gsap.to('.wh-bg', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true } });

        /* Mouse parallax (mouse only). */
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
          const layers = gsap.utils.toArray('.wh-mock__mouse').map((el, i) => ({
            x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3' }),
            y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3' }),
            depth: [28, 36, 18][i] ?? 24,
          }));
          const onMove = (e) => {
            const nx = e.clientX / window.innerWidth - 0.5;
            const ny = e.clientY / window.innerHeight - 0.5;
            layers.forEach((l) => { l.x(nx * l.depth); l.y(ny * l.depth); });
          };
          window.addEventListener('pointermove', onMove);
          return () => window.removeEventListener('pointermove', onMove);
        }
        return undefined;
      });
    },
    { scope: root }
  );

  return (
    <section className="wh" ref={root}>
      <div className="wh-bg" style={{ backgroundImage: `url(${WORK_HERO_BG})` }} aria-hidden="true" />
      <div className="wh-overlay" aria-hidden="true" />

      {WORK_MOCKUPS.map((m) => (
        <div className={`wh-mock wh-mock--${m.pos}`} data-pos={m.pos} key={m.pos} aria-hidden="true">
          <div className="wh-mock__scroll">
            <div className="wh-mock__mouse">
              <div className="wh-mock__float">
                <div className="wh-mock__device">
                  <img src={m.src} alt="" draggable="false" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="wh-content">
        <p className="eyebrow wh-sub">Portfolio</p>
        <h1 className="display wh-title">
          <span className="wh-line"><span>All my</span></span>
          <span className="wh-line wh-line--accent"><span><em className="accent">work &amp;</em></span></span>
          <span className="wh-line"><span>play</span></span>
        </h1>
        <p className="wh-sub wh-lead">A collection of screens, systems, brands and experiments</p>
        <a className="btn btn--pink wh-sub" href="#choose">Choose a category <Arrow dir="↓" /></a>
      </div>
    </section>
  );
}
