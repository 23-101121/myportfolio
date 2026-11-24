import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap, useGSAP, MOTION_OK, REDUCED } from '../../lib/gsap.js';
import { leaveTo } from '../../lib/transition.js';
import { setScrollLocked } from '../../lib/smoothScroll.js';
import { HERO_SLOTS } from '../../assets/hero/index.js';
import { projectPath } from '../../lib/utils.js';
import { Arrow, SmartImage } from '../ui.jsx';

const STATS = [
  { value: '30+', label: 'Projects done' },
  { value: '4+', label: 'Years experience' },
  { value: '2x', label: 'Faster delivery' },
];

export default function HomeHero({ projects = [] }) {
  const root = useRef(null);
  const dialogRef = useRef(null);

  /* Intro: heading lines slide up out of a mask, small texts fade up,
     collage images rise in, then every image starts floating on its own rhythm. */
  useGSAP(
    () => {
      const items = gsap.utils.toArray('.collage__item');
      items.forEach((el) => gsap.set(el, { rotation: Number(el.dataset.rot) }));

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap
          .timeline({ defaults: { ease: 'power4.out' } })
          .from('[data-hero-line]', { yPercent: 115, duration: 1.1, stagger: 0.12 })
          .from('[data-hero-in]', { y: 28, opacity: 0, duration: 0.9, stagger: 0.08 }, '-=0.75')
          .from('.collage__item', { opacity: 0, y: 90, scale: 0.88, duration: 1.3, stagger: 0.08, ease: 'expo.out' }, 0.15);

        const r = gsap.utils.random;
        items.forEach((el, i) => {
          const rot = Number(el.dataset.rot);
          gsap.to(el, {
            y: r(-24, -10),
            rotation: rot + r(-2.5, 2.5),
            duration: r(3, 5.5),
            delay: 1.5 + i * 0.1 + r(0, 0.8),
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          });
        });
      });
      mm.add(REDUCED, () => {}); /* final state is already shown */
    },
    { scope: root }
  );

  const openReel = () => {
    dialogRef.current?.showModal();
    setScrollLocked(true);
  };
  const closeReel = () => dialogRef.current?.close();

  return (
    <section className="hero" ref={root}>
      <div className="container hero__grid">
        <div className="hero__copy">
          <div className="hero__topbar" data-hero-in>
            <span className="hero__status"><i aria-hidden="true" />Available for freelance</span>
            <span className="hero__location">Based in Egypt · {new Date().getFullYear()}</span>
          </div>

          <p className="hero__eyebrow" data-hero-in>Hi, I’m Ganna Fares</p>

          <h1 className="hero__title">
            <span className="hero__line"><span data-hero-line>DigitalCreator</span></span>
            <span className="hero__line hero__line--accent"><em className="accent" data-hero-line>&amp; UI/UX</em></span>
            <span className="hero__line"><span data-hero-line>Designer.</span></span>
          </h1>

          <p className="hero__lead" data-hero-in>
            I design and build interfaces, brands and experiments where imagination meets logic.
          </p>

          <div className="hero__actions" data-hero-in>
            <Link className="btn btn--pink" to="/projects">See my work <Arrow /></Link>
            <button className="reel-btn" type="button" onClick={openReel} aria-haspopup="dialog">
              <svg className="reel-btn__ring" viewBox="0 0 100 100" aria-hidden="true">
                <defs>
                  <path id="reel-circle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
                </defs>
                <text>
                  {/* 2πr = 238.8 — textLength makes the words fill the circle exactly */}
                  <textPath href="#reel-circle" textLength="236" lengthAdjust="spacing">SHOW REEL • SHOW REEL • </textPath>
                </text>
              </svg>
              <span className="reel-btn__play" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
              </span>
              <span className="sr-only">Play show reel</span>
            </button>
          </div>

          <dl className="hero__stats" data-hero-in>
            {STATS.map((s) => (
              <div className="hero__stat" key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <HeroCollage projects={projects} />
      </div>

      <dialog
        ref={dialogRef}
        className="reel-dialog"
        aria-label="Show reel"
        data-lenis-prevent
        onClose={() => setScrollLocked(false)}
        onClick={(e) => e.target === e.currentTarget && closeReel()}
      >
        <div className="reel-dialog__box">
          <button className="reel-dialog__close icon-btn" type="button" onClick={closeReel} aria-label="Close show reel">✕</button>
          <div className="reel-dialog__video">
            <span className="reel-dialog__icon" aria-hidden="true">▶</span>
            <p className="display reel-dialog__title">Show reel <em className="accent">coming soon</em></p>
            <p className="reel-dialog__text">A short video of my favourite work is on its way.</p>
          </div>
        </div>
      </dialog>
    </section>
  );
}

/* Six free-floating images. Hover (mouse) or tap (touch) brings one to the
   front, scales it up and shows its title; the rest dim. */
function HeroCollage({ projects }) {
  const [active, setActive] = useState(null);
  const [raised, setRaised] = useState(null); /* stays on top while scaling back down */
  const boxRef = useRef(null);
  const pointerType = useRef('mouse');
  const wasActive = useRef(false);
  const lowerTimer = useRef(0);
  const navigate = useNavigate();

  const activate = (i) => {
    clearTimeout(lowerTimer.current);
    setRaised(null);
    setActive(i);
  };
  const deactivate = (i) => {
    setActive((cur) => (cur === i ? null : cur));
    setRaised(i);
    clearTimeout(lowerTimer.current);
    lowerTimer.current = setTimeout(() => setRaised(null), 500);
  };

  /* Tapping anywhere outside the collage clears the active image. */
  useEffect(() => {
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setActive(null);
    };
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      clearTimeout(lowerTimer.current);
    };
  }, []);

  return (
    <div className={`collage${active != null ? ' has-active' : ''}`} ref={boxRef} data-own-transition>
      {HERO_SLOTS.map((slot, i) => {
        /* Slot i shows project i (by sort_order) — nothing is hard-coded here. */
        const p = projects[i];
        const img = { ...slot, title: p?.title || 'Coming soon', href: p ? projectPath(p) : null };
        const Tag = img.href ? Link : 'button';
        const linkProps = img.href ? { to: img.href } : { type: 'button' };
        return (
          <div
            key={i}
            className={`collage__item${active === i ? ' is-active' : ''}${raised === i ? ' is-raised' : ''}`}
            data-rot={img.rot}
            style={{ left: `${img.x}%`, top: `${img.y}%`, width: `${img.w}%`, zIndex: i + 1 }}
          >
            <Tag
              {...linkProps}
              className="collage__inner"
              aria-label={img.title}
              onPointerDown={(e) => {
                pointerType.current = e.pointerType;
                wasActive.current = active === i;
              }}
              onPointerEnter={(e) => e.pointerType === 'mouse' && activate(i)}
              onPointerLeave={(e) => e.pointerType === 'mouse' && deactivate(i)}
              onFocus={(e) => e.currentTarget.matches(':focus-visible') && activate(i)}
              onBlur={() => deactivate(i)}
              onClick={(e) => {
                e.preventDefault();
                const touch = pointerType.current !== 'mouse' && e.detail !== 0;
                /* Touch: first tap brings it to the front, second tap opens it. */
                if (touch && !wasActive.current) { activate(i); return; }
                if (img.href) leaveTo(navigate, img.href);
              }}
            >
              <SmartImage
                src={p?.cover}
                alt=""
                style={{ aspectRatio: img.ratio }}
                draggable="false"
                fallback={<img src={slot.placeholder} alt="" style={{ aspectRatio: img.ratio }} draggable="false" />}
              />
              <span className="collage__title" aria-hidden="true">{img.title}</span>
            </Tag>
          </div>
        );
      })}
    </div>
  );
}
