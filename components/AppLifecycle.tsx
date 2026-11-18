"use client";

import { useEffect, useRef, useState } from "react";
import { APP_VERSION } from "@/lib/version";

type VersionPayload = {
  version: string;
  notes?: string;
  maintenance?: boolean;
  message?: string;
};

/**
 * Updates e manutenção sem apagar dados:
 * - banner suave quando há versão nova
 * - recarrega só a UI (localStorage/IDB/Supabase permanecem)
 * - aviso de manutenção sem expulsar o usuário
 */
export function AppLifecycle() {
  const [updateReady, setUpdateReady] = useState(false);
  const [maintenance, setMaintenance] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const waitingWorker = useRef<ServiceWorker | null>(null);
  const knownVersion = useRef(APP_VERSION);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    async function watch() {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        if (cancelled) return;

        const track = (worker: ServiceWorker | null) => {
          if (!worker || worker.state === "activated") return;
          waitingWorker.current = worker;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        };

        track(reg.installing);
        reg.addEventListener("updatefound", () => track(reg.installing));

        // Checa SW a cada 5 min sem forçar reload
        const timer = window.setInterval(() => {
          void reg.update().catch(() => undefined);
        }, 5 * 60_000);

        return () => window.clearInterval(timer);
      } catch {
        /* SW opcional */
      }
    }

    void watch();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function poll() {
      try {
        const res = await fetch(`/api/version?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as VersionPayload;
        if (!alive) return;
        if (data.maintenance && data.message) setMaintenance(data.message);
        else setMaintenance("");
        if (data.version && data.version !== knownVersion.current) {
          setUpdateReady(true);
        }
      } catch {
        /* offline — segue com o que tem */
      }
    }

    void poll();
    const timer = window.setInterval(poll, 90_000);
    const onFocus = () => void poll();
    window.addEventListener("focus", onFocus);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  async function applyUpdate() {
    setBusy(true);
    try {
      const worker = waitingWorker.current;
      if (worker) worker.postMessage("SKIP_WAITING");
      // Soft reload: não limpa storage; reels/contas vêm da nuvem
      window.location.reload();
    } catch {
      window.location.reload();
    }
  }

  if (!updateReady && !maintenance) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex flex-col items-center gap-2 px-3 pt-[max(10px,env(safe-area-inset-top))]">
      {maintenance ? (
        <p className="pointer-events-auto max-w-lg rounded-full bg-black/85 px-4 py-2 text-center text-xs font-semibold text-gold shadow-lg ring-1 ring-[#d4af37]/35">
          {maintenance}
        </p>
      ) : null}
      {updateReady ? (
        <div className="pointer-events-auto flex max-w-lg items-center gap-3 rounded-full bg-black/90 px-3 py-2 text-xs text-sand shadow-lg ring-1 ring-[#d4af37]/40">
          <span className="pl-1 font-semibold text-gold">Atualização pronta</span>
          <span className="hidden text-muted sm:inline">Sem perder vídeos nem conta.</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => void applyUpdate()}
            className="rounded-full gold-fill px-3 py-1.5 text-[11px] font-bold text-black disabled:opacity-60"
          >
            {busy ? "Aplicando…" : "Atualizar"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
