# Portfólio Pokédex — Design (sub-projeto 1: base)

- **Data:** 2026-10-11
- **Status:** aprovado
- **Dono:** João Cabral

## 1. Objetivo

Um site de portfólio pessoal que funciona como uma Pokédex, na estética da Gen 3 (FireRed/LeafGreen/Emerald, pixel art de GBA). Cada projeto do João é uma entrada da Pokédex ligada a um Pokémon. A navegação tem que ser fluida e parecer jogo, sem atrapalhar quem só quer ler sobre os projetos (recrutador).

Este documento cobre só o **sub-projeto 1: a base** — carcaça visual, navegação, todas as seções com conteúdo placeholder, PT/EN, shiny e sons de interface.

## 2. Escopo

**Dentro**
- Aparelho Pokédex em pixel art (desktop) e layout "Nintendo DS" (celular)
- Intro com a Pokédex fechada que abre
- Menu principal + 5 seções: Pokédex (projetos), Trainer Card (sobre), Insígnias (experiência), Golpes (habilidades), PokéNav (contato) + OPTIONS (idioma e som)
- Shiny sorteado por projeto
- PT e EN
- Sons de interface sintetizados (Web Audio), desligados por padrão
- Contador VISTOS x/y
- Conteúdo placeholder: 8 projetos, 3 insígnias, 6 golpes
- `check.mjs` validando o conteúdo e a lógica pura

**Fora (próximos sub-projetos, cada um com spec própria)**
- Mini batalha Pokémon (em `<canvas>`, com os sprites de costas)
- Mini-game de captura e easter eggs (carta TCG, elementos do Pokémon GO)
- Gritos dos Pokémon (`.ogg` do repositório público da PokeAPI, só dos escolhidos)
- Emulador — **descartado em princípio**: o emulador (mGBA em WASM) é viável, mas hospedar ROM da Nintendo num domínio com o nome do João é distribuição de ROM e risco de DMCA. A batalha própria substitui.
- Deploy e domínio

## 3. Decisões

| Tema | Decisão |
|---|---|
| Conceito visual | Híbrido: aparelho da Pokédex (inspirado no do anime) desenhado em pixel art, com interface Gen 3 dentro das telas |
| Seções | Projetos→Pokédex, Sobre→Trainer Card, Experiência→Insígnias, Habilidades→Golpes, Contato→PokéNav |
| Idioma | PT + EN, troca em OPTIONS |
| Stack | HTML + CSS + JS puro, sem framework, sem build, sem dependências |
| Rotas | Hash (`#/dex/3`), uma página só, View Transitions API |
| Shiny | Sorteio 1/16 por projeto a cada carregamento |
| Controles | Mouse, toque e teclado (setas, Z/Enter = A, X/Esc = B) |
| Sons | Sintetizados, desligados por padrão, botão de som |
| Fonte | Pixelify Sans via Google Fonts |
| Celular | Primeira classe: todo recurso funciona no toque, testado em 390px |

## 4. Arquivos

```
portfolio/
  index.html      carcaça do aparelho + as duas áreas de tela
  style.css       aparelho, interface Gen 3, layout celular, transições
  app.js          rotas, teclado, render das telas, shiny, idioma, sons, escala
  data.js         todo o conteúdo (PT/EN) — único arquivo que o João edita
  check.mjs       validação (node check.mjs)
  assets/sprites/ sprites extraídos do tar (ver §5)
  pokedex/        tar original + imagem de referência (fora do git e do deploy)
  docs/           specs e planos
```

`app.js` exporta as funções puras (`parseRoute`, `spritePath`) e só mexe no DOM quando existe `document`, para o `check.mjs` conseguir importar.

## 5. Sprites

Extração única do tar inteiro, removendo os dois níveis `pokemon/main-sprites/`:

