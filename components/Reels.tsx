"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Photo, useMediaSrc } from "./Media";
import { IconComment, IconHeart, IconPlus, IconShare, IconX } from "./Icons";
import { getPerson } from "@/lib/seed";
import { useProduct } from "@/lib/product";
import { useFecon } from "@/lib/store";
import { videoDuration } from "@/lib/video";
import { brand } from "@/lib/brand";
import type { Me, Reel } from "@/lib/types";
import { ReportDialog } from "./product-ui";

export function Reels({ mode = "reels" }: { mode?: "home" | "reels" }) {
  const { reels, me, toggleLike, addComment, publishReel, deleteReel, following, toggleFollow, reportReel } =
    useFecon();
  const product = useProduct();
  const ordered = [...reels].sort(
    (a, b) => Number(product.highlighted(b.id)) - Number(product.highlighted(a.id)) || b.at - a.at,
  );
  const [tab, setTab] = useState<"seguindo" | "para-voce">(mode === "home" ? "para-voce" : "para-voce");
  const [active, setActive] = useState(ordered[0]?.id ?? "");
  const [muted, setMuted] = useState(true);
  const [sheet, setSheet] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [reportReelId, setReportReelId] = useState<string | null>(null);

  const followingFeed = ordered.filter(
    (reel) => reel.mine || following.includes(reel.authorId),
  );
  const feed = tab === "seguindo" ? followingFeed : ordered;
  const emptyFollowing = tab === "seguindo" && followingFeed.length === 0;
  const list = emptyFollowing ? [] : feed.length ? feed : ordered;
  const activeReel = list.find((reel) => reel.id === active) ?? list[0];
  const sheetReel = sheet ? reels.find((reel) => reel.id === sheet) : undefined;
  const reportTarget = reportReelId ? reels.find((r) => r.id === reportReelId) : null;
  const reportAuthor = reportTarget
    ? reportTarget.authorId === "me"
      ? me?.name || "Você"
      : getPerson(reportTarget.authorId)?.name || "Autor"
    : "";

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("v");
    if (!id) return;
    document.getElementById(`reel-${id}`)?.scrollIntoView({ block: "start" });
  }, [list.length]);

  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-center gap-6 pt-[max(14px,env(safe-area-inset-top))] text-[15px] font-semibold text-white/55">
        <button
          className={`pointer-events-auto ${tab === "seguindo" ? "text-white" : ""}`}
          onClick={() => setTab("seguindo")}
        >
          Seguindo
        </button>
        <button
          className={`pointer-events-auto relative ${tab === "para-voce" ? "text-white" : ""}`}
          onClick={() => setTab("para-voce")}
        >
          Para você
          {tab === "para-voce" && <span className="absolute -bottom-1 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full gold-fill" />}
        </button>
      </div>

      {emptyFollowing ? (
        <div className="grid h-full place-items-center px-8 text-center text-white/70">
          <div>
            <p className="font-serif text-2xl text-gold">Ninguém na lista ainda</p>
            <p className="mt-2 text-sm">
              Toque em + no avatar de um reel em Para você para seguir. A lista sobrevive ao refresh.
            </p>
            <button className="mt-5 rounded-2xl gold-fill px-5 py-3 text-sm font-bold text-black" onClick={() => setTab("para-voce")}>
              Ver Para você
            </button>
          </div>
        </div>
      ) : (
        <div className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto">
          {list.map((reel) => (
            <Slide
              key={reel.id}
              reel={reel}
              me={me}
              muted={muted}
              following={following.includes(reel.authorId)}
              onActive={setActive}
              onToggleMute={() => setMuted((value) => !value)}
              onLike={() => {
                if (!reel.liked) product.track("reel");
                toggleLike(reel.id);
              }}
              onComment={() => setSheet(reel.id)}
              onFollow={() => toggleFollow(reel.authorId)}
              onReport={() => setReportReelId(reel.id)}
            />
          ))}
        </div>
      )}

      <button
        className="absolute right-4 top-[max(12px,env(safe-area-inset-top))] z-30 grid h-10 w-10 place-items-center rounded-full gold-fill shadow-lg"
        onClick={() => setPublishing(true)}
        aria-label="Publicar"
      >
        <IconPlus className="h-5 w-5" />
      </button>

      {sheetReel && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/70" onClick={() => setSheet(null)}>
          <div className="max-h-[75dvh] w-full" onClick={(e) => e.stopPropagation()}>
            <Comments
              reel={sheetReel}
              onClose={() => setSheet(null)}
              onSend={(text) => addComment(sheetReel.id, text)}
              onDelete={
                sheetReel.mine
                  ? () => {
                      deleteReel(sheetReel.id);
                      setSheet(null);
                    }
                  : undefined
              }
            />
          </div>
        </div>
      )}

      {publishing && (
        <Publish
          onClose={() => setPublishing(false)}
          onPublish={async (file, caption) => {
            await publishReel(file, caption);
            setPublishing(false);
          }}
        />
      )}

      {reportTarget && (
        <ReportDialog
          targetId={reportTarget.authorId === "me" ? "me" : reportTarget.authorId}
          targetName={reportAuthor}
          onClose={() => setReportReelId(null)}
          onReported={() => reportReel(reportTarget.id)}
        />
      )}

      {activeReel && (
        <aside className="pointer-events-none absolute inset-y-0 right-0 hidden w-[360px] border-l border-line bg-panel lg:pointer-events-auto lg:block">
          <Comments
            reel={activeReel}
            onSend={(text) => addComment(activeReel.id, text)}
            onDelete={activeReel.mine ? () => deleteReel(activeReel.id) : undefined}
          />
        </aside>
      )}
    </div>
  );
}

