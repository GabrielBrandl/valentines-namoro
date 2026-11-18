"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export const COOKIE_KEY = "valentines-cookies";
export const COOKIE_EVENT = "valentines-cookies";

type Choice = "essential" | "all";

export function readCookieChoice(): Choice | null {
  try {
    const raw = localStorage.getItem(COOKIE_KEY);
    if (raw === "essential" || raw === "all") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!readCookieChoice());
  }, []);

  function save(choice: Choice) {
    try {
      localStorage.setItem(COOKIE_KEY, choice);
      localStorage.setItem(`${COOKIE_KEY}-at`, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVisible(false);
    try {
      window.dispatchEvent(new Event(COOKIE_EVENT));
    } catch {
      /* ignore */
    }
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-[#d4af37]/30 bg-[#0c0c0c]/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md"
    >
      <div className="mx-auto max-w-md">
        <h2 id="cookie-title" className="font-serif text-lg gold-text">
          Aviso de cookies
        </h2>
        <p className="mt-1.5 text-[13px] leading-snug text-sand">
          Cookies essenciais para login e segurança. Métricas opcionais só com o seu aceite.{" "}
          <Link href="/cookies" className="text-gold underline underline-offset-2">
            Saiba mais
          </Link>
          .
        </p>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="rounded-2xl bg-panel py-2.5 text-sm font-semibold ring-1 ring-[#d4af37]/30"
            onClick={() => save("essential")}
          >
            Só essenciais
          </button>
          <button type="button" className="rounded-2xl gold-fill py-2.5 text-sm font-bold" onClick={() => save("all")}>
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  );
}
