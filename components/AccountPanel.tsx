"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getNotifyPrefs,
  requestNotifyPermission,
  setNotifyPrefs,
} from "@/lib/notify";
import { VERIFY_LABEL, useProduct, type PhotoVisibility, type ReservedMode } from "@/lib/product";
import { useFecon } from "@/lib/store";
import { Photo } from "./Media";

const PRIMARY = [
  ["/loja", "Loja"],
  ["/planos", "Planos"],
  ["/verificar", "Verificar"],
] as const;

const HELP = [
  ["/suporte", "Suporte"],
  ["/termos", "Termos"],
  ["/privacidade", "Privacidade"],
] as const;

export function AccountPanel() {
  const product = useProduct();
  const { me } = useFecon();
  const [city, setCity] = useState(product.state.cityOverride);
  const [reservedNote, setReservedNote] = useState("");
  const [notifyOn, setNotifyOn] = useState(false);
  const [notifyNote, setNotifyNote] = useState("");
  const [openMore, setOpenMore] = useState(false);
  const canCity = product.state.cityUntil > Date.now();
  const boost = product.state.boostUntil > Date.now();

  useEffect(() => {
    setNotifyOn(getNotifyPrefs().enabled);
  }, []);

  async function toggleNotify() {
    if (!notifyOn) {
      const ok = await requestNotifyPermission();
      setNotifyOn(ok);
      setNotifyNote(ok ? "Notificações ativadas." : "Permissão negada neste aparelho.");
    } else {
      setNotifyPrefs({ enabled: false });
      setNotifyOn(false);
      setNotifyNote("Notificações desligadas.");
    }
  }

  return (
    <section className="mt-8 space-y-4">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Conta</h2>
        <p className="mt-1 text-sm text-muted">
          {VERIFY_LABEL[product.state.verification]}
          {product.planName ? ` · ${product.planName}` : ""}
          {boost ? " · impulso" : ""}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {PRIMARY.map(([href, label]) => (
          <Link key={href} href={href} className="rounded-2xl gold-border bg-panel px-3 py-3 text-center text-sm font-semibold">
            {label}
          </Link>
        ))}
      </div>

      <div className="rounded-3xl bg-panel p-4">
        <p className="text-sm font-semibold">Privacidade</p>
        <p className="mt-2 text-xs text-muted">Quem vê suas fotos</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(
            [
              ["todos", "Todos"],
              ["matches", "Matches"],
              ["ninguem", "Ninguém"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => product.setPhotoVisibility(id as PhotoVisibility)}
              className={`rounded-2xl py-2 text-xs font-semibold ${product.state.photoVisibility === id ? "gold-fill" : "bg-paper"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {product.state.photoVisibility !== "todos" && me?.photos[0] && (
          <Photo
            src={me.photos[0]}
            alt=""
            className={`mt-3 h-36 w-full rounded-2xl object-cover ${product.state.photoVisibility === "ninguem" ? "blur-md" : "blur-sm"}`}
          />
        )}
        <p className="mt-4 text-xs text-muted">Visibilidade no app</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(
            [
              ["off", "Aberto"],
              ["basico", "Discreto"],
              ["plus", "Reservado"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                const message = product.setReserved(id as ReservedMode);
                setReservedNote(
                  message ??
                    (id === "off"
                      ? "Você aparece normalmente."
                      : id === "basico"
                        ? "Você aparece offline."
                        : "Só quem você curtiu te encontra no Match."),
                );
              }}
              className={`rounded-2xl py-2 text-xs font-semibold ${product.state.reserved === id ? "gold-fill" : "bg-paper"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {reservedNote && <p className="mt-2 text-sm text-sand">{reservedNote}</p>}
      </div>

      <div className="rounded-3xl bg-panel p-4">
        <p className="text-sm font-semibold">Notificações</p>
        <button
          className={`mt-3 rounded-2xl px-4 py-2 text-sm font-bold ${notifyOn ? "gold-fill" : "bg-paper"}`}
          onClick={toggleNotify}
        >
          {notifyOn ? "Ligadas" : "Ativar"}
        </button>
        {notifyNote && <p className="mt-2 text-xs text-muted">{notifyNote}</p>}
      </div>

      <div className="rounded-3xl bg-panel p-4">
        <p className="text-sm font-semibold">Cidade</p>
        <input
          value={city}
          disabled={!canCity}
          onChange={(event) => setCity(event.target.value)}
          onBlur={() => product.setCity(city)}
          placeholder={canCity ? "Sua cidade" : "Disponível com plano ou item da loja"}
          className="mt-2 w-full rounded-2xl bg-paper px-4 py-3 outline-none disabled:opacity-60"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {HELP.map(([href, label]) => (
          <Link key={href} href={href} className="rounded-2xl bg-panel px-3 py-3 text-center text-xs font-semibold text-muted">
            {label}
          </Link>
        ))}
      </div>

      <button
        type="button"
        className="w-full text-center text-xs font-semibold text-muted"
        onClick={() => setOpenMore((v) => !v)}
      >
        {openMore ? "Ocultar detalhes" : "Mais opções"}
      </button>

      {openMore && (
        <div className="rounded-3xl bg-panel p-4 text-sm text-sand">
          <p>
            Créditos neste aparelho: <span className="font-semibold text-ink">{product.state.credits}</span>
          </p>
          <p className="mt-2 text-xs text-muted">
            Compras são simulação para demo. Nada é cobrado de verdade nesta versão.
          </p>
          {product.state.ledger.slice(0, 3).map((row) => (
            <p key={row.id} className="mt-1 flex justify-between text-xs">
              <span>{row.label}</span>
              <span>{row.credits > 0 ? `+${row.credits}` : row.credits}</span>
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
