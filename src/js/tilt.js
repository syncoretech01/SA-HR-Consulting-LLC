import { gsap } from 'gsap';

/**
 * 3D hover tilt with a moving light sheen, for `.tilt` cards.
 */
export function initTilt() {
  if (!window.matchMedia('(pointer: fine)').matches) return;

  document.querySelectorAll('.tilt').forEach((card) => {
    const sheen = document.createElement('span');
    sheen.className = 'tilt__sheen';
    Object.assign(sheen.style, {
      position: 'absolute', inset: '0', zIndex: '3', pointerEvents: 'none', opacity: '0',
      background: 'radial-gradient(600px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.22), transparent 45%)',
      transition: 'opacity 0.4s', borderRadius: 'inherit',
    });
    card.appendChild(sheen);

    const max = 9;
    let raf;
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        gsap.to(card, {
          rotateY: (px - 0.5) * max * 2,
          rotateX: (0.5 - py) * max * 2,
          transformPerspective: 1200,
          scale: 1.02,
          duration: 0.7,
          ease: 'power3.out',
        });
        sheen.style.setProperty('--mx', `${px * 100}%`);
        sheen.style.setProperty('--my', `${py * 100}%`);
      });
    });
    card.addEventListener('mouseenter', () => { sheen.style.opacity = '1'; });
    card.addEventListener('mouseleave', () => {
      sheen.style.opacity = '0';
      gsap.to(card, { rotateY: 0, rotateX: 0, scale: 1, duration: 1, ease: 'elastic.out(1, 0.5)' });
    });
  });
}
