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
    },
    en: {
      nurse_welcome: [
        "Hello! Welcome to JOÃO CABRAL's\nPokémon Center!",
        'Here the Pokémon are his\nprojects. Feel free to explore!',
        'Walk with the arrow keys\n(or WASD) or click the floor.',
        'To talk to someone or use\nsomething, press A or click it.',
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
    },
  },

  ui: {
    pt: {
      menu_dex: 'POKéDEX', menu_badges: 'INSÍGNIAS', menu_moves: 'GOLPES', menu_contact: 'POKéNAV', menu_options: 'OPÇÕES',
      help_dex: 'Meus projetos. Cada um é um Pokémon.',
      help_card: 'Quem é o treinador.',
      help_badges: 'Onde trabalhei e o que conquistei.',
      help_moves: 'As habilidades que eu domino.',
      help_contact: 'Fale comigo.',
      help_options: 'Idioma e som.',
      seen: 'VISTOS', year: 'ANO', shiny: 'SHINY!', repo: 'CÓDIGO', live: 'VER AO VIVO',
      trainer_card: 'CARTÃO DE TREINADOR', id_no: 'IDNº', name: 'NOME', time: 'TEMPO', years: 'ANOS', about: 'SOBRE MIM',
      badge_empty: 'Nenhuma insígnia ainda.', type: 'TIPO', power: 'PODER', open_hint: 'Aperte A ou clique para abrir.',
      on: 'SIM', off: 'NÃO',
      opt_lang: 'IDIOMA', opt_sound: 'SOM', opt_textSpeed: 'TEXTO', opt_frame: 'MOLDURA',
      help_opt_lang: 'Troca o idioma do site.', help_opt_sound: 'Liga os sons do jogo. Também no botão preto da Pokédex.',
      help_opt_textSpeed: 'Velocidade em que o texto aparece.', help_opt_frame: 'Estilo das caixas de texto.',
      slow: 'LENTO', mid: 'MÉDIO', fast: 'RÁPIDO', type_frame: 'TIPO',
      registered: 'Os dados de {name} foram registrados na POKéDEX!',
      back: 'Voltar', prev: '< ANT', next: 'PRÓX >',
    },
    en: {
      menu_dex: 'POKéDEX', menu_badges: 'BADGES', menu_moves: 'MOVES', menu_contact: 'POKéNAV', menu_options: 'OPTION',
      help_dex: 'My projects. Each one is a Pokémon.',
      help_card: 'Who the trainer is.',
      help_badges: 'Where I worked and what I earned.',
      help_moves: 'The skills I know.',
      help_contact: 'Get in touch.',
      help_options: 'Language and sound.',
      seen: 'SEEN', year: 'YEAR', shiny: 'SHINY!', repo: 'CODE', live: 'LIVE',
      trainer_card: 'TRAINER CARD', id_no: 'IDNo.', name: 'NAME', time: 'TIME', years: 'YRS', about: 'ABOUT ME',
      badge_empty: 'No badges yet.', type: 'TYPE', power: 'POWER', open_hint: 'Press A or click to open.',
      on: 'ON', off: 'OFF',
      opt_lang: 'LANGUAGE', opt_sound: 'SOUND', opt_textSpeed: 'TEXT', opt_frame: 'FRAME',
      help_opt_lang: 'Switch the site language.', help_opt_sound: 'Turn the game sounds on. Also the black button on the Pokédex.',
      help_opt_textSpeed: 'How fast the text appears.', help_opt_frame: 'Style of the text boxes.',
      slow: 'SLOW', mid: 'MID', fast: 'FAST', type_frame: 'TYPE',
      registered: "{name}'s data was added to the POKéDEX!",
      back: 'Back', prev: '< PREV', next: 'NEXT >',
    },
  },
};
