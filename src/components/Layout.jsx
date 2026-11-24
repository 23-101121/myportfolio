import { useEffect, useLayoutEffect } from 'react';
import { Outlet, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import { scrollToTop, useSmoothScroll } from '../lib/smoothScroll.js';
import { ScrollTrigger } from '../lib/gsap.js';

import { leaveTo } from '../lib/transition.js';

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Every page renders inside this: shared header/footer + site-wide motion. */
export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const navType = useNavigationType();
  useSmoothScroll();

  /* ---- Smooth page transitions ----
     Catch clicks on internal links before React Router does, fade the page out,
     then navigate. The new <main> (keyed by path) fades back in via CSS. */
  useEffect(() => {
    function onClick(e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest('a[href]');
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      if (a.closest('[data-own-transition]')) return; /* component handles it itself */
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const samePath = url.pathname === window.location.pathname;
      if (samePath && url.hash) return; /* in-page anchor: let the browser scroll */
      if (samePath && url.search === window.location.search) { e.preventDefault(); return; }
      e.preventDefault();
      const to = url.pathname + url.search + url.hash;
      if (samePath) { navigate(to); return; }
      leaveTo(navigate, to);
    }
    document.addEventListener('click', onClick, true); /* capture = runs before <Link> */
    return () => document.removeEventListener('click', onClick, true);
  }, [navigate]);

  /* After navigating: undo the fade-out and scroll to the top (or to #hash). */
  useLayoutEffect(() => {
    document.documentElement.classList.remove('is-leaving');
    if (location.hash) return; /* the page scrolls to its anchor once content exists */
    if (navType !== 'POP') scrollToTop();
  }, [location.pathname, location.search, location.hash, navType]);

  /* New page = new layout: let ScrollTrigger re-measure once it has painted. */
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [location.pathname]);

  /* ---- Scroll reveal ----
     Watches the page for [data-reveal] elements (including ones that appear
     later when Supabase data arrives) and reveals them as they scroll into view. */
  useEffect(() => {
    const visible = (el) => el.classList.add('is-visible');
    const io =
      'IntersectionObserver' in window && !reduceMotion()
        ? new IntersectionObserver(
            (entries) =>
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  visible(entry.target);
                  io.unobserve(entry.target);
                }
              }),
            { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
          )
        : null;

    function scan() {
      document.querySelectorAll('[data-stagger]').forEach((parent) => {
        [...parent.children].forEach((child, i) => {
          if (!child.hasAttribute('data-reveal')) child.setAttribute('data-reveal', '');
          child.style.setProperty('--i', i % 6);
        });
      });
      document.querySelectorAll('[data-reveal]:not(.is-visible)').forEach((el) => (io ? io.observe(el) : visible(el)));
    }

    let raf = 0;
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(scan);
    });
    mo.observe(document.getElementById('root'), { childList: true, subtree: true });
    scan();
    return () => {
      mo.disconnect();
      io?.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main" key={location.pathname}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
