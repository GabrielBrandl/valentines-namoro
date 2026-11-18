"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "valentines-cookies";

type Choice = "essential" | "all";

function readChoice(): Choice | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === "essential" || raw === "all") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!readChoice());
  }, []);

  function save(choice: Choice) {
    try {
      localStorage.setItem(KEY, choice);
      localStorage.setItem(`${KEY}-at`, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-[#d4af37]/30 bg-[#0c0c0c]/95 p-4 shadow-[0_-12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md"
    >
      <div className="mx-auto max-w-md">
        <h2 id="cookie-title" className="font-serif text-xl gold-text">
          Aviso de cookies
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-sand">
          Usamos cookies essenciais para login e segurança. Métricas opcionais só entram com o seu aceite.{" "}
          <Link href="/cookies" className="text-gold underline underline-offset-2">
            Saiba mais
          </Link>
          .
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="rounded-2xl bg-panel py-3 text-sm font-semibold ring-1 ring-[#d4af37]/30"
            onClick={() => save("essential")}
          >
            Só essenciais
          </button>
          <button type="button" className="rounded-2xl gold-fill py-3 text-sm font-bold" onClick={() => save("all")}>
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  );
}
