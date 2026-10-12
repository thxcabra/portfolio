# Portfólio — Centro Pokémon jogável num GBA

- **Data:** 2026-10-12
- **Status:** aprovado em conversa; aguardando revisão desta spec
- **Substitui:** a Pokédex vermelha como porta de entrada (`docs/specs/2026-10-11-pokedex-portfolio-design.md`). Reaproveita o passe visual (`docs/specs/2026-10-12-pokedex-visual-pass-design.md`): fonte Gen3, molduras, sons, gritos, texto digitando, opções, vídeo de fundo e o script de build.

## 1. Objetivo

O site vira um **jogo curto dentro de um Game Boy Advance**: você é o treinador num **Centro Pokémon** de verdade (mapa, tiles e personagens do FireRed) e descobre o portfólio jogando — pega projetos no **PC**, vê na **Equipe/Resumo** (com prints), consulta a **Pokédex**, lê o **cartão de treinador** no quadro, aprende as **habilidades** com o Tutor de Golpes e fala com a **Enfermeira** (boas-vindas, sobre, contato). Quem tem pressa usa a barra **PROJETOS · SOBRE · CONTATO**.

O GBA é um **console**: o Centro Pokémon é o primeiro **cartucho**; minijogos e jogos do João entram depois como outros cartuchos.

## 2. Regras que valem para tudo

- **Só assets originais do jogo** (despejos `pokefirered`/`pokeemerald` em `new assets/`). Nenhum sprite desenhado à mão ou gerado. Exceções declaradas: o corpo do GBA (geométrico, cores chapadas, sem marca) e os glifos `@ # _ –` da fonte.
- **Pixel único:** tudo em pixels de jogo, ampliado por um `k` inteiro em pixels físicos. Nada esticado por fator fracionário (o motivo dos sprites "esquisitos" de hoje: os GIFs de 96×96 são os sprites de 64×64 esticados 1,5×).
- **Exceção única:** os **prints** dos projetos são imagens reais, mostradas na resolução delas dentro de uma moldura do jogo (pixelizar deixaria ilegível).
- Fonte `Gen3` / `Gen3 Small` em tamanho único (16px de jogo), molduras `frame-1..10`, sons e gritos originais — como no passe visual.

## 3. Arquitetura

```
index.html          contêiner do GBA
gba.js              o console: corpo, escala, botões (teclado/clique/toque), som, opções, troca de cartucho
carts/center/       o cartucho do Centro Pokémon
  world.js          mapa, personagens, andar, colisões, clique-pra-andar, interações
  dialog.js         caixa de diálogo, texto digitando, ▼, menus SIM/NÃO e listas
  menu.js           menu START
  screens/          pc.js, party.js, summary.js, pokedex.js, card.js, tutor.js
logic.js            funções puras (caminho, grade, equipe, escalas, rotas...)
data.js             conteúdo (PT/EN)
sound.js, typewriter.js   como hoje
tools/build_assets.py     gera tudo em assets/ a partir dos despejos
```

**Contrato do cartucho** (o mínimo para caber jogos futuros):

```js
export default {
  start(screen, api) {},   // screen: elemento 240×160 (px de jogo); api: { sfx, cry, store, opt, t }
  stop() {},
  button(name, down) {},   // 'up' 'down' 'left' 'right' 'a' 'b' 'start' 'select' 'l' 'r'
  pointer(x, y) {},        // clique/toque dentro da tela, já em pixels de jogo
  open(target) {},         // atalho externo: 'projects' | 'about' | 'contact' | rota '#/dex/3'
};
```

O GBA não sabe nada de Pokémon; o cartucho não sabe nada de escala, teclado ou toque.

## 4. O GBA

