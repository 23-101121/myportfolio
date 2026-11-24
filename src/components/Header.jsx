import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { setScrollLocked } from '../lib/smoothScroll.js';
import RollText from './nav/RollText.jsx';
import MenuOverlay from './nav/MenuOverlay.jsx';
import CommandPalette from './nav/CommandPalette.jsx';

/* Minimal fixed top bar: logo left; search + MENU right.
   Hides while scrolling down, comes back when scrolling up. */
export default function Header() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuBtnRef = useRef(null);

  /* Close everything when the page changes. */
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setHidden(false);
  }, [pathname]);

  /* Hide on scroll down, show on scroll up (always shown near the top). */
  useEffect(() => {
    let lastY = window.scrollY;
    let raf = 0;
    const update = () => {
      const y = window.scrollY;
      setScrolled(y > 10);
      if (y < 80) setHidden(false);
      else if (y > lastY + 6) setHidden(true);
      else if (y < lastY - 6) setHidden(false);
      lastY = y;
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* Freeze page scrolling while the menu or search is open. */
  const overlayOpen = menuOpen || searchOpen;
  useEffect(() => {
    document.body.classList.toggle('menu-open', overlayOpen);
    setScrollLocked(overlayOpen);
    return () => {
      document.body.classList.remove('menu-open');
      setScrollLocked(false);
    };
  }, [overlayOpen]);

  /* Ctrl+K / ⌘+K opens search from anywhere. */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setMenuOpen(false);
        setSearchOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <header className={`site-header${scrolled ? ' is-scrolled' : ''}${hidden && !overlayOpen ? ' is-hidden' : ''}`}>
        <div className="container site-header__inner">
          <Link className="logo roll-host" to="/" aria-label="Ganna Fares, home">
            <RollText>GF<span className="logo__dot">.</span></RollText>
          </Link>
          <div className="site-header__actions">
            <button
              className="header-search"
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search pages and projects (Ctrl+K)"
              aria-haspopup="dialog"
              title="Search (Ctrl+K)"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <button
              ref={menuBtnRef}
              className="menu-btn roll-host"
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              aria-haspopup="dialog"
            >
              <RollText>Menu</RollText>
              <span className="menu-btn__lines" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <MenuOverlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSearch={() => {
          setMenuOpen(false);
          setSearchOpen(true);
        }}
      />
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
