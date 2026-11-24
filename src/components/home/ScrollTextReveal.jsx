import { useRef } from 'react';
import { gsap, useGSAP, MOTION_OK } from '../../lib/gsap.js';

/* Each word is its own span. `accent` = pink italic, `mark` = inside the
   highlighted "OWN PLACE." group, `br` = line break after this word. */
const WORDS = [
  { t: 'Where' }, { t: 'would' }, { t: 'you' }, { t: 'like' }, { t: 'to' },
  { t: 'wander?', accent: true, br: true },
  { t: 'Every' }, { t: 'project,' }, { t: 'experiment' }, { t: 'and' },
  { t: 'captured' }, { t: 'moment' }, { t: 'has' }, { t: 'its' },
  { t: 'own', mark: true }, { t: 'place.', mark: true, accent: true },
];
const SENTENCE = WORDS.map((w) => w.t).join(' ');

/* Section 2: pinned while the words light up one by one, scrubbed to scroll. */
export default function ScrollTextReveal() {
  const wrap = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const words = gsap.utils.toArray('.statement__word');
        gsap.set(words, { opacity: 0.15 });
        gsap.set('.statement__mark-bg', { scaleX: 0 });

        gsap
          .timeline({
            scrollTrigger: {
              trigger: '.statement',
              start: 'top top',
              end: () => `+=${Math.round(window.innerHeight * 1.6)}`,
              pin: true,
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          })
          .to(words, { opacity: 1, ease: 'none', duration: 0.25, stagger: 0.12 })
          .to('.statement__mark-bg', { scaleX: 1, ease: 'power2.out', duration: 0.5 }, '-=0.15')
          .to({}, { duration: 0.3 }); /* short hold on the finished sentence before unpinning */
      });
    },
    { scope: wrap }
  );

  const before = WORDS.filter((w) => !w.mark);
  const marked = WORDS.filter((w) => w.mark);
  const word = (w) => (
    <span key={w.t}>
      <span className={`statement__word${w.accent ? ' accent' : ''}`}>{w.t}</span>
      {w.br ? <br /> : ' '}
    </span>
  );

  return (
    <div ref={wrap}>
      <section className="statement" aria-label="Introduction">
        <div className="container">
          <p className="display statement__text" aria-label={SENTENCE}>
            <span aria-hidden="true">
              {before.map(word)}
              <span className="statement__mark">
                <span className="statement__mark-bg" />
                {marked.map((w, i) => (
                  <span key={w.t}>
                    <span className={`statement__word${w.accent ? ' accent' : ''}`}>{w.t}</span>
                    {i < marked.length - 1 ? ' ' : ''}
                  </span>
                ))}
              </span>
            </span>
          </p>
        </div>
      </section>
    </div>
  );
}
