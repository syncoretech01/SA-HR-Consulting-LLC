import { gsap } from 'gsap';

/**
 * Custom cursor with lerped follow, hover states, contextual labels
 * and magnetic buttons.
 */
export function initCursor() {
  const fine = window.matchMedia('(pointer: fine)').matches;
  if (!fine) return;

  const cursor = document.getElementById('cursor');
  const dot = cursor.querySelector('.cursor__dot');
  const ring = cursor.querySelector('.cursor__ring');
  const label = cursor.querySelector('.cursor__label');
  const labelText = document.getElementById('cursorLabel');

  document.body.classList.add('has-cursor');

  const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const dotPos = { ...pos };
  const ringPos = { ...pos };
  const labelPos = { ...pos };

  window.addEventListener('mousemove', (e) => {
    pos.x = e.clientX;
    pos.y = e.clientY;
    cursor.classList.remove('is-hidden');
  }, { passive: true });

  document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
  document.addEventListener('mousedown', () => cursor.classList.add('is-down'));
  document.addEventListener('mouseup', () => cursor.classList.remove('is-down'));

  const lerp = (a, b, t) => a + (b - a) * t;

  gsap.ticker.add(() => {
    dotPos.x = lerp(dotPos.x, pos.x, 0.55);
    dotPos.y = lerp(dotPos.y, pos.y, 0.55);
    ringPos.x = lerp(ringPos.x, pos.x, 0.18);
    ringPos.y = lerp(ringPos.y, pos.y, 0.18);
    labelPos.x = lerp(labelPos.x, pos.x, 0.22);
    labelPos.y = lerp(labelPos.y, pos.y, 0.22);
    dot.style.transform = `translate(${dotPos.x}px, ${dotPos.y}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%, -50%)`;
    label.style.transform = `translate(${labelPos.x}px, ${labelPos.y}px) translate(-50%, -50%) scale(${cursor.classList.contains('is-label') ? 1 : 0})`;
  });

  // Hover states
  const hoverables = 'a, button, .tilt, .faq__q, .chip, input, textarea, select';
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest('[data-cursor]');
    if (el) {
      const text = el.getAttribute('data-cursor');
      if (text && text !== '-') {
        labelText.textContent = text;
        cursor.classList.add('is-label');
      }
    }
    if (e.target.closest(hoverables)) cursor.classList.add('is-hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('[data-cursor]')) cursor.classList.remove('is-label');
    if (e.target.closest(hoverables)) cursor.classList.remove('is-hover');
  });

  // Light cursor over dark sections
  const darkSelector = '.process, .explode, .columns, .contact, .footer, .menu.is-open, .zoom.is-dark, .stack__card:nth-child(3)';
  const check = () => {
    const el = document.elementFromPoint(pos.x, pos.y);
    const dark = el && el.closest(darkSelector);
    cursor.classList.toggle('is-light', !!dark);
  };
  setInterval(check, 120);

  // Magnetic elements
  document.querySelectorAll('.magnetic').forEach((el) => {
    const strength = el.classList.contains('btn') ? 0.35 : 0.5;
    let raf;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => gsap.to(el, { x, y, duration: 0.6, ease: 'power3.out' }));
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' });
    });
  });
}
