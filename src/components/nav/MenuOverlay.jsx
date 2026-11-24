import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { gsap, useGSAP, REDUCED } from '../../lib/gsap.js';
import { NAV } from '../../lib/nav.js';
import { pad } from '../../lib/utils.js';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';
import { Art } from '../ui.jsx';
import RollText from './RollText.jsx';

/* Full-screen menu. GSAP: panel slides down, links rise in one by one.
   Clicking a link navigates while the overlay still covers the screen, then
   the overlay slides away to reveal the new page (Header closes it on route change). */
export default function MenuOverlay({ open, onClose, onSearch }) {
  const root = useRef(null);
  const closeRef = useRef(null);
  const previewRef = useRef(null);
  const { pathname } = useLocation();
  const [shown, setShown] = useState(false); /* stays true until the close animation ends */
  const [hovered, setHovered] = useState(null);

  /* Cursor preview only for real mice (not touch screens). */
  const canFollow = useMemo(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches, []);

  useEffect(() => {
    if (open) setShown(true);
    else setHovered(null);
  }, [open]);

  /* Hidden overlay must not be reachable by keyboard or screen readers. */
  useEffect(() => {
    const el = root.current;
    if (shown) el.removeAttribute('inert');
    else el.setAttribute('inert', '');
  }, [shown]);

  useFocusTrap(root, open && shown, closeRef);

  /* Open / close animation. */
  useGSAP(
    () => {
      const el = root.current;
      if (!shown) {
        gsap.set(el, { yPercent: -100, y: 0 });
        return;
      }
      const reduce = window.matchMedia(REDUCED).matches;
      if (open) {
        if (reduce) {
          gsap.set(el, { yPercent: 0 });
          gsap.set('.menu__link, .menu__fade', { yPercent: 0, opacity: 1, y: 0 });
          return;
        }
        gsap
          .timeline()
          .fromTo(el, { yPercent: -100 }, { yPercent: 0, duration: 0.8, ease: 'expo.inOut' })
          .fromTo('.menu__link', { yPercent: 115 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 }, '-=0.35')
          .fromTo('.menu__fade', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 }, '-=0.7');
      } else {
        const done = () => setShown(false);
        if (reduce) {
          gsap.set(el, { yPercent: -100 });
          done();
          return;
        }
        gsap
          .timeline({ onComplete: done })
          .to('.menu__fade', { opacity: 0, duration: 0.2 })
          .to('.menu__link', { yPercent: -115, duration: 0.35, ease: 'power3.in', stagger: 0.025 }, 0)
          .to(el, { yPercent: -100, duration: 0.65, ease: 'expo.inOut' }, 0.15);
      }
    },
    { scope: root, dependencies: [open, shown] }
  );

  /* Preview image follows the cursor with a little lag. */
  useGSAP(
    () => {
      if (!canFollow) return undefined;
      const reduce = window.matchMedia(REDUCED).matches;
      const preview = previewRef.current;
      /* Centred on the cursor, layered BEHIND the menu text so words stay readable. */
      gsap.set(preview, { xPercent: -50, yPercent: -50 });
      const xTo = gsap.quickTo(preview, 'x', { duration: reduce ? 0 : 0.55, ease: 'power3' });
      const yTo = gsap.quickTo(preview, 'y', { duration: reduce ? 0 : 0.55, ease: 'power3' });
      const move = (e) => { xTo(e.clientX); yTo(e.clientY); };
      const el = root.current;
      el.addEventListener('pointermove', move);
      return () => el.removeEventListener('pointermove', move);
    },
    { scope: root, dependencies: [canFollow] }
  );

  return (
    <div
      ref={root}
      id="site-menu"
      className={`menu${shown ? ' is-shown' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      data-own-transition
      data-lenis-prevent
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      onClick={(e) => {
        /* A link to the page you're already on just closes the menu. */
        const a = e.target.closest('a[href]');
        if (a && new URL(a.href).pathname === pathname) onClose();
      }}
    >
      <div className="container menu__top">
        <Link className="logo roll-host" to="/" aria-label="Ganna Fares, home">
          <RollText>GF<span className="logo__dot">.</span></RollText>
        </Link>
        <button ref={closeRef} className="menu-btn roll-host" type="button" onClick={onClose} aria-label="Close menu">
          <RollText>Close</RollText>
          <span className="menu-btn__x" aria-hidden="true" />
        </button>
      </div>

      <div className="container menu__body">
        <nav aria-label="Main">
          <ul className="menu__list" onPointerLeave={() => setHovered(null)}>
            {NAV.map((item, i) => {
              const current = item.match(pathname);
              return (
                <li className="menu__item" key={item.to}>
                  <span className="menu__mask">
                    <Link
                      className={`menu__link roll-host${current ? ' is-current' : ''}`}
                      to={item.to}
                      aria-current={current ? 'page' : undefined}
                      onPointerEnter={() => setHovered(i)}
                      onFocus={() => setHovered(i)}
                    >
                      <span className="menu__num" aria-hidden="true">{pad(i + 1)}</span>
                      <RollText alt={<span className="menu__serif">{item.label}</span>}>{item.label}</RollText>
                    </Link>
                  </span>
                </li>
              );
            })}
          </ul>
        </nav>

        <aside className="menu__aside">
          <div className="menu__fade">
            <p className="menu__label">Looking for something?</p>
            <button className="menu__search roll-host" type="button" onClick={onSearch}>
              <RollText>Search pages &amp; projects</RollText>
              <kbd>Ctrl K</kbd>
            </button>
          </div>
          <div className="menu__fade">
            <p className="menu__label">Status</p>
            <p className="menu__status"><i aria-hidden="true" />Available for freelance</p>
          </div>
          <div className="menu__fade">
            <p className="menu__label">Say hello</p>
            <Link className="menu__cta roll-host" to="/contact"><RollText>Start a project →</RollText></Link>
          </div>
        </aside>
      </div>

      <div className="container menu__foot menu__fade">
        <span>© {new Date().getFullYear()} Ganna Fares</span>
        <span className="menu__hint">Press <kbd>Esc</kbd> to close</span>
      </div>

      {canFollow && (
        <div ref={previewRef} className={`menu-preview${hovered != null ? ' is-visible' : ''}`} aria-hidden="true">
          {NAV.map((item, i) => (
            <div className={`menu-preview__layer${hovered === i ? ' is-active' : ''}`} key={item.to}>
              {item.preview ? <img src={item.preview} alt="" /> : <Art hue={item.hue} label={item.label} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
