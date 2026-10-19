"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPendingReset, storePendingReset } from "@/lib/sync";
import { Subpage } from "./product-ui";

export function RecoverScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<{ email: string; at: number } | null>(null);

  useEffect(() => {
    setPending(getPendingReset());
  }, [sent]);

  function send() {
    setError("");
    const clean = email.trim();
    if (!clean.includes("@") || clean.length < 5) {
      setError("Informe um e-mail válido.");
      return;
    }
    storePendingReset(clean);
    setSent(true);
  }

  return (
    <Subpage
      title="Recuperar acesso"
      lede="Demo local: nenhum e-mail real é enviado. O link fictício fica guardado neste aparelho."
    >
      {sent ? (
        <article className="rounded-3xl bg-panel p-4">
          <p className="font-semibold text-gold">Link simulado enviado</p>
          <p className="mt-2 text-sm leading-relaxed text-sand">
            Em produção, você receberia um e-mail em <strong className="text-ink">{email.trim()}</strong>. Aqui
            só registramos o pedido em localStorage (<code className="text-xs">valentines-reset-pending</code>).
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
          <button className="w-full rounded-2xl gold-fill py-3 font-bold" onClick={send}>
            Enviar link
          </button>
          {pending && (
            <p className="text-xs text-muted">
              Pedido anterior: {pending.email} ·{" "}
              {new Date(pending.at).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
      )}
    </Subpage>
  );
}
