/** Catálogo e tipos do ecossistema Valentine's (Shopping · Delivery · Club · Afiliados). */

export type SellerKind = "loja" | "criador" | "estabelecimento" | "distribuidor";

export type EcoSeller = {
  id: string;
  name: string;
  kind: SellerKind;
  city: string;
  state: string;
  rating: number;
  reviews: number;
  deliveryKm?: number;
  tagline: string;
};

export type EcoProduct = {
  id: string;
  sellerId: string;
  title: string;
  detail: string;
  cents: number;
  category: "moda" | "beleza" | "casa" | "bebidas" | "comida" | "presentes" | "outros";
  image: string;
  stock: number;
  deliveryEligible: boolean;
  affiliatePct: number;
  tags: string[];
};

export type EcoMerchant = {
  id: string;
  name: string;
  kind: "restaurante" | "mercado" | "bar" | "loja" | "distribuidor";
  city: string;
  etaMin: number;
  feeCents: number;
  rating: number;
  cover: string;
  categories: string[];
  open: boolean;
};

export type ClubTier = "livre" | "gold" | "black";

export type ClubPerk = {
  id: string;
  title: string;
  detail: string;
  pointsCost: number;
  tier: ClubTier;
};

export type CartItem = {
  productId: string;
  qty: number;
};

export type EcoOrder = {
  id: string;
  kind: "shopping" | "delivery";
  at: number;
  totalCents: number;
  status: "pago" | "preparando" | "a_caminho" | "entregue" | "cancelado";
  items: { title: string; qty: number; cents: number }[];
  sellerName: string;
};

export const ECO_SELLERS: EcoSeller[] = [
  {
    id: "seller-aurora",
    name: "Aurora Presentes",
    kind: "loja",
    city: "São Paulo",
    state: "SP",
    rating: 4.8,
    reviews: 214,
    deliveryKm: 12,
    tagline: "Presentes e kits para o primeiro encontro",
  },
  {
    id: "seller-vina",
    name: "Vina Beauty",
    kind: "criador",
    city: "Rio de Janeiro",
    state: "RJ",
    rating: 4.9,
    reviews: 980,
    tagline: "Beleza com vídeos reais de criadores",
  },
  {
    id: "seller-bodega",
    name: "Bodega do Centro",
    kind: "estabelecimento",
    city: "Belo Horizonte",
    state: "MG",
    rating: 4.6,
    reviews: 132,
    deliveryKm: 8,
    tagline: "Bebidas e petiscos perto de você",
  },
];

export const ECO_PRODUCTS: EcoProduct[] = [
  {
    id: "prod-kit-encontro",
    sellerId: "seller-aurora",
    title: "Kit Primeiro Encontro",
    detail: "Vela, cartão e chocolate belga — entrega rápida.",
    cents: 8900,
    category: "presentes",
    image: "/photos/aurora-1.jpg",
    stock: 40,
    deliveryEligible: true,
    affiliatePct: 12,
    tags: ["encontro", "presente"],
  },
  {
    id: "prod-serum",
    sellerId: "seller-vina",
    title: "Sérum Glow Noite",
    detail: "Vitrine de criador · vídeo demonstrativo no Shopping.",
    cents: 12900,
    category: "beleza",
    image: "/photos/marina-2.jpg",
    stock: 80,
    deliveryEligible: true,
    affiliatePct: 18,
    tags: ["beleza", "criador"],
  },
  {
    id: "prod-vinho",
    sellerId: "seller-bodega",
    title: "Vinho Tinto Seleção",
    detail: "Garrafa 750ml · ideal para combinar no Match.",
    cents: 6790,
    category: "bebidas",
    image: "/photos/lara-1.jpg",
    stock: 55,
    deliveryEligible: true,
    affiliatePct: 8,
    tags: ["bebida", "delivery"],
  },
  {
    id: "prod-box-doce",
    sellerId: "seller-aurora",
    title: "Box Doce Surpresa",
    detail: "Doces artesanais para presentear matches.",
    cents: 5900,
    category: "comida",
    image: "/photos/camila-1.jpg",
    stock: 30,
    deliveryEligible: true,
    affiliatePct: 10,
    tags: ["doce", "presente"],
  },
];

export const ECO_MERCHANTS: EcoMerchant[] = [
  {
    id: "m-bodega",
    name: "Bodega do Centro",
    kind: "bar",
    city: "São Paulo",
    etaMin: 35,
    feeCents: 799,
    rating: 4.6,
    cover: "/photos/diego-1.jpg",
    categories: ["Bebidas", "Petiscos"],
    open: true,
  },
  {
    id: "m-aurora-cafe",
    name: "Café Aurora",
    kind: "restaurante",
    city: "São Paulo",
    etaMin: 28,
    feeCents: 599,
    rating: 4.8,
    cover: "/photos/aurora-1.jpg",
    categories: ["Café", "Brunch"],
    open: true,
  },
  {
    id: "m-mercado-noite",
    name: "Mercado da Noite",
    kind: "mercado",
    city: "São Paulo",
    etaMin: 45,
    feeCents: 999,
    rating: 4.4,
    cover: "/photos/helena-1.jpg",
    categories: ["Mercado", "Bebidas"],
    open: true,
  },
];

export const CLUB_PERKS: ClubPerk[] = [
  {
    id: "perk-frete",
    title: "Frete grátis Shopping",
    detail: "Em pedidos acima de R$ 80 na sua cidade.",
    pointsCost: 120,
    tier: "livre",
  },
  {
    id: "perk-drink",
    title: "Drink no Café Aurora",
    detail: "1 café ou drink em parceiros Club.",
    pointsCost: 200,
    tier: "gold",
  },
  {
    id: "perk-boost",
    title: "Impulso Match 24h",
    detail: "Destaque no deck de descoberta.",
    pointsCost: 90,
    tier: "livre",
  },
  {
    id: "perk-black",
    title: "Noite Black Valentine's",
    detail: "Acesso a experiências e lives VIP.",
    pointsCost: 500,
    tier: "black",
  },
];

export function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function sellerOf(id: string) {
  return ECO_SELLERS.find((s) => s.id === id);
}

export function productOf(id: string) {
  return ECO_PRODUCTS.find((p) => p.id === id);
}

export function merchantOf(id: string) {
  return ECO_MERCHANTS.find((m) => m.id === id);
}

export function productsOfSeller(sellerId: string) {
  return ECO_PRODUCTS.filter((p) => p.sellerId === sellerId);
}

export function deliveryProducts() {
  return ECO_PRODUCTS.filter((p) => p.deliveryEligible);
}

export function tierLabel(tier: ClubTier) {
  if (tier === "black") return "Black";
  if (tier === "gold") return "Gold";
  return "Livre";
}

export function tierFromPoints(points: number): ClubTier {
  if (points >= 800) return "black";
  if (points >= 250) return "gold";
  return "livre";
}
