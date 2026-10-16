// Low poly pieces in the style of the first PlayStation: a VHS tape (the opening), a basketball (the
// projects), a d20 and a jack-o'-lantern (the skills), a game cartridge (this site), João's goat (the end) and
// a figure in the fog (the footer). Drawn at half the resolution and scaled up without smoothing, vertices
// snapped to the screen grid, textures mapped without perspective correction (affine), ordered dithering
// and 15-bit colour; textures are tiny canvases read with nearest filtering. three.js loads only when a
// piece is about to be on screen, and each loop stops while its piece is off screen.
const VERTEX = `
uniform vec2 uGrid;
varying vec3 vUvw;
varying vec3 vColor;
varying float vShade;
varying float vDepth;
void main() {
  vec4 view = modelViewMatrix * vec4(position, 1.0);
  vec4 p = projectionMatrix * view;
  p.xy = floor(p.xy / p.w * uGrid + 0.5) / uGrid * p.w;
  gl_Position = p;
  vUvw = vec3(uv * p.w, p.w);
  vDepth = -view.z;
  #ifdef USE_COLOR
  vColor = color;
  #else
  vColor = vec3(1.0);
  #endif
  vec3 n = normalize(normalMatrix * normal);
  vShade = 0.42 + 0.58 * max(dot(n, normalize(vec3(0.4, 0.7, 0.6))), 0.0);
}`;
// A texel at half alpha glows: it skips the shading (the pumpkin's lit face).
const FRAGMENT = `
uniform sampler2D uMap;
uniform vec3 uFog;
uniform vec2 uFogRange;
varying vec3 vUvw;
varying vec3 vColor;
varying float vShade;
varying float vDepth;
float bayer(vec2 p) {
  int i = int(mod(p.x, 4.0)) + 4 * int(mod(p.y, 4.0));
  float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  return m[i] / 16.0;
}
void main() {
  vec4 t = texture2D(uMap, vUvw.xy / vUvw.z);
  vec3 c = t.rgb * vColor * mix(1.0, vShade, step(0.75, t.a));
  c = mix(c, uFog, smoothstep(uFogRange.x, uFogRange.y, vDepth));
  c += (bayer(gl_FragCoord.xy) - 0.5) / 31.0;
  gl_FragColor = vec4(floor(c * 31.0 + 0.5) / 31.0, 1.0);
}`;
const INK = '#0e0c12', PAPER = '#f4eee3', ORANGE = '#ff6a1f', PURPLE = '#6a3bf0', GREEN = '#2bd67b';
const PALETTE = [ORANGE, PURPLE, GREEN, PAPER];

function canvasTexture(THREE, draw, w = 128, h = 64) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;   // the shader writes the canvas colours as they are: no colour-space conversion
  return tex;
}
const flat = (THREE, hex = '#fff') => canvasTexture(THREE, (g) => { g.fillStyle = hex; g.fillRect(0, 0, 4, 4); }, 4, 4);

// One colour on every vertex, faces kept flat (each triangle its own normal: the faceted PS1 look).
function paint(THREE, geo, hex) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.computeVertexNormals();
  const c = new THREE.Color().setStyle(hex, THREE.LinearSRGBColorSpace);   // as written: the shader does no colour management
  g.setAttribute('color', new THREE.Float32BufferAttribute(Array.from({ length: g.attributes.position.count }, () => [c.r, c.g, c.b]).flat(), 3));
  return g;
}

