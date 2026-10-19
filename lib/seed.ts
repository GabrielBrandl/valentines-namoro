import type { Person, Reel } from "./types";
const shots: Record<string, string> = {
  "photo-1494790108377-be9c29b29330": "/photos/marina-1.jpg",
  "photo-1524504388940-b1c1722653e1": "/photos/marina-2.jpg",
  "photo-1500648767791-00dcc994a43e": "/photos/lucas-1.jpg",
  "photo-1506794778202-cad84cf45f1d": "/photos/lucas-2.jpg",
  "photo-1534528741775-53994a69daeb": "/photos/beatriz-1.jpg",
  "photo-1517841905240-472988babdf9": "/photos/beatriz-1.jpg",
  "photo-1507003211169-0a1dd7228f2d": "/photos/theo-1.jpg",
  "photo-1539571696357-5a69c17a67c6": "/photos/theo-1.jpg",
  "photo-1529626455594-4ff0802cfb7e": "/photos/lara-1.jpg",
  "photo-1488426862026-3ee34a7d66df": "/photos/lara-1.jpg",
  "photo-1492562080023-ab3db95bfbce": "/photos/rafael-1.jpg",
  "photo-1501196354995-cbb51c65aaea": "/photos/rafael-1.jpg",
  "photo-1544005313-94ddf0286df2": "/photos/camila-1.jpg",
  "photo-1531123897727-8f129e1688ce": "/photos/camila-1.jpg",
  "photo-1463453091185-61582044d556": "/photos/diego-1.jpg",
  "photo-1488161628813-04466f872be2": "/photos/diego-1.jpg",
  "photo-1438761681033-6461ffad8d80": "/photos/julia-1.jpg",
  "photo-1525134479668-1bee5c7c6845": "/photos/julia-1.jpg",
  "photo-1502823403499-6ccfcf4fb453": "/photos/helena-1.jpg",
  "photo-1496440737103-cd596325d314": "/photos/helena-1.jpg",
  "aurora-marca": "/photos/aurora-1.jpg",
  "aurora-sala": "/photos/aurora-1.jpg",
  "photo-1507525428034-b723cf961d3e": "/photos/lara-1.jpg",
  "photo-1511671782779-c97d3d27a1d4": "/photos/rafael-1.jpg",
  "photo-1469474968028-56623f02e42e": "/photos/julia-1.jpg",
  "photo-1513364776144-60967b0f800f": "/photos/marina-2.jpg",
};

const photo = (id: string) => shots[id] ?? "/photos/marina-1.jpg";

export const INTERESTS = [
  "Café",
  "Música",
  "Viagem",
  "Trilha",
  "Cinema",
  "Cozinha",
  "Praia",
  "Livros",
  "Academia",
  "Arte",
  "Games",
  "Pets",
  "Vinho",
  "Dança",
  "Fotografia",
  "Corrida",
];