- Tela 240×160; corpo 432×202 px de jogo com a silhueta do GBA original (laterais arredondadas, L/R abraçando os cantos de cima), estilizado para a tela ocupar a maior parte. `k` = maior inteiro (em pixels físicos) que cabe na janela: 1920×1080 → 4× (tela 960×640); 1366×768 → 3× (720×480).
- Corpo em SVG de grade, como o GBA: direcional (esq.) com START/SELECT abaixo dele (rótulo à esquerda do botão), A/B (dir.) com B mais baixo, luz POWER no alto à direita, alto-falante em fendas diagonais embaixo à direita com o botão SOM. Na moldura sob a tela, **"JOÃO CABRAL"** na fonte do jogo. Faixa inferior com os atalhos **PROJETOS · SOBRE · CONTATO** (`Gen3 Small`).
- **Botões:** setas/WASD = direcional · Z/Espaço = A · X/Esc = B · Enter = START · Shift = SELECT · Q/E = L/R; clique/toque nos botões do corpo; botão do corpo afunda quando a tecla é usada.
- **Fundo da página:** vídeo de gameplay quando houver clipes (como no passe visual); senão o pontilhado escuro.
- **Celular em pé:** um GBA SP aberto (256×320) — tampa com a tela na largura toda (`k` fracionário em CSS, inteiro em pixels físicos), dobradiça, base com direcional, A/B, SELECT/START e alto-falante com SOM; áreas de toque maiores que o desenho. **Deitado:** o GBA horizontal com o `k` que couber. A troca acontece ao girar, sem recarregar.
- **Dentro da tela, fiel ao FireRed:** tela de título montada das camadas originais (`title_screen.c`: chamas com o mesmo gerador e semente, brilho no logo a cada 574 quadros, PRESS START piscando 60/30); caixa de mensagem com a moldura `menu_message` (240×48 em y=112), texto em (16,121), 15 px por linha, cores #626262/#D5D5CD e a seta vermelha logo após a última letra. Conferido pixel a pixel contra uma referência desenhada pelas regras do jogo.

## 5. O mundo (Centro Pokémon 1º andar)

**Mapa:** layout `PokemonCenter_1F` (15×10 casas = 240×160, cabe inteiro, sem câmera). O build monta a partir de `data/layouts/PokemonCenter_1F/map.bin` + tilesets `primary/building` e `secondary/pokemon_center` (tiles, paletas, `metatiles.bin`, `metatile_attributes.bin`) e gera:

- `assets/world/center-floor.png` — tudo que fica embaixo dos personagens;
- `assets/world/center-over.png` — a parte de cima dos metatiles que cobre os personagens (balcão, etc.), conforme o tipo de camada do jogo;
- `assets/world/center.json` — colisão 15×10 (bits de colisão do `map.bin`), comportamento de cada casa (para achar o PC, porta, escada) e as posições de objetos/saídas (do `map.json` de um Centro do FireRed, ex.: Viridian).

**Personagens** (sprites de `graphics/object_events/pics/people/`, paletas pela tabela de gráficos do jogo): Red (andar, 3 quadros por direção), Enfermeira (7,2), Senhor (12,5), Garoto (4,7), Menino que anda pela sala (2,3). Balão de "!" (`misc/emoticons.png`) quando alguém nota o jogador.

**Andar:** grade de 16px, 4 direções, velocidade do jogo (16 quadros por casa; correndo com B segurado, 8). Colisão pelo mapa e pelos personagens. **Clique/toque:** no chão → caminho mais curto (BFS na grade) até lá; numa pessoa/objeto → anda até a casa da frente, vira e interage. A ou clique interage com o que está à frente.

**Saídas:** escada (1,6) → "A sala de minijogos está em obras!"; porta (6–8, 8) → "Lá fora ainda está em construção." (ganchos para o futuro).

**Quadro na parede:** um elemento de parede do próprio tileset do Centro; se a sala não tiver um adequado, usa-se o painel/cartaz de outro tileset interno do FireRed — nunca um desenho novo. Definido na fase 1 ao montar o mapa.

## 6. Interações e telas

