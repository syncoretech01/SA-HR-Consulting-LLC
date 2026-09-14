# SA HR Consulting LLC — Website

Premium single-page site for SA HR Consulting LLC — outsourced HR for small businesses (recruitment, onboarding, employee relations, performance reviews) sold as monthly packages or à la carte. Baldwin, NY · 718-791-7214.

## Stack

- **Vite 7** — dev server & build
- **Three.js** — hero orbital scene, exploding-object section
- **GSAP 3.15** + ScrollTrigger + SplitText — scroll choreography, pinning, horizontal scroll, text reveals
- **Lenis** — smooth scrolling
- **Motion** — FAQ spring accordion, footer in-view reveals, micro-interactions
- **Anime.js v4** — preloader, counters, form feedback

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173 (or the next free port)
```

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build
```

## Structure

```
index.html            page markup (all sections)
src/style.css         design system, layout, responsive rules
src/main.js           boot sequence
src/js/scroll.js      Lenis + ScrollTrigger sync, anchor scrolling
src/js/preloader.js   loading sequence (anime.js)
src/js/cursor.js      custom cursor + magnetic elements
src/js/nav.js         adaptive nav + fullscreen menu
src/js/hero-scene.js  Three.js hero
src/js/explode-scene.js  Three.js exploding object
src/js/animations.js  all scroll-driven section animations
src/js/tilt.js        3D hover tilt for service cards
src/js/slider3d.js    3D coverflow testimonial slider
src/js/faq.js         accordion (Motion)
src/js/form.js        contact form validation + success state
```

## Notes

- Photography is loaded from Unsplash; swap the `images.unsplash.com` URLs in `index.html` for the client's own photos when available.
- The contact form has no backend attached yet — it validates and shows the success state client-side. Wire `form.js` to an endpoint (Formspree, Netlify Forms, a serverless function, etc.) to receive submissions.
