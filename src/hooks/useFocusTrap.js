import { useEffect } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])';

/* While `active`, Tab / Shift+Tab cycle inside `ref` only. Focus moves in
   on open (to `initialRef` or the first focusable) and back out on close. */
export function useFocusTrap(ref, active, initialRef) {
  useEffect(() => {
    if (!active || !ref.current) return undefined;
    const container = ref.current;
    const previous = document.activeElement;
    const items = () => [...container.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null || n === document.activeElement);

    const first = initialRef?.current || items()[0];
    requestAnimationFrame(() => first?.focus({ preventScroll: true }));

    function onKey(e) {
      if (e.key !== 'Tab') return;
      const list = items();
      if (!list.length) { e.preventDefault(); return; }
      const head = list[0];
      const tail = list[list.length - 1];
      if (!container.contains(document.activeElement)) { e.preventDefault(); head.focus(); return; }
      if (e.shiftKey && document.activeElement === head) { e.preventDefault(); tail.focus(); }
      else if (!e.shiftKey && document.activeElement === tail) { e.preventDefault(); head.focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [active, ref, initialRef]);
}
