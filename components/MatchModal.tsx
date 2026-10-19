"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Photo } from "./Media";
import { IconHeart } from "./Icons";
import { getPerson } from "@/lib/seed";
import { useProduct } from "@/lib/product";
import { useFecon } from "@/lib/store";

export function MatchModal() {
  const { pendingMatchId, dismissMatch, sendMessage, me } = useFecon();
  const product = useProduct();
  const person = pendingMatchId ? getPerson(pendingMatchId) : null;
  const router = useRouter();
  const [text, setText] = useState("");

  const seenMatch = useRef<string | null>(null);

  useEffect(() => {
    if (!pendingMatchId || seenMatch.current === pendingMatchId) return;
    seenMatch.current = pendingMatchId;
    product.track("match");
  }, [pendingMatchId, product]);

  if (!person) return null;

  function go(message?: string) {
    if (message?.trim()) sendMessage(person!.id, message);
    dismissMatch();
    setText("");
    router.push(`/chat/${person!.id}`);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 px-5">
      <div className="w-full max-w-md rounded-3xl bg-panel p-6 text-center shadow-2xl">
        <p className="text-sm font-bold text-gold">deu match</p>
        <h2 className="mt-1 font-serif text-4xl tracking-tight">Você e {person.name}</h2>
        <div className="relative mx-auto mt-6 h-36 w-56">
          <Photo
            src={me?.photos[0]}
            alt={me?.name || "Você"}
            className="absolute left-0 top-2 h-32 w-32 rounded-full border-2 border-[#d4af37]/60 object-cover"
          />
          <Photo
            src={person.photos[0]}
            alt={person.name}
            className="absolute right-0 top-2 h-32 w-32 rounded-full border-2 border-[#d4af37]/60 object-cover"
          />
          <span className="heart-pop absolute left-1/2 top-12 grid h-12 w-12 -translate-x-1/2 place-items-center rounded-full gold-fill shadow-lg">
            <IconHeart className="h-6 w-6" />
          </span>
        </div>
        <p className="mt-4 text-sand">A curtida foi dos dois lados. Manda a primeira mensagem.</p>
        <div className="mt-4 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") go(text);
            }}
            placeholder={`Oi, ${person.name}`}
            className="min-w-0 flex-1 rounded-2xl border border-line bg-paper px-4 py-3 outline-none"
          />
          <button className="rounded-2xl gold-fill px-4 py-3 font-bold" onClick={() => go(text || "Oi! A gente deu match.")}>
            Enviar
          </button>
        </div>
        <button className="mt-4 text-sm font-semibold text-muted" onClick={() => { dismissMatch(); setText(""); }}>
          Continuar vendo gente
        </button>
      </div>
    </div>
  );
}