| Onde | Comportamento | Gráficos do jogo |
|---|---|---|
| **Enfermeira** | 1ª conversa: boas-vindas + comandos (andar, A, START, atalhos). Depois: menu **CUIDAR DOS POKÉMON** (animação de cura + jingle) / **SOBRE O JOÃO** (diálogo) / **CONTATO** (lista de links) / **NADA**. | personagem, molduras |
| **PC** | Som de ligar → "PC DO JOÃO" → Box **PROJETOS** (grade 6×5, ícones animados de 2 quadros, mão-cursor, papel de parede). Lado esquerdo mostra o projeto apontado. A: **LEVAR / RESUMO / CANCELAR** (ou **DEVOLVER** se já está na equipe). Equipe cheia (6): aviso. | `pokemon_storage/`, `pokemon/<nome>/icon.png` + paletas de ícone |
| **Equipe** (START → POKéMON) | Até 6 projetos levados; A → Resumo; opção de devolver. | `party_menu/` |
| **Resumo** | Páginas trocadas com ←/→ ou L/R: **INFO** (sprite, nº, nome do projeto, tipos, ano, links) · **GOLPES** (stack do projeto como golpes, com etiqueta de tipo) · **PRINTS** (moldura; ←/→ passa; A amplia em tela cheia; sem prints: "sem imagem"). | `summary_screen/`, `menu_info` |
| **Pokédex** (START) | Todos os projetos, com marcadores **visto** (apontou no PC) e **capturado** (levou). Entrada: sprite, descrição, atalho para os prints. Deep link `#/dex/{n}`. | `pokedex/` |
| **Quadro** | Cartão de treinador do FireRed: frente (nome, ID, anos de experiência, Pokédex, insígnias) → A **vira** (animação + som) → verso "sobre mim". | `trainer_card/` |
| **Senhor** | Tutor de Golpes: diálogo → lista de habilidades (tipo, PODER, PP, descrição). | `menu_info`, molduras |
| **Garotos** | Dicas curtas (ex.: "Dá pra levar até 6 projetos na equipe!"). | personagens |
| **Menu START** | POKéDEX · POKéMON · JOÃO (cartão) · OPÇÕES · SAIR. | molduras |

**Atalhos** (barra do GBA): **PROJETOS** → Pokédex; **SOBRE** → cartão de treinador; **CONTATO** → lista de contato da Enfermeira. Abrem direto, sem andar.

**Sprites de Pokémon:** frente do **FireRed** (`graphics/pokemon/<nome>/front.png` + `normal.pal` / `shiny.pal`) e ícones da Box (`icon.png`, 2 quadros). Gerados para os 386, nomeados pelo número (`assets/mon/{n}/front.png`, `front-shiny.png`, `icon.png`). Substituem `assets/sprites/` (GIFs esticados e sprites do Emerald), que sai do repositório.

**Shiny:** continua (1/16 por projeto, `?shiny` força), com a estrela do Resumo (`summary_screen/shiny_star.png`).

## 7. Dados (`data.js`)

- `projects[].shots`: lista opcional de imagens (`assets/projects/<arquivo>`); `check.mjs` confere se existem.
- Textos novos de diálogo (Enfermeira, garotos, Tutor, avisos) em `ui.pt` / `ui.en`.
- Equipe e vistos ficam no `localStorage` (`party`, `seen`).

## 8. Acessibilidade

- Todo conteúdo é alcançável pela barra de atalhos e pelo menu START (botões/links reais, foco visível como ▶).
- Caixa de diálogo com `aria-live="polite"`; o mapa é decorativo (`aria-hidden`).
- `prefers-reduced-motion`: abertura e texto instantâneos, sem transições; andar continua.
- Toque: alvos ≥ 24px nos controles do celular.

## 9. Testes

- `tools/build_assets.py`: mapa montado 240×160, colisão 15×10, PC/porta/escada encontrados pelo comportamento das casas, fundos de tela gerados nos tamanhos certos, 386 sprites/ícones.
- `check.mjs`: caminho (BFS) respeitando colisão e personagens; levar/devolver com equipe cheia; dados (incluindo prints existentes); tudo que já existe.
- `tools/e2e.mjs`: andar até o PC (teclado) e por clique; levar projeto; Equipe e Resumo (3 páginas); Pokédex com contadores; conversa e menu da Enfermeira; virar o cartão; atalhos; layout de celular; console sem erros.
- Screenshots em 1920×1080, 1366×768, 390×844 e 844×390 a cada fase.

## 10. Fases

Cada fase termina funcionando, com screenshots para revisão antes da próxima. Um plano por fase.

1. **GBA + Centro Pokémon andável:** corpo do GBA e contrato de cartucho; mapa real; Red andando (teclado e clique-pra-andar); personagens parados; caixa de diálogo com as boas-vindas da Enfermeira; sprites dos Pokémon trocados pelos do FireRed.
2. **PC + Equipe + Resumo (com prints) + menu START.**
3. **Pokédex + quadro (cartão) + Tutor de Golpes + menu da Enfermeira (cura, sobre, contato) + atalhos.**
4. **Celular, acabamento, acessibilidade e testes completos.**

## 11. Fora do escopo

2º andar / sala de minijogos, a cidade lá fora, batalha, outros cartuchos, música, deploy.
