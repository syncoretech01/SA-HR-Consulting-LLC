import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { gsap } from 'gsap';

/**
 * Hero scene: an orbital "gyroscope" of gold rings around a faceted navy gem,
 * floating inside a soft particle field. Reacts to mouse and scroll.
 */
export function initHeroScene() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return null;

  const isMobile = window.matchMedia('(max-width: 980px)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 12);

  // Lights
  scene.add(new THREE.HemisphereLight(0xfff5e6, 0x8fa88e, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 6, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd4a853, 1.2);
  rim.position.set(-6, -2, -4);
  scene.add(rim);

  // Group positioned to the right of the copy
  const group = new THREE.Group();
  scene.add(group);

  const gold = new THREE.MeshPhysicalMaterial({
    color: 0xd4a853, metalness: 0.95, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.2,
    envMapIntensity: 1.3,
  });
  const navy = new THREE.MeshPhysicalMaterial({
    color: 0x152642, metalness: 0.35, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08,
    flatShading: true, envMapIntensity: 1.1,
  });
  const ivory = new THREE.MeshPhysicalMaterial({
    color: 0xf6f1ea, metalness: 0.1, roughness: 0.4, clearcoat: 0.8, envMapIntensity: 0.8,
  });

  // Gem
  const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), navy);
  group.add(gem);

  // Rings
  const rings = [];
  const ringDefs = [
    { r: 2.0, tube: 0.035, tilt: [0.5, 0.2, 0], mat: gold },
    { r: 2.6, tube: 0.05, tilt: [1.2, 0.6, 0.3], mat: gold },
    { r: 3.25, tube: 0.028, tilt: [0.15, 1.3, 0.9], mat: ivory },
  ];
  ringDefs.forEach((d, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(d.r, d.tube, 24, 140), d.mat);
    ring.rotation.set(...d.tilt);
    ring.userData.speed = 0.15 + i * 0.08;
    ring.userData.axis = new THREE.Vector3(Math.sin(i), Math.cos(i * 1.3), Math.sin(i * 0.7)).normalize();
    group.add(ring);
    rings.push(ring);
  });

  // Small orbiting satellites
  const sats = [];
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.07 + Math.random() * 0.06, 20, 20), i % 2 ? gold : ivory);
    s.userData = { radius: 2 + Math.random() * 1.6, speed: 0.3 + Math.random() * 0.4, phase: Math.random() * Math.PI * 2, y: (Math.random() - 0.5) * 1.5 };
    group.add(s);
    sats.push(s);
  }

  // Particle field
  const count = isMobile ? 350 : 900;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 14 - 2;
    sizes[i] = Math.random();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  const pMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0xc8973a) }, uPixelRatio: { value: renderer.getPixelRatio() } },
    vertexShader: `
      attribute float aSize;
      uniform float uTime; uniform float uPixelRatio;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.y += sin(uTime * 0.4 + position.x * 0.5) * 0.25;
        p.x += cos(uTime * 0.3 + position.y * 0.4) * 0.2;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (2.0 + aSize * 4.0) * uPixelRatio * (8.0 / -mv.z);
        vAlpha = 0.25 + aSize * 0.45;
      }`,
    fragmentShader: `
      uniform vec3 uColor; varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.1, d) * vAlpha;
        gl_FragColor = vec4(uColor, a);
      }`,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // Layout
  // Base scale / anchor per breakpoint; mobile parks the object in the top band above the copy
  const baseScale = () => (window.innerWidth < 680 ? 0.46 : window.innerWidth < 980 ? 0.62 : window.innerWidth < 1300 ? 0.85 : 1);
  const baseY = () => (window.innerWidth < 680 ? 2.15 : window.innerWidth < 980 ? 2.6 : 0.2);
  const layout = () => {
    const w = window.innerWidth;
    group.position.set(w < 980 ? 0 : 3.6, baseY(), w < 980 ? -1 : 0);
    group.scale.setScalar(baseScale());
  };
  layout();

  // Mouse + scroll influence
  const mouse = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  window.addEventListener('mousemove', (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 2;
    target.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  const scrollState = { y: 0 };
  let visible = true;
  const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0 });
  io.observe(canvas);

  // Entrance
  group.scale.multiplyScalar(0.001);
  gem.rotation.set(0.4, 0.4, 0);
  const intro = () => {
    const base = baseScale();
    gsap.to(group.scale, { x: base, y: base, z: base, duration: 2.2, ease: 'expo.out', delay: 0.15 });
    gsap.from(group.rotation, { y: -1.6, duration: 2.6, ease: 'expo.out' });
  };
  document.addEventListener('preloader:reveal', intro, { once: true });

  const clock = new THREE.Clock();
  const render = () => {
    if (!visible) return;
    const t = clock.getElapsedTime();
    mouse.x += (target.x - mouse.x) * 0.04;
    mouse.y += (target.y - mouse.y) * 0.04;

    if (!reduced) {
      gem.rotation.y = t * 0.25 + mouse.x * 0.6;
      gem.rotation.x = Math.sin(t * 0.3) * 0.25 + mouse.y * 0.4;
      gem.position.y = Math.sin(t * 0.8) * 0.12;
      rings.forEach((r) => r.rotateOnAxis(r.userData.axis, r.userData.speed * 0.01));
      sats.forEach((s) => {
        const a = t * s.userData.speed + s.userData.phase;
        s.position.set(Math.cos(a) * s.userData.radius, s.userData.y + Math.sin(a * 1.7) * 0.4, Math.sin(a) * s.userData.radius);
      });
    }
    group.rotation.y += ((mouse.x * 0.35) - group.rotation.y) * 0.05;
    group.rotation.x += ((mouse.y * 0.25 + scrollState.y * 0.8) - group.rotation.x) * 0.05;
    group.position.y += ((baseY() + scrollState.y * -2.5) - group.position.y) * 0.08;

    particles.rotation.y = t * 0.02;
    pMat.uniforms.uTime.value = t;

    camera.position.x += (mouse.x * 0.4 - camera.position.x) * 0.03;
    camera.position.y += (-mouse.y * 0.3 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  };
  gsap.ticker.add(render);

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    pMat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    layout();
  };
  window.addEventListener('resize', onResize);

  return {
    setScroll(p) { scrollState.y = p; },
  };
}
