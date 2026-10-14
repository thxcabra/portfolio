# Landing page — design

**Objetivo:** uma landing page que vira a porta de entrada do portfólio. Uma página vertical, original e estilizada, uma "bagunça organizada" que mistura materiais: colagem de papel, formas chapadas com olhos, pixel art, dados de programação, 3D low poly e desenho. Nas cores do João: laranja, roxo, verde e preto. Serve por igual a recrutadores e a clientes freelance. O GBA fica a um clique.

## Decisões já tomadas com o João

- **Entrada:** a landing page abre em `thxcabra.github.io/portfolio/`; o GBA vai para `/jogar`. A landing page substitui a versão simples.
- **Público:** recrutadores e clientes freelance por igual; o contato serve para vaga ou projeto.
- **Visual:** mistura das três direções propostas (colagem, uma estética por seção, formas vivas), com elementos de jogos low poly, dados de programação, pixel art, desenho e 3D. Não é pixel art nem low poly como estilo principal: é uma mistura.
- **Sem arte gerada por IA, em nenhuma forma.** Entram: fotos, desenhos e coisas dos jogos do João (ele fornece), assets originais que o site já usa (sprites do FireRed, a fonte do jogo, prints dos projetos) e elementos feitos em código (formas, traços em SVG, 3D com primitivas, dados reais).
- **Estrutura:** mesmo repositório, sem build, o mesmo `data.js` para as duas versões.

## 1. Estrutura e endereços

- Durante a construção, a landing page fica em `lp.html` (`/portfolio/lp`), sem links para ela; o site de hoje não muda.
- **A troca** acontece num passo só, depois da aprovação do João:
  - `index.html` (GBA) vira `jogar.html`, servido em `/portfolio/jogar` pelo GitHub Pages; continua na mesma pasta, então nenhum caminho do jogo muda.
  - `lp.html` vira `index.html`.
  - No console, o botão SIMPLES vira SITE e leva para `./`. Saem `simple.js`, seu CSS, a rota `#/simples` e o teste correspondente.
- **Links antigos** (os READMEs dos outros repositórios apontam para `/portfolio/#/projetos/N`): a landing page lê o hash e rola até a seção certa.
  - `#/projetos/N` vai ao projeto N; `#/projetos` aos projetos.
  - `#/sobre`, `#/experiencia`, `#/habilidades` e `#/contato` vão às seções.
  - `#/simples`, `#/opcoes` e qualquer outro vão ao topo.
  - A função pura `siteAnchor(hash)` em `logic.js` faz esse mapeamento e é testada no `check.mjs`.
- **Código novo:**
  - `lp.html` (só o esqueleto e as metatags).
  - `site/site.css`.
  - `site/main.js` (monta as seções a partir do `data.js`, idioma, âncoras, animações).
  - `site/cast.js` (os personagens-forma).
  - `site/scene3d.js` (o 3D, carregado sob demanda).
  - `assets/site/` (dados do GitHub e, quando chegar, o material do João).
- **Endereço do jogo num lugar só:** `PLAY_URL` em `site/main.js`. Vale `./` antes da troca e `jogar` depois.

## 2. Conteúdo, seção por seção

Tudo sai do `data.js`. A landing page não precisa caber na fonte nem nas janelas do jogo, então ganha um bloco próprio, `DATA.site`, com:

- `tagline` (pt/en): uma frase de abertura.
- `ui.pt` / `ui.en`: os textos da página (navegação, títulos das seções, botões, rótulos).
- `media`: o material do João, todo opcional: `photo` (recorte em PNG com fundo transparente) e `drawings` (lista de PNGs transparentes).
- `games`: os jogos dele, lista vazia por enquanto. Cada um terá `name`, `text` (pt/en), `media` (imagem, GIF, vídeo ou `.glb`) e `link`.

O que está em `media` ou em `games` só aparece quando existe. Nada de placeholder visível no site publicado.

1. **Barra do topo (fixa, discreta):**
   - A marca "JC" (uma das formas).
   - Âncoras: Projetos, Sobre, Experiência, Habilidades, Contato.
   - O botão PT/EN.
   - O botão laranja "Jogar ▶".
   - No celular, as âncoras viram um menu que abre por um botão.
