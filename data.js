// Conteúdo do portfólio. É o único arquivo que precisa ser editado.
// Depois de editar, rode: node check.mjs
//
// Tipos válidos (Gen 3): normal fire water grass electric ice fighting poison
//   ground flying psychic bug rock ghost dragon dark steel
// Sugestão tech -> tipo: JS/TS = electric · Python = psychic · banco de dados = rock
//   infra/DevOps = steel · design/UI = psychic · automação/IA = dragon · mobile = flying
// Formatos de insígnia (máx. 8): boulder cascade thunder rainbow soul marsh volcano earth
// dex: número do Pokémon (1–386). Sprites e gritos saem do número. Todo texto precisa existir na fonte do jogo (node check.mjs avisa).

export const DATA = {
  trainer: {
    name: 'JOÃO CABRAL',
    id: '04201',
    since: 2022,   // TEMPO conta daqui (início em Ciência da Computação na UFSC)
    partner: 25,
    role: { pt: 'Engenheiro de Software · IA e Automação de Dados · Game Dev', en: 'Software Engineer · AI & Data Automation · Game Dev' },
    location: 'Palhoça, SC',
    languages: { pt: 'Português (nativo) · Inglês (fluente)', en: 'Portuguese (native) · English (fluent)' },
    about: {
      pt: 'Sou engenheiro de software e game dev independente e adoro construir produtos digitais do zero. Vou além do “só funcionar”: quero algo estável, bonito e nas mãos das pessoas, para usar ou jogar. Meu trabalho fica entre código, design, sentimento e significado: engenharia de software, desenvolvimento de jogos, IA e automação de dados e estratégia de produto. Gosto de fazer coisas que funcionam bem e são divertidas de usar, seja um jogo, um pipeline de dados, um site ou um chatbot. Sempre aberto a conversar com times e pessoas fazendo coisas interessantes.',
      en: 'I am a software engineer and independent game dev who loves to build digital products from scratch. Always looking beyond the basics and the “just work” mantra, I aim to build something stable, make it look good and get it in front of people to use or play. My work sits at the intersection of code, design, feelings and meaning: software engineering, game development, AI & data automation and product strategy. I like building things that work well and are fun to use, whether that is a new game, a data pipeline, a website or a chatbot. Always open to talking with teams and people who are making interesting things.',
    },
  },

  // Projetos, na ordem da lista (o nº 001, 002… é o link #/projetos/1). Cada um é um Pokémon:
  // dex + pokemon (nome da espécie) + types (os tipos de verdade dele); form só para o Unown (letra).
  // name: até 10 letras. kind: bem curto (aparece em ITEM). pitch: cabe em 2 linhas do TRAINER MEMO.
  // text: o LER MAIS, em páginas. stack: até 4 (o tipo vem de `moves` ou de `tech`; senão NORMAL).
  // shots: imagens em assets/ (a primeira vira a miniatura).
  projects: [
    {
      name: 'MAGNIFYER', dex: 164, pokemon: 'NOCTOWL', types: ['normal', 'flying'], year: 2026,
      kind: { pt: 'APP WEB', en: 'WEB APP' },
      pitch: { pt: 'Jogos ao vivo, tabela e história da NBA, em português.', en: 'Live NBA scores, standings and history, Portuguese-first.' },
      text: {
        pt: 'Um app de NBA para todo mundo, feito primeiro em português. Tem jogos ao vivo, classificação, chave dos playoffs, times, jogadores, drafts e prêmios. Cada jogador ganha um arquétipo tático.',
        en: 'An NBA app for everyone, built Portuguese-first. Live games, standings, the playoff bracket, teams, players, drafts and awards. Every player is classified into a tactical archetype.',
      },
      stack: ['NEXT.JS', 'PYTHON', 'FASTAPI', 'SUPABASE'],
      links: { repo: 'https://github.com/thxcabra/Magnifyer-Glass' },
      shots: ['assets/projects/magnifyer/home.png', 'assets/projects/magnifyer/drafts.png'],
    },
    {
      name: 'REPLAI', dex: 279, pokemon: 'PELIPPER', types: ['water', 'flying'], year: 2026,
      kind: { pt: 'EXTENSÃO', en: 'EXTENSION' },
      pitch: { pt: 'Acha posts que valem resposta e escreve o rascunho.', en: 'Finds posts worth replying to and drafts the reply.' },
      text: {
        pt: 'O time de social media da MOIC Digital perdia muito tempo rolando feeds. A Replai filtra e ranqueia posts do X e do LinkedIn e sugere respostas na voz da marca. Quem posta é sempre o analista.',
        en: "The MOIC Digital social media team spent most of its time scrolling feeds. Replai filters and ranks X and LinkedIn posts, then drafts replies in the brand's voice. The analyst always does the posting.",
      },
      stack: ['TYPESCRIPT', 'CHROME MV3', 'SUPABASE', 'ANTHROPIC'],
      links: { repo: 'https://github.com/thxcabra/replai' },
      shots: ['assets/projects/replai/side-panel.png', 'assets/projects/replai/settings.png'],
    },
    {
      name: 'PITCHIQ', dex: 65, pokemon: 'ALAKAZAM', types: ['psychic'], year: 2026,
      kind: { pt: 'APP DE IA', en: 'AI APP' },
      pitch: { pt: 'Futebol europeu para buscar, comparar ou perguntar.', en: 'European football stats to search, compare or ask.' },
      text: {
        pt: 'Dados de futebol chegam como tabelas cruas. O PitchIQ busca, perfila e compara jogadores da temporada 2025-26, ou responde perguntas no chat. A IA lê a pergunta; os números vêm dos dados.',
        en: 'Football data arrives as raw tables. PitchIQ searches, profiles and compares 2025-26 players, or answers questions in a chat. The model reads the question; every number comes from the data.',
      },
      stack: ['PYTHON', 'FASTAPI', 'REACT', 'GEMINI'],
      links: { repo: 'https://github.com/thxcabra/PitchIQ' },
      shots: ['search', 'profile', 'chat', 'team', 'competition'].map((n) => `assets/projects/pitchiq/${n}.png`),
    },
    {
      name: 'FURIOSO', dex: 53, pokemon: 'PERSIAN', types: ['normal'], year: 2025,
      kind: { pt: 'CHATBOT', en: 'CHATBOT' },
      pitch: { pt: 'Bot de Telegram que fala como torcedor da FURIA.', en: 'A Telegram bot that talks like a die-hard FURIA fan.' },
      text: {
        pt: 'Feito para um desafio técnico da FURIA Esports. Responde no tom de torcedor sobre CS2, Valorant, LoL e R6. Perguntas sobre fatos passam por uma busca na web antes da resposta.',
        en: "Built for a FURIA Esports technical challenge. It answers in a fan's voice about CS2, Valorant, LoL and R6. Questions about facts go through a web search before it replies.",
      },
      stack: ['PYTHON', 'TELEGRAM', 'OPENROUTER', 'TAVILY'],
      links: { repo: 'https://github.com/thxcabra/Furioso-Bot' },
      shots: ['assets/projects/furioso/commands.png'],
    },
    {
      name: 'CALLSYNC', dex: 201, form: 'c', pokemon: 'UNOWN', types: ['psychic'], year: 2026,
      kind: { pt: 'APP DE IA', en: 'AI APP' },
      pitch: { pt: 'Da gravação da call para notas e tarefas no Notion.', en: 'From call recording to notes and tasks in Notion.' },
      text: {
        pt: 'Depois de cada call, alguém precisa escrever resumo e tarefas. O CallSync transcreve o áudio com o Gemini, analisa com o histórico do projeto e envia tudo ao Notion, com Kanban e calendário.',
        en: "After every client call, someone has to write the summary and tasks. CallSync transcribes the audio with Gemini, analyzes it with the project's history and syncs it all to Notion.",
      },
      stack: ['REACT', 'EXPRESS', 'GEMINI', 'NOTION API'],
      links: { repo: 'https://github.com/thxcabra/CallSync' },
      shots: ['assets/projects/callsync/projects.png', 'assets/projects/callsync/call.png', 'assets/projects/callsync/analysis.png'],
    },
    {
      name: 'MOIC SITE', dex: 233, pokemon: 'PORYGON2', types: ['normal'], year: 2026,
      kind: { pt: 'SITE', en: 'WEBSITE' },
      pitch: { pt: 'Site da agência, com cases, blog e leads no CRM.', en: 'Agency site with cases, blog and leads into the CRM.' },
      text: {
        pt: 'Site da agência MOIC Digital, com páginas de conteúdo, cases e blog, pensado para SEO. Os formulários levam os leads direto ao CRM. Roda no edge da Cloudflare, com staging antes da produção.',
        en: "Website for the MOIC Digital agency, with content pages, cases and a blog, built for SEO. Lead forms go straight into the CRM. It runs on Cloudflare's edge, with staging before production.",
      },
      stack: ['ASTRO', 'HTML', 'CLOUDFLARE', 'CRM'],
      links: { live: 'https://www.moicdigital.com' },
      shots: ['assets/projects/moic/home.jpg', 'assets/projects/moic/home-2.jpg'],
    },
    {
      name: 'PORTFOLIO', dex: 6, pokemon: 'CHARIZARD', types: ['fire', 'flying'], year: 2026,
      kind: { pt: 'PORTFÓLIO', en: 'PORTFOLIO' },
      pitch: { pt: 'Um Centro Pokémon do FireRed jogável no navegador.', en: 'A playable FireRed Pokémon Center in the browser.' },
      text: {
        pt: 'Este site: o Centro Pokémon do FireRed dentro de um GBA no navegador. Ande, converse ou aperte START. Os números vêm da decompilação do jogo, e o site não usa framework.',
        en: 'This site: the FireRed Pokémon Center inside a GBA in the browser. Walk around, talk or press START. The numbers come from the game\'s decompilation, and there is no framework.',
      },
      stack: ['JAVASCRIPT', 'HTML', 'CSS', 'PYTHON'],
      links: { repo: 'https://github.com/thxcabra/portfolio', live: 'https://thxcabra.github.io/portfolio/' },
      shots: ['assets/og.png'],
    },
  ],

  // Tipo das tecnologias do stack que não estão em `moves` (sem tipo = NORMAL).
  tech: {
    'NEXT.JS': 'water', FASTAPI: 'psychic', SUPABASE: 'rock', 'CHROME MV3': 'electric', ANTHROPIC: 'dragon',
    GEMINI: 'dragon', OPENROUTER: 'dragon', TAVILY: 'dragon', TELEGRAM: 'flying', EXPRESS: 'electric',
    'NOTION API': 'normal', CLOUDFLARE: 'steel', SEO: 'grass', CRM: 'normal', JAVASCRIPT: 'electric',
    HTML: 'grass', CSS: 'grass', ASTRO: 'psychic', 'C#': 'psychic', DOCKER: 'water', FIGMA: 'psychic',
    GAMEMAKER: 'fire', BLENDER: 'fire', BLOCKBENCH: 'grass', ASEPRITE: 'grass', PHOTOSHOP: 'water',
  },

  // Experiência: cada emprego é uma insígnia (máx. 8), do mais recente ao mais antigo. via: o cliente veio
  // por essa empresa (a landing page mostra esses dentro do card dela).
  badges: [
    {
      name: 'MOIC DIGITAL', shape: 'boulder',
      role: { pt: 'Intelligence Engineer', en: 'Intelligence Engineer' },
      period: { pt: 'set 2026 – hoje', en: 'Sep 2026 – now' },
      text: {
        pt: 'Crio automações e produtos com IA, internos e para clientes, e levo cada um do problema até a produção. As automações tiram trabalho manual dos times. Sou uma das referências de tecnologia da empresa e faço a ponte entre o negócio e a tecnologia.',
        en: "I build automations and products with AI, internal and for clients, and take each one from the problem to production. The automations take manual work off the teams. I'm one of the company's go-to people for technology and the link between the business and the tech.",
      },
    },
    {
      name: 'MOIC DIGITAL', shape: 'cascade',
      role: { pt: 'Social Media Manager', en: 'Social Media Manager' },
      period: { pt: 'out 2024 – hoje', en: 'Oct 2024 – now' },
      text: { pt: 'Gestão de redes sociais na MOIC Digital.', en: 'Social media management at MOIC Digital.' },
    },
    {
      name: 'CAPYFI', via: 'MOIC DIGITAL', shape: 'thunder',
      role: { pt: 'Social Media Manager', en: 'Social Media Manager' },
      period: { pt: 'mai – set 2026', en: 'May – Sep 2026' },
      text: { pt: 'Gestão das redes sociais da CapyFi.', en: "Managed CapyFi's social media." },
    },
    {
      name: 'FOGO', via: 'MOIC DIGITAL', shape: 'rainbow',
      role: { pt: 'Social Media Manager', en: 'Social Media Manager' },
      period: { pt: 'mar – jul 2026', en: 'Mar – Jul 2026' },
      text: { pt: 'Gestão das redes sociais da Fogo.', en: "Managed Fogo's social media." },
    },
    {
      name: 'KAIA DLT FOUNDATION', via: 'MOIC DIGITAL', shape: 'soul',
      role: { pt: 'Social Media Manager', en: 'Social Media Manager' },
      period: { pt: 'abr 2025 – abr 2026', en: 'Apr 2025 – Apr 2026' },
      text: { pt: 'Gestão das redes sociais da Kaia DLT Foundation.', en: "Managed Kaia DLT Foundation's social media." },
    },
    {
      name: 'HAUST LABS', via: 'MOIC DIGITAL', shape: 'marsh',
      role: { pt: 'Social Media Manager', en: 'Social Media Manager' },
      period: { pt: 'nov 2024 – fev 2026', en: 'Nov 2024 – Feb 2026' },
      text: { pt: 'Gestão das redes sociais da Haust Labs.', en: "Managed Haust Labs' social media." },
    },
  ],

  education: [
    { name: 'UFSC', course: { pt: 'Ciência da Computação', en: 'Computer Science' }, period: { pt: '2022 – 2025', en: '2022 – 2025' } },
    { name: 'UNIASSELVI', course: { pt: 'Sistemas de Informação', en: 'Information Systems' }, period: { pt: '2026 – hoje', en: '2026 – now' } },
  ],

  // PODER (0–100) e ANOS começam como estimativa: ajuste aqui.
  moves: [
    { name: 'PYTHON', type: 'psychic', power: 90, years: 4, text: { pt: 'Automações, APIs (FastAPI), bots e pipelines de dados.', en: 'Automations, APIs (FastAPI), bots and data pipelines.' } },
    { name: 'TYPESCRIPT', type: 'electric', power: 85, years: 3, text: { pt: 'Front-end e ferramentas web com JavaScript e TypeScript.', en: 'Front-end and web tools with JavaScript and TypeScript.' } },
    { name: 'REACT', type: 'water', power: 80, years: 3, text: { pt: 'Interfaces web com React, Vite e Tailwind.', en: 'Web interfaces with React, Vite and Tailwind.' } },
    { name: 'LLMS', type: 'dragon', power: 90, years: 2, text: { pt: 'IA aplicada: agentes, chatbots e automações com modelos de linguagem.', en: 'Applied AI: agents, chatbots and automations with language models.' } },
    { name: 'GCP', type: 'steel', power: 75, years: 2, text: { pt: 'Dados e infraestrutura no Google Cloud, com BigQuery.', en: 'Data and infrastructure on Google Cloud, with BigQuery.' } },
    { name: 'DADOS', type: 'rock', power: 80, years: 2, text: { pt: 'Pipelines de dados: coleta, limpeza e análise.', en: 'Data pipelines: collecting, cleaning and analysis.' } },
    { name: 'UNITY', type: 'fire', power: 75, years: 3, text: { pt: 'Jogos independentes na Unity, com C#.', en: 'Independent games in Unity, with C#.' } },
    { name: 'DESIGN', type: 'grass', power: 75, years: 4, text: { pt: 'Figma, Aseprite e Blender: interfaces, pixel art e 3D.', en: 'Figma, Aseprite and Blender: interfaces, pixel art and 3D.' } },
  ],

  // Cada contato: { label, url }. url = https://..., mailto:... ou um arquivo em assets/ (ex.: 'assets/curriculo.pdf'). Sem telefone.
  contact: [
    { label: 'E-MAIL', url: 'mailto:joaovcabralm@hotmail.com' },
    { label: 'LINKEDIN', url: 'https://www.linkedin.com/in/joao-cabral-machado/' },
    { label: 'GITHUB', url: 'https://github.com/thxcabra' },
  ],

  // A landing page (lp.html), a página principal. Estes textos não passam pela fonte do jogo e saem das
  // respostas do João. art e photos: as artes e as fotos dele (tools/site_art.py prepara a partir de
  // material/). tracks: a música mais tocada de cada artista que ele ouve (o id é da Apple; a página busca o
  // trecho de 30 s na hora). Nada de imagem gerada por IA.
  site: {
    // Ordem dos projetos na página (índices de `projects`): os de que ele mais se orgulha primeiro. O
    // portfólio (home) fica de fora: ele tem a seção "Este site" no fim. O link #/projetos/N continua sendo
    // a posição em `projects`.
    order: [0, 2, 5, 1, 4, 3],
    home: 6,
    home_text: {
      pt: 'O jogo e esta página saem do mesmo código. No GBA, o Centro Pokémon do FireRed foi refeito com os números da decompilação do jogo, e a música é sintetizada dos dados dele. O resto do processo está no GitHub.',
      en: "The game and this page come from the same code. In the GBA, FireRed's Pokémon Center is rebuilt with numbers from the game's decompilation, and the music is synthesized from its data. The rest of the process is on GitHub.",
    },
    about: {
      pt: [
        'Me chamam de Cabral desde o colégio. Virou Cabra, depois GOAT. Daí vem o bode e o thxcabra: the cabra.',
        'Trabalho com software, IA e automação de dados. Fora do código sou nerd de tudo: RPG, mangá, anime, HQ, terror indie, ARG. Mas sempre volto pros jogos. Também coleciono carta de Pokémon, mangá, quadrinho e camisa de time de futebol e de basquete.',
      ],
      en: [
        "People have called me Cabral since school. It became Cabra (goat, in Portuguese), then GOAT. That's where the goat comes from, and thxcabra: the cabra.",
        "I work with software, AI and data automation. Outside of code I'm a nerd about everything: RPGs, manga, anime, comics, indie horror, ARGs. But I always come back to games. I also collect Pokémon cards, manga, comics and football and basketball jerseys.",
      ],
    },
    looking: {
      pt: 'Quero trabalhar na produção de jogos. E curto demais projeto com esporte e dados.',
      en: 'I want to work in game production. I also really like projects that mix sports and data.',
    },
    recommend: [
      { name: 'Skyrim', steam: 489830 },
      { name: 'Eldest Souls', steam: 1108590 },
      { name: 'Universe for Sale', steam: 1627840 },
    ],
    favorites: [
      { name: 'Disco Elysium', steam: 632470, why: { pt: 'Narrativa, investigação e mecânicas diferentes.', en: 'Narrative, investigation and unusual mechanics.' } },
      { name: 'Until Then', steam: 1574820, why: { pt: 'Arte linda e uma história que prende.', en: 'Beautiful art and a story that hooks you.' } },
      { name: 'Far Cry 4', steam: 298110, why: { pt: 'Escolhas, liberdade e um vilão foda.', en: 'Choices, freedom and a killer villain.' } },
      { name: 'Hotline Miami', steam: 219150, why: { pt: 'Estética e trilha sonora absurdas.', en: 'An insane look and soundtrack.' } },
    ],
    tracks: [
      { artist: 'Charlie Brown Jr.', song: 'Só Os Loucos Sabem', id: 407979472 },
      { artist: 'The Offspring', song: "The Kids Aren't Alright", id: 1440881625 },
      { artist: 'Green Day', song: 'Basket Case', id: 1160082180 },
      { artist: 'Matuê', song: 'Anos Luz', id: 1842386228 },
      { artist: 'Rage Against the Machine', song: 'Wake Up', id: 578028959 },
      { artist: 'BK', song: 'Cacos De Vidro', id: 1792342504 },
      { artist: 'System of a Down', song: 'Chop Suey!', id: 273714640 },
      { artist: 'J. Cole', song: 'No Role Modelz', id: 1600773036 },
      { artist: 'Twenty One Pilots', song: 'Stressed Out', id: 974485474 },
      { artist: 'LPT Zlatan', song: 'Vou Descer Minha Favela de Nave', id: 1792982233 },
      { artist: 'Djavan', song: 'Se...', id: 808278968 },
      { artist: 'OutKast', song: 'Ms. Jackson', id: 1536684150 },
      { artist: 'Jorge Vercillo', song: 'Monalisa', id: 713931546 },
      { artist: 'Michael Jackson', song: 'Beat It', id: 269573341 },
    ],
    photos: [
      { src: 'assets/site/me-kid.jpg', w: 480, h: 360, label: 'NV. 1', alt: { pt: 'O João criança, de mão na cintura', en: 'João as a kid, hands on his hips' } },
      { src: 'assets/site/me-night.jpg', w: 480, h: 654, alt: { pt: 'O João de óculos, numa luz vermelha à noite', en: 'João in glasses, in red light at night' } },
      { src: 'assets/site/me-lift.jpg', w: 150, h: 150, alt: { pt: 'O João tirando uma selfie no elevador', en: 'João taking a selfie in an elevator' } },
    ],
    nuzlocke: { src: 'assets/site/nuzlocke.png', w: 993, h: 613, alt: { pt: 'Hall da Fama do FireRed: Cradily, Raichu, Crobat, Walrein, Altaria e Dustox', en: 'FireRed Hall of Fame: Cradily, Raichu, Crobat, Walrein, Altaria and Dustox' } },
    // As tecnologias da ficha (as cores vêm de `moves` ou de `tech`).
    stack: ['PYTHON', 'TYPESCRIPT', 'JAVASCRIPT', 'C#', 'HTML', 'CSS', 'REACT', 'NEXT.JS', 'ASTRO', 'FASTAPI', 'SUPABASE', 'DOCKER', 'GCP', 'GEMINI', 'ANTHROPIC', 'CLOUDFLARE', 'UNITY', 'GAMEMAKER', 'BLENDER', 'BLOCKBENCH', 'ASEPRITE', 'PHOTOSHOP', 'FIGMA'],
    // Um 1 natural no d20: a falha crítica de cada habilidade.
    fumbles: {
      PYTHON: { pt: 'Esqueceu os dois-pontos depois do if. SyntaxError.', en: 'Forgot the colon after the if. SyntaxError.' },
      TYPESCRIPT: { pt: 'Tudo virou any. O compilador desistiu de você.', en: 'Everything became any. The compiler gave up on you.' },
      REACT: { pt: 'useEffect sem a lista de dependências. A página renderizou 4.000 vezes.', en: 'A useEffect with no dependency list. The page rendered 4,000 times.' },
      LLMS: { pt: 'O modelo jurou que 2 + 2 = 5, com fonte e tudo.', en: 'The model swore 2 + 2 = 5, with sources.' },
      DADOS: { pt: 'O CSV veio separado por ponto e vírgula. E com vírgula decimal.', en: 'The CSV came separated by semicolons. With decimal commas.' },
      GCP: { pt: 'Deixou a máquina ligada no fim de semana. Chegou a fatura.', en: 'Left the VM running all weekend. The bill arrived.' },
      UNITY: { pt: 'O personagem atravessou o chão e está caindo até agora.', en: 'The character fell through the floor and is still falling.' },
      DESIGN: { pt: 'Comic Sans no título. Ninguém viu nada.', en: 'Comic Sans in the title. Nobody saw anything.' },
    },
    // A ficha de RPG das habilidades: cada atributo junta alguns `moves`.
    attrs: [
      { name: { pt: 'Código', en: 'Code' }, color: 'orange', moves: ['PYTHON', 'TYPESCRIPT', 'REACT'] },
      { name: { pt: 'Dados e IA', en: 'Data and AI' }, color: 'purple', moves: ['LLMS', 'DADOS', 'GCP'] },
      { name: { pt: 'Criação', en: 'Making' }, color: 'green', moves: ['UNITY', 'DESIGN'] },
    ],
    // kind: o fundo da moldura (ink: papel; pixel: uma cor; dark: preto; photo: sem moldura).
    art: [
      { src: 'assets/site/goat-ink.png', kind: 'ink', w: 376, h: 551, alt: { pt: 'O bode, em traço', en: 'The goat, in brush lines' } },
      { src: 'assets/site/goat-pixel.png', kind: 'pixel', bg: 'purple', w: 45, h: 75, alt: { pt: 'O bode em pixel art', en: 'The goat in pixel art' } },
      { src: 'assets/site/law-chopper.png', kind: 'ink', w: 577, h: 720, alt: { pt: 'O Law e o Chopper, de One Piece, em nanquim', en: 'Law and Chopper from One Piece, in ink' } },
      { src: 'assets/site/kakashi.png', kind: 'dark', w: 693, h: 875, alt: { pt: 'O Kakashi em pixel art, com o sharingan atrás', en: 'Kakashi in pixel art, with the sharingan behind him' } },
      { src: 'assets/site/poster-cbjr.jpg', kind: 'photo', w: 720, h: 701, alt: { pt: 'Pôster de Só os Loucos Sabem, do Charlie Brown Jr.', en: "A poster for Charlie Brown Jr.'s Só os Loucos Sabem" } },
      { src: 'assets/site/firecat.png', kind: 'pixel', bg: 'orange', w: 57, h: 52, alt: { pt: 'Um gato de fogo em pixel art', en: 'A fire cat in pixel art' } },
      { src: 'assets/site/pen-portrait.png', kind: 'ink', w: 614, h: 720, alt: { pt: 'Retrato de um senhor de óculos, em caneta azul', en: 'Portrait of an old man in glasses, in blue ballpoint' } },
      { src: 'assets/site/pokeball.gif', kind: 'dark', w: 1000, h: 1000, alt: { pt: 'Pokébola low poly, estilo PS1', en: 'Low poly Poké Ball, PS1 style' } },
    ],
    ui: {
      pt: {
        skip: 'Pular para o conteúdo', nav: 'Seções', lang_name: 'English',
        hello: 'Opa, eu sou o', call: 'Pode me chamar de Cabral.',
        play: 'Jogar', play_long: 'Jogar meu portfólio', play_note: 'Esse portfólio também é um jogo: um Centro Pokémon dentro de um GBA.',
        talk: 'Fale comigo', goat: 'O bode, mascote do Cabral, desenhado por ele', tape: 'CABRAL · PORTFÓLIO',
        projects: 'Projetos', about: 'Sobre', work: 'Experiência', skills: 'Habilidades', art: 'Coisas que eu faço', games: 'Jogos', contact: 'Contato',
        projects_lead: 'Primeiro, os que eu mais me orgulho.', more: 'Ler mais',
        code: 'Código', live: 'Ver ao vivo', shots: 'Ver as imagens de {name}', shot_of: '{i} de {n}',
        close: 'Fechar', prev: 'Anterior', next: 'Próxima',
        since: 'Em tecnologia desde {year}', recommend: 'Jogos que eu recomendo', favorites: 'Jogos que me marcaram', steam: '{name} na Steam',
        listening: 'No fone', play_song: 'Tocar', pause: 'Pausar', prev_song: 'Música anterior', next_song: 'Próxima música',
        full_song: 'Ouvir inteira', song_error: 'Essa não tocou. Pula pra próxima.',
        clients: 'Clientes que eu atendi pela MOIC', school: 'Formação', photos: 'Fotos minhas', nuzlocke: 'Meu primeiro Nuzlocke vencido, no FireRed.',
        skills_lead: 'Minha ficha de personagem. Clica numa habilidade pra fazer o teste.', roll_hint: 'O d20 tá esperando.',
        success: 'Sucesso', crit: 'Sucesso crítico', roll_math: 'd20 {roll} + {bonus} = {total} (precisava de {dc})', roll_fumble: 'd20 {roll}: um 1 natural sempre falha',
        d75: 'Médio', d80: 'Desafiador', d85: 'Formidável', d90: 'Lendário', stack: 'Stack', sfx_roll: 'CLACK!',
        roll_die: 'Rolar o d20', fumble: 'Falha crítica', sfx_crit: 'CRÍTICO!', sfx_crack: 'CRACK!', sfx_eat: 'NHAC!',
        eaten: 'O bode comeu o dado. Já já ele devolve.', lights: 'Você ouviu isso?', pumpkin: 'Uma abóbora',
        contact_title: 'Vaga ou projeto? Bora conversar.',
        home: 'Este site', home_code: 'Ver o código no GitHub', source: 'Código do site', cart: 'PORTFÓLIO',
        lost_title: 'SINAL PERDIDO', lost_text: 'Esta transmissão foi interrompida. Não ajuste o seu aparelho.', lost_back: 'Aperte qualquer tecla para voltar.',
        weak_title: 'SINAL FRACO', weak_text: 'Volte depois.', peek: 'Um bode acenando', hint: 'Psiu. Tenta o código Konami.',
      },
      en: {
        skip: 'Skip to content', nav: 'Sections', lang_name: 'Português',
        hello: "Hey, I'm", call: 'You can call me Cabral.',
        play: 'Play', play_long: 'Play my portfolio', play_note: 'This portfolio is also a game: a Pokémon Center inside a GBA.',
        talk: 'Talk to me', goat: "The goat, Cabral's mascot, drawn by him", tape: 'CABRAL · PORTFOLIO',
        projects: 'Projects', about: 'About', work: 'Experience', skills: 'Skills', art: 'Things I make', games: 'Games', contact: 'Contact',
        projects_lead: "The ones I'm proudest of come first.", more: 'Read more',
        code: 'Code', live: 'See it live', shots: 'See the pictures of {name}', shot_of: '{i} of {n}',
        close: 'Close', prev: 'Previous', next: 'Next',
        since: 'In tech since {year}', recommend: 'Games I recommend', favorites: 'Games that made me', steam: '{name} on Steam',
        listening: 'On repeat', play_song: 'Play', pause: 'Pause', prev_song: 'Previous song', next_song: 'Next song',
        full_song: 'Full song', song_error: "That one didn't play. Skip to the next.",
        clients: 'Clients I handled through MOIC', school: 'Education', photos: 'Photos of me', nuzlocke: 'My first Nuzlocke win, in FireRed.',
        skills_lead: 'My character sheet. Click a skill to roll for it.', roll_hint: 'The d20 is waiting.',
        success: 'Success', crit: 'Critical success', roll_math: 'd20 {roll} + {bonus} = {total} (needed {dc})', roll_fumble: 'd20 {roll}: a natural 1 always fails',
        d75: 'Medium', d80: 'Challenging', d85: 'Formidable', d90: 'Legendary', stack: 'Stack', sfx_roll: 'CLACK!',
        roll_die: 'Roll the d20', fumble: 'Critical failure', sfx_crit: 'CRITICAL!', sfx_crack: 'CRACK!', sfx_eat: 'CHOMP!',
        eaten: 'The goat ate the die. It will give it back in a moment.', lights: 'Did you hear that?', pumpkin: 'A pumpkin',
        contact_title: "A role or a project? Let's talk.",
        home: 'This site', home_code: 'See the code on GitHub', source: 'Site source', cart: 'PORTFOLIO',
        lost_title: 'SIGNAL LOST', lost_text: 'This broadcast has been interrupted. Do not adjust your set.', lost_back: 'Press any key to go back.',
        weak_title: 'WEAK SIGNAL', weak_text: 'Come back later.', peek: 'A goat waving', hint: 'Psst. Try the Konami code.',
      },
    },
  },

  // Message box pages: up to 2 lines each (\n), short enough to fit (node check.mjs checks).
  talk: {
    pt: {
      nurse_welcome: [
        'Olá! Bem-vindo ao Centro\nPokémon do JOÃO CABRAL!',
        'Aqui os Pokémon são os projetos\ndele. Explore à vontade!',
        'Ande com as setas (ou WASD)\nou clicando no chão.',
        'Para falar com alguém ou usar\nalgo, aperte A ou clique nele.',
        'Aperte START (Esc) ou clique\nnele para ver tudo rapidinho!',
      ],
      nurse: ['Olá! Bem-vindo ao Centro\nPokémon do JOÃO CABRAL!'],
      nurse_ask: ['Em que posso ajudar?'],
      nurse_bye: ['Esperamos ver você de novo!'],
      heal_take: ['Certo, vou cuidar dos seus\nPokémon por alguns segundos.'],
      heal_done: ['Obrigada por esperar.', 'Seus Pokémon estão de volta\nà saúde total!'],
      heal_empty: ['Você ainda não tem Pokémon.\nLeve projetos no PC!'],
      pc: ['Você ligou o PC.', 'Os projetos do JOÃO CABRAL\nestão guardados aqui.'],
      board: ['Um mapa de Kanto com os lugares\npor onde o JOÃO CABRAL passou.'],
      shelf: ['Livros sobre programação\ne games. Alguns bem gastos!'],
      gentleman: ['Eu sou o Tutor de Golpes.', 'Veja os golpes que o JOÃO\nCABRAL domina!'],
      boy: ['Dica: segure B enquanto\nanda para correr!'],
      youngster: ['Sabia que dá pra clicar em\nqualquer lugar para andar?'],
      stairs: ['A sala de minijogos lá em\ncima está em obras!'],
      door: ['Lá fora ainda está em\nconstrução. Volte depois!'],
      soon: ['Essa parte do Centro chega\nem breve!'],
      contact_ask: ['Por onde você quer falar\ncom o JOÃO CABRAL?'],
      copied: ['Endereço copiado!'],
      shots: ['Imagens deste projeto: {n}.\nA: ver em tamanho real.'],
      no_shots: ['Ainda não há imagens\ndeste projeto.'],
    },
    en: {
      nurse_welcome: [
        "Hello! Welcome to JOÃO CABRAL's\nPokémon Center!",
        'Here the Pokémon are his\nprojects. Feel free to explore!',
        'Walk with the arrow keys\n(or WASD) or click the floor.',
        'To talk to someone or use\nsomething, press A or click it.',
        'Press START (Esc) or click it\nto see everything quickly!',
      ],
      nurse: ["Hello! Welcome to JOÃO CABRAL's\nPokémon Center!"],
      nurse_ask: ['How can I help you?'],
      nurse_bye: ['We hope to see you again!'],
      heal_take: ["Okay, I'll take your Pokémon\nfor a few seconds."],
      heal_done: ['Thank you for waiting.', "We've restored your Pokémon\nto full health."],
      heal_empty: ["You don't have any Pokémon.\nWithdraw projects at the PC!"],
      pc: ['You booted up the PC.', "JOÃO CABRAL's projects are\nstored here."],
      board: ['A map of Kanto marking the\nplaces JOÃO CABRAL has been.'],
      shelf: ['Books about programming\nand games. Some well worn!'],
      gentleman: ["I'm the Move Tutor.", 'Look at the moves JOÃO\nCABRAL has mastered!'],
      boy: ['Tip: hold B while walking\nto run!'],
      youngster: ['Did you know you can click\nanywhere to walk there?'],
      stairs: ['The minigames room upstairs\nis under construction!'],
      door: ['The town outside is still\nbeing built. Come back later!'],
      soon: ['This part of the Center is\ncoming soon!'],
      contact_ask: ['How would you like to\nreach JOÃO CABRAL?'],
      copied: ['Address copied!'],
      shots: ['Pictures of this project: {n}.\nA: see them full size.'],
      no_shots: ['No pictures of this\nproject yet.'],
    },
  },

  ui: {
    pt: {
      menu_projetos: 'PROJETOS', menu_sobre: 'SOBRE', menu_experiencia: 'EXPERIÊNCIA', menu_habilidades: 'HABILIDADES',
      menu_contato: 'CONTATO', menu_opcoes: 'OPÇÕES', menu_sair: 'SAIR',
      help_projetos: 'Todos os projetos do JOÃO CABRAL,\ncada um com o seu Pokémon.',
      help_sobre: 'Quem é o JOÃO CABRAL: o cartão\nde treinador dele.',
      help_experiencia: 'Onde o JOÃO CABRAL trabalhou\ne estudou.',
      help_habilidades: 'As tecnologias que o JOÃO\nCABRAL domina, como golpes.',
      help_contato: 'E-mail, LinkedIn e GitHub para\nfalar com o JOÃO CABRAL.',
      help_opcoes: 'Velocidade do texto, som,\nmoldura e idioma.',
      help_sair: 'Fecha este menu.',
      hint: 'START: MENU',
      opt_title: 'OPÇÕES', opt_text: 'TEXTO', opt_sound: 'SOM', opt_frame: 'MOLDURA', opt_lang: 'IDIOMA', opt_exit: 'SAIR',
      slow: 'LENTO', mid: 'MÉDIO', fast: 'RÁPIDO', vol_0: 'DESLIGADO', vol_1: 'BAIXO', vol_2: 'MÉDIO', vol_3: 'ALTO', frame_type: 'TIPO',
      lang_pt: 'PORTUGUÊS', lang_en: 'ENGLISH',
      keys_pick: 'ESCOLHER', keys_switch: 'MUDAR', keys_exit: 'SAIR',
      contact_write: 'ESCREVER', contact_copy: 'COPIAR',
      keys_ok: 'OK', keys_page: 'PÁGINA', keys_back: 'VOLTAR',
      sum_info: 'INFO DO PROJETO', sum_shots: 'IMAGENS', sum_stack: 'TECNOLOGIAS', sum_more: 'A: LER MAIS E LINKS',
      sum_read: 'LER MAIS', sum_site: 'VER SITE', sum_code: 'CÓDIGO', sum_back: 'VOLTAR', show_close: 'B: FECHAR',
      nurse_heal: 'CURAR', nurse_about: 'SOBRE O JOÃO', nurse_bye: 'ATÉ LOGO',
      bag_work: 'TRABALHO', bag_school: 'FORMAÇÃO', bag_close: 'FECHAR BOLSA', bag_more: 'A: LER MAIS',
      box_title: 'PROJETOS', box_selected: 'Escolheu {name}.', box_withdraw: 'LEVAR', box_deposit: 'DEVOLVER',
      box_summary: 'RESUMO', box_cancel: 'CANCELAR', box_full: 'Sua equipe está cheia!',
      site_label: 'SITE',
      tm_title: 'ESTOJO TM', tm_years: '{n} ANOS DE USO', tm_close: 'O ESTOJO TM será guardado.',
      card_name: 'NOME: ', card_projects: 'PROJETOS', card_badges: 'INSÍGNIAS', card_time: 'TEMPO', card_years: '{n} ANOS', card_about: 'A: SOBRE MIM',
      // what A and B do right now, next to the buttons on the console
      act_skip: 'PULAR', act_start: 'COMEÇAR', act_talk: 'FALAR', act_run: 'CORRER', act_next: 'CONTINUAR', act_choose: 'ESCOLHER',
      act_back: 'VOLTAR', act_close: 'FECHAR', act_flip: 'VIRAR', act_open: 'ABRIR', act_read: 'LER',
    },
    en: {
      menu_projetos: 'PROJECTS', menu_sobre: 'ABOUT', menu_experiencia: 'EXPERIENCE', menu_habilidades: 'SKILLS',
      menu_contato: 'CONTACT', menu_opcoes: 'OPTION', menu_sair: 'EXIT',
      help_projetos: "All of JOÃO CABRAL's projects,\neach one with its own Pokémon.",
      help_sobre: 'Who JOÃO CABRAL is: his\nTrainer Card.',
      help_experiencia: 'Where JOÃO CABRAL has worked\nand studied.',
      help_habilidades: 'The technologies JOÃO CABRAL\nknows, as moves.',
      help_contato: 'E-mail, LinkedIn and GitHub to\nreach JOÃO CABRAL.',
      help_opcoes: 'Text speed, sound, frame\nand language.',
      help_sair: 'Close this MENU window.',
      hint: 'START: MENU',
      opt_title: 'OPTION', opt_text: 'TEXT SPEED', opt_sound: 'SOUND', opt_frame: 'FRAME', opt_lang: 'LANGUAGE', opt_exit: 'CANCEL',
      slow: 'SLOW', mid: 'MID', fast: 'FAST', vol_0: 'OFF', vol_1: 'LOW', vol_2: 'MID', vol_3: 'HIGH', frame_type: 'TYPE',
      lang_pt: 'PORTUGUÊS', lang_en: 'ENGLISH',
      keys_pick: 'PICK', keys_switch: 'SWITCH', keys_exit: 'CANCEL',
      contact_write: 'WRITE', contact_copy: 'COPY',
      keys_ok: 'OK', keys_page: 'PAGE', keys_back: 'BACK',
      sum_info: 'PROJECT INFO', sum_shots: 'PICTURES', sum_stack: 'TECH STACK', sum_more: 'A: READ MORE AND LINKS',
      sum_read: 'READ MORE', sum_site: 'VISIT SITE', sum_code: 'CODE', sum_back: 'BACK', show_close: 'B: CLOSE',
      nurse_heal: 'HEAL', nurse_about: 'ABOUT JOÃO', nurse_bye: 'GOODBYE',
      bag_work: 'WORK', bag_school: 'EDUCATION', bag_close: 'CLOSE BAG', bag_more: 'A: READ MORE',
      box_title: 'PROJECTS', box_selected: '{name} is selected.', box_withdraw: 'WITHDRAW', box_deposit: 'DEPOSIT',
      box_summary: 'SUMMARY', box_cancel: 'CANCEL', box_full: "Your party's full!",
      site_label: 'SITE',
      tm_title: 'TM CASE', tm_years: '{n} YEARS OF USE', tm_close: 'The TM CASE will be put away.',
      card_name: 'NAME: ', card_projects: 'PROJECTS', card_badges: 'BADGES', card_time: 'TIME', card_years: '{n} YEARS', card_about: 'A: ABOUT ME',
      act_skip: 'SKIP', act_start: 'START', act_talk: 'TALK', act_run: 'RUN', act_next: 'NEXT', act_choose: 'CHOOSE',
      act_back: 'BACK', act_close: 'CLOSE', act_flip: 'FLIP', act_open: 'OPEN', act_read: 'READ',
    },
  },
};
