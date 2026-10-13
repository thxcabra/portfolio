// Conteúdo do portfólio. É o único arquivo que precisa ser editado.
// Depois de editar, rode: node check.mjs
//
// Tipos válidos (Gen 3): normal fire water grass electric ice fighting poison
//   ground flying psychic bug rock ghost dragon dark steel
// Sugestão tech -> tipo: JS/TS = electric · Python = psychic · banco de dados = rock
//   infra/DevOps = steel · design/UI = psychic · automação/IA = dragon · mobile = flying
// Formatos de insígnia (máx. 8): boulder cascade thunder rainbow soul marsh volcano earth
// dex: número do Pokémon (1–386). Sprites e gritos saem do número. Todo texto precisa existir na fonte do jogo (node check.mjs avisa).

const lorem = {
  pt: 'Texto de exemplo. Aqui entra a descrição do projeto: qual problema ele resolve, o que você construiu, as decisões técnicas mais interessantes e o resultado que ele trouxe. Duas ou três frases curtas costumam bastar.',
  en: 'Placeholder text. This is where the project description goes: the problem it solves, what you built, the most interesting technical decisions and the outcome. Two or three short sentences are usually enough.',
};

export const DATA = {
  trainer: {
    name: 'JOÃO CABRAL',
    id: '04201',
    since: 2022,   // TEMPO conta daqui (início em Ciência da Computação na UFSC)
    partner: 25,
    role: { pt: 'Engenheiro de Software · IA e Automação de Dados · Game Dev', en: 'Software Engineer · AI & Data Automation · Game Dev' },
    location: 'Palhoça, SC',
    languages: { pt: 'Português (nativo) · Inglês (fluente)', en: 'Portuguese (native) · English (full professional)' },
    about: {
      pt: 'Sou engenheiro de software e game dev independente e adoro construir produtos digitais do zero. Vou além do “só funcionar”: quero algo estável, bonito e nas mãos das pessoas, para usar ou jogar. Meu trabalho fica entre código, design, sentimento e significado: engenharia de software, desenvolvimento de jogos, IA e automação de dados e estratégia de produto. Gosto de fazer coisas que funcionam bem e são divertidas de usar, seja um jogo, um pipeline de dados, um site ou um chatbot. Sempre aberto a conversar com times e pessoas fazendo coisas interessantes.',
      en: 'I am a software engineer and independent game dev who loves to build digital products from scratch. Always looking beyond the basics and the “just work” mantra, I aim to build something stable, make it look good and get it in front of people to use or play. My work sits at the intersection of code, design, feelings and meaning: software engineering, game development, AI & data automation and product strategy. I like building things that work well and are fun to use, whether that is a new game, a data pipeline, a website or a chatbot. Always open to talking with teams and people who are making interesting things.',
    },
  },

  projects: [
    { dex: 6, pokemon: 'CHARIZARD', name: 'Projeto Exemplo 01', types: ['fire', 'flying'], year: 2025, stack: ['TypeScript', 'React', 'Node'], text: lorem, links: { repo: 'https://github.com/', live: 'https://example.com/' } },
    { dex: 25, pokemon: 'PIKACHU', name: 'Projeto Exemplo 02', types: ['electric'], year: 2025, stack: ['JavaScript', 'Chrome Extension'], text: lorem, links: { repo: 'https://github.com/' } },
    { dex: 94, pokemon: 'GENGAR', name: 'Projeto Exemplo 03', types: ['ghost', 'poison'], year: 2024, stack: ['Python', 'Playwright'], text: lorem, links: { repo: 'https://github.com/' } },
    { dex: 131, pokemon: 'LAPRAS', name: 'Projeto Exemplo 04', types: ['water', 'ice'], year: 2024, stack: ['PostgreSQL', 'Supabase'], text: lorem, links: {} },
    { dex: 149, pokemon: 'DRAGONITE', name: 'Projeto Exemplo 05', types: ['dragon', 'flying'], year: 2024, stack: ['Python', 'LLM APIs'], text: lorem, links: { live: 'https://example.com/' } },
    { dex: 254, pokemon: 'SCEPTILE', name: 'Projeto Exemplo 06', types: ['grass'], year: 2023, stack: ['Next.js', 'Tailwind'], text: lorem, links: { repo: 'https://github.com/', live: 'https://example.com/' } },
    { dex: 282, pokemon: 'GARDEVOIR', name: 'Projeto Exemplo 07', types: ['psychic'], year: 2023, stack: ['Figma', 'CSS'], text: lorem, links: {} },
    { dex: 384, pokemon: 'RAYQUAZA', name: 'Projeto Exemplo 08', types: ['dragon', 'flying'], year: 2022, stack: ['Docker', 'Cloudflare'], text: lorem, links: { repo: 'https://github.com/' } },
  ],

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
      nurse: ['JOÃO CABRAL criou este Centro\npara você ver os projetos dele.', 'Em breve eu cuido dos seus\nPokémon e passo o contato dele!'],
      pc: ['O PC está ligado...', 'A Box de projetos chega\njá já!'],
      board: ['Um quadro com o mapa\nde Kanto...', 'Em breve: o cartão de treinador\ndo JOÃO CABRAL, com insígnias.'],
      shelf: ['Livros sobre programação\ne games. Alguns bem gastos!'],
      gentleman: ['Eu sou o Tutor de Golpes.', 'Em breve vou ensinar as\nhabilidades do JOÃO CABRAL!'],
      boy: ['Dica: segure B enquanto\nanda para correr!'],
      youngster: ['Sabia que dá pra clicar em\nqualquer lugar para andar?'],
      stairs: ['A sala de minijogos lá em\ncima está em obras!'],
      door: ['Lá fora ainda está em\nconstrução. Volte depois!'],
      soon: ['Essa parte do Centro chega\nem breve!'],
      contact_ask: ['Por onde você quer falar\ncom o JOÃO CABRAL?'],
      copied: ['Endereço copiado!'],
    },
    en: {
      nurse_welcome: [
        "Hello! Welcome to JOÃO CABRAL's\nPokémon Center!",
        'Here the Pokémon are his\nprojects. Feel free to explore!',
        'Walk with the arrow keys\n(or WASD) or click the floor.',
        'To talk to someone or use\nsomething, press A or click it.',
        'Press START (Esc) or click it\nto see everything quickly!',
      ],
      nurse: ['JOÃO CABRAL built this Center\nso you can see his projects.', "Soon I'll heal your Pokémon\nand give you his contact!"],
      pc: ['The PC is on...', 'The projects Box is\ncoming soon!'],
      board: ['A board with a map\nof Kanto...', "Soon: JOÃO CABRAL's Trainer\nCard, with his badges."],
      shelf: ['Books about programming\nand games. Some well worn!'],
      gentleman: ["I'm the Move Tutor.", "Soon I'll teach JOÃO\nCABRAL's skills!"],
      boy: ['Tip: hold B while walking\nto run!'],
      youngster: ['Did you know you can click\nanywhere to walk there?'],
      stairs: ['The minigames room upstairs\nis under construction!'],
      door: ['The town outside is still\nbeing built. Come back later!'],
      soon: ['This part of the Center is\ncoming soon!'],
      contact_ask: ['How would you like to\nreach JOÃO CABRAL?'],
      copied: ['Address copied!'],
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
    },
  },
};
