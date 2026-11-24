import { gsap, useGSAP, ScrollTrigger, MOTION_OK } from '../lib/gsap.js';

/* Infinite horizontal loop for one or more rows inside `scopeRef`.
   Markup per row:  .vloop > .vloop__track > .vloop__group (×2, identical)
   - drifts slowly on its own (`base` px per frame)
   - speeds up with scroll velocity, flips direction when scrolling up
   - slows almost to a stop while hovered (mouse only)
   `dirs[i]` = starting direction of row i (-1 = left, 1 = right). */
export function useVelocityLoop(scopeRef, { base = 0.5, dirs = [-1], maxBoost = 14 } = {}) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const rows = gsap.utils.toArray('.vloop');
        const state = rows.map((row, i) => ({
          row,
          track: row.querySelector('.vloop__track'),
          group: row.querySelector('.vloop__group'),
          x: 0,
          width: 0,
          sign: dirs[i] ?? (i % 2 ? 1 : -1),
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
          trigger: scopeRef.current,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate(self) {
            const v = self.getVelocity();
            if (v) direction = v > 0 ? 1 : -1;
            boost = Math.min(Math.abs(v) / 180, maxBoost);
          },
        });

        const tick = (_t, deltaTime) => {
          const f = deltaTime / 16.67;
          boost *= Math.pow(0.93, f);
          state.forEach((s) => {
            if (!s.width) return;
            s.hover += (s.hoverTarget - s.hover) * 0.08 * f;
            s.x += (base + boost) * s.hover * direction * s.sign * f;
            s.x = gsap.utils.wrap(-s.width, 0, s.x);
            gsap.set(s.track, { x: s.x });
          });
        };
        gsap.ticker.add(tick);

        const offs = state.map((s) => {
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
          offs.forEach((off) => off());
        };
      });
    },
    { scope: scopeRef }
  );
}
