"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { brand } from "@/lib/brand";
import { SMS_CODE, VERIFY_LABEL, useProduct } from "@/lib/product";
import { Subpage } from "./product-ui";

export function VerifyScreen() {
  const product = useProduct();
  const router = useRouter();
  const [docName, setDocName] = useState("");
  const [face, setFace] = useState(false);
  const [turn, setTurn] = useState(false);
  const [error, setError] = useState("");
  const status = product.state.verification;

  return (
    <Subpage
      title="Verificação"
      lede="A idade não fica só na declaração. Este aparelho pede captcha, código e um pedido de análise. A imagem não é guardada e não há reconhecimento facial aqui."
    >
      <p className="rounded-2xl bg-panel px-4 py-3 text-sm font-semibold">
        Status: {VERIFY_LABEL[status]}
        {product.state.ageSignal !== "nenhum" ? ` · sinal de idade: ${product.state.ageSignal}` : ""}
      </p>
      {product.state.reverify && (
        <p className="mt-3 rounded-2xl gold-border bg-black/40 px-4 py-3 text-sm text-gold">
          Sua conta pediu uma nova checagem. Envie de novo para manter o selo. Quem completa ganha o selo, sem taxa.
        </p>
      )}

      <section className="mt-5 rounded-3xl bg-panel p-4">
        <h2 className="font-semibold">Consentimento do dado biométrico</h2>
        <p className="mt-2 text-sm leading-relaxed text-sand">
          A captura serve só para confirmar que a conta é de uma pessoa maior de 18 anos. A imagem não fica no app, não vira um modelo biométrico e não é vendida. Você pode recusar: a conta continua, sem o selo de verificado. A revisão jurídica deste texto ainda é necessária antes do lançamento.
        </p>
        <button
          className="mt-3 rounded-2xl gold-fill px-4 py-3 text-sm font-bold"
          onClick={() => product.giveConsent()}
        >
          {product.state.consentAt ? "Consentimento registrado" : "Aceito este uso"}
        </button>
      </section>

      <section className="mt-4 space-y-3">
        <label className="block rounded-2xl bg-panel p-4 text-sm">
          Documento (não guardamos o arquivo)
          <input
            type="file"
            accept="image/*"
            className="mt-2 block w-full text-sm"
            disabled={!product.state.consentAt}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setDocName(file.name);
              product.setAgeSignal("documento");
              event.target.value = "";
            }}
          />
          {docName && <span className="mt-1 block text-mint">Arquivo lido e descartado: {docName}</span>}
        </label>
        <label className="block rounded-2xl bg-panel p-4 text-sm">
          Olhe para a câmera
          <input
            type="file"
            accept="image/*"
            capture="user"
            className="mt-2 block w-full text-sm"
            disabled={!product.state.consentAt}
            onChange={(event) => {
              if (event.target.files?.[0]) setFace(true);
              event.target.value = "";
            }}
          />
          {face && <span className="mt-1 block text-mint">Captura recebida e descartada.</span>}
        </label>
        <label className="block rounded-2xl bg-panel p-4 text-sm">
          Vire um pouco o rosto
          <input
            type="file"
            accept="image/*"
            capture="user"
            className="mt-2 block w-full text-sm"
            disabled={!product.state.consentAt}
            onChange={(event) => {
              if (event.target.files?.[0]) setTurn(true);
              event.target.value = "";
            }}
          />
          {turn && <span className="mt-1 block text-mint">Segunda captura recebida e descartada.</span>}
        </label>
      </section>

      {error && <p className="mt-3 text-sm text-gold">{error}</p>}
      <button
        className="mt-4 w-full rounded-2xl gold-fill py-3 font-bold disabled:opacity-40"
        disabled={!docName || !face || !turn}
        onClick={() => {
          const message = product.submitReview();
          if (message) {
            setError(message);
            return;
          }
          router.push("/perfil");
        }}
      >
        Enviar para análise
      </button>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        O código de SMS do cadastro, quando não há operadora, é {SMS_CODE}. O fornecedor de prova de vida (Unico, Serpro ou idwall) entra depois. O selo de verificado é gratuito. A análise final, neste aparelho, fica no painel admin.
      </p>
      <p className="mt-4 text-sm text-muted">{brand.name} guarda o status: não verificado, em análise ou verificado.</p>
    </Subpage>
  );
}
