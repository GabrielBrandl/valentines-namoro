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
  loadFollowingIds,
  loadLikedReelIds,
  loadProfilesByIds,
  publishCloudReel,
  recordSwipe,
  saveCloudState,
  toggleCloudReelLike,
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
  ReelEffect,
  ReelExtra,
  ReelMusic,
} from "./types";
import {
  capturePosterFrame,
  ensureHashtagsInCaption,
  extractHashtags,
  videoContentType,
  videoExtFromFile,
} from "./video";

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
  reposts: string[];
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
  reposts: [],
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
  publishReel: (
    file: Blob,
    caption: string,
    meta?: {
      hashtags?: string[];
      effect?: ReelEffect | null;
      music?: ReelMusic | null;
    },
  ) => Promise<void>;
  repostReel: (reelId: string) => Promise<void>;
  shareReel: (reelId: string) => Promise<string>;
  deleteReel: (reelId: string) => void;
  refreshCloudReels: () => Promise<void>;
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
    reposts: state.reposts,
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
    reposts: Array.isArray(parsed.reposts) ? parsed.reposts : [],
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
        if (people.length === 0) {
          // tenta de novo em breve (sessão/JWT pode atrasar no 1º paint)
          window.setTimeout(() => {
            void loadDiscoverProfiles()
              .then((again) => {
                if (!again.length) return;
                setLivePeople(again.map(profileToPerson));
                setState((s) => ({ ...s, liveReady: true }));
              })
              .catch(() => {});
          }, 1200);
        }
      } catch {
        if (alive) setState((s) => ({ ...s, liveReady: true }));
      }
      try {
        const [cloud, user, likedIds] = await Promise.all([
          loadCloudReels(),
          getSessionUser().catch(() => null),
          loadLikedReelIds().catch(() => [] as string[]),
        ]);
        if (!alive) return;
        const meId = user?.id;
        const likedSet = new Set(likedIds);
        const mapped: Reel[] = cloud.map((row) => ({
          id: row.id,
          authorId: meId && row.user_id === meId ? "me" : row.user_id,
          caption: row.caption || "Reel",
          media: row.media_url,
          poster: row.poster_url || portrait("Reel"),
          likes: row.likes || 0,
          liked: likedSet.has(row.id),
          comments: [],
          at: new Date(row.created_at).getTime(),
          mine: Boolean(meId && row.user_id === meId),
          hashtags: row.hashtags ?? extractHashtags(row.caption || ""),
          effect: row.effect ?? null,
          music: row.music ?? null,
          repostOf: row.repost_of ?? undefined,
          shares: 0,
        }));
        setState((s) => {
          const extras = { ...s.reelExtras };
          const likedSetLocal = new Set(likedIds);
          for (const [id, extra] of Object.entries(extras)) {
            if (extra?.liked && /^[0-9a-f-]{36}$/i.test(id) && !likedSetLocal.has(id)) {
              extras[id] = { ...extra, liked: false };
            }
          }
          for (const id of likedIds) {
            extras[id] = { ...extras[id], liked: true };
          }
          return { ...s, cloudReels: mapped, reelExtras: extras };
        });
        const authorIds = mapped.map((reel) => reel.authorId).filter((id) => id && id !== "me");
        if (authorIds.length) {
          const authors = await loadProfilesByIds(authorIds);
          if (alive && authors.length) {
            const people = authors.map(profileToPerson);
            const prev = getLivePeople();
            const byId = new Map(prev.map((p) => [p.id, p]));
            for (const person of people) byId.set(person.id, person);
            setLivePeople(Array.from(byId.values()));
          }
        }
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
    const current = stateRef.current;
    const fromMine = current.myReels.find((reel) => reel.id === reelId);
    const fromCloud = current.cloudReels.find((reel) => reel.id === reelId);
    const fromExtra = current.reelExtras[reelId];
    const wasLiked = Boolean(fromMine?.liked || fromCloud?.liked || fromExtra?.liked);
    const nextLiked = !wasLiked;

    setState((s) => {
      if (s.myReels.some((reel) => reel.id === reelId)) {
        return {
          ...s,
          myReels: s.myReels.map((reel) =>
            reel.id === reelId
              ? { ...reel, liked: nextLiked, likes: Math.max(0, reel.likes + (nextLiked ? 1 : -1)) }
              : reel,
          ),
          cloudReels: s.cloudReels.map((reel) =>
            reel.id === reelId
              ? { ...reel, liked: nextLiked, likes: Math.max(0, reel.likes + (nextLiked ? 1 : -1)) }
              : reel,
          ),
          reelExtras: {
            ...s.reelExtras,
            [reelId]: { ...s.reelExtras[reelId], liked: nextLiked },
          },
        };
      }
      return {
        ...s,
        cloudReels: s.cloudReels.map((reel) =>
          reel.id === reelId
            ? { ...reel, liked: nextLiked, likes: Math.max(0, reel.likes + (nextLiked ? 1 : -1)) }
            : reel,
        ),
        reelExtras: {
          ...s.reelExtras,
          [reelId]: { ...s.reelExtras[reelId], liked: nextLiked },
        },
      };
    });

    // UUID do Supabase → sincroniza curtida global
    if (/^[0-9a-f-]{36}$/i.test(reelId)) {
      void toggleCloudReelLike(reelId, nextLiked).catch(() => {
        /* mantém estado local */
      });
    }
  }, []);

  const toggleFollow = useCallback((authorId: string) => {
    if (!authorId || authorId === "me") return;
    const on = stateRef.current.following.includes(authorId);
    const nextFollow = !on;
    setState((s) => ({
      ...s,
      following: on ? s.following.filter((id) => id !== authorId) : [...s.following, authorId],
    }));
    if (/^[0-9a-f-]{36}$/i.test(authorId)) {
      void import("@/lib/cloud")
        .then(({ toggleCloudFollow }) => toggleCloudFollow(authorId, nextFollow))
        .catch(() => {
          /* mantém estado local */
        });
    }
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

  const refreshCloudReels = useCallback(async () => {
    try {
      const [cloud, user, likedIds, followingIds] = await Promise.all([
        loadCloudReels(),
        getSessionUser().catch(() => null),
        loadLikedReelIds().catch(() => [] as string[]),
        loadFollowingIds().catch(() => null),
      ]);
      const meId = user?.id;
      const likedSet = new Set(likedIds);
      const mapped: Reel[] = cloud.map((row) => ({
        id: row.id,
        authorId: meId && row.user_id === meId ? "me" : row.user_id,
        caption: row.caption || "Reel",
        media: row.media_url,
        poster: row.poster_url || portrait("Reel"),
        likes: row.likes || 0,
        liked: likedSet.has(row.id),
        comments: [],
        at: new Date(row.created_at).getTime(),
        mine: Boolean(meId && row.user_id === meId),
        hashtags: row.hashtags ?? extractHashtags(row.caption || ""),
        effect: row.effect ?? null,
        music: row.music ?? null,
        repostOf: row.repost_of ?? undefined,
        shares: 0,
      }));
      setState((s) => {
        const extras = { ...s.reelExtras };
        for (const [id, extra] of Object.entries(extras)) {
          if (extra?.liked && /^[0-9a-f-]{36}$/i.test(id) && !likedSet.has(id)) {
            extras[id] = { ...extra, liked: false };
          }
        }
        for (const id of likedIds) {
          extras[id] = { ...extras[id], liked: true };
        }
        const nextFollowing =
          followingIds == null
            ? s.following
            : Array.from(
                new Set([
                  ...s.following.filter((id) => !/^[0-9a-f-]{36}$/i.test(id)),
                  ...followingIds,
                ]),
              );
        return { ...s, cloudReels: mapped, reelExtras: extras, following: nextFollowing };
      });
    } catch {
      /* feed local */
    }
  }, []);

  const publishReel = useCallback(
    async (
      file: Blob,
      caption: string,
      meta?: {
        hashtags?: string[];
        effect?: ReelEffect | null;
        music?: ReelMusic | null;
      },
    ) => {
      const id = crypto.randomUUID();
      const me = stateRef.current.me;
      const tags = meta?.hashtags?.length ? meta.hashtags : extractHashtags(caption);
      const text = ensureHashtagsInCaption(caption, tags);
      const hashtags = extractHashtags(text);
      const effect = meta?.effect ?? null;
      const music = meta?.music ?? { id: "original", title: "Som original", artist: me?.name || "Você" };
      let poster = me?.photos[0] || portrait(me?.name || "Você");
      const ext = videoExtFromFile(file as File);
      const mime = videoContentType(file as File, ext);

      let media = `idb:reel-${id}`;
      let cloudId = id;
      let at = Date.now();
      let cloudOk = false;

      try {
        const frame = await capturePosterFrame(file);
        if (frame) {
          try {
            poster = await uploadMedia(frame, "posters", "jpg", "image/jpeg");
          } catch {
            /* usa foto do perfil */
          }
        }
        media = await uploadMedia(file, "reels", ext, mime);
        const row = await publishCloudReel({
          caption: text,
          mediaUrl: media,
          posterUrl: poster,
          hashtags,
          effect,
          music,
        });
        cloudId = row.id;
        at = new Date(row.created_at).getTime();
        cloudOk = true;
      } catch (err) {
        await idbSet(`reel-${id}`, file);
        media = `idb:reel-${id}`;
        // Ainda publica localmente, mas avisa que os outros não verão
        if (!(err instanceof Error && /login/i.test(err.message))) {
          console.warn("publish cloud failed", err);
        }
        throw new Error(
          err instanceof Error && /login/i.test(err.message)
            ? err.message
            : "Não consegui publicar na nuvem. Verifique a conexão e tente de novo (vídeo MP4 ajuda no celular).",
        );
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
        hashtags,
        effect,
        music,
        shares: 0,
      };
      setState((s) => ({ ...s, myReels: [reel, ...s.myReels.filter((item) => item.id !== cloudId)] }));
      if (cloudOk) void refreshCloudReels();
    },
    [refreshCloudReels],
  );

  const repostReel = useCallback(
    async (reelId: string) => {
      const all = [...stateRef.current.myReels, ...stateRef.current.cloudReels];
      const reel = all.find((r) => r.id === reelId);
      if (!reel) throw new Error("Reel não encontrado.");
      if (reel.authorId === "me" && !reel.repostOf) throw new Error("Esse reel já é seu.");
      if (stateRef.current.reposts.includes(reelId)) throw new Error("Você já republicou isso.");

      const me = stateRef.current.me;
      const caption = ensureHashtagsInCaption(`Republicado: ${reel.caption}`, extractHashtags(reel.caption));
      let cloudId = crypto.randomUUID();
      let at = Date.now();
      const media = reel.media;
      const poster = reel.poster || me?.photos[0] || portrait(me?.name || "Você");

      if (media.startsWith("http")) {
        try {
          const row = await publishCloudReel({
            caption,
            mediaUrl: media,
            posterUrl: poster.startsWith("http") ? poster : undefined,
            hashtags: extractHashtags(caption),
            effect: reel.effect ?? null,
            music: reel.music ?? null,
            repostOf: /^[0-9a-f-]{36}$/i.test(reel.id) ? reel.id : null,
          });
          cloudId = row.id;
          at = new Date(row.created_at).getTime();
        } catch (err) {
          throw new Error(err instanceof Error ? err.message : "Falha ao republicar.");
        }
      }

      const next: Reel = {
        id: cloudId,
        authorId: "me",
        caption,
        media,
        poster,
        likes: 0,
        liked: false,
        comments: [],
        at,
        mine: true,
        hashtags: extractHashtags(caption),
        effect: reel.effect ?? null,
        music: reel.music ?? null,
        repostOf: reel.id,
        shares: 0,
      };
      setState((s) => ({
        ...s,
        myReels: [next, ...s.myReels],
        reposts: s.reposts.includes(reelId) ? s.reposts : [reelId, ...s.reposts],
      }));
      void refreshCloudReels();
    },
    [refreshCloudReels],
  );

  const shareReel = useCallback(async (reelId: string) => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/reels?v=${encodeURIComponent(reelId)}`
        : `/reels?v=${encodeURIComponent(reelId)}`;
    setState((s) => ({
      ...s,
      myReels: s.myReels.map((reel) =>
        reel.id === reelId ? { ...reel, shares: (reel.shares || 0) + 1 } : reel,
      ),
      cloudReels: s.cloudReels.map((reel) =>
        reel.id === reelId ? { ...reel, shares: (reel.shares || 0) + 1 } : reel,
      ),
      reelExtras: {
        ...s.reelExtras,
        [reelId]: {
          ...s.reelExtras[reelId],
          shares: (s.reelExtras[reelId]?.shares || 0) + 1,
        },
      },
    }));
    return url;
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
    // Produção: só perfis reais da nuvem (sem PEOPLE/seed)
    const pool = liveReady ? getLivePeople() : [];
    const seen = new Set<string>();
    const applyFilters = (strict: boolean) =>
      pool
        .filter((person) => {
          if (seen.has(person.id)) return false;
          seen.add(person.id);
          if (passes.includes(person.id) || likes.includes(person.id)) return false;
          if (person.sponsored) return true;
          if (person.age < prefs.ageMin || person.age > prefs.ageMax) return false;
          if (prefs.show !== "todos" && person.gender !== prefs.show) return false;
          if (strict) {
            const cityNeedle = (prefs.city || "").trim().toLowerCase();
            if (cityNeedle && !person.city.toLowerCase().includes(cityNeedle)) return false;
            const km = displayDistance(person, prefs);
            if (km > (prefs.maxKm ?? 50)) return false;
          }
          const decorated = decorate(person);
          if (prefs.verifiedOnly && !decorated.verified) return false;
          return true;
        })
        .map((person) => {
          const decorated = decorate(person);
          return { ...decorated, distanceKm: displayDistance(person, prefs) };
        });

    seen.clear();
    let list = applyFilters(true);
    // Se filtros de cidade/km esvaziarem o deck, relaxa para ainda mostrar a crowd
    if (list.length === 0 && pool.length > 0) {
      seen.clear();
      list = applyFilters(false);
    }
    const ads = list.filter((person) => person.sponsored);
    const people = list.filter((person) => !person.sponsored);
    if (ads[0]) people.splice(Math.min(3, people.length), 0, ads[0]);
    return people;
  }, [state]);

  const likesYou = useMemo(
    () =>
      getLivePeople()
        .filter(
          (person) =>
            person.likesYou && !state.likes.includes(person.id) && !state.passes.includes(person.id),
        )
        .map(decorate),
    [state.likes, state.passes, state.liveReady],
  );

  const reels = useMemo(() => {
    // Produção: só reels reais (meus + nuvem), sem SEED_REELS
    const seen = new Set<string>();
    const merged = [...state.myReels, ...state.cloudReels].filter((reel) => {
      if (seen.has(reel.id) || state.reportedReels.includes(reel.id)) return false;
      seen.add(reel.id);
      return true;
    });
    return merged
      .map((reel) => {
        const extra = state.reelExtras[reel.id];
        const hashtags = reel.hashtags?.length ? reel.hashtags : extractHashtags(reel.caption);
        if (!extra) return { ...reel, hashtags, shares: reel.shares || 0 };
        return {
          ...reel,
          hashtags,
          liked: Boolean(extra.liked) || reel.liked,
          likes: reel.likes + (extra.liked && !reel.liked ? 1 : 0),
          comments: [...reel.comments, ...(extra.comments ?? [])],
          shares: (reel.shares || 0) + (extra.shares || 0),
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
    repostReel,
    shareReel,
    deleteReel,
    refreshCloudReels,
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