```
assets/sprites/firered-leafgreen/{n}.png         #1–151 (+ shiny/, back/, back/shiny/)
assets/sprites/emerald/{n}.png                   #1–386 (+ shiny/, frame2/)
assets/sprites/emerald/animated/{n}.gif          96×96 (+ shiny/)
assets/sprites/ruby-sapphire/...                 não usado nesta fase
```

Todos os PNG são 64×64 com transparência.

**Regra de escolha (`spritePath(dex, {shiny, animated})`):**
- `animated: true` → `emerald/animated/[shiny/]{dex}.gif`
- senão, `dex <= 151` → `firered-leafgreen/[shiny/]{dex}.png`
- senão → `emerald/[shiny/]{dex}.png`

Se a imagem falhar ao carregar (`onerror`), cai para o PNG estático; se o estático também falhar, mostra uma silhueta "?".

## 6. Rotas

| Hash | Tela |
|---|---|
| `#/` (ou vazio) | Pokédex fechada (intro) |
| `#/menu` | Menu principal |
| `#/dex` | Lista de projetos |
| `#/dex/{i}` | Entrada do projeto `i` (índice em `projects`, começando em 1) |
| `#/card` | Trainer Card |
| `#/badges` | Estojo de insígnias |
| `#/badges/{i}` | Insígnia `i` selecionada |
| `#/moves` | Lista de golpes |
| `#/contact` | PokéNav |
| `#/options` | Idioma e som |

Rota desconhecida ou índice fora do intervalo → redireciona para `#/menu`. O botão voltar do navegador funciona porque cada tela é uma entrada no histórico.

## 7. Telas

| Rota | Tela esquerda (o "jogo", 240×160) | Painel direito (a "leitura") |
|---|---|---|
| Menu | Lista estilo menu START, cursor ▶ | Explicação da opção selecionada |
| Pokédex | Sprite do projeto selecionado + No. + VISTOS x/y | Lista `No.001 CHARIZARD · Nome do projeto` |
| Entrada | Sprite animado, nome do Pokémon, tipos, ★ se shiny | Nome do projeto, ano, stack, descrição, links |
| Trainer Card | O cartão: nome, ID, tempo de jogo, parceiro, insígnias conquistadas | Texto "sobre mim" |
| Insígnias | Estojo com 8 slots (vazios além das cadastradas) | Empresa, cargo, período, texto |
| Golpes | Lista de golpes com tipo | Caixa: tipo, PODER, PP, descrição |
| PokéNav | Tela do PokéNav | Links de contato |
| Options | Idioma (PT/EN), Som (ON/OFF) | Explicação da opção |

**Intro:** Pokédex fechada (só a metade esquerda, luz azul piscando, "PRESS START"). Clique, toque ou qualquer tecla → a tampa direita abre, a tela esquerda faz um boot curto (≤1,2s) e cai em `#/menu`. Qualquer input durante a animação pula para o fim. Com `prefers-reduced-motion`, entra direto no menu aberto.

## 8. Navegação e controles

- **Mouse/toque:** clique direto em qualquer item.
- **Botões do aparelho (desktop):** direcional e A/B clicáveis; teclas azuis do painel direito vão direto às 5 seções; os dois botões de baixo são ◀ ANT / PRÓX ▶ (item anterior/próximo na lista atual).
- **Teclado:** setas movem o cursor; Z ou Enter = A (confirma); X, Esc ou Backspace = B (volta um nível: entrada → lista → menu → nada).
- **Celular:** toque + um botão **B** fixo para voltar.
- **Transições:** `document.startViewTransition` ao trocar de rota. O conteúdo troca com um "piscar" curto de tela (2–3 frames). Lista → entrada: o sprite tem `view-transition-name` e voa da miniatura para a posição grande. Sem suporte à API: troca instantânea.
- **Cursor = foco:** a posição do ▶ é o elemento focado; o foco do teclado sempre aparece como ▶.

## 9. Shiny

