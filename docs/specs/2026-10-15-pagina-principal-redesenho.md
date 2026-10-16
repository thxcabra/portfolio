# Página principal: redesenho com a temática do João

Revisão da landing page (`docs/specs/2026-10-14-landing-page-design.md`). Vem do retorno do João em 14/10 e do questionário respondido no chat em 15/10:
- menos Pokémon e mais a temática dele;
- sem cara de IA, sem clichês de portfólio dev, nada "perfeito demais";
- coisas dele de verdade.

## Decisões do João

- **Sem letra à mão nem fotos** (dele ou das coleções).
- **Artes dele que entram:**
  - o bode desenhado em traço preto;
  - o bode em pixel art acenando (90×90);
  - a criatura de fogo em pixel art;
  - a Pokébola low poly estilo PS1 (só o GIF).
- **Usos aprovados:**
  - o bode de traço como mascote da abertura;
  - o bode pixel no contato e como segredo raro;
  - uma galeria "Coisas que eu faço";
  - o bode pixel no banner do README.

## O mundo

Uma fita do Cabra: desenho animado da Cartoon Network dos anos 2010 (estilo Gumball) vivendo no meio de jogos de PS1, gravado numa fita dos anos 90, com sotaque de terror analógico. Cores dele: preto, laranja, roxo, verde, e papel para texto e cartões.

- **Filtro de película** fixo por cima da página: grão animado (uma textura de ruído gerada uma vez e deslocada em passos), vinheta leve. Opacidade baixa, não atrapalha a leitura. Parado com movimento reduzido.
- **Desenho animado:**
  - contornos pretos grossos e cores chapadas;
  - o bode com "line boil": um filtro SVG de deslocamento alternando três sementes, a ~8 quadros por segundo;
  - sem sombras suaves nem brilhos.
- **3D estilo PS1:** uma fita VHS low poly em three.js.
  - Renderização em baixa resolução, ampliada sem suavização.
  - Vértices presos a uma grade de tela.
  - Textura afim, pontilhado ordenado e cor de 15 bits.
  - A etiqueta é de rotuladora, "CABRAL · PORTFÓLIO", numa textura de canvas de baixa resolução com filtro `Nearest`.
- **Tipografia:**
  - Dela Gothic One: títulos, pesada e angulosa como o traço do bode.
  - Bricolage Grotesque: texto corrido.
  - VT323: dados, contador da fita, transmissão.
  - Libre Baskerville: só os testes de habilidade, como no Disco Elysium.
  - Sai a fonte do jogo (Gen3) da página.
- **Campos de cor por seção:**
  - abertura em roxo;
  - projetos em preto;
  - galeria em verde;
  - sobre em laranja;
  - experiência em preto;
  - habilidades em preto profundo;
  - contato em verde.

## Conteúdo

- **Abertura:**
  - "Opa, eu sou o João Cabral." e "Pode me chamar de Cabral.", o cargo, "Jogar meu portfólio" e "Fale comigo", e a nota de que o portfólio também é um jogo.
  - No palco: o bode de traço grande sobre uma forma chapada, a fita VHS girando e o print do GBA colado com fita (a porta para o jogo).
- **Projetos:**
  - Magnifyer, PitchIQ e o portfólio primeiro, depois os outros. Só a ordem da página muda, o `data.js` não, então `#/projetos/N` continua valendo.
  - Cartões com contorno grosso, print colado com fita, etiquetas do stack e a barra de linguagens real.
  - Sem ícones de Pokémon.
- **Coisas que eu faço:** os dois bodes, a criatura de fogo e o GIF da Pokébola, como colagem, com legenda curta em cada um.
- **Sobre:**
  - Escrito a partir das respostas dele: Cabral → Cabra → GOAT (o thxcabra é "the cabra"); nerd de tudo e centrado em jogos (RPG, terror indie, ARG, mangá, anime, HQ); rap; as coleções (cartas de Pokémon, mangás, quadrinhos, camisas de futebol e basquete).
  - Fatos em lista simples: cidade, idiomas, desde 2022.
  - "Jogando agora" (Disco Elysium, Skyrim, Eldest Souls, Universe for Sale) e "No fone" (NOG, Matuê, BK, J. Cole, Tchelo, LPT Zlatan, Jotapê).
  - Os jogos que marcaram, com os motivos dele.
- **Experiência:** canhotos na linha do tempo, sem as insígnias do cartão de treinador.
- **Habilidades como testes do Disco Elysium:**
  - `PYTHON [Lendário: Sucesso] Automações, APIs (FastAPI), bots e pipelines de dados. 4 anos.`
  - A dificuldade vem do PODER: 90 é Lendário, 85 Formidável, 80 Desafiador, 75 Médio.
  - O nome tem a cor do "atributo" (o tipo do jogo mapeado nas cores da página).
  - As etiquetas do stack ficam em volta.
