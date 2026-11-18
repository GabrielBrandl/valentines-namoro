"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ECO_MERCHANTS, brl, deliveryProducts, productOf } from "@/lib/ecosystem";
import { useCommerce } from "@/lib/commerce";
import { useFecon } from "@/lib/store";
import { Photo } from "./Media";

export function DeliveryScreen() {
  const { me, prefs } = useFecon();
  const commerce = useCommerce();
  const [merchantId, setMerchantId] = useState(ECO_MERCHANTS[0]?.id || "");
  const [note, setNote] = useState("");
  const city = prefs.city || me?.city || "sua cidade";

  const merchant = ECO_MERCHANTS.find((m) => m.id === merchantId) || ECO_MERCHANTS[0];
  const menu = useMemo(() => deliveryProducts().slice(0, 6), []);

  function add(productId: string) {
    commerce.addToCart(productId, 1, "delivery");
    setNote("Item no pedido de delivery.");
  }

  function order() {
    const result = commerce.checkout("delivery");
    setNote(
      result
        ? `Pedido a caminho · ${result.sellerName} · ${brl(result.totalCents + (merchant?.feeCents || 0))}. Acompanhe em Pedidos.`
        : "Adicione itens ao pedido.",
    );
  }

  const deliveryTotal = commerce.deliveryCart.reduce((sum, item) => {
    const product = productOf(item.productId);
    return sum + (product ? product.cents * item.qty : 0);
  }, 0);

  return (
    <div className="app-scroll h-full overflow-y-auto bg-paper px-4 pb-28 pt-[max(16px,env(safe-area-inset-top))]">
      <header>
        <h1 className="font-serif text-3xl tracking-tight gold-text">Delivery</h1>
        <p className="mt-1 text-sm text-muted">
          Estabelecimentos perto de <span className="text-gold">{city}</span> · pedidos e acompanhamento no app
        </p>
      </header>

      <div className="mt-4 rounded-3xl border border-[#d4af37]/30 bg-panel p-4 text-sm">
        <p className="font-semibold text-gold">Área de atendimento</p>
        <p className="mt-1 text-sand">Usamos sua cidade do perfil/filtros. Entregadores e rotas escalam por região.</p>
        <Link href="/perfil" className="mt-2 inline-block text-xs font-semibold text-gold">
          Ajustar cidade no perfil
        </Link>
      </div>

      <h2 className="mt-6 font-serif text-2xl">Parceiros abertos</h2>
      <div className="mt-3 space-y-3">
        {ECO_MERCHANTS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMerchantId(item.id)}
            className={`flex w-full overflow-hidden rounded-3xl text-left ${merchantId === item.id ? "ring-2 ring-[#d4af37]" : ""}`}
          >
            <Photo src={item.cover} alt={item.name} className="h-28 w-28 shrink-0 object-cover" />
            <span className="flex min-w-0 flex-1 flex-col justify-center bg-panel px-3 py-2">
              <span className="font-semibold">{item.name}</span>
              <span className="text-xs text-muted">
                {item.kind} · {item.etaMin} min · taxa {brl(item.feeCents)}
              </span>
              <span className="mt-1 text-xs text-gold">★ {item.rating} · {item.categories.join(" · ")}</span>
              <span className={`mt-1 text-[11px] font-semibold ${item.open ? "text-emerald-400" : "text-muted"}`}>
                {item.open ? "Aberto agora" : "Fechado"}
              </span>
            </span>
          </button>
        ))}
      </div>

      {merchant && (
        <section className="mt-8">
          <h2 className="font-serif text-2xl">Cardápio · {merchant.name}</h2>
          <div className="mt-3 space-y-2">
            {menu.map((product) => (
              <div key={product.id} className="flex items-center gap-3 rounded-2xl bg-panel p-3">
                <Photo src={product.image} alt={product.title} className="h-16 w-16 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{product.title}</p>
                  <p className="text-xs text-muted line-clamp-2">{product.detail}</p>
                  <p className="mt-1 text-sm font-bold text-gold">{brl(product.cents)}</p>
                </div>
                <button type="button" className="rounded-full gold-fill px-3 py-2 text-xs font-bold text-black" onClick={() => add(product.id)}>
                  +
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8 rounded-3xl border border-[#d4af37]/35 bg-black/40 p-4">
        <h2 className="font-semibold text-gold">Seu pedido</h2>
        {commerce.deliveryCart.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nenhum item ainda.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm">
            {commerce.deliveryCart.map((item) => {
              const product = productOf(item.productId);
              if (!product) return null;
              return (
                <li key={item.productId} className="flex justify-between gap-2">
                  <span>
                    {product.title} × {item.qty}
                  </span>
                  <span className="text-gold">{brl(product.cents * item.qty)}</span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-sm">
          Subtotal {brl(deliveryTotal)}
          {merchant ? ` + taxa ${brl(merchant.feeCents)}` : ""}
        </p>
        <button
          type="button"
          disabled={!commerce.deliveryCart.length}
          className="mt-3 w-full rounded-2xl gold-fill py-3 font-bold text-black disabled:opacity-40"
          onClick={order}
        >
          Pedir agora
        </button>
        <Link href="/shopping" className="mt-3 block text-center text-xs font-semibold text-gold">
          Ir ao Shopping / marketplace
        </Link>
      </section>

      {note ? <p className="mt-3 text-sm text-gold">{note}</p> : null}

      {commerce.orders.filter((o) => o.kind === "delivery").length > 0 && (
        <section className="mt-8">
          <h2 className="font-serif text-2xl">Acompanhar</h2>
          <ul className="mt-3 space-y-2">
            {commerce.orders
              .filter((o) => o.kind === "delivery")
              .slice(0, 5)
              .map((orderRow) => (
                <li key={orderRow.id} className="rounded-2xl bg-panel px-4 py-3 text-sm">
                  <p className="font-semibold">{orderRow.sellerName}</p>
                  <p className="text-xs text-muted">
                    {orderRow.status.replace("_", " ")} · {brl(orderRow.totalCents)}
                  </p>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