- No carregamento da página, cada projeto sorteia `Math.random() < 1/16`. Fica em memória (recarregar = novo sorteio). Com ~8 projetos, ~40% das visitas têm pelo menos um shiny.
- Entrada shiny: sprite shiny, ★ ao lado do número, animação de estrelinhas de 4 pontas em frames, som de shiny.
- Na lista, o shiny já aparece com o sprite shiny (o "brilho" fica para a entrada).

## 10. Visual

**Escala.** Toda a interface fica numa grade de pixel virtual. A tela esquerda tem 240×160 (resolução do GBA); o aparelho aberto tem ~560×280. A escala é inteira **em pixels físicos**:

```
devicePx = floor(min(larguraDisponível × dpr / larguraGrade, alturaDisponível × dpr / alturaGrade))
--px     = devicePx / dpr   (em px CSS)
```

Isso mantém os pixels nítidos em monitor comum (dpr 1 → 2×, 3×…), em Windows com zoom de 125% e no celular (iPhone 390px, dpr 3 → 4 px físicos por pixel → tela de 320px CSS). Recalcula em `resize`. Mínimo de 1 px físico por pixel.

**Aparelho.** CSS puro sobre a grade. Curva do topo em "escadinha" via `clip-path`. Sombreamento de sprite GBA: contorno, base, faixa de luz (cima/esquerda), faixa de sombra (baixo/direita), sem degradê. Luzes piscam em 2–3 frames (`steps()`).

| Cor | Hex |
|---|---|
| Corpo base | `#D8283C` |
| Corpo luz | `#F86868` |
| Corpo sombra | `#982038` |
| Contorno | `#401018` |
| Texto Gen 3 | `#484848` |
| Sombra do texto Gen 3 | `#D0D0C8` |
| LCD fundo | `#0E3B2C` |
| LCD texto | `#C8F0C0` |
| Fundo da página | azul-noite com dither sutil |

**Tela esquerda.** Caixas no estilo Gen 3: fundo claro, moldura dupla, texto `#484848` com sombra 1px para baixo e para a direita (`#D0D0C8`). Nomes de Pokémon em CAIXA ALTA. Tipos com as cores clássicas: normal, fire, water, grass, electric, ice, fighting, poison, ground, flying, psychic, bug, rock, ghost, dragon, dark, steel (sem fairy — não existe na Gen 3).

**Painel direito.** LCD verde-escuro com texto verde-claro; links com ▶ e sublinhado em pixel. Texto corrido sempre ≥16px reais.

**Fonte.** Pixelify Sans (Google Fonts), com fallback `monospace`.

**Insígnias.** Formas pixel em CSS (`clip-path`) imitando as de Kanto: `boulder`, `cascade`, `thunder`, `rainbow`, `soul`, `marsh`, `volcano`, `earth`.

## 11. Celular (primeira classe)

- Com `(max-width: 899px), (orientation: portrait)`, o aparelho some e vira layout DS: em retrato, tela esquerda em cima e painel direito embaixo; em paisagem (celular deitado), os dois lado a lado. Ocupa a tela toda.
- Mesmas rotas, mesmas telas, mesmo conteúdo. Nada é exclusivo do desktop, exceto os botões físicos do aparelho, que no celular são substituídos pelo toque e pelo botão B fixo.
- Alvos de toque ≥44px.
- O painel de baixo rola se o texto for longo; a tela de cima fica fixa.
- Intro também existe no celular (Pokédex fechada centralizada, toque para abrir).
- Verificado em 390×844 e em paisagem.

## 12. Sons

`AudioContext` criado no primeiro gesto do usuário (exigência do navegador). Onda quadrada, envelopes curtos:
- `move` — bip curto (cursor)
- `select` — dois bips subindo (A)
- `back` — bip descendo (B)
- `open` — arpejo (abrir Pokédex)
- `shiny` — sequência rápida aguda

Desligado por padrão. A escolha ON/OFF fica salva no `localStorage`.

## 13. Dados (`data.js`)

