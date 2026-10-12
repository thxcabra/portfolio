# Telas e menu START — design

Complementa `2026-10-12-centro-pokemon-design.md`. Substitui a seção 6 (interações e telas) e as fases 2–3 de lá; o resto continua valendo. O modo "portfólio padrão" (site mais convencional, ainda com a estética Pokémon) fica para depois e terá um item em OPÇÕES.

## 1. Objetivo

Acesso rápido a tudo pelo menu START, sem precisar andar, com cada tela no visual da tela correspondente do FireRed. Andar pela sala continua sendo o jeito "jogável" de chegar nas mesmas telas.

## 2. Decisões

- **Menu START direto ao ponto:** PROJETOS · SOBRE · EXPERIÊNCIA · HABILIDADES · CONTATO · OPÇÕES · SAIR, com barra de ajuda em linguagem simples.
- **Projetos em dois papéis:** PROJETOS abre a lista com todos (rápido, para ver); o PC da sala abre a Box onde se monta a equipe (para brincar).
- **Prints:** miniatura pixelada na tela do GBA; A amplia em tamanho real numa janela por cima de tudo (imagem ou vídeo).
- **Experiência e habilidades:** no visual da Bolsa e do Estojo de TM.
- **Descoberta:** na 1ª visita o menu abre sozinho depois das boas-vindas; depois, dica "START: MENU" até o primeiro uso.
- **Arquitetura:** pilha de telas dentro do cartucho (abordagem A).

## 3. Arquitetura

```
carts/center/
  ui.js              pilha de telas, lista com cursor (teclado, mouse, toque, roda), janelas com moldura
  screens/
    menu.js          menu START + barra de ajuda
    dex.js           PROJETOS (lista)
    summary.js       página do projeto (INFO, STACK, PRINTS)
    bag.js           EXPERIÊNCIA
    tmcase.js        HABILIDADES
    card.js          SOBRE (cartão de treinador)
    contact.js       CONTATO
    options.js       OPÇÕES
    box.js           PC → Box e equipe
```

- **Pilha:** cada tela é `{ el, button(name, down), pointer(x, y), close() }`. START empilha o menu; A empilha a tela escolhida; B desempilha. Com a pilha não vazia a sala fica congelada (como já acontece com o diálogo). A caixa de diálogo continua por cima de qualquer tela.
- **Fundos:** cada tela usa os fundos, molduras e ícones originais do FireRed, gerados pelo `tools/build_assets.py` como a tela de título (tilemaps + paletas → PNG). Os arquivos exatos de cada tela são definidos no plano da fase.
- **Contrato do console** (o cartucho continua sem tocar fora da tela). Duas adições ao `api`:
  - `api.show(media, index)` — abre a janela de print ampliado por cima de tudo; `media` = lista de `{ src, kind: 'image' | 'video', alt }`. Enquanto aberta, os botões vão para ela.
  - `api.link(path)` — o cartucho avisa qual tela está aberta; o console reflete no endereço (`#/projetos/3`). Na carga e em `hashchange`, o console chama `cart.open(path)` (já previsto no contrato).

## 4. Regras comuns a todas as telas

- ↑/↓ movem o cursor ▶; A abre/confirma; B volta um nível; ←/→ ou L/R trocam aba/página.
- Mouse/toque: passar ou tocar num item move o cursor; clicar no item já apontado = A. Roda do mouse rola listas. As dicas "A OK · B VOLTAR" da tela são clicáveis.
- Listas não dão a volta (como no jogo); o menu START dá.
- Texto longo (emprego, habilidade, sobre mim) abre na caixa de diálogo, em páginas com a seta.
- Sons do jogo: mover (`select`), abrir janela (`win_open`), voltar.
- Toda lista é HTML de verdade (botões), com o item apontado anunciado para leitor de tela; `prefers-reduced-motion` tira as animações.

## 5. Telas

