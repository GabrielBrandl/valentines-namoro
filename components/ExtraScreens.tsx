"use client";

import { useEffect, useRef, useState } from "react";
import { brand } from "@/lib/brand";
import { GOAL, signupsOf, stateName } from "@/lib/brazil";
import { useProduct } from "@/lib/product";
import { Subpage } from "./product-ui";

export function MetricsScreen() {
  const product = useProduct();
  const names = product.state.events.map((event) => event.name);
  const activation =
    names.includes("ativacao") ||
    names.includes("curtida") ||
    Boolean(product.state.termsAt || product.state.phone) ||
    names.some((name) => name.startsWith("compra") || name.startsWith("plano"));
  const days = product.state.days.length;
  const purchases = names.filter((name) => name.startsWith("compra") || name.startsWith("plano")).length;
  const matches = names.filter((name) => name === "match").length;
  const left = Math.max(0, GOAL - signupsOf(product.state.uf, product.state.bumps));
  return (
    <Subpage title="Métricas" lede="Ativação, retenção e conversão desta conta, neste aparelho.">
      <div className="grid grid-cols-3 gap-2 text-center">
        <Card label="Ativação" value={activation ? "sim" : "não"} />
        <Card label="Dias aqui" value={String(days)} />
        <Card label="Compras" value={String(purchases)} />
      </div>
      <p className="mt-4 text-sm text-sand">
        Conversão local: {activation ? purchases + matches : 0}{" "}
        {(activation ? purchases + matches : 0) === 1 ? "evento" : "eventos"} de match ou compra depois da entrada. Origem:{" "}
        {product.state.origin ?? "direta"}.
      </p>
      <p className="mt-2 text-sm text-sand">
        {stateName(product.state.uf)}: {left === 0 ? "meta de abertura atingida." : `faltam ${left.toLocaleString("pt-BR")} cadastros para abrir.`}
      </p>
      <h2 className="mt-6 font-serif text-2xl">Eventos</h2>
      <ul className="mt-2 space-y-1">
        {product.state.events.slice(0, 30).map((event, index) => (
          <li key={`${event.at}-${index}`} className="flex justify-between rounded-xl bg-panel px-3 py-2 text-sm">
            <span>{event.name}</span>
            <span className="text-muted">{new Date(event.at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-muted">{brand.name} registra isso só no navegador.</p>
    </Subpage>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-panel p-3">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

export function SponsorScreen() {
  const product = useProduct();
  const month = product.state.events.filter((event) => Date.now() - event.at < 30 * 86400000);
  const likes = month.filter((event) => event.name === "curtida").length;
  const buys = month.filter((event) => event.name.startsWith("compra") || event.name.startsWith("plano")).length;
  return (
    <Subpage title="Patrocínio" lede="Card patrocinado, perfil de marca, enquete e cupom. O relatório do mês sai dos eventos deste aparelho.">
      <article className="rounded-3xl bg-panel p-4">
        <p className="text-xs font-bold text-gold">Marca</p>
        <h2 className="font-serif text-3xl">Café Aurora</h2>
        <p className="mt-2 text-sm text-sand">Perfil patrocinado no deck, a cada passagem pela quarta pessoa.</p>
        <p className="mt-3 text-sm">Enquete: {product.state.polls.aurora ?? "ainda sem voto neste aparelho"}.</p>
        <p className="mt-1 text-sm">Cupons salvos: {product.state.coupons.length ? product.state.coupons.join(", ") : "nenhum"}.</p>
      </article>
      <h2 className="mt-6 font-serif text-2xl">Relatório de 30 dias</h2>
      <ul className="mt-2 space-y-1 text-sm">
        <li className="flex justify-between rounded-xl bg-panel px-3 py-2">
          <span>Curtidas</span>
          <span>{likes}</span>
        </li>
        <li className="flex justify-between rounded-xl bg-panel px-3 py-2">
          <span>Compras simuladas</span>
          <span>{buys}</span>
        </li>
        <li className="flex justify-between rounded-xl bg-panel px-3 py-2">
          <span>Gorjetas em reels</span>
          <span>{product.state.tips.length}</span>
        </li>
      </ul>
    </Subpage>
  );
}

export function RaffleScreen() {
  return (
    <Subpage title="Sorteio" lede="Esta campanha está adiada.">
      <article className="rounded-3xl bg-panel p-4 text-sm leading-relaxed text-sand">
        <p>O sorteio da moto não está aberto. Não há código, inscrição, bilhete nem prêmio.</p>
        <p className="mt-2">Ele só pode existir com autorização do Ministério da Fazenda. Até lá, a tela fica fechada de propósito.</p>
      </article>
    </Subpage>
  );
}

export function StoresScreen() {
  return <PwaStoresScreen />;
}

function PwaStoresScreen() {
  const [installHint, setInstallHint] = useState("");
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault();
      deferred.current = e as BeforeInstallPromptEvent;
      setInstallHint("Pronto para instalar como app neste aparelho.");
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    const evt = deferred.current;
    if (!evt) {
      setInstallHint(
        "No Chrome/Edge: menu → Instalar app. No iPhone: Compartilhar → Adicionar à Tela de Início.",
      );
      return;
    }
    await evt.prompt();
    const choice = await evt.userChoice;
    setInstallHint(choice.outcome === "accepted" ? "Instalação iniciada." : "Instalação cancelada.");
    deferred.current = null;
  }

  return (
    <Subpage
      title="Lojas e PWA"
      lede="Disponível em breve nas lojas. Enquanto isso, você pode instalar este site como app (PWA)."
    >
      <article className="space-y-3 rounded-3xl bg-panel p-4 text-sm leading-relaxed text-sand">
        <p className="font-semibold text-gold">Disponível em breve nas lojas</p>
        <p>
          A publicação na App Store e na Google Play ainda não foi enviada. Esta demo é honesta: não há ficha
          nas lojas neste momento.
        </p>
        <p>
          O manifesto, o ícone e o service worker já estão no produto. Você pode instalar o PWA no aparelho
          enquanto o build nativo não é submetido.
        </p>
      </article>
      <div className="mt-4 space-y-2 rounded-3xl bg-panel p-4 text-sm">
        <p className="font-semibold">Como instalar (PWA)</p>
        <ol className="list-decimal space-y-1 pl-5 text-sand">
          <li>Android Chrome: menu ⋮ → Instalar app / Adicionar à tela inicial.</li>
          <li>iPhone Safari: Compartilhar → Adicionar à Tela de Início.</li>
          <li>Desktop: ícone de instalação na barra de endereço, se aparecer.</li>
        </ol>
        <button className="mt-3 w-full rounded-2xl gold-fill py-3 font-bold" onClick={install}>
          Instalar neste aparelho
        </button>
        {installHint && <p className="mt-2 text-xs text-muted">{installHint}</p>}
      </div>
    </Subpage>
  );
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
