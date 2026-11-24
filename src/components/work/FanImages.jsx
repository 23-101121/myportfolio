import { useRef } from 'react';
import { gsap, useGSAP, ScrollTrigger, REDUCED } from '../../lib/gsap.js';
import { Art, SmartImage } from '../ui.jsx';

/* Where each gallery image goes when the fan opens (relative to the cover).
   0 = left, 1 = right, 2 & 3 = peeking out the top/back. */
const FAN = [
  { xPercent: -42, yPercent: 6, rotation: -13, scale: 0.84 },
  { xPercent: 42, yPercent: 6, rotation: 13, scale: 0.84 },
  { xPercent: -16, yPercent: -24, rotation: -6, scale: 0.74 },
  { xPercent: 18, yPercent: -26, rotation: 7, scale: 0.72 },
];

/* Section 3: the cover sits in front; on hover (or automatically on touch
   screens when the panel is in view) the gallery images fan out from behind it. */
export default function FanImages({ cover, gallery, title, seed, hue, panelRef }) {
  const root = useRef(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray('.fan__card');
      const coverEl = root.current.querySelector('.fan__cover');
      const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
      const small = window.matchMedia('(max-width: 767px)').matches || touch;
      const k = small ? 0.55 : 1; /* smaller spread on phones so nothing overflows */

      gsap.set(cards, { xPercent: 0, yPercent: 0, rotation: 0, scale: 0.9, filter: 'brightness(0.55)' });

      const tl = gsap.timeline({ paused: true, defaults: { duration: 0.7, ease: 'expo.out' } });
      cards.forEach((card, i) => {
        const f = FAN[i] || FAN[0];
        tl.to(card, { xPercent: f.xPercent * k, yPercent: f.yPercent * k, rotation: f.rotation * (small ? 0.7 : 1), scale: f.scale, filter: 'brightness(0.72)' }, i * 0.05);
      });
      tl.to(coverEl, { y: -10, scale: 1.04, duration: 0.6 }, 0);

      const reduce = window.matchMedia(REDUCED).matches;
      const open = () => (reduce ? tl.progress(1) : tl.timeScale(1).play());
      const close = () => (reduce ? tl.progress(0) : tl.timeScale(1.4).reverse());

      if (touch) {
        const st = ScrollTrigger.create({
          trigger: panelRef.current,
          start: 'top 55%',
          end: 'bottom 45%',
          onToggle: (self) => (self.isActive ? open() : close()),
        });
        return () => st.kill();
      }
      const el = root.current;
      el.addEventListener('pointerenter', open);
      el.addEventListener('pointerleave', close);
      return () => {
        el.removeEventListener('pointerenter', open);
        el.removeEventListener('pointerleave', close);
      };
    },
    { scope: root }
  );

  return (
    <div className="fan" ref={root}>
      {gallery.map((g, i) => (
        <div className="fan__card" key={i} aria-hidden="true">
          <SmartImage src={g} alt="" draggable="false" fallback={<Art seed={`${seed}-g${i}`} />} />
        </div>
      ))}
      <div className="fan__cover">
        <SmartImage src={cover} alt={`${title} cover`} draggable="false" fallback={<Art hue={hue} label={title} ariaLabel={`${title} cover`} />} />
      </div>
    </div>
  );
}