2. **Abertura:**
   - "JOÃO CABRAL" bem grande, o cargo (`trainer.role`) e a `tagline`.
   - Dois botões: "Jogar meu portfólio" (vai ao GBA) e "Fale comigo" (vai ao contato).
   - Em volta, o palco da colagem:
     - os personagens-forma (seção 4);
     - um cartão de código digitando um objeto sobre o João (cidade, idiomas, desde 2022);
     - o Pikachu do `trainer.partner` como adesivo pixelado (sprite original);
     - um objeto low poly em 3D;
     - um print do GBA "colado com fita" que leva ao jogo;
     - a foto do João recortada, quando existir.
3. **Projetos (os 7 do `data.js`):**
   - Cada projeto é uma peça da colagem:
     - o primeiro print colado com fita (clicar abre todos os prints num `<dialog>`);
     - nome, tipo e ano;
     - o `pitch` grande e o `text`;
     - o stack em etiquetas coloridas;
     - o ícone do Pokémon do projeto como adesivo pixelado (liga com o GBA);
     - os links "Código" e "Ver ao vivo".
   - Por cima, dados reais do repositório: barra de linguagens e número de commits (seção 5).
   - Grade organizada com rotações e sobreposições leves; as peças alternam o material dominante.
4. **Sobre:**
   - O texto `trainer.about` em letra grande.
   - Os fatos (cidade, idiomas, em tecnologia desde 2022) num bloco de terminal.
   - A foto e os desenhos do João, quando existirem.
5. **Experiência:**
   - As 6 experiências de `badges` como canhotos de papel presos numa linha que se desenha ao rolar.
   - A formação (`education`) em canhotos menores.
6. **Habilidades:**
   - Os 8 `moves` num painel de dados: nome, barra de PODER, anos e texto.
   - As tecnologias de todos os projetos espalhadas como etiquetas em volta.
7. **Jogos:** só aparece quando `site.games` tiver algo. Cada jogo: mídia (o `.glb` num palco 3D girável), texto e link.
8. **Contato:**
   - Frase grande para os dois públicos ("Vaga ou projeto? Bora conversar." / "A role or a project? Let's talk.").
   - Os três contatos de `contact` como botões grandes.
   - Os personagens olham para o botão sob o cursor.
   - Rodapé: "Jogar" de novo, link do código e "Feito à mão em HTML, CSS e JS, sem framework."

## 3. Sistema visual

**Cores** (o contraste dos textos foi calculado):

- `--ink: #0E0C12`, o preto, fundo principal.
- `--paper: #F4EEE3`, o papel, para cartões e para texto sobre o preto.
- `--orange: #FF6A1F`. Texto preto em cima: 6,8:1. Laranja sobre preto: 6,8:1.
- `--purple: #6A3BF0`. Texto papel em cima: 5,1:1. Roxo sobre preto só em elementos grandes ou decorativos.
- `--green: #2BD67B`. Texto preto em cima: 10:1.

**Tipografia** (cada família ligada a um material):

- Títulos e cartazes: **Unbounded** (700–900), larga e arredondada.
- Texto corrido e papel: **Bricolage Grotesque**.
- Dados e código: **JetBrains Mono**.
- Pixel: **Gen3**, a fonte original do jogo, que o site já tem.
- As três primeiras vêm do Google Fonts com `display=swap`.

**Materiais:** cada seção se apoia em dois ou três, nunca em todos ao mesmo tempo.

1. **Papel:** cartões em `--paper`, borda rasgada (máscara SVG feita em código), fitas adesivas em CSS, rotações de ±1° a ±6°.
2. **Formas chapadas:** círculo, estrela, bolha e rabisco nas cores da paleta.
3. **Pixel:** sprites e ícones do FireRed ampliados com `image-rendering: pixelated`, rótulos na fonte Gen3.
4. **Dados:** blocos em mono, JSON, terminal, barras de linguagens, a faixa corrida de números do GitHub.
5. **3D low poly:** primitivas com sombreamento facetado (`flatShading`) nas cores da paleta e, depois, os modelos do João.
6. **Desenho:** traços em SVG que se desenham sozinhos (setas, círculos, sublinhados) e, depois, os desenhos escaneados do João.

**Ordem dentro da bagunça:** uma grade de 12 colunas e uma escala de espaçamento fixa. A bagunça vive em camadas por cima da grade, com rotação e profundidade controladas. O texto nunca fica rotacionado a ponto de atrapalhar a leitura.

## 4. O elenco (personagens-forma)

- Quatro personagens feitos em SVG, cada um de um material:
  - um círculo laranja chapado;
  - uma estrela verde com textura de papel (ruído em SVG);
  - uma bolha roxa brilhante, quase 3D (gradientes);
  - um rabisco desenhado a traço.
