import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenis;

export function initScroll() {
  lenis = new Lenis({
    lerp: 0.085,
    wheelMultiplier: 1,
    smoothWheel: true,
    syncTouch: false,
    anchors: false,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  ScrollTrigger.defaults({ markers: false });
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Anchor links → smooth scroll via Lenis
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('menu:close'));
      lenis.scrollTo(target, { offset: 0, duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    });
  });

  return lenis;
}

export function getLenis() {
  return lenis;
}

export { gsap, ScrollTrigger };
