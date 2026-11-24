/* ==========================================================================
   About page images.
   TO REPLACE: drop your file into the folder and change the import below.
   ========================================================================== */

/* Hero row — keep the order SMALLEST → LARGEST.
   `w` = width as % of the row, `ratio` = width / height of the image. */
import hero1 from './hero/about-1.svg';
import hero2 from './hero/about-2.svg';
import hero3 from './hero/about-3.svg';
import hero4 from './hero/about-4.svg';
import hero5 from './hero/about-5.svg';
import hero6 from './hero/about-6.svg';

export const ABOUT_HERO_IMAGES = [
  { src: hero1, alt: 'Placeholder 1', w: 8, ratio: 600 / 800 },
  { src: hero2, alt: 'Placeholder 2', w: 12, ratio: 1 },
  { src: hero3, alt: 'Placeholder 3', w: 15, ratio: 900 / 800 },
  { src: hero4, alt: 'Placeholder 4', w: 18, ratio: 1000 / 800 },
  { src: hero5, alt: 'Placeholder 5', w: 21, ratio: 1100 / 800 },
  { src: hero6, alt: 'Portrait placeholder', w: 17, ratio: 800 / 1000 },
];

/* Image trail photos ("A little about me") — shown in this order, then loop. */
import t1 from './trail/trail-1.svg';
import t2 from './trail/trail-2.svg';
import t3 from './trail/trail-3.svg';
import t4 from './trail/trail-4.svg';
import t5 from './trail/trail-5.svg';
import t6 from './trail/trail-6.svg';
import t7 from './trail/trail-7.svg';
import t8 from './trail/trail-8.svg';

export const TRAIL_PHOTOS = [t1, t2, t3, t4, t5, t6, t7, t8];
