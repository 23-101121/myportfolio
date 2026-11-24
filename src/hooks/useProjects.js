/* ==========================================================================
   The ONE place pages get project data from.
   - useProjects()      → all published projects, ordered by sort_order
   - useProject(slug)   → one project + its previous / next neighbours
   Both share a single cached request (see getProjects in lib/supabase.js).
   ========================================================================== */
import { useMemo } from 'react';
import { getProjectBySlug, getProjects } from '../lib/supabase.js';
import { isValidSlug, projectCategories } from '../lib/utils.js';
import { useAsync } from './useAsync.js';

export function useProjects() {
  const { data, error, loading, retry } = useAsync(() => getProjects());
  const projects = data || [];
  const categories = useMemo(() => projectCategories(projects), [projects]);
  return { projects, categories, error, loading, retry };
}

export function useProject(slug) {
  const valid = isValidSlug(slug);
  const { data, error, loading, retry } = useAsync(async () => {
    if (!valid) return null;
    const [project, all] = await Promise.all([getProjectBySlug(slug), getProjects().catch(() => [])]);
    if (!project) return null;
    const i = all.findIndex((p) => p.slug === slug);
    const many = all.length > 1 && i !== -1;
    return {
      project,
      prev: many ? all[(i - 1 + all.length) % all.length] : null,
      next: many ? all[(i + 1) % all.length] : null,
    };
  }, [slug]);
  return {
    project: data?.project || null,
    prev: data?.prev || null,
    next: data?.next || null,
    notFound: !loading && !error && !data,
    error,
    loading,
    retry,
  };
}
