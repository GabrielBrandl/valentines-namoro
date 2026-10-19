"use client";

import { useState } from "react";
import { SHOP, brl } from "@/lib/catalog";
import { useProduct } from "@/lib/product";
import { Checkout, Subpage } from "./product-ui";

export function ShopScreen() {
  const product = useProduct();
  const [id, setId] = useState<string | null>(null);
  const item = SHOP.find((entry) => entry.id === id) ?? null;
  return (
    <Subpage title="Loja" lede="Itens avulsos a partir de R$ 6. O pagamento é uma simulação de PIX, sem cobrança.">
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-panel p-3 text-center text-xs">
        <p>
          <span className="block font-serif text-xl font-bold text-gold">{product.superLeft}</span>
          super
        </p>
        <p>
          <span className="block font-serif text-xl font-bold text-gold">{product.undoLeft}</span>
          desfazer
        </p>
        <p>
          <span className="block font-serif text-xl font-bold text-gold">{product.state.credits}</span>
          créditos
        </p>
      </div>
      <div className="mt-4 space-y-2">
        {SHOP.map((entry) => (
          <button
            key={entry.id}
            onClick={() => setId(entry.id)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-panel px-4 py-3 text-left"
          >
            <span>
              <span className="block font-semibold">{entry.name}</span>
              <span className="mt-0.5 block text-sm text-muted">{entry.detail}</span>
            </span>
            <span className="shrink-0 font-bold text-gold">{brl(entry.cents)}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 rounded-3xl bg-panel p-4">
        <p className="text-sm font-semibold">Últimas compras simuladas</p>
        <ul className="mt-2 space-y-1">
          {product.state.ledger.filter((row) => row.label.startsWith("Compra:") || row.label.startsWith("Plano ")).length ===
            0 && <li className="text-sm text-muted">Nenhuma ainda.</li>}
          {product.state.ledger
            .filter((row) => row.label.startsWith("Compra:") || row.label.startsWith("Plano "))
            .slice(0, 8)
            .map((row) => (
              <li key={row.id} className="flex justify-between text-sm">
                <span>{row.label}</span>
                <span className="text-muted">
                  {new Date(row.at).toLocaleDateString("pt-BR")}
                </span>
              </li>
            ))}
        </ul>
      </div>
      {item && (
        <Checkout
          title={item.name}
          cents={item.cents}
          onClose={() => setId(null)}
          onPaid={() => {
            product.purchase(item.id);
            setId(null);
          }}
        />
      )}
    </Subpage>
  );
}
