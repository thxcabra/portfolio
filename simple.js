// The simple view (#/simples): the same content as a regular page you scroll, for whoever would rather
// read than play. Still in the game's pixels: the Gen3 font at an integer scale, the chosen window
// frame, the FireRed sprites, type labels and badges, Kanto behind it. Built from data.js.
import { TYPES, SHAPES, monPath, esc } from './logic.js';

const MAX_W = 400;   // column width in game pixels on wide screens; phones get the screen's width

export function createSimple({ data, lang, setLang, t, store, show, onClose }) {
  const L = (o) => o?.[lang()] ?? o?.pt ?? '';
  const el = document.createElement('div');
  el.className = 'simple';
  el.hidden = true;
  el.setAttribute('role', 'document');
  document.body.append(el);

  const type = (ty) => {
    const i = Math.max(0, TYPES.indexOf(ty));
    return `<i class="sp-type" style="background-position:${-(i % 4) * 32}px ${-16 - Math.floor(i / 4) * 16}px" title="${ty.toUpperCase()}"></i>`;
  };
  const typeOf = (tech) => data.moves.find((m) => m.name === tech)?.type ?? data.tech[tech] ?? 'normal';
  const para = (s) => `<p>${esc(s)}</p>`;
  const link = (href, label) => `<a class="sp-btn" href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a>`;

  function render() {
    const tr = data.trainer;
    const contact = data.contact.map((c) => link(c.url, c.label)).join('');
    const projects = data.projects.map((p, n) => `
      <article class="sp-win sp-proj">
        <img class="sp-mon" src="${monPath(p.dex, { form: p.form })}" alt="${esc(p.pokemon)}" width="64" height="64">
        <h3>No${String(n + 1).padStart(3, '0')} ${esc(p.name)}</h3>
        <p class="sp-meta">${esc(p.pokemon)} · ${p.year} · ${esc(L(p.kind))} ${[...new Set(p.types)].map(type).join('')}</p>
        <p class="sp-pitch">${esc(L(p.pitch))}</p>${para(L(p.text))}
        <ul class="sp-stack">${p.stack.map((s) => `<li>${type(typeOf(s))}${esc(s)}</li>`).join('')}</ul>
        <p class="sp-links">${p.links.live ? link(p.links.live, t('sum_site')) : ''}${p.links.repo ? link(p.links.repo, t('sum_code')) : ''}</p>
        ${p.shots.length ? `<p class="sp-shots">${p.shots.map((s, k) => `<button type="button" class="sp-shot" data-p="${n}" data-k="${k}"><img src="${esc(s)}" alt="${esc(p.name)} ${k + 1}/${p.shots.length}" loading="lazy"></button>`).join('')}</p>` : ''}
      </article>`).join('');
    const jobs = data.badges.map((b) => `
      <div class="sp-job"><i class="sp-badge" style="background-position:${-16 * SHAPES.indexOf(b.shape)}px 0"></i>
        <h3>${esc(b.name)}</h3><p class="sp-meta">${esc(L(b.role))} · ${esc(L(b.period))}</p>${para(L(b.text))}</div>`).join('');
    const school = data.education.map((e) => `<div class="sp-job"><h3>${esc(e.name)}</h3><p class="sp-meta">${esc(L(e.course))} · ${esc(L(e.period))}</p></div>`).join('');
    const skills = data.moves.map((m) => `
      <div class="sp-skill">${type(m.type)}<h3>${esc(m.name)}</h3>
        <p class="sp-meta">${esc(t('sp_power'))} ${m.power} · ${esc(t('tm_years').replace('{n}', m.years))}</p>${para(L(m.text))}</div>`).join('');
    el.innerHTML = `<div class="sp">
      <p class="sp-bar"><button type="button" class="sp-btn" data-act="back">${esc(t('simple_back'))}</button>
        <button type="button" class="sp-btn" data-act="lang">${esc(t('simple_lang'))}</button></p>
      <header class="sp-win sp-head"><img class="sp-red" src="assets/card/red.png" alt="" width="64" height="64">
        <h1>${esc(tr.name)}</h1><p class="sp-meta">${esc(L(tr.role))}</p><p class="sp-meta">${esc(tr.location)} · ${esc(L(tr.languages))}</p>
        <p class="sp-links">${contact}</p></header>
      <h2>${esc(t('menu_sobre'))}</h2><section class="sp-win">${para(L(tr.about))}</section>
      <h2>${esc(t('menu_projetos'))}</h2><section class="sp-list">${projects}</section>
      <h2>${esc(t('menu_experiencia'))}</h2><section class="sp-win">${jobs}</section>
      <h2>${esc(t('bag_school'))}</h2><section class="sp-win">${school}</section>
      <h2>${esc(t('menu_habilidades'))}</h2><section class="sp-win">${skills}</section>
      <h2>${esc(t('menu_contato'))}</h2><section class="sp-win"><p class="sp-links">${contact}</p></section>
    </div>`;
  }

  // One integer number of device pixels per game pixel, at most 2 CSS pixels; the column fills phones.
  function fit() {
    const dpr = devicePixelRatio || 1;
    const k = Math.max(1, Math.min(Math.floor((dpr * (innerWidth - 16)) / 240), Math.floor(2 * dpr))) / dpr;
    document.documentElement.style.setProperty('--ks', k);
    document.documentElement.style.setProperty('--sw', `${Math.min(MAX_W, Math.floor((innerWidth - 16) / k))}px`);
    el.style.setProperty('--frame', `url(assets/ui/frame-${store.get('frame', 1)}.png)`);
  }

  el.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'back') return onClose();
    if (act === 'lang') {
      setLang(lang() === 'pt' ? 'en' : 'pt');
      return render();
    }
    const shot = e.target.closest('.sp-shot');
    if (shot) {
      const p = data.projects[Number(shot.dataset.p)];
      show(p.shots.map((src, k) => ({ src, alt: `${p.name} ${k + 1}/${p.shots.length}` })), Number(shot.dataset.k));
    }
  });
  addEventListener('resize', fit);
  fit();
  render();

  return {
    get up() { return !el.hidden; },
    open() {
      fit();
      render();
      el.hidden = false;
      document.body.classList.add('simple-mode');
      el.scrollTop = 0;
      el.querySelector('[data-act="back"]').focus({ preventScroll: true });
    },
    close() {
      el.hidden = true;
      document.body.classList.remove('simple-mode');
    },
    render,
  };
}