| Tela | Como funciona | Visual do FireRed |
|---|---|---|
| **Menu START** | Janela no canto superior direito com os 7 itens; barra de ajuda embaixo descreve o item apontado. Fecha com SAIR, B ou START. | menu de campo + janela de ajuda |
| **PROJETOS** | Lista com todos os projetos (sempre visíveis), numerados pela ordem em `data.js` (001, 002…; é esse o `{n}` dos links); ● = está na equipe; sprite do apontado ao lado. A → página do projeto. | Pokédex (lista) |
| **Página do projeto** | Abre com o grito do Pokémon. Abas com ←/→: **INFO** (sprite com chance shiny 1/16 e estrela, nº, nome do projeto, Pokémon, tipos, ano, descrição curta, links VER SITE / CÓDIGO que abrem em nova aba) · **STACK** (tecnologias como golpes, com etiqueta de tipo da habilidade correspondente; NORMAL se não houver) · **PRINTS** (miniatura pixelada; ←/→ troca; A amplia; sem prints: "SEM IMAGENS"). ↑/↓ vai para o projeto anterior/próximo. | Resumo |
| **Print ampliado** | Fora da tela do GBA: fundo escurecido, mídia em tamanho real numa moldura do jogo, contador "2/4". ←/→ troca; B, Esc ou clique fora fecha. Vídeo: mudo, em loop, com controles. | moldura de janela |
| **EXPERIÊNCIA** | Bolsa com o título "EXPERIÊNCIA" à esquerda; lista de empregos (empresa, período) à direita; caixa embaixo com a insígnia, cargo, período e o começo do texto. A lê o texto inteiro. | Bolsa (`item_menu`) + insígnias |
| **HABILIDADES** | Lista "TM01 TYPESCRIPT" com o disco na cor do tipo; janela com TIPO, PODER (0–100) e ANOS; caixa de descrição. A lê o texto inteiro. | Estojo de TM (`tm_case`) |
| **SOBRE** | Cartão de treinador. Frente: NOME, ID, CARGO, TEMPO (anos desde o início), PROJETOS (quantidade), fileira de insígnias (empregos), sprite do Red. A vira o cartão (animação + som) → verso com o "sobre mim" em páginas. B fecha. | Cartão de Treinador |
| **CONTATO** | Janela com E-MAIL · LINKEDIN · GITHUB · CURRÍCULO (só se houver PDF). A abre o link em nova aba; E-MAIL pergunta ESCREVER / COPIAR ("Endereço copiado!"). | janela padrão |
| **OPÇÕES** | TEXTO (LENTO/MÉDIO/RÁPIDO) · SOM (ON/OFF) · MOLDURA (as 10 do jogo, vale para todas as janelas) · IDIOMA (PT/EN). ←/→ mudam; tudo salvo. | Opções |
| **PC → Box** | Som de ligar → "PC DO JOÃO" → Box PROJETOS: grade 6×5 de ícones animados com a mão-cursor; painel lateral com o projeto apontado. A: LEVAR / VER PÁGINA / CANCELAR (DEVOLVER se já está na equipe). Painel da equipe (até 6); com 6, aviso de equipe cheia. | `pokemon_storage` |

## 6. A sala abre as mesmas telas

- **Enfermeira:** depois das boas-vindas, menu CURAR / SOBRE O JOÃO / CONTATO / ATÉ LOGO. CURAR toca a animação da máquina com uma Poké Ball por projeto da equipe + jingle.
- **Quadro (mapa de Kanto):** EXPERIÊNCIA ("os lugares por onde o João passou").
- **Senhor (Tutor de Golpes):** HABILIDADES.
- **PC:** Box (só por aqui).
- **Garotos:** dicas curtas.

## 7. Primeira visita e links

- Boas-vindas da Enfermeira (já existe) → o menu START abre sozinho em PROJETOS. Guardado em `localStorage` (`welcomed`).
- Até o jogador usar o menu uma vez (`menuUsed`), uma dica "START: MENU" fica num canto da tela enquanto ele anda.
- `#/projetos`, `#/projetos/{n}`, `#/sobre`, `#/experiencia`, `#/habilidades`, `#/contato` abrem direto na tela, pulando o título (entra na sala e empilha a tela). B a partir dali volta para a sala. Endereço inválido → sala.

## 8. Dados (`data.js`)

- `trainer.role` (CARGO, pt/en).
- `projects[].shots`: lista opcional de `{ src, alt }` (imagem ou vídeo, pelo arquivo) em `assets/projects/`; `check.mjs` confere se existem.
- `moves[].years` substitui `pp`; `power` = proficiência 0–100.
- `contact[]`: aceita `cv` (caminho do PDF) além dos links.
- Textos da barra de ajuda, menus e telas em `ui.pt` / `ui.en`; tudo precisa caber nas janelas (o `check.mjs` mede pela tabela de larguras da fonte).
- Equipe (`party`) e opções no `localStorage`.

## 9. Testes

- `check.mjs`: pilha (abrir/voltar), lista (cursor, limites, rolagem), rotas (`#/projetos/3` → telas certas, inválida → sala), equipe (levar, devolver, 7º recusado), textos cabendo nas janelas, prints existentes.
- `tools/e2e.mjs`: para cada tela, abrir pelo menu → navegar → B volta; links diretos; print ampliado abre e fecha; equipe; nenhum erro no console.
- `tools/build_assets.py`: fundos de cada tela nos tamanhos certos.
- Screenshots em 1920×1080, 1366×650, 390×844 e 844×390 a cada fase.

## 10. Fases

Cada fase termina funcionando e é revisada antes da próxima; um plano por fase.

1. **Base:** pilha de telas + menu START com barra de ajuda + OPÇÕES + CONTATO + abertura automática e dica + rotas.
2. **Projetos:** PROJETOS + página do projeto (3 abas) + print ampliado + sprites de Pokémon do FireRed (`assets/mon/{n}/`).
3. **O resto:** EXPERIÊNCIA + HABILIDADES + SOBRE + objetos da sala abrindo as telas + menu da Enfermeira.
4. **PC:** Box + equipe + cura.

Depois: câmera seguindo o jogador (opcional), modo "portfólio padrão".
