import { gsap } from 'gsap';
import { getLenis } from './scroll.js';
import { setNavDark } from './animations.js';

export function initNav() {
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const menu = document.getElementById('menu');
  const menuBg = menu.querySelector('.menu__bg');
  const menuTexts = menu.querySelectorAll('.menu__text');
  const menuMeta = menu.querySelector('.menu__meta');
  let lastY = 0;
  let open = false;

  // Show / hide on scroll direction + scrolled state
  const lenis = getLenis();
  lenis.on('scroll', ({ scroll, direction }) => {
    nav.classList.toggle('is-scrolled', scroll > 40);
    if (open) return;
    if (scroll > 300 && direction === 1 && scroll - lastY > 4) nav.classList.add('is-hidden');
    else if (direction === -1) nav.classList.remove('is-hidden');
    lastY = scroll;
  });

  const openMenu = () => {
    open = true;
    burger.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    nav.classList.remove('is-hidden');
    setNavDark('menu', true);
    lenis.stop();
    gsap.timeline()
      .to(menuBg, { clipPath: 'circle(150% at calc(100% - 3rem) 2.5rem)', duration: 1, ease: 'expo.inOut' })
      .to(menuTexts, { y: 0, duration: 0.9, stagger: 0.07, ease: 'expo.out' }, '-=0.45')
      .to(menuMeta, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.5');
  };

  const closeMenu = () => {
    if (!open) return;
    open = false;
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    gsap.to(burger, { x: 0, y: 0, duration: 0.4 });
    gsap.timeline({
      onComplete: () => {
        menu.classList.remove('is-open');
        menu.setAttribute('aria-hidden', 'true');
        setNavDark('menu', false);
        lenis.start();
      },
    })
      .to(menuTexts, { y: '110%', duration: 0.5, stagger: 0.04, ease: 'expo.in' })
      .to(menuMeta, { opacity: 0, duration: 0.3 }, 0)
      .to(menuBg, { clipPath: 'circle(0% at calc(100% - 3rem) 2.5rem)', duration: 0.8, ease: 'expo.inOut' }, '-=0.2');
  };

  burger.addEventListener('click', () => (open ? closeMenu() : openMenu()));
  document.addEventListener('menu:close', () => {
    // Allow lenis to resume before scrolling
    if (open) { lenis.start(); closeMenu(); }
  });
  window.addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());

  document.getElementById('toTop').addEventListener('click', () => {
    lenis.scrollTo(0, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
  });

  document.getElementById('year').textContent = new Date().getFullYear();
}
