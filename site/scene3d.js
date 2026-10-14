// The low poly piece: an icosahedron with flat faces in the page's colours and ink edges, turning slowly
// and leaning towards the pointer; or one of João's .glb models. three.js loads only when the piece is
// about to be on screen, and the loop stops while it is off screen.
const COLORS = ['#ff6a1f', '#6a3bf0', '#2bd67b', '#f4eee3'];

export function mount3d(el, { reduced, model = '' }) {
  let stop = () => {};
  let gone = false;
  const io = new IntersectionObserver(async ([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    try {
      const THREE = await import('three');
      const piece = model ? await loadModel(model) : null;
      if (!gone) stop = start(THREE, el, reduced, piece);
    } catch { /* no WebGL or no network: the space stays empty */ }
  }, { rootMargin: '300px' });
  io.observe(el);
  return () => { gone = true; io.disconnect(); stop(); };
}

async function loadModel(src) {
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  return (await new GLTFLoader().loadAsync(src)).scene;
}

function icosahedron(THREE) {
  const geo = new THREE.IcosahedronGeometry(1.7, 0);
  const colors = [];
  for (let f = 0; f < geo.attributes.position.count / 3; f++) {
    const c = new THREE.Color(COLORS[f % COLORS.length]);
    for (let v = 0; v < 3; v++) colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.55 }));
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x0e0c12 })));
  return mesh;
}

// A model, scaled and centred to sit where the icosahedron would.
function fit(THREE, model) {
  const box = new THREE.Box3().setFromObject(model);
  const k = 3.4 / (box.getSize(new THREE.Vector3()).length() || 1);
  model.scale.setScalar(k);
  model.position.sub(box.getCenter(new THREE.Vector3()).multiplyScalar(k));
  const pivot = new THREE.Group();
  pivot.add(model);
  return pivot;
}

function start(THREE, el, reduced, model) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  el.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.z = 6.5;
  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(3, 4, 5);
  scene.add(sun);
  const piece = model ? fit(THREE, model) : icosahedron(THREE);
  scene.add(piece);

  const draw = () => renderer.render(scene, camera);
  const size = () => {
    const w = el.clientWidth || 1, h = el.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(() => { size(); draw(); });
  ro.observe(el);
  size();
  piece.rotation.set(0.45, 0.6, 0);
  draw();
  if (reduced) return () => { ro.disconnect(); renderer.dispose(); };

  let lean = { x: 0, y: 0 }, on = true, raf = 0;
  const point = (e) => { lean = { x: (e.clientY / innerHeight - 0.5) * 0.8, y: (e.clientX / innerWidth - 0.5) * 0.8 }; };
  addEventListener('pointermove', point, { passive: true });
  const seen = new IntersectionObserver(([e]) => { on = e.isIntersecting; });
  seen.observe(el);
  const loop = (t) => {
    raf = requestAnimationFrame(loop);
    if (!on) return;
    piece.rotation.x += (0.45 + lean.x + Math.sin(t / 2400) * 0.25 - piece.rotation.x) * 0.04;
    piece.rotation.y = 0.6 + t / 4000 + lean.y;
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
