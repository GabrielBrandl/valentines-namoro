"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { idbGet, idbSet } from "./idb";
import { notifyChatReply, notifyMatch } from "./notify";
import { decorate, getPerson, PEOPLE, portrait, SEED_REELS } from "./seed";
import type {
  Comment,
  HistoryItem,
  Match,
  Me,
  Message,
  Prefs,
  Reel,
  ReelExtra,
} from "./types";

const STORAGE_KEY = "fecon-v1";

type Persisted = {
  v: 1;
  me: Me | null;
  prefs: Prefs;
  passes: string[];
  likes: string[];
  supers: string[];
  matches: Match[];
  messages: Message[];
  replyCursor: Record<string, number>;
  reelExtras: Record<string, ReelExtra>;
  myReels: Reel[];
  history: HistoryItem[];
  lastRead: Record<string, number>;
  following: string[];
  reportedReels: string[];
};

type State = Persisted & {
  ready: boolean;
  pendingMatchId: string | null;
  typingId: string | null;
};

const defaultPrefs: Prefs = {
  show: "todos",
  ageMin: 18,
  ageMax: 40,
  maxKm: 50,
  verifiedOnly: false,
};

const emptyPersist = (): Persisted => ({
  v: 1,
  me: null,
  prefs: defaultPrefs,
  passes: [],
  likes: [],
  supers: [],
  matches: [],
  messages: [],
  replyCursor: {},
  reelExtras: {},
  myReels: [],
  history: [],
  lastRead: {},
  following: [],
  reportedReels: [],
});

const initial: State = {
  ...emptyPersist(),
  ready: false,
  pendingMatchId: null,
  typingId: null,
};

type Store = State & {
  saveMe: (me: Me) => void;
  updateMe: (patch: Partial<Me>) => void;
  setPrefs: (prefs: Prefs) => void;
  pass: (id: string) => void;
  like: (id: string, superLike?: boolean) => void;
  undo: () => void;
  resetDeck: () => void;
  dismissMatch: () => void;
  sendMessage: (matchId: string, text: string, media?: string) => boolean;
  markRead: (matchId: string) => void;
  toggleLike: (reelId: string) => void;
  toggleFollow: (authorId: string) => void;
  reportReel: (reelId: string) => void;
  addComment: (reelId: string, text: string) => void;
  publishReel: (file: Blob, caption: string) => Promise<void>;
  deleteReel: (reelId: string) => void;
  resetAll: () => void;
  resolve: (src: string) => Promise<string>;
  deck: ReturnType<typeof PEOPLE.filter>;
  likesYou: ReturnType<typeof PEOPLE.filter>;
  reels: Reel[];
  unread: number;
};

const Ctx = createContext<Store | null>(null);

function persistOf(state: State): Persisted {
  return {
    v: 1,
    me: state.me,
    prefs: state.prefs,
    passes: state.passes,
    likes: state.likes,
    supers: state.supers,
    matches: state.matches,
    messages: state.messages,
    replyCursor: state.replyCursor,
    reelExtras: state.reelExtras,
    myReels: state.myReels,
    history: state.history,
    lastRead: state.lastRead,
    following: state.following,
    reportedReels: state.reportedReels,
  };
}

function writePersist(data: Persisted) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Quota / modo privado: a sessão fica só na memória desta aba.
  }
}

function mergeLoaded(parsed: Partial<Persisted>): Persisted {
  const base = emptyPersist();
  return {
    ...base,
    ...parsed,
    v: 1,
    prefs: { ...defaultPrefs, ...(parsed.prefs ?? {}) },
    following: Array.isArray(parsed.following) ? parsed.following : [],
    reportedReels: Array.isArray(parsed.reportedReels) ? parsed.reportedReels : [],
    passes: Array.isArray(parsed.passes) ? parsed.passes : [],
    likes: Array.isArray(parsed.likes) ? parsed.likes : [],
    supers: Array.isArray(parsed.supers) ? parsed.supers : [],
    matches: Array.isArray(parsed.matches) ? parsed.matches : [],
    messages: Array.isArray(parsed.messages) ? parsed.messages : [],
    replyCursor: parsed.replyCursor ?? {},
    reelExtras: parsed.reelExtras ?? {},
    myReels: Array.isArray(parsed.myReels) ? parsed.myReels : [],
    history: Array.isArray(parsed.history) ? parsed.history : [],
    lastRead: parsed.lastRead ?? {},
  };
}

