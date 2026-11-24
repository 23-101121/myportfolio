import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap, useGSAP } from '../../lib/gsap.js';
import { ABOUT_HERO_IMAGES } from '../../assets/about/index.js';
import { Arrow } from '../ui.jsx';

/* Scattered words, listed in the order they appear on scroll.
   `pos` is the class that places each one (see about.css → .word--*). */
const WORDS = [
  { text: 'Imagination', pos: 'imagination', kind: 'serif' },
  { text: 'Starting the many ideas', pos: 'starting', kind: 'label' },
  { text: 'Logic', pos: 'logic', kind: 'display' },
  { text: '“What if?”', pos: 'whatif', kind: 'serif-sm' },
  { text: 'Thinking out loud', pos: 'thinking', kind: 'label' },
  { text: 'Refining the details', pos: 'refining', kind: 'label' },
  { text: 'Organized', pos: 'organized', kind: 'display' },
];

const DESKTOP = '(min-width: 768px) and (prefers-reduced-motion: no-preference)';
const MOBILE = '(max-width: 767px) and (prefers-reduced-motion: no-preference)';

/* Section 1: pinned hero. Scrolling reveals the scattered words one by one,
   then the image row (smallest → largest) one by one, then unpins. */
export default function AboutHero() {
  const wrap = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(DESKTOP, () => {
        gsap.set('.ah-word', { opacity: 0, y: 30 });
        gsap.set('.ah-img', { opacity: 0, scale: 0.8 });
        gsap
          .timeline({
            scrollTrigger: {
              trigger: '.ah',
              /* pin just below the top bar (the hero is one screen minus the bar) */
              start: () => `top ${parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72}px`,
              end: () => `+=${Math.round(window.innerHeight * 1.8)}`,
              pin: true,
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          })
          .to('.ah-word', { opacity: 1, y: 0, ease: 'power2.out', duration: 0.5, stagger: 0.45 })
          .to('.ah-img', { opacity: 1, scale: 1, ease: 'power2.out', duration: 0.5, stagger: 0.35 }, '+=0.1')
          .to({}, { duration: 0.3 }); /* brief hold before unpinning */
      });

      mm.add(MOBILE, () => {
        /* No pinning on phones: words follow the scroll, images pop in as they arrive. */
        gsap.set('.ah-word', { opacity: 0, y: 20 });
        gsap.to('.ah-word', {
          opacity: 1,
          y: 0,
          stagger: 0.4,
          ease: 'none',
          scrollTrigger: { trigger: '.ah-words', start: 'top 85%', end: 'bottom 45%', scrub: 0.5 },
        });
        gsap.from('.ah-img', {
          opacity: 0,
          scale: 0.8,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: { trigger: '.ah-images', start: 'top 90%' },
        });
      });
    },
    { scope: wrap }
  );

  return (
    <div ref={wrap}>
      <section className="ah">
        <div className="container ah__top">
          <div className="ah__copy">
            <p className="eyebrow load-in">About me</p>
            <h1 className="display ah__title load-in" style={{ '--i': 1 }}>
              Creative <em className="accent">Designer</em>
              <br />
              <em className="accent">&amp;</em> Builder
            </h1>
            <p className="lead load-in" style={{ '--i': 2 }}>
              A multidisciplinary designer who turns ideas into interactive, human-centered experiences.
            </p>
            <div className="btn-row load-in" style={{ '--i': 3 }}>
              <Link className="btn btn--pink" to="/projects">Explore my work <Arrow /></Link>
              <a className="btn btn--ghost" href="#toolkit">My toolkit <Arrow /></a>
            </div>
          </div>

          <div className="ah-words" aria-label="Imagination, logic, what if, organized">
            {WORDS.map((w) => (
              <span key={w.pos} className={`ah-word ah-word--${w.pos} ah-word--${w.kind}`} aria-hidden="true">
                {w.text}
              </span>
            ))}
          </div>
        </div>

        <div className="container">
          <ul className="ah-images" aria-label="A glimpse of my work">
            {ABOUT_HERO_IMAGES.map((img, i) => (
              <li className="ah-img" key={i} style={{ '--w': img.w, '--ratio': img.ratio, '--i': i }}>
                <img src={img.src} alt={img.alt} loading={i < 3 ? 'eager' : 'lazy'} draggable="false" />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
