"use client";

import { useState } from "react";
import { Photo } from "./Media";
import { IconHeart, IconStar, IconX } from "./Icons";
import { useProduct } from "@/lib/product";
import type { Person } from "@/lib/types";
import { Paywall, ReportDialog, VerifiedMark } from "./product-ui";

export function PersonSheet({
  person,
  onClose,
  onPass,
  onLike,
  onSuper,
}: {
  person: Person;
  onClose: () => void;
  onPass: () => void;
  onLike: () => void;
  onSuper: () => void;
}) {
  const product = useProduct();
  const [report, setReport] = useState(false);
  const [paywall, setPaywall] = useState(false);
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 md:items-center" onClick={onClose}>
      <div
        className="app-scroll max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-paper md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Photo src={person.photos[0]} alt={person.name} className="h-80 w-full object-cover" />
        <div className="space-y-4 p-5">
          <div>
            <h3 className="font-serif text-4xl tracking-tight">
              {person.name}, {person.age}
              <VerifiedMark on={person.verified} />
            </h3>
            <p className="text-sm text-muted">
              {person.job} · {person.city} · {person.distanceKm} km
              {person.online ? " · online" : ""}
            </p>
          </div>
          <p className="leading-relaxed">{person.bio}</p>
          <div className="flex flex-wrap gap-2">
            {person.interests.map((interest) => (
              <span key={interest} className="rounded-full bg-panel px-3 py-1 text-sm font-semibold">
                {interest}
              </span>
            ))}
          </div>
          {person.prompts.map((prompt) => (
            <div key={prompt.q} className="rounded-2xl bg-panel p-4">
              <p className="text-xs font-bold text-muted">{prompt.q}</p>
              <p className="mt-1 text-lg">{prompt.a}</p>
            </div>
          ))}
          {person.photos[1] && (
            <Photo src={person.photos[1]} alt="" className="h-72 w-full rounded-2xl object-cover" />
          )}
          <div className="sticky bottom-0 flex items-center justify-center gap-4 bg-paper py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            <Round label="Não" onClick={onPass}>
              <IconX />
            </Round>
            <Round
              label="Super"
              disabled={Boolean(person.sponsored)}
              onClick={() => {
                if (person.sponsored) return;
                if (!product.consume("super")) {
                  setPaywall(true);
                  return;
                }
                onSuper();
              }}
              className="bg-gold! text-white!"
            >
              <IconStar />
            </Round>
            <Round label="Curtir" onClick={onLike} className="gold-fill!">
              <IconHeart />
            </Round>
          </div>
          <button className="w-full py-2 text-sm font-semibold text-gold" onClick={() => setReport(true)}>
            Denunciar perfil
          </button>
        </div>
      </div>
      {report && <ReportDialog targetId={person.id} targetName={person.name} onClose={() => setReport(false)} />}
      {paywall && <Paywall kind="super" onClose={() => setPaywall(false)} />}
    </div>
  );
}

function Round({
  children,
  onClick,
  label,
  className,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button aria-label={label} disabled={disabled} onClick={onClick} className="grid place-items-center gap-1 disabled:opacity-30">
      <span className={`grid h-14 w-14 place-items-center rounded-full border border-line bg-panel ${className ?? ""}`}>
        {children}
      </span>
      <span className="text-[11px] font-semibold text-muted">{label}</span>
    </button>
  );
}

