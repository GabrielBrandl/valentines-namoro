"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Splash } from "@/components/Splash";
import { FOUNDER_CENTS, GIFT_LABEL, INVITE_DAILY_CAP, PERKS, REWARD_CAP, REWARD_CREDITS, SHOP, type Grant, type PlanId } from "./catalog";

export type VerificationStatus = "nao_verificado" | "em_analise" | "verificado";
export type AgeSignal = "nenhum" | "loja" | "documento";
export type ReservedMode = "off" | "basico" | "plus";
export type PhotoVisibility = "todos" | "matches" | "ninguem";

export type Report = {
  id: string;
  targetId: string;
  targetName: string;
  reason: string;
  note: string;
  at: number;
  status: "aberto" | "encerrado";
};

export type Ticket = {
  id: string;
  subject: string;
  body: string;
  at: number;
  status: "aberto" | "respondido";
  reply: string;
};

export type InviteRow = {
  id: string;
  name: string;
  at: number;
  layer: 1 | 2 | 3 | 4;
  verified: boolean;
  days: number;
  rewarded: boolean;
};

export type ProductState = {
  verification: VerificationStatus;
  verifiedAt: number | null;
  consentAt: number | null;
  phone: string;
  captchaOk: boolean;
  smsOk: boolean;
  ageSignal: AgeSignal;
  termsAt: number | null;
  createdAt: number;
  origin: string | null;
  plan: PlanId | null;
  annual: boolean;
  founder: boolean;
  planUntil: number;
  credits: number;
  superPack: number;
  undoPack: number;
  superUsed: number;
  undoUsed: number;
  grantDay: string;
  seeLikesUntil: number;
  unlimitedUntil: number;
  boostUntil: number;
  priorityLeft: number;
  cityOverride: string;
  cityUntil: number;
  reserved: ReservedMode;
  reservedTier: "basico" | "plus" | null;
  reservedUntil: number;
  photoVisibility: PhotoVisibility;
  adsUntil: number;
  inviteBoostUntil: number;
  highlightTokens: number;
  highlights: { reelId: string; until: number }[];
  tipTokens: number;
  tips: { reelId: string; at: number; amount: number }[];
  gifts: Record<string, number>;
  pinTokens: number;
  pins: string[];
  reports: Report[];
  hidden: string[];
  tickets: Ticket[];
  sentGifts: { id: string; to: string; kind: string; at: number }[];
  inviteCode: string;
  invitedBy: string | null;
  layer: number;
  invites: InviteRow[];
  rewards: { id: string; label: string; at: number }[];
  inviteDay: string;
  invitesToday: number;
  events: { name: string; at: number }[];
  days: string[];
  polls: Record<string, string>;
  coupons: string[];
  reverify: boolean;
  uf: string;
  bumps: Record<string, number>;
  ledger: { id: string; label: string; at: number; credits: number }[];
};

const KEY = "valentine-product-v1";
const ACCOUNT = "valentine-account";
const DEVICE = "valentine-device";
const DAY = 86400000;

export const VERIFY_LABEL: Record<VerificationStatus, string> = {
  nao_verificado: "Não verificado",
  em_analise: "Em análise",
  verificado: "Verificado",
};

export const SMS_CODE = "739184";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function deviceId() {
  const existing = localStorage.getItem(DEVICE);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(DEVICE, id);
  return id;
}

function codeFrom(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return `VD${hash.toString(36).toUpperCase().slice(0, 6)}`;
}

export function emptyProduct(): ProductState {
  const day = today();
  return {
    verification: "nao_verificado",
    verifiedAt: null,
    consentAt: null,
    phone: "",
    captchaOk: false,
    smsOk: false,
    ageSignal: "nenhum",
    termsAt: null,
    createdAt: Date.now(),
    origin: null,
    plan: null,
    annual: false,
    founder: false,
    planUntil: 0,
    credits: 0,
    superPack: 0,
    undoPack: 0,
    superUsed: 0,
    undoUsed: 0,
    grantDay: day,
    seeLikesUntil: 0,
    unlimitedUntil: 0,
    boostUntil: 0,
    priorityLeft: 0,
    cityOverride: "",
    cityUntil: 0,
    reserved: "off",
    reservedTier: null,
    reservedUntil: 0,
    photoVisibility: "todos",
    adsUntil: 0,
    inviteBoostUntil: 0,
    highlightTokens: 0,
    highlights: [],
    tipTokens: 0,
    tips: [],
    gifts: {},
    pinTokens: 0,
    pins: [],
    reports: [],
    hidden: [],
    tickets: [],
    sentGifts: [],
    inviteCode: "",
    invitedBy: null,
    layer: 0,
    invites: [],
    rewards: [],
    inviteDay: day,
    invitesToday: 0,
    events: [],
    days: [day],
    polls: {},
    coupons: [],
    reverify: false,
    uf: "SP",
    bumps: {},
    ledger: [],
  };
}

