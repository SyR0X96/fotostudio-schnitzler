// ============================================================================
//  LICHTVORSCHAU – Marmorbüste in Three.js mit Studiolicht.
//  Lädt erst, wenn der Schritt „Look“ im Planer öffnet. Rendert nur bei Änderungen.
//  Modell: Poly Haven „Marble Bust 01“ (CC0), public/models/bust/
// ============================================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'gsap';

// Lichtsetzungen wie im Studio. Winkel in Grad: az 0 = aus Richtung Kamera, negativ = von links,
// el = Höhe über dem Kopf. Hintergrund als sRGB (bgA = Mitte, bgB = Rand).
// Die Büste blickt ca. 30° nach links (Richtung az -30), die Winkel beziehen sich darauf.
const MOODS = {
  // Heller, weicher Hintergrund, großes weiches Hauptlicht nahe der Kamera, viel Fülllicht
  highkey: { keyAz: -18, keyEl: 26, key: 2.4, soft: 10, spread: 0.6, fill: 1.4, fillAz: 55, fillEl: 4, rim: 0.6, rimAz: 160, rimEl: 35, amb: 1.2, exp: 1.0, bgA: [0.99, 0.985, 0.975], bgB: [0.9, 0.89, 0.875], glow: 0.45, mottle: 0 },
  // Schwarzer Hintergrund, ein hartes Seitenlicht, etwas Kante von hinten
  lowkey: { keyAz: -112, keyEl: 16, key: 4.6, soft: 1, spread: 0, fill: 0, fillAz: 55, fillEl: 4, rim: 2.4, rimAz: 138, rimEl: 26, amb: 0.015, exp: 1.0, bgA: [0.03, 0.029, 0.027], bgB: [0, 0, 0], glow: 0.7, mottle: 0 },
  // Rembrandt: Hauptlicht ca. 45° seitlich und erhöht, Lichtdreieck auf der Schattenwange, wenig Fülllicht
  rembrandt: { keyAz: -84, keyEl: 46, key: 4.2, soft: 3, spread: 0.05, fill: 0.12, fillAz: 40, fillEl: 4, rim: 0.3, rimAz: 150, rimEl: 30, amb: 0.05, exp: 1.0, bgA: [0.43, 0.39, 0.33], bgB: [0.085, 0.08, 0.07], glow: 1, mottle: 0.55 },
};

// Farben flach machen, damit GSAP sie wie Zahlen überblenden kann
const flat = (m) => {
  const o = { ...m };
  for (const k of ['bgA', 'bgB']) {
    [o[`${k}r`], o[`${k}g`], o[`${k}b`]] = m[k];
    delete o[k];
  }
  return o;
};

const rad = THREE.MathUtils.degToRad;
const clamp = THREE.MathUtils.clamp;

export const hasWebGL2 = () => {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
};

