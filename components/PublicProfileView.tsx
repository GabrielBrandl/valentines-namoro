"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Photo } from "./Media";
import {
  countFollowers,
  countFollowing,
  getSessionUser,
  loadCloudReelsByAuthor,
  loadProfilesByIds,
  type CloudReel,
} from "@/lib/cloud";
import { getPerson, portrait } from "@/lib/seed";
import { useFecon } from "@/lib/store";
import type { Person, Reel } from "@/lib/types";

type Tab = "posts" | "reposts";

function cloudToReel(row: CloudReel, likedIds: Set<string>): Reel {
  const likes = row.likes ?? 0;
  return {
    id: row.id,
    authorId: row.user_id,
    caption: row.caption || "",
    media: row.media_url,
    poster: row.poster_url || row.media_url,
    likes,
    liked: likedIds.has(row.id),
    comments: [],
    commentsCount: row.comments_count ?? Math.floor(likes * 0.05),
    at: new Date(row.created_at).getTime(),
    shares: row.shares ?? Math.max(1, Math.floor(likes * 0.02)),
    hashtags: row.hashtags ?? undefined,
    effect: row.effect ?? undefined,
    music: row.music ?? undefined,
    repostOf: row.repost_of ?? undefined,
  };
}

function personFromCloud(id: string, profile: Awaited<ReturnType<typeof loadProfilesByIds>>[number] | null): Person | null {
  if (!profile) return null;
  return {
    id,
    name: profile.name,
    age: profile.age,
    city: profile.city,
    job: profile.job,
    bio: profile.bio,
    gender: profile.gender,
    interests: profile.interests,
    photos: profile.photos.length ? profile.photos : [],
    distanceKm: 0,
    likesYou: false,
    online: false,
    prompts: [],
    opener: "",
    replies: [],
  };
}