function Slide({
  reel,
  me,
  muted,
  following,
  onActive,
  onToggleMute,
  onLike,
  onComment,
  onFollow,
  onReport,
}: {
  reel: Reel;
  me: Me | null;
  muted: boolean;
  following: boolean;
  onActive: (id: string) => void;
  onToggleMute: () => void;
  onLike: () => void;
  onComment: () => void;
  onFollow: () => void;
  onReport: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLElement>(null);
  const lastTap = useRef(0);
  const [burst, setBurst] = useState(false);
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const [followNote, setFollowNote] = useState(false);
  const src = useMediaSrc(reel.media);
  const poster = useMediaSrc(reel.poster);
  const isVideo = !/\.(jpe?g|png|webp|gif)(\?|$)/i.test(reel.media);
  const author = authorOf(reel, me);
  const product = useProduct();
  const highlighted = product.highlighted(reel.id);
  const handle = `@${author.name.toLowerCase().replace(/\s+/g, ".")}`;
  const isMine = reel.authorId === "me";

  useEffect(() => {
    const node = boxRef.current;
    const video = videoRef.current;
    if (!node || !video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onActive(reel.id);
          video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.72 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reel.id, onActive, src]);

  return (
    <article id={`reel-${reel.id}`} ref={boxRef} className="relative h-full snap-start overflow-hidden bg-black">
      {src && isVideo && !failed ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster || undefined}
          className="absolute inset-0 h-full w-full object-cover"
          loop
          playsInline
          muted={muted}
          onError={() => setFailed(true)}
          onClick={(event) => {
            const now = Date.now();
            if (now - lastTap.current < 280) {
              if (!reel.liked) onLike();
              setBurst(true);
              window.setTimeout(() => setBurst(false), 700);
            }
            lastTap.current = now;
            event.preventDefault();
          }}
        />
      ) : (
        <Photo src={reel.poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/35" />
      {burst && <IconHeart className="heart-pop pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 text-gold" />}

      <div className="absolute right-3 bottom-28 z-10 flex flex-col items-center gap-5 text-white drop-shadow-lg">
        <div className="relative">
          <Photo src={author.photo} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-white" />
          {!isMine && (
            <button
              type="button"
              aria-label={following ? "Deixar de seguir" : "Seguir"}
              className="absolute -bottom-1 left-1/2 grid h-5 w-5 -translate-x-1/2 place-items-center rounded-full gold-fill text-xs font-bold"
              onClick={() => {
                onFollow();
                setFollowNote(true);
                window.setTimeout(() => setFollowNote(false), 1400);
              }}
            >
              {following ? "✓" : "+"}
            </button>
          )}
          {followNote && (
            <span className="absolute left-1/2 top-14 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-semibold">
              {!following ? "Seguindo" : "Deixou de seguir"}
            </span>
          )}
        </div>
        <button className="grid place-items-center gap-1" onClick={onLike} aria-label="Curtir">
          <IconHeart className={`h-8 w-8 ${reel.liked ? "text-gold" : ""}`} />
          <span className="text-xs font-semibold">{formatCount(reel.likes)}</span>
        </button>
        <button className="grid place-items-center gap-1" onClick={onComment} aria-label="Comentar">
          <IconComment className="h-8 w-8" />
          <span className="text-xs font-semibold">{formatCount(reel.comments.length)}</span>
        </button>
        <button
          className="grid place-items-center gap-1"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(reel.caption);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1200);
            } catch {
              setCopied(true);
            }
          }}
          aria-label="Compartilhar"
        >
          <IconShare className="h-7 w-7" />
          <span className="text-xs font-semibold">{copied ? "Ok" : "1,2k"}</span>
        </button>
        {!isMine && (
          <button
            className="grid place-items-center gap-1 text-[10px] font-semibold text-white/80"
            onClick={onReport}
            aria-label="Denunciar reel"
          >
            <span className="text-lg leading-none">⚑</span>
            Denunciar
          </button>
        )}
        <button
          className="mt-1 grid h-11 w-11 place-items-center overflow-hidden rounded-full border-2 border-white/40"
          onClick={onToggleMute}
          aria-label={muted ? "Ativar som" : "Silenciar"}
        >
          <Photo src={author.photo} alt="" className="h-full w-full animate-spin object-cover [animation-duration:8s]" />
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pr-20 pb-5 pt-20 text-white [text-shadow:0_1px_2px_#000]">
        <p className="font-bold">
          {handle}
          {highlighted ? <span className="ml-2 rounded-full gold-fill px-2 py-0.5 text-[10px] text-black">Destaque</span> : null}
        </p>
        <p className="mt-1 text-sm leading-snug text-white/95">
          {reel.caption} <span className="text-white/80">#valentines</span> <span className="text-white/80">#reels</span>{" "}
          <span className="text-white/80">#conexões</span>
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-white/85">
          <span aria-hidden>♪</span>
          <span className="truncate">Som original - {author.name.toLowerCase().replace(/\s+/g, ".")}</span>
        </p>
      </div>
    </article>
  );
}

