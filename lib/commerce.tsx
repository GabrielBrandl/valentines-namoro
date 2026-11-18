"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ECO_PRODUCTS,
  brl,
  productOf,
  sellerOf,
  tierFromPoints,
  type CartItem,
  type ClubTier,
  type EcoOrder,
} from "./ecosystem";

const KEY = "valentines-commerce-v1";

type CommerceState = {
  cart: CartItem[];
  deliveryCart: CartItem[];
  orders: EcoOrder[];
  points: number;
  affiliateCode: string;
  affiliateSales: number;
};

type Commerce = CommerceState & {
  ready: boolean;
  tier: ClubTier;
  cartCount: number;
  cartTotalCents: number;
  addToCart: (productId: string, qty?: number, kind?: "shopping" | "delivery") => void;
  setQty: (productId: string, qty: number, kind?: "shopping" | "delivery") => void;
  clearCart: (kind?: "shopping" | "delivery") => void;
  checkout: (kind?: "shopping" | "delivery") => EcoOrder | null;
  redeemPoints: (cost: number) => boolean;
  earnPoints: (amount: number) => void;
  trackAffiliate: (productId: string) => void;
};

const Ctx = createContext<Commerce | null>(null);

const empty = (): CommerceState => ({
  cart: [],
  deliveryCart: [],
  orders: [],
  points: 40,
  affiliateCode: "",
  affiliateSales: 0,
});

function load(): CommerceState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<CommerceState>;
    return {
      ...empty(),
      ...parsed,
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      deliveryCart: Array.isArray(parsed.deliveryCart) ? parsed.deliveryCart : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    };
  } catch {
    return empty();
  }
}

export function CommerceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CommerceState>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const next = load();
    if (!next.affiliateCode) {
      next.affiliateCode = `VAL-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    }
    setState(next);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, ready]);

  const mutateCart = useCallback((kind: "shopping" | "delivery", fn: (items: CartItem[]) => CartItem[]) => {
    setState((s) => {
      const key = kind === "delivery" ? "deliveryCart" : "cart";
      return { ...s, [key]: fn(s[key]) };
    });
  }, []);

  const addToCart = useCallback(
    (productId: string, qty = 1, kind: "shopping" | "delivery" = "shopping") => {
      if (!ECO_PRODUCTS.some((p) => p.id === productId)) return;
      mutateCart(kind, (items) => {
        const hit = items.find((i) => i.productId === productId);
        if (hit) return items.map((i) => (i.productId === productId ? { ...i, qty: i.qty + qty } : i));
        return [...items, { productId, qty }];
      });
    },
    [mutateCart],
  );

  const setQty = useCallback(
    (productId: string, qty: number, kind: "shopping" | "delivery" = "shopping") => {
      mutateCart(kind, (items) => {
        if (qty <= 0) return items.filter((i) => i.productId !== productId);
        return items.map((i) => (i.productId === productId ? { ...i, qty } : i));
      });
    },
    [mutateCart],
  );

  const clearCart = useCallback((kind: "shopping" | "delivery" = "shopping") => {
    mutateCart(kind, () => []);
  }, [mutateCart]);

  const checkout = useCallback(
    (kind: "shopping" | "delivery" = "shopping") => {
      const items = kind === "delivery" ? state.deliveryCart : state.cart;
      if (!items.length) return null;
      const lines = items
        .map((item) => {
          const product = productOf(item.productId);
          if (!product) return null;
          return {
            title: product.title,
            qty: item.qty,
            cents: product.cents * item.qty,
            sellerId: product.sellerId,
          };
        })
        .filter(Boolean) as { title: string; qty: number; cents: number; sellerId: string }[];
      if (!lines.length) return null;
      const totalCents = lines.reduce((sum, line) => sum + line.cents, 0);
      const sellerName = sellerOf(lines[0].sellerId)?.name || "Parceiro Valentine's";
      const order: EcoOrder = {
        id: crypto.randomUUID(),
        kind,
        at: Date.now(),
        totalCents,
        status: kind === "delivery" ? "preparando" : "pago",
        items: lines.map(({ title, qty, cents }) => ({ title, qty, cents })),
        sellerName,
      };
      const earned = Math.max(5, Math.round(totalCents / 100));
      setState((s) => ({
        ...s,
        orders: [order, ...s.orders].slice(0, 40),
        points: s.points + earned,
        cart: kind === "shopping" ? [] : s.cart,
        deliveryCart: kind === "delivery" ? [] : s.deliveryCart,
      }));
      return order;
    },
    [state.cart, state.deliveryCart],
  );

  const redeemPoints = useCallback((cost: number) => {
    if (cost <= 0) return false;
    let ok = false;
    setState((s) => {
      if (s.points < cost) return s;
      ok = true;
      return { ...s, points: s.points - cost };
    });
    return ok;
  }, []);

  const earnPoints = useCallback((amount: number) => {
    if (amount <= 0) return;
    setState((s) => ({ ...s, points: s.points + amount }));
  }, []);

  const trackAffiliate = useCallback((productId: string) => {
    const product = productOf(productId);
    if (!product) return;
    setState((s) => ({
      ...s,
      affiliateSales: s.affiliateSales + 1,
      points: s.points + Math.max(2, Math.round((product.cents * product.affiliatePct) / 10000)),
    }));
  }, []);

  const cartTotalCents = useMemo(
    () =>
      state.cart.reduce((sum, item) => {
        const product = productOf(item.productId);
        return sum + (product ? product.cents * item.qty : 0);
      }, 0),
    [state.cart],
  );

  const value: Commerce = {
    ...state,
    ready,
    tier: tierFromPoints(state.points),
    cartCount: state.cart.reduce((n, i) => n + i.qty, 0) + state.deliveryCart.reduce((n, i) => n + i.qty, 0),
    cartTotalCents,
    addToCart,
    setQty,
    clearCart,
    checkout,
    redeemPoints,
    earnPoints,
    trackAffiliate,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCommerce() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCommerce fora do provider");
  return ctx;
}

export { brl };
