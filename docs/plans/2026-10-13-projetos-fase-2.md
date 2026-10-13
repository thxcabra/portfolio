# Fase 2: PROJETOS, página do projeto e print ampliado

**Spec:** `docs/specs/2026-10-12-telas-e-menu-design.md` (linhas 55–57 e item 2 da ordem).
**Objetivo:** PROJETOS abre a lista do Pokédex do FireRed; A abre a página do projeto (o resumo do Pokémon) com 3 abas; prints abrem em tamanho real fora do GBA.

## Decisões (com o número do jogo de onde saem)

- **Lista** (`pokedex_screen.c`, modo numérico): BG3 = tile 0x0E de `kanto_dex_bgtiles.png` (pal 0) repetido; cabeçalho (0,0,240,16) e rodapé (0,144,240,16) preenchidos com #C5B48B, texto branco, sombra #626262. Título centrado em y=2 (largura sem espaçamento, impresso com 1px entre letras). Rodapé em fonte pequena, alinhado à direita em 236, y=146: `↕ESCOLHER  A OK  B SAIR` (gText_PickOKExit). Janela da lista em (16,16) 184×128, 9 linhas a partir de y=18, 14px entre elas. ▶ em x=20; `No` em x=28 e o número (3 dígitos, fonte pequena) em x=37; bola de capturado 12×12 em x=56; nome em x=72 (1px entre letras); tipos 32×12 em x=136 e x=168 (o segundo só se for diferente). Texto preto, sombra #E6DEC5. Sem sprite na lista (o jogo não mostra; o spec dizia "sprite ao lado", o jogo manda).
  - Número = posição no `data.js` (001…), que é o `{n}` do link. A bola aparece em todos (todos são do JOÃO).
  - ↑/↓ movem (SE_SELECT), A abre a página, B volta ao menu.
- **Página do projeto** (`pokemon_summary_screen.c`): BG3 `moves_info_page.bin` com as abas (tiles 345+n nas colunas 13–18, linhas 0–1) e, por cima, a camada da página. Paleta de `bg.png` (8bpp, índice & 15, slot = paleta do tilemap).
  - Abas na ordem INFO · IMAGENS · TECNOLOGIAS, com os estados de aba INFO / SKILLS / MOVES do jogo.
  - INFO = camada `page_info.bin`. Cabeçalho branco/sombra #626262 em (4,1): nome da aba. Ano em (4,18) e nome do projeto em (40,18). Valores (texto #414141, sombra #DEDEC5): No. (167,21) = nº nacional do Pokémon; NAME (167,35) = espécie; TYPE (167,51)/(203,51); OT (167,65) = JOÃO; IDNo (167,80) = `trainer.id`; ITEM (167,95) = `kind` curto (≤ 70px). TRAINER MEMO em (8,115), 224px, 14px entre linhas: o `pitch` em até 2 linhas + `A: MAIS` na 3ª.
  - IMAGENS = só o BG3 (estado SKILLS das abas) + uma janela à direita com a miniatura pixelada (interior 112×80 em (120,24)) e a caixa de mensagem embaixo com "1/5 · A: VER EM TAMANHO REAL" ou "Ainda sem imagens deste projeto.". A amplia.
  - TECNOLOGIAS = camada `page_moves.bin` (20 primeiras linhas). Até 4 linhas: ícone de tipo em (123,21+28i), nome em (163,21+28i), texto #202020 sombra #DEDEDE. Tipo = o da habilidade com o mesmo nome em `moves`; senão NORMAL.
  - Sprite de frente 64×64 com o canto em (28,33), espelhado (menos Unown), pulando 2 vezes ao abrir (y += −5,−3,−1,0,1,3,5, um passo a cada 3 quadros). Poké Ball 16×16 em (98,80). Shiny com chance 1/16: sprite shiny, paletas 6→0 e 5→1 do fundo e estrela em (102,36).
  - Trocar de aba: SE_SELECT; → a página atual sai para a direita (60px por quadro, 4 quadros); ← a nova entra pela direita. ↑/↓ = projeto anterior/próximo (com o grito). A no INFO: janela com LER MAIS · VER SITE · CÓDIGO · VOLTAR (só os que existem); LER MAIS mostra `text` na caixa de mensagem, em páginas. B volta para a lista.
  - Abre com o grito do Pokémon depois do fade.
- **Print ampliado** (`api.show(media, i)` no console): fundo escurecido sobre a página toda, imagem em tamanho real (até caber na janela) dentro da moldura do jogo, contador "2/5". ←/→ trocam, B/Esc/clique fora fecham. Enquanto aberto, os botões vão para ele.
- **Sprites:** `assets/mon/front/{n}.png` e `assets/mon/shiny/{n}.png` para 1–386 (Unown: `201-{letra}.png`), de `graphics/pokemon/<nome>/front.png` com `normal.pal`/`shiny.pal`. As pastas `assets/sprites/emerald` saem. `spritePath` vira `monPath(dex, { shiny, form })`.
- **Dados:** os 7 projetos reais (`scratchpad/projects.json`) com Pokémon e tipos escolhidos: PORTFOLIO = Charizard, PITCHIQ = Alakazam, MAGNIFYER = Noctowl, REPLAI = Pelipper, CALLSYNC = Unown C, FURIOSO = Persian, MOIC SITE = Porygon2. `stack` com até 4 itens. Prints do PitchIQ copiados para `assets/projects/pitchiq/`, o do portfólio = `assets/og.png`.

## Tarefas

1. **Assets** (`tools/build_assets.py`): `build_mons` (front/shiny 1–386 + formas do Unown), `build_dex` (tile de fundo, `types.png` com `pokemon_types.pal`, `caught.png`), `build_summary` (BG3 por estado de aba × normal/shiny, camadas INFO e MOVES × normal/shiny, bola, estrela). Checks de tamanho e de pixel. Remove `assets/sprites` e `menu_info.png`.
2. **Lógica** (`logic.js` + `check.mjs`): `monPath`, `wrapText(text, widths, max)` (quebra por palavra), `pages(lines)` (2 linhas por página), `pad3`, `BOUNCE` (deslocamentos do pulo). Testes.
3. **Dados** (`data.js` + `check.mjs`): projetos reais, `kind` curto que cabe em 70px, `pitch` que cabe em 2 linhas de 224px, stack ≤ 4, prints existem, textos `ui`/`talk` novos nas duas línguas.
4. **Print ampliado** (`gba.js`, `style.css`): `api.show`.
5. **Lista** (`carts/center/screens/dex.js`): tela PROJETOS, rota `#/projetos`.
6. **Página** (`carts/center/screens/summary.js`): 3 abas, ↑/↓, A, rota `#/projetos/{n}`.
7. **e2e + capturas + publicar**: fluxos novos em `tools/e2e.mjs`, capturas revisadas, merge em `main` e push.
