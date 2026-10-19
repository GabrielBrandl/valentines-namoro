"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { IconChat, IconClapper, IconHome, IconMatch, IconUser } from "./Icons";
import { MatchModal } from "./MatchModal";
import { Logo } from "./Logo";
import { Splash } from "./Splash";
import { registerServiceWorker } from "@/lib/notify";
import { useFecon } from "@/lib/store";

const nav = [
  { href: "/inicio", label: "Início", icon: IconHome },
  { href: "/descobrir", label: "Match", icon: IconMatch },
  { href: "/reels", label: "Reels", icon: IconClapper },
  { href: "/matches", label: "Chat", icon: IconChat },
  { href: "/perfil", label: "Perfil", icon: IconUser },
];

const SPLASH_MS = 2400;

export function Shell({ children }: { children: React.ReactNode }) {
  const { ready, me, unread } = useFecon();
  const pathname = usePathname();
  const router = useRouter();
  const isChat = pathname.startsWith("/chat");
  const [splash, setSplash] = useState(true);
  const [fading, setFading] = useState(false);
  const [minDone, setMinDone] = useState(false);

  const open =
    pathname === "/" ||
    pathname === "/termos" ||
    pathname === "/privacidade" ||
    pathname === "/sorteio" ||
    pathname === "/recuperar" ||
    pathname === "/lojas";

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!me && !open) {
      router.replace("/");
      return;
    }
    if (me && pathname === "/") {
      router.replace("/reels");
      const timer = window.setTimeout(() => {
        if (window.location.pathname === "/") {
          window.location.replace("/reels");
        }
      }, 700);
      return () => window.clearTimeout(timer);
    }
  }, [ready, me, pathname, router, open]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("valentines-splash") === "1") {
        setSplash(false);
        setMinDone(true);
        return;
      }
    } catch {
      /* sessionStorage pode falhar em modo privado */
    }
    const timer = window.setTimeout(() => setMinDone(true), SPLASH_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready || !minDone || !splash) return;
    setFading(true);
    const timer = window.setTimeout(() => {
      setSplash(false);
      try {
        sessionStorage.setItem("valentines-splash", "1");
      } catch {
        /* ignore */
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [ready, minDone, splash]);

  if (!ready || splash) {
    return <Splash fading={ready && minDone && fading} />;
  }

  // Mantém a nav visível também em "/" enquanto o redirect pós-login ainda não concluiu.
  const showNav = Boolean(me);
  const hideBottom = isChat;

  return (
    <div className="mx-auto flex h-dvh max-w-[1400px] overflow-hidden bg-paper text-ink">
      {showNav && (
        <aside className="hidden w-[92px] shrink-0 flex-col items-center gap-2 border-r border-line bg-black py-5 md:flex">
          <Logo size="sm" mark />
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href === "/matches" && isChat) ||
              (item.href === "/inicio" && pathname === "/inicio");
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`relative grid h-[68px] w-[72px] place-items-center rounded-2xl text-[11px] font-semibold ${
                  active ? "text-gold" : "text-muted hover:bg-panel-2"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-1">{item.label}</span>
                {item.href === "/matches" && unread > 0 && (
                  <span className="absolute right-3 top-2 grid h-5 min-w-5 place-items-center rounded-full gold-fill px-1 text-[10px] font-bold">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col bg-paper">
        <div className="min-h-0 flex-1">{children}</div>
        {showNav && !hideBottom && (
          <nav className="grid h-[calc(62px+env(safe-area-inset-bottom))] grid-cols-5 border-t border-line bg-black px-1 pt-1.5 pb-[env(safe-area-inset-bottom)] md:hidden">
            {nav.map((item) => {
              const active = pathname === item.href || (item.href === "/matches" && isChat);
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`relative grid place-items-center gap-0.5 py-1 text-[10px] font-semibold ${
                    active ? "text-gold" : "text-muted"
                  }`}
                >
                  <Icon className={`h-6 w-6 ${active ? "drop-shadow-[0_0_8px_rgba(212,175,55,0.55)]" : ""}`} />
                  {item.label}
                  {item.href === "/matches" && unread > 0 && (
                    <span className="absolute right-[18%] top-0 grid h-4 min-w-4 place-items-center rounded-full gold-fill px-1 text-[10px]">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}
      </div>
      <MatchModal />
    </div>
  );
}
