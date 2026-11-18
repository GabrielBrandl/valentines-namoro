"use client";

import { useState } from "react";
import Link from "next/link";
import { CLUB_PERKS, brl, tierLabel } from "@/lib/ecosystem";
import { useCommerce } from "@/lib/commerce";
import { useProduct } from "@/lib/product";

export function ClubScreen() {
  const commerce = useCommerce();
  const product = useProduct();
  const [note, setNote] = useState("");

  function redeem(_perkId: string, cost: number, title: string) {
    if (!commerce.redeemPoints(cost)) {
      setNote("Pontos insuficientes. Compre no Shopping ou Delivery para acumular.");
      return;
    }
    setNote(`Resgatado: ${title}. Continue comprando e indicando para subir de nível.`);
  }

  return (
    <div className="app-scroll h-full overflow-y-auto bg-paper px-4 pb-28 pt-[max(16px,env(safe-area-inset-top))]">
      <header>
        <h1 className="font-serif text-3xl tracking-tight gold-text">Valentine&apos;s Club</h1>
        <p className="mt-1 text-sm text-muted">Cashback, cupons, afiliados e benefícios em uma só conta</p>
      </header>

      <section className="mt-5 rounded-3xl gold-border bg-panel p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gold">Seu nível</p>
        <p className="mt-1 font-serif text-4xl">{tierLabel(commerce.tier)}</p>
        <p className="mt-2 text-sm text-sand">{commerce.points} pontos · plano {product.planName || "Livre"}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
          <div className="rounded-2xl bg-black/40 px-3 py-3">
            <p className="font-bold text-gold">{commerce.affiliateCode}</p>
            <p className="mt-1 text-muted">Código afiliado</p>
          </div>
          <div className="rounded-2xl bg-black/40 px-3 py-3">
            <p className="font-bold text-gold">{commerce.affiliateSales}</p>
            <p className="mt-1 text-muted">Indicações / vendas</p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-2xl">Benefícios</h2>
        <div className="mt-3 space-y-2">
          {CLUB_PERKS.map((perk) => {
            const locked =
              (perk.tier === "gold" && commerce.tier === "livre") ||
              (perk.tier === "black" && commerce.tier !== "black");
            return (
              <article key={perk.id} className="rounded-3xl bg-panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{perk.title}</p>
                    <p className="mt-1 text-sm text-sand">{perk.detail}</p>
                    <p className="mt-2 text-xs text-gold">
                      {perk.pointsCost} pts · nível {tierLabel(perk.tier)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={locked || commerce.points < perk.pointsCost}
                    onClick={() => redeem(perk.id, perk.pointsCost, perk.title)}
                    className="shrink-0 rounded-full gold-fill px-3 py-2 text-xs font-bold text-black disabled:opacity-40"
                  >
                    Resgatar
                  </button>
                </div>
                {locked ? <p className="mt-2 text-[11px] text-muted">Disponível a partir do nível {tierLabel(perk.tier)}.</p> : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-[#d4af37]/35 bg-black/40 p-4 text-sm text-sand">
        <p className="font-semibold text-gold">Como ganhar pontos</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Compras no Shopping e Delivery</li>
          <li>Indicar produtos com seu código afiliado</li>
          <li>Publicar reels com produto marcado (social commerce)</li>
          <li>Convites que viram conta ativa</li>
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link href="/shopping" className="rounded-2xl gold-fill py-3 text-center text-sm font-bold text-black">
            Shopping
          </Link>
          <Link href="/delivery" className="rounded-2xl border border-[#d4af37]/50 py-3 text-center text-sm font-bold text-gold">
            Delivery
          </Link>
        </div>
      </section>

      {commerce.orders.length > 0 && (
        <section className="mt-8">
          <h2 className="font-serif text-2xl">Pedidos recentes</h2>
          <ul className="mt-3 space-y-2">
            {commerce.orders.slice(0, 8).map((order) => (
              <li key={order.id} className="rounded-2xl bg-panel px-4 py-3 text-sm">
                <p className="font-semibold">
                  {order.kind === "delivery" ? "Delivery" : "Shopping"} · {order.sellerName}
                </p>
                <p className="text-xs text-muted">
                  {brl(order.totalCents)} · {order.status}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {note ? <p className="mt-4 text-sm text-gold">{note}</p> : null}
    </div>
  );
}
