import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { animate as anime, utils } from 'animejs';
import { animate as motionAnimate, inView, stagger as motionStagger } from 'motion';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => window.innerWidth < 980;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function counter(el) {
  if (el.dataset.done) return;
  el.dataset.done = '1';
  const end = parseFloat(el.dataset.count);
  const obj = { v: 0 };
  anime(obj, {
    v: end,
    duration: 1800,
    ease: 'outExpo',
    modifier: utils.round(0),
    onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString(); },
  });
}

function marquee(track, speed = 60, dir = -1) {
  // duplicate content until wide enough
  const original = track.innerHTML;
  while (track.scrollWidth < window.innerWidth * 2.2) track.insertAdjacentHTML('beforeend', original);
  const width = track.scrollWidth / 2;
  const tween = gsap.to(track, {
    x: dir * width,
    duration: width / speed,
    ease: 'none',
    repeat: -1,
    modifiers: { x: gsap.utils.unitize((x) => parseFloat(x) % width) },
  });
  // Speed up briefly on scroll
  ScrollTrigger.create({
    onUpdate: (self) => {
      const v = Math.abs(self.getVelocity()) / 800;
      gsap.to(tween, { timeScale: 1 + Math.min(v, 3), duration: 0.2, overwrite: true, onComplete: () => gsap.to(tween, { timeScale: 1, duration: 1 }) });
    },
  });
}

/* ------------------------------------------------------------------ */
/* HERO ENTRANCE                                                       */
/* ------------------------------------------------------------------ */
export function heroEntrance(heroScene) {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to('.hero__eyebrow', { opacity: 1, y: 0, duration: 1 }, 0)
    .to('.hero__word', { y: 0, rotate: 0, duration: 1.5, stagger: 0.07 }, 0.1)
    .to('.hero__lede', { opacity: 1, y: 0, duration: 1.1 }, 0.7)
    .to('.hero__actions', { opacity: 1, y: 0, duration: 1 }, 0.85)
    .to('.hero__stats', { opacity: 1, duration: 1, onStart: () => document.querySelectorAll('.hero__stat-num[data-count]').forEach(counter) }, 1)
    .to('.hero__card', { opacity: 1, y: 0, duration: 1.4, stagger: 0.15 }, 0.9)
    .to('.hero__scroll', { opacity: 1, duration: 1 }, 1.4);

  gsap.set('.hero__eyebrow, .hero__lede, .hero__actions', { y: 30 });
  gsap.set('.hero__card', { y: 40 });
  document.getElementById('nav').classList.add('is-ready');

  // Scroll parallax on hero
  ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      heroScene && heroScene.setScroll(p);
      gsap.set('.hero__inner', { y: p * 160, opacity: 1 - p * 1.1 });
      document.querySelectorAll('.parallax-el').forEach((el) => {
        const d = parseFloat(el.dataset.depth) || 0.05;
        gsap.set(el, { y: p * window.innerHeight * d * 6 });
      });
    },
  });

  // Floating cards idle motion
  if (!reduced) {
    gsap.to('.hero__card--1', { y: '+=14', rotate: 1.5, duration: 3.4, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 2.5 });
    gsap.to('.hero__card--2', { y: '-=12', rotate: -1.5, duration: 3.8, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 2.8 });
  }
}

/* ------------------------------------------------------------------ */
/* GLOBAL SCROLL ANIMATIONS                                            */
/* ------------------------------------------------------------------ */
export function initAnimations({ explodeScene }) {
  /* Marquees */
  marquee(document.getElementById('marqueeTrack'), 70, -1);
  marquee(document.getElementById('footerMarquee'), 90, -1);

  /* Split line headlines (generic, excludes pinned zoom + contact handled separately) */
  document.querySelectorAll('.split-lines:not(.zoom__title)').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'line',
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 110,
          rotate: 2,
          transformOrigin: 'left top',
          duration: 1.3,
          stagger: 0.09,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      },
    });
  });

  /* Reveal-up batch */
  ScrollTrigger.batch('.reveal-up', {
    start: 'top 90%',
    once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out', overwrite: true }),
  });

  /* FAQ rows */
  gsap.from('.faq__item', {
    opacity: 0, y: 30, duration: 1.1, stagger: 0.09, ease: 'expo.out',
    scrollTrigger: { trigger: '.faq__list', start: 'top 85%', once: true },
  });

  /* Counters */
  document.querySelectorAll('[data-count]:not(.hero__stat-num)').forEach((el) => {
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => counter(el) });
  });

  initZoom();
  initServices();
  initProcess();
  initExplode(explodeScene);
  initWho();
  initStack();
  initColumns();
  initContact();
  initFooter();
  initNavTheme(); // after pins so positions include pin spacing
}

