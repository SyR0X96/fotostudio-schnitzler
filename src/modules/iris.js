// ---------------------------------------------------------------------------
//  Kamerablende als SVG. Jede Lamelle ist die Fläche außerhalb einer Kante des
//  Blendenpolygons; zusammen decken sie alles außer der Öffnung ab. Beim Schließen
//  drehen sich die Lamellen leicht mit, wie bei einem echten Objektiv.
//  open: 0 = geschlossen, 1 = ganz offen (Lamellen außerhalb des Bildes)
// ---------------------------------------------------------------------------
const NS = 'http://www.w3.org/2000/svg';

export class Iris {
  constructor(svg, { blades = 7, twist = 0.9 } = {}) {
    this.svg = svg;
    this.n = blades;
    this.twist = twist;
    this.open = 1;
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.classList.add('iris');
    this.gBlades = document.createElementNS(NS, 'g');
    this.gSeams = document.createElementNS(NS, 'g');
    this.rim = document.createElementNS(NS, 'path');
    this.gBlades.setAttribute('class', 'iris__blades');
    this.gSeams.setAttribute('class', 'iris__seams');
    this.rim.setAttribute('class', 'iris__rim');
    this.blades = Array.from({ length: this.n }, () => this.gBlades.appendChild(document.createElementNS(NS, 'path')));
    this.seams = Array.from({ length: this.n }, () => this.gSeams.appendChild(document.createElementNS(NS, 'path')));
    svg.append(this.gBlades, this.gSeams, this.rim);
    this.resize();
  }

  resize() {
    const r = this.svg.getBoundingClientRect();
    this.w = r.width || window.innerWidth;
    this.h = r.height || window.innerHeight;
    this.svg.setAttribute('viewBox', `0 0 ${this.w} ${this.h}`);
    // Radius, ab dem das Polygon den ganzen Ausschnitt freigibt
    this.R = Math.hypot(this.w, this.h) / 2 / Math.cos(Math.PI / this.n) + 4;
    this.set(this.open);
  }

  set(open) {
    this.open = open;
    const { n, w, h, R } = this;
    const cx = w / 2, cy = h / 2;
    const r = Math.max(0, open) * R;
    const L = R * 2.6;
    const rot = -Math.PI / 2 + (1 - Math.min(open, 1)) * this.twist;
    const f = (v) => v.toFixed(1);
    const V = Array.from({ length: n }, (_, i) => {
      const a = rot + (i / n) * Math.PI * 2;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    });
    let rim = '';
    for (let i = 0; i < n; i++) {
      // Kantenrichtung u und Normale o nach außen – auch bei r = 0 eindeutig
      const th = rot + (i / n) * Math.PI * 2 + Math.PI / 2 + Math.PI / n;
      const ux = Math.cos(th), uy = Math.sin(th);
      const ox = Math.sin(th), oy = -Math.cos(th);
      const [x, y] = V[i];
      this.blades[i].setAttribute('d', `M${f(x)} ${f(y)}L${f(x + ux * L)} ${f(y + uy * L)}L${f(x + ux * L + ox * L)} ${f(y + uy * L + oy * L)}L${f(x + ox * L)} ${f(y + oy * L)}Z`);
      // Fuge zur nächsten Lamelle: Verlängerung der Kante über die Ecke hinaus
      const [nx, ny] = V[(i + 1) % n];
      this.seams[i].setAttribute('d', `M${f(nx)} ${f(ny)}L${f(nx + ux * L)} ${f(ny + uy * L)}`);
      rim += `${i ? 'L' : 'M'}${f(x)} ${f(y)}`;
    }
    this.rim.setAttribute('d', `${rim}Z`);
    this.svg.style.visibility = open >= 1 ? 'hidden' : 'visible';
  }
}