export const PEOPLE: Person[] = [
  {
    id: "marina",
    name: "Marina",
    age: 26,
    city: "São Paulo",
    job: "Designer",
    gender: "mulher",
    bio: "Desenho identidades de dia e procuro um bar com luz baixa de noite. Se você ri fácil, a gente já tem meio caminho.",
    interests: ["Arte", "Café", "Cinema", "Música"],
    photos: [
      photo("photo-1494790108377-be9c29b29330"),
      photo("photo-1524504388940-b1c1722653e1"),
    ],
    distanceKm: 3,
    likesYou: true,
    online: true,
    prompts: [
      { q: "Um domingo perfeito", a: "Feira, pão quente e nenhum plano marcado." },
      { q: "Me chama pra sair se", a: "Tiver uma exposição ou um vinil novo." },
    ],
    opener: "Oi! Seu super like chegou com estilo.",
    replies: [
      "Oi! Gostei do seu perfil. Você é mais café ou fim de tarde?",
      "Feira de domingo é imbatível. Qual bairro você indica?",
      "Então a gente já tem um plano. Me conta uma música que você não pula.",
    ],
  },
  {
    id: "lucas",
    name: "Lucas",
    age: 28,
    city: "Rio de Janeiro",
    job: "Chef",
    gender: "homem",
    bio: "Cozinho melhor do que danço, mas danço mesmo assim. Procuro alguém pra dividir a sobremesa.",
    interests: ["Cozinha", "Praia", "Música", "Vinho"],
    photos: [
      photo("photo-1500648767791-00dcc994a43e"),
      photo("photo-1506794778202-cad84cf45f1d"),
    ],
    distanceKm: 8,
    likesYou: false,
    online: false,
    prompts: [
      { q: "O prato que me define", a: "Risoto de limão, sem pressa." },
      { q: "Não curto muito", a: "Jantar em lugar barulhento demais." },
    ],
    opener: "Super like recebido. Já estou pensando no cardápio.",
    replies: [
      "E aí! Você cozinha ou só come bem?",
      "Risoto é sério. Me fala um lugar que você voltaria mil vezes.",
      "Fechado. Próximo encontro a gente decide o molho.",
    ],
  },
  {
    id: "beatriz",
    name: "Beatriz",
    age: 24,
    city: "Belo Horizonte",
    job: "Arquiteta",
    gender: "mulher",
    bio: "Gosto de cidade andando a pé, planta na janela e conversa que não olha o relógio.",
    interests: ["Arte", "Livros", "Café", "Trilha"],
    photos: [photo("photo-1534528741775-53994a69daeb")],
    distanceKm: 5,
    likesYou: true,
    online: true,
    prompts: [
      { q: "Meu canto da casa", a: "A poltrona perto da janela." },
      { q: "Sinal de que combina", a: "A gente se perde conversando." },
    ],
    opener: "Oi, vi o super like. Que bom te encontrar por aqui.",
    replies: [
      "Oi! Sua bio foi direta, gostei. Qual livro você indica sem pensar?",
      "Janela e café já me ganharam. Você é de rolê ou de sofá?",
      "Sofá com uma saída bem escolhida. Perfeito.",
    ],
  },
  {
    id: "theo",
    name: "Theo",
    age: 27,
    city: "Curitiba",
    job: "Desenvolvedor",
    gender: "homem",
    bio: "Faço software e pão de fermentação lenta. Prometo não falar de código no primeiro encontro. Talvez no segundo.",
    interests: ["Games", "Café", "Corrida", "Música"],
    photos: [photo("photo-1507003211169-0a1dd7228f2d")],
    distanceKm: 2,
    likesYou: true,
    online: false,
    prompts: [
      { q: "Hobby atual", a: "Correr 5 km e fingir que foi fácil." },
      { q: "Primeiro encontro ideal", a: "Café curto e uma caminhada longa." },
    ],
    opener: "Super like anotado. Café por minha conta.",
    replies: [
      "Oi! Café curto e caminhada longa é bem a minha cara.",
      "Você corre também ou só acompanha da arquibancada?",
      "Então a gente começa devagar. Me manda uma música boa pra caminhar.",
    ],
  },
  {
    id: "lara",
    name: "Lara",
    age: 23,
    city: "Florianópolis",
    job: "Fotógrafa",
    gender: "mulher",
    bio: "Persigo luz bonita e cachorro dos outros. Se você topar uma trilha cedo, a gente se entende.",
    interests: ["Fotografia", "Praia", "Trilha", "Pets"],
    photos: [photo("photo-1529626455594-4ff0802cfb7e")],
    distanceKm: 12,
    likesYou: false,
    online: true,
    prompts: [
      { q: "Me acorda pra", a: "Ver o sol nascer na praia." },
      { q: "Red flag fofa", a: "Eu paro pra fotografar qualquer gato." },
    ],
    opener: "Oi! Super like e já imaginei um ensaio na orla.",
    replies: [
      "Oi! Você acorda cedo de verdade ou só na teoria?",
      "Gato na rua é parada obrigatória, isso não se discute.",
      "Me conta a última foto que você tirou sem querer.",
    ],
  },
  {
    id: "rafael",
    name: "Rafael",
    age: 29,
    city: "Salvador",
    job: "Músico",
    gender: "homem",
    bio: "Toco violão em casa e finjo que não estou ensaiando quando alguém chega. Procuro parceria, não plateia.",
    interests: ["Música", "Praia", "Cozinha", "Dança"],
    photos: [photo("photo-1492562080023-ab3db95bfbce")],
    distanceKm: 6,
    likesYou: true,
    online: true,
    prompts: [
      { q: "No repeat agora", a: "Qualquer coisa com violão e mar." },
      { q: "Me leva em", a: "Um bar em que ainda dá pra conversar." },
    ],
    opener: "Seu super like entrou no repertório.",
    replies: [
      "Oi! Qual a última música que ficou na sua cabeça o dia inteiro?",
      "Bar com conversa é raro e precioso. Você dança ou só observa?",
      "Observar também vale. Depois eu te ensino dois passos.",
    ],
  },
  {
    id: "camila",
    name: "Camila",
    age: 25,
    city: "Recife",
    job: "Médica",
    gender: "mulher",
    bio: "Plantão termina, a vida começa. Quero alguém que entenda agenda maluca e mesmo assim marque o sorvete.",
    interests: ["Praia", "Corrida", "Livros", "Café"],
    photos: [photo("photo-1544005313-94ddf0286df2")],
    distanceKm: 4,
    likesYou: true,
    online: false,
    prompts: [
      { q: "Depois de um dia longo", a: "Chuveiro, série boba e silêncio bom." },
      { q: "Forma de carinho", a: "Aparecer com alguma coisa gelada." },
    ],
    opener: "Oi! Super like no meio do intervalo. Oi de verdade.",
    replies: [
      "Oi! Prometo responder mesmo quando o dia aperta.",
      "Série boba é terapia. Qual a sua culpa audiovisual?",
      "Gelado anotado. Qual sabor não pode faltar?",
    ],
  },
  {
    id: "diego",
    name: "Diego",
    age: 31,
    city: "Porto Alegre",
    job: "Professor",
    gender: "homem",
    bio: "Dou aula de história e coleciono mapas velhos. Gosto de gente curiosa, não de gente que sabe tudo.",
    interests: ["Livros", "Café", "Viagem", "Cinema"],
    photos: [photo("photo-1463453091185-61582044d556")],
    distanceKm: 9,
    likesYou: false,
    online: false,
    prompts: [
      { q: "Uma cidade que quero repetir", a: "Lisboa, de preferência a pé." },
      { q: "Conversa que me prende", a: "Qualquer uma com uma boa pergunta." },
    ],
    opener: "Super like recebido. Isso merece uma boa pergunta.",
    replies: [
      "Oi! Se você pudesse jantar com qualquer época, qual seria?",
      "Lisboa a pé é quase um esporte. Você viaja leve ou com lista?",
      "Lista curta, então. Me fala um filme que você defende sozinho.",
    ],
  },
  {
    id: "julia",
    name: "Júlia",
    age: 22,
    city: "Brasília",
    job: "Estudante de cinema",
    gender: "mulher",
    bio: "Assisto filme até o crédito final e comento alto demais. Procuro companhia de poltrona e de rua.",
    interests: ["Cinema", "Arte", "Música", "Fotografia"],
    photos: [photo("photo-1438761681033-6461ffad8d80")],
    distanceKm: 7,
    likesYou: true,
    online: true,
    prompts: [
      { q: "Não saio do cinema sem", a: "Discutir o final no estacionamento." },
      { q: "Me descreve em um plano", a: "Câmera na mão, vento e risada." },
    ],
    opener: "Super like! Já reservei a poltrona do meio.",
    replies: [
      "Oi! Último filme que você ficou pensando no dia seguinte?",
      "Crédito final é sagrado. Você fala durante o filme ou só depois?",
      "Depois, então. Assim a gente não briga na cena importante.",
    ],
  },
  {
    id: "helena",
    name: "Helena",
    age: 27,
    city: "Fortaleza",
    job: "Jornalista",
    gender: "mulher",
    bio: "Faço perguntas por profissão e por vício. Quero alguém que responda com honestidade e um pouco de graça.",
    interests: ["Livros", "Praia", "Viagem", "Café"],
    photos: [photo("photo-1502823403499-6ccfcf4fb453")],
    distanceKm: 11,
    likesYou: false,
    online: true,
    prompts: [
      { q: "Pergunta favorita", a: "O que você está aprendendo agora?" },
      { q: "Fim de tarde ideal", a: "Calçadão, vento e nenhuma notificação." },
    ],
    opener: "Oi, super like anotado. Posso começar com uma pergunta?",
    replies: [
      "Oi! O que você está aprendendo agora, de verdade?",
      "Calçadão sem notificação parece luxo. Você consegue?",
      "Então me conta uma coisa boa que aconteceu essa semana.",
    ],
  },
  {
    id: "aurora",
    name: "Café Aurora",
    age: 30,
    city: "São Paulo",
    job: "Patrocinado",
    bio: "Um café para o primeiro encontro. Responda a enquete e leve um cupom.",
    gender: "mulher",
    interests: ["Café", "Música", "Cinema"],
    photos: [photo("aurora-marca")],
    distanceKm: 2,
    likesYou: false,
    online: false,
    prompts: [{ q: "Oferta", a: "Cupom AURORA10 no primeiro café." }],
    opener: "Bora marcar esse café?",
    replies: ["O café sai no seu ritmo. Me chama quando quiser."],
    sponsored: {
      brand: "Café Aurora",
      poll: "Qual o melhor primeiro encontro?",
      options: ["Café", "Trilha", "Show"],
      coupon: "AURORA10",
    },
  },
];

