/* ==========================================================================
   Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays
   perfectly in sync. Turned off for people who prefer reduced motion.
   ========================================================================== */
import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap, ScrollTrigger } from './gsap.js';

let lenis = null;

export const getLenis = () => lenis;

/* Scroll to the top instantly (used after page changes). */
export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo({ top: 0, behavior: 'instant' });
}

/* Pause / resume scrolling (e.g. while the mobile menu is open). */
export function setScrollLocked(locked) {
  if (!lenis) return;
  if (locked) lenis.stop();
  else lenis.start();
}

export function useSmoothScroll() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let tick = null;

    function start() {
      if (lenis || mq.matches) return;
      lenis = new Lenis({ duration: 1.15, anchors: { offset: -80 } });
      lenis.on('scroll', ScrollTrigger.update);
      tick = (time) => lenis?.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }
    function stop() {
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
      tick = null;
    }
    const onChange = () => (mq.matches ? stop() : start());

    start();
    mq.addEventListener('change', onChange);
    return () => {
      mq.removeEventListener('change', onChange);
      stop();
    };
  }, []);
}
