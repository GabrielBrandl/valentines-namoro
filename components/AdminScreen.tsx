"use client";

import { useMemo, useState } from "react";
import { GOAL, STATES, seedsOf, signupsOf, stateName } from "@/lib/brazil";
import { brand } from "@/lib/brand";
import { VERIFY_LABEL, useProduct } from "@/lib/product";
import { Qr, Subpage } from "./product-ui";

const GATE = "valentine";
const CHANNELS = ["influenciador", "vendedor", "evento", "parceiro"] as const;

export function AdminScreen() {
  const product = useProduct();
  const [gate, setGate] = useState("");
  const [open, setOpen] = useState(false);
  const [uf, setUf] = useState("SP");
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>("influenciador");
  const [load, setLoad] = useState<number[] | null>(null);
  const [busy, setBusy] = useState(false);
  const seeds = useMemo(() => seedsOf(uf), [uf]);
  const invites = seeds.reduce((sum, seed) => sum + seed.invites, 0);
  const verified = seeds.reduce((sum, seed) => sum + seed.verified, 0);
  const byLayer = [1, 2, 3, 4].map((layer) => {
    const rows = seeds.filter((seed) => seed.layer === layer);
    const sent = rows.reduce((sum, seed) => sum + seed.invites, 0);
    const ok = rows.reduce((sum, seed) => sum + seed.verified, 0);
    return { layer, sent, ok };
  });

  if (!open) {
    return (
      <Subpage title="Admin" lede="Painel local das 50 sementes por estado, da fila e da verificação. A senha só destrava esta tela neste aparelho.">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (gate.trim().toLowerCase() === GATE) setOpen(true);
          }}
        >
          <input
            value={gate}
            onChange={(event) => setGate(event.target.value)}
            type="password"
            placeholder="Senha do painel"
            className="min-w-0 flex-1 rounded-2xl bg-panel px-4 py-3 outline-none"
          />
          <button className="rounded-2xl gold-fill px-4 font-bold">Entrar</button>
        </form>
      </Subpage>
    );
  }

  const origin = typeof window === "undefined" ? "" : `${window.location.origin}/?origem=${channel}`;
  const avg = load && load.length ? Math.round(load.reduce((sum, item) => sum + item, 0) / load.length) : 0;

  return (
    <Subpage title="Admin" lede="Números das sementes são gerados para o painel. Não são 50 perfis de verdade em cada estado.">
      <section className="rounded-3xl bg-panel p-4">
        <h2 className="font-semibold">Verificação desta conta</h2>
        <p className="mt-1 text-sm text-muted">Agora: {VERIFY_LABEL[product.state.verification]}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["nao_verificado", "em_analise", "verificado"] as const).map((status) => (
            <button key={status} className="rounded-full bg-paper px-3 py-2 text-sm font-semibold" onClick={() => product.setVerification(status)}>
              {VERIFY_LABEL[status]}
            </button>
          ))}
          <button className="rounded-full bg-paper px-3 py-2 text-sm font-semibold" onClick={() => product.markReverify()}>
            Pedir reverificação
          </button>
        </div>
      </section>

      <section className="mt-4">
        <h2 className="font-serif text-2xl">Denúncias</h2>
        <div className="mt-2 space-y-2">
          {product.state.reports.length === 0 && <p className="text-sm text-muted">Nenhuma denúncia.</p>}
          {product.state.reports.map((report) => (
            <article key={report.id} className="rounded-2xl bg-panel p-3 text-sm">
              <p className="font-semibold">
                {report.reason === "Menor de idade" ? "Prioridade · " : ""}
                {report.targetName} · {report.reason}
              </p>
              {report.note && <p className="mt-1 text-sand">{report.note}</p>}
              <p className="mt-1 text-xs text-muted">{report.status}</p>
              {report.status === "aberto" && (
                <div className="mt-2 flex gap-3">
                  <button className="text-sm font-semibold" onClick={() => product.closeReport(report.id, false)}>
                    Encerrar e manter oculto
                  </button>
                  <button className="text-sm font-semibold text-gold" onClick={() => product.closeReport(report.id, true)}>
                    Devolver ao deck
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-serif text-2xl">Chamados</h2>
        <div className="mt-2 space-y-2">
          {product.state.tickets.length === 0 && <p className="text-sm text-muted">Nenhum chamado.</p>}
          {product.state.tickets.map((ticket) => (
            <article key={ticket.id} className="rounded-2xl bg-panel p-3 text-sm">
              <p className="font-semibold">{ticket.subject}</p>
              <p className="mt-1 text-sand">{ticket.body}</p>
              {ticket.status === "aberto" && (
                <button
                  className="mt-2 text-sm font-semibold text-gold"
                  onClick={() => product.replyTicket(ticket.id, "Recebemos. Vamos olhar e te responder por aqui.")}
                >
                  Responder
                </button>
              )}
              {ticket.reply && <p className="mt-2">{ticket.reply}</p>}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-2xl">50 sementes</h2>
          <select value={uf} onChange={(event) => setUf(event.target.value)} className="rounded-xl bg-panel px-3 py-2 text-sm">
            {STATES.map((state) => (
              <option key={state.uf} value={state.uf}>
                {state.uf}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-sm text-sand">
          {stateName(uf)}: {invites} convites, {verified} cadastros verificados. Conversão {invites ? Math.round((verified / invites) * 100) : 0}%. Custo estimado {verified * 2} créditos ({brand.mark} não transfere dinheiro).
        </p>
        <p className="mt-1 text-sm text-muted">
          Pré-lista do estado: {signupsOf(uf, product.state.bumps).toLocaleString("pt-BR")} / {GOAL.toLocaleString("pt-BR")}.
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          {byLayer.map((layer) => (
            <li key={layer.layer} className="flex justify-between rounded-xl bg-panel px-3 py-2">
              <span>Camada {layer.layer}</span>
              <span>
                {layer.ok}/{layer.sent} verificados
              </span>
            </li>
          ))}
        </ul>
        <div className="app-scroll mt-3 max-h-64 space-y-1 overflow-y-auto">
          {seeds.map((seed) => (
            <p key={seed.id} className="flex justify-between rounded-xl bg-panel px-3 py-2 text-sm">
              <span>
                {seed.name} · c{seed.layer}
              </span>
              <span>
                {seed.verified}/{seed.invites}
              </span>
            </p>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-serif text-2xl">Origem</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {CHANNELS.map((item) => (
            <button key={item} onClick={() => setChannel(item)} className={`rounded-full px-3 py-2 text-sm font-semibold ${channel === item ? "gold-fill" : "bg-panel"}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="mt-3 flex justify-center">
          <Qr text={origin || channel} />
        </div>
        <p className="mt-2 break-all text-center text-xs text-muted">{origin}</p>
      </section>

      <section className="mt-6">
        <h2 className="font-serif text-2xl">Teste de carga</h2>
        <p className="mt-1 text-sm text-sand">Doze aberturas da página inicial, daqui do navegador. É uma amostra, não um laboratório de infraestrutura.</p>
        <button
          className="mt-3 rounded-2xl gold-fill px-4 py-3 text-sm font-bold disabled:opacity-40"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const times: number[] = [];
            for (let index = 0; index < 12; index += 1) {
              const start = performance.now();
              await fetch(window.location.origin, { cache: "no-store" });
              times.push(performance.now() - start);
            }
            setLoad(times);
            setBusy(false);
          }}
        >
          {busy ? "Medindo..." : "Rodar 12 pedidos"}
        </button>
        {load && (
          <p className="mt-2 text-sm">
            Média {avg} ms · maior {Math.round(Math.max(...load))} ms
          </p>
        )}
      </section>
    </Subpage>
  );
}
