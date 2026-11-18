"use client";

import { Suspense } from "react";
import { ShoppingScreen } from "@/components/ShoppingScreen";

export default function Page() {
  return (
    <Suspense fallback={<div className="grid h-full place-items-center text-sm text-muted">Abrindo Shopping…</div>}>
      <ShoppingScreen />
    </Suspense>
  );
}