/* ------------------------------------------------------------------ */
/* NAV THEME — flips to light-on-dark while over dark sections         */
/* ------------------------------------------------------------------ */
const darkActive = new Set();
export function setNavDark(key, on) {
  on ? darkActive.add(key) : darkActive.delete(key);
  document.getElementById('nav').classList.toggle('is-dark', darkActive.size > 0);
}
function initNavTheme() {
  document.querySelectorAll('.process, .explode, .columns, .contact, .footer').forEach((sec, i) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 48px',
      end: 'bottom 48px',
      refreshPriority: -1,
      onToggle: (self) => setNavDark(`sec-${i}`, self.isActive),
    });
  });
}

/* ------------------------------------------------------------------ */
/* IMMERSIVE ZOOM                                                      */
/* ------------------------------------------------------------------ */
function initZoom() {
  const section = document.querySelector('.zoom');
  const pin = section.querySelector('.zoom__pin');
  const frame = section.querySelector('.zoom__frame');
  const img = section.querySelector('.zoom__media img');
  const overlay = section.querySelector('.zoom__media-overlay');
  const caption = section.querySelector('.zoom__caption');
  const text = section.querySelector('.zoom__text');
  const title = section.querySelector('.zoom__title');
  const body = section.querySelector('.zoom__body');

  gsap.set(text, { opacity: 0, y: 60 });
  gsap.set(body, { opacity: 0, y: 30 });
  const split = SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'line' });
  gsap.set(split.lines, { yPercent: 110 });

  // Base size mirrors the CSS sizing of .zoom__frame so scale is resize-safe
  const getScale = () => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const factor = vw < 680 ? 0.78 : vw < 980 ? 0.62 : 0.28;
    const baseW = Math.min(vw * factor, vh * 0.48);
    const baseH = Math.min(vw * factor * 1.25, vh * 0.6);
    return Math.max(vw / baseW, vh / baseH) * 1.08;
  };

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=240%',
      pin: pin,
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => section.classList.toggle('is-dark', self.progress > 0.42),
    },
  });

  tl.fromTo(frame, { scale: 1, borderRadius: 26 }, { scale: () => getScale(), borderRadius: 0, duration: 0.6, ease: 'power2.inOut' }, 0)
    .fromTo(img, { scale: 1.15 }, { scale: 1, duration: 0.6, ease: 'power2.inOut' }, 0)
    .to(caption, { opacity: 1, duration: 0.1 }, 0.05)
    .to(caption, { opacity: 0, duration: 0.1 }, 0.35)
    .to(overlay, { opacity: 1, duration: 0.25 }, 0.4)
    .to(text, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }, 0.5)
    .to(split.lines, { yPercent: 0, duration: 0.25, stagger: 0.05, ease: 'power3.out' }, 0.52)
    .to(body, { opacity: 1, y: 0, duration: 0.2 }, 0.66)
    .to(img, { scale: 1.08, duration: 0.4, ease: 'none' }, 0.6);

  // Nav flips light once the image fills the viewport, until the section leaves
  ScrollTrigger.create({
    trigger: section,
    start: () => `top+=${Math.round(0.42 * 2.4 * window.innerHeight)} top`,
    end: 'bottom 48px',
    refreshPriority: -1,
    onToggle: (self) => setNavDark('zoom', self.isActive),
  });

  // Pre-pin entrance of the frame
  gsap.from(frame, { y: 120, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: section, start: 'top 90%', once: true } });
}

/* ------------------------------------------------------------------ */
/* SERVICES                                                            */
/* ------------------------------------------------------------------ */
function initServices() {
  ScrollTrigger.batch('.svc', {
    start: 'top 88%',
    once: true,
    onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 80, rotateX: -8 }, { opacity: 1, y: 0, rotateX: 0, duration: 1.4, stagger: 0.12, ease: 'expo.out', overwrite: true, clearProps: 'rotateX' }),
  });
}