function displayDistance(person: (typeof PEOPLE)[number], prefs: Prefs) {
  if (prefs.lat == null || prefs.lng == null) return person.distanceKm;
  // Demo: geolocalização ajusta levemente a distância exibida.
  const jitter = Math.abs(Math.round((prefs.lat * 10 + prefs.lng) % 7) - 3);
  return Math.max(1, person.distanceKm + jitter - 2);
}

export function FeconProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const stateRef = useRef(state);
  stateRef.current = state;
  const urls = useRef(new Map<string, string>());
  const replyTimers = useRef<Record<string, number>>({});
  const msgTimes = useRef<number[]>([]);
  const generation = useRef(0);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Persisted>;
        if (parsed?.v === 1 && parsed.me) {
          hydrated.current = true;
          setState((s) => ({
            ...s,
            ...mergeLoaded(parsed),
            ready: true,
          }));
          return;
        }
      }
    } catch {
      // ignora JSON inválido e segue como primeira visita
    }
    hydrated.current = true;
    setState((s) => ({ ...s, ready: true }));
  }, []);

  useEffect(() => {
    if (!state.ready || !hydrated.current) return;
    // Nunca grava perfil vazio por cima de uma sessão já salva (evita corrida no refresh).
    if (!state.me) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Persisted;
          if (parsed?.v === 1 && parsed.me) return;
        }
      } catch {
        // segue e grava o estado atual
      }
    }
    writePersist(persistOf(state));
  }, [state]);

  const resolve = useCallback(async (src: string) => {
    if (!src.startsWith("idb:")) return src;
    const cached = urls.current.get(src);
    if (cached) return cached;
    const blob = await idbGet(src.slice(4));
    if (!blob) return "";
    const url = URL.createObjectURL(blob);
    urls.current.set(src, url);
    return url;
  }, []);

  const queueReply = useCallback((matchId: string) => {
    const person = getPerson(matchId);
    if (!person) return;
    if (replyTimers.current[matchId]) return;
    const cursor = stateRef.current.replyCursor[matchId] ?? 0;
    if (cursor >= person.replies.length) return;
    const stamp = generation.current;
    setState((s) => ({ ...s, typingId: matchId }));
    replyTimers.current[matchId] = window.setTimeout(() => {
      delete replyTimers.current[matchId];
      if (generation.current !== stamp) return;
      const text = person.replies[cursor];
      setState((s) => {
        if (!s.matches.some((match) => match.id === matchId)) {
          return { ...s, typingId: s.typingId === matchId ? null : s.typingId };
        }
        return {
          ...s,
          typingId: s.typingId === matchId ? null : s.typingId,
          replyCursor: { ...s.replyCursor, [matchId]: Math.max(s.replyCursor[matchId] ?? 0, cursor + 1) },
          messages: [
            ...s.messages,
            {
              id: crypto.randomUUID(),
              matchId,
              from: "them",
              text,
              at: Date.now(),
            },
          ],
        };
      });
      notifyChatReply(person.name, text);
    }, 900 + Math.round(Math.random() * 800));
  }, []);

  const saveMe = useCallback((me: Me) => {
    setState((s) => {
      const next = { ...s, me };
      writePersist(persistOf(next));
      return next;
    });
  }, []);

  const updateMe = useCallback((patch: Partial<Me>) => {
    setState((s) => {
      if (!s.me) return s;
      const next = { ...s, me: { ...s.me, ...patch } };
      writePersist(persistOf(next));
      return next;
    });
  }, []);

  const setPrefs = useCallback((prefs: Prefs) => {
    setState((s) => {
      const next = { ...s, prefs };
      if (next.me) writePersist(persistOf(next));
      return next;
    });
  }, []);

  const pass = useCallback((id: string) => {
    if (stateRef.current.passes.includes(id) || stateRef.current.likes.includes(id)) return;
    setState((s) => {
      if (s.passes.includes(id) || s.likes.includes(id)) return s;
      return {
        ...s,
        passes: [...s.passes, id],
        history: [...s.history, { id, action: "pass" as const, matched: false } satisfies HistoryItem].slice(-12),
      };
    });
  }, []);

  const like = useCallback((id: string, superLike = false) => {
    if (stateRef.current.likes.includes(id) || stateRef.current.passes.includes(id)) return;
    setState((s) => {
      if (s.likes.includes(id) || s.passes.includes(id)) return s;
      const person = getPerson(id);
      const matched = Boolean(person?.likesYou);
      const next: State = {
        ...s,
        likes: [...s.likes, id],
        supers: superLike ? [...s.supers, id] : s.supers,
        matches: matched
          ? [{ id, at: Date.now(), super: superLike }, ...s.matches.filter((m) => m.id !== id)]
          : s.matches,
        history: [
          ...s.history,
          {
            id,
            action: (superLike ? "super" : "like") as HistoryItem["action"],
            matched,
          },
        ].slice(-12),
        pendingMatchId: matched ? id : s.pendingMatchId,
        // NÃO marca lastRead — o match fica não lido até abrir o chat.
      };
      return next;
    });
    const person = getPerson(id);
    if (person?.likesYou) {
      window.setTimeout(() => notifyMatch(person.name), 400);
    }
    if (superLike) {
      if (person?.likesYou) {
        const stamp = generation.current;
        window.setTimeout(() => {
          if (generation.current !== stamp) return;
          setState((s) => {
            if (!s.matches.some((match) => match.id === id)) return s;
            if (s.messages.some((message) => message.matchId === id)) return s;
            return {
              ...s,
              messages: [
                ...s.messages,
                {
                  id: crypto.randomUUID(),
                  matchId: id,
                  from: "them",
                  text: person.opener,
                  at: Date.now(),
                },
              ],
            };
          });
        }, 1400);
      }
    }
  }, []);

  const undo = useCallback(() => {
    setState((s) => {
      const last = s.history[s.history.length - 1];
      if (!last) return s;
      const hasMessages = s.messages.some((m) => m.matchId === last.id);
      return {
        ...s,
        history: s.history.slice(0, -1),
        likes: s.likes.filter((id) => id !== last.id),
        passes: s.passes.filter((id) => id !== last.id),
        supers: s.supers.filter((id) => id !== last.id),
        matches:
          last.matched && !hasMessages ? s.matches.filter((m) => m.id !== last.id) : s.matches,
        pendingMatchId: s.pendingMatchId === last.id ? null : s.pendingMatchId,
      };
    });
  }, []);

  const resetDeck = useCallback(() => {
    setState((s) => {
      const kept = new Set(s.matches.map((m) => m.id));
      return {
        ...s,
        passes: [],
        likes: s.likes.filter((id) => kept.has(id)),
        history: [],
      };
    });
  }, []);

  const dismissMatch = useCallback(() => {
    setState((s) => ({ ...s, pendingMatchId: null }));
  }, []);

  const sendMessage = useCallback(
    (matchId: string, text: string, media?: string) => {
      const clean = text.trim();
      if (!clean && !media) return false;
      const now = Date.now();
      msgTimes.current = msgTimes.current.filter((t) => now - t < 20000);
      if (msgTimes.current.length >= 8) return false;
      msgTimes.current.push(now);
      setState((s) => ({
        ...s,
        messages: [
          ...s.messages,
          {
            id: crypto.randomUUID(),
            matchId,
            from: "me",
            text: clean || (media ? "📷 Foto" : ""),
            at: now,
            media,
          },
        ],
      }));
      queueReply(matchId);
      return true;
    },
    [queueReply],
  );

  const markRead = useCallback((matchId: string) => {
    setState((s) => ({ ...s, lastRead: { ...s.lastRead, [matchId]: Date.now() } }));
  }, []);

  const toggleLike = useCallback((reelId: string) => {
    setState((s) => {
      if (s.myReels.some((reel) => reel.id === reelId)) {
        return {
          ...s,
          myReels: s.myReels.map((reel) =>
            reel.id === reelId
              ? { ...reel, liked: !reel.liked, likes: reel.likes + (reel.liked ? -1 : 1) }
              : reel,
          ),
        };
      }
      const liked = !s.reelExtras[reelId]?.liked;
      return {
        ...s,
        reelExtras: {
          ...s.reelExtras,
          [reelId]: { ...s.reelExtras[reelId], liked },
        },
      };
    });
  }, []);

  const toggleFollow = useCallback((authorId: string) => {
    if (!authorId || authorId === "me") return;
    setState((s) => {
      const on = s.following.includes(authorId);
      return {
        ...s,
        following: on ? s.following.filter((id) => id !== authorId) : [...s.following, authorId],
      };
    });
  }, []);

  const reportReel = useCallback((reelId: string) => {
    setState((s) => ({
      ...s,
      reportedReels: s.reportedReels.includes(reelId)
        ? s.reportedReels
        : [...s.reportedReels, reelId],
    }));
  }, []);

  const addComment = useCallback((reelId: string, text: string) => {
    const clean = text.trim();
    if (!clean) return;
    const comment: Comment = {
      id: crypto.randomUUID(),
      author: stateRef.current.me?.name || "Você",
      text: clean,
      at: Date.now(),
    };
    setState((s) => {
      if (s.myReels.some((reel) => reel.id === reelId)) {
        return {
          ...s,
          myReels: s.myReels.map((reel) =>
            reel.id === reelId ? { ...reel, comments: [...reel.comments, comment] } : reel,
          ),
        };
      }
      const prev = s.reelExtras[reelId]?.comments ?? [];
      return {
        ...s,
        reelExtras: {
          ...s.reelExtras,
          [reelId]: { ...s.reelExtras[reelId], comments: [...prev, comment] },
        },
      };
    });
  }, []);

  const publishReel = useCallback(async (file: Blob, caption: string) => {
    const id = crypto.randomUUID();
    await idbSet(`reel-${id}`, file);
    const me = stateRef.current.me;
    const reel: Reel = {
      id,
      authorId: "me",
      caption: caption.trim() || "Novo reel",
      media: `idb:reel-${id}`,
      poster: me?.photos[0] || portrait(me?.name || "Você"),
      likes: 0,
      liked: false,
      comments: [],
      at: Date.now(),
      mine: true,
    };
    setState((s) => ({ ...s, myReels: [reel, ...s.myReels] }));
  }, []);

  const deleteReel = useCallback((reelId: string) => {
    setState((s) => ({ ...s, myReels: s.myReels.filter((reel) => reel.id !== reelId) }));
  }, []);

  const resetAll = useCallback(() => {
    generation.current += 1;
    for (const timer of Object.values(replyTimers.current)) window.clearTimeout(timer);
    replyTimers.current = {};
    msgTimes.current = [];
    localStorage.removeItem(STORAGE_KEY);
    setState({ ...emptyPersist(), ready: true, pendingMatchId: null, typingId: null });
  }, []);

  const deck = useMemo(() => {
    const { prefs, passes, likes } = state;
    const list = PEOPLE.filter((person) => {
      if (passes.includes(person.id) || likes.includes(person.id)) return false;
      if (person.sponsored) return true;
      if (person.age < prefs.ageMin || person.age > prefs.ageMax) return false;
      if (prefs.show !== "todos" && person.gender !== prefs.show) return false;
      const km = displayDistance(person, prefs);
      if (km > (prefs.maxKm ?? 50)) return false;
      const decorated = decorate(person);
      if (prefs.verifiedOnly && !decorated.verified) return false;
      return true;
    }).map((person) => {
      const decorated = decorate(person);
      return { ...decorated, distanceKm: displayDistance(person, prefs) };
    });
    const ads = list.filter((person) => person.sponsored);
    const people = list.filter((person) => !person.sponsored);
    if (ads[0]) people.splice(Math.min(3, people.length), 0, ads[0]);
    return people;
  }, [state]);

  const likesYou = useMemo(
    () =>
      PEOPLE.filter(
        (person) =>
          person.likesYou && !state.likes.includes(person.id) && !state.passes.includes(person.id),
      ).map(decorate),
    [state.likes, state.passes],
  );

  const reels = useMemo(() => {
    const seeded = SEED_REELS.map((reel) => {
      const extra = state.reelExtras[reel.id];
      return {
        ...reel,
        liked: Boolean(extra?.liked),
        likes: reel.likes + (extra?.liked ? 1 : 0),
        comments: [...reel.comments, ...(extra?.comments ?? [])],
      };
    });
    return [...state.myReels, ...seeded]
      .filter((reel) => !state.reportedReels.includes(reel.id))
      .sort((a, b) => b.at - a.at);
  }, [state.myReels, state.reelExtras, state.reportedReels]);

  const unread = useMemo(() => {
    const msgUnread = state.messages.filter(
      (message) =>
        message.from === "them" && message.at > (state.lastRead[message.matchId] ?? 0),
    ).length;
    const matchUnread = state.matches.filter((match) => {
      const readAt = state.lastRead[match.id] ?? 0;
      if (readAt >= match.at) return false;
      const hasThemMsg = state.messages.some(
        (m) => m.matchId === match.id && m.from === "them" && m.at > readAt,
      );
      // Conta match novo sem mensagem lida (evita duplicar se já há msg não lida).
      return !hasThemMsg;
    }).length;
    return msgUnread + matchUnread;
  }, [state.messages, state.lastRead, state.matches]);

  const value: Store = {
    ...state,
    saveMe,
    updateMe,
    setPrefs,
    pass,
    like,
    undo,
    resetDeck,
    dismissMatch,
    sendMessage,
    markRead,
    toggleLike,
    toggleFollow,
    reportReel,
    addComment,
    publishReel,
    deleteReel,
    resetAll,
    resolve,
    deck,
    likesYou,
    reels,
    unread,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFecon() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFecon fora do provider");
  return ctx;
}