// ---------- the pieces ----------
function vhs(THREE, material, { label }) {
  const front = canvasTexture(THREE, (g, w, h) => {
    g.fillStyle = '#1c1a20';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a2730';
    g.fillRect(4, 4, w - 8, h - 8);
    g.fillStyle = ORANGE;   // the label-maker strip
    g.fillRect(8, 7, w - 16, 17);
    g.fillStyle = PAPER;
    g.font = 'bold 11px monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(label, w / 2, 16, w - 26);
    g.fillStyle = '#0e0c12';   // the window and its two reels
    g.fillRect(24, 30, w - 48, 22);
    g.fillStyle = PURPLE;
    for (const x of [44, w - 44]) {
      g.beginPath();
      g.arc(x, 41, 8, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = PAPER;
    for (const x of [44, w - 44]) g.fillRect(x - 2, 39, 4, 4);
    g.fillStyle = GREEN;
    g.fillRect(56, 37, w - 112, 8);
  });
  const plastic = canvasTexture(THREE, (g, w, h) => {
    g.fillStyle = '#25222b';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#1c1a20';
    for (let y = 2; y < h; y += 6) g.fillRect(0, y, w, 2);
  }, 32, 32);
  const side = material(plastic), face = material(front);
  // BoxGeometry's faces: +x, -x, +y, -y, +z (the front, with the label), -z
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.9, 0.5), [side, side, side, side, face, side]);
  mesh.rotation.set(-0.25, -0.5, 0.08);
  return { mesh, z: 6, idle: (m, t, lean) => {
    m.rotation.x += (-0.25 + lean.x + Math.sin(t / 1700) * 0.12 - m.rotation.x) * 0.05;
    m.rotation.y = -0.5 + Math.sin(t / 2600) * 0.9 + lean.y;
    m.position.y = Math.sin(t / 900) * 0.08;
  } };
}

// A real d20: twenty numbered faces in the page's colours, opposite faces adding up to 21. target(n) is the
// turn that shows face n to the camera with its number upright.
function d20(THREE, material) {
  const geo = new THREE.IcosahedronGeometry(1.5, 0);   // twenty separate triangles
  const pos = geo.attributes.position, n = pos.count / 3;
  const corners = (f) => [0, 1, 2].map((k) => new THREE.Vector3().fromBufferAttribute(pos, f * 3 + k));
  const normal = (f) => { const [a, b, c] = corners(f); return b.sub(a).cross(c.sub(a)).normalize(); };
  const num = new Array(n).fill(0);
  for (let f = 0, next = 1; f < n; f++) {
    if (num[f]) continue;
    const back = num.findIndex((v, h) => !v && h !== f && normal(h).dot(normal(f)) < -0.99);
    num[f] = next;
    num[back] = 21 - next++;
  }
  // One 64px cell per face in a 5x4 atlas; the triangle's third corner is the top of its number.
  const C = 64, A = [[0.1, 0.12], [0.9, 0.12], [0.5, 0.95]];
  const atlas = canvasTexture(THREE, (g) => {
    g.font = 'bold 23px monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (let f = 0; f < n; f++) {
      const x = (f % 5) * C, y = Math.floor(f / 5) * C, colour = PALETTE[f % 4];
      g.fillStyle = colour;
      g.fillRect(x, y, C, C);
      g.fillStyle = colour === PURPLE ? PAPER : INK;
      g.fillText(num[f] === 6 || num[f] === 9 ? `${num[f]}.` : String(num[f]), x + C / 2, y + C * 0.62);
    }
  }, 5 * C, 4 * C);
  const uv = [];
  for (let f = 0; f < n; f++) for (const [u, v] of A) uv.push(((f % 5) + u) / 5, 1 - (Math.floor(f / 5) + 1 - v) / 4);
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const mesh = new THREE.Mesh(geo, material(atlas));
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x0e0c12 })));
  mesh.rotation.set(0.5, 0.4, 0);
  const lean = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.28, -0.22, 0));   // seen a bit from above
  const target = (k) => {
    const f = num.indexOf(k), [a, b, c] = corners(f), N = normal(f);
    const U = c.clone().sub(a.add(b).add(c).divideScalar(3)).normalize();
    const m = new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(U, N), U, N).transpose();
    return new THREE.Quaternion().setFromRotationMatrix(m).premultiply(lean);
  };
  return { mesh, z: 6, target, idle: (m, t, l) => {
    m.rotation.x += (0.5 + l.x - m.rotation.x) * 0.05;
    m.rotation.y += 0.004 + l.y * 0.01;
  } };
}

