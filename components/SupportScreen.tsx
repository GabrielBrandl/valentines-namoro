"use client";

import { useState } from "react";
import { useProduct } from "@/lib/product";
import { Subpage } from "./product-ui";

export function SupportScreen() {
  const product = useProduct();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState("");
  const openReports = product.state.reports.filter((item) => item.status === "aberto");
  return (
    <Subpage title="Suporte" lede="Canal para pico de uso: chamado seu e a fila do que você denunciou.">
      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (subject.trim().length < 3 || body.trim().length < 8) {
            setSent("Escreva o assunto e um pouco mais de detalhe.");
            return;
          }
          product.openTicket(subject, body);
          setSubject("");
          setBody("");
          setSent("Chamado aberto. A resposta aparece aqui.");
        }}
      >
        <input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="Assunto"
          className="w-full rounded-2xl bg-panel px-4 py-3 outline-none"
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={4}
          placeholder="O que aconteceu?"
          className="w-full resize-none rounded-2xl bg-panel px-4 py-3 outline-none"
        />
        <button className="w-full rounded-2xl gold-fill py-3 font-bold">Enviar</button>
      </form>
      {sent && <p className="mt-2 text-sm text-sand">{sent}</p>}
      <div className="mt-5 space-y-2">
        {product.state.tickets.map((ticket) => (
          <article key={ticket.id} className="rounded-2xl bg-panel p-3 text-sm">
            <p className="font-semibold">{ticket.subject}</p>
            <p className="mt-1 text-sand">{ticket.body}</p>
            <p className="mt-2 text-xs font-bold text-muted">{ticket.status === "respondido" ? "Respondido" : "Aberto"}</p>
            {ticket.reply && <p className="mt-1">{ticket.reply}</p>}
          </article>
        ))}
      </div>
      <h2 className="mt-8 font-serif text-2xl">Suas denúncias</h2>
      <p className="mt-1 text-sm text-muted">{openReports.length} em aberto.</p>
      <div className="mt-3 space-y-2">
        {product.state.reports.map((report) => (
          <article key={report.id} className="rounded-2xl bg-panel p-3 text-sm">
            <p className="font-semibold">
              {report.targetName} · {report.reason}
            </p>
            <p className="text-muted">{report.status === "aberto" ? "Na fila" : "Encerrada"}</p>
          </article>
        ))}
      </div>
    </Subpage>
  );
}
