import { animate, createTimeline, stagger, utils } from 'animejs';

/**
 * Cinematic preloader driven by anime.js.
 * Resolves once the curtains have lifted and the page is ready to animate in.
 */
export function runPreloader() {
  return new Promise((resolve) => {
    const root = document.getElementById('preloader');
    const countEl = document.getElementById('preloaderCount');
    const bar = document.getElementById('preloaderBar');
    const words = root.querySelectorAll('.preloader__word');
    const counter = { value: 0 };

    document.body.classList.add('is-loading');

    const tl = createTimeline({ defaults: { ease: 'outExpo' } });

    tl.add('.pl-rect', { strokeDashoffset: [300, 0], duration: 1200, ease: 'inOutQuart' }, 0)
      .add('.pl-path', { strokeDashoffset: [300, 0], duration: 900, delay: stagger(150), ease: 'inOutQuart' }, 300)
      .add(counter, {
        value: 100,
        duration: 2200,
        ease: 'inOutQuart',
        modifier: utils.round(0),
        onUpdate: () => { countEl.textContent = Math.round(counter.value); },
      }, 200)
      .add(bar, { width: ['0%', '100%'], duration: 2200, ease: 'inOutQuart' }, 200);

    // Cycle the words
    words.forEach((w, i) => {
      const at = 250 + i * 520;
      tl.add(w, { translateY: ['110%', '0%'], opacity: [0, 1], duration: 520, ease: 'outExpo' }, at);
      if (i < words.length - 1) {
        tl.add(w, { translateY: ['0%', '-110%'], opacity: [1, 0], duration: 420, ease: 'inExpo' }, at + 460);
      }
    });

    tl.add('.preloader__inner', { opacity: [1, 0], translateY: [0, -30], duration: 500, ease: 'inExpo' }, 2500)
      .add('.preloader__curtain--2', { translateY: ['100%', '0%'], duration: 700, ease: 'inOutExpo' }, 2600)
      .add('.preloader__curtain--1', { translateY: ['0%', '-100%'], duration: 800, ease: 'inOutExpo' }, 2850)
      .add('.preloader__curtain--2', { translateY: ['0%', '-100%'], duration: 800, ease: 'inOutExpo' }, 3050);

    tl.then(() => {
      root.style.display = 'none';
      document.body.classList.remove('is-loading');
      resolve();
    });

    // Trigger the page entrance slightly before curtains finish for overlap
    setTimeout(() => document.dispatchEvent(new CustomEvent('preloader:reveal')), 3050);
  });
}

// Keep `animate` import for tree-shaking safety on some setups
export { animate };
