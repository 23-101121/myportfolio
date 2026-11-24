/* ==========================================================================
   Work page images.
   TO REPLACE: put your file in this folder (e.g. hero-bg.jpg) and change the
   import below — nothing else needs to change.
   ========================================================================== */
import heroBg from './hero-bg.svg';
import mockup1 from './mockups/mockup-1.svg';
import mockup2 from './mockups/mockup-2.svg';
import mockup3 from './mockups/mockup-3.svg';

export const WORK_HERO_BG = heroBg;

/* The 3 tilted mockups around the heading: top-left, top-right, bottom-centre. */
export const WORK_MOCKUPS = [
  { src: mockup1, alt: 'Project mockup 1', pos: 'tl' },
  { src: mockup2, alt: 'Project mockup 2', pos: 'tr' },
  { src: mockup3, alt: 'Project mockup 3', pos: 'bc' },
];
