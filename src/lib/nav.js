/* Site navigation — used by the menu overlay, search palette and footer.
   `hue` tints the placeholder preview that follows the cursor in the menu.
   TO USE A REAL PREVIEW IMAGE: add `preview: someImport` to a page. */
export const NAV = [
  { label: 'Home', to: '/', hue: 145, keywords: 'start landing', match: (p) => p === '/' },
  { label: 'About', to: '/about', hue: 335, keywords: 'me bio story toolkit', match: (p) => p.startsWith('/about') },
  { label: 'Projects', to: '/projects', hue: 188, keywords: 'work portfolio case studies', match: (p) => /^\/(projects|project|case-study)(\/|$)/.test(p) },
  { label: 'Services', to: '/services', hue: 22, keywords: 'ui ux branding web motion hire', match: (p) => p.startsWith('/services') },
  { label: 'Resume', to: '/resume', hue: 265, keywords: 'cv experience education', match: (p) => p.startsWith('/resume') },
  { label: 'Contact', to: '/contact', hue: 48, keywords: 'email message hire talk', match: (p) => p.startsWith('/contact') },
];

/* Extra pages that only appear in search. */
export const EXTRA_PAGES = [
  { label: 'Projects list', to: '/projects/list', keywords: 'search filter all projects' },
];
