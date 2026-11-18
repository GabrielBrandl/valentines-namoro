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
import {
  getSessionUser,
  loadCloudReels,
  loadCloudState,
  loadDiscoverProfiles,
  publishCloudReel,
  recordSwipe,
  saveCloudState,
  uploadMedia,
  upsertProfile,
  type CloudPersisted,
} from "./cloud";
import { idbGet, idbSet } from "./idb";
import { notifyChatReply, notifyMatch } from "./notify";
import {
  decorate,
  getLivePeople,
  getPerson,
  PEOPLE,
  portrait,
  setLivePeople,
  SEED_REELS,
} from "./seed";
import type { Person } from "./types";
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
  liveReady: boolean;
  cloudReels: Reel[];
};

const defaultPrefs: Prefs = {
  show: "todos",
  ageMin: 18,
  ageMax: 40,
  maxKm: 50,
  verifiedOnly: false,
  city: "",
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
  liveReady: false,
  cloudReels: [],
};

function profileToPerson(row: {
  id: string;
  name: string;
  age: number;
  city: string;
  job: string;
  bio: string;
  gender: "mulher" | "homem";
  interests: string[];
  photos: string[];
}): Person {
  const photos = row.photos.length ? row.photos : [portrait(row.name)];
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    city: row.city,
    job: row.job || "Em descoberta",
    bio: row.bio || "Acabei de chegar no Valentine's.",
    gender: row.gender,
    interests: row.interests.length ? row.interests : ["Música"],
    photos,
    distanceKm: 2 + (row.name.length % 20),
    likesYou: false,
    online: true,
    prompts: [{ q: "Sobre mim", a: row.bio || "Vamos conversar." }],
    opener: `Oi! Vi seu perfil e quis dizer oi.`,
    replies: [
      "Oi! Que bom te ver por aqui. Como foi seu dia?",
      "Gostei do seu perfil. O que você curte fazer no fim de semana?",
      "Bora marcar um café quando der?",
    ],
    verified: false,
  };
}