- Cada um tem olhos.
  - As pupilas seguem o cursor (no celular, o último toque; parado, olham em volta) e eles piscam em intervalos aleatórios.
  - Ao passar o mouse, se esticam e amassam.
- Aparecem na abertura, na marca do topo e no contato. Um único laço de `requestAnimationFrame` atualiza só os que estão visíveis.

## 5. Dados de programação reais

- `tools/github_stats.mjs` usa `gh api` para ler, de cada projeto com `links.repo`: linguagens (bytes), número de commits, data de criação e último push. O resultado vai para `assets/site/github.json`.
- Roda à mão quando o João quiser atualizar, e o arquivo vai para o git.
- A página lê esse JSON. Se ele faltar, as partes de dados somem e o resto continua.
- Usos: a barra de linguagens e os commits de cada projeto, e uma faixa corrida entre seções ("7 projetos · N commits · Python 41% · TypeScript 33% …").

## 6. Movimento

- **Revelar ao rolar:** um `IntersectionObserver` põe `.in` e o CSS anima entrada, rotação e opacidade, em cascata (`--i`).
- **Adesivos colando:** escala 1,25 → 0,96 → 1 com um giro.
- **Traços:** `pathLength="1"` e `stroke-dashoffset` de 1 a 0 quando entram na tela.
- **Cartão de código:** digita com o `typewriter.js` que o site já tem.
- **Peças de projeto inclinam com o mouse** (perspectiva; só com ponteiro fino).
- **3D:** o three.js (versão fixa, pelo jsDelivr) só carrega quando o palco está para entrar na tela.
  - Gira devagar e reage ao mouse.
  - Para quando sai da tela.
- **`prefers-reduced-motion`:** nada se move; tudo aparece no lugar final e o 3D mostra um quadro parado.

## 7. Idioma, acessibilidade e desempenho

- **Idioma:** o mesmo do GBA (chave `lang` no `localStorage`, senão o idioma do navegador). O botão PT/EN troca os textos sem recarregar e atualiza `<html lang>`.
- **Estrutura:**
  - Marcação semântica: `header`, `nav`, `main`, `section` com `h2`, `footer`.
  - Um `h1` só.
  - O que é decoração leva `aria-hidden`; imagens com `alt`.
  - Foco visível em tudo que é clicável.
  - O `<dialog>` dos prints fecha com Esc.
- **Celular:**
  - Tudo empilha em uma coluna.
  - Nenhuma rolagem horizontal a partir de 360 px.
  - A colagem da abertura se reorganiza: menos peças, maiores.
- **Desempenho:** prints com `loading="lazy"` e dimensões declaradas; o three.js e os modelos só carregam quando necessários.
- **Metatags:** título e descrição próprios. O `og:image` continua o de hoje até existir um da landing page.

## 8. Testes

- **`check.mjs`:**
  - `siteAnchor` com os hashes antigos e novos.
  - `DATA.site` com as mesmas chaves em pt e en.
  - Os arquivos de `media` e `games` existem quando citados.
  - O `github.json`, se existir, tem um registro por repositório citado.
- **`tools/e2e.mjs`** (novos passos, em `lp.html`):
  - Carrega sem erro no console e tem as 6 seções.
  - Mostra 7 projetos.
  - O PT/EN troca os textos e fica salvo.
  - O botão "Jogar" aponta para `PLAY_URL`.
  - `#/projetos/3` rola até o terceiro projeto.
  - Com movimento reduzido, tudo está visível.
  - Nenhuma rolagem horizontal a 390 px.
- **Verificação visual:** capturas da página inteira a 1440×900 e 390×844@3, olhadas antes de cada commit visual.

## 9. README do perfil no GitHub (parte 3)

- **Identidade:** a mesma da landing page.
- **Banner animado:** feito em SVG à mão, com o elenco piscando, o nome e as cores. O GitHub mostra SVG animado em `<img>`.
- **Seções:**
  - o texto de hoje com a voz do João;
  - links para a landing page e para o GBA;
  - uma animação curta do GBA em APNG, capturada do próprio site;
  - a tabela de projetos;
  - o stack.
- **Sem serviços de terceiros que costumam cair.** Saem o typing-svg e os shields.io; o stack vira etiquetas em SVG próprias.
- Mantém o que o João escreveu, ajustando só o necessário para a nova estrutura.

## Fora do escopo

- Física de arrastar as etiquetas de habilidades.
- Imagem de prévia (`og:image`) nova.
- Blog.
- Modo claro.
- Conversão automática dos desenhos escaneados. Quando o material chegar, decide-se se precisa.
