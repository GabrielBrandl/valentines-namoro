"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { brl } from "@/lib/catalog";
import {
  getNotifyPrefs,
  requestNotifyPermission,
  setNotifyPrefs,
} from "@/lib/notify";
import { VERIFY_LABEL, useProduct, type PhotoVisibility, type ReservedMode } from "@/lib/product";
import { useFecon } from "@/lib/store";
import { downloadLocalBackup, importLocalBackup } from "@/lib/sync";
import { Photo } from "./Media";

const LINKS = [
  ["/verificar", "Verificar"],
  ["/loja", "Loja"],
  ["/planos", "Planos"],
  ["/convites", "Convites"],
  ["/suporte", "Suporte"],
  ["/termos", "Termos"],
  ["/privacidade", "Privacidade"],
  ["/recuperar", "Recuperar acesso"],
  ["#notificacoes", "Notificações"],
];

export function AccountPanel() {
  const product = useProduct();
  const { me } = useFecon();
  const [city, setCity] = useState(product.state.cityOverride);
  const [reservedNote, setReservedNote] = useState("");
  const [notifyOn, setNotifyOn] = useState(false);
  const [notifyNote, setNotifyNote] = useState("");
  const [syncNote, setSyncNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const canCity = product.state.cityUntil > Date.now();
  const boost = product.state.boostUntil > Date.now();

  useEffect(() => {
    setNotifyOn(getNotifyPrefs().enabled);
  }, []);

  const receipts = product.state.events
    .filter((e) => e.name.startsWith("compra:") || e.name.startsWith("plano:"))
    .slice(0, 12);

  async function toggleNotify() {
    if (!notifyOn) {
      const ok = await requestNotifyPermission();
      setNotifyOn(ok);
      setNotifyNote(
        ok
          ? "Notificações ativadas neste navegador."
          : "Permissão negada ou indisponível neste aparelho.",
      );
    } else {
      setNotifyPrefs({ enabled: false });
      setNotifyOn(false);
      setNotifyNote("Notificações desligadas.");
    }
  }

  function onImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const err = importLocalBackup(String(reader.result || ""));
      if (err) {
        setSyncNote(err);
        return;
      }
      setSyncNote("Backup importado. Recarregando…");
      window.setTimeout(() => window.location.reload(), 600);
    };
    reader.readAsText(file);
  }

  return (
    <section className="mt-8">
      <h2 className="font-serif text-2xl tracking-tight">Conta</h2>
      <p className="mt-1 text-sm text-muted">
        {VERIFY_LABEL[product.state.verification]}
        {product.planName ? ` · plano ${product.planName}` : " · sem plano"}
        {product.state.founder ? " · fundador" : ""}
        {boost ? " · impulso ativo" : ""}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {LINKS.map(([href, label]) =>
          href.startsWith("#") ? (
            <a key={href} href={href} className="rounded-2xl bg-panel px-3 py-3 text-sm font-semibold">
              {label}
            </a>
          ) : (
            <Link key={href} href={href} className="rounded-2xl bg-panel px-3 py-3 text-sm font-semibold">
              {label}
            </Link>
          ),
        )}
      </div>

      <div id="notificacoes" className="mt-4 rounded-3xl bg-panel p-4">
        <p className="text-sm font-semibold">Notificações</p>
        <p className="mt-1 text-sm text-sand">
          Aviso no navegador quando der match ou chegar resposta no chat (demo local).
        </p>
        <button
          className={`mt-3 rounded-2xl px-4 py-2 text-sm font-bold ${notifyOn ? "gold-fill" : "bg-paper"}`}
          onClick={toggleNotify}
        >
          {notifyOn ? "Notificações ligadas" : "Ativar notificações"}
        </button>
        {notifyNote && <p className="mt-2 text-xs text-muted">{notifyNote}</p>}
      </div>

      <div className="mt-4 rounded-3xl bg-panel p-4">
        <p className="text-sm font-semibold">Backup local (pré-backend)</p>
        <p className="mt-1 text-sm text-sand">
          Sincronizar neste aparelho exporta JSON do perfil e da carteira. Não sobe para nuvem.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="rounded-2xl gold-fill px-4 py-2 text-sm font-bold"
            onClick={() => {
              downloadLocalBackup();
              setSyncNote("Arquivo de backup baixado.");
            }}
          >
            Sincronizar neste aparelho
          </button>
          <button
            className="rounded-2xl bg-paper px-4 py-2 text-sm font-semibold"
            onClick={() => fileRef.current?.click()}
          >
            Importar backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportFile(f);
            }}
          />
        </div>
        {syncNote && <p className="mt-2 text-xs text-muted">{syncNote}</p>}
      </div>

      <div className="mt-4 rounded-3xl bg-panel p-4">
        <p className="text-sm font-semibold">Compras simuladas</p>
        <p className="mt-1 text-sm text-sand">Histórico local de PIX/planos confirmados neste aparelho.</p>
        <ul className="mt-2 space-y-1">
          {receipts.length === 0 && (
            <li className="text-sm text-muted">Nenhuma compra ainda.</li>
          )}
          {receipts.map((row, i) => (
            <li key={`${row.at}-${i}`} className="flex justify-between text-sm">
              <span>{row.name.replace("compra:", "").replace("plano:", "Plano ")}</span>
              <span className="text-muted">
                {new Date(row.at).toLocaleDateString("pt-BR")}
              </span>
            </li>
          ))}
        </ul>
        {product.state.ledger.length > 0 && (
          <>
            <p className="mt-3 text-xs font-semibold text-muted">Extrato de créditos</p>
            <ul className="mt-1 space-y-1">
              {product.state.ledger.slice(0, 5).map((row) => (
                <li key={row.id} className="flex justify-between text-sm">
                  <span>{row.label}</span>
                  <span>{row.credits > 0 ? `+${row.credits}` : row.credits}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="mt-4 rounded-3xl bg-panel p-4">
        <p className="text-sm font-semibold">Carteira de créditos</p>
        <p className="mt-1 font-serif text-3xl">{product.state.credits}</p>
        <p className="mt-2 text-sm leading-relaxed text-sand">
          São créditos do app, para presente e recompensa de convite. O Ysay Bank não está ligado: isso depende de regulação do Banco Central ou de um parceiro. Isto não é saldo bancário. Valor de referência dos créditos comprados a partir de {brl(600)}.
        </p>
      </div>

      <div className="mt-4 rounded-3xl bg-panel p-4">
        <p className="text-sm font-semibold">Quem vê suas fotos</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(
            [
              ["todos", "Todo mundo"],
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
        <p className="mt-2 text-sm text-muted">
          {product.state.photoVisibility === "ninguem"
            ? "Prévia: desconhecidos veem a foto embaçada."
            : product.state.photoVisibility === "matches"
              ? "Prévia: a foto abre depois do match."
              : "Prévia: a foto aparece no deck."}
        </p>
        {product.state.photoVisibility !== "todos" && me?.photos[0] && (
          <Photo
            src={me.photos[0]}
            alt=""
            className={`mt-2 h-40 w-full rounded-2xl object-cover ${product.state.photoVisibility === "ninguem" ? "blur-md" : "blur-sm"}`}
          />
        )}
      </div>

      <div className="mt-4 rounded-3xl bg-panel p-4">
        <p className="text-sm font-semibold">Modo reservado</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(
            [
              ["off", "Aberto"],
              ["basico", "Básico"],
              ["plus", "Plus"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                const message = product.setReserved(id as ReservedMode);
                setReservedNote(message ?? (id === "off" ? "Você aparece online." : id === "basico" ? "Outras pessoas veem você offline." : "Você sai do deck de quem ainda não curtiu."));
              }}
              className={`rounded-2xl py-2 text-xs font-semibold ${product.state.reserved === id ? "gold-fill" : "bg-paper"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {reservedNote && <p className="mt-2 text-sm text-sand">{reservedNote}</p>}
      </div>

      <div className="mt-4 rounded-3xl bg-panel p-4">
        <p className="text-sm font-semibold">Cidade no perfil</p>
        <input
          value={city}
          disabled={!canCity}
          onChange={(event) => setCity(event.target.value)}
          onBlur={() => product.setCity(city)}
          placeholder={canCity ? "Nova cidade" : "Compre a troca de cidade ou o Gold"}
          className="mt-2 w-full rounded-2xl bg-paper px-4 py-3 outline-none disabled:opacity-60"
        />
      </div>
    </section>
  );
}
