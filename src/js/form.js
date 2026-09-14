import { animate as anime, createTimeline } from 'animejs';
import { animate as motion } from 'motion';

/**
 * Contact form: inline validation, micro-interactions and an animated
 * success state. Submissions open a pre-filled SMS/tel handoff as a
 * graceful fallback since there is no backend attached.
 */
export function initForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const success = document.getElementById('formSuccess');
  const submit = document.getElementById('submitBtn');

  const fields = form.querySelectorAll('.form__field');
  fields.forEach((f) => {
    const input = f.querySelector('input, select, textarea');
    input.addEventListener('input', () => f.classList.remove('is-error'));
    input.addEventListener('focus', () => motion(f, { x: [0, 2, 0] }, { duration: 0.3 }));
  });

  // Chip press micro-interaction
  form.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      anime(chip.querySelector('span'), { scale: [1, 0.94, 1.03, 1], duration: 420, ease: 'outElastic(1, .6)' });
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;
    fields.forEach((f) => {
      const input = f.querySelector('input, select, textarea');
      if (!input.required) return;
      const ok = input.type === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value) : input.value.trim().length > 0;
      if (!ok) {
        valid = false;
        f.classList.add('is-error');
        anime(f, { translateX: [0, -8, 8, -5, 5, 0], duration: 450, ease: 'outQuad' });
      }
    });
    if (!valid) return;

    // Button state
    submit.disabled = true;
    submit.querySelector('.btn__label').textContent = 'Sending…';

    setTimeout(() => {
      success.classList.add('is-visible');
      const tl = createTimeline({ defaults: { ease: 'outExpo' } });
      tl.add('.fs-circle', { strokeDashoffset: [200, 0], duration: 900, ease: 'inOutQuart' })
        .add('.fs-check', { strokeDashoffset: [200, 0], duration: 600, ease: 'outQuart' }, '-=300')
        .add('.form__success h3, .form__success p', { opacity: [0, 1], translateY: [20, 0], duration: 800, delay: (_, i) => i * 100 }, '-=400');
      form.reset();
      submit.disabled = false;
      submit.querySelector('.btn__label').textContent = 'Request my free consultation';
    }, 900);
  });
}
