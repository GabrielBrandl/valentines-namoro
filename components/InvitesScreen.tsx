"use client";

import { useState } from "react";
import { GOAL, STATES, signupsOf, stateName } from "@/lib/brazil";
import { INVITE_DAILY_CAP, REWARD_CAP } from "@/lib/catalog";
import { brand } from "@/lib/brand";
import { useProduct } from "@/lib/product";
import { Qr, Subpage } from "./product-ui";

export function InvitesScreen() {
  const product = useProduct();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/?convite=${product.state.inviteCode}&camada=${Math.min(4, product.state.layer + 1)}&origem=amigo`;
  const ranking = [...STATES]
    .map((state) => ({ ...state, total: signupsOf(state.uf, product.state.bumps) }))
    .sort((a, b) => b.total - a.total);
  const mine = signupsOf(product.state.uf, product.state.bumps);
  const left = Math.max(0, GOAL - mine);

  return (
    <Subpage
      title="Convites"
      lede="Quatro camadas, com link e código. Convite válido: a pessoa verifica a idade e usa o app por 3 dias. A recompensa fica no app, com teto por pessoa."
    >
      <div className="rounded-3xl bg-panel p-4">
        <p className="text-xs font-bold text-muted">Seu código</p>
        <p className="font-serif text-3xl tracking-tight">{product.state.inviteCode}</p>
        <p className="mt-1 text-sm text-sand">
          Você está na camada {product.state.layer}. Hoje: {product.state.invitesToday}/{INVITE_DAILY_CAP} convites. Recompensas: {product.state.rewards.length}/{REWARD_CAP}.
        </p>
        {product.state.invitedBy && <p className="mt-2 text-sm">Quem te chamou: {product.state.invitedBy}</p>}
        {product.state.events.some((event) => event.name === "auto-convite bloqueado") && (
          <p className="mt-2 text-sm text-gold">Auto-convite bloqueado. O seu código não conta para você.</p>
        )}
        <div className="mt-4 flex justify-center">
          <Qr text={link || product.state.inviteCode} />
        </div>
        <button
          className="mt-3 w-full rounded-2xl bg-paper py-3 text-sm font-semibold"
          onClick={() => navigator.clipboard.writeText(link).catch(() => undefined)}
        >
          Copiar link
        </button>
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const error = product.addInvite(name);
          setNote(error ?? `${name.trim()} entrou na sua rede. A recompensa sai quando a verificação e os 3 dias estiverem ok.`);
          if (!error) setName("");
        }}
      >
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nome de quem você chamou"
          className="min-w-0 flex-1 rounded-2xl bg-panel px-4 py-3 outline-none"
        />
        <button className="rounded-2xl gold-fill px-4 font-bold">Adicionar</button>
      </form>
      {note && <p className="mt-2 text-sm text-sand">{note}</p>}

      <div className="mt-4 space-y-2">
        {product.state.invites.length === 0 && <p className="text-sm text-muted">Sua rede aparece aqui.</p>}
        {product.state.invites.map((row) => (
          <article key={row.id} className="rounded-2xl bg-panel p-3">
            <p className="font-semibold">
              {row.name} · camada {row.layer}
            </p>
            <p className="text-sm text-muted">
              {row.verified && row.days >= 3 ? "Válido" : "Ainda não válido"} · {row.rewarded ? "recompensa entregue" : "sem recompensa"}
            </p>
            {!row.rewarded && (
              <button
                className="mt-2 text-sm font-semibold text-gold"
                onClick={() => setNote(product.validateInvite(row.id))}
              >
                Marcar verificação e 3 dias de uso
              </button>
            )}
          </article>
        ))}
      </div>

      <h2 className="mt-8 font-serif text-2xl">Seu estado</h2>
      <p className="mt-2 text-sm text-sand">
        {stateName(product.state.uf)}: {left === 0 ? "já pode abrir." : `faltam ${left.toLocaleString("pt-BR")} para abrir.`} Meta de {GOAL.toLocaleString("pt-BR")} cadastros.
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-panel">
        <div className="h-full gold-fill" style={{ width: `${Math.min(100, (mine / GOAL) * 100)}%` }} />
      </div>

      <h2 className="mt-8 font-serif text-2xl">Ranking dos estados</h2>
      <p className="mt-1 text-sm text-muted">Campanha por estado. O prêmio do convite válido são créditos dentro do {brand.name}.</p>
      <ol className="mt-3 space-y-1">
        {ranking.slice(0, 8).map((state, index) => (
          <li key={state.uf} className="flex justify-between rounded-xl bg-panel px-3 py-2 text-sm">
            <span>
              {index + 1}. {state.name}
            </span>
            <span className="font-semibold">{state.total.toLocaleString("pt-BR")}</span>
          </li>
        ))}
      </ol>
    </Subpage>
  );
}
