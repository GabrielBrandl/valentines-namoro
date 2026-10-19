"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { brl } from "@/lib/catalog";
import { useProduct } from "@/lib/product";

export function Subpage({ title, lede, children }: { title: string; lede?: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <div className="app-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-lg px-5 pt-[max(16px,env(safe-area-inset-top))] pb-16">
        <button onClick={() => router.back()} className="text-sm font-semibold text-muted">
          Voltar
        </button>
        <h1 className="mt-3 font-serif text-4xl tracking-tight">{title}</h1>
        {lede && <p className="mt-2 text-sm leading-relaxed text-sand">{lede}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export function Checkout({
  title,
  cents,
  onClose,
  onPaid,
}: {
  title: string;
  cents: number;
  onClose: () => void;
  onPaid: () => void;
}) {
  const code = `00020126SIMULADO${title.replace(/\s/g, "").slice(0, 18)}52040000530398654${cents}6304DEMO`;
  const [copied, setCopied] = useState(false);
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 md:place-items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-panel p-5 shadow-2xl md:rounded-3xl" onClick={(event) => event.stopPropagation()}>
        <p className="text-xs font-bold text-gold">PIX simulado</p>
        <h3 className="mt-1 font-serif text-3xl tracking-tight">{title}</h3>
        <p className="mt-2 text-2xl font-semibold">{brl(cents)}</p>
        <p className="mt-3 text-sm leading-relaxed text-sand">
          Nenhum PIX é enviado e nada é cobrado. O parceiro regulado ainda não foi escolhido. Confirmar só libera o item neste aparelho.
        </p>
        <p className="mt-3 break-all rounded-2xl bg-paper p-3 text-xs">{code}</p>
        <button
          className="mt-3 text-sm font-semibold text-gold"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
            } catch {
              /* o código continua visível na tela */
            }
            setCopied(true);
          }}
        >
          {copied ? "Código copiado" : "Copiar código"}
        </button>
        <button className="mt-4 w-full rounded-2xl gold-fill py-3 font-bold" onClick={onPaid}>
          Confirmar pagamento simulado
        </button>
      </div>
    </div>
  );
}

export function Qr({ text }: { text: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(text, { margin: 1, width: 240, color: { dark: "#1c1917", light: "#ffffff" } }).then((url) => {
      if (alive) setSrc(url);
    });
    return () => {
      alive = false;
    };
  }, [text]);
  if (!src) return <div className="h-40 w-40 rounded-xl bg-paper" />;
  return <Image src={src} alt="QR Code" width={160} height={160} unoptimized className="h-40 w-40 rounded-xl bg-panel p-2" />;
}

export function Paywall({ kind, onClose }: { kind: "super" | "undo" | "likes" | "pin"; onClose: () => void }) {
  const router = useRouter();
  const copy = {
    super: "A super curtida entra com um pacote ou com um plano.",
    undo: "Desfazer entra com um pacote ou com um plano.",
    likes: "Ver quem curtiu entra com a compra de 7 dias ou com o Plus.",
    pin: "Fixar a conversa é um item avulso de R$ 6,90.",
  }[kind];
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 md:place-items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-panel p-5 shadow-2xl md:rounded-3xl" onClick={(event) => event.stopPropagation()}>
        <h3 className="font-serif text-3xl tracking-tight">Esse item é avulso</h3>
        <p className="mt-2 text-sm leading-relaxed text-sand">{copy}</p>
        <div className="mt-4 grid gap-2">
          <button
            className="rounded-2xl gold-fill py-3 font-bold"
            onClick={() => {
              onClose();
              router.push("/loja");
            }}
          >
            Abrir a loja
          </button>
          <button
            className="rounded-2xl bg-paper py-3 font-semibold"
            onClick={() => {
              onClose();
              router.push("/planos");
            }}
          >
            Ver planos
          </button>
        </div>
      </div>
    </div>
  );
}

const REASONS = ["Perfil falso", "Menor de idade", "Assédio", "Spam", "Outro"];

export function ReportDialog({
  targetId,
  targetName,
  onClose,
  onReported,
}: {
  targetId: string;
  targetName: string;
  onClose: () => void;
  onReported?: () => void;
}) {
  const product = useProduct();
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 md:place-items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-panel p-5 shadow-2xl md:rounded-3xl" onClick={(event) => event.stopPropagation()}>
        {sent ? (
          <>
            <h3 className="font-serif text-3xl tracking-tight">Denúncia recebida</h3>
            <p className="mt-2 text-sm leading-relaxed text-sand">
              {targetName} saiu do seu feed. A fila de moderação está no painel de suporte.
              {reason === "Menor de idade" ? " Denúncia de menor fica no topo da fila." : ""}
            </p>
            <button className="mt-4 w-full rounded-2xl gold-fill py-3 font-bold" onClick={onClose}>
              Fechar
            </button>
          </>
        ) : (
          <>
            <h3 className="font-serif text-3xl tracking-tight">Denunciar {targetName}</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {REASONS.map((item) => (
                <button
                  key={item}
                  onClick={() => setReason(item)}
                  className={`rounded-full px-3 py-2 text-sm font-semibold ${reason === item ? "gold-fill" : "bg-paper"}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="Conte o que aconteceu, se quiser."
              className="mt-3 w-full resize-none rounded-2xl bg-paper px-4 py-3 outline-none"
            />
            <button
              className="mt-3 w-full rounded-2xl gold-fill py-3 font-bold"
              onClick={() => {
                product.report(targetId, targetName, reason, note);
                onReported?.();
                setSent(true);
              }}
            >
              Enviar denúncia
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function VerifiedMark({ on }: { on?: boolean }) {
  if (!on) return null;
  return (
    <span className="ml-1 inline-grid h-5 w-5 translate-y-[-2px] place-items-center rounded-full bg-mint text-[11px] font-bold text-white" title="Verificado">
      ✓
    </span>
  );
}

