"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PersonSheet } from "./PersonSheet";
import { Clock, Photo, When } from "./Media";
import { IconSearch } from "./Icons";
import { getPerson } from "@/lib/seed";
import { GIFT_LABEL } from "@/lib/catalog";
import { useProduct } from "@/lib/product";
import { useFecon } from "@/lib/store";
import type { Person } from "@/lib/types";
import { Paywall, ReportDialog } from "./product-ui";

const ROOMS = [
  { id: "amor", title: "Amor sem rótulos", detail: "Conexões livres, sem pressão e sem julgamento.", people: 12800, tag: "LGBTQIA+", tone: "from-[#ff4d8d] to-[#7a1cff]", icon: "🌈" },
  { id: "paquera", title: "Paquera & Flertes", detail: "Conversas leves, química e novas histórias.", people: 8400, tag: "Geral", tone: "from-[#ff2d55] to-[#ff7a18]", icon: "💋" },
  { id: "serio", title: "Relacionamentos Sérios", detail: "Quem busca compromisso de verdade.", people: 6200, tag: "Hetero", tone: "from-[#d4af37] to-[#8a5a00]", icon: "💛" },
  { id: "amizade", title: "Amizades & Conexões", detail: "Companhia, rolês e pessoas reais.", people: 4900, tag: "Geral", tone: "from-[#4fd3ff] to-[#2a6dff]", icon: "👥" },
  { id: "lgbt", title: "Mundo LGBTQIA+", detail: "Espaço seguro pra comunidade.", people: 9700, tag: "LGBTQIA+", tone: "from-[#7a1cff] to-[#ff4d8d]", icon: "🏳️‍🌈" },
];

const FILTERS = ["Todas", "Hetero", "LGBTQIA+", "Geral"] as const;

