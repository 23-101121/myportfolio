/* ==========================================================================
   supabase.js — the only file that talks to the database.

   Uses the PUBLIC publishable/anon key from .env. That key is safe in the
   browser: Row Level Security on every table decides what it can do.
   Never put a secret / service_role key in frontend code.
   ========================================================================== */
import { createClient } from '@supabase/supabase-js';
import { LOCAL_PROJECTS } from '../data/localProjects.js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.');
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TIMEOUT_MS = 15000;
const BUCKET = 'projects';

/* Reject if a request hangs, so the UI never spins forever. */
async function run(query) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS);
  });
  try {
    const { data, error } = await Promise.race([query, timeout]);
    if (error) throw error;
    return data;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------------------------------------------------------------------
   Images: a path like "skoda-car-dashboard/cover.jpg" → public URL in the
   "projects" Storage bucket. Full URLs (https://…) are returned unchanged.
   --------------------------------------------------------------------------- */
export function getImageUrl(path) {
  if (!path) return null;
  const p = String(path).trim();
  if (!p) return null;
  if (/^(https?:|data:|blob:)/i.test(p)) return p;
  const clean = p.replace(/^\/+/, '').replace(new RegExp(`^${BUCKET}/`), '');
  return supabase.storage.from(BUCKET).getPublicUrl(clean).data.publicUrl;
}

const asArray = (v) => (Array.isArray(v) ? v.filter((x) => x != null && x !== '') : []);
const yearOf = (d) => {
  const date = d ? new Date(d) : null;
  return date && !isNaN(date) ? date.getFullYear() : null;
};

/* ---------------------------------------------------------------------------
   One clean project shape used by EVERY page and component.
   New template columns come first; older columns (summary, thumbnail_url,
   status, …) are used as fallbacks so nothing breaks before the migration.
   --------------------------------------------------------------------------- */
export function normalizeProject(row) {
  const category = row.category || row.project_type || null;
  const tags = asArray(row.tags).length ? asArray(row.tags) : [row.type || row.project_type].filter(Boolean);
  const gallery = asArray(row.gallery)
    .map((g) => (typeof g === 'string' ? { image: g } : g))
    .filter((g) => g && (g.image || g.caption)) /* no image yet → placeholder art */
    .map((g) => ({
      src: getImageUrl(g.image),
      caption: g.caption || null,
      size: ['full', 'half', 'third'].includes(g.size) ? g.size : 'half',
    }));
  const stats = asArray(row.stats).filter((s) => s && (s.value || s.label));

  return {
    id: row.proj_id ?? row.id ?? null,
    slug: row.slug,
    title: row.title || 'Untitled project',
    titleAccent: row.title_accent_word || null,
    tags,
    year: row.year || yearOf(row.project_date),
    role: row.role || null,
    timeline: row.timeline || row.duration || null,
    tools: asArray(row.tools),
    type: row.type || row.project_type || null,
    category,
    accent: /^#[0-9a-f]{6}$/i.test(row.accent_color || '') ? row.accent_color : null,
    cover: getImageUrl(row.cover_image || row.thumbnail_url),
    heroImage: getImageUrl(row.hero_image),
    heroVideo: getImageUrl(row.hero_video),
    overview: row.overview || row.description || null,
    statement: row.statement || row.summary || null,
    challenge: row.challenge || null,
    solution: row.solution || null,
    result: row.result || row.outcomes || null,
    stats,
    gallery,
    processWords: asArray(row.process_words),
    caseStudySlug: row.case_study_slug || null,
    sortOrder: Number.isFinite(row.sort_order) ? row.sort_order : (row.featured_order ?? 999),
    published: typeof row.published === 'boolean' ? row.published : row.status ? row.status === 'published' : true,
  };
}

const bySortOrder = (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title);

/* ---------------------------------------------------------------------------
   Projects. RLS only returns published rows; we also filter here as a
   safety net. Cached for the session so every component shares one request.
   --------------------------------------------------------------------------- */
let projectsPromise = null;

/* True once supabase/projects_template.sql has been run (rows have the new columns). */
const hasTemplateColumns = (row) => Object.prototype.hasOwnProperty.call(row, 'published');

/* Rows from Supabase — or, until the migration is run, the temporary rows in
   src/data/localProjects.js (keeping each Supabase id so case studies still link).
   Images are left empty in local mode: the "projects" bucket doesn't exist yet. */
async function loadProjectRows() {
  const rows = await run(supabase.from('projects').select('*'));
  if (rows.some(hasTemplateColumns)) return rows;
  console.info('[projects] Using src/data/localProjects.js until supabase/projects_template.sql is run.');
  const ids = new Map(rows.map((r) => [r.slug, r.proj_id]));
  return LOCAL_PROJECTS.map((r) => ({
    ...r,
    proj_id: ids.get(r.slug) ?? null,
    cover_image: null,
    hero_image: null,
    gallery: (r.gallery || []).map((g) => ({ ...g, image: null })),
  }));
}

export function getProjects() {
  if (!projectsPromise) {
    projectsPromise = loadProjectRows()
      .then((rows) => rows.map(normalizeProject).filter((p) => p.published && p.slug).sort(bySortOrder))
      .catch((err) => {
        projectsPromise = null;
        throw err;
      });
  }
  return projectsPromise;
}

/* One published project by slug, or null (shares the cached request above). */
export async function getProjectBySlug(slug) {
  const projects = await getProjects();
  return projects.find((p) => p.slug === slug) || null;
}

/* Case study for /case-study/:slug — matches a project's case_study_slug
   (or its own slug), then loads the case_studies row linked to it. */
export async function getCaseStudyBySlug(slug) {
  const projects = await getProjects();
  const project = projects.find((p) => p.caseStudySlug === slug) || projects.find((p) => p.slug === slug);
  if (!project) return null;
  let caseStudy = null;
  if (project.id != null) {
    caseStudy = await run(supabase.from('case_studies').select('*').eq('proj_id', project.id).maybeSingle()).catch(() => null);
  }
  if (caseStudy && Array.isArray(caseStudy.sections)) {
    caseStudy.sections = [...caseStudy.sections].sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  return { project, caseStudy };
}

export function getTools() {
  return run(supabase.from('tools').select('tool_id, name, tool_type, icon_url').order('tool_id'));
}

/* Insert-only: RLS lets the public add a row but never read one back,
   so we deliberately do NOT chain .select() after .insert(). */
export async function sendContactMessage({ name, email, subject, message }) {
  await run(supabase.from('contact_messages').insert({ name, email, subject, message }));
  return true;
}
