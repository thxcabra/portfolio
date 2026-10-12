# Portfólio Pokédex — Passe visual (assets reais, pixel único, animações, fundo em vídeo)

- **Data:** 2026-10-12
- **Status:** aprovado
- **Base:** `docs/specs/2026-10-11-pokedex-portfolio-design.md` (este documento só descreve o que muda)

## 1. Objetivo

Fazer o site parecer **um único jogo da Gen 3**: todo pixel do mesmo tamanho, fonte e molduras originais do FireRed, sons originais, mais animações no estilo do jogo e gameplay gravado rodando no fundo.

## 2. Problemas que motivam o passe

1. A fonte (Pixelify Sans) não tem grade exata (pixel de 90–102 unidades, base deslocada 12 unidades) e é usada em 7 tamanhos — o "pixel de letra" nunca bate com o pixel dos sprites.
2. No layout DS, a tela usa uma escala (ex.: 1,33×) e o painel outra (2×).
3. Formas lisas no meio da pixel art: botões A/B com `border-radius`, insígnias em `clip-path` com diagonais suaves, estrelinhas com `scale: 1.5`.
4. Fundo genérico.

## 3. Fontes dos assets

Pasta `new assets/` (fora do git), fornecida pelo João:

- `pokefirered-master/` — despejo do FireRed (pret): fontes, molduras, insígnias, interface, logo, animações de batalha, gritos (`sound/direct_sound_samples/cries/*.wav`), tabela de caracteres (`charmap.txt`), larguras das letras (`src/text.c`), IDs dos sons (`include/constants/songs.h`), números da Dex (`include/constants/pokedex.h`).
- `pokeemerald-master/` — despejo do Emerald (PokéNav e Hoenn; reserva).
- `Game Boy Advance - Pokemon FireRed _ LeafGreen - Miscellaneous - Sound Effects/` — efeitos em WAV, `firered_XXXX.wav` com XXXX = ID do som em hexadecimal (conferido: `0005` SE_SELECT 0,23s; `0006` SE_WIN_OPEN 0,27s; `0004` SE_PC_ON 1,1s; `005F` SE_SHINY 0,77s).
- `videos/` — clipes gravados pelo João no mGBA (ainda não existem; o site funciona sem eles).

Os assets são da Nintendo. Só o mínimo usado vai para `assets/`; os despejos completos nunca vão para o git nem para o deploy.

## 4. Pipeline: `tools/build_assets.py`

Script em Python **só com biblioteca padrão**, exceto a geração da fonte, que usa `fontTools` (dependência de desenvolvimento, `tools/requirements.txt`; o site não depende dela). Roda com `python tools/build_assets.py` e regera tudo em `assets/` a partir de `new assets/`. O resultado é commitado.

| Saída | Origem | Observação |
|---|---|---|
| `assets/font/gen3.woff` | `graphics/fonts/latin_normal.png` + larguras de `src/text.c` + `charmap.txt` | Ver §5 |
| `assets/font/gen3-small.woff` | `graphics/fonts/latin_small.png` | Etiquetas pequenas (teclas do aparelho) |
| `assets/font/charset.json` | — | Lista de code points cobertos pela fonte normal |
| `assets/ui/frame-1.png` … `frame-10.png` | `graphics/text_window/type1…10.png` | 24×24, paleta aplicada, índice 0 transparente |
| `assets/ui/badges.png` | `graphics/trainer_card/badges.png` | 128×16, 8 insígnias de 16×16 na ordem de Kanto; cores da paleta do próprio PNG |
| `assets/ui/menu_info.png` | `graphics/interface/menu_info.png` | Folha 128×128 com as 17 etiquetas de tipo (32×12, 4 por linha: normal fire water grass / electric rock ground ice / flying fighting ghost bug / poison psychic steel dark / dragon) e os rótulos TYPE, POWER, PP; usada por `background-position` |
| `assets/ui/logo.png`, `assets/ui/flames.png` | `graphics/title_screen/firered/` | Abertura |
| `assets/ui/ball.png` | `graphics/items/icons/poke_ball.png` | Abertura |
| `assets/ui/sparkle.png` | `graphics/battle_anims/sprites/gold_stars.png` | Shiny |
| `assets/sfx/<nome>.wav` | Pacote de efeitos | `select`, `win_open`, `pc_on`, `dex_scroll`, `dex_page`, `success`, `shiny`; convertidos para mono 22 050 Hz 16 bits |
| `assets/cries/<nº>.wav` | `sound/direct_sound_samples/cries/` | Os 386, renomeados pelo número nacional da Dex (via `pokedex.h`) |
| `assets/video/clips.json` + `assets/video/*` | `new assets/videos/` | Lista vazia quando não houver clipes |

