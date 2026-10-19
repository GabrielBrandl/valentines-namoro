"use client";

import { useEffect, useRef, useState } from "react";
import { PersonSheet } from "./PersonSheet";
import { Photo } from "./Media";
import { IconHeart, IconX } from "./Icons";
import { useProduct } from "@/lib/product";
import { useFecon } from "@/lib/store";
import type { Person, Prefs } from "@/lib/types";
import { Paywall, VerifiedMark } from "./product-ui";

export function Discover() {
  const { deck, pass, like, undo, resetDeck, prefs, setPrefs, pendingMatchId, history } = useFecon();
  const product = useProduct();
  const [indexPhoto, setIndexPhoto] = useState(0);
  const [open, setOpen] = useState<Person | null>(null);
  const [filters, setFilters] = useState(false);
  const [paywall, setPaywall] = useState<null | "super" | "undo">(null);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [fly, setFly] = useState<null | { x: number; y: number }>(null);
  const start = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const dragging = useRef(false);
  const busy = useRef(false);
  const visible = deck.filter((item) => !product.state.hidden.includes(item.id));
  const person = visible[0];
  const upcoming = visible[1];
  const canUndo = history.length > 0;

  useEffect(() => {
    setIndexPhoto(0);
  }, [person?.id]);

  function decide(action: "pass" | "like" | "super") {
    if (!person || busy.current) return;
    if (person.sponsored && action === "super") {
      setDrag({ x: 0, y: 0, active: false });
      return;
    }
    if (action === "super" && !product.consume("super")) {
      setDrag({ x: 0, y: 0, active: false });
      setPaywall("super");
      return;
    }
    product.track(action === "pass" ? "passou" : action === "super" ? "super" : "curtida");
    busy.current = true;
    const x = action === "pass" ? -560 : 520;
    const y = action === "super" ? -180 : 24;
    dragging.current = false;
    setDrag({ x, y, active: false });
    setFly({ x, y });
    const id = person.id;
    window.setTimeout(() => {
      if (action === "pass") pass(id);
      else like(id, action === "super");
      setFly(null);
      setDrag({ x: 0, y: 0, active: false });
      busy.current = false;
    }, 240);
  }

  function requestUndo() {
    if (!canUndo || busy.current) return;
    if (!product.consume("undo")) {
      setPaywall("undo");
      return;
    }
    product.track("desfazer");
    undo();
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (!person || open || filters || paywall || pendingMatchId) return;
      if (event.key === "ArrowLeft") decide("pass");
      if (event.key === "ArrowRight") decide("like");
      if (event.key === "ArrowUp") decide("super");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const x = fly?.x ?? drag.x;
  const y = fly?.y ?? drag.y;
  const rotate = x / 18;

  return (
    <div className="relative flex h-full flex-col bg-paper px-3 pt-[max(10px,env(safe-area-inset-top))]">
      <header className="relative flex shrink-0 items-center justify-center pb-3">
        <h1 className="font-serif text-3xl tracking-[0.12em] gold-text">Match</h1>
        <button
          className="absolute right-1 grid h-10 w-10 place-items-center rounded-full text-gold"
          onClick={() => setFilters(true)}
          aria-label="Filtros"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className="relative mx-auto min-h-0 w-full max-w-[420px] flex-1">
        {person ? (
          <>
            {upcoming && (
              <article className="absolute inset-x-3 top-3 bottom-0 scale-[0.96] overflow-hidden rounded-[28px] bg-panel opacity-70">
                <Photo src={upcoming.photos[0]} alt="" className="h-full w-full object-cover" />
              </article>
            )}
            <article
              className="absolute inset-0 touch-none overflow-hidden rounded-[28px] bg-panel shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
              style={{
                transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg)`,
                transition: drag.active ? "none" : "transform .26s cubic-bezier(.2,.8,.2,1)",
              }}
              onPointerDown={(e) => {
                if (busy.current) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                dragging.current = true;
                start.current = { x: e.clientX, y: e.clientY, px: e.clientX, py: e.clientY };
                setDrag({ x: 0, y: 0, active: true });
              }}
              onPointerMove={(e) => {
                if (!dragging.current) return;
                setDrag({
                  x: e.clientX - start.current.x,
                  y: e.clientY - start.current.y,
                  active: true,
                });
              }}
              onPointerUp={(e) => {
                if (!dragging.current) return;
                dragging.current = false;
                const dx = e.clientX - start.current.x;
                const dy = e.clientY - start.current.y;
                const moved = Math.hypot(e.clientX - start.current.px, e.clientY - start.current.py);
                if (moved < 8) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const local = e.clientX - rect.left;
                  if (local > rect.width * 0.62) {
                    setIndexPhoto((n) => Math.min(person.photos.length - 1, n + 1));
                  } else if (local < rect.width * 0.38) {
                    setIndexPhoto((n) => Math.max(0, n - 1));
                  } else {
                    setOpen(person);
                  }
                  setDrag({ x: 0, y: 0, active: false });
                  return;
                }
                if (dx > 110) decide("like");
                else if (dx < -110) decide("pass");
                else if (dy < -120 && Math.abs(dx) < 90) decide("super");
                else setDrag({ x: 0, y: 0, active: false });
              }}
            >
              <Photo src={person.photos[indexPhoto]} alt={person.name} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 top-0 flex gap-1 p-3">
                {person.photos.map((_, i) => (
                  <span key={i} className={`h-1 flex-1 rounded-full ${i === indexPhoto ? "gold-fill" : "bg-white/35"}`} />
                ))}
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 pb-28 text-white">
                <h2 className="font-serif text-[34px] leading-none tracking-tight">
                  {person.name}, {person.age}
                  <VerifiedMark on={person.verified} />
                </h2>
                <p className="mt-2 text-sm text-white/85">
                  {person.city} · {person.distanceKm} km
                  {person.online ? " · online" : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {person.interests.slice(0, 4).map((tag) => (
                    <span key={tag} className="rounded-full border border-white/25 bg-black/35 px-3 py-1 text-xs font-semibold text-white/90">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-white/90">{person.bio}</p>
              </div>
            </article>
          </>
        ) : (
          <div className="grid h-full place-items-center rounded-[28px] bg-panel p-8 text-center">
            <div>
              <p className="font-serif text-4xl gold-text">Acabou por aqui.</p>
              <p className="mt-2 text-muted">Você já viu todo mundo desse filtro.</p>
              <button className="mt-5 rounded-2xl gold-fill px-5 py-3 font-bold" onClick={resetDeck}>
                Ver de novo
              </button>
            </div>
          </div>
        )}
      </div>

      {person && (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex items-end justify-center gap-3 sm:gap-5">
          <button
            aria-label="Desfazer"
            disabled={!canUndo}
            className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-[#d4af37]/35 bg-[#121212] text-[#d4af37] shadow-lg disabled:opacity-35"
            onClick={requestUndo}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 7H4v5M4 7c2.5-3 6-5 10-5a9 9 0 1 1-6.7 15.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            aria-label="Não"
            className="pointer-events-auto grid h-14 w-14 place-items-center rounded-full border border-[#d4af37]/45 bg-[#121212] text-[#d4af37] shadow-lg"
            onClick={() => decide("pass")}
          >
            <IconX className="h-7 w-7" />
          </button>
          <button
            aria-label="Super curtida"
            className="pointer-events-auto grid h-12 w-12 place-items-center rounded-full border border-[#d4af37]/55 bg-[#1a1608] text-[#d4af37] shadow-lg"
            onClick={() => decide("super")}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
              <path d="M12 2.5l2.7 6.2 6.8.6-5.1 4.5 1.5 6.6L12 17.2 6.1 20.4l1.5-6.6L2.5 9.3l6.8-.6L12 2.5z" />
            </svg>
          </button>
          <button
            aria-label="Curtir"
            className="pointer-events-auto grid h-[72px] w-[72px] place-items-center rounded-full gold-fill shadow-[0_0_28px_rgba(212,175,55,0.55)]"
            onClick={() => decide("like")}
          >
            <IconHeart className="h-8 w-8 text-[#120e05]" />
          </button>
          <button
            aria-label="Ver perfil"
            className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-[#d4af37]/35 bg-[#121212] text-[#d4af37] shadow-lg"
            onClick={() => setOpen(person)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 11v5M12 8.5h.01" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {open && (
        <PersonSheet
          person={open}
          onClose={() => setOpen(null)}
          onPass={() => {
            pass(open.id);
            setOpen(null);
          }}
          onLike={() => {
            like(open.id);
            setOpen(null);
          }}
          onSuper={() => {
            like(open.id, true);
            setOpen(null);
          }}
        />
      )}
      {paywall && <Paywall kind={paywall} onClose={() => setPaywall(null)} />}
      {filters && (
        <Filters
          prefs={prefs}
          onClose={() => setFilters(false)}
          onSave={(next) => {
            setPrefs(next);
            setFilters(false);
          }}
        />
      )}
    </div>
  );
}

function Filters({
  prefs,
  onClose,
  onSave,
}: {
  prefs: Prefs;
  onClose: () => void;
  onSave: (prefs: Prefs) => void;
}) {
  const [draft, setDraft] = useState(prefs);
  const [geoNote, setGeoNote] = useState("");

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoNote("Geolocalização indisponível neste navegador.");
      return;
    }
    setGeoNote("Buscando…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDraft((d) => ({
          ...d,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }));
        setGeoNote("Localização salva. Distâncias do deck foram ajustadas.");
      },
      () => setGeoNote("Não foi possível obter a localização."),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-black/60 md:place-items-center" onClick={onClose}>
      <div className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-panel p-6 shadow-2xl md:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif text-3xl tracking-tight gold-text">Quem aparece</h3>
        <p className="mt-4 text-sm font-semibold text-muted">Mostrar</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(
            [
              ["todos", "Todos"],
              ["mulher", "Mulheres"],
              ["homem", "Homens"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setDraft({ ...draft, show: id })}
              className={`rounded-2xl py-3 text-sm font-semibold ${draft.show === id ? "gold-fill" : "bg-black"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-5 text-sm text-muted">
          Idade: {draft.ageMin} – {draft.ageMax}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <input
            type="range"
            min={18}
            max={draft.ageMax}
            value={draft.ageMin}
            onChange={(e) => setDraft({ ...draft, ageMin: Number(e.target.value) })}
          />
          <input
            type="range"
            min={draft.ageMin}
            max={60}
            value={draft.ageMax}
            onChange={(e) => setDraft({ ...draft, ageMax: Number(e.target.value) })}
          />
        </div>
        <p className="mt-5 text-sm text-muted">Distância máxima: {draft.maxKm ?? 50} km</p>
        <input
          type="range"
          min={5}
          max={100}
          step={5}
          value={draft.maxKm ?? 50}
          onChange={(e) => setDraft({ ...draft, maxKm: Number(e.target.value) })}
          className="mt-2 w-full"
        />
        <label className="mt-5 flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={Boolean(draft.verifiedOnly)}
            onChange={(e) => setDraft({ ...draft, verifiedOnly: e.target.checked })}
          />
          Só perfis verificados
        </label>
        <button
          type="button"
          className="mt-4 w-full rounded-2xl bg-black py-3 text-sm font-semibold text-gold"
          onClick={useMyLocation}
        >
          Usar minha localização
        </button>
        {geoNote && <p className="mt-2 text-xs text-sand">{geoNote}</p>}
        {draft.lat != null && (
          <p className="mt-1 text-xs text-muted">
            Lat {draft.lat.toFixed(3)} · Lng {draft.lng?.toFixed(3)}
          </p>
        )}
        <button className="mt-6 w-full rounded-2xl gold-fill py-3 font-bold" onClick={() => onSave(draft)}>
          Aplicar
        </button>
      </div>
    </div>
  );
}
