import { splitShown } from './logic.js';

// Types an element's text in place. Each text node keeps its full text in the DOM:
// the typed part stays in the node, the rest moves to a transparent span right after it,
// so line breaks never move and screen readers always get everything. Returns skip().
export function typewrite(el, cps, onDone) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.data.trim()) nodes.push(n);
  const parts = nodes.map((node) => {
    const text = node.data;
    const rest = document.createElement('span');
    rest.className = 'tw-rest';
    rest.textContent = text;
    node.data = '';
    node.after(rest);
    return { node, rest, text };
  });
  const lengths = parts.map((p) => p.text.length);
  const total = lengths.reduce((a, b) => a + b, 0);
  let shown = 0;
  let last = 0;
  let raf = 0;
  let done = false;

  function skip() {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    parts.forEach((p) => {
      p.node.data = p.text;
      p.rest.remove();
    });
    onDone?.();
  }

  function tick(now) {
    if (last) shown += ((now - last) * cps) / 1000;
    last = now;
    if (shown >= total) return skip();
    splitShown(lengths, shown).forEach((k, i) => {
      parts[i].node.data = parts[i].text.slice(0, k);
      parts[i].rest.textContent = parts[i].text.slice(k);
    });
    raf = requestAnimationFrame(tick);
  }

  raf = requestAnimationFrame(tick);
  return skip;
}