function roll(state: ProductState): ProductState {
  const day = today();
  if (state.grantDay === day && state.inviteDay === day) return state;
  return {
    ...state,
    grantDay: day,
    superUsed: state.grantDay === day ? state.superUsed : 0,
    undoUsed: state.grantDay === day ? state.undoUsed : 0,
    inviteDay: day,
    invitesToday: state.inviteDay === day ? state.invitesToday : 0,
  };
}

function touch(state: ProductState): ProductState {
  const day = today();
  if (state.days.includes(day)) return state;
  return { ...state, days: [...state.days, day].slice(-60) };
}

export function activePerks(state: ProductState) {
  if (!state.plan || state.planUntil <= Date.now()) return null;
  return PERKS[state.plan];
}

function allowance(state: ProductState, kind: "super" | "undo") {
  if (state.unlimitedUntil > Date.now()) return 99;
  const perks = activePerks(state);
  const daily = perks ? (kind === "super" ? perks.superDaily : perks.undoDaily) : 0;
  const used = kind === "super" ? state.superUsed : state.undoUsed;
  const pack = kind === "super" ? state.superPack : state.undoPack;
  return Math.max(0, daily - used) + pack;
}

function spend(state: ProductState, kind: "super" | "undo"): ProductState {
  if (state.unlimitedUntil > Date.now()) return state;
  const perks = activePerks(state);
  const daily = perks ? (kind === "super" ? perks.superDaily : perks.undoDaily) : 0;
  const used = kind === "super" ? state.superUsed : state.undoUsed;
  if (used < daily) {
    return kind === "super" ? { ...state, superUsed: used + 1 } : { ...state, undoUsed: used + 1 };
  }
  return kind === "super" ? { ...state, superPack: Math.max(0, state.superPack - 1) } : { ...state, undoPack: Math.max(0, state.undoPack - 1) };
}

function bumpSignal(current: AgeSignal, next: AgeSignal): AgeSignal {
  const rank = { nenhum: 0, loja: 1, documento: 2 };
  return rank[next] > rank[current] ? next : current;
}

export function applyGrant(state: ProductState, grant: Grant, extra?: { reelId?: string; city?: string }): ProductState {
  const now = Date.now();
  switch (grant.type) {
    case "super":
      return { ...state, superPack: state.superPack + grant.n };
    case "undo":
      return { ...state, undoPack: state.undoPack + grant.n };
    case "likes":
      return { ...state, seeLikesUntil: Math.max(state.seeLikesUntil, now) + grant.days * DAY };
    case "unlimited":
      return { ...state, unlimitedUntil: Math.max(state.unlimitedUntil, now) + grant.hours * 3600000 };
    case "boost":
      return { ...state, boostUntil: Math.max(state.boostUntil, now) + grant.minutes * 60000 };
    case "priority":
      return { ...state, priorityLeft: state.priorityLeft + grant.n };
    case "city":
      return {
        ...state,
        cityUntil: Math.max(state.cityUntil, now) + grant.days * DAY,
        cityOverride: extra?.city || state.cityOverride,
      };
    case "reserved": {
      const tier =
        state.reservedTier === "plus" || grant.mode === "plus"
          ? "plus"
          : grant.mode;
      return {
        ...state,
        reserved: grant.mode,
        reservedTier: tier,
        reservedUntil: Math.max(state.reservedUntil, now) + grant.days * DAY,
      };
    }
    case "ads":
      return { ...state, adsUntil: Math.max(state.adsUntil, now) + grant.days * DAY };
    case "credits":
      return {
        ...state,
        credits: state.credits + grant.n,
        ledger: [{ id: crypto.randomUUID(), label: `+${grant.n} créditos`, at: now, credits: grant.n }, ...state.ledger].slice(0, 40),
      };
    case "gift":
      return { ...state, gifts: { ...state.gifts, [grant.id]: (state.gifts[grant.id] ?? 0) + grant.n } };
    case "highlight":
      if (extra?.reelId) {
        return {
          ...state,
          highlights: [
            ...state.highlights.filter((item) => item.reelId !== extra.reelId),
            { reelId: extra.reelId, until: now + DAY },
          ],
        };
      }
      return { ...state, highlightTokens: state.highlightTokens + 1 };
    case "inviteBoost":
      return { ...state, inviteBoostUntil: Math.max(state.inviteBoostUntil, now) + grant.hours * 3600000 };
    case "pin":
      return { ...state, pinTokens: state.pinTokens + grant.n };
    case "tip":
      if (extra?.reelId) {
        return { ...state, tips: [{ reelId: extra.reelId, at: now, amount: 690 }, ...state.tips].slice(0, 40) };
      }
      return { ...state, tipTokens: state.tipTokens + 1 };
    case "passport":
      return {
        ...state,
        boostUntil: Math.max(state.boostUntil, now) + 3 * 3600000,
        cityUntil: Math.max(state.cityUntil, now) + 2 * DAY,
        cityOverride: extra?.city || state.cityOverride,
      };
  }
}