- **O que procura e contato:**
  - "Quero trabalhar na produção de jogos. E curto demais projeto com esporte e dados."
  - "Vaga ou projeto? Bora conversar."
  - Os três contatos; o bode pixel acenando.
- **Rodapé:** "Jogar", código do site, e a luz que pisca em Morse.
- **Saem:**
  - Pikachu, ícones de Pokémon, insígnias e a fonte Gen3;
  - o cartão `const joao`, o terminal de três bolinhas, as barras de habilidade, a faixa corrida;
  - o degradê brilhante e as formas com olhos (o bode toma o lugar delas);
  - as frases de efeito.

## Segredos (camada de ARG)

- **Konami code** (↑↑↓↓←→←→BA): interrupção de transmissão em tela cheia.
  - Barras de cor, "SINAL PERDIDO", "Esta transmissão foi interrompida. Não ajuste o seu aparelho.", "Aperte qualquer tecla para voltar".
  - Um bipe curto só se o som estiver liberado pelo gesto.
  - Fecha com qualquer tecla, clique ou Esc.
- **Morse:** a luz do rodapé pisca "CABRA" em Morse, sem parar. Parada com movimento reduzido.
- **Bode raro:** em 1 de cada 16 visitas, o bode pixel espia de uma borda e acena. Clicar nele abre a porta do ARG.
- **Porta do ARG:** `#/sinal` mostra estática e "SINAL FRACO. VOLTE DEPOIS.", até o ARG do João existir.
- **No console:** "Psiu. Tenta o código Konami."
- Os textos dos segredos passam pelo João nas capturas antes de publicar.

## README do perfil

Fica em inglês.

- **Banner:**
  - Saem as formas, o icosaedro e o Pikachu.
  - Entra o bode pixel acenando, desenhado pixel a pixel a partir do `6.png`.
  - Ficam o nome e o cargo.
- **Emojis:** saem dos títulos e dos itens da lista "What I do". A saudação "Sup, I'm Cabral! ⚡" e o texto de apresentação, que são dele, ficam.
- **Seções novas:**
  - por que o bode (Cabral → Cabra → GOAT, "the cabra");
  - jogos que marcaram, com os motivos dele;
  - "Right now": jogando e no repeat;
  - a toca do coelho: terror analógico, ARGs, canais e jogos;
  - coleções.
- **Projetos:** a tabela fica, com Magnifyer, PitchIQ e o portfólio primeiro.
- **Ficam:** a gravação do GBA e o stack.

## Processamento das artes (sem redesenhar nada)

`tools/site_art.py` lê `material/` (fora do git) e grava em `assets/site/`:
- **O bode de traço:** a luminância vira transparência e o traço vira uma cor só.
- **A criatura de fogo:** os dois cinzas do quadriculado gravado viram transparente, e a imagem é reduzida pelo tamanho real do pixel.
- **O bode pixel:** copiado.
- **O GIF da Pokébola:** copiado.

## Testes

- **`check.mjs`:**
  - os arquivos de arte existem;
  - a dificuldade de cada habilidade sai do PODER;
  - o código Morse de "CABRA";
  - os textos novos do `DATA.site` em pt e en.
- **e2e:**
  - as seções;
  - nenhum ícone de Pokémon na página;
  - a ordem dos projetos (Magnifyer, PitchIQ, portfólio), com `#/projetos/3` ainda indo ao PitchIQ;
  - o Konami code abre e fecha a interrupção;
  - `#/sinal` abre a porta;
  - nenhuma rolagem horizontal a 390 px;
  - movimento reduzido.
- **Capturas** a 1440 e 390, mostradas ao João antes de publicar.

## Revisão 2 (retorno do João sobre a primeira versão)

- **Página mais curta:**
  - projetos em cards menores, com o texto completo num "ler mais";
  - experiência só com os dois cards da MOIC, e os clientes (CapyFi, Fogo, Kaia, Haust Labs) num "ver mais" dentro do card de Social Media Manager;
  - "Coisas que eu faço" no fim, numa faixa, com as imagens inteiras;
  - menos espaço entre seções.
- **Fontes, três que combinam com pixel art:** Jersey 10 nos títulos, Chakra Petch no texto, Silkscreen nos dados. Saem Dela Gothic One, VT323 e Libre Baskerville.
- **Barra do topo como HUD de RPG:**
  - retrato do bode (a cabeça, em pixel) numa moldura, "CABRAL" e o nível (anos em tecnologia);
  - uma barra de XP que enche com a rolagem;
  - o menu com cursor de jogo e a seção atual marcada;
  - o idioma como chave;
  - o JOGAR como botão START.
