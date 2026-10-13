// SOBRE: FireRed's trainer card (trainer_card.c). Its colour comes from the stars, one per year since
// `trainer.since`, up to 4 (blue, green, bronze, silver, gold). Front: NOME, IDNo, PROJETOS, INSÍGNIAS
// and TEMPO in the game's rows, the stars, each job's badge in its own slot and Red. A flips it: the
// card squashes to a line (cardTop +7 a frame, 11 frames) with SE_CARD_FLIP, turns with
// SE_CARD_FLIPPING, opens again (−5 a frame, 16 frames) and SE_CARD_OPEN plays; text, badges and Red
// are hidden while it turns. Back: the role, where João lives, the languages and A: SOBRE MIM, which
// reads the about text in the message box. B on the back flips it back; B on the front fades to black.
import { SHAPES, textWidth, wrapText, toPages, esc } from '../../../logic.js';
import { text } from '../ui.js';

const FPS = 59.7275;
const FADE = (9 * 1000) / FPS;
const DOWN = Array.from({ length: 11 }, (_, i) => Math.min(77, 7 * (i + 1)));   // Task_AnimateCardFlipDown
const UP = Array.from({ length: 16 }, (_, i) => Math.max(0, 72 - 5 * i));      // Task_AnimateCardFlipUp: 72 … 2, 0
const html = (s, x, y, cls = '') => text(s, x, y, cls).outerHTML;

export function createCard({ api, widths, data, say, close }) {
  const { trainer } = data;
  const years = Math.max(0, new Date().getFullYear() - trainer.since);
  const stars = Math.min(4, years);
  const L = (o) => o[api.lang()] ?? o.pt;
  const right = (s, x, y) => html(s, x - textWidth(s, widths), y);
  const el = document.createElement('div');
  el.className = 'card full';
  el.innerHTML = `<img class="layer" src="assets/card/bg-${stars}.png" alt=""><div class="card-face"></div>`;
  const face = el.querySelector('.card-face');
  let back = false, busy = false;

  function front() {
    return `<img class="layer" src="assets/card/front-${stars}.png" alt=""><div class="card-top">`
      + html(api.t('card_name') + trainer.name, 28, 37) + html(`IDNo.${trainer.id}`, 150, 18)
      + html(api.t('card_projects'), 28, 64) + right(String(data.projects.length), 142, 64)
      + html(api.t('card_badges'), 28, 80) + right(String(data.badges.length), 142, 80)
      + html(api.t('card_time'), 28, 96) + right(api.t('card_years').replace('{n}', years), 142, 96)
      + Array.from({ length: stars }, (_, i) => `<img class="card-star" src="assets/card/star.png" style="left:${120 + 8 * i}px" alt="">`).join('')
      + data.badges.map((b) => {
        const slot = SHAPES.indexOf(b.shape);
        return `<i class="badge" style="left:${32 + 24 * slot}px;background-position:${-16 * slot}px 0" title="${esc(b.name)}"></i>`;
      }).join('')
      + '<img class="card-red" src="assets/card/red.png" alt="Red"></div>';
  }
  function reverse() {
    const [role, ...more] = L(trainer.role).split(' · ');
    return `<img class="layer" src="assets/card/back-${stars}.png" alt=""><div class="card-top">`
      + html(trainer.name, 146, 19)
      + [role, more.join(' · '), trainer.location, L(trainer.languages)].map((s, i) => html(s, 18, 43 + 16 * i)).join('')
      + html(api.t('card_about'), 18, 107, 'stat') + '</div>';
  }
  const draw = () => { face.innerHTML = back ? reverse() : front(); };

  // One value per game frame, held until the next one (the scanline squash, as a vertical scale).
  const squash = (tops) => face.animate(
    [...tops.map((t, i) => ({ transform: `scaleY(${(160 - 2 * t) / 160})`, offset: i / tops.length, easing: 'step-end' })), { transform: `scaleY(${(160 - 2 * tops.at(-1)) / 160})` }],
    { duration: (tops.length * 1000) / FPS, fill: 'forwards' },
  ).finished;

  async function flip() {
    busy = true;
    api.sfx('card_flip');
    if (!api.reduced()) {
      face.classList.add('turning');
      await squash(DOWN);
    }
    back = !back;
    draw();
    api.sfx('card_flipping');
    if (!api.reduced()) {
      await squash(UP);
      face.getAnimations().forEach((a) => a.cancel());
      face.classList.remove('turning');
    }
    api.sfx('card_open');
    busy = false;
  }

  function leave() {
    busy = true;
    el.classList.add('to-black');
    setTimeout(close, api.reduced() ? 0 : FADE);
  }

  draw();
  setTimeout(() => api.sfx('card_open'), api.reduced() ? 0 : FADE);   // once it has faded in
  el.addEventListener('pointerdown', (e) => {
    if (e.button === 0 && !busy) (back && e.target.closest('.stat') ? about() : flip());
  });
  const about = () => say(toPages(wrapText(L(trainer.about), widths, 198)));

  return {
    el,
    path: 'sobre',
    keys: () => (back ? { a: 'act_read', b: 'act_flip' } : { a: 'act_flip', b: 'act_back' }),
    button(name, down) {
      if (!down || busy) return;
      if (name === 'a') return back ? about() : flip();
      if (name === 'b') return back ? flip() : leave();
    },
  };
}
