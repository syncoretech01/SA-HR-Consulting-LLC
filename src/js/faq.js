import { animate } from 'motion';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * FAQ accordion driven by Motion (spring-eased height + fade).
 */
export function initFaq() {
  const items = document.querySelectorAll('.faq__item');
  items.forEach((item) => {
    const btn = item.querySelector('.faq__q');
    const panel = item.querySelector('.faq__a');
    const inner = item.querySelector('.faq__a-inner');

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      // close others
      items.forEach((other) => {
        if (other !== item && other.classList.contains('is-open')) toggle(other, false);
      });
      toggle(item, !isOpen);
    });

    function toggle(el, open) {
      const b = el.querySelector('.faq__q');
      const p = el.querySelector('.faq__a');
      const inr = el.querySelector('.faq__a-inner');
      el.classList.toggle('is-open', open);
      b.setAttribute('aria-expanded', String(open));
      const h = inr.getBoundingClientRect().height;
      // Pin the current height in px so the spring has a concrete start value
      if (!open) p.style.height = `${h}px`;
      p.getBoundingClientRect();
      animate(p, { height: open ? h : 0 }, { type: 'spring', stiffness: 220, damping: 28, mass: 0.9 })
        .then(() => { if (el.classList.contains('is-open')) p.style.height = 'auto'; ScrollTrigger.refresh(); });
      animate(inr, { opacity: open ? 1 : 0.2, y: open ? 0 : -6 }, { duration: 0.45, ease: [0.16, 1, 0.3, 1] });
    }
  });
}
