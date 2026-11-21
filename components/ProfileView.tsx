"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Photo } from "./Media";
import { AccountPanel } from "./AccountPanel";
import { InstallApp } from "./InstallApp";
import { INTERESTS } from "@/lib/seed";
import { uploadMedia } from "@/lib/cloud";
import { compressImage, idbSet } from "@/lib/idb";
import { useProduct } from "@/lib/product";
import { useFecon } from "@/lib/store";
import type { Reel } from "@/lib/types";

type ProfileTab = "posts" | "liked" | "reposts";

export function ProfileView() {
  const { me, updateMe, prefs, setPrefs, matches, reels, reposts, following, resetAll, refreshCloudReels } = useFecon();
  const product = useProduct();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [tab, setTab] = useState<ProfileTab>("posts");
  const [followers, setFollowers] = useState(0);

  useEffect(() => {
    void refreshCloudReels();
    void import("@/lib/cloud").then(async ({ getSessionUser, countFollowers }) => {
      const user = await getSessionUser().catch(() => null);
      if (!user?.id) return;
      const n = await countFollowers(user.id).catch(() => 0);
      setFollowers(n);
    });
  }, [refreshCloudReels]);

  const mine = useMemo(() => reels.filter((reel) => reel.mine && !reel.repostOf), [reels]);
  const liked = useMemo(() => reels.filter((reel) => reel.liked), [reels]);
  const republished = useMemo(() => {
    const byId = new Map(reels.map((reel) => [reel.id, reel]));
    const fromFlag = reels.filter((reel) => reel.mine && reel.repostOf);
    const fromList = reposts
      .map((id) => byId.get(id))
      .filter((reel): reel is Reel => Boolean(reel));
    const seen = new Set<string>();
    const next: Reel[] = [];
    for (const reel of [...fromFlag, ...fromList]) {
      if (seen.has(reel.id)) continue;
      seen.add(reel.id);
      next.push(reel);
    }
    return next;
  }, [reels, reposts]);
  const grid = tab === "posts" ? mine : tab === "liked" ? liked : republished;

  if (!me) return null;

  async function addPhoto(file: File) {
    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
      setError("Envie uma imagem (JPG, PNG ou WEBP).");
      return;
    }
    setError("");
    setPhotoBusy(true);
    try {
      const blob = await compressImage(file);
      let url = "";

      // 1) API no servidor (usa cookie de sessão — mais confiável no mobile)
      try {
        const body = new FormData();
        body.append("file", new File([blob], "avatar.jpg", { type: "image/jpeg" }));
        const res = await fetch("/api/upload-photo", { method: "POST", body });
        const json = (await res.json()) as { url?: string; photos?: string[]; error?: string };
        if (res.ok && json.url) {
          url = json.url;
          updateMe({ photos: json.photos?.length ? json.photos : [url, ...me!.photos].slice(0, 3) });
          setError("");
          return;
        }
      } catch {
        /* tenta caminho client */
      }

      // 2) Upload direto no client
      try {
        url = await uploadMedia(blob, "photos", "jpg", "image/jpeg");
      } catch {
        // 3) Fallback local neste aparelho
        const key = `photo-${crypto.randomUUID()}`;
        await idbSet(key, blob);
        url = `idb:${key}`;
        setError("Foto salva neste aparelho. Entre de novo na conta para sincronizar na nuvem.");
      }

      const nextPhotos = [url, ...me!.photos.filter((p) => p !== url && !p.startsWith("data:"))].slice(0, 3);
      updateMe({ photos: nextPhotos });
      if (url.startsWith("http")) setError("");
    } catch {
      setError("Não consegui usar essa imagem. Tente outra foto JPG/PNG.");
    } finally {
      setPhotoBusy(false);
    }
  }

  return (
    <div className="app-scroll h-full overflow-y-auto px-5 pt-[max(18px,env(safe-area-inset-top))] pb-8 md:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 items-end gap-4">
            <label className="relative cursor-pointer">
              <Photo
                src={me.photos[0]}
                alt={`Foto de perfil de ${me.name}`}
                className="h-28 w-28 rounded-full border-2 border-[#d4af37]/70 object-cover shadow-md ring-2 ring-[#d4af37]/25"
              />
              <span className="absolute inset-x-2 bottom-2 rounded-full bg-black/70 px-2 py-1 text-center text-[10px] font-bold text-gold">
                {photoBusy ? "Enviando…" : "Trocar"}
              </span>
              <input
                type="file"
                accept="image/*,.heic,.heif"
                capture="user"
                className="sr-only"
                disabled={photoBusy}
                aria-label="Trocar foto de perfil"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void addPhoto(file);
                }}
              />
            </label>
            <div className="min-w-0">
              <h1 className="font-serif text-4xl tracking-tight">
                {me.name}, {me.age}
                {product.state.verification === "verificado" ? " ✓" : ""}
              </h1>
              <p className="text-sm text-muted">
                {me.job} · {product.cityName(me.city)}
              </p>
            </div>
          </div>
          <button className="rounded-2xl bg-panel px-4 py-2 text-sm font-bold shadow-none" onClick={() => setEditing((v) => !v)}>
            {editing ? "Fechar" : "Editar"}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-2">
          <Stat label="Posts" value={mine.length} />
          <Stat label="Seguidores" value={followers} />
          <Stat label="Seguindo" value={following.length} />
          <Stat label="Matches" value={matches.length} />
        </div>

        <p className="mt-6 max-w-xl leading-relaxed">{me.bio}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {me.interests.map((interest) => (
            <span key={interest} className="rounded-full bg-panel px-3 py-1 text-sm font-semibold">
              {interest}
            </span>
          ))}
        </div>

        {editing && (
          <form
            className="mt-6 space-y-3 rounded-3xl bg-panel p-4 shadow-none"
            onSubmit={(e) => {
              e.preventDefault();
              setEditing(false);
            }}
          >
            <Field label="Nome" value={me.name} onChange={(name) => updateMe({ name })} />
            <Field label="Cidade" value={me.city} onChange={(city) => updateMe({ city })} />
            <Field label="O que você faz" value={me.job} onChange={(job) => updateMe({ job })} />
            <label className="block text-sm text-muted">
              Bio
              <textarea
                value={me.bio}
                onChange={(e) => updateMe({ bio: e.target.value })}
                rows={3}
                className="mt-1 w-full resize-none rounded-2xl border border-line bg-paper px-3 py-3 outline-none"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => {
                const on = me.interests.includes(interest);
                return (
                  <button
                    type="button"
                    key={interest}
                    onClick={() =>
                      updateMe({
                        interests: on
                          ? me.interests.filter((item) => item !== interest)
                          : me.interests.length >= 6
                            ? me.interests
                            : [...me.interests, interest],
                      })
                    }
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${on ? "gold-fill" : "bg-paper text-sand"}`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
            <label className={`inline-flex cursor-pointer rounded-2xl gold-fill px-4 py-2 text-sm font-bold ${photoBusy ? "opacity-60" : ""}`}>
              {photoBusy ? "Enviando foto…" : "Adicionar / trocar foto"}
              <input
                type="file"
                accept="image/*,.heic,.heif"
                capture="user"
                className="sr-only"
                disabled={photoBusy}
                aria-label="Adicionar ou trocar foto de perfil"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void addPhoto(file);
                }}
              />
            </label>
            <p className="text-xs text-muted">A foto sobe para a nuvem e aparece no seu perfil, nos reels e no namoro.</p>
          </form>
        )}

        <div className="mt-8">
          <h2 className="font-serif text-2xl tracking-tight">Quem aparece pra você</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(
              [
                ["todos", "Todos"],
                ["mulher", "Mulheres"],
                ["homem", "Homens"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setPrefs({ ...prefs, show: id })}
                className={`rounded-2xl py-3 text-sm font-semibold ${prefs.show === id ? "gold-fill" : "bg-panel"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">
            Idade {prefs.ageMin} – {prefs.ageMax} · até {prefs.maxKm ?? 50} km
            {prefs.city ? ` · ${prefs.city}` : ""}
            {prefs.verifiedOnly ? " · só verificados" : ""}
          </p>
          <label className="mt-3 block text-xs text-muted">
            Cidade preferida
            <input
              className="mt-1 w-full rounded-2xl bg-panel px-4 py-3 text-sm text-white outline-none ring-1 ring-[#d4af37]/25 focus:ring-[#d4af37]/60"
              value={prefs.city || ""}
              placeholder="Todas as cidades"
              onChange={(e) => setPrefs({ ...prefs, city: e.target.value })}
              aria-label="Filtrar Match por cidade"
            />
          </label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <label className="text-xs text-muted">
              Mínima
              <input
                className="mt-1 w-full"
                type="range"
                min={18}
                max={prefs.ageMax}
                value={prefs.ageMin}
                onChange={(e) => setPrefs({ ...prefs, ageMin: Math.min(Number(e.target.value), prefs.ageMax) })}
                aria-label="Idade mínima"
              />
            </label>
            <label className="text-xs text-muted">
              Máxima
              <input
                className="mt-1 w-full"
                type="range"
                min={prefs.ageMin}
                max={60}
                value={prefs.ageMax}
                onChange={(e) => setPrefs({ ...prefs, ageMax: Math.max(prefs.ageMin, Number(e.target.value)) })}
                aria-label="Idade máxima"
              />
            </label>
          </div>
          <label className="mt-4 flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={Boolean(prefs.verifiedOnly)}
              onChange={(e) => setPrefs({ ...prefs, verifiedOnly: e.target.checked })}
            />
            Só perfis verificados
          </label>
        </div>

        <div className="mt-8">
          <div className="grid grid-cols-3 border-b border-line text-center text-sm font-semibold">
            {(
              [
                ["posts", "Posts", mine.length],
                ["liked", "Curtidos", liked.length],
                ["reposts", "Reposts", republished.length],
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
                {tab === id && <span className="absolute inset-x-6 -bottom-px h-0.5 rounded-full gold-fill" />}
              </button>
            ))}
          </div>
          {grid.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              {tab === "posts"
                ? "Quando você publicar, seus vídeos aparecem aqui."
                : tab === "liked"
                  ? "Os reels que você curtir ficam nesta aba."
                  : "Republicações suas aparecem aqui."}
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-1">
              {grid.map((reel) => (
                <button
                  key={reel.id}
                  onClick={() => router.push(`/reels?v=${reel.id}`)}
                  className="relative aspect-[3/4] overflow-hidden bg-black text-left"
                >
                  <Photo src={reel.poster || reel.media} alt={`Capa do reel: ${reel.caption}`} className="h-full w-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1.5 pt-6 text-[10px] text-white">
                    ♥ {reel.likes}
                    {reel.repostOf ? " · ↻" : ""}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <AccountPanel />

        {error && <p className="mt-4 text-sm text-gold-2">{error}</p>}

        <div className="mt-8 space-y-3 rounded-3xl border border-[#d4af37]/35 bg-panel p-4">
          <p className="text-sm font-semibold text-gold">Instalar o app</p>
          <p className="text-sm text-sand">
            Android, Windows ou Linux — abre como aplicativo. Vídeos e conta ficam salvos na nuvem.
          </p>
          <InstallApp compact />
          <a href="/lojas" className="block text-center text-xs font-semibold text-gold">
            Ver instruções completas
          </a>
        </div>

        <div className="mt-10 space-y-3 rounded-3xl border border-[#d4af37]/35 bg-panel p-4">
          <p className="text-sm font-semibold text-gold">Desenvolvedor</p>
          <a href="/admin" className="block w-full rounded-2xl gold-fill py-3 text-center text-sm font-bold">
            Abrir painel admin
          </a>
          <p className="text-sm font-semibold text-gold">Sessão neste aparelho</p>
          <button
            className="w-full rounded-2xl border border-[#d4af37]/50 py-3 text-sm font-bold text-gold"
            onClick={async () => {
              try {
                const { signOut } = await import("@/lib/cloud");
                await signOut();
              } catch {
                /* segue limpando local */
              }
              product.wipe();
              resetAll();
              router.push("/");
            }}
          >
            Sair
          </button>
          <button
            className="w-full rounded-2xl bg-paper py-3 text-sm font-semibold text-sand"
            onClick={async () => {
              if (!window.confirm("Apagar perfil, matches e dados deste aparelho?")) return;
              try {
                const { signOut } = await import("@/lib/cloud");
                await signOut();
              } catch {
                /* segue limpando local */
              }
              product.wipe();
              resetAll();
              router.push("/");
            }}
          >
            Apagar dados
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-panel px-3 py-3 text-center shadow-none">
      <p className="font-serif text-2xl tracking-tight">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm text-muted">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border border-line bg-paper px-3 py-3 outline-none"
      />
    </label>
  );
}

