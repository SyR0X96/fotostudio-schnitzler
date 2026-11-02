// Shader für den Hero „Ins rechte Licht gerückt“.
// Alle Positionen in CSS-Pixeln, Ursprung oben links (wie im DOM).

// Das Studiolicht: Punktlicht in der Höhe über der Szene (cos/r², also
// (1 + r²/h²)^-1.5) mit weicher, leicht elliptischer Kegelkante.
// spread > 1 = weiter hinten (gemalter Hintergrund): Pool größer und flacher.
export const lampChunk = /* glsl */ `
uniform vec2 uLight;   // Lichtmitte
uniform vec4 uLamp;    // x: Kegelradius, y: Höhe, z: Ellipse (x-Streckung), w: Leistung
uniform vec3 uLampCol;

float lamp(vec2 p, float spread) {
  vec2 d = p - uLight;
  d.x /= uLamp.z;
  float r2 = dot(d, d);
  float h = uLamp.y * spread;
  float k = inversesqrt(1.0 + r2 / (h * h));
  float cone = 1.0 - smoothstep(0.18, 1.12, sqrt(r2) / (uLamp.x * spread));
  return k * k * k * cone;
}
`;

export const quadVert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

// Gemalter Studiohintergrund (Leinwand mit Wolken und Pinselstruktur).
// Wird nur bei Resize in halber Auflösung gerendert: ein Hintergrund bewegt sich nicht,
// lebendig wird er durch das wandernde Licht. Ausgabe ist nur die Helligkeit 0..1.
export const backdropFrag = /* glsl */ `
uniform vec2 uSize;
varying vec2 vUv;

float hash21(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p, int oct) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 6; i++) {
    if (i >= oct) break;
    v += a * vnoise(p); p = r * p * 2.03 + 17.1; a *= 0.5;
  }
  return v;
}
void main() {
  vec2 p = vUv * uSize / min(uSize.x, uSize.y) * 2.1;
  vec2 w = vec2(fbm(p * 0.9 + 3.1, 4), fbm(p * 0.9 + 8.7, 4));
  float clouds = fbm(p + w * 1.5, 5);                                  // große Wolken
  float dabs = fbm(p * 5.0 + w * 2.0, 4);                              // Tupfer der Malerei
  float strokes = fbm(vec2(p.x * 2.2 + w.y * 2.0, p.y * 9.0), 3);      // Pinselzüge, quer
  float a = 0.5 + (clouds - 0.5) * 1.45 + (dabs - 0.5) * 0.34 + (strokes - 0.5) * 0.16;
  gl_FragColor = vec4(vec3(clamp(a, 0.0, 1.0)), 1.0);
}
`;

export const BOKEH = 9;