// A basketball: an orange sphere of few faces with its black seams painted on a 64x32 texture.
function ball(THREE, material) {
  const skin = canvasTexture(THREE, (g, w, h) => {
    g.fillStyle = ORANGE;
    g.fillRect(0, 0, w, h);
    g.fillStyle = INK;
    for (const x of [0, w / 4, w / 2, (3 * w) / 4]) g.fillRect(x, 0, 2, h);
    g.fillRect(0, h / 2 - 1, w, 2);
    for (let x = 0; x < w; x++) {
      g.fillRect(x, Math.round(h / 2 + Math.sin((x / w) * Math.PI * 4) * (h / 3)), 1, 2);
    }
  }, 64, 32);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 7), material(skin));
  mesh.rotation.set(0.3, 0, 0.2);
  return { mesh, z: 5.5, idle: (m, t) => {
    m.rotation.y = t / 1800;
    m.position.y = Math.abs(Math.sin(t / 500)) * 0.35 - 0.15;
  } };
}

// A jack-o'-lantern: a ribbed sphere with a carved face that lights up (light(true)).
function pumpkin(THREE, material) {
  const face = (lit) => canvasTexture(THREE, (g, w, h) => {
    g.fillStyle = ORANGE;
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#c24c10';   // the grooves
    for (let x = 0; x < w; x += w / 12) g.fillRect(Math.round(x), 0, 2, h);
    const shape = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.fill(); };
    const carve = () => {   // u = 0.25 is the side that faces the camera
      shape([[18, 30], [27, 30], [23, 21]]);
      shape([[37, 30], [46, 30], [41, 21]]);
      shape([[30, 36], [34, 36], [32, 32]]);
      shape([[16, 39], [48, 39], [44, 46], [40, 42], [36, 47], [32, 42], [28, 47], [24, 42], [20, 46]]);
    };
    if (lit) {   // cut the face out, then fill it at half alpha: it glows
      g.globalCompositeOperation = 'destination-out';
      carve();
      g.globalCompositeOperation = 'source-over';
    }
    g.fillStyle = lit ? 'rgb(255 214 77 / .5)' : '#1a0b05';
    carve();
  });
  const dark = face(false), lit = face(true);
  const geo = new THREE.SphereGeometry(1.3, 12, 8);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {   // six lobes
    const k = 1 + 0.07 * Math.cos(6 * Math.atan2(p.getZ(i), p.getX(i)));
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * 0.78, p.getZ(i) * k);
  }
  const skin = material(dark);
  const body = new THREE.Mesh(paint(THREE, geo, '#ffffff'), skin);
  const stem = new THREE.Mesh(paint(THREE, new THREE.CylinderGeometry(0.1, 0.17, 0.5, 5), '#2f7a3a'), material(flat(THREE), true));
  stem.position.set(0.05, 1.08, 0);
  stem.rotation.z = -0.25;
  const mesh = new THREE.Group();
  mesh.add(body, stem);
  return { mesh, z: 6.2, light(on) { skin.uniforms.uMap.value = on ? lit : dark; }, idle: (m, t, l) => {
    m.rotation.y = Math.sin(t / 1600) * 0.3 + l.y;
    m.rotation.z = Math.sin(t / 1100) * 0.05;
    m.position.y = Math.sin(t / 800) * 0.06;
  } };
}

