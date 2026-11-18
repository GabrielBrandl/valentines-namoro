"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ECO_PRODUCTS,
  ECO_SELLERS,
  brl,
  productOf,
  sellerOf,
} from "@/lib/ecosystem";
import { useCommerce } from "@/lib/commerce";
import { Photo } from "./Media";

export function ShoppingScreen() {
  const commerce = useCommerce();
  const params = useSearchParams();
  const focus = params.get("product") || "";
  const [query, setQuery] = useState("");
  const [seller, setSeller] = useState<string>("todos");
  const [note, setNote] = useState("");

  const products = useMemo(() => {
    return ECO_PRODUCTS.filter((product) => {
      if (seller !== "todos" && product.sellerId !== seller) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        product.title.toLowerCase().includes(q) ||
        product.detail.toLowerCase().includes(q) ||
        product.tags.some((tag) => tag.includes(q))
      );
    });
  }, [query, seller]);

  const highlighted = focus ? productOf(focus) : null;

  function buy(productId: string) {
    commerce.addToCart(productId, 1, "shopping");
    commerce.trackAffiliate(productId);
    setNote("Adicionado ao carrinho · comissão de afiliado registrada no Club.");
  }

  function pay() {
    const order = commerce.checkout("shopping");
    setNote(
      order
        ? `Pedido ${order.id.slice(0, 8)} confirmado · ${brl(order.totalCents)}. Pontos Club creditados.`
        : "Carrinho vazio.",
    );
  }

  return (
    <div className="app-scroll h-full overflow-y-auto bg-paper px-4 pb-28 pt-[max(16px,env(safe-area-inset-top))]">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl tracking-tight gold-text">Shopping</h1>
          <p className="mt-1 text-sm text-muted">Marketplace + vitrine de criadores · compre pelo vídeo ou pela loja</p>
        </div>
        <Link href="/club" className="rounded-full border border-[#d4af37]/40 px-3 py-1.5 text-xs font-semibold text-gold">
          Club
        </Link>
      </header>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSeller("todos")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${seller === "todos" ? "gold-fill text-black" : "bg-panel text-muted"}`}
        >
          Todos
        </button>
        {ECO_SELLERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSeller(item.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${seller === item.id ? "gold-fill text-black" : "bg-panel text-muted"}`}
          >
            {item.name}
          </button>
        ))}
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar produtos, tags, criadores..."
        className="mt-3 w-full rounded-2xl bg-panel px-4 py-3 text-sm outline-none ring-1 ring-[#d4af37]/25"
      />

      {highlighted && (
        <article className="mt-4 overflow-hidden rounded-3xl border border-[#d4af37]/40 bg-panel">
          <Photo src={highlighted.image} alt={highlighted.title} className="aspect-[16/9] w-full object-cover" />
          <div className="p-4">
            <p className="text-xs font-semibold text-gold">Do vídeo · social commerce</p>
            <h2 className="mt-1 font-serif text-2xl">{highlighted.title}</h2>
            <p className="mt-1 text-sm text-sand">{highlighted.detail}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="font-bold text-gold">{brl(highlighted.cents)}</span>
              <button type="button" className="rounded-full gold-fill px-4 py-2 text-sm font-bold text-black" onClick={() => buy(highlighted.id)}>
                Comprar agora
              </button>
            </div>
          </div>
        </article>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        {products.map((product) => {
          const shop = sellerOf(product.sellerId);
          return (
            <article key={product.id} className="overflow-hidden rounded-3xl bg-panel">
              <Photo src={product.image} alt={product.title} className="aspect-[4/5] w-full object-cover" />
              <div className="space-y-1 p-3">
                <p className="line-clamp-2 text-sm font-semibold">{product.title}</p>
                <p className="text-[11px] text-muted">{shop?.name}</p>
                <p className="text-sm font-bold text-gold">{brl(product.cents)}</p>
                <p className="text-[10px] text-muted">Afiliado {product.affiliatePct}%</p>
                <button type="button" className="mt-1 w-full rounded-xl gold-fill py-2 text-xs font-bold text-black" onClick={() => buy(product.id)}>
                  Adicionar
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <section className="mt-8 rounded-3xl border border-[#d4af37]/35 bg-black/40 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gold">Carrinho</h2>
          <span className="text-xs text-muted">{commerce.cart.length} itens</span>
        </div>
        {commerce.cart.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Vazio — adicione do feed ou da vitrine.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {commerce.cart.map((item) => {
              const product = productOf(item.productId);
              if (!product) return null;
              return (
                <li key={item.productId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">
                    {product.title} × {item.qty}
                  </span>
                  <span className="shrink-0 text-gold">{brl(product.cents * item.qty)}</span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-sm font-bold">Total {brl(commerce.cartTotalCents)}</p>
        <button type="button" disabled={!commerce.cart.length} className="mt-3 w-full rounded-2xl gold-fill py-3 font-bold text-black disabled:opacity-40" onClick={pay}>
          Finalizar pedido
        </button>
        <div className="mt-3 flex gap-2 text-xs">
          <Link href="/delivery" className="flex-1 rounded-xl bg-panel py-2 text-center font-semibold">
            Delivery perto
          </Link>
          <Link href="/reels" className="flex-1 rounded-xl bg-panel py-2 text-center font-semibold">
            Ver no feed
          </Link>
        </div>
      </section>

      {note ? <p className="mt-3 text-sm text-gold">{note}</p> : null}

      <section className="mt-8">
        <h2 className="font-serif text-2xl">Lojas e criadores</h2>
        <div className="mt-3 space-y-2">
          {ECO_SELLERS.map((shop) => (
            <button
              key={shop.id}
              type="button"
              onClick={() => setSeller(shop.id)}
              className="flex w-full items-start justify-between gap-3 rounded-2xl bg-panel px-4 py-3 text-left"
            >
              <span>
                <span className="block font-semibold">{shop.name}</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {shop.city}/{shop.state} · {shop.kind} · ★ {shop.rating}
                </span>
                <span className="mt-1 block text-sm text-sand">{shop.tagline}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
