"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Photo } from "./Media";
import { AccountPanel } from "./AccountPanel";
import { INTERESTS } from "@/lib/seed";
import { compressImage, idbSet } from "@/lib/idb";
import { useProduct } from "@/lib/product";
import { useFecon } from "@/lib/store";

export function ProfileView() {
  const { me, updateMe, prefs, setPrefs, matches, reels, resetAll } = useFecon();
  const product = useProduct();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  if (!me) return null;
  const mine = reels.filter((reel) => reel.mine);

  async function addPhoto(file: File) {
    setError("");
    try {
      const blob = await compressImage(file);
      const key = `photo-${crypto.randomUUID()}`;
      await idbSet(key, blob);
      updateMe({ photos: [`idb:${key}`, ...me!.photos].slice(0, 3) });
    } catch {
      setError("Não consegui usar essa imagem.");
    }
  }

  return (
    <div className="app-scroll h-full overflow-y-auto px-5 pt-[max(18px,env(safe-area-inset-top))] pb-8 md:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 items-end gap-4">
            <Photo src={me.photos[0]} alt={me.name} className="h-28 w-28 rounded-full border-2 border-[#d4af37]/70 object-cover shadow-md ring-2 ring-[#d4af37]/25" />
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

        <div className="mt-6 grid grid-cols-3 gap-2">
          <Stat label="Matches" value={matches.length} />
          <Stat label="Reels" value={mine.length} />
          <Stat label="Interesses" value={me.interests.length} />
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
            <label className="inline-flex cursor-pointer rounded-2xl gold-fill px-4 py-2 text-sm font-bold">
              Trocar foto
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) addPhoto(file);
                }}
              />
            </label>
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
            {prefs.verifiedOnly ? " · só verificados" : ""}
          </p>
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
              />
            </label>
          </div>
        </div>

        <AccountPanel />

        <div className="mt-8">
          <h2 className="font-serif text-2xl tracking-tight">Seus reels</h2>
          {mine.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Quando você publicar, eles ficam aqui.</p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {mine.map((reel) => (
                <button key={reel.id} onClick={() => router.push(`/reels?v=${reel.id}`)} className="text-left">
                  <Photo src={reel.poster} alt="" className="aspect-[3/4] w-full rounded-2xl object-cover" />
                  <span className="mt-1 line-clamp-2 block text-xs text-muted">{reel.caption}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-gold-2">{error}</p>}

        <div className="mt-10 space-y-3 rounded-3xl border border-[#d4af37]/35 bg-panel p-4">
          <p className="text-sm font-semibold text-gold">Sessão neste aparelho</p>
          <button
            className="w-full rounded-2xl border border-[#d4af37]/50 py-3 text-sm font-bold text-gold"
            onClick={() => {
              product.wipe();
              resetAll();
              router.push("/");
            }}
          >
            Sair
          </button>
          <button
            className="w-full rounded-2xl bg-paper py-3 text-sm font-semibold text-sand"
            onClick={() => {
              if (!window.confirm("Apagar perfil, matches e dados deste aparelho?")) return;
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

