export type PlanId = "plus" | "gold" | "platinum" | "black";

export type Grant =
  | { type: "super"; n: number }
  | { type: "undo"; n: number }
  | { type: "likes"; days: number }
  | { type: "unlimited"; hours: number }
  | { type: "boost"; minutes: number }
  | { type: "priority"; n: number }
  | { type: "city"; days: number }
  | { type: "reserved"; mode: "basico" | "plus"; days: number }
  | { type: "ads"; days: number }
  | { type: "credits"; n: number }
  | { type: "gift"; id: string; n: number }
  | { type: "highlight" }
  | { type: "inviteBoost"; hours: number }
  | { type: "pin"; n: number }
  | { type: "tip" }
  | { type: "passport" };

export type ShopItem = {
  id: string;
  name: string;
  detail: string;
  cents: number;
  grant: Grant;
};

export const MIN_CENTS = 600;

export const SHOP: ShopItem[] = [
  { id: "impulso-30", name: "Impulso de 30 minutos", detail: "Seu perfil sobe no deck por meia hora.", cents: 990, grant: { type: "boost", minutes: 30 } },
  { id: "impulso-3h", name: "Impulso de 3 horas", detail: "Destaque maior no mesmo dia.", cents: 1990, grant: { type: "boost", minutes: 180 } },
  { id: "super-5", name: "5 super curtidas", detail: "Super curtida avisa a pessoa na hora.", cents: 1290, grant: { type: "super", n: 5 } },
  { id: "super-15", name: "15 super curtidas", detail: "Pacote para a semana.", cents: 2990, grant: { type: "super", n: 15 } },
  { id: "ver-likes", name: "Ver quem curtiu", detail: "A lista fica aberta por 7 dias.", cents: 1490, grant: { type: "likes", days: 7 } },
  { id: "undo-5", name: "5 desfazer", detail: "Volta um perfil que você passou.", cents: 990, grant: { type: "undo", n: 5 } },
  { id: "undo-15", name: "15 desfazer", detail: "Pacote de voltar.", cents: 2490, grant: { type: "undo", n: 15 } },
  { id: "prioridade-1", name: "Mensagem prioritária", detail: "Uma mensagem que chega no topo.", cents: 690, grant: { type: "priority", n: 1 } },
  { id: "prioridade-5", name: "5 mensagens prioritárias", detail: "Pacote de prioridade.", cents: 2490, grant: { type: "priority", n: 5 } },
  { id: "cidade-7", name: "Trocar de cidade", detail: "Mostra outra cidade por 7 dias.", cents: 990, grant: { type: "city", days: 7 } },
  { id: "dia-ilimitado", name: "Dia sem limites", detail: "Super e desfazer liberados por 24 horas.", cents: 690, grant: { type: "unlimited", hours: 24 } },
  { id: "presentes-simples", name: "Pacote de presentes simples", detail: "Três presentes para mandar no chat.", cents: 690, grant: { type: "gift", id: "simples", n: 3 } },
  { id: "gorjeta", name: "Gorjeta em reel", detail: "Destaca um vídeo de alguém.", cents: 690, grant: { type: "tip" } },
  { id: "destaque", name: "Destaque de reel", detail: "Seu vídeo fica no topo por 24 horas.", cents: 1290, grant: { type: "highlight" } },
  { id: "reservado-basico", name: "Modo reservado básico", detail: "Você aparece offline por 7 dias.", cents: 990, grant: { type: "reserved", mode: "basico", days: 7 } },
  { id: "reservado-plus", name: "Modo reservado plus", detail: "Some do deck de quem você não curtiu, por 7 dias.", cents: 1690, grant: { type: "reserved", mode: "plus", days: 7 } },
  { id: "sem-anuncios", name: "Remover anúncios", detail: "30 dias sem card patrocinado.", cents: 990, grant: { type: "ads", days: 30 } },
  { id: "creditos-10", name: "10 créditos de presente", detail: "Créditos para usar dentro do app.", cents: 1000, grant: { type: "credits", n: 10 } },
  { id: "creditos-30", name: "30 créditos de presente", detail: "Pacote maior de créditos.", cents: 3000, grant: { type: "credits", n: 30 } },
  { id: "selo-impulso", name: "Selo de impulso", detail: "Um selo de destaque no seu perfil por 1 hora.", cents: 690, grant: { type: "boost", minutes: 60 } },
  { id: "filtro-cidade", name: "Filtro de cidade extra", detail: "Mais 7 dias com a cidade escolhida.", cents: 690, grant: { type: "city", days: 7 } },
  { id: "ver-de-novo", name: "Ver perfis de novo", detail: "Cinco voltas para rever quem passou.", cents: 690, grant: { type: "undo", n: 5 } },
  { id: "impulso-convite", name: "Impulso de convite", detail: "Dobra a recompensa de convite por 24 horas.", cents: 990, grant: { type: "inviteBoost", hours: 24 } },
  { id: "presente-rosa", name: "Presente rosa", detail: "Uma rosa para enviar no chat.", cents: 690, grant: { type: "gift", id: "rosa", n: 1 } },
  { id: "presente-jantar", name: "Presente jantar", detail: "Um jantar para enviar no chat.", cents: 1290, grant: { type: "gift", id: "jantar", n: 1 } },
  { id: "presente-viagem", name: "Presente viagem", detail: "Uma viagem para enviar no chat.", cents: 1990, grant: { type: "gift", id: "viagem", n: 1 } },
  { id: "fixar-chat", name: "Fixar conversa no topo", detail: "Uma conversa fica no alto da lista.", cents: 690, grant: { type: "pin", n: 1 } },
  { id: "passaporte", name: "Passaporte de fim de semana", detail: "Cidade extra por 2 dias e impulso de 3 horas.", cents: 2490, grant: { type: "passport" } },
];