PNGs com paleta: o índice 0 vira transparente (regra do GBA). Paleta: a do próprio PNG, ou um `.pal` JASC quando o gráfico usa paleta externa.

**Auto-verificação** (falha o script se algo não bater): o bitmap do "A" gerado é igual ao da folha original; todo caractere esperado existe (A–Z, a–z, 0–9, pontuação, acentos do português incluindo ã õ Ã Õ, `@ # _ –`); 386 gritos copiados; todos os arquivos de saída existem; ida e volta do codificador/decodificador de PNG preserva os pixels.

## 5. Fonte Gen 3

Medida na folha `latin_normal.png` (células 16×16, índice 1 = traço, 2 = sombra, 3 = fundo da letra):

- Caixa da letra 6×14; maiúscula 8 px; minúscula 5 px; descendente 2 px; avanço quase sempre 6 px (tabela de larguras).
- **Grade:** 1 pixel = 64 unidades, `unitsPerEm` 1024 (em = 16 px). Com `font-size: 16px` (em pixels de jogo), 1 pixel da letra = 1 pixel de jogo.
- Ascendente 11 px, descendente 3 px. `line-height: 16px` deixa a linha de base num pixel inteiro.
- Só o traço (índice 1) vira contorno da fonte. A sombra é refeita em CSS: `text-shadow: 1px 0 0 S, 0 1px 0 S, 1px 1px 0 S` — idêntica à da folha.
- Mapeamento Unicode a partir de `charmap.txt` (entradas `'x' = HH`). Aspas retas `"` e `'` usam os glifos ” e ’.
- Glifos desenhados à mão no estilo do jogo (bitmaps no próprio script): `ã õ Ã Õ` (base + til do `ñ`), `@ # _ – [ ] * ~`.
- A versão pequena segue o mesmo processo com `latin_small.png`.

## 6. Pixel único

- **Uma escala `k`** para a página toda (desktop e DS). No DS, painel e tela usam o mesmo `k` (acaba o `zoom: 2` do painel).
- **Todo texto** em `font-family: Gen3` com `font-size: 16px; line-height: 16px` (pixels de jogo); etiquetas em `Gen3 Small`. Nenhum outro tamanho de fonte.
- **Molduras:** `.box` usa `border-image` com `assets/ui/frame-N.png`, fatia 8, `border-width: 8px`, `stretch`. N vem de OPÇÕES.
- **Insígnias:** sprite de `badges.png` por `background-position` (16×16, ampliadas só por inteiros). Somem os `clip-path`.
- **Tipos:** imagens reais recortadas de `menu_info.png`. Somem as etiquetas em CSS. Os rótulos "PODER" e "PP" da tela de golpes ficam em texto na fonte do jogo (os rótulos gráficos do jogo são escuros e sumiriam no painel verde, e não têm versão em português).
- **Botões redondos** do aparelho só em SVG de grade (já é assim no casco; a área de clique pode ser retangular).
- **Animações** só com deslocamentos inteiros de pixel e `steps()`; nada de `scale` fracionário.
- **Sprites:** lista, Trainer Card e entrada usam a arte do Emerald (estático, `frame2` e GIF animado). O FireRed deixa de ser usado nos sprites — `spritePath` passa a sempre resolver para `emerald/`.

Tamanho do texto: maiúscula de 8 px (antes ~6). O painel comporta ~10 linhas de ~38 caracteres; textos maiores rolam.

## 7. Animações

