import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getProjects } from '../../lib/supabase.js';
import { NAV, EXTRA_PAGES } from '../../lib/nav.js';
import { projectPath } from '../../lib/utils.js';
import { leaveTo } from '../../lib/transition.js';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';

const PAGES = [...NAV, ...EXTRA_PAGES].map((p) => ({
  id: `page-${p.to}`,
  group: 'Pages',
  title: p.label,
  to: p.to,
  meta: p.to,
  haystack: `${p.label} ${p.keywords || ''}`.toLowerCase(),
}));

function matches(haystack, words) {
  return words.every((w) => haystack.includes(w));
}

/* Search palette: pages + Supabase projects (title, tags, tools).
   ↑ / ↓ move, Enter opens, Esc closes. Opened by the search icon or Ctrl/⌘+K. */
export default function CommandPalette({ open, onClose }) {
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [projects, setProjects] = useState(null);
  const [failed, setFailed] = useState(false);

  useFocusTrap(panelRef, open, inputRef);

  /* Reset on open and load projects the first time. */
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    if (!projects) {
      setFailed(false);
      getProjects().then(setProjects).catch(() => setFailed(true));
    }
  }, [open, projects]);

  const results = useMemo(() => {
    const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const pages = PAGES.filter((p) => matches(p.haystack, words));
    const projs = (projects || [])
      .filter((p) => matches([p.title, p.category, p.type, ...p.tags, ...p.tools].join(' ').toLowerCase(), words))
      .map((p) => ({
        id: `project-${p.slug}`,
        group: 'Projects',
        title: p.title,
        to: projectPath(p),
        meta: p.category || p.type || 'Project',
      }));
    return [...pages, ...projs];
  }, [query, projects]);

  useEffect(() => setActive(0), [query]);

  /* Keep the highlighted option visible while using the arrow keys. */
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const go = (item) => {
    if (!item) return;
    onClose();
    if (item.to !== pathname) leaveTo(navigate, item.to);
  };

  function onKeyDown(e) {
    const n = results.length;
    if (e.key === 'ArrowDown') { e.preventDefault(); if (n) setActive((a) => (a + 1) % n); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (n) setActive((a) => (a - 1 + n) % n); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(Math.max(0, n - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  }

  const activeId = results[active] ? `pal-${results[active].id}` : undefined;
  let lastGroup = null;

  return (
    <div className="palette" onMouseDown={(e) => e.target === e.currentTarget && onClose()} data-lenis-prevent>
      <div ref={panelRef} className="palette__panel" role="dialog" aria-modal="true" aria-label="Search pages and projects">
        <div className="palette__search">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            className="palette__input"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            aria-label="Search pages and projects"
            placeholder="Search pages and projects…"
            autoComplete="off"
            spellCheck="false"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button className="palette__esc" type="button" onClick={onClose} aria-label="Close search"><kbd>Esc</kbd></button>
        </div>

        <ul className="palette__list" id="palette-list" role="listbox" aria-label="Results" ref={listRef}>
          {results.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return [
              header && (
                <li className="palette__group" role="presentation" key={`g-${header}`}>{header}</li>
              ),
              <li
                key={item.id}
                id={`pal-${item.id}`}
                data-index={i}
                className="palette__option"
                role="option"
                aria-selected={i === active}
                onMouseMove={() => active !== i && setActive(i)}
                onClick={() => go(item)}
              >
                <span className="palette__icon" aria-hidden="true">{item.group === 'Pages' ? '↗' : '◆'}</span>
                <span className="palette__title">{item.title}</span>
                <span className="palette__meta">{item.meta}</span>
                <span className="palette__enter" aria-hidden="true">↵</span>
              </li>,
            ];
          })}
          {!results.length && (
            <li className="palette__empty" role="presentation">
              {query ? <>No pages or projects match “{query}”.</> : 'Start typing to search.'}
            </li>
          )}
          {!projects && !failed && <li className="palette__status" role="presentation">Loading projects…</li>}
          {failed && <li className="palette__status" role="presentation">Couldn’t load projects. Pages are still searchable.</li>}
        </ul>

        <div className="palette__foot" aria-hidden="true">
          <span><kbd>↑</kbd> <kbd>↓</kbd> to move</span>
          <span><kbd>Enter</kbd> to open</span>
          <span><kbd>Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