// Hauptbild: Hintergrund, Portrait, Bokeh, Tonwerte, Vignette, Korn.
export const sceneFrag = /* glsl */ `
#define BOKEH ${BOKEH}
uniform sampler2D uBackdrop;
uniform sampler2D uTex;
uniform vec2 uRes;        // Canvas in CSS-Pixeln
uniform vec4 uFrame;      // Platzhalter: x, y, w, h
uniform vec4 uUv;         // Bildausschnitt im Rahmen (cover): Versatz xy, Skalierung zw
uniform vec2 uTexSize;
uniform float uFeather;   // weicher Rand der Maske, Anteil der kurzen Rahmenseite
uniform float uSmooth;    // 1 = Bild wird vergrößert: B-Spline statt bilinear
uniform float uGlowLod;   // Mip-Stufe für den Weichzeichner-Schein
uniform float uGrain;     // Kornstärke
uniform float uGrainSeed;
uniform vec4 uBokeh[BOKEH];
uniform int uBokehN;       // nur die gerade sichtbaren Scheiben
varying vec2 vUv;
${lampChunk}

float hash12(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }

// Kubischer B-Spline aus vier bilinearen Abfragen: weich wie ein Vergrößerungsobjektiv,
// ohne die Rauten und Treppen der bilinearen Vergrößerung.
float texSoft(vec2 uv) {
  vec2 st = uv * uTexSize - 0.5;
  vec2 i = floor(st), f = st - i;
  vec2 f2 = f * f, f3 = f2 * f;
  vec2 w0 = (-f3 + 3.0 * f2 - 3.0 * f + 1.0) / 6.0;
  vec2 w1 = (3.0 * f3 - 6.0 * f2 + 4.0) / 6.0;
  vec2 w2 = (-3.0 * f3 + 3.0 * f2 + 3.0 * f + 1.0) / 6.0;
  vec2 w3 = f3 / 6.0;
  vec2 g0 = w0 + w1, g1 = w2 + w3;
  vec2 h0 = (i - 0.5 + w1 / g0) / uTexSize;
  vec2 h1 = (i + 1.5 + w3 / g1) / uTexSize;
  float a = textureLod(uTex, h0, 0.0).r, b = textureLod(uTex, vec2(h1.x, h0.y), 0.0).r;
  float c = textureLod(uTex, vec2(h0.x, h1.y), 0.0).r, d = textureLod(uTex, h1, 0.0).r;
  return g0.y * (g0.x * a + g1.x * b) + g1.y * (g0.x * c + g1.x * d);
}

vec3 toSRGB(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  float power = uLamp.w;
  vec3 light = uLampCol * power;

  // Licht: vorne auf dem Portrait, hinten auf der Leinwand, dazu etwas Streulicht im Raum
  float E = lamp(p, 1.0);
  vec2 dl = p - uLight;
  float spill = exp(-dot(dl, dl) / (uLamp.x * uLamp.x * 4.0)) * 0.022;
  float Eb = lamp(p, 1.25) * 0.24 + spill;

  // Gemalter Hintergrund, sehr dunkles warmes Grau
  float canvasTone = texture2D(uBackdrop, vUv).r;
  vec3 bgAlb = vec3(0.105, 0.097, 0.087) * (0.42 + 0.8 * canvasTone);
  vec3 col = bgAlb * (0.028 + Eb * light);

  // Portrait im Rahmen, Ränder weich ins Dunkel
  vec2 q = (p - uFrame.xy) / uFrame.zw;
  vec2 e = min(q, 1.0 - q) * uFrame.zw / min(uFrame.z, uFrame.w);
  vec2 tuv = uUv.xy + q * uUv.zw;
  tuv.y = 1.0 - tuv.y;
  vec2 tdx = dFdx(tuv), tdy = dFdy(tuv);   // Ableitungen vor der Verzweigung (Mip-Wahl)
  if (e.x > 0.0 && e.y > 0.0) {
    vec2 m2 = smoothstep(0.0, uFeather, e);
    float mask = m2.x * m2.y;
    float alb;
    if (uSmooth > 0.5) alb = texSoft(tuv);
    else alb = textureGrad(uTex, tuv, tdx, tdy).r;
    // Weichzeichner: Lichter strahlen leicht in die Schatten (wie eine Softar-Scheibe)
    float halo = textureLod(uTex, tuv, uGlowLod).r;
    alb = max(alb, mix(alb, halo, 0.42));
    vec3 portrait = alb * (0.027 + E * light * 1.12);
    // Aufhellen statt Überdecken: Schwarz im Bild ist kein Rechteck, sondern das Dunkel
    // des Studios. Was im Bild dunkler ist als die Leinwand, verschwindet in ihr.
    col = mix(col, max(col, portrait), mask);
  }

  // Bokeh: große, sehr weiche Scheiben, Helligkeit kommt schon mit (nur im Licht)
  for (int i = 0; i < BOKEH; i++) {
    if (i >= uBokehN) break;
    vec4 b = uBokeh[i];
    float d = length(p - b.xy) / b.z;
    if (d >= 1.0) continue;
    float disc = (1.0 - smoothstep(0.3, 1.0, d)) * (0.85 + 0.15 * smoothstep(0.3, 0.8, d));
    col += uLampCol * b.w * disc;
  }

  // Vignette, dann filmische Schulter: Lichter laufen weich aus, nichts frisst aus
  vec2 v = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  col *= mix(0.62, 1.0, 1.0 - smoothstep(0.25, 1.15, length(v * vec2(0.85, 1.0))));
  col = 1.0 - exp(-col * 1.32);
  vec3 c = toSRGB(col);

  // Filmkorn, in den Mitteltönen am stärksten
  float l = dot(c, vec3(0.333));
  float g = hash12(gl_FragCoord.xy + uGrainSeed * vec2(41.7, 23.3)) - 0.5;
  c += g * uGrain * (0.38 + 2.4 * l * (1.0 - l));
  gl_FragColor = vec4(c, 1.0);
}
`;

// Staub im Licht: winzige Flocken treiben langsam, nahe Teilchen groß und unscharf.
export const dustVert = /* glsl */ `
uniform float uTime;
uniform vec2 uRes;
uniform float uDpr;
uniform float uScale;
attribute vec4 aSeed;   // xy: Startposition 0..1, z: Nähe 0..1, w: Zufall
varying float vA;
varying float vSoft;
${lampChunk}
void main() {
  float z = aSeed.z;
  float t = uTime * (0.55 + 0.7 * aSeed.w);
  vec2 s = aSeed.xy;
  s.y = fract(s.y - t * 0.0035 * (0.4 + z));
  s.x = fract(s.x + t * 0.0012 * (aSeed.w - 0.45));
  vec2 px = s * uRes;
  px += vec2(sin(t * 0.31 + aSeed.w * 40.0), cos(t * 0.23 + aSeed.x * 31.0)) * (5.0 + 16.0 * z) * uScale;
  float E = lamp(px, 1.0);
  // Flocken drehen sich und blitzen kurz auf
  float tw = 0.5 + 0.5 * sin(t * (0.9 + 2.2 * aSeed.w) + aSeed.x * 60.0);
  tw = 0.35 + 0.65 * tw * tw;
  vA = pow(E, 1.3) * tw * mix(0.9, 0.17, z) * uLamp.w;
  vSoft = z;
  gl_PointSize = mix(1.6, 7.5, z * z * z) * uScale * uDpr;
  gl_Position = vec4(px.x / uRes.x * 2.0 - 1.0, 1.0 - px.y / uRes.y * 2.0, 0.0, 1.0);
}
`;

export const dustFrag = /* glsl */ `
uniform vec3 uLampCol;
varying float vA;
varying float vSoft;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = (1.0 - smoothstep(mix(0.0, 0.45, vSoft), 1.0, d)) * vA;
  if (a < 0.002) discard;
  gl_FragColor = vec4(uLampCol * 0.92, a);
}
`;
