import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { gsap } from 'gsap';

/**
 * Exploding object: a faceted gold sphere that fractures into shards as the
 * user scrolls, revealing a glowing core and information labels.
 */
export function initExplodeScene() {
  const canvas = document.getElementById('explodeCanvas');
  if (!canvas) return null;

  const isMobile = window.matchMedia('(max-width: 980px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xfff2d6, 2);
  key.position.set(5, 6, 5);
  scene.add(key);
  const fill = new THREE.PointLight(0xd4a853, 6, 20);
  fill.position.set(-4, -3, 4);
  scene.add(fill);

  const group = new THREE.Group();
  scene.add(group);

  // Build shards from a non-indexed icosahedron
  const radius = 1.55;
  const base = new THREE.IcosahedronGeometry(radius, 2);
  const pos = base.attributes.position;
  const shardMat = new THREE.MeshPhysicalMaterial({
    color: 0xd4a853, metalness: 0.9, roughness: 0.28, clearcoat: 0.7, clearcoatRoughness: 0.15, envMapIntensity: 1.2,
    flatShading: true,
  });
  const shardMatDark = new THREE.MeshPhysicalMaterial({
    color: 0x1d3357, metalness: 0.6, roughness: 0.3, clearcoat: 1, envMapIntensity: 1, flatShading: true,
  });

  const shards = [];
  const thickness = 0.28;
  for (let i = 0; i < pos.count; i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(pos, i);
    const b = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
    const c = new THREE.Vector3().fromBufferAttribute(pos, i + 2);
    const centroid = new THREE.Vector3().add(a).add(b).add(c).divideScalar(3);
    const dir = centroid.clone().normalize();

    // Tetrahedral shard: outer triangle + inner apex pulled toward center
    const apex = centroid.clone().sub(dir.clone().multiplyScalar(thickness));
    const la = a.clone().sub(centroid), lb = b.clone().sub(centroid), lc = c.clone().sub(centroid), lp = apex.clone().sub(centroid);
    const verts = new Float32Array([
      ...la.toArray(), ...lb.toArray(), ...lc.toArray(),
      ...la.toArray(), ...lp.toArray(), ...lb.toArray(),
      ...lb.toArray(), ...lp.toArray(), ...lc.toArray(),
      ...lc.toArray(), ...lp.toArray(), ...la.toArray(),
    ]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    g.computeVertexNormals();

    const mesh = new THREE.Mesh(g, Math.random() > 0.82 ? shardMatDark : shardMat);
    mesh.position.copy(centroid);
    mesh.userData = {
      origin: centroid.clone(),
      dir,
      spread: 1.1 + Math.random() * 1.9,
      rot: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(2.2),
      delay: Math.random() * 0.25,
      shrink: 0.45 + Math.random() * 0.3,
    };
    group.add(mesh);
    shards.push(mesh);
  }

  // Glowing core
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.62, 48, 48),
    new THREE.MeshPhysicalMaterial({ color: 0xd4a853, emissive: 0xc8973a, emissiveIntensity: 1.6, roughness: 0.15, metalness: 0.6, clearcoat: 1 })
  );
  core.scale.setScalar(0.001);
  group.add(core);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xd4a853, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  group.add(halo);

  // Orbit rings that appear when exploded
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xecd39a, transparent: true, opacity: 0 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.018, 12, 160), ringMat);
  ring.rotation.x = Math.PI / 2.4;
  group.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.012, 12, 160), ringMat);
  ring2.rotation.set(Math.PI / 1.7, 0.4, 0);
  group.add(ring2);

  const state = { progress: 0, eased: 0 };
  let visible = false;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
  io.observe(canvas);

  const mouse = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  window.addEventListener('mousemove', (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 2;
    target.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  const size = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    group.scale.setScalar(w < 680 ? 0.62 : w < 980 ? 0.8 : 1);
    group.position.y = w < 980 ? -0.2 : -0.45;
  };
  size();
  window.addEventListener('resize', size);

  const clock = new THREE.Clock();
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  gsap.ticker.add(() => {
    if (!visible) return;
    const t = clock.getElapsedTime();
    state.eased += (state.progress - state.eased) * 0.08;
    const p = state.eased;

    mouse.x += (target.x - mouse.x) * 0.05;
    mouse.y += (target.y - mouse.y) * 0.05;

    shards.forEach((m) => {
      const { origin, dir, spread, rot, delay, shrink } = m.userData;
      const local = THREE.MathUtils.clamp((p - delay) / (1 - delay), 0, 1);
      const e = easeOut(local);
      m.position.copy(origin).add(dir.clone().multiplyScalar(spread * e));
      // subtle float when exploded
      m.position.y += Math.sin(t * 1.2 + origin.x * 3) * 0.06 * e;
      m.rotation.set(rot.x * e, rot.y * e + t * 0.05 * e, rot.z * e);
      m.scale.setScalar(1 - (1 - shrink) * e);
    });

    const coreS = easeOut(THREE.MathUtils.clamp((p - 0.25) / 0.5, 0, 1));
    core.scale.setScalar(Math.max(0.001, coreS));
    core.material.emissiveIntensity = 1.4 + Math.sin(t * 2) * 0.4;
    halo.scale.setScalar(1 + Math.sin(t * 1.5) * 0.08);
    halo.material.opacity = coreS * 0.18;
    ringMat.opacity = coreS * 0.55;
    ring.rotation.z = t * 0.15;
    ring2.rotation.z = -t * 0.1;

    group.rotation.y = t * 0.12 + mouse.x * 0.35;
    group.rotation.x = mouse.y * 0.25 + Math.sin(t * 0.4) * 0.05;

    // Pull the camera back slightly so the burst stays framed
    camera.position.z = 11 + p * 1.6;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  });

  return {
    setProgress(v) { state.progress = v; },
  };
}