function Comments({
  reel,
  onSend,
  onClose,
  onDelete,
}: {
  reel: Reel;
  onSend: (text: string) => void;
  onClose?: () => void;
  onDelete?: () => void;
}) {
  const [text, setText] = useState("");
  if (!reel) return null;

  function submit(event: FormEvent) {
    event.preventDefault();
    onSend(text);
    setText("");
  }

  return (
    <div className="flex h-full max-h-[75dvh] flex-col rounded-t-3xl bg-panel text-ink lg:max-h-none lg:rounded-none">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="font-semibold">Comentários</p>
        <div className="flex items-center gap-3">
          {onDelete && (
            <button className="text-sm text-gold" onClick={onDelete}>
              Apagar
            </button>
          )}
          {onClose && (
            <button aria-label="Fechar" onClick={onClose}>
              <IconX className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      <div className="app-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-3">
        {reel.comments.length === 0 && <p className="text-sm text-muted">Seja a primeira pessoa a comentar.</p>}
        {reel.comments.map((comment) => (
          <div key={comment.id}>
            <p className="text-sm font-semibold">{comment.author}</p>
            <p className="text-sm text-sand">{comment.text}</p>
          </div>
        ))}
      </div>
      <form className="flex gap-2 border-t border-line p-3" onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva um comentário"
          className="min-w-0 flex-1 rounded-full bg-black px-4 py-3 text-base outline-none"
        />
        <button className="rounded-full gold-fill px-4 text-sm font-semibold">Publicar</button>
      </form>
    </div>
  );
}

function Publish({
  onClose,
  onPublish,
}: {
  onClose: () => void;
  onPublish: (file: File, caption: string) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 md:place-items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-panel p-5 shadow-2xl md:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif text-3xl tracking-tight gold-text">Novo reel</h3>
        <label className="mt-4 block overflow-hidden rounded-2xl bg-black">
          {preview ? (
            <video src={preview} className="aspect-[9/14] w-full object-cover" muted playsInline controls />
          ) : (
            <span className="grid aspect-[9/14] place-items-center text-sm text-muted">Escolher vídeo</span>
          )}
          <input
            className="sr-only"
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={(e) => {
              const next = e.target.files?.[0];
              if (!next) return;
              if (next.size > 80 * 1024 * 1024) {
                setError("Escolha um vídeo de até 80 MB.");
                return;
              }
              setError("");
              setFile(next);
              setPreview(URL.createObjectURL(next));
            }}
          />
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          placeholder="Escreva uma legenda"
          className="mt-3 w-full resize-none rounded-2xl bg-black px-4 py-3 outline-none"
        />
        {error && <p className="mt-2 text-sm text-gold">{error}</p>}
        <button
          disabled={!file || busy}
          className="mt-4 w-full rounded-2xl gold-fill py-3 font-bold disabled:opacity-40"
          onClick={async () => {
            if (!file) return;
            setBusy(true);
            setError("");
            try {
              const duration = await videoDuration(file);
              if (!Number.isFinite(duration) || duration > 15) {
                setError("O reel pode ter no máximo 15 segundos.");
                return;
              }
              await onPublish(file, caption);
            } catch {
              setError("Não consegui ler a duração desse vídeo.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Publicando..." : "Publicar reel"}
        </button>
      </div>
    </div>
  );
}

function formatCount(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace(".", ",")}k`;
  return String(value);
}

function authorOf(reel: Reel, me: Me | null) {
  if (reel.authorId === "me") {
    return { name: me?.name || "Você", photo: me?.photos[0] || reel.poster };
  }
  const person = getPerson(reel.authorId);
  return { name: person?.name || brand.mark, photo: person?.photos[0] || reel.poster };
}
