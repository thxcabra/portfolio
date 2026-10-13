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
    since: 2019,
    partner: 25,
    about: {
      pt: 'Texto de exemplo sobre mim. Quem eu sou, com o que trabalho, o que me interessa e o tipo de problema que eu gosto de resolver.',
      en: 'Placeholder text about me. Who I am, what I work with, what I care about and the kind of problem I like to solve.',
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

  badges: [
    { name: 'EMPRESA EXEMPLO A', shape: 'boulder', period: '2024–hoje', role: { pt: 'Cargo de exemplo', en: 'Example role' }, text: lorem },
    { name: 'EMPRESA EXEMPLO B', shape: 'cascade', period: '2022–2024', role: { pt: 'Cargo de exemplo', en: 'Example role' }, text: lorem },
    { name: 'EMPRESA EXEMPLO C', shape: 'thunder', period: '2019–2022', role: { pt: 'Cargo de exemplo', en: 'Example role' }, text: lorem },
  ],

  moves: [
    { name: 'TYPESCRIPT', type: 'electric', power: 90, pp: 20, text: { pt: 'Exemplo: o que você faz com essa habilidade.', en: 'Example: what you do with this skill.' } },
    { name: 'PYTHON', type: 'psychic', power: 90, pp: 20, text: { pt: 'Exemplo: o que você faz com essa habilidade.', en: 'Example: what you do with this skill.' } },
    { name: 'REACT', type: 'water', power: 80, pp: 15, text: { pt: 'Exemplo: o que você faz com essa habilidade.', en: 'Example: what you do with this skill.' } },
    { name: 'SQL', type: 'rock', power: 75, pp: 15, text: { pt: 'Exemplo: o que você faz com essa habilidade.', en: 'Example: what you do with this skill.' } },
    { name: 'AUTOMAÇÃO', type: 'dragon', power: 100, pp: 10, text: { pt: 'Exemplo: o que você faz com essa habilidade.', en: 'Example: what you do with this skill.' } },
    { name: 'DOCKER', type: 'steel', power: 60, pp: 25, text: { pt: 'Exemplo: o que você faz com essa habilidade.', en: 'Example: what you do with this skill.' } },
  ],

  // Cada contato: { label, url }. url = https://..., mailto:... ou um arquivo em assets/ (ex.: 'assets/curriculo.pdf').
  contact: [
    { label: 'GITHUB', url: 'https://github.com/' },
    { label: 'LINKEDIN', url: 'https://www.linkedin.com/' },
    { label: 'E-MAIL', url: 'mailto:voce@exemplo.com' },
  ],

  // Message box pages: up to 2 lines each (\n), short enough to fit (node check.mjs checks).
  talk: {
    pt: {
      nurse_welcome: [
        'Olá! Bem-vindo ao Centro\nPokémon do JOÃO CABRAL!',
        'Aqui os Pokémon são os projetos\ndele. Explore à vontade!',
        'Ande com as setas (ou WASD)\nou clicando no chão.',
        'Para falar com alguém ou usar\nalgo, aperte A ou clique nele.',
        'Aperte START (ou clique nele)\npara ver tudo rapidinho!',
      ],
      nurse: ['O JOÃO criou este Centro para\nvocê conhecer os projetos dele.', 'Em breve eu cuido dos seus\nPokémon e passo o contato dele!'],
      pc: ['O PC está ligado...', 'A Box de projetos chega\njá já!'],
      board: ['Um quadro com o mapa\nde Kanto...', 'Em breve: o cartão de treinador\ndo JOÃO, com as insígnias.'],
      shelf: ['Livros sobre programação\ne games. Alguns bem gastos!'],
      gentleman: ['Eu sou o Tutor de Golpes.', 'Em breve vou ensinar as\nhabilidades do JOÃO!'],
      boy: ['Dica: segure B enquanto\nanda para correr!'],
      youngster: ['Sabia que dá pra clicar em\nqualquer lugar para andar?'],
      stairs: ['A sala de minijogos lá em\ncima está em obras!'],
      door: ['Lá fora ainda está em\nconstrução. Volte depois!'],
      soon: ['Essa parte do Centro chega\nem breve!'],
      contact_ask: ['Por onde você quer falar\ncom o JOÃO?'],
      copied: ['Endereço copiado!'],
    },
    en: {
      nurse_welcome: [
        "Hello! Welcome to JOÃO CABRAL's\nPokémon Center!",
        'Here the Pokémon are his\nprojects. Feel free to explore!',
        'Walk with the arrow keys\n(or WASD) or click the floor.',
        'To talk to someone or use\nsomething, press A or click it.',
        'Press START (or click it) to\nsee everything quickly!',
      ],
      nurse: ['JOÃO built this Center so you\ncan get to know his projects.', "Soon I'll heal your Pokémon\nand give you his contact!"],
      pc: ['The PC is on...', 'The projects Box is\ncoming soon!'],
      board: ['A board with a map\nof Kanto...', "Soon: JOÃO's Trainer Card,\nwith his badges."],
      shelf: ['Books about programming\nand games. Some well worn!'],
      gentleman: ["I'm the Move Tutor.", "Soon I'll teach JOÃO's\nskills!"],
      boy: ['Tip: hold B while walking\nto run!'],
      youngster: ['Did you know you can click\nanywhere to walk there?'],
      stairs: ['The minigames room upstairs\nis under construction!'],
      door: ['The town outside is still\nbeing built. Come back later!'],
      soon: ['This part of the Center is\ncoming soon!'],
      contact_ask: ['How would you like to\nreach JOÃO?'],
      copied: ['Address copied!'],
    },
  },

  ui: {
    pt: {
      menu_projetos: 'PROJETOS', menu_sobre: 'SOBRE', menu_experiencia: 'EXPERIÊNCIA', menu_habilidades: 'HABILIDADES',
      menu_contato: 'CONTATO', menu_opcoes: 'OPÇÕES', menu_sair: 'SAIR',
      help_projetos: 'Todos os projetos do JOÃO, cada\num com o seu Pokémon.',
      help_sobre: 'Quem é o JOÃO: o cartão de\ntreinador dele.',
      help_experiencia: 'Onde o JOÃO trabalhou e o\nque fez em cada lugar.',
      help_habilidades: 'As tecnologias que o JOÃO\ndomina, como golpes.',
      help_contato: 'E-mail, LinkedIn e GitHub\npara falar com o JOÃO.',
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
      help_projetos: "All of JOÃO's projects, each\none with its own Pokémon.",
      help_sobre: 'Who JOÃO is: his Trainer\nCard.',
      help_experiencia: 'Where JOÃO has worked and\nwhat he did there.',
      help_habilidades: 'The technologies JOÃO knows,\nas moves.',
      help_contato: 'E-mail, LinkedIn and GitHub\nto reach JOÃO.',
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
