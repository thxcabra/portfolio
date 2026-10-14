// The cast: shapes with eyes, each of a different material: a flat orange circle, a green star of grainy
// paper, a glossy purple blob and a pencil-line squiggle. Their pupils follow the pointer (the last tap on
// touch screens; idle, they look around) and they blink now and then. One loop serves every cast on the
// page and only moves the eyes on screen.
const BODIES = {
  circle: '<circle class="b-circle" cx="100" cy="100" r="88"/>',
  star: '<path class="b-star" d="M100 10 L124 72 L190 76 L138 116 L156 182 L100 144 L44 182 L62 116 L10 76 L76 72 Z"/>',
  blob: '<path class="b-blob" d="M104 12 C150 10 190 46 188 98 C186 150 150 190 98 188 C46 186 10 152 14 100 C18 52 58 14 104 12 Z"/>',
  squiggle: '<path class="b-squiggle" d="M18 128 C34 52 76 44 90 104 S 140 176 162 98 S 192 44 184 70"/>',
};
const EYES = { circle: [[74, 92], [126, 92]], star: [[84, 104], [116, 104]], blob: [[78, 88], [128, 92]], squiggle: [[70, 52], [100, 50]] };
const R = { circle: 15, star: 11, blob: 17, squiggle: 11 };   // eye radius, in the 200-unit box

// The grain and the gloss, once per page.
export const defs = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .5 0"/><feComposite in2="SourceGraphic" operator="in" result="g"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="g"/></feMerge></filter>
  <radialGradient id="gloss" cx=".34" cy=".3" r=".8"><stop offset="0" stop-color="#c3b0ff"/><stop offset=".42" stop-color="#6a3bf0"/><stop offset="1" stop-color="#26105f"/></radialGradient>
</defs></svg>`;

function char(kind) {
  const r = R[kind];
  const eyes = EYES[kind].map(([x, y]) => `<g transform="translate(${x} ${y})"><g class="eye" style="--blink:${(3.5 + Math.random() * 4).toFixed(2)}s;--delay:${(-Math.random() * 6).toFixed(2)}s">
    <ellipse class="white" rx="${r}" ry="${r * 1.15}"/><circle class="pupil" r="${r * 0.5}"/></g></g>`).join('');
  return `<svg class="char char-${kind}" viewBox="0 0 200 200">${BODIES[kind]}${eyes}</svg>`;
}

const eyes = new Set();   // { pupil, max, x, y, on }
let target = null, lastMove = 0, raf = 0, wander = 0;
function frame(now) {
  raf = requestAnimationFrame(frame);
  if (now - lastMove > 4000 && now > wander) {   // idle: look somewhere else every so often
    target = { x: Math.random() * innerWidth, y: Math.random() * innerHeight };
    wander = now + 1400 + Math.random() * 1600;
  }
  if (!target) return;
  for (const e of eyes) {
    if (!e.on) continue;
    const b = e.pupil.parentNode.getBoundingClientRect();
    const dx = target.x - (b.left + b.width / 2), dy = target.y - (b.top + b.height / 2);
    const d = Math.hypot(dx, dy) || 1, reach = Math.min(e.max, d / 40);
    e.x += ((dx / d) * reach - e.x) * 0.2;
    e.y += ((dy / d) * reach - e.y) * 0.2;
    e.pupil.setAttribute('transform', `translate(${e.x.toFixed(2)} ${e.y.toFixed(2)})`);
  }
}
const follow = (ev) => { target = { x: ev.clientX, y: ev.clientY }; lastMove = performance.now(); };
addEventListener('pointermove', follow, { passive: true });
addEventListener('pointerdown', follow, { passive: true });

// Draws `kinds` into `root`; with motion allowed, their eyes join the loop. Returns the undo.
export function mountCast(root, kinds, { reduced }) {
  root.innerHTML = kinds.map(char).join('');
  if (reduced) return () => {};
  const mine = [...root.querySelectorAll('.pupil')].map((pupil) => ({ pupil, max: Number(pupil.getAttribute('r')) * 0.9, x: 0, y: 0, on: false }));
  const io = new IntersectionObserver(([e]) => mine.forEach((m) => { m.on = e.isIntersecting; }));
  io.observe(root);
  mine.forEach((m) => eyes.add(m));
  if (!raf) raf = requestAnimationFrame(frame);
  return () => {
    io.disconnect();
    mine.forEach((m) => eyes.delete(m));
    if (!eyes.size) { cancelAnimationFrame(raf); raf = 0; }
  };
}
