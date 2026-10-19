"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Início antigo redireciona para Reels — um só lugar de vídeo. */
export default function InicioPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/reels");
  }, [router]);
  return (
    <div className="grid h-full place-items-center bg-paper text-sm text-muted">
      Abrindo Reels…
    </div>
  );
}
