import { gsap, useGSAP, MOTION_OK } from '../lib/gsap.js';

/* "<3s" → { prefix: '<', number: 3, suffix: 's', decimals: 0 } — null if no number. */
function parseStat(text) {
  const m = /^(\D*?)(\d+(?:[.,]\d+)?)(.*)$/.exec(String(text || '').trim());
  if (!m) return null;
  const raw = m[2].replace(',', '.');
  return { prefix: m[1], number: parseFloat(raw), suffix: m[3], decimals: (raw.split('.')[1] || '').length };
}

/* Scroll animations for the project template (/project/:slug).
   Runs again whenever the project changes; does nothing for reduced motion
   (everything is simply shown). */
export function useProjectAnimations(scopeRef, key) {
  useGSAP(
    () => {
      if (!key || !scopeRef.current) return;
      const q = (sel) => scopeRef.current.querySelectorAll(sel);
      const has = (sel) => q(sel).length > 0;
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        /* Reading progress bar (accent colour) */
        gsap.fromTo('.pd-progress', { scaleX: 0 }, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: scopeRef.current, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
        });

        /* Hero: words rise out of masks, tags pop, image opens from a rounded window */
        const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
        intro.from('.pd-word > span', { yPercent: 115, duration: 1.1, stagger: 0.08 }, 0.1);
        if (has('.pd-tags li')) intro.from('.pd-tags li', { opacity: 0, y: 14, duration: 0.6, stagger: 0.05 }, 0.55);
        if (has('.pd-cover')) {
          intro
            .fromTo('.pd-cover', { clipPath: 'inset(14% 10% 14% 10% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.5, ease: 'expo.inOut' }, 0.25)
            .from('.pd-cover__media', { scale: 1.3, duration: 1.8 }, 0.25);
          /* Parallax: the image drifts slower than the page */
          gsap.to('.pd-cover__media', {
            yPercent: 12,
            ease: 'none',
            scrollTrigger: { trigger: '.pd-cover', start: 'top top+=80', end: 'bottom top', scrub: true },
          });
        }

        /* Facts: one after another */
        if (has('.pd-fact')) {
          gsap.from('.pd-fact', {
            opacity: 0, y: 28, duration: 0.8, ease: 'power3.out', stagger: 0.07,
            scrollTrigger: { trigger: '.pd-facts', start: 'top 85%' },
          });
        }

        /* Overview fades up; statement lights up word by word with the scroll */
        if (has('.pd-intro__aside')) {
          gsap.from('.pd-intro__aside', { opacity: 0, y: 30, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.pd-intro', start: 'top 80%' } });
        }
        if (has('.pd-sw')) {
          gsap.fromTo('.pd-sw', { opacity: 0.12 }, {
            opacity: 1, ease: 'none', stagger: 0.1,
            scrollTrigger: { trigger: '.pd-intro__statement', start: 'top 82%', end: 'bottom 45%', scrub: 0.5 },
          });
        }

        /* Stats: cards rise, numbers count up */
        if (has('.pd-stat')) {
          gsap.from('.pd-stat', { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '.pd-stats', start: 'top 85%' } });
          q('.pd-stat__value').forEach((el) => {
            const stat = parseStat(el.dataset.value);
            if (!stat) return;
            const counter = { v: 0 };
            gsap.to(counter, {
              v: stat.number,
              duration: 1.6,
              ease: 'power2.out',
              scrollTrigger: { trigger: el, start: 'top 88%' },
              onUpdate: () => { el.textContent = `${stat.prefix}${counter.v.toFixed(stat.decimals)}${stat.suffix}`; },
              onComplete: () => { el.textContent = el.dataset.value; },
            });
          });
        }

        /* Challenge / solution / result: accent line draws, then text rises */
        if (has('.pd-story__item')) {
          gsap.timeline({ scrollTrigger: { trigger: '.pd-story', start: 'top 78%' } })
            .from('.pd-story__line', { scaleX: 0, transformOrigin: 'left center', duration: 1, ease: 'expo.out', stagger: 0.12 })
            .from('.pd-story__body', { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out', stagger: 0.12 }, 0.25);
        }

        /* Gallery: each screen opens from a rounded window and zooms in, tied to scroll */
        q('.pd-shot').forEach((shot) => {
          gsap.timeline({ scrollTrigger: { trigger: shot, start: 'top 92%', end: 'top 45%', scrub: 0.6 } })
            .fromTo(shot.querySelector('.pd-shot__frame'), { clipPath: 'inset(12% 12% 12% 12% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 14px)', ease: 'none' }, 0)
            .fromTo(shot.querySelector('.pd-shot__media'), { scale: 1.3 }, { scale: 1, ease: 'none' }, 0);
          const cap = shot.querySelector('figcaption');
          if (cap) gsap.from(cap, { opacity: 0, x: -12, duration: 0.6, scrollTrigger: { trigger: shot, start: 'top 60%' } });
        });

        /* Case study CTA grows in */
        if (has('.pd-cta')) {
          gsap.timeline({ scrollTrigger: { trigger: '.pd-cta', start: 'top 85%', end: 'top 45%', scrub: 0.6 } })
            .fromTo('.pd-cta__title', { scale: 0.82, opacity: 0.2 }, { scale: 1, opacity: 1, ease: 'none' })
            .fromTo('.pd-cta .btn', { y: 30, opacity: 0 }, { y: 0, opacity: 1, ease: 'none' }, 0.3);
        }

        /* Previous / next slide up */
        if (has('.pd-pager__link')) {
          gsap.from('.pd-pager__link', { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '.pd-pager', start: 'top 90%' } });
        }
      });
    },
    { scope: scopeRef, dependencies: [key], revertOnUpdate: true }
  );
}
