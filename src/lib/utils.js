/* Small helpers shared across pages. */

export const pad = (n) => String(n).padStart(2, '0');

/* Slugs are lowercase letters, numbers and dashes. Anything else = not found. */
export const isValidSlug = (slug) =>
  typeof slug === 'string' && slug.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);

/* Only allow http(s) links from the database (blocks javascript: URLs). */
export function safeUrl(value) {
  try {
    const u = new URL(String(value || '').trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
  } catch {
    return '';
  }
}

export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return isNaN(d) ? '' : d.toLocaleDateString('en', { month: 'short', year: 'numeric' });
}

export function year(value) {
  const d = value ? new Date(value) : null;
  return d && !isNaN(d) ? d.getFullYear() : '';
}

export const projectPath = (p) => `/project/${encodeURIComponent(p.slug)}`;
export const caseStudyPath = (p) => `/case-study/${encodeURIComponent(p.caseStudySlug || p.slug)}`;

/* Turn any text into a URL-safe slug: "Dashboards & Systems" → "dashboards-systems". */
export const slugify = (text) =>
  String(text || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/* Hue (0–360) of a #RRGGBB colour — used to tint placeholder artwork. */
export function hexToHue(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (!d) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round((h * 60 + 360) % 360);
}

/* Placeholder artwork tint: a stable hue picked from the seed text. */
const PALETTE = [145, 22, 188, 335, 265, 48];
export function hueFor(seed) {
  const s = String(seed || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
/* A project's tint: its accent_color if set, otherwise a stable hue from its slug. */
export const projectHue = (p) => hexToHue(p?.accent) ?? hueFor(p?.slug);

/* Category filter list built from the projects themselves (projects.category). */
export function projectCategories(projects) {
  const seen = new Map();
  projects.forEach((p) => {
    if (p.category && !seen.has(slugify(p.category))) seen.set(slugify(p.category), { slug: slugify(p.category), name: p.category });
  });
  return [...seen.values()];
}

/* Search (title + tags + tools + category) and category filter, used together. */
export function filterProjects(list, query, cat) {
  const words = String(query || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
  return list.filter((p) => {
    if (cat && cat !== 'all' && slugify(p.category) !== cat) return false;
    if (!words.length) return true;
    const hay = [p.title, p.category, p.type, ...(p.tags || []), ...(p.tools || [])].join(' ').toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
