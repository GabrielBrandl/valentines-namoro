"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Subpage } from "./product-ui";

export function RecoverScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    setError("");
    const clean = email.trim().toLowerCase();
    if (!clean.includes("@") || clean.length < 5) {
      setError("Informe um e-mail válido.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(clean, {
        redirectTo,
      });
      if (resetError) throw new Error(resetError.message);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o e-mail.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Subpage
      title="Recuperar acesso"
      lede="Enviamos um link de redefinição para o e-mail da sua conta Valentine's."
    >
      {sent ? (
        <article className="rounded-3xl bg-panel p-4">
          <p className="font-semibold text-gold">E-mail enviado</p>
          <p className="mt-2 text-sm leading-relaxed text-sand">
            Se existir conta para <strong className="text-ink">{email.trim()}</strong>, você recebe o link
            em alguns minutos. Confira também o spam.
          </p>
          <Link href="/" className="mt-4 inline-block rounded-2xl gold-fill px-5 py-3 text-sm font-bold">
            Voltar ao início
          </Link>
        </article>
      ) : (
        <div className="space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Seu e-mail"
            className="w-full rounded-2xl border border-line bg-panel px-4 py-4 outline-none"
          />
          {error && <p className="text-sm text-gold">{error}</p>}
          <button
            disabled={busy}
            className="w-full rounded-2xl gold-fill py-3 font-bold disabled:opacity-40"
            onClick={() => void send()}
          >
            {busy ? "Enviando..." : "Enviar link"}
          </button>
        </div>
      )}
    </Subpage>
  );
}