/* ------------------------------------------------------------------ */
/* HORIZONTAL PARALLAX PROCESS                                         */
/* ------------------------------------------------------------------ */
function initProcess() {
  const section = document.querySelector('.process');
  const pin = section.querySelector('.process__pin');
  const track = document.getElementById('processTrack');
  const progress = document.getElementById('processProgress');
  const parallaxEls = track.querySelectorAll('[data-speed]');
  const steps = track.querySelectorAll('.step');

  const getDistance = () => track.scrollWidth - window.innerWidth;

  const tween = gsap.to(track, {
    x: () => -getDistance(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${getDistance() * 1.1}`,
      pin: pin,
      scrub: 1,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        progress.style.width = `${self.progress * 100}%`;
        // Subtle depth: visuals drift ±~120px relative to their copy, bg text lags behind
        parallaxEls.forEach((el) => {
          const s = parseFloat(el.dataset.speed);
          const amp = el.classList.contains('process__bg-text') ? 1400 : 200;
          gsap.set(el, { x: self.progress * amp * (1 - s) });
        });
      },
    },
  });

  // Reveal choreography for a single step
  const revealStep = (step, delay = 0) => {
    if (step.dataset.revealed) return;
    step.dataset.revealed = '1';
    const visual = step.querySelector('.step__visual');
    const body = step.querySelectorAll('.step__body > *');
    const index = step.querySelector('.step__index');
    gsap.to(visual, { clipPath: 'inset(0 0% 0 0 round 26px)', duration: 1.4, ease: 'expo.out', delay });
    gsap.to(index, { opacity: 1, x: 0, duration: 1, ease: 'expo.out', delay });
    gsap.to(body, { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: 'expo.out', delay: delay + 0.2 });
  };

  steps.forEach((step) => {
    gsap.set(step.querySelector('.step__visual'), { clipPath: 'inset(0 100% 0 0 round 26px)' });
    gsap.set(step.querySelector('.step__index'), { opacity: 0, x: -30 });
    gsap.set(step.querySelectorAll('.step__body > *'), { opacity: 0, y: 30 });
  });

  // Steps already inside the viewport when the section arrives play as a
  // staggered sequence on entry (instead of silently revealing at page load);
  // the rest reveal as they scroll in horizontally.
  const initiallyVisible = [...steps].filter((s) => s.getBoundingClientRect().left < window.innerWidth * 0.8);
  ScrollTrigger.create({
    trigger: section,
    start: 'top 55%',
    once: true,
    onEnter: () => initiallyVisible.forEach((s, i) => revealStep(s, 0.35 + i * 0.25)),
  });
  steps.forEach((step) => {
    if (initiallyVisible.includes(step)) return;
    ScrollTrigger.create({
      trigger: step,
      containerAnimation: tween,
      start: 'left 80%',
      once: true,
      onEnter: () => revealStep(step),
    });
  });

  // Head entrance
  gsap.from(section.querySelectorAll('.process__head > *'), {
    y: 40, opacity: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out',
    scrollTrigger: { trigger: section, start: 'top 70%', once: true },
  });

  // "Ready?" closer
  const end = section.querySelector('.process__end');
  gsap.set(end.children, { opacity: 0, y: 30 });
  ScrollTrigger.create({
    trigger: end,
    containerAnimation: tween,
    start: 'left 85%',
    once: true,
    onEnter: () => gsap.to(end.children, { opacity: 1, y: 0, duration: 1.1, stagger: 0.12, ease: 'expo.out' }),
  });
}

/* ------------------------------------------------------------------ */
/* EXPLODING OBJECT                                                    */
/* ------------------------------------------------------------------ */
function initExplode(explodeScene) {
  const section = document.querySelector('.explode');
  const pin = section.querySelector('.explode__pin');
  const center = section.querySelector('.explode__center');
  const labels = section.querySelectorAll('.explode__label');
  const hint = section.querySelector('.explode__hint');

  // Label 5 sits at left:50% — centre it with xPercent so `y` tweens stay clean
  gsap.set(labels, { y: 24, opacity: 0 });
  gsap.set(section.querySelector('.explode__label--5'), { xPercent: -50 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=260%',
      pin,
      scrub: 0.8,
      anticipatePin: 1,
      onUpdate: (self) => explodeScene && explodeScene.setProgress(self.progress),
    },
  });

  tl.to(hint, { opacity: 0, duration: 0.08 }, 0.08)
    .to(center, { scale: 0.86, opacity: 0, y: -40, duration: 0.3, ease: 'power2.in' }, 0.12)
    .to(labels, { opacity: 1, y: 0, duration: 0.18, stagger: 0.07, ease: 'power2.out' }, 0.42)
    .to({}, { duration: 0.2 }); // hold
}

/* ------------------------------------------------------------------ */
/* WHO — IMMERSIVE REVEAL                                              */
/* ------------------------------------------------------------------ */
function initWho() {
  document.querySelectorAll('.who__panel').forEach((panel, i) => {
    const media = panel.querySelector('.who__media');
    const img = media.querySelector('img');
    const content = panel.querySelectorAll('.who__content > *');
    const fromLeft = i % 2 === 0;

    gsap.set(media, { clipPath: fromLeft ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)' });
    gsap.set(content, { opacity: 0, y: 40 });

    ScrollTrigger.create({
      trigger: panel,
      start: 'top 65%',
      once: true,
      onEnter: () => {
        gsap.to(media, { clipPath: 'inset(0 0% 0 0%)', duration: 1.6, ease: 'expo.inOut' });
        gsap.to(img, { scale: 1, duration: 2.2, ease: 'expo.out' });
        gsap.to(content, { opacity: 1, y: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out', delay: 0.4 });
      },
    });

    // Parallax within
    gsap.fromTo(img, { yPercent: -8 }, {
      yPercent: 8, ease: 'none',
      scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

/* ------------------------------------------------------------------ */
/* STACK — LAYER TRANSFORMATION                                        */
/* ------------------------------------------------------------------ */
function initStack() {
  const cards = gsap.utils.toArray('.stack__card');
  cards.forEach((card, i) => {
    if (i === cards.length - 1) return;
    const next = cards[i + 1];
    // Explicit start values: GSAP would otherwise interpolate filter from "none" = brightness(0)
    gsap.fromTo(card, { scale: 1, filter: 'brightness(1)' }, {
      scale: 0.93,
      filter: 'brightness(0.94)',
      ease: 'none',
      immediateRender: false,
      scrollTrigger: {
        trigger: next,
        start: 'top bottom',
        end: 'top 18%',
        scrub: true,
      },
    });
  });
  // Entrance of each card
  cards.forEach((card) => {
    gsap.from(card, { y: 80, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 92%', once: true } });
  });
  gsap.from('.stack__sticky > *', { y: 40, opacity: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.stack', start: 'top 70%', once: true } });
}

/* ------------------------------------------------------------------ */
/* VERTICAL COLUMNS SLIDER                                             */
/* ------------------------------------------------------------------ */
function initColumns() {
  const section = document.querySelector('.columns');
  const cols = section.querySelectorAll('.columns__col');
  cols.forEach((col) => {
    const dir = parseFloat(col.dataset.dir);
    gsap.fromTo(col, { y: dir * -20 + '%' }, {
      y: dir * 20 + '%',
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
  gsap.from(section.querySelectorAll('.columns__text > *'), {
    y: 50, opacity: 0, duration: 1.2, stagger: 0.12, ease: 'expo.out',
    scrollTrigger: { trigger: section, start: 'top 60%', once: true },
  });
  gsap.from(section.querySelectorAll('.columns__col figure'), {
    opacity: 0, scale: 0.9, duration: 1.4, stagger: 0.06, ease: 'expo.out',
    scrollTrigger: { trigger: section, start: 'top 70%', once: true },
  });
}

/* ------------------------------------------------------------------ */
/* CONTACT                                                             */
/* ------------------------------------------------------------------ */
function initContact() {
  gsap.from('.contact__detail', { y: 40, opacity: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.contact__details', start: 'top 88%', once: true } });
  gsap.from('.form', { y: 80, opacity: 0, rotateX: 6, transformOrigin: 'top center', duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: '.form', start: 'top 85%', once: true }, clearProps: 'all' });
  gsap.from('.form > *:not(.form__success)', { y: 24, opacity: 0, duration: 1, stagger: 0.06, ease: 'expo.out', delay: 0.3, scrollTrigger: { trigger: '.form', start: 'top 85%', once: true } });
}

/* ------------------------------------------------------------------ */
/* FOOTER (Motion inView)                                              */
/* ------------------------------------------------------------------ */
function initFooter() {
  inView('.footer__grid', (el) => {
    motionAnimate(
      el.querySelectorAll('.footer__brand, .footer__col'),
      { opacity: [0, 1], y: [30, 0] },
      { duration: 0.9, delay: motionStagger(0.1), ease: [0.16, 1, 0.3, 1] }
    );
  }, { amount: 0.3 });
}
