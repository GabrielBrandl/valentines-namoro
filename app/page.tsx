"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Onboarding } from "@/components/Onboarding";
import { useFecon } from "@/lib/store";

export default function HomePage() {
  const { ready, me } = useFecon();
  const router = useRouter();

  useEffect(() => {
    if (!ready || !me) return;
    router.replace("/reels");
    // Fallback: em alguns refreshes o App Router não conclui o soft navigate.
    const timer = window.setTimeout(() => {
      if (window.location.pathname === "/") {
        window.location.replace("/reels");
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [ready, me, router]);

  if (!ready) return null;
  if (me) {
    return (
      <div className="grid h-full place-items-center bg-paper text-sm text-muted">
        Abrindo seus reels…
      </div>
    );
  }
  return <Onboarding />;
}
