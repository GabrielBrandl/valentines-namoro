"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Photo } from "./Media";
import { brand } from "@/lib/brand";
import { ufFromCity } from "@/lib/brazil";
import {
  getSessionUser,
  loadCloudState,
  signIn,
  signUp,
  uploadMedia,
  upsertProfile,
} from "@/lib/cloud";
import { portrait } from "@/lib/seed";
import { compressImage } from "@/lib/idb";
import { useProduct } from "@/lib/product";
import { useFecon } from "@/lib/store";
import type { Gender, Me, Prefs } from "@/lib/types";

const defaultPrefs: Prefs = {
  show: "todos",
  ageMin: 18,
  ageMax: 45,
  maxKm: 50,
  verifiedOnly: false,
  city: "",
};

export function Onboarding() {
  const { saveMe, setPrefs, hydrateFromCloud } = useFecon();
  const product = useProduct();
  const router = useRouter();
  const [mode, setMode] = useState<"home" | "signup" | "login">("home");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("24");
  const [gender, setGender] = useState<Gender>("mulher");
  const [city, setCity] = useState("São Paulo");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedName, setSavedName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptAge, setAcceptAge] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const user = await getSessionUser();
        if (!alive || !user) return;
        const state = await loadCloudState();
        const label = state?.me?.name || user.user_metadata?.name || user.email?.split("@")[0] || "";
        if (alive) setSavedName(label);
      } catch {
        /* offline / sem sessão */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const ageNumber = Number(age);

  function enterAs(me: Me, prefs?: Prefs) {
    saveMe(me);
    setPrefs({ ...defaultPrefs, ...prefs });
    try {
      product.bootstrap(ufFromCity(me.city || "São Paulo", "SP"));
    } catch {
      /* produto não pode travar o acesso */
    }
    router.replace("/reels");
    window.setTimeout(() => {
      if (window.location.pathname === "/") window.location.replace("/reels");
    }, 400);
  }

  async function resumeSession() {
    setError("");
    setBusy(true);
    try {
      const user = await getSessionUser();
      if (!user) {
        setMode("login");
        return;
      }
      const cloud = await loadCloudState();
      if (cloud?.me) {
        hydrateFromCloud(cloud);
        enterAs(cloud.me, cloud.prefs);
        return;
      }
      const fallback: Me = {
        id: "me",
        name: (user.user_metadata?.name as string) || user.email?.split("@")[0] || "Você",
        age: 24,
        city: "São Paulo",
        job: "Em descoberta",
        gender: "mulher",
        bio: "Acabei de chegar no Valentine's.",
        interests: ["Música", "Café"],
        photos: [portrait(user.email || "Você")],
        email: user.email || undefined,
      };
      await upsertProfile(fallback, defaultPrefs);
      enterAs(fallback, defaultPrefs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não consegui entrar.");
    } finally {
      setBusy(false);
    }
  }

  async function tryLogin() {
    setError("");
    if (!email.trim() || password.length < 6) {
      setError("Informe e-mail e senha (mín. 6 caracteres).");
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
      const cloud = await loadCloudState();
      if (cloud?.me) {
        hydrateFromCloud(cloud);
        enterAs(cloud.me, cloud.prefs);
        return;
      }
      const user = await getSessionUser();
      const me: Me = {
        id: "me",
        name: (user?.user_metadata?.name as string) || email.split("@")[0],
        age: 24,
        city: "São Paulo",
        job: "Em descoberta",
        gender: "mulher",
        bio: "Acabei de chegar no Valentine's.",
        interests: ["Música", "Café"],
        photos: [portrait(email)],
        email: email.trim().toLowerCase(),
      };
      await upsertProfile(me, defaultPrefs);
      enterAs(me, defaultPrefs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login.");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    setError("");
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName) {
      setError("Digite seu nome.");
      return;
    }
    if (!cleanEmail.includes("@")) {
      setError("Digite um e-mail válido.");
      return;
    }
    if (password.length < 6) {
      setError("Senha com no mínimo 6 caracteres.");
      return;
    }
    if (age && Number.isFinite(ageNumber) && ageNumber < 18) {
      setError(`${brand.name} é só para maiores de 18 anos.`);
      return;
    }
    if (!acceptAge || !acceptTerms || !acceptPrivacy) {
      setError("Marque os consentimentos de idade, termos e privacidade (LGPD).");
      return;
    }
    setBusy(true);
    try {
      await signUp(cleanEmail, password, cleanName);
      // Se o projeto exigir confirmação de e-mail, ainda tentamos login imediato.
      try {
        await signIn(cleanEmail, password);
      } catch {
        /* pode precisar confirmar e-mail — seguimos se já houver sessão do signUp */
      }

      const safeAge = !age || ageNumber < 18 || ageNumber > 80 ? 24 : ageNumber;
      let photos = [portrait(cleanName)];
      if (file) {
        try {
          const blob = await compressImage(file);
          photos = [await uploadMedia(blob, "photos", "jpg")];
        } catch {
          photos = [portrait(cleanName)];
        }
      }

      const me: Me = {
        id: "me",
        name: cleanName,
        age: safeAge,
        city: city.trim() || "São Paulo",
        job: "Em descoberta",
        gender,
        bio: "Acabei de chegar no Valentine's.",
        interests: ["Música", "Café"],
        photos,
        email: cleanEmail,
      };

      const prefs: Prefs = { ...defaultPrefs, city: "" };
      await upsertProfile(me, prefs);
      try {
        product.claim("");
        product.activate({ phone: "", uf: ufFromCity(me.city, "SP"), signal: "nenhum" });
        product.acceptTerms();
      } catch {
        /* ignore */
      }
      enterAs(me, prefs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a conta.");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "home") {
    return (
      <div className="relative mx-auto flex h-full min-h-0 max-w-md flex-col overflow-y-auto bg-[#050505]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 50% 28%, rgba(212,175,55,0.22) 0%, rgba(166,124,0,0.08) 38%, transparent 68%), linear-gradient(180deg, #0a0a0a 0%, #050505 45%, #000 100%)",
          }}
        />
        <div className="relative z-10 flex min-h-full flex-col px-8 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(36px,env(safe-area-inset-top))]">
          <div className="mt-auto mb-10 flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/splash-logo.png"
              alt={brand.name}
              className="h-auto w-[min(68vw,248px)] object-contain drop-shadow-[0_12px_40px_rgba(212,175,55,0.45)]"
            />
            <p className="mt-5 max-w-[280px] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d4af37]">
              {brand.tagline}
            </p>
          </div>
          {error && <p className="mb-3 text-center text-sm text-gold">{error}</p>}
          <div className="flex flex-col gap-3">
            <p className="text-center text-[11px] leading-relaxed text-muted">
              Ao continuar você declara ter 18+ e pode revisar{" "}
              <Link href="/termos" className="text-gold underline underline-offset-2">
                termos
              </Link>
              ,{" "}
              <Link href="/privacidade" className="text-gold underline underline-offset-2">
                privacidade
              </Link>{" "}
              e{" "}
              <Link href="/cookies" className="text-gold underline underline-offset-2">
                cookies
              </Link>
              .
            </p>
            <button
              className="rounded-full gold-fill px-6 py-[15px] text-[15px] font-bold tracking-wide"
              onClick={() => {
                setError("");
                setMode("signup");
              }}
            >
              Criar conta
            </button>
            <button
              className="rounded-full border border-[#d4af37]/70 bg-transparent px-6 py-[15px] text-[15px] font-bold tracking-wide text-white disabled:opacity-50"
              disabled={busy}
              onClick={() => {
                setError("");
                if (savedName) void resumeSession();
                else setMode("login");
              }}
            >
              {busy ? "Entrando..." : savedName ? `Continuar como ${savedName}` : "Entrar"}
            </button>
            <p className="mt-4 text-center text-[10px] leading-relaxed text-white/55">
              Conta salva na nuvem. Ao continuar você aceita os{" "}
              <Link href="/termos" className="underline">
                Termos
              </Link>{" "}
              e a{" "}
              <Link href="/privacidade" className="underline">
                Privacidade
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "login") {
    return (
      <div className="mx-auto flex h-full min-h-0 max-w-lg flex-col overflow-y-auto bg-paper px-5 py-6">
        <button className="self-start text-sm font-semibold text-muted" onClick={() => setMode("home")}>
          Voltar
        </button>
        <h2 className="mt-4 font-serif text-3xl tracking-tight">Entrar</h2>
        <p className="mt-2 text-sm text-sand">Use o e-mail e a senha da sua conta Valentine&apos;s.</p>
        <div className="mt-6 space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="E-mail"
            autoComplete="email"
            className="w-full rounded-2xl border border-line bg-panel px-4 py-4 outline-none"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Senha"
            autoComplete="current-password"
            className="w-full rounded-2xl border border-line bg-panel px-4 py-4 outline-none"
          />
        </div>
        {error && <p className="mt-3 text-sm text-gold">{error}</p>}
        <button
          disabled={busy}
          className="mt-6 w-full rounded-2xl gold-fill py-4 text-base font-bold disabled:opacity-40"
          onClick={() => void tryLogin()}
        >
          {busy ? "Entrando..." : "Entrar"}
        </button>
        <button
          className="mt-3 w-full rounded-2xl bg-panel py-4 text-sm font-semibold"
          onClick={() => setMode("signup")}
        >
          Criar conta nova
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-lg flex-col bg-paper">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-[max(16px,env(safe-area-inset-top))]">
        <button className="text-sm font-semibold text-muted" onClick={() => setMode("home")}>
          Voltar
        </button>
        <h2 className="mt-4 font-serif text-3xl tracking-tight">Criar conta</h2>
        <p className="mt-2 text-sm text-sand">Seus dados ficam salvos no Supabase — dá para entrar em qualquer aparelho.</p>
        <div className="mt-5 space-y-3 pb-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            autoComplete="name"
            className="w-full rounded-2xl border border-line bg-panel px-4 py-4 outline-none ring-gold focus:ring-2"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="E-mail"
            autoComplete="email"
            className="w-full rounded-2xl border border-line bg-panel px-4 py-4 outline-none ring-gold focus:ring-2"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Senha (mín. 6)"
            autoComplete="new-password"
            className="w-full rounded-2xl border border-line bg-panel px-4 py-4 outline-none ring-gold focus:ring-2"
          />
          <input
            value={age}
            onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))}
            inputMode="numeric"
            placeholder="Idade (18+)"
            className="w-full rounded-2xl border border-line bg-panel px-4 py-4 outline-none ring-gold focus:ring-2"
          />
          {ageNumber > 0 && ageNumber < 18 && (
            <p className="text-sm text-gold">{brand.name} é só para maiores de 18 anos.</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["mulher", "Mulher"],
                ["homem", "Homem"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setGender(id)}
                className={`rounded-2xl py-3 text-sm font-semibold ${gender === id ? "gold-fill" : "bg-panel text-sand"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Cidade"
            className="w-full rounded-2xl border border-line bg-panel px-4 py-4 outline-none"
          />
          <label className="block overflow-hidden rounded-[28px] border border-dashed border-line bg-panel">
            {preview ? (
              <Photo src={preview} alt="Prévia" className="aspect-[3/4] w-full object-cover" />
            ) : (
              <div className="grid aspect-[4/3] place-items-center px-6 text-center text-sm text-muted">
                Foto (opcional) — toque para escolher
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const next = e.target.files?.[0];
                if (!next) return;
                setFile(next);
                setPreview(URL.createObjectURL(next));
              }}
            />
          </label>
          <fieldset className="space-y-3 rounded-2xl border border-line bg-panel p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-gold">Consentimentos LGPD</legend>
            <label className="flex items-start gap-3 text-sm text-sand">
              <input
                type="checkbox"
                className="mt-1"
                checked={acceptAge}
                onChange={(e) => setAcceptAge(e.target.checked)}
              />
              <span>Confirmo que tenho 18 anos ou mais.</span>
            </label>
            <label className="flex items-start gap-3 text-sm text-sand">
              <input
                type="checkbox"
                className="mt-1"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <span>
                Li e aceito os{" "}
                <Link href="/termos" className="text-gold underline underline-offset-2">
                  Termos de serviço
                </Link>
                .
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-sand">
              <input
                type="checkbox"
                className="mt-1"
                checked={acceptPrivacy}
                onChange={(e) => setAcceptPrivacy(e.target.checked)}
              />
              <span>
                Autorizo o tratamento dos dados necessários conforme a{" "}
                <Link href="/privacidade" className="text-gold underline underline-offset-2">
                  Política de privacidade
                </Link>{" "}
                (LGPD). Coletamos só o essencial para a conta e o Match.
              </span>
            </label>
          </fieldset>
        </div>
      </div>
      <div className="shrink-0 border-t border-line bg-paper px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
        {error && <p className="mb-2 text-sm text-gold">{error}</p>}
        <button
          disabled={busy || (ageNumber > 0 && ageNumber < 18) || !acceptAge || !acceptTerms || !acceptPrivacy}
          className="w-full rounded-2xl gold-fill py-4 text-base font-bold disabled:opacity-40"
          onClick={() => void finish()}
        >
          {busy ? "Criando conta..." : `Entrar no ${brand.mark}`}
        </button>
        <p className="mt-2 text-center text-[10px] text-muted">
          Sem consentimento não criamos a conta. Você pode pedir exclusão a qualquer momento.
        </p>
      </div>
    </div>
  );
}
