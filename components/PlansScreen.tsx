"use client";

import { useState } from "react";
import { PLANS, brl, type PlanId } from "@/lib/catalog";
import { useProduct } from "@/lib/product";
import { Checkout, Subpage } from "./product-ui";

export function PlansScreen() {
  const product = useProduct();
  const [annual, setAnnual] = useState(true);
  const [buy, setBuy] = useState<null | { id: PlanId; founder: boolean; cents: number; title: string }>(null);
  const active = product.planName;
  return (
    <Subpage
      title="Planos"
      lede="Plus, Gold, Platinum e Black. O conjunto de benefícios é o inicial do produto e pode ser ajustado antes do lançamento."
    >
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setAnnual(false)}
          className={`rounded-2xl py-3 text-sm font-semibold ${!annual ? "gold-fill" : "bg-panel text-muted"}`}
        >
          Mensal
        </button>
        <button
          onClick={() => setAnnual(true)}
          className={`rounded-2xl py-3 text-sm font-semibold ${annual ? "gold-fill" : "bg-panel text-muted"}`}
        >
          Anual
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {PLANS.map((plan) => {
          const cents = annual ? plan.annual : plan.monthly;
          return (
            <article key={plan.id} className="rounded-3xl bg-panel p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-serif text-2xl gold-text">{plan.name}</h2>
                <p className="font-bold">
                  {brl(cents)}
                  <span className="text-sm font-semibold text-muted">{annual ? "/ano" : "/mês"}</span>
                </p>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-sand">
                {plan.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <button
                className="mt-3 w-full rounded-2xl gold-fill py-3 text-sm font-bold"
                onClick={() => setBuy({ id: plan.id, founder: false, cents, title: `${plan.name} ${annual ? "anual" : "mensal"}` })}
              >
                {active === plan.id ? "Renovar" : "Assinar"}
              </button>
            </article>
          );
        })}
        <article className="rounded-3xl gold-border bg-black p-4">
          <p className="text-xs font-bold text-gold">Pré-venda fundador</p>
          <h2 className="mt-1 font-serif text-2xl">Black anual com 40% off</h2>
          <p className="mt-2 text-sm text-sand">
            {brl(product.founderCents)} agora. O selo de fundador fica no perfil. O valor cheio do Black anual é {brl(107900)}.
          </p>
          <button
            className="mt-3 w-full rounded-2xl gold-fill py-3 text-sm font-bold"
            onClick={() => setBuy({ id: "black", founder: true, cents: product.founderCents, title: "Pré-venda fundador" })}
          >
            Entrar na pré-venda
          </button>
        </article>
      </div>
      {buy && (
        <Checkout
          title={buy.title}
          cents={buy.cents}
          onClose={() => setBuy(null)}
          onPaid={() => {
            product.buyPlan(buy.id, buy.founder || annual, buy.founder);
            setBuy(null);
          }}
        />
      )}
    </Subpage>
  );
}
