/* ==========================================================================
   Home hero collage — LAYOUT ONLY.
   Each slot shows the next project from Supabase (by sort_order): its cover
   image, title and link. Slots without a project show the placeholder below.

   Position values are % of the collage box:
     x, y   = top-left corner
     w      = width (height follows `ratio`)
     rot    = resting rotation in degrees
     ratio  = width / height of the slot (the image is cropped to fit)
   ========================================================================== */
import placeholder1 from './project-1.svg';
import placeholder2 from './project-2.svg';
import placeholder3 from './project-3.svg';
import placeholder4 from './project-4.svg';
import placeholder5 from './project-5.svg';
import placeholder6 from './project-6.svg';

export const HERO_SLOTS = [
  { x: 17, y: 3, w: 47, rot: -4, ratio: 16 / 10, placeholder: placeholder1 },
  { x: 66, y: 0, w: 20, rot: 6, ratio: 9 / 19, placeholder: placeholder2 },
  { x: 82, y: 33, w: 18, rot: -8, ratio: 900 / 1035, placeholder: placeholder3 },
  { x: 0, y: 41, w: 40, rot: 3, ratio: 16 / 10, placeholder: placeholder4 },
  { x: 40, y: 37, w: 21, rot: -5, ratio: 9 / 19, placeholder: placeholder5 },
  { x: 59, y: 59, w: 36, rot: 4, ratio: 4 / 3, placeholder: placeholder6 },
];
