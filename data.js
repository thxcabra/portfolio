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
      stack: ['CLOUDFLARE', 'SEO', 'CRM'],
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
    HTML: 'grass', CSS: 'grass',
  },

  // Experiência: cada emprego é uma insígnia (máx. 8), do mais recente ao mais antigo.
  badges: [
    {
      name: 'MOIC DIGITAL', shape: 'boulder',
      role: { pt: 'Intelligence Engineer', en: 'Intelligence Engineer' },
      period: { pt: 'set 2026 – hoje', en: 'Sep 2026 – now' },
      text: {
        pt: 'IA como ferramenta central para criar automações, produtos e soluções que fazem o negócio andar. Uma das principais referências de tecnologia da empresa, de ponta a ponta: da identificação do problema até a produção. Automações que tiram trabalho manual dos times, produtos internos e para clientes, e a ponte entre negócio e tecnologia.',
        en: "AI as a core tool to build automations, products and solutions that drive the business forward. One of the company's main technology reference points, working end to end from problem identification to production: automations that cut manual work, internal and customer-facing products, and the bridge between business and technology.",
      },
    },
    {
      name: 'MOIC DIGITAL', shape: 'cascade',
      role: { pt: 'Social Media Manager', en: 'Social Media Manager' },
      period: { pt: 'out 2024 – hoje', en: 'Oct 2024 – now' },
      text: { pt: 'Gestão de redes sociais na MOIC Digital.', en: 'Social media management at MOIC Digital.' },
    },
    {
      name: 'CAPYFI', shape: 'thunder',
      role: { pt: 'Social Media Manager', en: 'Social Media Manager' },
      period: { pt: 'mai – set 2026', en: 'May – Sep 2026' },
      text: { pt: 'Gestão das redes sociais da CapyFi.', en: "Managed CapyFi's social media." },
    },
    {
      name: 'FOGO', shape: 'rainbow',
      role: { pt: 'Social Media Manager', en: 'Social Media Manager' },
      period: { pt: 'mar – jul 2026', en: 'Mar – Jul 2026' },
      text: { pt: 'Gestão das redes sociais da Fogo.', en: "Managed Fogo's social media." },
    },
    {
      name: 'KAIA DLT FOUNDATION', shape: 'soul',
      role: { pt: 'Social Media Manager', en: 'Social Media Manager' },
      period: { pt: 'abr 2025 – abr 2026', en: 'Apr 2025 – Apr 2026' },
      text: { pt: 'Gestão das redes sociais da Kaia DLT Foundation.', en: "Managed Kaia DLT Foundation's social media." },
    },
    {
      name: 'HAUST LABS', shape: 'marsh',
      role: { pt: 'Social Media Manager', en: 'Social Media Manager' },
      period: { pt: 'nov 2024 – fev 2026', en: 'Nov 2024 – Feb 2026' },
      text: { pt: 'Gestão das redes sociais da Haust Labs.', en: "Managed Haust Labs' social media." },
    },
  ],

  education: [
    { name: 'UFSC', course: { pt: 'Bacharelado em Ciência da Computação', en: "Bachelor's in Computer Science" }, period: { pt: '2022 – 2025', en: '2022 – 2025' } },
    { name: 'UNIASSELVI', course: { pt: 'Bacharelado em Sistemas de Informação', en: "Bachelor's in Information Systems" }, period: { pt: 'fev 2026', en: 'Feb 2026' } },
    { name: 'WIZARD BY PEARSON', course: { pt: 'Inglês avançado', en: 'Advanced English' }, period: { pt: '2015 – 2021', en: '2015 – 2021' } },
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
  // respostas do João. art: as artes dele (tools/site_art.py prepara a partir de material/). Nada de imagem
  // gerada por IA. games: jogos dele ({ name, text: { pt, en }, media, link }), vazio por enquanto.
  site: {
    // Ordem dos projetos na página (índices de `projects`): os de que ele mais se orgulha primeiro. O link
    // #/projetos/N continua sendo a posição em `projects`.
    order: [0, 2, 6, 1, 4, 3, 5],
    about: {
      pt: [
        'Me chamam de Cabral desde o colégio. Daí virou Cabra, e de Cabra virou GOAT. Por isso o bode, e por isso o thxcabra: the cabra, o Cabra.',
        'Sou engenheiro de software e trabalho com IA e automação de dados. Acho que IA é uma baita aliada quando usada do jeito certo, pra tirar do caminho o trabalho maçante.',
        'Fora do código, sou nerd de tudo: RPG, mangá, anime, HQ, vídeo de terror indie e ARG. Sempre acabo voltando pros jogos, porque eles juntam todo o resto. No fone é rap, quase sempre. E coleciono cartas de Pokémon, mangás, quadrinhos e camisas de futebol e basquete.',
      ],
      en: [
        'People have called me Cabral since school. That turned into Cabra, which is Portuguese for goat, and Cabra turned into GOAT. Hence the goat, and hence thxcabra: the cabra.',
        'I am a software engineer working with AI and data automation. I think AI is a great ally when it is used the right way, to get the tedious work out of the way.',
        'Outside of code I am a nerd about everything: RPGs, manga, anime, comics, indie horror videos and ARGs. I always end up back at games, because they bring all the rest together. Rap is almost always playing. And I collect Pokémon cards, manga, comics and football and basketball jerseys.',
      ],
    },
    looking: {
      pt: 'Quero trabalhar na produção de jogos. E curto demais projeto com esporte e dados.',
      en: 'I want to work on making games. And I really love projects with sports and data.',
    },
    now: {
      playing: ['Disco Elysium', 'Skyrim', 'Eldest Souls', 'Universe for Sale'],
      listening: ['NOG', 'Matuê', 'BK', 'J. Cole', 'Tchelo', 'LPT Zlatan', 'Jotapê'],
    },
    favorites: [
      { name: 'Disco Elysium', why: { pt: 'Narrativa, mecânicas diferentes, história e investigação.', en: 'Narrative, unusual mechanics, story and investigation.' } },
      { name: 'Until Then', why: { pt: 'Narrativa, arte linda, história envolvente e decisões.', en: 'Narrative, beautiful art, a gripping story and choices.' } },
      { name: 'Far Cry 4', why: { pt: 'Contexto, escolhas, gameplay, liberdade e um vilão foda.', en: 'Setting, choices, gameplay, freedom and a killer villain.' } },
      { name: 'Hotline Miami', why: { pt: 'Estética, história, gameplay e música.', en: 'Look, story, gameplay and music.' } },
    ],
    art: [
      { src: 'assets/site/goat-ink.png', kind: 'ink', w: 376, h: 551, caption: { pt: 'O bode, em traço.', en: 'The goat, in brush lines.' } },
      { src: 'assets/site/goat-pixel.png', kind: 'pixel', w: 45, h: 75, caption: { pt: 'O bode em pixel art, dando oi.', en: 'The goat in pixel art, saying hi.' } },
      { src: 'assets/site/firecat.png', kind: 'pixel', w: 57, h: 52, caption: { pt: 'Uma criatura de fogo, em pixel art.', en: 'A fire creature, in pixel art.' } },
      { src: 'assets/site/pokeball.gif', kind: 'gif', w: 1000, h: 1000, caption: { pt: 'Uma Pokébola low poly, no estilo do PS1.', en: 'A low poly Poké Ball, PS1 style.' } },
    ],
    media: { photo: null, drawings: [] },
    games: [],
    ui: {
      pt: {
        skip: 'Pular para o conteúdo', nav: 'Seções', menu: 'Menu', lang: 'EN', lang_name: 'Mudar para inglês',
        hello: 'Opa, eu sou o', call: 'Pode me chamar de Cabral.',
        play: 'Jogar', play_long: 'Jogar meu portfólio', play_note: 'Este portfólio também é um jogo: um Centro Pokémon dentro de um GBA.',
        talk: 'Fale comigo', goat: 'O bode, mascote do Cabral, desenhado por ele', tape: 'CABRAL · PORTFÓLIO',
        projects: 'Projetos', art: 'Coisas que eu faço', about: 'Sobre', work: 'Experiência', skills: 'Habilidades', games: 'Jogos', contact: 'Contato',
        projects_lead: 'Os de que eu mais me orgulho vêm primeiro.', art_lead: 'Desenho, pixel art e 3D.',
        code: 'Código', live: 'Ver ao vivo', shots: 'Ver as imagens de {name}', shot_of: '{i} de {n}',
        close: 'Fechar', prev: 'Anterior', next: 'Próxima',
        since: 'Em tecnologia desde {year}', playing: 'Jogando agora', listening: 'No fone', favorites: 'Jogos que me marcaram',
        school: 'Formação', years: '{n} anos', skills_lead: 'Testes de habilidade, do jeito do Disco Elysium.', success: 'Sucesso',
        d75: 'Médio', d80: 'Desafiador', d85: 'Formidável', d90: 'Lendário', stack: 'Stack',
        contact_title: 'Vaga ou projeto? Bora conversar.',
        footer: 'Feito à mão em HTML, CSS e JS, sem framework.', source: 'Código do site',
        lost_title: 'SINAL PERDIDO', lost_text: 'Esta transmissão foi interrompida. Não ajuste o seu aparelho.', lost_back: 'Aperte qualquer tecla para voltar.',
        weak_title: 'SINAL FRACO', weak_text: 'Volte depois.', peek: 'Um bode acenando', hint: 'Psiu. Tenta o código Konami.',
      },
      en: {
        skip: 'Skip to content', nav: 'Sections', menu: 'Menu', lang: 'PT', lang_name: 'Mudar para português',
        hello: "Hey, I'm", call: 'You can call me Cabral.',
        play: 'Play', play_long: 'Play my portfolio', play_note: 'This portfolio is also a game: a Pokémon Center inside a GBA.',
        talk: 'Talk to me', goat: "The goat, Cabral's mascot, drawn by him", tape: 'CABRAL · PORTFOLIO',
        projects: 'Projects', art: 'Things I make', about: 'About', work: 'Experience', skills: 'Skills', games: 'Games', contact: 'Contact',
        projects_lead: "The ones I'm proudest of come first.", art_lead: 'Drawing, pixel art and 3D.',
        code: 'Code', live: 'See it live', shots: 'See the pictures of {name}', shot_of: '{i} of {n}',
        close: 'Close', prev: 'Previous', next: 'Next',
        since: 'In tech since {year}', playing: 'Playing now', listening: 'On repeat', favorites: 'Games that made me',
        school: 'Education', years: '{n} years', skills_lead: 'Skill checks, Disco Elysium style.', success: 'Success',
        d75: 'Medium', d80: 'Challenging', d85: 'Formidable', d90: 'Legendary', stack: 'Stack',
        contact_title: "A role or a project? Let's talk.",
        footer: 'Handmade in HTML, CSS and JS, no framework.', source: 'Site source',
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
      simple_label: 'SIMPLES', simple_back: 'VOLTAR AO GBA', simple_lang: 'ENGLISH', sp_power: 'PODER',
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
      simple_label: 'SIMPLE', simple_back: 'BACK TO THE GBA', simple_lang: 'PORTUGUÊS', sp_power: 'POWER',
      tm_title: 'TM CASE', tm_years: '{n} YEARS OF USE', tm_close: 'The TM CASE will be put away.',
      card_name: 'NAME: ', card_projects: 'PROJECTS', card_badges: 'BADGES', card_time: 'TIME', card_years: '{n} YEARS', card_about: 'A: ABOUT ME',
      act_skip: 'SKIP', act_start: 'START', act_talk: 'TALK', act_run: 'RUN', act_next: 'NEXT', act_choose: 'CHOOSE',
      act_back: 'BACK', act_close: 'CLOSE', act_flip: 'FLIP', act_open: 'OPEN', act_read: 'READ',
    },
  },
};
