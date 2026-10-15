// A VHS tape in the style of the first PlayStation, turning slowly and leaning towards the pointer: drawn
// at half the resolution and scaled up without smoothing, vertices snapped to the screen grid,
// textures mapped without perspective correction (affine), ordered dithering and 15-bit colour. The label
// is a label-maker strip on a 128x64 canvas texture read with nearest filtering. three.js loads only when
// the tape is about to be on screen, and the loop stops while it is off screen.
const VERTEX = `
uniform vec2 uGrid;
varying vec3 vUvw;
varying float vShade;
void main() {
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  p.xy = floor(p.xy / p.w * uGrid + 0.5) / uGrid * p.w;
  gl_Position = p;
  vUvw = vec3(uv * p.w, p.w);
  vec3 n = normalize(normalMatrix * normal);
  vShade = 0.42 + 0.58 * max(dot(n, normalize(vec3(0.4, 0.7, 0.6))), 0.0);
}`;
const FRAGMENT = `
uniform sampler2D uMap;
varying vec3 vUvw;
varying float vShade;
float bayer(vec2 p) {
  int i = int(mod(p.x, 4.0)) + 4 * int(mod(p.y, 4.0));
  float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  return m[i] / 16.0;
}
void main() {
  vec3 c = texture2D(uMap, vUvw.xy / vUvw.z).rgb * vShade;
  c += (bayer(gl_FragCoord.xy) - 0.5) / 31.0;
  gl_FragColor = vec4(floor(c * 31.0 + 0.5) / 31.0, 1.0);
}`;

// The tape's faces as small canvases: the front with its windows, reels and label; the plastic elsewhere.
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

function front(label) {
  return (g, w, h) => {
    g.fillStyle = '#1c1a20';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a2730';
    g.fillRect(4, 4, w - 8, h - 8);
    // the label-maker strip: orange tape, light letters
    g.fillStyle = '#ff6a1f';
    g.fillRect(8, 7, w - 16, 17);
    g.fillStyle = '#f4eee3';
    g.font = 'bold 11px monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(label, w / 2, 16, w - 26);
    // the window and its two reels
    g.fillStyle = '#0e0c12';
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
  };
}

const plastic = (g, w, h) => {
  g.fillStyle = '#25222b';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#1c1a20';
  for (let y = 2; y < h; y += 6) g.fillRect(0, y, w, 2);
};

export function mountVhs(el, { reduced, label }) {
  let stop = () => {};
  let gone = false;
  const io = new IntersectionObserver(async ([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    try {
      const THREE = await import('three');
      if (!gone) stop = start(THREE, el, reduced, label);
    } catch { /* no WebGL or no network: the space stays empty */ }
  }, { rootMargin: '300px' });
  io.observe(el);
  return () => { gone = true; io.disconnect(); stop(); };
}

function start(THREE, el, reduced, label) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(1);
  el.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.z = 6;
  const grid = new THREE.Vector2(80, 80);
  const material = (map) => new THREE.ShaderMaterial({ uniforms: { uMap: { value: map }, uGrid: { value: grid } }, vertexShader: VERTEX, fragmentShader: FRAGMENT });
  const side = material(canvasTexture(THREE, plastic, 32, 32));
  const face = material(canvasTexture(THREE, front(label)));
  // BoxGeometry's faces: +x, -x, +y, -y, +z (the front, with the label), -z
  const tape = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.9, 0.5), [side, side, side, side, face, side]);
  scene.add(tape);

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
  tape.rotation.set(-0.25, -0.5, 0.08);
  draw();
  if (reduced) return () => { ro.disconnect(); renderer.dispose(); };

  let lean = { x: 0, y: 0 }, on = true, raf = 0;
  const point = (e) => { lean = { x: (e.clientY / innerHeight - 0.5) * 0.5, y: (e.clientX / innerWidth - 0.5) * 0.6 }; };
  addEventListener('pointermove', point, { passive: true });
  const seen = new IntersectionObserver(([e]) => { on = e.isIntersecting; });
  seen.observe(el);
  const loop = (t) => {
    raf = requestAnimationFrame(loop);
    if (!on) return;
    tape.rotation.x += (-0.25 + lean.x + Math.sin(t / 1700) * 0.12 - tape.rotation.x) * 0.05;
    tape.rotation.y = -0.5 + Math.sin(t / 2600) * 0.9 + lean.y;
    tape.position.y = Math.sin(t / 900) * 0.08;
    draw();
  };
  raf = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(raf);
    removeEventListener('pointermove', point);
    seen.disconnect();
    ro.disconnect();
    renderer.dispose();
  };
}
