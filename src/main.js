import { initScroll, ScrollTrigger } from './js/scroll.js';
import { runPreloader } from './js/preloader.js';
import { initCursor } from './js/cursor.js';
import { initNav } from './js/nav.js';
import { initHeroScene } from './js/hero-scene.js';
import { initExplodeScene } from './js/explode-scene.js';
import { heroEntrance, initAnimations } from './js/animations.js';
import { initTilt } from './js/tilt.js';
import { initSlider3D } from './js/slider3d.js';
import { initFaq } from './js/faq.js';
import { initForm } from './js/form.js';

async function boot() {
  // Start at the top on reload so pinned sections initialise correctly
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  const lenis = initScroll();
  lenis.stop();

  initCursor();
  initNav();

  const heroScene = initHeroScene();
  const explodeScene = initExplodeScene();

  initTilt();
  initSlider3D();
  initFaq();
  initForm();

  // Wait for fonts before splitting text so line breaks are accurate
  await document.fonts.ready;

  const loader = runPreloader();
  document.addEventListener('preloader:reveal', () => {
    heroEntrance(heroScene);
    initAnimations({ explodeScene });
    ScrollTrigger.refresh();
    lenis.start();
  }, { once: true });

  await loader;

  // Refresh once images have settled so pin distances are exact
  window.addEventListener('load', () => ScrollTrigger.refresh());
  setTimeout(() => ScrollTrigger.refresh(), 1200);

  if (import.meta.env.DEV) { window.__lenis = lenis; window.__ST = ScrollTrigger; }
}

boot();
