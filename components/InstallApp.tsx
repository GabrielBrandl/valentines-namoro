"use client";

import { useEffect, useRef, useState } from "react";
import { brand } from "@/lib/brand";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "valentines-install-dismiss";

function isStandalone() {
  if (typeof window === "undefined") return true;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const ios = "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || ios;
}

function platformLabel() {
  if (typeof navigator === "undefined") return "neste aparelho";
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return "no Android";
  if (/windows/.test(ua)) return "no Windows";
  if (/linux/.test(ua) && !/android/.test(ua)) return "no Linux";
  if (/mac os|macintosh/.test(ua)) return "no Mac";
  if (/iphone|ipad|ipod/.test(ua)) return "no iPhone";
  return "neste aparelho";
}

/** Banner flutuante para instalar como app (Android / Windows / Linux via Chrome/Edge). */
export function InstallApp({ compact = false }: { compact?: boolean }) {
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [hint, setHint] = useState("");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    function onPrompt(e: Event) {
      e.preventDefault();
      deferred.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    }
    function onInstalled() {
      setInstalled(true);
      setVisible(false);
      deferred.current = null;
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Desktop/Android: mostra dica mesmo sem evento (Safari/iOS)
    const timer = window.setTimeout(() => {
      if (!deferred.current && !isStandalone()) setVisible(true);
    }, 4500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(timer);
    };
  }, []);

  if (installed || !visible) return null;

  async function install() {
    const evt = deferred.current;
    if (!evt) {
      setHint(
        "Chrome/Edge: ícone ⊕ na barra ou menu → Instalar app. Android: menu ⋮ → Instalar app. iPhone: Compartilhar → Adicionar à Tela de Início.",
      );
      return;
    }
    await evt.prompt();
    const choice = await evt.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    } else {
      setHint("Sem problema — você pode instalar quando quiser em /lojas.");
    }
    deferred.current = null;
  }

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="w-full rounded-2xl gold-fill py-3 text-sm font-bold text-black"
      >
        Instalar {brand.mark} {platformLabel()}
      </button>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-[60] flex justify-center px-3 md:bottom-6">
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-2xl border border-[#d4af37]/40 bg-black/92 p-3 shadow-2xl backdrop-blur">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" className="h-11 w-11 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gold">Instalar {brand.name}</p>
          <p className="truncate text-[11px] text-muted">App {platformLabel()} · seus vídeos ficam salvos</p>
          {hint ? <p className="mt-1 text-[10px] text-sand">{hint}</p> : null}
        </div>
        <button type="button" onClick={() => void install()} className="shrink-0 rounded-full gold-fill px-3 py-2 text-xs font-bold text-black">
          Instalar
        </button>
        <button type="button" aria-label="Agora não" onClick={dismiss} className="shrink-0 px-1 text-lg leading-none text-muted">
          ×
        </button>
      </div>
    </div>
  );
}
