import * as THREE from 'three';
import { quadVert, backdropFrag, sceneFrag, dustVert, dustFrag, BOKEH } from './shaders.js';

// ---------------------------------------------------------------------------
//  „Ins rechte Licht gerückt“: dunkles Studio, ein Schwarzweiß-Portrait,
//  Maus oder Finger ist das Einstelllicht. Alles läuft in einem Vollbild-Quad,
//  der gemalte Hintergrund wird nur bei Resize gerendert, Staub sind Punkte.
// ---------------------------------------------------------------------------

// Lichtpunkte relativ zum Rahmen (0..1, oben links). Das Gesicht schaut nach links unten,
// die Aufnahme ist von links oben gesetzt: dort steht das Licht am Anfang.
const START = { x: 0.26, y: 0.22 };
const PATH = { x: 0.4, y: 0.4, ax: 0.3, ay: 0.21, wx: 0.21, wy: 0.29 }; // Mitte, Amplitude (× Rahmenhöhe), Tempo

// Platin #cdbfa8 nur angedeutet: das Licht ist warm, die Schatten bleiben neutral
const LAMP_COL = new THREE.Color(1.045, 0.99, 0.9);
const TUNGSTEN = new THREE.Color(1.1, 0.83, 0.58); // Glühwendel beim Einschalten

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Fester Zufall, damit Staub und Bokeh bei jedem Laden gleich liegen
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class HeroScene {
  constructor(canvas, { imageUrl, getFrame, mobile = false, reduced = false } = {}) {
    this.canvas = canvas;
    this.imageUrl = imageUrl;
    this.getFrame = getFrame;
    this.mobile = mobile;
    this.reduced = reduced;

    this.inView = true;
    this.running = false;
    this.time = 0;
    this.scroll = 0;
    this.w = 1;
    this.h = 1;

    // Das Intro steuert nur diese zwei Werte; playIntro darf auch vor init kommen
    this.intro = { power: 0, warm: 0 };

    this.touchFirst =
      mobile || (!window.matchMedia('(pointer: fine)').matches && navigator.maxTouchPoints > 0);
    this.pointer = { x: 0, y: 0 };
    this.hasPointer = false;
    this.touching = false;
    this.lastInput = this.touchFirst ? -Infinity : performance.now();
    this.idleW = this.touchFirst && !reduced ? 1 : 0;
    this.wanderT = 0;
    this.light = { x: 0, y: 0 };
    this.lightOut = { x: 0, y: 0 };
    this.lamp = { R: 400, H: 220, ell: 1.12 };
  }

  async init() {
    if (!this.imageUrl) throw new Error('HeroScene: imageUrl fehlt');
    try {
      await this.setup();
    } catch (err) {
      this.dispose();
      throw err;
    }
  }

  async setup() {
    const renderer = (this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    }));
    renderer.setClearColor(0x0b0b0a, 1);
    this.dpr = Math.min(window.devicePixelRatio || 1, this.mobile ? 1.5 : 2);
    renderer.setPixelRatio(this.dpr);

    const tex = (this.tex = await new THREE.TextureLoader().loadAsync(this.imageUrl).catch(() => {
      throw new Error(`HeroScene: Bild nicht geladen (${this.imageUrl})`);
    }));
    if (this.disposed) throw new Error('HeroScene: während init entsorgt');
    tex.colorSpace = THREE.SRGBColorSpace; // Abtastung linear, gerechnet wird im Licht
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
    this.texW = tex.image.width;
    this.texH = tex.image.height;
    if (!this.texW || !this.texH) throw new Error('HeroScene: Bild ohne Maße');

    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quadGeo = new THREE.PlaneGeometry(2, 2);
    this.buildBackdrop();
    this.buildScene();
    this.buildDust();
    this.buildBokeh();

    this.onResize = () => this.queueResize();
    window.addEventListener('resize', this.onResize);
    this.ro = new ResizeObserver(this.onResize);
    this.ro.observe(this.canvas);
    document.fonts?.ready.then(() => this.renderer && this.queueResize());

    this.onPointer = (e) => {
      if (e.pointerType === 'touch') return;
      this.input(e.clientX, e.clientY);
    };
    this.onTouch = (e) => {
      const t = e.touches[0];
      if (!t) return;
      this.touching = true;
      this.input(t.clientX, t.clientY, 36);
    };
    this.onTouchEnd = (e) => {
      if (e.touches.length) return;
      this.touching = false;
      this.lastInput = performance.now();
    };
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    window.addEventListener('touchstart', this.onTouch, { passive: true });
    window.addEventListener('touchmove', this.onTouch, { passive: true });
    window.addEventListener('touchend', this.onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', this.onTouchEnd, { passive: true });

    this.onLost = (e) => {
      e.preventDefault();
      this.lost = true;
      this.stop();
    };
    this.onRestored = () => {
      this.lost = false;
      this.bgDirty = true;
      this.tex.needsUpdate = true;
      this.updateLoop();
    };
    this.canvas.addEventListener('webglcontextlost', this.onLost);
    this.canvas.addEventListener('webglcontextrestored', this.onRestored);

    this.resize();
    this.light.x = this.lightOut.x = this.start.x;
    this.light.y = this.lightOut.y = this.start.y;

    // Shader vorab übersetzen, damit der erste sichtbare Frame nicht ruckelt
    this.renderBackdrop();
    renderer.compile(this.scene, this.cam);
    this.render(0);

    this.io = new IntersectionObserver(([e]) => {
      this.inView = e.isIntersecting;
      this.updateLoop();
    });
    this.io.observe(this.canvas);
    this.onVisibility = () => this.updateLoop();
    document.addEventListener('visibilitychange', this.onVisibility);
    this.updateLoop();
  }

  buildBackdrop() {
    this.bgRT = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: false });
    this.bgMat = new THREE.ShaderMaterial({
      vertexShader: quadVert,
      fragmentShader: backdropFrag,
      uniforms: { uSize: { value: new THREE.Vector2(1, 1) } },
      depthTest: false,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(this.quadGeo, this.bgMat);
    quad.frustumCulled = false;
    this.bgScene = new THREE.Scene();
    this.bgScene.add(quad);
  }

  buildScene() {
    this.uniforms = {
      uBackdrop: { value: this.bgRT.texture },
      uTex: { value: this.tex },
      uRes: { value: new THREE.Vector2(1, 1) },
      uFrame: { value: new THREE.Vector4(0, 0, 1, 1) },
      uUv: { value: new THREE.Vector4(0, 0, 1, 1) },
      uTexSize: { value: new THREE.Vector2(this.texW, this.texH) },
      uFeather: { value: 0.17 },
      uSmooth: { value: 1 },
      uGlowLod: { value: Math.max(0, Math.log2(this.texW * 0.022)) },
      uGrain: { value: this.mobile ? 0.05 : 0.055 },
      uGrainSeed: { value: 0 },
      uBokeh: { value: Array.from({ length: BOKEH }, () => new THREE.Vector4()) },
      uBokehN: { value: 0 },
      uLight: { value: new THREE.Vector2() },
      uLamp: { value: new THREE.Vector4(400, 220, 1.12, 0) },
      uLampCol: { value: LAMP_COL.clone() },
      // nur für den Staub
      uTime: { value: 0 },
      uDpr: { value: this.dpr },
      uScale: { value: 1 },
    };
    this.sceneMat = new THREE.ShaderMaterial({
      vertexShader: quadVert,
      fragmentShader: sceneFrag,
      uniforms: this.uniforms,
      depthTest: false,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(this.quadGeo, this.sceneMat);
    quad.frustumCulled = false;
    this.scene = new THREE.Scene();
    this.scene.add(quad);
  }

  buildDust() {
    const n = this.mobile ? 200 : 420;
    const r = rng(7);
    const seeds = new Float32Array(n * 4);
    for (let i = 0; i < n * 4; i++) seeds[i] = r();
    this.dustGeo = new THREE.BufferGeometry();
    // position wird nicht gelesen, braucht three aber für die Anzahl
    this.dustGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    this.dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    this.dustMat = new THREE.ShaderMaterial({
      vertexShader: dustVert,
      fragmentShader: dustFrag,
      uniforms: this.uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(this.dustGeo, this.dustMat);
    dust.frustumCulled = false;
    dust.renderOrder = 1;
    this.scene.add(dust);
  }

  buildBokeh() {
    const r = rng(23);
    this.bokeh = Array.from({ length: BOKEH }, () => ({
      x: 0.06 + r() * 0.88,
      y: 0.06 + r() * 0.88,
      size: 0.4 + r() * 0.6,
      alpha: 0.5 + r() * 0.5,
      fx: 0.03 + r() * 0.05,
      fy: 0.025 + r() * 0.045,
      px: r() * 6.28,
      py: r() * 6.28,
    }));
  }

  // -------------------------------------------------------------------------
  //  Maße: Canvas und Platzhalter, daraus Lichtgröße, Startpunkt und Bahn
  // -------------------------------------------------------------------------
  queueResize() {
    if (this.resizeQueued) return;
    this.resizeQueued = true;
    requestAnimationFrame(() => {
      this.resizeQueued = false;
      if (this.renderer) this.resize();
    });
  }

  resize() {
    const c = this.canvas.getBoundingClientRect();
    const w = (this.w = Math.max(1, c.width || window.innerWidth));
    const h = (this.h = Math.max(1, c.height || window.innerHeight));

    // Rahmen relativ zum Canvas; ohne Platzhalter eine sinnvolle Annahme
    const ia = this.texW / this.texH;
    let f = this.getFrame?.();
    if (f && f.width > 2 && f.height > 2) {
      f = { x: f.left - c.left, y: f.top - c.top, w: f.width, h: f.height };
    } else {
      const fh = h * (this.mobile ? 0.52 : 0.74);
      const fw = fh * ia;
      f = this.mobile ? { x: (w - fw) / 2, y: h * 0.1, w: fw, h: fh } : { x: w * 0.55, y: h * 0.13, w: fw, h: fh };
    }
    // Auf dem Handy feuert resize auch beim Ein- und Ausfahren der Adressleiste: nichts tun, wenn alles gleich bleibt
    const key = [w, h, f.x, f.y, f.w, f.h].map(Math.round).join();
    if (key === this.sizeKey) return;
    this.sizeKey = key;
    this.renderer.setSize(w, h, false);
    this.frame = f;
    const u = this.uniforms;
    u.uRes.value.set(w, h);
    u.uFrame.value.set(f.x, f.y, f.w, f.h);

    // Bild füllt den Rahmen wie object-fit: cover
    const fa = f.w / f.h;
    if (fa > ia) u.uUv.value.set(0, (1 - ia / fa) / 2, 1, ia / fa);
    else u.uUv.value.set((1 - fa / ia) / 2, 0, fa / ia, 1);
    // kleines Bild: weich vergrößern; großes Bild: normale Mip-Abtastung
    u.uSmooth.value = (f.w * this.dpr) / (this.texW * u.uUv.value.z) > 1.05 ? 1 : 0;

    // Licht wächst mit dem Portrait, nie kleiner als ein Drittel der kurzen Seite
    const base = Math.max(f.h, Math.min(w, h) * 0.38);
    this.lamp.R = base * 0.74;
    this.lamp.H = base * 0.4;
    u.uScale.value = Math.min(1.4, Math.max(0.6, Math.min(w, h) / 900));
    this.bokehScale = u.uScale.value;

    this.start = { x: f.x + START.x * f.w, y: f.y + START.y * f.h };
    this.pathC = { x: f.x + PATH.x * f.w, y: f.y + PATH.y * f.h };
    this.pathA = { x: PATH.ax * f.h, y: PATH.ay * f.h };
    // Phasen so, dass die Bahn beim Startpunkt beginnt
    this.phase = {
      x: Math.asin(Math.max(-1, Math.min(1, (this.start.x - this.pathC.x) / this.pathA.x))),
      y: Math.asin(Math.max(-1, Math.min(1, (this.start.y - this.pathC.y) / this.pathA.y))),
    };
    if (!this.hasPointer && this.wanderT === 0) {
      this.light.x = this.start.x;
      this.light.y = this.start.y;
    }

    const bf = 0.5;
    this.bgRT.setSize(Math.max(2, Math.round(w * bf)), Math.max(2, Math.round(h * bf)));
    this.bgMat.uniforms.uSize.value.set(w, h);
    this.bgDirty = true;
  }

  // -------------------------------------------------------------------------
  //  Eingabe und Lichtführung
  // -------------------------------------------------------------------------
  // lift: beim Finger steht das Licht etwas darüber, sonst verdeckt ihn die Hand
  input(cx, cy, lift = 0) {
    const r = this.canvas.getBoundingClientRect();
    const x = cx - r.left;
    const y = cy - r.top;
    if (y < -r.height * 0.25 || y > r.height * 1.25) return;
    this.pointer.x = Math.min(r.width * 1.1, Math.max(-r.width * 0.1, x));
    this.pointer.y = y - lift;
    this.hasPointer = true;
    this.lastInput = performance.now();
  }

  pathAt(t) {
    return {
      x: this.pathC.x + this.pathA.x * Math.sin(t * PATH.wx + this.phase.x),
      y: this.pathC.y + this.pathA.y * Math.sin(t * PATH.wy + this.phase.y),
    };
  }

  updateLight(dt, now) {
    const S = this.start;
    let bx = S.x, by = S.y;
    if (this.hasPointer) {
      // reduziert: die Maus verschiebt das Licht nur ein Stück
      const k = this.reduced ? 0.3 : 1;
      bx = S.x + (this.pointer.x - S.x) * k;
      by = S.y + (this.pointer.y - S.y) * k;
    }
    let tx = bx, ty = by;
    if (!this.reduced) {
      const idle = !this.touching && (now - this.lastInput) / 1000 > (this.touchFirst ? 2.5 : 4);
      this.idleW += ((idle ? 1 : 0) - this.idleW) * (1 - Math.exp(-dt / 1.1));
      if (idle) this.wanderT += dt;
      const p = this.pathAt(this.wanderT);
      tx += (p.x - bx) * this.idleW;
      ty += (p.y - by) * this.idleW;
    }
    // Ein schweres Stativlicht: folgt weich, nie ruckartig
    const ease = 1 - Math.exp(-dt * (this.reduced ? 2.2 : 3.6));
    this.light.x += (tx - this.light.x) * ease;
    this.light.y += (ty - this.light.y) * ease;
    // Beim Wegscrollen wandert das Licht nach oben
    this.lightOut.x = this.light.x;
    this.lightOut.y = this.light.y - this.scroll * 0.35 * this.h;
  }

  // gleiche Formel wie lamp() im Shader, für Bokeh
  lampAt(x, y, spread) {
    const dx = (x - this.lightOut.x) / this.lamp.ell;
    const dy = y - this.lightOut.y;
    const r2 = dx * dx + dy * dy;
    const hh = this.lamp.H * spread;
    const k = 1 / Math.sqrt(1 + r2 / (hh * hh));
    return k * k * k * (1 - smooth(0.18, 1.12, Math.sqrt(r2) / (this.lamp.R * spread)));
  }

  setScroll(p) {
    this.scroll = Math.min(1, Math.max(0, p || 0));
  }

  // Einstelllicht geht an: Wendel glimmt kurz, zuckt, dann steht das Licht
  playIntro(gsap) {
    const o = this.intro;
    this.introTl?.kill();
    if (this.reduced) {
      this.introTl = gsap.to(o, { power: 1, warm: 0, duration: 0.9, ease: 'sine.out' });
      return this.introTl;
    }
    o.power = 0;
    o.warm = 1;
    this.introTl = gsap
      .timeline()
      .to(o, { power: 0.2, duration: 0.08, ease: 'power1.out' })
      .to(o, { power: 0.05, duration: 0.1, ease: 'power1.in' })
      .to(o, { power: 0.46, duration: 0.09, ease: 'power1.out' })
      .to(o, { power: 0.3, duration: 0.13, ease: 'sine.inOut' })
      .to(o, { power: 1, duration: 1.2, ease: 'power2.out' })
      .to(o, { warm: 0, duration: 1.45, ease: 'sine.out' }, 0.1);
    return this.introTl;
  }

  // -------------------------------------------------------------------------
  //  Schleife
  // -------------------------------------------------------------------------
  updateLoop() {
    const go = this.renderer && !this.lost && this.inView && !document.hidden;
    if (go && !this.running) this.startLoop();
    else if (!go && this.running) this.stop();
  }

  startLoop() {
    this.running = true;
    this.last = performance.now();
    this.perf = { warm: 0, ema: 1 / 60, slow: 0, steps: this.perf?.steps || 0 };
    this.renderer.setAnimationLoop((now) => {
      const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
      this.last = now;
      this.watchPerf(dt);
      this.render(dt);
    });
  }

  // Notbremse für schwache Geräte: läuft es dauerhaft unter ~45 fps, sinkt die Auflösung
  // in zwei Stufen bis DPR 1. Das Bild ist ohnehin weich, auffallen würde es kaum.
  watchPerf(dt) {
    const p = this.perf;
    if (this.dpr <= 1 || p.steps >= 2) return;
    p.warm += dt;
    if (p.warm < 2) return;
    p.ema += (dt - p.ema) * 0.05;
    p.slow = p.ema > 1 / 45 ? p.slow + dt : 0;
    if (p.slow < 2) return;
    p.steps++;
    p.warm = p.slow = 0;
    p.ema = 1 / 60;
    this.dpr = Math.max(1, this.dpr - 0.25);
    this.renderer.setPixelRatio(this.dpr);
    this.uniforms.uDpr.value = this.dpr;
    this.sizeKey = null;
    this.resize();
  }

  stop() {
    this.running = false;
    this.renderer?.setAnimationLoop(null);
  }

  renderBackdrop() {
    const r = this.renderer;
    r.setRenderTarget(this.bgRT);
    r.render(this.bgScene, this.cam);
    r.setRenderTarget(null);
    this.bgDirty = false;
  }

  render(dt) {
    const now = performance.now();
    if (!this.reduced) this.time += dt;
    this.updateLight(dt, now);

    const u = this.uniforms;
    const power = this.intro.power * (1 - 0.82 * this.scroll);
    u.uTime.value = this.time;
    u.uLight.value.set(this.lightOut.x, this.lightOut.y);
    u.uLamp.value.set(this.lamp.R, this.lamp.H, this.lamp.ell, power);
    u.uLampCol.value.copy(LAMP_COL).lerp(TUNGSTEN, this.intro.warm);
    u.uGrainSeed.value = this.reduced ? 7 : Math.floor(this.time * 24) % 113;

    // Bokeh: treibt kaum merklich, leuchtet nur dort, wo Licht hinfällt
    // (nur Scheiben mit sichtbarer Helligkeit gehen an den Shader)
    const t = this.time;
    let n = 0;
    for (let i = 0; i < BOKEH; i++) {
      const b = this.bokeh[i];
      const x = (b.x + Math.sin(t * b.fx + b.px) * 0.035) * this.w;
      const y = (b.y + Math.sin(t * b.fy + b.py) * 0.03) * this.h;
      const a = 0.0065 * b.alpha * power * this.lampAt(x, y, 1.3);
      if (a > 0.0002) u.uBokeh.value[n++].set(x, y, (24 + 62 * b.size) * this.bokehScale, a);
    }
    u.uBokehN.value = n;

    if (this.bgDirty) this.renderBackdrop();
    this.renderer.render(this.scene, this.cam);
  }

  dispose() {
    this.disposed = true;
    this.stop();
    this.introTl?.kill();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointer);
    window.removeEventListener('touchstart', this.onTouch);
    window.removeEventListener('touchmove', this.onTouch);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('touchcancel', this.onTouchEnd);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.canvas.removeEventListener('webglcontextlost', this.onLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onRestored);
    this.io?.disconnect();
    this.ro?.disconnect();
    this.quadGeo?.dispose();
    this.dustGeo?.dispose();
    this.bgMat?.dispose();
    this.sceneMat?.dispose();
    this.dustMat?.dispose();
    this.bgRT?.dispose();
    this.tex?.dispose();
    this.renderer?.dispose();
    this.renderer = null;
  }
}