export const PLANS: {
  id: PlanId;
  name: string;
  monthly: number;
  annual: number;
  points: string[];
}[] = [
  {
    id: "plus",
    name: "Plus",
    monthly: 2990,
    annual: 21400,
    points: ["Ver quem curtiu", "5 super curtidas por dia", "5 desfazer por dia"],
  },
  {
    id: "gold",
    name: "Gold",
    monthly: 4990,
    annual: 35800,
    points: ["Tudo do Plus", "15 super por dia", "3 mensagens prioritárias", "Trocar de cidade por 7 dias"],
  },
  {
    id: "platinum",
    name: "Platinum",
    monthly: 7990,
    annual: 57400,
    points: ["Tudo do Gold", "Modo reservado", "Sem anúncios", "10 mensagens prioritárias"],
  },
  {
    id: "black",
    name: "Black",
    monthly: 14990,
    annual: 107900,
    points: ["Super e desfazer no dia a dia", "Modo reservado plus", "Sem anúncios", "30 mensagens prioritárias"],
  },
];

export const PERKS: Record<
  PlanId,
  { seeLikes: boolean; superDaily: number; undoDaily: number; noAds: boolean; reserved: boolean; priority: number }
> = {
  plus: { seeLikes: true, superDaily: 5, undoDaily: 5, noAds: false, reserved: false, priority: 0 },
  gold: { seeLikes: true, superDaily: 15, undoDaily: 10, noAds: false, reserved: false, priority: 3 },
  platinum: { seeLikes: true, superDaily: 30, undoDaily: 20, noAds: true, reserved: true, priority: 10 },
  black: { seeLikes: true, superDaily: 99, undoDaily: 99, noAds: true, reserved: true, priority: 30 },
};

export const FOUNDER_CENTS = Math.round(107900 * 0.6);

export const GIFT_LABEL: Record<string, string> = {
  simples: "um presente simples",
  rosa: "uma rosa",
  jantar: "um jantar",
  viagem: "uma viagem",
};

export function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const REWARD_CAP = 20;
export const INVITE_DAILY_CAP = 10;
export const REWARD_CREDITS = 5;
