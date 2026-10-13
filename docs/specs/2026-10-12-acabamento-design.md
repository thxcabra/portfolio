# Acabamento — design

Rodada para tirar a "cara de protótipo": controles, sons, tela no centro, dados reais, abertura e um fundo vivo atrás do GBA. Complementa `2026-10-12-centro-pokemon-design.md` e `2026-10-12-telas-e-menu-design.md` (as telas de projetos, sobre, experiência, habilidades e o PC continuam como lá, nas fases 2–4).

São três etapas, cada uma com o próprio plano e revisão: **A** (ajustes rápidos), **B** (abertura), **C** (fundo). A música fica para um projeto próprio depois (seção 5).

## 1. Etapa A — ajustes rápidos

### 1.1 Controles

| Botão | Teclado | Mouse/toque |
|---|---|---|
| A | Z, Espaço, Enter | botão esquerdo (clique/toque) |
| B | X, Backspace | botão direito (sem abrir o menu do navegador sobre o GBA) |
| START | Esc | botão START do corpo, dica "START: MENU" |
| SELECT | Shift | botão SELECT do corpo |
| direcional | setas, WASD | direcional do corpo |
| L / R | Q / E | ombros do corpo |

- Botão direito sobre o GBA = B: volta um nível em qualquer tela e, na sala, segurar = correr (como segurar B).
- O clique esquerdo continua fazendo o que já faz (andar até o ponto, abrir o item apontado) — é o A do mouse.

### 1.2 Sons

