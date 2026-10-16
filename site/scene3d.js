// Low poly pieces in the style of the first PlayStation: a VHS tape (the opening), a d20 (the skills) and a
// basketball (the projects). Drawn at half the resolution and scaled up without smoothing, vertices
// snapped to the screen grid, textures mapped without perspective correction (affine), ordered dithering
// and 15-bit colour; textures are tiny canvases read with nearest filtering. three.js loads only when a
// piece is about to be on screen, and each loop stops while its piece is off screen.
const VERTEX = `
uniform vec2 uGrid;
varying vec3 vUvw;
varying vec3 vColor;
varying float vShade;
void main() {
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  p.xy = floor(p.xy / p.w * uGrid + 0.5) / uGrid * p.w;
  gl_Position = p;
  vUvw = vec3(uv * p.w, p.w);
  #ifdef USE_COLOR
  vColor = color;
  #else
  vColor = vec3(1.0);
  #endif
  vec3 n = normalize(normalMatrix * normal);
  vShade = 0.42 + 0.58 * max(dot(n, normalize(vec3(0.4, 0.7, 0.6))), 0.0);
}`;
const FRAGMENT = `
uniform sampler2D uMap;
varying vec3 vUvw;
varying vec3 vColor;
varying float vShade;
float bayer(vec2 p) {
  int i = int(mod(p.x, 4.0)) + 4 * int(mod(p.y, 4.0));
  float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  return m[i] / 16.0;
}
void main() {
  vec3 c = texture2D(uMap, vUvw.xy / vUvw.z).rgb * vColor * vShade;
  c += (bayer(gl_FragCoord.xy) - 0.5) / 31.0;
  gl_FragColor = vec4(floor(c * 31.0 + 0.5) / 31.0, 1.0);
}`;
const PALETTE = ['#ff6a1f', '#6a3bf0', '#2bd67b', '#f4eee3'];

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

// ---------- the pieces ----------
function vhs(THREE, material, label) {
  const front = canvasTexture(THREE, (g, w, h) => {
    g.fillStyle = '#1c1a20';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a2730';
    g.fillRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#ff6a1f';   // the label-maker strip
    g.fillRect(8, 7, w - 16, 17);
    g.fillStyle = '#f4eee3';
    g.font = 'bold 11px monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(label, w / 2, 16, w - 26);
    g.fillStyle = '#0e0c12';   // the window and its two reels
    g.fillRect(24, 30, w - 48, 22);
    g.fillStyle = '#6a3bf0';
    for (const x of [44, w - 44]) {
      g.beginPath();
      g.arc(x, 41, 8, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#f4eee3';
    for (const x of [44, w - 44]) g.fillRect(x - 2, 39, 4, 4);
    g.fillStyle = '#2bd67b';
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

// A d20: twenty faces in the page's colours, with ink edges.
function d20(THREE, material) {
  const geo = new THREE.IcosahedronGeometry(1.5, 0);
  const colors = [];
  for (let f = 0; f < geo.attributes.position.count / 3; f++) {
    const c = new THREE.Color().setStyle(PALETTE[f % PALETTE.length], THREE.LinearSRGBColorSpace);   // as written: the shader does no colour management
    for (let v = 0; v < 3; v++) colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const white = canvasTexture(THREE, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 4, 4); }, 4, 4);
  const mesh = new THREE.Mesh(geo, material(white, true));
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x0e0c12 })));
  mesh.rotation.set(0.5, 0.4, 0);
  return { mesh, z: 6, idle: (m, t, lean) => {
    m.rotation.x += (0.5 + lean.x - m.rotation.x) * 0.05;
    m.rotation.y += 0.004 + lean.y * 0.01;
  } };
}

// A basketball: an orange sphere of few faces with its black seams painted on a 64x32 texture.
function ball(THREE, material) {
  const skin = canvasTexture(THREE, (g, w, h) => {
    g.fillStyle = '#ff6a1f';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#0e0c12';
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

const PIECES = { vhs, d20, ball };

// Mounts a piece in `el`. Returns { stop, roll }: roll() spins the d20 (or anything) for a moment.
export function mountPS1(el, { reduced, kind, label = '' }) {
  let api = { stop() {}, roll() {} };
  let gone = false;
  const io = new IntersectionObserver(async ([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    try {
      const THREE = await import('three');
      if (!gone) Object.assign(api, start(THREE, el, reduced, kind, label));
    } catch { /* no WebGL or no network: the space stays empty */ }
  }, { rootMargin: '300px' });
  io.observe(el);
  return {
    stop() { gone = true; io.disconnect(); api.stop(); },
    roll() { api.roll(); },
  };
}

function start(THREE, el, reduced, kind, label) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(1);
  el.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const grid = new THREE.Vector2(80, 80);
  const material = (map, vertexColors = false) => new THREE.ShaderMaterial({
    uniforms: { uMap: { value: map }, uGrid: { value: grid } }, vertexShader: VERTEX, fragmentShader: FRAGMENT, vertexColors,
  });
  const piece = PIECES[kind](THREE, material, label);
  camera.position.z = piece.z;
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
  let spin = 0;   // ms left of a roll
  if (reduced) return { stop() { ro.disconnect(); renderer.dispose(); }, roll() {} };

  let lean = { x: 0, y: 0 }, on = true, raf = 0, last = 0;
  const point = (e) => { lean = { x: (e.clientY / innerHeight - 0.5) * 0.5, y: (e.clientX / innerWidth - 0.5) * 0.6 }; };
  addEventListener('pointermove', point, { passive: true });
  const seen = new IntersectionObserver(([e]) => { on = e.isIntersecting; });
  seen.observe(el);
  const loop = (t) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(50, t - (last || t));
    last = t;
    if (!on) return;
    if (spin > 0) {   // a roll: fast tumbling that slows down to a stop
      spin -= dt;
      const k = Math.max(0, spin) / 900;
      piece.mesh.rotation.x += 0.45 * k;
      piece.mesh.rotation.y += 0.6 * k;
    } else piece.idle(piece.mesh, t, lean);
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
    roll() { spin = 900; },
  };
}
