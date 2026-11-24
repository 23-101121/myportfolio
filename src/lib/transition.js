/* Fade the page out, then navigate (the new page fades in via CSS). */
export const LEAVE_MS = 280;

export function leaveTo(navigate, to) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    navigate(to);
    return;
  }
  document.documentElement.classList.add('is-leaving');
  setTimeout(() => navigate(to), LEAVE_MS);
}