- **Habilidades como ficha de RPG**, sem citar o Disco Elysium:
  - três atributos coloridos (Código; Dados e IA; Criação);
  - clicar numa habilidade rola um d20 low poly estilo PS1 e o teste ("[Lendário: Sucesso]", a conta do dado e o texto) aparece numa caixa de diálogo.
- **Mangá, anime e quadrinhos:** retícula de mangá em alguns fundos; linhas de velocidade e uma onomatopeia quando o dado rola ou o código Konami entra.
- **3D low poly estilo PS1:** a fita VHS, o d20 e uma bola de basquete perto dos projetos de esporte.
- **No fone:**
  - mini player com trechos de 30 segundos (busca da Apple na hora de tocar, link para a música completa);
  - a música mais tocada de cada artista: CBJR, The Offspring, Green Day, Matuê, Rage Against the Machine, BK, System of a Down, J. Cole, Twenty One Pilots, LPT Zlatan, Djavan, OutKast, Jorge Vercillo, Michael Jackson;
  - NOG, Tchelo e Jotapê ficam de fora até o João dizer qual música (a busca é ambígua).
- **Jogos:**
  - "Jogos que eu recomendo" (Skyrim, Eldest Souls, Universe for Sale) e "Jogos que me marcaram" (Disco Elysium, Until Then, Far Cry 4, Hotline Miami);
  - uma linha por jogo, com link para a Steam;
  - sai o "Jogando agora".
- **MOIC SITE:** o stack passa a ser Astro, HTML, Cloudflare e CRM.
- **Textos:** todos revistos para soar menos genéricos.

## Revisão 3 (retorno do João sobre a revisão 2, 16/10)

- **Barra do topo:** saem o retrato, o "CABRAL", o nível e o XP. Ficam as seções no meio e, no fim, o idioma e o JOGAR. "Coisas que eu faço" sai do menu (a seção continua na página).
- **Abertura:**
  - o bode em traço maior e sem nada na frente do rosto; a fita e a tela do GBA vão para a direita;
  - a frase "Esse portfólio também é um jogo…" vira um balão que só aparece com o mouse (ou o foco) no botão Jogar.
- **Projetos:** sai o card do portfólio e o site da MOIC sobe para o terceiro lugar. O portfólio ganha a seção "Este site", antes do contato, com o texto de como foi feito, o código no GitHub e um cartucho 3D. O link antigo `#/projetos/7` cai nela.
- **Sobre:**
  - três fotos do João como polaroides (criança, com "NV. 1"; à noite; no elevador);
  - o Hall da Fama do primeiro Nuzlocke vencido dele, no FireRed, embaixo dos jogos;
  - sai o aviso "Trechos de 30 s, via Apple Music".
- **Formação:** sai a Wizard; fica "UFSC · Ciência da Computação · 2022–2025 → UNIASSELVI · Sistemas de Informação · 2026–hoje", sem "Bacharelado", com uma seta entre os dois. A troca de curso fica subentendida. O GBA usa os mesmos dados.
- **Habilidades:**
  - saem os "X anos";
  - o d20 tem faces numeradas (as opostas somam 21) e cai na face do resultado; clicar no dado também rola;
  - segredos do d20: no 1, falha crítica (o dado racha e o texto zoa a habilidade); no 20, confete e o bode comemorando; no 13, a luz da página apaga e só a abóbora brilha; rolando 7 vezes em 15 segundos, o bode come o dado e devolve depois de 5 segundos;
  - uma abóbora PS1 na mesa: acende ao passar o mouse e apaga a luz ao clicar;
  - as tecnologias passam a ser uma lista escolhida (entram Unity, GameMaker, Blender, Blockbench, Aseprite, Photoshop, Figma, C# e Docker; saem Chrome MV3, Telegram, OpenRouter, Tavily, Express, Notion API e CRM).
- **Coisas que eu faço:** sem legendas; entram o Law com o Chopper (nanquim), o Kakashi (pixel art), o retrato em caneta azul e o pôster do Charlie Brown Jr. Cada arte abre grande.
- **Fim:** o bode em 3D low poly estilo PS1, montado em código a partir do bode pixel, acenando no contato. O rodapé perde o texto "HTML, CSS e JS puro" e ganha uma floresta morta na névoa com uma figura parada, um pouco mais perto a cada visita.
- **Filme:** de vez em quando passa uma faixa de tracking de VHS.
- **README:** GameMaker e Blockbench entram na arte das tecnologias.