function withEvent(state: ProductState, name: string): ProductState {
  return { ...state, events: [{ name, at: Date.now() }, ...state.events].slice(0, 200) };
}

type Extra = { reelId?: string; city?: string };

type ProductApi = {
  state: ProductState;
  showAds: boolean;
  canSeeLikes: boolean;
  superLeft: number;
  undoLeft: number;
  planName: string | null;
  consume: (kind: "super" | "undo") => boolean;
  purchase: (id: string, extra?: Extra) => void;
  buyPlan: (id: PlanId, annual: boolean, founder: boolean) => void;
  founderCents: number;
  claim: (phone: string) => string | null;
  bootstrap: (uf: string) => void;
  activate: (input: { phone: string; uf: string; signal: AgeSignal }) => void;
  acceptTerms: () => void;
  passCaptcha: () => void;
  confirmSms: (phone: string) => void;
  setAgeSignal: (signal: AgeSignal) => void;
  giveConsent: () => void;
  submitReview: () => string | null;
  setVerification: (status: VerificationStatus) => void;
  markReverify: () => void;
  report: (targetId: string, targetName: string, reason: string, note: string) => void;
  closeReport: (id: string, restore: boolean) => void;
  openTicket: (subject: string, body: string) => void;
  replyTicket: (id: string, reply: string) => void;
  setReserved: (mode: ReservedMode) => string | null;
  canReserved: (mode: ReservedMode) => boolean;
  setPhotoVisibility: (value: PhotoVisibility) => void;
  setCity: (city: string) => void;
  cityName: (fallback: string) => string;
  setUf: (uf: string) => void;
  addInvite: (name: string) => string | null;
  validateInvite: (id: string) => string;
  sendGift: (to: string, giftId: string) => string | null;
  usePriority: () => boolean;
  usePin: (matchId: string) => boolean;
  useHighlight: (reelId: string) => boolean;
  useTip: (reelId: string) => boolean;
  highlighted: (reelId: string) => boolean;
  vote: (id: string, option: string) => void;
  saveCoupon: (code: string) => void;
  track: (name: string) => void;
  wipe: () => void;
  exportData: () => void;
};