- **Volume:** OPÇÕES → SOM passa a ter DESLIGADO / BAIXO / MÉDIO / ALTO (padrão MÉDIO, cerca de 40% do volume atual). O botão SOM do corpo liga/desliga voltando ao último nível escolhido. Tudo passa por um volume geral.
- **Fiel ao jogo** (tabela do decomp; o pacote é numerado pelo id da `songs.h`, em hexadecimal):
  - A em pessoa, placa, estante, quadro: `SE_SELECT` (o PC não: só `SE_PC_ON`).
  - START no título: grito do Charizard (#6) e a tela clareia para branco antes de entrar na sala.
  - Bater na parede: `SE_WALL_HIT`, repetindo a cada 32 quadros (0,53 s) enquanto segura.
  - OPÇÕES: nenhum som (mudar valores, mover, sair).
  - Fim de mensagem (A na última página): nenhum som; troca de página: `SE_SELECT` (já é assim).
- As telas das próximas fases já nascem com os sons da tabela (cartão `SE_CARD_*`, Bolsa `SE_BAG_*`, Box `SE_PC_LOGIN`/`SE_PC_OFF`, bolas da cura `SE_BALL`).

### 1.3 Tela do jogo no centro da janela

O GBA se desloca para que o **centro da tela do jogo** coincida com o centro da janela (no GBA deitado e no SP em pé). A escala inteira passa a considerar a maior distância do centro da tela às bordas do corpo, para nada sair da janela.

### 1.4 Nome

Os textos se referem a ele como **JOÃO CABRAL** (boas-vindas, ajuda do menu, CONTATO, falas). Tudo continua cabendo nas janelas (o `check.mjs` mede).

### 1.5 Dados reais (do currículo e do GitHub)

- **Treinador:** JOÃO CABRAL; cargo "Engenheiro de Software · IA e Automação de Dados · Game Dev" / "Software Engineer · AI & Data Automation · Game Dev"; Palhoça, SC; resumo (pt/en) a partir do "Resumo" do currículo; idiomas: Português (nativo), Inglês (fluente). TEMPO conta desde 2022 (início em Ciência da Computação na UFSC) — ajustável.
- **Experiência** (insígnias, na ordem): MOIC Digital — Intelligence Engineer (set/2026–hoje); MOIC Digital — Social Media Manager (out/2024–hoje); CapyFi — SMM (mai–set/2026); Fogo — SMM (mar–jul/2026); Kaia DLT Foundation — SMM (abr/2025–abr/2026); Haust Labs — SMM (nov/2024–fev/2026). Textos de cada uma a partir do currículo.
- **Formação** (nova lista): UFSC — Ciência da Computação (2022–2025); UNIASSELVI — Sistemas de Informação (2026); Wizard by Pearson — Inglês avançado (2015–2021). Na tela EXPERIÊNCIA (fase 3) vira um segundo bolso da Bolsa: TRABALHO / FORMAÇÃO (←/→ troca, `SE_BAG_POCKET`).
- **Habilidades** (golpes): Python, TypeScript/JavaScript, React, FastAPI, C#/Unity, LLMs e IA, GCP/BigQuery, pipelines de dados, design (Figma/Aseprite/Blender). PODER e ANOS começam como estimativa e o João ajusta no `data.js`.
- **Contato:** E-MAIL (joaovcabralm@hotmail.com), LINKEDIN (linkedin.com/in/joao-cabral-machado), GITHUB (github.com/thxcabra). **Sem telefone.** CURRÍCULO só com uma versão do PDF sem telefone.
- **Projetos:** entram na fase 2. PitchIQ e Furioso-Bot são públicos; Magnifyer-Glass, replai, CallSync e moic-website são privados — o João manda descrição, stack, ano, link e prints. O link do Furioso-Bot só entra depois que as chaves vazadas no `.env` forem trocadas e o arquivo sair do histórico.

### 1.6 Prévia de link

`og:title`, `og:description`, `og:image` (1200×630, um screenshot do GBA com o título, gerado pelo `tools/shots.mjs`) e `twitter:card`, para o link aparecer bem no LinkedIn e no WhatsApp.

## 2. Etapa B — abertura

1. A página abre com o GBA desligado: tela preta, luz POWER apagada.
2. Assim que as fontes e o título estão carregados, a luz acende e a tela "liga" (clareia do preto).
3. A abertura real do FireRed: a cena da GAME FREAK com a estrela cadente (gráficos e tempos de `intro.c`).
4. A entrada da tela de título como no jogo (logo, banner da versão, Charizard aparecendo, chamas começando — tempos de `title_screen.c`), parando no estado atual (PRESS START piscando).
- Qualquer botão (teclado, clique, toque) pula para o título pronto, como no jogo.
- Na mesma sessão do navegador, recarregar vai direto ao título pronto. Links diretos (`#/contato`) pulam tudo, como hoje.
- Movimento reduzido: sem animação, direto ao título.
- Enquanto a abertura roda, a sala e as telas já carregam em segundo plano.

## 3. Etapa C — fundo: Kanto vivo

- Pallet Town e a Rota 1, montadas dos dados do jogo (`data/layouts`, tilesets e conexões do `map.json`), com as bordas de árvores do próprio mapa em volta.
- Animações dos tilesets do jogo (água, flores) e algumas pessoas do próprio mapa andando à toa.
- A câmera passeia devagar pelo mapa (vai e volta), no mesmo tamanho de pixel da tela do jogo, sempre em escala inteira.
- Escurecido e com vinheta, para o GBA continuar em destaque. No celular em pé, ocupa o espaço vazio acima e abaixo do SP.
- Movimento reduzido: fundo parado. Aba escondida: tudo pausa. Substitui o fundo xadrez e o vídeo (o suporte a vídeo sai).

## 4. Testes

- `check.mjs`: novos dados (formação, contatos sem telefone, textos cabendo), níveis de volume, cálculo da posição centralizada.
- `tools/e2e.mjs`: clique direito = B (fecha menu), Esc = START, Enter = A; volume salvo; centro da tela do jogo no centro da janela; abertura pulável e pulada na 2ª carga; fundo presente e pausando com a aba escondida.
- `tools/build_assets.py`: sons novos no pacote certo (ids em hexadecimal); mapa de fundo nos tamanhos certos.
- Screenshots nos 4 tamanhos a cada etapa.

## 5. Depois (projetos próprios)

- **Música:** tocar as músicas do jogo a partir do próprio decomp (sequências MIDI + instrumentos/samples do GBA), recriando o sintetizador no navegador: tema do título, do Centro Pokémon e o jingle da cura (com a música pausando durante a cura, como no jogo).
- Em seguida, as fases 2–4 das telas (projetos, sobre/experiência/habilidades, PC), já com os dados reais.