const hour = 60 * 60 * 1000;
const now = Date.UTC(2026, 9, 8, 18, 0, 0);

export const SEED_REELS: Reel[] = [
  {
    id: "reel-lara",
    authorId: "lara",
    caption: "A luz de hoje cedo ficou desse jeito. Valeu acordar.",
    media: "/videos/flower.mp4",
    poster: photo("photo-1507525428034-b723cf961d3e"),
    likes: 1284,
    liked: false,
    at: now - 2 * hour,
    comments: [
      { id: "c1", author: "Marina", text: "Essa luz está absurda.", at: now - 90 * 60 * 1000 },
      { id: "c2", author: "Theo", text: "Quero esse fim de tarde.", at: now - 70 * 60 * 1000 },
    ],
  },
  {
    id: "reel-rafael",
    authorId: "rafael",
    caption: "Ensaio de domingo. Se desafinar, faz parte.",
    media: "/photos/rafael-1.jpg",
    poster: photo("photo-1511671782779-c97d3d27a1d4"),
    likes: 986,
    liked: false,
    at: now - 5 * hour,
    comments: [
      { id: "c3", author: "Júlia", text: "Manda o áudio inteiro depois.", at: now - 4 * hour },
    ],
  },
  {
    id: "reel-julia",
    authorId: "julia",
    caption: "Testando um plano sequência no parque. Não pisca.",
    media: "/photos/julia-1.jpg",
    poster: photo("photo-1469474968028-56623f02e42e"),
    likes: 2401,
    liked: false,
    at: now - 8 * hour,
    comments: [
      { id: "c4", author: "Beatriz", text: "O final ficou lindo.", at: now - 7 * hour },
      { id: "c5", author: "Camila", text: "Cinema de bolso.", at: now - 6 * hour },
    ],
  },
  {
    id: "reel-marina",
    authorId: "marina",
    caption: "Cor, textura e uma desculpa pra sair de casa.",
    media: "/photos/marina-2.jpg",
    poster: photo("photo-1513364776144-60967b0f800f"),
    likes: 764,
    liked: false,
    at: now - 26 * hour,
    comments: [
      { id: "c6", author: "Helena", text: "Qual foi a referência?", at: now - 20 * hour },
    ],
  },
  {
    id: "reel-camila",
    authorId: "camila",
    caption: "Dia de folga raro. Mar, passo curto, zero pressa.",
    media: "/photos/camila-1.jpg",
    poster: "/photos/camila-1.jpg",
    likes: 3120,
    liked: false,
    at: now - 30 * hour,
    comments: [
      { id: "c7", author: "Lara", text: "Folga merecida. Fica por aí.", at: now - 28 * hour },
    ],
  },
];

const VERIFIED = new Set(["marina", "beatriz", "rafael", "julia"]);

export function decorate(person: Person): Person {
  if (!VERIFIED.has(person.id)) return person;
  return { ...person, verified: true };
}

export function getPerson(id: string) {
  const person = PEOPLE.find((item) => item.id === id);
  return person ? decorate(person) : null;
}

export function portrait(name: string) {
  const letter = (name.trim().slice(0, 1) || "V").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
    <rect width="800" height="1000" fill="#f6efe8"/>
    <circle cx="400" cy="430" r="180" fill="#9d2348"/>
    <text x="400" y="490" text-anchor="middle" font-family="Georgia, serif" font-size="180" fill="#f6efe8">${letter}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