export function Inbox({ activeId }: { activeId?: string }) {
  const { matches, messages, likesYou, like, pass, lastRead } = useFecon();
  const product = useProduct();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Todas");
  const [sheet, setSheet] = useState<Person | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [tab, setTab] = useState<"salas" | "matches">(matches.length > 0 || Boolean(activeId) ? "matches" : "salas");
  const [roomId, setRoomId] = useState<string | null>(null);
  const router = useRouter();
  const activeRoom = roomId ? ROOMS.find((room) => room.id === roomId) : null;

  const incoming = likesYou.filter((person) => !product.state.hidden.includes(person.id));
  const rows = useMemo(() => {
    return matches
      .map((match) => {
        const person = getPerson(match.id);
        const thread = messages.filter((message) => message.matchId === match.id);
        const last = thread[thread.length - 1];
        const readAt = lastRead[match.id] ?? 0;
        const unreadMsg = thread.some((message) => message.from === "them" && message.at > readAt);
        const unreadMatch = readAt < match.at;
        const unread = unreadMsg || unreadMatch;
        return { match, person, last, unread };
      })
      .filter((row) => row.person && !product.state.hidden.includes(row.person.id) && row.person.name.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => {
        const pin = Number(product.state.pins.includes(b.match.id)) - Number(product.state.pins.includes(a.match.id));
        return pin || (b.last?.at ?? b.match.at) - (a.last?.at ?? a.match.at);
      });
  }, [matches, messages, query, lastRead, product.state.hidden, product.state.pins]);

  const rooms = ROOMS.filter((room) => {
    if (filter !== "Todas" && room.tag !== filter) return false;
    return room.title.toLowerCase().includes(query.trim().toLowerCase());
  });

  return (
    <div className="grid h-full bg-paper md:grid-cols-[360px_minmax(0,1fr)]">
      <section className={`${activeId || activeRoom ? "hidden md:flex" : "flex"} h-full min-h-0 min-w-0 flex-col overflow-hidden border-line md:border-r`}>
        <div className="px-4 pt-[max(16px,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-serif text-[28px] tracking-tight gold-text">
              {tab === "salas" ? "Salas de Bate-Papo" : "Matches"}
            </h1>
            <div className="flex items-center gap-2">
              <button
                className={`rounded-full px-3 py-1 text-[10px] font-semibold ${tab === "matches" ? "gold-fill" : "bg-panel text-muted"}`}
                onClick={() => setTab(tab === "salas" ? "matches" : "salas")}
              >
                {tab === "salas" ? "Matches" : "Salas"}
              </button>
              <button
                className="grid h-9 w-9 place-items-center rounded-full text-gold"
                onClick={() => setQuery((q) => (q ? "" : " "))}
                aria-label="Buscar"
              >
                <IconSearch className="h-5 w-5" />
              </button>
            </div>
          </div>
          {query !== "" && (
            <input
              value={query.trim()}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === "salas" ? "Buscar sala" : "Buscar conversa"}
              autoFocus
              className="mt-3 box-border w-full min-w-0 rounded-2xl border border-line bg-panel px-4 py-3 text-base outline-none"
            />
          )}
        </div>

        {tab === "salas" ? (
          <>
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4">
              {FILTERS.map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    filter === item ? "gold-fill" : "bg-panel text-muted"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="app-scroll mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-4">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left ${
                    roomId === room.id ? "bg-panel-2 ring-1 ring-[#d4af37]/35" : "bg-panel"
                  }`}
                  onClick={() => setRoomId(room.id)}
                >
                  <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${room.tone} text-xl`}>
                    {room.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{room.title}</span>
                    <span className="mt-0.5 block truncate text-sm text-muted">{room.detail}</span>
                    <span className="mt-1 block text-xs text-gold">{(room.people / 1000).toFixed(1).replace(".", ",")}k participantes</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {incoming.length > 0 && (
              <div className="mt-4 px-4">
                <p className="text-xs font-bold text-gold">Curtiram você</p>
                <div className="mt-2 flex gap-3 overflow-x-auto pb-2">
                  {incoming.map((person) => (
                    <button
                      key={person.id}
                      className="w-16 shrink-0 text-center"
                      onClick={() => {
                        if (!product.canSeeLikes) {
                          setPaywall(true);
                          return;
                        }
                        setSheet(person);
                      }}
                    >
                      <Photo
                        src={person.photos[0]}
                        alt=""
                        className={`h-16 w-16 rounded-full object-cover ring-2 ring-gold ${product.canSeeLikes ? "" : "blur-md"}`}
                      />
                      <span className="mt-1 block truncate text-xs">{product.canSeeLikes ? person.name : "Alguém"}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="app-scroll min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {rows.length === 0 && (
                <p className="px-3 py-8 text-sm text-muted">Quando a curtida for dos dois lados, a conversa aparece aqui.</p>
              )}
              {rows.map(({ match, person, last, unread }) => (
                <button
                  key={match.id}
                  onClick={() => router.push(`/chat/${match.id}`)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left ${
                    activeId === match.id ? "bg-panel" : "hover:bg-panel"
                  }`}
                >
                  <Photo src={person!.photos[0]} alt="" className="h-14 w-14 rounded-full object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate font-semibold">{person!.name}</span>
                      <span className="shrink-0 whitespace-nowrap pl-2 text-[11px] text-muted">
                        <When at={last?.at ?? match.at} />
                      </span>
                    </span>
                    <span className={`mt-0.5 block truncate text-sm ${unread ? "font-semibold text-ink" : "text-muted"}`}>
                      {last ? last.text : "Novo match. Diga oi."}
                    </span>
                  </span>
                  {unread && <span className="h-2.5 w-2.5 rounded-full gold-fill" />}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <section className={`${activeId || activeRoom ? "flex" : "hidden md:flex"} h-full min-h-0`}>
        {activeId ? (
          <ChatPane id={activeId} />
        ) : activeRoom ? (
          <RoomPane room={activeRoom} onBack={() => setRoomId(null)} />
        ) : (
          <div className="grid flex-1 place-items-center px-8 text-center text-muted">
            <p>Escolha um match ou entre numa sala para conversar.</p>
          </div>
        )}
      </section>

      {sheet && (
        <PersonSheet
          person={sheet}
          onClose={() => setSheet(null)}
          onPass={() => {
            pass(sheet.id);
            setSheet(null);
          }}
          onLike={() => {
            like(sheet.id);
            setSheet(null);
          }}
          onSuper={() => {
            like(sheet.id, true);
            setSheet(null);
          }}
        />
      )}
      {paywall && <Paywall kind="likes" onClose={() => setPaywall(false)} />}
    </div>
  );
}

const suggestions = [
  "Oi, seu perfil me chamou atenção.",
  "Café ou fim de tarde?",
  "Qual rolê você repetiria amanhã?",
];

const emojis = ["😊", "❤️", "😂", "🔥", "✨", "☕", "🎶", "👋"];

const ROOM_FEED: Record<string, { who: string; text: string }[]> = {
  amor: [
    { who: "Luna", text: "Alguém aqui de SP pra um café sem pressa?" },
    { who: "Theo", text: "Eu. Prefiro conversa boa a roteiro pronto." },
    { who: "Marina", text: "Mesma vibe. Sem rótulo, com respeito." },
  ],
  paquera: [
    { who: "Rafa", text: "Primeira impressão conta. Manda a melhor abertura de vocês." },
    { who: "Lara", text: "Oi + pergunta sincera. Sem copy colada." },
    { who: "Diego", text: "Concordo. Química começa no tom." },
  ],
  serio: [
    { who: "Helena", text: "Buscando algo estável. Quem também?" },
    { who: "Lucas", text: "Aqui. Conversar com intenção faz diferença." },
  ],
  amizade: [
    { who: "Camila", text: "Rolê de museu no domingo, alguém topa?" },
    { who: "Beatriz", text: "Eu! E um café depois." },
  ],
  lgbt: [
    { who: "Aurora", text: "Espaço seguro pra existir em paz. Bem-vindes." },
    { who: "Júlia", text: "Obrigada. Precisava ler isso hoje." },
  ],
};

function RoomPane({
  room,
  onBack,
}: {
  room: (typeof ROOMS)[number];
  onBack: () => void;
}) {
  const [text, setText] = useState("");
  const [feed, setFeed] = useState(() => ROOM_FEED[room.id] ?? [{ who: "Sala", text: "Bem-vindo. Seja respeitoso." }]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFeed(ROOM_FEED[room.id] ?? [{ who: "Sala", text: "Bem-vindo. Seja respeitoso." }]);
  }, [room.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [feed.length]);

  function send() {
    const body = text.trim();
    if (!body) return;
    setFeed((rows) => [...rows, { who: "Você", text: body }]);
    setText("");
    window.setTimeout(() => {
      setFeed((rows) => [...rows, { who: "Sala", text: "Mensagem recebida na demo. Em produção isso iria ao chat ao vivo." }]);
    }, 700);
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-paper">
      <header className="flex items-center gap-3 border-b border-line bg-black px-3 py-[max(10px,env(safe-area-inset-top))]">
        <button className="grid h-11 w-11 place-items-center text-3xl leading-none text-gold md:hidden" onClick={onBack} aria-label="Voltar">
          ‹
        </button>
        <span className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${room.tone} text-lg`}>{room.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{room.title}</p>
          <p className="text-xs text-gold">{(room.people / 1000).toFixed(1).replace(".", ",")}k online (demo)</p>
        </div>
        <button className="hidden text-sm font-semibold text-muted md:inline" onClick={onBack}>
          Fechar
        </button>
      </header>
      <div className="chat-bg app-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-4">
        {feed.map((row, index) => {
          const mine = row.who === "Você";
          return (
            <div key={`${row.who}-${index}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-[15px] leading-snug ${mine ? "rounded-br-md gold-fill" : "rounded-bl-md bg-[#1c1c1c]"}`}>
                {!mine && <p className="mb-0.5 text-[11px] font-semibold text-gold">{row.who}</p>}
                <p className="whitespace-pre-wrap">{row.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <footer className="border-t border-line bg-black px-3 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Mensagem na sala..."
            className="min-w-0 flex-1 rounded-full bg-panel px-4 py-3 text-base outline-none"
          />
          <button type="submit" className="grid h-11 w-11 place-items-center rounded-full gold-fill text-lg font-bold" aria-label="Enviar">
            ➤
          </button>
        </form>
      </footer>
    </div>
  );
}

export function ChatPane({ id }: { id: string }) {
  const { messages, sendMessage, markRead, typingId, matches } = useFecon();
  const product = useProduct();
  const person = getPerson(id);
  const router = useRouter();
  const [text, setText] = useState("");
  const [report, setReport] = useState(false);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const thread = messages.filter((message) => message.matchId === id);
  const matched = matches.some((match) => match.id === id);

  useEffect(() => {
    if (matched) markRead(id);
  }, [matched, id, thread.length, markRead]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread.length, typingId]);

  if (!person || !matched || product.state.hidden.includes(id)) {
    return (
      <div className="grid flex-1 place-items-center px-6 text-center text-muted">
        <div>
          <p>Essa conversa não está disponível.</p>
          <button className="mt-4 rounded-2xl gold-fill px-4 py-2 text-sm font-bold" onClick={() => router.push("/matches")}>
            Voltar ao chat
          </button>
        </div>
      </div>
    );
  }

  const lastMine = [...thread].reverse().find((message) => message.from === "me");

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2400);
  }

  function send(value = text, media?: string) {
    const body = value.trim();
    if (!body && !media) return;
    const ok = sendMessage(id, body, media);
    if (!ok) {
      flash("Calma — no máximo 8 mensagens a cada 20 segundos.");
      return;
    }
    product.track("mensagem");
    setText("");
  }

  async function attachImage(file: File) {
    try {
      const { compressImage, idbSet } = await import("@/lib/idb");
      const blob = await compressImage(file);
      const key = `chat-${crypto.randomUUID()}`;
      await idbSet(key, blob);
      send(text || "📷 Foto", `idb:${key}`);
    } catch {
      flash("Não consegui anexar essa imagem.");
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-paper">
      <header className="flex items-center gap-3 border-b border-line bg-black px-3 py-[max(10px,env(safe-area-inset-top))]">
        <button className="grid h-11 w-11 place-items-center text-3xl leading-none text-gold md:hidden" onClick={() => router.push("/matches")} aria-label="Voltar">
          ‹
        </button>
        <Photo src={person.photos[0]} alt="" className="h-11 w-11 rounded-full object-cover ring-1 ring-gold/50" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{person.name}</p>
          <p className={`text-xs font-semibold ${person.online ? "text-mint" : "text-muted"}`}>
            {person.online ? "Online" : "visto recentemente"}
          </p>
        </div>
        <button
          className="grid h-10 w-10 place-items-center text-gold"
          aria-label="Ligar"
          onClick={() => {
            setNote("Chamada de voz ainda não entra nesta demo.");
            window.setTimeout(() => setNote(""), 2400);
          }}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z" />
          </svg>
        </button>
        <button className="grid h-10 w-10 place-items-center text-gold" onClick={() => setReport(true)} aria-label="Mais">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <circle cx="5" cy="12" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="19" cy="12" r="1.6" />
          </svg>
        </button>
      </header>
      <div className="chat-bg app-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-4">
        {thread.length === 0 && (
          <div className="mx-auto mt-6 max-w-sm text-center">
            <p className="text-sm text-muted">Vocês deram match. Quebra o gelo:</p>
            <div className="mt-3 flex flex-col gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  className="rounded-2xl bg-panel px-4 py-3 text-sm font-medium"
                  onClick={() => send(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        {thread.map((message, index) => {
          const mine = message.from === "me";
          const previous = thread[index - 1];
          const showDay =
            !previous || new Date(previous.at).toDateString() !== new Date(message.at).toDateString();
          const seen = mine && thread.some((item) => item.from === "them" && item.at > message.at);
          return (
            <div key={message.id}>
              {showDay && (
                <p className="my-2 text-center text-[11px] uppercase tracking-wider text-muted">
                  <When at={message.at} mode="day" />
                </p>
              )}
              <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 text-[15px] leading-snug ${
                    mine
                      ? "rounded-br-md gold-fill"
                      : "rounded-bl-md bg-[#1c1c1c] text-ink"
                  }`}
                >
                  {message.media && (
                    <Photo
                      src={message.media}
                      alt=""
                      className="mb-2 max-h-56 w-full rounded-xl object-cover"
                    />
                  )}
                  {message.text && message.text !== "📷 Foto" && (
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  )}
                  {message.text === "📷 Foto" && !message.media && (
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  )}
                  <p className={`mt-1 text-right text-[10px] ${mine ? "text-black/55" : "text-muted"}`}>
                    <Clock at={message.at} />
                    {mine && message.id === lastMine?.id ? (seen ? " · visto" : " · enviado") : ""}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
        {typingId === id && (
          <div className="w-fit rounded-2xl rounded-bl-md bg-panel px-4 py-3">
            <span className="inline-flex gap-1">
              <i className="h-1.5 w-1.5 rounded-full bg-gold/70" />
              <i className="h-1.5 w-1.5 rounded-full bg-gold/70" />
              <i className="h-1.5 w-1.5 rounded-full bg-gold/70" />
            </span>
          </div>
        )}
      </div>
      <footer className="border-t border-line bg-black px-3 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]">
        {(note || toast) && (
          <p className="mb-2 text-center text-xs font-semibold text-gold">{toast || note}</p>
        )}
        {Object.entries(product.state.gifts).some(([, count]) => count > 0) && (
          <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
            {Object.entries(product.state.gifts)
              .filter(([, count]) => count > 0)
              .map(([giftId, count]) => (
                <button
                  key={giftId}
                  className="shrink-0 rounded-full bg-panel px-3 py-2 text-xs font-semibold"
                  onClick={() => {
                    const gift = product.sendGift(person.name, giftId);
                    if (gift) {
                      send(gift);
                      product.track("presente");
                    }
                  }}
                >
                  {GIFT_LABEL[giftId] ?? giftId} · {count}
                </button>
              ))}
          </div>
        )}
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full bg-panel text-lg text-gold"
            aria-label="Anexar foto"
            onClick={() => fileRef.current?.click()}
          >
            +
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) attachImage(file);
              e.target.value = "";
            }}
          />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="min-w-0 flex-1 rounded-full bg-panel px-4 py-3 text-base outline-none"
          />
          <button
            type="button"
            className="grid h-10 w-10 place-items-center text-xl"
            onClick={() => setText((curr) => curr + emojis[Math.floor(Math.random() * emojis.length)])}
            aria-label="Emoji"
          >
            😊
          </button>
          <button type="submit" className="grid h-11 w-11 place-items-center rounded-full gold-fill text-lg font-bold" aria-label="Enviar">
            ➤
          </button>
        </form>
      </footer>
      {report && <ReportDialog targetId={person.id} targetName={person.name} onClose={() => setReport(false)} />}
    </div>
  );
}
