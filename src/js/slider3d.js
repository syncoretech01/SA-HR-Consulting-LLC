import { gsap } from 'gsap';

/**
 * 3D coverflow slider with drag, keyboard, autoplay and dots.
 */
export function initSlider3D() {
  const root = document.getElementById('slider3d');
  if (!root) return;
  const slides = [...root.querySelectorAll('.slide3d')];
  const dotsWrap = document.getElementById('slideDots');
  const prevBtn = document.getElementById('slidePrev');
  const nextBtn = document.getElementById('slideNext');
  const n = slides.length;
  let index = 0;
  let autoplay;

  slides.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'slider3d__dot';
    d.setAttribute('aria-label', `Go to story ${i + 1}`);
    d.addEventListener('click', () => go(i));
    dotsWrap.appendChild(d);
  });
  const dots = [...dotsWrap.children];

  const spacing = () => (window.innerWidth < 680 ? 78 : window.innerWidth < 1100 ? 46 : 38); // % of slide width

  function layout(animated = true) {
    slides.forEach((slide, i) => {
      let offset = i - index;
      // wrap for infinite feel
      if (offset > n / 2) offset -= n;
      if (offset < -n / 2) offset += n;
      const abs = Math.abs(offset);
      const props = {
        xPercent: -50 + offset * spacing(),
        yPercent: -50,
        z: -abs * 220,
        rotateY: offset * -28,
        scale: 1 - abs * 0.08,
        opacity: abs > 2 ? 0 : 1 - abs * 0.25,
        zIndex: 10 - abs,
        filter: `blur(${abs * 1.5}px)`,
        duration: animated ? 1.1 : 0,
        ease: 'expo.out',
      };
      gsap.to(slide, props);
      slide.style.pointerEvents = abs <= 1 ? 'auto' : 'none';
    });
    dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
  }

  function go(i) {
    index = (i + n) % n;
    layout();
    restart();
  }
  const next = () => go(index + 1);
  const prev = () => go(index - 1);

  function restart() {
    clearInterval(autoplay);
    autoplay = setInterval(next, 6000);
  }

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  // Drag / swipe
  let startX = 0, dragging = false;
  const onDown = (e) => { dragging = true; startX = e.clientX ?? e.touches?.[0].clientX; };
  const onUp = (e) => {
    if (!dragging) return;
    dragging = false;
    const x = e.clientX ?? e.changedTouches?.[0].clientX;
    const dx = x - startX;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
  };
  root.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  root.addEventListener('touchstart', onDown, { passive: true });
  root.addEventListener('touchend', onUp);

  // Side slides clickable
  slides.forEach((s, i) => s.addEventListener('click', () => { if (i !== index) go(i); }));

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  // Pause autoplay when hovering
  root.addEventListener('mouseenter', () => clearInterval(autoplay));
  root.addEventListener('mouseleave', restart);

  window.addEventListener('resize', () => layout(false));
  layout(false);
  restart();
}