// A game cartridge with the portfolio's label.
function cartridge(THREE, material, { label }) {
  const front = canvasTexture(THREE, (g, w, h) => {
    g.fillStyle = '#9b97a6';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#86828f';   // the grip ridges at the bottom
    for (let y = h - 14; y < h - 2; y += 4) g.fillRect(10, y, w - 20, 2);
    g.fillStyle = INK;
    g.fillRect(9, 8, w - 18, h - 30);
    g.fillStyle = PURPLE;
    g.fillRect(11, 10, w - 22, h - 34);
    g.fillStyle = ORANGE;
    g.fillRect(11, 10, w - 22, 12);
    g.fillStyle = INK;
    g.font = 'bold 9px monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('CABRAL', w / 2, 16, w - 28);
    g.fillStyle = PAPER;
    g.font = 'bold 10px monospace';
    g.fillText(label, w / 2, 40, w - 28);
    g.fillStyle = GREEN;
    g.fillRect(w / 2 - 12, 52, 24, 4);
  }, 64, 96);
  const plastic = material(flat(THREE, '#8a8694'));
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 0.35), [plastic, plastic, plastic, plastic, material(front), plastic]);
  return { mesh, z: 6.5, idle: (m, t, l) => {
    m.rotation.y = -0.35 + Math.sin(t / 2100) * 0.45 + l.y;
    m.rotation.x = -0.1 + l.x;
    m.rotation.z = Math.sin(t / 1500) * 0.06;
    m.position.y = Math.sin(t / 950) * 0.1;
  } };
}