```js
export const DATA = {
  trainer: {
    name: 'JOÃO CABRAL', id: '04201', since: 2019,
    partner: 25,
    about: { pt: '…', en: '…' },
  },
  projects: [
    {
      dex: 6, pokemon: 'CHARIZARD',
      name: 'Nome do Projeto',
      types: ['fire', 'flying'],
      year: 2025,
      stack: ['TypeScript', 'React'],
      text: { pt: '…', en: '…' },
      links: { repo: 'https://…', live: 'https://…' },  // ambos opcionais
    },
  ],
  badges: [
    { name: 'EMPRESA X', shape: 'boulder', period: '2023–2025',
      role: { pt: '…', en: '…' }, text: { pt: '…', en: '…' } },
  ],
  moves: [
    { name: 'TYPESCRIPT', type: 'electric', power: 90, pp: 20,
      text: { pt: '…', en: '…' } },
  ],
  contact: [ { label: 'GITHUB', url: 'https://…' } ],
  ui: { pt: { /* textos fixos */ }, en: { /* … */ } },
};
```

No topo do arquivo, um comentário com a tabela sugerida de tech → tipo (ex.: JS/TS = electric, Python = psychic, banco de dados = rock, infra/DevOps = steel, design/UI = psychic, automação/IA = dragon).

**Idioma:** escolha salva no `localStorage`; sem escolha, `navigator.language` começando com `pt` → PT, senão EN. Chave ausente num idioma → usa a do outro idioma (o `check.mjs` impede isso de chegar ao ar).

**VISTOS:** índices dos projetos abertos, salvos no `localStorage`.

Todo acesso a `localStorage` fica em `try/catch`; se falhar, o site funciona sem lembrar nada.

## 14. Acessibilidade

- Todo item clicável é `<a href="#/...">` ou `<button>`.
- Todo sprite tem `alt` com o nome do Pokémon (e "shiny" quando for).
- `lang` do `<html>` acompanha o idioma escolhido.
- Foco visível como ▶; ordem de tab segue a ordem visual.
- `prefers-reduced-motion`: sem animação de abertura, sem piscar de tela, sem estrelinhas (o sprite shiny e a ★ continuam).
- Contraste do texto corrido ≥ 4.5:1.

## 15. Erros e casos de borda

| Caso | Comportamento |
|---|---|
| Rota inválida / índice fora | `#/menu` |
| Sprite não carrega | Estático → silhueta "?" |
| Sem View Transitions | Troca instantânea |
| `localStorage` bloqueado | Sem memória de idioma/som/vistos; resto funciona |
| Áudio bloqueado | Silêncio, sem erro |
| Projeto sem links | Seção de links não aparece |
| Mais de 8 insígnias | O `check.mjs` falha (o estojo só tem 8 slots) |

## 16. Testes

**`node check.mjs`** (sem framework, `node:assert`):
- Cada `text`, `role`, `about` e cada chave de `ui` tem `pt` e `en` não vazios.
- `dex` e `partner` inteiros entre 1 e 386, e o arquivo de sprite resolvido por `spritePath` existe em disco (normal, shiny e animado).
- `types` com 1–2 itens, todos da lista da Gen 3; `move.type` idem.
- `shape` das insígnias é um dos 8 válidos; no máximo 8 insígnias.
- Todo `url` e todo link começa com `https://`.
- `parseRoute` para cada linha da tabela de rotas, incluindo inválidas → menu.
- `spritePath` para dex 6 e 250 × shiny × animado.

**Visual:** screenshots em 1920×1080, 1366×768 e 390×844 (navegador headless, se disponível na máquina; senão, conferência manual pelo João).

## 17. Próximos sub-projetos

1. Conteúdo real (lista de projetos e Pokémon favoritos do João)
2. Mini batalha
3. Captura + easter eggs (TCG, GO)
4. Gritos dos Pokémon
5. Deploy + domínio