const BG_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.9999, 1.0);
}`;

// Studiohintergrund: Verlauf um den Kopf, optional gemalter „Leinwand“-Hintergrund (Mottle)
const BG_FRAG = /* glsl */ `
uniform vec3 uA;
uniform vec3 uB;
uniform float uGlow;
uniform float uMottle;
uniform float uAspect;
uniform vec2 uCenter;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
void main() {
  vec2 p = vUv - uCenter;
  p.x *= uAspect;
  float d = length(p * vec2(0.85, 1.0));
  float g = smoothstep(0.95, 0.05, d);
  vec3 col = mix(uB, uA, mix(1.0, g, uGlow));
  vec2 q = vUv * vec2(uAspect, 1.0);
  float m = fbm(q * 2.6 + fbm(q * 1.3) * 1.4);
  col *= 1.0 + (m - 0.5) * uMottle;
  // feines Rauschen gegen Stufen im Verlauf
  col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  gl_FragColor = vec4(max(col, 0.0), 1.0);
  #include <colorspace_fragment>
}`;

export class LightPreview {
  constructor(canvas, { reduced = false, onLight, onInteract } = {}) {
    this.canvas = canvas;
    this.reduced = reduced;
    this.onLight = onLight;
    this.onInteract = onInteract;
    this.raf = 0;
  }

  async init(mood = 'rembrandt') {
    if (!hasWebGL2()) throw new Error('WebGL 2 nicht verfügbar');
    this.mood = MOODS[mood] ? mood : 'rembrandt';
    this.p = flat(MOODS[this.mood]);
    this.setup();
    await this.load();
    this.bindInput();
    this.resize();
    this.apply();
    this.render();
    if (import.meta.env.DEV) window.__lightPreview = this;
  }

  setup() {
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'low-power' }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;

    const scene = (this.scene = new THREE.Scene());
    this.camera = new THREE.PerspectiveCamera(24, 4 / 3, 0.05, 20);

    // Hintergrund als Vollbild-Dreieck, unbeleuchtet und ohne Tonemapping (Weiß bleibt Weiß)
    this.bgMat = new THREE.ShaderMaterial({
      uniforms: {
        uA: { value: new THREE.Color() },
        uB: { value: new THREE.Color() },
        uGlow: { value: 0 },
        uMottle: { value: 0 },
        uAspect: { value: 4 / 3 },
        uCenter: { value: new THREE.Vector2(0.5, 0.6) },
      },
      vertexShader: BG_VERT,
      fragmentShader: BG_FRAG,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    const bg = new THREE.Mesh(tri, this.bgMat);
    bg.frustumCulled = false;
    bg.renderOrder = -1;
    scene.add(bg);

    this.head = new THREE.Vector3(0, 0.4, 0);
    this.target = new THREE.Object3D();
    scene.add(this.target);

    // Hauptlicht mit weichem Selbstschatten
    const key = (this.key = new THREE.DirectionalLight(0xfff1e0, 1));
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -0.3, right: 0.3, top: 0.3, bottom: -0.3, near: 0.5, far: 4 });
    key.shadow.bias = -0.0002;
    key.shadow.normalBias = 0.0015;
    // Zweite Lichtquelle direkt neben dem Hauptlicht: macht große Lichtformer (Softbox) weicher
    this.spread = new THREE.DirectionalLight(0xfff1e0, 0);
    this.fill = new THREE.DirectionalLight(0xeef1f8, 0);
    this.rim = new THREE.DirectionalLight(0xeef3ff, 0);
    this.amb = new THREE.HemisphereLight(0xfffcf6, 0x2b2723, 0);
    for (const l of [key, this.spread, this.fill, this.rim]) {
      l.target = this.target;
      scene.add(l);
    }
    scene.add(this.amb);
  }

  async load() {
    const gltf = await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/bust/bust.gltf`);
    const model = (this.model = gltf.scene);
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      const m = o.material;
      m.side = THREE.FrontSide;
      // Rückseiten in die Shadow Map: kein Streifenmuster (Acne) auf beleuchteten Flächen
      m.shadowSide = THREE.BackSide;
      m.roughness = 0.48;
      m.needsUpdate = true;
    });
    // Leicht zur Seite gedreht, wie beim klassischen Portrait
    model.rotation.y = rad(-22);
    this.scene.add(model);
    model.updateMatrixWorld(true);

    // Kopfmitte aus der Bounding Box: oberes Drittel
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const c = box.getCenter(new THREE.Vector3());
    this.head.set(c.x, box.max.y - size.y * 0.24, c.z);
    this.target.position.copy(this.head);
    this.frameH = size.y * 0.78;
  }

  // Licht auf einer Kugel um den Kopf platzieren
  place(light, az, el, dist = 2) {
    const a = rad(az), e = rad(el);
    light.position.set(this.head.x + Math.sin(a) * Math.cos(e) * dist, this.head.y + Math.sin(e) * dist, this.head.z + Math.cos(a) * Math.cos(e) * dist);
  }

  apply() {
    const p = this.p;
    this.place(this.key, p.keyAz, p.keyEl);
    this.key.intensity = p.key;
    this.key.shadow.radius = p.soft;
    this.place(this.spread, p.keyAz - Math.sign(p.keyAz || 1) * 24, p.keyEl + 12);
    this.spread.intensity = p.key * p.spread;
    this.place(this.fill, p.fillAz, p.fillEl);
    this.fill.intensity = p.fill;
    this.place(this.rim, p.rimAz, p.rimEl);
    this.rim.intensity = p.rim;
    this.amb.intensity = p.amb;
    this.renderer.toneMappingExposure = p.exp;
    const u = this.bgMat.uniforms;
    u.uA.value.setRGB(p.bgAr, p.bgAg, p.bgAb, THREE.SRGBColorSpace);
    u.uB.value.setRGB(p.bgBr, p.bgBg, p.bgBb, THREE.SRGBColorSpace);
    u.uGlow.value = p.glow;
    u.uMottle.value = p.mottle;
    this.onLight?.(p.keyAz, p.keyEl);
  }

  setMood(id, force = false) {
    if (!MOODS[id] || !this.p) return;
    if (id === this.mood && !force && !this.moved) return;
    this.mood = id;
    this.moved = false;
    gsap.killTweensOf(this.p);
    const to = flat(MOODS[id]);
    if (this.reduced) {
      Object.assign(this.p, to);
      this.apply();
      this.requestRender();
      return;
    }
    gsap.to(this.p, {
      ...to,
      duration: 1.3,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.apply();
        this.render();
      },
    });
  }

  setLight(az, el) {
    this.p.keyAz = clamp(az, -165, 165);
    this.p.keyEl = clamp(el, -15, 80);
    this.moved = true;
    this.apply();
    this.requestRender();
  }

  touched() {
    if (this.interacted) return;
    this.interacted = true;
    this.onInteract?.();
  }

  bindInput() {
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, az: this.p.keyAz, el: this.p.keyEl };
      c.setPointerCapture?.(e.pointerId);
      c.classList.add('is-dragging');
      gsap.killTweensOf(this.p, 'keyAz,keyEl');
      this.touched();
    });
    c.addEventListener('pointermove', (e) => {
      const d = this.drag;
      if (!d || e.pointerId !== d.id) return;
      const w = c.clientWidth || 1, h = c.clientHeight || 1;
      this.setLight(d.az + ((e.clientX - d.x) / w) * 220, d.el - ((e.clientY - d.y) / h) * 120);
    });
    const end = () => {
      this.drag = null;
      c.classList.remove('is-dragging');
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('lostpointercapture', end);
    c.addEventListener('keydown', (e) => {
      const k = { ArrowLeft: [-6, 0], ArrowRight: [6, 0], ArrowUp: [0, 5], ArrowDown: [0, -5] }[e.key];
      if (k) {
        e.preventDefault();
        gsap.killTweensOf(this.p, 'keyAz,keyEl');
        this.touched();
        this.setLight(this.p.keyAz + k[0], this.p.keyEl + k[1]);
      } else if (e.key === 'Home') {
        e.preventDefault();
        this.setMood(this.mood, true);
      }
    });
    c.addEventListener('webglcontextlost', (e) => e.preventDefault());
    c.addEventListener('webglcontextrestored', () => this.requestRender());

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(c.parentElement);
  }

  resize() {
    const el = this.canvas.parentElement;
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    const cam = this.camera;
    cam.aspect = w / h;
    // Kopf und Schultern im Bild, bei schmalen Formaten etwas weiter weg
    const dist = (this.frameH / 2 / Math.tan(rad(cam.fov / 2))) * Math.max(1, 1.05 / cam.aspect);
    cam.position.set(this.head.x, this.head.y + 0.015, this.head.z + dist);
    cam.lookAt(this.head.x, this.head.y - this.frameH * 0.12, this.head.z);
    cam.updateProjectionMatrix();
    // Glanzpunkt des Hintergrunds hinter dem Kopf
    const v = this.head.clone().project(cam);
    this.bgMat.uniforms.uCenter.value.set(v.x * 0.5 + 0.5, v.y * 0.5 + 0.5);
    this.bgMat.uniforms.uAspect.value = cam.aspect;
    this.render();
  }

  requestRender() {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.render();
    });
  }

  render() {
    if (this.renderer) this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.ro?.disconnect();
    gsap.killTweensOf(this.p);
    cancelAnimationFrame(this.raf);
    this.scene?.traverse((o) => {
      o.geometry?.dispose();
      if (o.material) for (const k of ['map', 'normalMap']) o.material[k]?.dispose();
      o.material?.dispose?.();
    });
    this.renderer?.dispose();
  }
}
