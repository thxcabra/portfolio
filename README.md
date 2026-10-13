# JOÃO CABRAL · Pokémon Center

A playable portfolio: a Pokémon Center from **Pokémon FireRed**, running inside a Game Boy Advance in the browser. Walk around the room, talk to the people in it, or press START to get straight to the projects, the experience and the contact info.

![The GBA showing the FireRed title screen](assets/og.png)

## What it is

- **A room you can walk around:** the real FireRed Pokémon Center, with the Nurse, the people and the objects. Arrow keys/WASD, a click or a tap to walk there, A or a click to talk.
- **A START menu for the fast path:** PROJETOS, SOBRE, EXPERIÊNCIA, HABILIDADES, CONTATO and OPÇÕES, each drawn like the matching FireRed screen, with a help bar that explains every item in plain language. Direct links (`#/contato`, `#/projetos/3`) open a screen straight away.
- **Projects as Pokémon:** PROJETOS is the Pokédex list, and each project opens as a Pokémon summary with three pages (info, pictures, tech stack), the Pokémon's cry and a 1 in 16 chance of a shiny. Screenshots open full size over the page.
- **The room opens the same screens:** the Nurse asks what you need (about João, contact), the PC shows the projects, the Kanto map opens the experience Bag and the Move Tutor the skills TM Case. SOBRE is the trainer card (it flips like the game's), EXPERIÊNCIA the Bag with WORK and EDUCATION pockets, HABILIDADES the TM Case with a disc per skill in its type's colour.
- **A simple view for reading:** the SIMPLE button on the console (or the `#/simples` link) turns the whole portfolio into a regular page to scroll, still in the game's font, frames and sprites, in Portuguese or English.
- **A living Kanto behind the console:** Route 1, Pallet Town and the sea from the game's own maps, with animated water and flowers, the town's people walking around and a slow camera.
- **A console around the game:** a geometric GBA on desktop and an opened GBA SP on phones held upright, both clickable, at integer pixel scales so every pixel stays sharp.

## Faithful to the game

The goal is that it feels like the actual game, so the numbers come from the community decompilation of FireRed ([pret/pokefirered](https://github.com/pret/pokefirered)), not from eyeballing screenshots:

- the message box frame, text position (16, 121), 15 px line spacing, text colours per speaker and the bouncing arrow;
- the START menu, help bar, OPTION screen and multichoice windows (window templates, cursor, wrapping, which sounds play and which don't);
- the Pokédex list (row layout, type labels, white fades) and the Pokémon summary (backgrounds and tabs from the tilemaps, the shiny palettes, the sprite bounce, the page slide);
- the trainer card (palettes by stars, rows, badge slots, the flip timing and its three sounds), the Bag (list scrolling rule, bag shake and hop, pocket switch) and the TM Case (disc colours and drop/raise);
- the page background: the stacked maps, the border block, tileset animation timing and the wander movement of the people;
- the title screen layers, the flame sprites (same random generator, seed and sprite limit), the shine on the logo and the PRESS START blink;
- text speeds, wall-bump timing and the cry and white fade when you press START on the title.

The message box was checked pixel by pixel against a reference rendered with the game's own text-printer rules.

## Built with

- HTML, CSS and JavaScript (ES modules): no framework, no dependencies, no build step for the site.
- A Python asset pipeline (`tools/build_assets.py`, standard library + fontTools) that renders tilemaps, palettes, fonts, sounds and the room from the decompilation's data.
- Tests: `check.mjs` (logic, content and text that must fit each window) and `tools/e2e.mjs` (end-to-end flows in headless Edge/Chrome over the DevTools protocol).

## Running it

```bash
python -m http.server 8123      # any static server works
# open http://127.0.0.1:8123
```

```bash
node check.mjs                  # logic, data and text widths
node tools/e2e.mjs              # end-to-end flows (needs Edge or Chrome; EDGE=<path> to override)
node tools/shots.mjs shots/     # screenshots at desktop, laptop and phone sizes
```

Rebuilding `assets/` needs the decompilation and the sound rip in `new assets/` (not included): `pip install -r tools/requirements.txt`, then `python tools/build_assets.py`.

### Controls

| Button | Keyboard | Mouse / touch |
|---|---|---|
| A | Z, Space, Enter | left click / tap |
| B | X, Backspace | right click |
| START | Esc | the START button |
| D-pad | arrows, WASD | the d-pad, or click the floor |

## Structure

```
index.html  style.css  gba.js        the console: body, scaling, input, sound, links
carts/center/                         the cartridge: title, room, dialogue, menu and screens
data.js                               all the content (projects, experience, skills, texts)
logic.js  sound.js  typewriter.js     shared logic, sounds, typing effect
assets/                               generated from the game's data by tools/build_assets.py
tools/                                asset build, end-to-end tests, screenshots
docs/                                 design specs and implementation plans
```

## Legal

Pokémon and all related names, graphics, sounds and characters are © Nintendo, Creatures Inc. and GAME FREAK inc. This is a non-commercial fan project made as a personal portfolio; the game assets in `assets/` are derived from the decompilation and are **not** covered by this repository's license. The source code is released under the [MIT License](LICENSE).

## Author

**João Cabral**: [GitHub](https://github.com/thxcabra) · [LinkedIn](https://www.linkedin.com/in/joao-cabral-machado/)