export function PublicProfileView({ userId }: { userId: string }) {
  const router = useRouter();
  const { reels, following, toggleFollow, refreshCloudReels } = useFecon();
  const [tab, setTab] = useState<Tab>("posts");
  const [person, setPerson] = useState<Person | null>(() => getPerson(userId));
  const [extraReels, setExtraReels] = useState<Reel[]>([]);
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [isSelf, setIsSelf] = useState(userId === "me");
  const isFollowing = following.includes(userId);

  useEffect(() => {
    if (userId === "me") {
      router.replace("/perfil");
      return;
    }
    let alive = true;
    (async () => {
      setLoading(true);
      void refreshCloudReels();
      const session = await getSessionUser();
      if (!alive) return;
      if (session?.id && session.id === userId) {
        setIsSelf(true);
        router.replace("/perfil");
        return;
      }
      setIsSelf(false);

      const local = getPerson(userId);
      if (alive && local) setPerson(local);

      try {
        const [profiles, authorReels, followersN, followingN] = await Promise.all([
          loadProfilesByIds([userId]),
          loadCloudReelsByAuthor(userId),
          countFollowers(userId),
          countFollowing(userId),
        ]);
        if (!alive) return;
        const profile = profiles[0] ?? null;
        const next = personFromCloud(userId, profile) || local;
        if (next) {
          if (!next.photos.length) {
            next.photos = local?.photos?.length ? local.photos : [portrait(next.name)];
          }
          setPerson(next);
        }
        const liked = new Set(reels.filter((r) => r.liked).map((r) => r.id));
        setExtraReels(authorReels.map((row) => cloudToReel(row, liked)));
        setFollowers(followersN);
        setFollowingCount(followingN);
      } catch {
        /* mantém o que já temos no feed local */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId, refreshCloudReels, router, reels]);

  const merged = useMemo(() => {
    const map = new Map<string, Reel>();
    for (const reel of reels) {
      if (reel.authorId === userId || (reel.mine && userId === "me")) map.set(reel.id, reel);
    }
    for (const reel of extraReels) {
      if (!map.has(reel.id)) map.set(reel.id, reel);
    }
    return Array.from(map.values()).sort((a, b) => b.at - a.at);
  }, [reels, extraReels, userId]);

  const posts = useMemo(() => merged.filter((reel) => !reel.repostOf), [merged]);
  const republished = useMemo(() => merged.filter((reel) => Boolean(reel.repostOf)), [merged]);
  const grid = tab === "posts" ? posts : republished;

  async function onFollow() {
    if (busy || isSelf) return;
    setBusy(true);
    const next = !isFollowing;
    toggleFollow(userId);
    setFollowers((n) => Math.max(0, n + (next ? 1 : -1)));
    setBusy(false);
  }

  if (!person && loading) {
    return (
      <div className="grid h-full place-items-center bg-paper text-sm text-muted">
        Carregando perfil…
      </div>
    );
  }

  if (!person) {
    return (
      <div className="app-scroll h-full overflow-y-auto bg-paper px-5 pt-[max(18px,env(safe-area-inset-top))]">
        <button type="button" className="text-gold" onClick={() => router.back()}>
          ‹ Voltar
        </button>
        <p className="mt-8 font-serif text-2xl">Perfil não encontrado</p>
        <p className="mt-2 text-sm text-muted">Essa pessoa pode ter saído ou o link expirou.</p>
      </div>
    );
  }

  const photo = person.photos[0] || "";

  return (
    <div className="app-scroll h-full overflow-y-auto bg-paper px-5 pb-28 pt-[max(18px,env(safe-area-inset-top))]">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <button type="button" className="text-2xl leading-none text-gold" onClick={() => router.back()} aria-label="Voltar">
            ‹
          </button>
          <p className="text-sm font-semibold text-muted">Perfil</p>
          <span className="w-6" />
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-4">
          <Photo
            src={photo}
            alt={`Foto de ${person.name}`}
            className="h-28 w-28 rounded-full border-2 border-[#d4af37]/70 object-cover shadow-md ring-2 ring-[#d4af37]/25"
          />
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-3xl tracking-tight">
              {person.name}
              {person.age ? `, ${person.age}` : ""}
            </h1>
            <p className="text-sm text-muted">
              {person.job}
              {person.city ? ` · ${person.city}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 text-center">
          <Stat label="Posts" value={posts.length} />
          <Stat label="Seguidores" value={followers} />
          <Stat label="Seguindo" value={isSelf ? following.length : followingCount} />
        </div>

        {person.bio ? <p className="mt-5 leading-relaxed text-sand">{person.bio}</p> : null}

        {person.interests?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {person.interests.map((interest) => (
              <span key={interest} className="rounded-full bg-panel px-3 py-1 text-sm font-semibold">
                {interest}
              </span>
            ))}
          </div>
        ) : null}

        {!isSelf && (
          <div className="mt-6 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void onFollow()}
              className={`flex-1 rounded-2xl py-3 text-sm font-bold ${
                isFollowing ? "border border-[#d4af37]/50 bg-panel text-gold" : "gold-fill text-black"
              }`}
            >
              {isFollowing ? "Seguindo" : "Seguir"}
            </button>
            <button
              type="button"
              className="rounded-2xl border border-[#d4af37]/40 px-4 py-3 text-sm font-semibold text-gold"
              onClick={() => router.push(`/reels`)}
            >
              Ver feed
            </button>
          </div>
        )}

        <div className="mt-8">
          <div className="grid grid-cols-2 border-b border-line text-center text-sm font-semibold">
            {(
              [
                ["posts", "Posts", posts.length],
                ["reposts", "Republicados", republished.length],
              ] as const
            ).map(([id, label, count]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`relative py-3 ${tab === id ? "text-gold" : "text-muted"}`}
              >
                {label}
                <span className="ml-1 text-xs opacity-70">{count}</span>
                {tab === id && <span className="absolute inset-x-8 -bottom-px h-0.5 rounded-full gold-fill" />}
              </button>
            ))}
          </div>

          {grid.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              {tab === "posts" ? "Ainda sem vídeos publicados." : "Ainda sem republicações."}
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-1">
              {grid.map((reel) => (
                <button
                  key={reel.id}
                  type="button"
                  onClick={() => router.push(`/reels?v=${reel.id}`)}
                  className="relative aspect-[3/4] overflow-hidden bg-black text-left"
                >
                  <Photo
                    src={reel.poster || reel.media}
                    alt={`Capa do reel: ${reel.caption}`}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1.5 pt-6 text-[10px] text-white">
                    ♥ {reel.likes}
                    {reel.repostOf ? " · ↻" : ""}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-panel px-3 py-3">
      <p className="font-serif text-2xl text-gold">{value}</p>
      <p className="text-[11px] font-semibold text-muted">{label}</p>
    </div>
  );
}
