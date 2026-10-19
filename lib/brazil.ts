export const GOAL = 10000;

export const STATES: { uf: string; name: string; signups: number }[] = [
  { uf: "AC", name: "Acre", signups: 410 },
  { uf: "AL", name: "Alagoas", signups: 980 },
  { uf: "AP", name: "Amapá", signups: 260 },
  { uf: "AM", name: "Amazonas", signups: 1240 },
  { uf: "BA", name: "Bahia", signups: 3560 },
  { uf: "CE", name: "Ceará", signups: 2890 },
  { uf: "DF", name: "Distrito Federal", signups: 4120 },
  { uf: "ES", name: "Espírito Santo", signups: 1680 },
  { uf: "GO", name: "Goiás", signups: 2210 },
  { uf: "MA", name: "Maranhão", signups: 1340 },
  { uf: "MT", name: "Mato Grosso", signups: 980 },
  { uf: "MS", name: "Mato Grosso do Sul", signups: 870 },
  { uf: "MG", name: "Minas Gerais", signups: 5340 },
  { uf: "PA", name: "Pará", signups: 1760 },
  { uf: "PB", name: "Paraíba", signups: 1120 },
  { uf: "PR", name: "Paraná", signups: 3980 },
  { uf: "PE", name: "Pernambuco", signups: 3120 },
  { uf: "PI", name: "Piauí", signups: 760 },
  { uf: "RJ", name: "Rio de Janeiro", signups: 6100 },
  { uf: "RN", name: "Rio Grande do Norte", signups: 1040 },
  { uf: "RS", name: "Rio Grande do Sul", signups: 3670 },
  { uf: "RO", name: "Rondônia", signups: 540 },
  { uf: "RR", name: "Roraima", signups: 180 },
  { uf: "SC", name: "Santa Catarina", signups: 2540 },
  { uf: "SP", name: "São Paulo", signups: 8420 },
  { uf: "SE", name: "Sergipe", signups: 690 },
  { uf: "TO", name: "Tocantins", signups: 430 },
];

const CITY: Record<string, string> = {
  "sao paulo": "SP",
  "rio de janeiro": "RJ",
  "belo horizonte": "MG",
  salvador: "BA",
  fortaleza: "CE",
  brasilia: "DF",
  curitiba: "PR",
  recife: "PE",
  "porto alegre": "RS",
  manaus: "AM",
  belem: "PA",
  goiania: "GO",
  campinas: "SP",
  santos: "SP",
  florianopolis: "SC",
  vitoria: "ES",
  natal: "RN",
  maceio: "AL",
  cuiaba: "MT",
  "campo grande": "MS",
  "joao pessoa": "PB",
  teresina: "PI",
  "sao luis": "MA",
  aracaju: "SE",
  palmas: "TO",
  "porto velho": "RO",
  "rio branco": "AC",
  macapa: "AP",
  "boa vista": "RR",
};

function plain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function ufFromCity(city: string, fallback = "SP") {
  const key = plain(city);
  const byCode = STATES.find((state) => state.uf.toLowerCase() === key);
  if (byCode) return byCode.uf;
  const byName = STATES.find((state) => plain(state.name) === key);
  if (byName) return byName.uf;
  return CITY[key] ?? fallback;
}

export function signupsOf(uf: string, bumps: Record<string, number>) {
  const base = STATES.find((state) => state.uf === uf)?.signups ?? 0;
  return base + (bumps[uf] ?? 0);
}

export function stateName(uf: string) {
  return STATES.find((state) => state.uf === uf)?.name ?? uf;
}

/** 50 sementes fixas por estado, só para o painel. Não são perfis no deck. */
export function seedsOf(uf: string) {
  return Array.from({ length: 50 }, (_, index) => {
    let hash = 0;
    const key = `${uf}-${index + 1}`;
    for (const char of key) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
    const invites = (hash % 16) + 2;
    const verified = hash % (invites + 1);
    return {
      id: key,
      name: `Semente ${String(index + 1).padStart(2, "0")}`,
      invites,
      verified,
      layer: ((hash >> 4) % 4) + 1,
    };
  });
}