const Ctx = createContext<ProductApi | null>(null);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProductState | null>(null);
  const ref = useRef<ProductState | null>(null);
  ref.current = state;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = localStorage.getItem(KEY);
    let next = emptyProduct();
    if (raw) {
      try {
        next = { ...emptyProduct(), ...JSON.parse(raw) };
      } catch {
        next = emptyProduct();
      }
    }
    if (!next.inviteCode) next.inviteCode = codeFrom(deviceId());
    next = touch(roll(next));
    const origin = params.get("origem");
    const convite = params.get("convite");
    if (origin && !next.origin) next = { ...next, origin: origin.slice(0, 40) };
    if (convite && convite === next.inviteCode && !next.events.some((event) => event.name === "auto-convite bloqueado")) {
      next = withEvent(next, "auto-convite bloqueado");
    } else if (convite && convite !== next.inviteCode && !next.invitedBy) {
      const layer = Number(params.get("camada") || "1");
      next = {
        ...next,
        invitedBy: convite.slice(0, 24),
        layer: Math.min(4, Math.max(1, Number.isFinite(layer) ? layer : 1)),
      };
    }
    setState(next);
  }, []);

  useEffect(() => {
    if (!state) return;
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const api = useMemo<ProductApi | null>(() => {
    if (!state) return null;
    const commit = (next: ProductState) => {
      ref.current = next;
      setState(next);
    };
    const current = () => ref.current ?? state;

    return {
      state,
      showAds: !activePerks(state)?.noAds && state.adsUntil <= Date.now(),
      canSeeLikes: Boolean(activePerks(state)?.seeLikes) || state.seeLikesUntil > Date.now() || state.unlimitedUntil > Date.now(),
      superLeft: allowance(state, "super"),
      undoLeft: allowance(state, "undo"),
      planName: activePerks(state) ? state.plan : null,
      founderCents: FOUNDER_CENTS,
      consume(kind) {
        const now = roll(current());
        if (allowance(now, kind) < 1) return false;
        commit(spend(now, kind));
        return true;
      },
      purchase(id, extra) {
        const item = SHOP.find((entry) => entry.id === id);
        if (!item) return;
        const granted = applyGrant(current(), item.grant, extra);
        const withReceipt: ProductState = {
          ...granted,
          ledger: [
            {
              id: crypto.randomUUID(),
              label: `Compra: ${item.name}`,
              at: Date.now(),
              credits: item.grant.type === "credits" ? item.grant.n : 0,
            },
            ...granted.ledger,
          ].slice(0, 40),
        };
        commit(withEvent(withReceipt, `compra:${item.id}`));
      },
      buyPlan(id, annual, founder) {
        const now = Date.now();
        const perks = PERKS[id];
        const next: ProductState = {
          ...current(),
          plan: id,
          annual,
          founder: founder || current().founder,
          planUntil: Math.max(current().planUntil, now) + (annual ? 365 : 30) * DAY,
          priorityLeft: current().priorityLeft + perks.priority,
          superUsed: 0,
          undoUsed: 0,
          ledger: [
            {
              id: crypto.randomUUID(),
              label: `Plano ${id}${annual ? " anual" : ""}`,
              at: now,
              credits: 0,
            },
            ...current().ledger,
          ].slice(0, 40),
        };
        if (id === "gold" || id === "platinum" || id === "black") {
          next.cityUntil = Math.max(next.cityUntil, now + 7 * DAY);
        }
        if (perks.noAds) next.adsUntil = Math.max(next.adsUntil, next.planUntil);
        if (perks.reserved) next.reservedTier = "plus";
        commit(withEvent(next, `plano:${id}`));
      },
      claim(phone) {
        // Demo: sem bloqueio por aparelho — só registra o telefone usado.
        const digits = phone.replace(/\D/g, "");
        if (digits) localStorage.setItem(ACCOUNT, digits);
        return null;
      },
      bootstrap(uf) {
        const now = Date.now();
        const base = current();
        commit(
          withEvent(
            {
              ...base,
              phone: "11900000000",
              captchaOk: true,
              smsOk: true,
              termsAt: now,
              ageSignal: "loja",
              verification: "em_analise",
              uf,
              bumps: { ...base.bumps, [uf]: (base.bumps[uf] ?? 0) + (base.events.some((event) => event.name === "ativacao") ? 0 : 1) },
            },
            "ativacao",
          ),
        );
      },
      activate(input) {
        const base = current();
        const already = base.events.some((event) => event.name === "ativacao");
        commit(
          withEvent(
            {
              ...base,
              phone: input.phone.replace(/\D/g, ""),
              captchaOk: true,
              smsOk: true,
              termsAt: base.termsAt ?? Date.now(),
              ageSignal: bumpSignal(base.ageSignal, input.signal),
              uf: input.uf,
              createdAt: base.createdAt || Date.now(),
              bumps: already ? base.bumps : { ...base.bumps, [input.uf]: (base.bumps[input.uf] ?? 0) + 1 },
            },
            "ativacao",
          ),
        );
      },
      acceptTerms() {
        commit({ ...current(), termsAt: Date.now() });
      },
      passCaptcha() {
        commit({ ...current(), captchaOk: true });
      },
      confirmSms(phone) {
        commit({ ...current(), smsOk: true, phone: phone.replace(/\D/g, "") });
      },
      setAgeSignal(signal) {
        const base = current();
        commit({ ...base, ageSignal: bumpSignal(base.ageSignal, signal) });
      },
      giveConsent() {
        commit({ ...current(), consentAt: Date.now() });
      },
      submitReview() {
        const base = current();
        if (!base.consentAt) return "Antes, aceite o uso do dado biométrico.";
        if (!base.captchaOk || !base.smsOk) return "Falta a checagem de idade do cadastro.";
        commit({ ...base, verification: "em_analise", reverify: false });
        return null;
      },
      setVerification(status) {
        commit({
          ...current(),
          verification: status,
          verifiedAt: status === "verificado" ? Date.now() : current().verifiedAt,
          reverify: false,
        });
      },
      markReverify() {
        commit({ ...current(), reverify: true });
      },
      report(targetId, targetName, reason, note) {
        const base = current();
        const item: Report = {
          id: crypto.randomUUID(),
          targetId,
          targetName,
          reason,
          note: note.slice(0, 280),
          at: Date.now(),
          status: "aberto",
        };
        commit(
          withEvent(
            {
              ...base,
              reports: [item, ...base.reports],
              hidden: base.hidden.includes(targetId) ? base.hidden : [...base.hidden, targetId],
            },
            "denuncia",
          ),
        );
      },
      closeReport(id, restore) {
        const base = current();
        const report = base.reports.find((item) => item.id === id);
        commit({
          ...base,
          reports: base.reports.map((item) => (item.id === id ? { ...item, status: "encerrado" } : item)),
          hidden: restore && report ? base.hidden.filter((item) => item !== report.targetId) : base.hidden,
        });
      },
      openTicket(subject, body) {
        const base = current();
        const item: Ticket = {
          id: crypto.randomUUID(),
          subject: subject.slice(0, 80),
          body: body.slice(0, 500),
          at: Date.now(),
          status: "aberto",
          reply: "",
        };
        commit(withEvent({ ...base, tickets: [item, ...base.tickets] }, "suporte"));
      },
      replyTicket(id, reply) {
        commit({
          ...current(),
          tickets: current().tickets.map((item) =>
            item.id === id ? { ...item, status: "respondido", reply: reply.slice(0, 400) } : item,
          ),
        });
      },
      canReserved(mode) {
        if (mode === "off") return true;
        const base = current();
        if (activePerks(base)?.reserved) return true;
        if (base.reservedUntil <= Date.now()) return false;
        if (mode === "basico") return true;
        return base.reservedTier === "plus";
      },
      setReserved(mode) {
        const base = current();
        if (mode !== "off" && !thisCan(base, mode)) {
          return "O modo reservado entra com o plano Platinum, Black ou com a compra avulsa.";
        }
        commit({ ...base, reserved: mode });
        return null;
      },
      setPhotoVisibility(value) {
        commit({ ...current(), photoVisibility: value });
      },
      setCity(city) {
        const base = current();
        if (base.cityUntil <= Date.now() && !["gold", "platinum", "black"].includes(activePerks(base) ? base.plan ?? "" : "")) {
          return;
        }
        commit({ ...base, cityOverride: city.slice(0, 40) });
      },
      cityName(fallback) {
        const base = current();
        if (base.cityUntil > Date.now() && base.cityOverride.trim()) return base.cityOverride.trim();
        return fallback;
      },
      setUf(uf) {
        commit({ ...current(), uf });
      },
      addInvite(name) {
        const base = roll(current());
        const clean = name.trim();
        if (clean.length < 2) return "Diga o nome de quem você convidou.";
        if (base.layer >= 4) return "Quem está na quarta camada não abre convite novo.";
        if (base.invitesToday >= INVITE_DAILY_CAP) return "Limite de 10 convites por dia neste aparelho.";
        if (base.invites.some((row) => row.name.toLowerCase() === clean.toLowerCase())) {
          return "Esse nome já está na sua rede.";
        }
        const row: InviteRow = {
          id: crypto.randomUUID(),
          name: clean,
          at: Date.now(),
          layer: Math.min(4, base.layer + 1) as 1 | 2 | 3 | 4,
          verified: false,
          days: 0,
          rewarded: false,
        };
        commit({ ...base, invitesToday: base.invitesToday + 1, invites: [row, ...base.invites] });
        return null;
      },
      validateInvite(id) {
        const base = current();
        const row = base.invites.find((item) => item.id === id);
        if (!row) return "Convite não encontrado.";
        let next = {
          ...base,
          invites: base.invites.map((item) => (item.id === id ? { ...item, verified: true, days: 3 } : item)),
        };
        if (row.rewarded) {
          commit(next);
          return "Esse convite já estava válido.";
        }
        if (base.rewards.length >= REWARD_CAP) {
          commit(next);
          return "Convite válido. O teto de 20 recompensas desta conta já foi atingido.";
        }
        const credits = base.inviteBoostUntil > Date.now() ? REWARD_CREDITS * 2 : REWARD_CREDITS;
        next = {
          ...next,
          invites: next.invites.map((item) => (item.id === id ? { ...item, rewarded: true } : item)),
          credits: next.credits + credits,
          rewards: [{ id: crypto.randomUUID(), label: `${row.name} · ${credits} créditos`, at: Date.now() }, ...next.rewards],
          ledger: [{ id: crypto.randomUUID(), label: `Convite de ${row.name}`, at: Date.now(), credits }, ...next.ledger].slice(0, 40),
        };
        commit(next);
        return `${credits} créditos entraram na carteira.`;
      },
      sendGift(to, giftId) {
        const base = current();
        if ((base.gifts[giftId] ?? 0) < 1) return null;
        commit({
          ...base,
          gifts: { ...base.gifts, [giftId]: base.gifts[giftId] - 1 },
          sentGifts: [{ id: crypto.randomUUID(), to, kind: giftId, at: Date.now() }, ...base.sentGifts].slice(0, 40),
        });
        return `Presente: ${GIFT_LABEL[giftId] ?? giftId}`;
      },
      usePriority() {
        const base = current();
        if (base.priorityLeft < 1) return false;
        commit({ ...base, priorityLeft: base.priorityLeft - 1 });
        return true;
      },
      usePin(matchId) {
        const base = current();
        if (base.pins.includes(matchId)) return true;
        if (base.pinTokens < 1) return false;
        commit({ ...base, pinTokens: base.pinTokens - 1, pins: [matchId, ...base.pins] });
        return true;
      },
      useHighlight(reelId) {
        const base = current();
        if (base.highlightTokens < 1) return false;
        commit({
          ...base,
          highlightTokens: base.highlightTokens - 1,
          highlights: [...base.highlights.filter((item) => item.reelId !== reelId), { reelId, until: Date.now() + DAY }],
        });
        return true;
      },
      useTip(reelId) {
        const base = current();
        if (base.tipTokens < 1) return false;
        commit({
          ...base,
          tipTokens: base.tipTokens - 1,
          tips: [{ reelId, at: Date.now(), amount: 690 }, ...base.tips].slice(0, 40),
        });
        return true;
      },
      highlighted(reelId) {
        return current().highlights.some((item) => item.reelId === reelId && item.until > Date.now());
      },
      vote(id, option) {
        const base = current();
        commit({ ...base, polls: { ...base.polls, [id]: option } });
      },
      saveCoupon(code) {
        const base = current();
        if (base.coupons.includes(code)) return;
        commit({ ...base, coupons: [...base.coupons, code] });
      },
      track(name) {
        const base = current();
        if (base.events[0]?.name === name && Date.now() - base.events[0].at < 400) return;
        commit(withEvent(base, name));
      },
      wipe() {
        localStorage.removeItem(KEY);
        localStorage.removeItem(ACCOUNT);
        const fresh = emptyProduct();
        fresh.inviteCode = codeFrom(deviceId());
        commit(fresh);
      },
      exportData() {
        const payload = {
          perfil: localStorage.getItem("fecon-v1"),
          produto: localStorage.getItem(KEY),
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "meus-dados-valentine.json";
        link.click();
        URL.revokeObjectURL(link.href);
      },
    };
  }, [state]);

  if (!api) {
    return <Splash />;
  }

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

function thisCan(state: ProductState, mode: ReservedMode) {
  if (mode === "off") return true;
  if (activePerks(state)?.reserved) return true;
  if (state.reservedUntil <= Date.now()) return false;
  if (mode === "basico") return true;
  return state.reservedTier === "plus";
}

export function useProduct() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProduct fora do provider");
  return ctx;
}
