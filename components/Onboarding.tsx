"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Photo } from "./Media";
import { brand } from "@/lib/brand";
import { ufFromCity } from "@/lib/brazil";
import { INTERESTS, portrait } from "@/lib/seed";
import { compressImage, idbSet } from "@/lib/idb";
import { SMS_CODE, useProduct } from "@/lib/product";
import { useFecon } from "@/lib/store";
import { checkAuth, saveAuth } from "@/lib/sync";
import type { Gender, Me } from "@/lib/types";

const steps = ["Perfil", "Foto", "Confirmar"];

export function Onboarding() {
  const { saveMe, setPrefs } = useFecon();
  const product = useProduct();
  const router = useRouter();
  const [step, setStep] = useState(-1);
  const [uf] = useState(product.state.uf || "SP");
  const [captcha, setCaptcha] = useState(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sentCode, setSentCode] = useState(false);
  const [terms, setTerms] = useState(false);
  const [storeAge, setStoreAge] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("24");
  const [gender, setGender] = useState<Gender>("mulher");
  const [show, setShow] = useState<"todos" | Gender>("todos");
  const [city, setCity] = useState("");
  const [job, setJob] = useState("");
  const [bio, setBio] = useState("");
  const [picked, setPicked] = useState<string[]>(["Café", "Música"]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const ageNumber = Number(age);
  const phoneDigits = phone.replace(/\D/g, "");
  const canNext = useMemo(() => {
    if (step === 0) {
      return (
        name.trim().length >= 2 &&
        ageNumber >= 18 &&
        ageNumber <= 80 &&
        city.trim().length >= 2 &&
        bio.trim().length >= 8 &&
        picked.length >= 1
      );
    }
    if (step === 2) return captcha && terms && phoneDigits.length >= 10 && code === SMS_CODE;
    return true;
  }, [step, name, ageNumber, city, bio, picked.length, captcha, terms, phoneDigits.length, code]);

  function enterDemo() {
    setError("");
    const me: Me = {
      id: "me",
      name: "Gabriel",
      age: 24,
      city: "São Paulo",
      job: "Criativo",
      gender: "homem",
      bio: "Procurando alguém pra rir à toa, dividir um café bom e um reel sem pose.",
      interests: ["Café", "Música", "Cinema", "Viagem"],
      photos: [portrait("Gabriel")],
    };
    product.claim("11900000000");
    product.bootstrap("SP");
    saveMe(me);
    setPrefs({ show: "todos", ageMin: 18, ageMax: 40, maxKm: 50, verifiedOnly: false });
    router.push("/reels");
  }

  function tryLogin() {
    setError("");
    if (!loginEmail.trim() || !loginPassword) {
      setError("Informe e-mail e senha da demo.");
      return;
    }
    if (!checkAuth(loginEmail, loginPassword)) {
      setError("E-mail ou senha não conferem (demo local).");
      return;
    }
    enterDemo();
  }

  const openedProfile = useRef(false);
  useEffect(() => {
    if (openedProfile.current) return;
    if (new URLSearchParams(window.location.search).get("eu") !== "1") return;
    openedProfile.current = true;
    enterDemo();
    // O perfil só é criado uma vez, na abertura deste link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function finish() {
    setError("");
    if (ageNumber < 18) {
      setError(`${brand.name} é só para maiores de 18 anos.`);
      return;
    }
    const blocked = product.claim(phoneDigits);
    if (blocked) {
      setError(blocked);
      return;
    }
    setBusy(true);
    try {
      let photos = [portrait(name.trim())];
      if (file) {
        const blob = await compressImage(file);
        const key = `photo-${crypto.randomUUID()}`;
        await idbSet(key, blob);
        photos = [`idb:${key}`];
      }
      const me: Me = {
        id: "me",
        name: name.trim(),
        age: ageNumber,
        city: city.trim(),
        job: job.trim() || "Em descoberta",
        gender,
        bio: bio.trim(),
        interests: picked.slice(0, 6),
        photos,
      };
      if (email.trim() && password.length >= 4) {
        saveAuth(email, password);
      }
      saveMe(me);
      setPrefs({ show, ageMin: 18, ageMax: 45, maxKm: 50, verifiedOnly: false });
      product.activate({ phone: phoneDigits, uf: ufFromCity(city, uf), signal: storeAge ? "loja" : "nenhum" });
      router.push("/reels");
    } catch {
      setError("Não consegui guardar a foto. Tente outra imagem.");
    } finally {
      setBusy(false);
    }
  }

  if (step < 0) {
    return (
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col overflow-hidden bg-[#050505]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 50% 28%, rgba(212,175,55,0.22) 0%, rgba(166,124,0,0.08) 38%, transparent 68%), radial-gradient(ellipse 70% 40% at 50% 100%, rgba(212,175,55,0.12) 0%, transparent 55%), linear-gradient(180deg, #0a0a0a 0%, #050505 45%, #000 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
          }}
        />
        <div className="pointer-events-none absolute left-1/2 top-[18%] h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-[#d4af37]/10 blur-3xl" />
        <div className="relative z-10 flex min-h-dvh flex-col px-8 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(36px,env(safe-area-inset-top))]">
          <div className="mt-auto mb-10 flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/splash.jpg"
              alt={brand.name}
              className="h-auto w-[min(68vw,248px)] object-contain drop-shadow-[0_12px_40px_rgba(212,175,55,0.45)]"
            />
            <p className="mt-5 max-w-[280px] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d4af37]">
              {brand.tagline}
            </p>
          </div>
          {error && <p className="mb-3 text-center text-sm text-gold">{error}</p>}
          {showLogin ? (
            <div className="mb-3 space-y-2">
              <input
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                type="email"
                placeholder="E-mail (demo)"
                className="w-full rounded-2xl border border-[#d4af37]/40 bg-black/50 px-4 py-3 text-white outline-none"
              />
              <input
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                type="password"
                placeholder="Senha (demo)"
                className="w-full rounded-2xl border border-[#d4af37]/40 bg-black/50 px-4 py-3 text-white outline-none"
              />
              <button className="w-full rounded-full gold-fill px-6 py-[15px] text-[15px] font-bold" onClick={tryLogin}>
                Entrar com e-mail
              </button>
              <button className="w-full text-sm text-white/60" onClick={() => setShowLogin(false)}>
                Voltar
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                className="rounded-full gold-fill px-6 py-[15px] text-[15px] font-bold tracking-wide"
                onClick={() => setStep(0)}
              >
                Criar conta
              </button>
              <button
                className="rounded-full border border-[#d4af37]/70 bg-transparent px-6 py-[15px] text-[15px] font-bold tracking-wide text-white"
                onClick={enterDemo}
              >
                Entrar
              </button>
              <button
                className="text-sm font-semibold text-[#d4af37]/90"
                onClick={() => setShowLogin(true)}
              >
                Entrar com e-mail (demo)
              </button>
              <div className="my-1 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/25" />
                <span className="text-xs font-medium text-white/70">ou</span>
                <span className="h-px flex-1 bg-white/25" />
              </div>
              <div className="flex items-center justify-center gap-5">
                {(["G", "A", "f"] as const).map((label) => (
                  <button
                    key={label}
                    type="button"
                    aria-label={`Entrar com ${label === "G" ? "Google" : label === "A" ? "Apple" : "Facebook"} (demo)`}
                    className="grid h-11 w-11 place-items-center rounded-full border border-[#d4af37]/55 bg-black/40 text-sm font-bold text-[#d4af37]"
                    onClick={enterDemo}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Link href="/recuperar" className="mt-2 text-center text-xs text-white/55 underline">
                Recuperar acesso
              </Link>
              <p className="mt-4 text-center text-[10px] leading-relaxed text-white/55">
                Ao continuar, você concorda com os{" "}
                <Link href="/termos" className="underline">
                  Termos de Uso
                </Link>{" "}
                e a{" "}
                <Link href="/privacidade" className="underline">
                  Política de Privacidade
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-paper px-5 py-6 text-ink">
      <div className="flex items-center gap-2">
        {steps.map((label, index) => (
          <div key={label} className="flex-1">
            <div className={`h-1.5 rounded-full ${index <= step ? "gold-fill" : "bg-line"}`} />
            <p className={`mt-1 text-center text-[11px] font-semibold leading-tight ${index === step ? "text-gold" : "text-muted"}`}>{label}</p>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="mt-3 space-y-4">
          <h2 className="font-serif text-3xl tracking-tight">Seu perfil</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            className="w-full rounded-2xl border border-line bg-panel px-4 py-4 outline-none ring-gold focus:ring-2"
          />
          <input
            value={age}
            onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))}
            inputMode="numeric"
            placeholder="Idade"
            className="w-full rounded-2xl border border-line bg-panel px-4 py-4 outline-none ring-gold focus:ring-2"
          />
          {ageNumber > 0 && ageNumber < 18 && (
            <p className="text-sm text-gold-2">{brand.name} é só para maiores de 18 anos.</p>
          )}
          <Choice
            label="Eu sou"
            value={gender}
            options={[
              ["mulher", "Mulher"],
              ["homem", "Homem"],
            ]}
            onChange={(value) => setGender(value as Gender)}
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Cidade"
            className="w-full rounded-2xl border border-line bg-panel px-4 py-4 outline-none ring-gold focus:ring-2"
          />
          <input
            value={job}
            onChange={(e) => setJob(e.target.value)}
            placeholder="O que você faz (opcional)"
            className="w-full rounded-2xl border border-line bg-panel px-4 py-4 outline-none ring-gold focus:ring-2"
          />
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Uma bio curta, do jeito que você falaria pessoalmente."
            rows={3}
            className="w-full resize-none rounded-2xl border border-line bg-panel px-4 py-4 outline-none ring-gold focus:ring-2"
          />
          <p className="text-sm text-muted">Interesses</p>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => {
              const on = picked.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() =>
                    setPicked((curr) =>
                      on ? curr.filter((item) => item !== interest) : curr.length >= 6 ? curr : [...curr, interest],
                    )
                  }
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${on ? "gold-fill" : "bg-panel text-sand"}`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
          <Choice
            label="Quero conhecer"
            value={show}
            options={[
              ["todos", "Todo mundo"],
              ["mulher", "Mulheres"],
              ["homem", "Homens"],
            ]}
            onChange={(value) => setShow(value as "todos" | Gender)}
          />
          <p className="text-xs text-muted">E-mail e senha opcionais (demo local, sem servidor).</p>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="E-mail (opcional)"
            className="w-full rounded-2xl border border-line bg-panel px-4 py-3 outline-none"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Senha (mín. 4, opcional)"
            className="w-full rounded-2xl border border-line bg-panel px-4 py-3 outline-none"
          />
        </div>
      )}

      {step === 1 && (
        <div className="mt-3">
          <h2 className="font-serif text-3xl tracking-tight">Uma foto já ajuda.</h2>
          <label className="mt-5 block overflow-hidden rounded-[28px] border border-dashed border-line bg-panel">
            {preview ? (
              <Photo src={preview} alt="Prévia" className="aspect-[3/4] w-full object-cover" />
            ) : (
              <div className="grid aspect-[3/4] place-items-center px-6 text-center text-muted">
                Toque para escolher uma foto da galeria
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
          <p className="mt-3 text-sm text-muted">A foto fica salva só neste navegador. Pode pular e usar um avatar.</p>
        </div>
      )}

      {step === 2 && (
        <div className="mt-3 space-y-4">
          <h2 className="font-serif text-3xl tracking-tight">Confirme que você é maior.</h2>
          <p className="text-sm text-sand">Toque no coração. Isso segura o cadastro contra robô.</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["estrela", "★"],
              ["coracao", "♥"],
              ["quadrado", "■"],
            ].map(([id, glyph]) => (
              <button
                key={id}
                className={`rounded-2xl py-4 text-2xl ${captcha && id === "coracao" ? "gold-fill" : "bg-panel"}`}
                onClick={() => {
                  if (id === "coracao") {
                    setCaptcha(true);
                    setError("");
                  } else {
                    setCaptcha(false);
                    setError("Toque no coração.");
                  }
                }}
              >
                {glyph}
              </button>
            ))}
          </div>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value.replace(/[^\d\s()-]/g, "").slice(0, 16))}
            inputMode="tel"
            placeholder="Celular com DDD"
            className="w-full rounded-2xl border border-line bg-panel px-4 py-4 outline-none"
          />
          <button
            className="rounded-2xl bg-panel px-4 py-3 text-sm font-semibold"
            onClick={() => {
              setSentCode(true);
              setCode(SMS_CODE);
            }}
          >
            Enviar código
          </button>
          {sentCode && (
            <p className="text-sm text-sand">Demo sem SMS real. Código preenchido: {SMS_CODE}</p>
          )}
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            placeholder="Código"
            className="w-full rounded-2xl border border-line bg-panel px-4 py-4 outline-none"
          />
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={storeAge} onChange={(event) => setStoreAge(event.target.checked)} />
            A loja do celular me classifica como 18+.
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} />
            <span>
              Li e aceito os <Link className="font-semibold text-gold" href="/termos" target="_blank" rel="noreferrer">termos</Link> e a{" "}
              <Link className="font-semibold text-gold" href="/privacidade" target="_blank" rel="noreferrer">privacidade</Link>.
            </span>
          </label>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-gold-2">{error}</p>}

      <div className="mt-auto flex gap-3 pt-8 pb-[max(12px,env(safe-area-inset-bottom))]">
        <button
          className="rounded-2xl bg-panel px-5 py-3 font-semibold"
          onClick={() => setStep((s) => s - 1)}
        >
          Voltar
        </button>
        {step < 2 ? (
          <button
            disabled={!canNext}
            className="flex-1 rounded-2xl gold-fill px-5 py-3 font-bold disabled:opacity-40"
            onClick={() => setStep((s) => s + 1)}
          >
            Continuar
          </button>
        ) : (
          <button
            disabled={busy || !canNext}
            className="flex-1 rounded-2xl gold-fill px-5 py-3 font-bold disabled:opacity-40"
            onClick={finish}
          >
            {busy ? "Salvando..." : `Entrar no ${brand.mark}`}
          </button>
        )}
      </div>
    </div>
  );
}

function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm text-muted">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map(([id, text]) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`rounded-2xl px-2 py-3 text-sm font-semibold ${value === id ? "gold-fill" : "bg-panel text-sand"}`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