type Store = State & {
  saveMe: (me: Me) => void;
  updateMe: (patch: Partial<Me>) => void;
  setPrefs: (prefs: Prefs) => void;
  hydrateFromCloud: (payload: CloudPersisted) => void;
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

let cloudTimer: number | null = null;
function scheduleCloudSave(data: Persisted) {
  if (typeof window === "undefined") return;
  if (cloudTimer) window.clearTimeout(cloudTimer);
  cloudTimer = window.setTimeout(() => {
    void saveCloudState(data as CloudPersisted).catch(() => {
      /* rede / sessão — localStorage já guardou */
    });
  }, 600);
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
    let alive = true;
    (async () => {
      try {
        const cloud = await loadCloudState();
        if (!alive) return;
        if (cloud?.me) {
          hydrated.current = true;
          setState((s) => ({
            ...s,
            ...mergeLoaded(cloud),
            ready: true,
          }));
          writePersist(mergeLoaded(cloud));
          return;
        }
      } catch {
        /* sem sessão / offline — cai no local */
      }
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Persisted>;
          if (parsed?.v === 1 && parsed.me) {
            hydrated.current = true;
            if (!alive) return;
            setState((s) => ({
              ...s,
              ...mergeLoaded(parsed),
              ready: true,
            }));
            return;
          }
        }
      } catch {
        // ignora JSON inválido
      }
      if (!alive) return;
      hydrated.current = true;
      setState((s) => ({ ...s, ready: true }));
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!state.ready || !state.me) return;
    let alive = true;
    (async () => {
      try {
        const rows = await loadDiscoverProfiles();
        if (!alive) return;
        const people = rows.map(profileToPerson);
        setLivePeople(people);
        setState((s) => ({ ...s, liveReady: true }));
      } catch {
        if (alive) setState((s) => ({ ...s, liveReady: true }));
      }
      try {
        const [cloud, user] = await Promise.all([loadCloudReels(), getSessionUser().catch(() => null)]);
        if (!alive) return;
        const meId = user?.id;
        const mapped: Reel[] = cloud.map((row) => ({
          id: row.id,
          authorId: meId && row.user_id === meId ? "me" : row.user_id,
          caption: row.caption || "Reel",
          media: row.media_url,
          poster: row.poster_url || portrait("Reel"),
          likes: row.likes || 0,
          liked: false,
          comments: [],
          at: new Date(row.created_at).getTime(),
          mine: Boolean(meId && row.user_id === meId),
        }));
        setState((s) => ({ ...s, cloudReels: mapped }));
      } catch {
        /* feed local / seed continua */
      }
    })();
    return () => {
      alive = false;
    };
  }, [state.ready, state.me?.email]);

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
    const data = persistOf(state);
    writePersist(data);
    if (state.me) scheduleCloudSave(data);
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

  const hydrateFromCloud = useCallback((payload: CloudPersisted) => {
    hydrated.current = true;
    const merged = mergeLoaded(payload);
    writePersist(merged);
    setState((s) => ({
      ...s,
      ...merged,
      ready: true,
      pendingMatchId: null,
      typingId: null,
    }));
  }, []);

  const saveMe = useCallback((me: Me) => {
    setState((s) => {
      const next = { ...s, me };
      const data = persistOf(next);
      writePersist(data);
      scheduleCloudSave(data);
      void upsertProfile(me, next.prefs).catch(() => {});
      return next;
    });
  }, []);

  const updateMe = useCallback((patch: Partial<Me>) => {
    setState((s) => {
      if (!s.me) return s;
      const next = { ...s, me: { ...s.me, ...patch } };
      const data = persistOf(next);
      writePersist(data);
      scheduleCloudSave(data);
      void upsertProfile(next.me!, next.prefs).catch(() => {});
      return next;
    });
  }, []);

  const setPrefs = useCallback((prefs: Prefs) => {
    setState((s) => {
      const next = { ...s, prefs };
      if (next.me) {
        const data = persistOf(next);
        writePersist(data);
        scheduleCloudSave(data);
        void upsertProfile(next.me, prefs).catch(() => {});
      }
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
    void recordSwipe(id, "pass").catch(() => {});
  }, []);

  const like = useCallback((id: string, superLike = false) => {
    if (stateRef.current.likes.includes(id) || stateRef.current.passes.includes(id)) return;
    const person = getPerson(id);
    const seedMatched = Boolean(person?.likesYou);
    setState((s) => {
      if (s.likes.includes(id) || s.passes.includes(id)) return s;
      const next: State = {
        ...s,
        likes: [...s.likes, id],
        supers: superLike ? [...s.supers, id] : s.supers,
        matches: seedMatched
          ? [{ id, at: Date.now(), super: superLike }, ...s.matches.filter((m) => m.id !== id)]
          : s.matches,
        history: [
          ...s.history,
          {
            id,
            action: (superLike ? "super" : "like") as HistoryItem["action"],
            matched: seedMatched,
          },
        ].slice(-12),
        pendingMatchId: seedMatched ? id : s.pendingMatchId,
      };
      return next;
    });
    if (seedMatched && person) {
      window.setTimeout(() => notifyMatch(person.name), 400);
      if (superLike) {
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
    void recordSwipe(id, superLike ? "super" : "like")
      .then(({ matched }) => {
        if (!matched || seedMatched) return;
        setState((s) => ({
          ...s,
          matches: [{ id, at: Date.now(), super: superLike }, ...s.matches.filter((m) => m.id !== id)],
          history: s.history.map((item, index) =>
            index === s.history.length - 1 && item.id === id ? { ...item, matched: true } : item,
          ),
          pendingMatchId: id,
        }));
        if (person) window.setTimeout(() => notifyMatch(person.name), 400);
      })
      .catch(() => {});
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
    const me = stateRef.current.me;
    const poster = me?.photos[0] || portrait(me?.name || "Você");
    const text = caption.trim() || "Novo reel";
    let media = `idb:reel-${id}`;
    let cloudId = id;
    let at = Date.now();
    try {
      media = await uploadMedia(file, "reels", file.type.includes("mp4") ? "mp4" : "webm");
      try {
        const row = await publishCloudReel({ caption: text, mediaUrl: media, posterUrl: poster });
        cloudId = row.id;
        at = new Date(row.created_at).getTime();
      } catch {
        /* storage ok; tabela reels pode falhar sem bloquear o feed local */
      }
    } catch {
      await idbSet(`reel-${id}`, file);
      media = `idb:reel-${id}`;
    }
    const reel: Reel = {
      id: cloudId,
      authorId: "me",
      caption: text,
      media,
      poster,
      likes: 0,
      liked: false,
      comments: [],
      at,
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
    setLivePeople([]);
    setState({
      ...emptyPersist(),
      ready: true,
      pendingMatchId: null,
      typingId: null,
      liveReady: false,
      cloudReels: [],
    });
  }, []);

  const deck = useMemo(() => {
    const { prefs, passes, likes, liveReady } = state;
    const pool = [...(liveReady ? getLivePeople() : []), ...PEOPLE];
    const seen = new Set<string>();
    const list = pool
      .filter((person) => {
        if (seen.has(person.id)) return false;
        seen.add(person.id);
        if (passes.includes(person.id) || likes.includes(person.id)) return false;
        if (person.sponsored) return true;
        if (person.age < prefs.ageMin || person.age > prefs.ageMax) return false;
        if (prefs.show !== "todos" && person.gender !== prefs.show) return false;
        const cityNeedle = (prefs.city || "").trim().toLowerCase();
        if (cityNeedle && !person.city.toLowerCase().includes(cityNeedle)) return false;
        const km = displayDistance(person, prefs);
        if (km > (prefs.maxKm ?? 50)) return false;
        const decorated = decorate(person);
        if (prefs.verifiedOnly && !decorated.verified) return false;
        return true;
      })
      .map((person) => {
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
    const seen = new Set<string>();
    const merged = [...state.myReels, ...state.cloudReels, ...seeded].filter((reel) => {
      if (seen.has(reel.id) || state.reportedReels.includes(reel.id)) return false;
      seen.add(reel.id);
      return true;
    });
    return merged
      .map((reel) => {
        const extra = state.reelExtras[reel.id];
        if (!extra) return reel;
        return {
          ...reel,
          liked: Boolean(extra.liked) || reel.liked,
          likes: reel.likes + (extra.liked && !reel.liked ? 1 : 0),
          comments: [...reel.comments, ...(extra.comments ?? [])],
        };
      })
      .sort((a, b) => b.at - a.at);
  }, [state.myReels, state.cloudReels, state.reelExtras, state.reportedReels]);

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
    hydrateFromCloud,
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