1. **Texto digitando** em todo conteúdo do painel. Velocidade em OPÇÕES (LENTO / MÉDIO / RÁPIDO; padrão RÁPIDO ≈ 120 caracteres/s). A, Enter, clique ou toque no painel completam na hora. O texto completo está no DOM desde o início (a parte ainda não "digitada" fica invisível, sem mudar a quebra de linha); leitores de tela leem tudo. Ao terminar, se houver conteúdo abaixo da área visível, pisca ▼ no canto; A ou ↓ rolam uma página. Enquanto digita, o corpo recebe `talking`: LED vermelho pisca e a lente pulsa.
2. **Primeira visita a um projeto** (índice ainda não está em `seen`): sprite como silhueta preta por 0,6 s → cores + `success` + grito → o painel digita "Os dados de {POKÉMON} foram registrados na POKéDEX!" seguido da descrição. Visitas seguintes: direto, com grito.
3. **Pokémon vivos:** lista e Trainer Card alternam `emerald/{n}.png` e `emerald/frame2/{n}.png` (shiny: as pastas `shiny/`) a cada 0,5 s, só com CSS. Entrada mantém o GIF.
4. **Transições:** troca de rota escurece até o preto em 3 degraus e volta em 3 (~0,3 s) na tela e no painel (`filter: brightness()` em `steps(3)`). O sprite segue "voando" da lista para a entrada. Shiny: estrelinhas reais + `shiny`.
5. **Aparelho reagindo:** setas, Z e X afundam por 120 ms o braço do direcional ou o botão A/B correspondente (mesma classe usada no clique). O **botão preto** liga/desliga o som; o **LED verde** fica aceso com som ligado.
6. **Abertura:** `pc_on` → tampa abre (como hoje) → Poké Ball cai e quica (3 quadros) → flash branco → logo do FireRed com chamas → `win_open` → "JOÃO CABRAL" → menu. ~1,8 s, pulável com qualquer entrada. Com redução de movimento: direto no menu.

Com `prefers-reduced-motion`: sem digitação (texto completo), sem silhueta (direto às cores), sem fade, sem quadros alternados, sem abertura animada; sons continuam se ligados.

## 8. Sons

| Evento | Arquivo |
|---|---|
| Mover cursor, A, B | `select` |
| Mover na lista da Pokédex | `dex_scroll` |
| Abrir entrada | `dex_page` + `cries/{nº}` |
| Primeiro registro | `success` (antes do grito) |
| Abertura / abrir menu | `pc_on` / `win_open` |
| Shiny | `shiny` |

Web Audio com buffers decodificados (carregados na primeira vez que o som é ligado; gritos sob demanda). Padrão desligado. Falha de áudio = silêncio.

## 9. Fundo em vídeo

- `assets/video/clips.json` lista os clipes. Ao carregar, sorteia um; ao terminar, sorteia outro diferente (se houver mais de um). `<video muted playsinline>` atrás de tudo.
- Escala inteira em pixels físicos que **cobre** a janela (`ceil` do maior fator), centralizado, `image-rendering: pixelated`, com camada escura de ~50% por cima.
- Não carrega no layout DS, com `prefers-reduced-motion` ou com `navigator.connection.saveData`. Nesses casos e quando não há clipes: o fundo pixelado escuro atual.

## 10. OPÇÕES

| Opção | Valores | Padrão | Chave no `localStorage` |
|---|---|---|---|
| IDIOMA | PT / EN | idioma do navegador | `lang` |
| SOM | SIM / NÃO | NÃO | `sound` |
| TEXTO | LENTO / MÉDIO / RÁPIDO | RÁPIDO | `textSpeed` |
| MOLDURA | 1–10 | 1 | `frame` |

←/→ mudam o valor; A avança para o próximo valor (dando a volta).

## 11. Testes

- `python tools/build_assets.py` — auto-verificação da §4.
- `node check.mjs` — tudo o que já existe, mais: todo caractere das strings do `data.js` existe em `charset.json`; cada Pokémon usado tem `assets/cries/{nº}.wav`; `spritePath` sempre em `emerald/`; funções puras novas (`coverScale`, `cycle`, divisão do texto para digitação).
- `node tools/e2e.mjs` — o teste de interação via Edge entra no repositório e cobre também: pular digitação, ▼ e rolagem, opções TEXTO e MOLDURA, silhueta → revelação na primeira visita, botão de som + LED verde, botão do aparelho afundando com o teclado, ausência de erros no console.
- Screenshots em 1920×1080, 1366×768, 390×844 e 844×390.

## 12. Fora deste passe

Mini batalha, captura, música, deploy e domínio.