// João's goat in 3D, after his pixel art: white fur, curled horns, glasses, brown jacket, jeans, waving.
function goat(THREE, material) {
  const mat = material(flat(THREE), true);
  const part = (geo, hex, [x, y, z], parent, rot) => {
    const m = new THREE.Mesh(paint(THREE, geo, hex), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(...rot);
    parent.add(m);
    return m;
  };
  const Box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const FUR = '#ebebeb', JACKET = '#853700', JEANS = '#1d3561', HORN = '#613e2f', DARK = '#16131a';
  const body = new THREE.Group();
  for (const s of [-1, 1]) {
    part(Box(0.44, 0.22, 0.62), DARK, [s * 0.28, 0.11, 0.08], body);
    part(Box(0.36, 1.1, 0.4), JEANS, [s * 0.28, 0.76, 0], body);
  }
  part(Box(1.15, 1.25, 0.66), JACKET, [0, 1.92, 0], body);
  part(Box(0.4, 0.45, 0.06), FUR, [0, 2.3, 0.31], body);   // the shirt in the open collar
  part(Box(0.3, 1.05, 0.34), JACKET, [-0.74, 1.86, 0], body);
  part(Box(0.28, 0.24, 0.28), FUR, [-0.74, 1.22, 0], body);
  const wave = new THREE.Group();   // the right arm, from the shoulder
  wave.position.set(0.74, 2.4, 0);
  body.add(wave);
  part(Box(0.34, 1.0, 0.38), JACKET, [0, 0.45, 0], wave);
  part(Box(0.32, 0.3, 0.3), FUR, [0, 1.08, 0], wave);
  const head = new THREE.Group();
  head.position.set(0, 3.15, 0.05);
  body.add(head);
  part(new THREE.SphereGeometry(0.68, 7, 5), FUR, [0, 0, 0], head).scale.set(0.95, 1.05, 0.9);
  part(Box(0.5, 0.36, 0.4), '#d6d3d0', [0, -0.24, 0.52], head);
  part(Box(0.22, 0.1, 0.06), '#402920', [0, -0.13, 0.73], head);
  part(new THREE.ConeGeometry(0.15, 0.42, 4), HORN, [0, -0.7, 0.44], head, [Math.PI, 0, 0]);   // the beard
  for (const s of [-1, 1]) {
    part(Box(0.09, 0.09, 0.04), INK, [s * 0.21, 0.1, 0.62], head);
    part(new THREE.TorusGeometry(0.17, 0.035, 4, 8), '#e2c27e', [s * 0.22, 0.1, 0.66], head);
    part(new THREE.ConeGeometry(0.12, 0.42, 4), FUR, [s * 0.76, 0.05, -0.05], head, [0, 0, -s * (Math.PI / 2 + 0.35)]);   // ears
    part(new THREE.TorusGeometry(0.26, 0.1, 4, 8, Math.PI * 1.4), HORN, [s * 0.5, 0.58, -0.05], head, [0, s * 0.45, s > 0 ? -0.59 * Math.PI : 0.19 * Math.PI]);   // curled, the open side towards the head
  }
  part(Box(0.12, 0.03, 0.03), '#e2c27e', [0, 0.12, 0.66], head);
  body.position.y = -2.05;
  const mesh = new THREE.Group();
  mesh.add(body);
  return { mesh, z: 8.5, idle: (m, t, l) => {
    body.position.y = -2.05 + Math.abs(Math.sin(t / 420)) * 0.06;
    wave.rotation.z = -0.25 + Math.sin(t / 230) * 0.4;
    head.rotation.z = Math.sin(t / 900) * 0.06;
    head.rotation.y = l.y * 0.8;
    m.rotation.y = -0.25 + Math.sin(t / 2400) * 0.2 + l.y * 0.4;
  } };
}

// The footer: a dead forest in the fog and a tall figure standing in it, a little closer on every visit.
function fog(THREE, material, { visits = 1 }) {
  const mesh = new THREE.Group();
  const groundTex = canvasTexture(THREE, (g, w, h) => {
    g.fillStyle = '#17151c';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#211e28';
    for (let i = 0; i < 90; i++) g.fillRect((i * 37) % w, (i * 53) % h, 2, 1);
  }, 32, 32);
  groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
  const plane = new THREE.PlaneGeometry(80, 80, 16, 16);
  const uv = plane.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 24, uv.getY(i) * 24);
  const ground = new THREE.Mesh(plane, material(groundTex));
  ground.rotation.x = -Math.PI / 2;
  mesh.add(ground);
  const mat = material(flat(THREE), true);
  const part = (geo, hex, [x, y, z], parent = mesh) => {
    const m = new THREE.Mesh(paint(THREE, geo, hex), mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  [[-3.2, -6], [4.1, -9], [-6.5, -13], [2.6, -16], [7.4, -19], [-2.4, -22], [-9, -24], [5.5, -27], [0.4, -31]].forEach(([x, z], i) => {
    part(new THREE.CylinderGeometry(0.07, 0.15, 5, 5), '#24202b', [x, 2.5, z]).rotation.z = ((i % 3) - 1) * 0.05;
  });
  const figure = new THREE.Group();
  figure.position.set(0.7, 0, -Math.max(4, 16 - 2 * (visits - 1)));
  mesh.add(figure);
  const SUIT = '#1d1a24';
  for (const s of [-1, 1]) {
    part(new THREE.BoxGeometry(0.15, 1.15, 0.17), SUIT, [s * 0.12, 0.58, 0], figure);
    part(new THREE.BoxGeometry(0.1, 1.1, 0.12), SUIT, [s * 0.33, 1.3, 0], figure);   // arms down to the knees
  }
  part(new THREE.BoxGeometry(0.52, 0.85, 0.26), SUIT, [0, 1.58, 0], figure);
  part(new THREE.SphereGeometry(0.17, 6, 4), '#cfc8bd', [0, 2.18, 0], figure);
  return {
    mesh, camera: { fov: 50, pos: [0, 1.5, 4], look: [0, 1.25, -12] }, fog: [4, 34],
    idle: (m, t) => { figure.rotation.z = Math.sin(t / 2300) * 0.012; },
  };
}

const PIECES = { vhs, d20, ball, pumpkin, cartridge, goat, fog };

// Mounts a piece in `el`. Returns { stop, roll(n), light(on) }: roll spins the d20 and lands it on n;
// light turns the pumpkin's face on.
export function mountPS1(el, opts) {
  const api = { stop() {}, roll() {}, light() {} };
  let gone = false;
  const io = new IntersectionObserver(async ([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    try {
      const THREE = await import('three');
      if (!gone) Object.assign(api, start(THREE, el, opts));
    } catch { /* no WebGL or no network: the space stays empty */ }
  }, { rootMargin: '300px' });
  io.observe(el);
  return {
    stop() { gone = true; io.disconnect(); api.stop(); },
    roll(n) { api.roll(n); },
    light(on) { api.light(on); },
  };
}

function start(THREE, el, { reduced, kind, ...opts }) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(1);
  el.append(renderer.domElement);
  const scene = new THREE.Scene();
  const grid = new THREE.Vector2(80, 80);
  const fogRange = new THREE.Vector2(1e4, 2e4), fogColour = new THREE.Vector3(14 / 255, 12 / 255, 18 / 255);
  const material = (map, vertexColors = false) => new THREE.ShaderMaterial({
    uniforms: { uMap: { value: map }, uGrid: { value: grid }, uFog: { value: fogColour }, uFogRange: { value: fogRange } },
    vertexShader: VERTEX, fragmentShader: FRAGMENT, vertexColors,
  });
  const piece = PIECES[kind](THREE, material, opts);
  const cam = piece.camera ?? { fov: 30, pos: [0, 0, piece.z], look: [0, 0, 0] };
  const camera = new THREE.PerspectiveCamera(cam.fov, 1, 0.1, 100);
  camera.position.set(...cam.pos);
  camera.lookAt(...cam.look);
  if (piece.fog) fogRange.set(...piece.fog);
  scene.add(piece.mesh);

  const draw = () => renderer.render(scene, camera);
  const size = () => {
    const w = el.clientWidth || 1, h = el.clientHeight || 1;
    renderer.setSize(Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 2)), false);   // half the pixels
    grid.set(w / 4, h / 4);   // half the low-res buffer: vertices jump a pixel or two at a time
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(() => { size(); draw(); });
  ro.observe(el);
  size();
  draw();
  const m = piece.mesh;
  const light = (on) => { piece.light?.(on); draw(); };
  if (reduced) {
    return {
      stop() { ro.disconnect(); renderer.dispose(); },
      roll(n) { if (piece.target) { m.quaternion.copy(piece.target(n)); draw(); } },
      light,
    };
  }

  // A roll: tumbling that slows down, then a turn onto the face that came up, and a little bounce.
  let lean = { x: 0, y: 0 }, on = true, raf = 0, last = 0, roll = null, rest = null;
  const point = (e) => { lean = { x: (e.clientY / innerHeight - 0.5) * 0.5, y: (e.clientX / innerWidth - 0.5) * 0.6 }; };
  addEventListener('pointermove', point, { passive: true });
  const seen = new IntersectionObserver(([e]) => { on = e.isIntersecting; });
  seen.observe(el);
  const spin = new THREE.Quaternion(), axis = new THREE.Vector3(), wobble = new THREE.Quaternion(), euler = new THREE.Euler();
  const loop = (t) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(50, t - (last || t));
    last = t;
    if (!on) return;
    if (roll) {
      roll.t += dt;
      if (roll.t < 650) {
        const k = 1 - roll.t / 1100;
        m.quaternion.premultiply(spin.setFromAxisAngle(axis.copy(roll.axis), 0.03 * dt * k));
        m.position.y = Math.abs(Math.sin(roll.t / 120)) * 0.5 * k;
      } else {
        roll.from ??= m.quaternion.clone();
        const k = Math.min(1, (roll.t - 650) / 450);
        m.quaternion.slerpQuaternions(roll.from, roll.to, 1 - (1 - k) ** 3);
        m.position.y = Math.abs(Math.sin(k * Math.PI * 2)) * 0.18 * (1 - k);
        if (k === 1) { rest = roll.to; roll = null; }
      }
    } else if (rest) {
      m.quaternion.copy(rest).multiply(wobble.setFromEuler(euler.set(Math.sin(t / 900) * 0.04 + lean.x * 0.2, Math.sin(t / 1300) * 0.05 + lean.y * 0.2, 0)));
    } else piece.idle(m, t, lean);
    draw();
  };
  raf = requestAnimationFrame(loop);
  return {
    stop() {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', point);
      seen.disconnect();
      ro.disconnect();
      renderer.dispose();
    },
    roll(n) {
      if (!piece.target) return;
      roll = { t: 0, to: piece.target(n), from: null, axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize() };
    },
    light,
  };
}
