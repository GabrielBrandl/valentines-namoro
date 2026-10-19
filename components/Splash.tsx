"use client";

import { brand } from "@/lib/brand";

export function Splash({ fading = false }: { fading?: boolean }) {
  return (
    <div
      className={`splash-screen fixed inset-0 z-[100] grid place-items-center bg-black ${fading ? "splash-out" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={`Abrindo ${brand.name}`}
    >
      <div className="splash-glow pointer-events-none absolute inset-0" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/splash-logo.png"
        alt={brand.name}
        className="splash-mark relative z-10 h-auto w-[min(78vw,360px)] select-none object-contain"
      />
      <span className="splash-bar absolute bottom-[max(36px,env(safe-area-inset-bottom))] left-1/2 h-1 w-28 -translate-x-1/2 overflow-hidden rounded-full bg-white/10">
        <span className="splash-bar-fill block h-full w-1/2 rounded-full gold-fill" />
      </span>
    </div>
  );
}
