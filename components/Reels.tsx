"use client";

import { FormEvent, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Photo, useMediaSrc } from "./Media";
import { IconComment, IconHeart, IconPlus, IconShare, IconX } from "./Icons";
import { getPerson } from "@/lib/seed";
import { useProduct } from "@/lib/product";
import { useFecon } from "@/lib/store";
import {
  REEL_EFFECTS,
  effectCss,
  extractHashtags,
  videoDuration,
  type ReelEffectId,
} from "@/lib/video";
import { brand } from "@/lib/brand";
import type { Me, Reel } from "@/lib/types";
import { ReportDialog } from "./product-ui";

export function Reels({ mode: _mode = "reels" }: { mode?: "home" | "reels" }) {
  void _mode;
  const router = useRouter();
  const {
    reels,
    me,
    toggleLike,
    addComment,
    publishReel,
    deleteReel,
    following,
    toggleFollow,
    reportReel,
    repostReel,
    shareReel,
    refreshCloudReels,
  } = useFecon();
  const product = useProduct();
  const ordered = [...reels].sort(
    (a, b) => Number(product.highlighted(b.id)) - Number(product.highlighted(a.id)) || b.at - a.at,
  );
  const [tab, setTab] = useState<"seguindo" | "para-voce">("para-voce");
  const [active, setActive] = useState(ordered[0]?.id ?? "");
  const [muted, setMuted] = useState(true);
  const [sheet, setSheet] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [reportReelId, setReportReelId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void refreshCloudReels();
    const timer = window.setInterval(() => void refreshCloudReels(), 45_000);
    return () => window.clearInterval(timer);
  }, [refreshCloudReels]);

  const followingFeed = ordered.filter(
    (reel) => reel.mine || reel.authorId === "me" || following.includes(reel.authorId),
  );
  const list = tab === "seguindo" ? followingFeed : ordered;
  const emptyFollowing = tab === "seguindo" && followingFeed.length === 0;
  const emptyForYou = tab === "para-voce" && ordered.length === 0;

  const activeReel = list.find((reel) => reel.id === active) ?? list[0];
  const sheetReel = sheet ? reels.find((reel) => reel.id === sheet) : undefined;
  const reportTarget = reportReelId ? reels.find((r) => r.id === reportReelId) : null;
  const reportAuthor = reportTarget
    ? reportTarget.authorId === "me"
      ? me?.name || "Você"
      : getPerson(reportTarget.authorId)?.name || "Autor"
    : "";

  useEffect(() => {
    const first = list[0]?.id ?? "";
    setActive(first);
    const node = feedRef.current;
    if (node) node.scrollTop = 0;
    // Só ao trocar de aba — evita resetar o scroll a cada refresh do feed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("v");
    if (!id) return;
    document.getElementById(`reel-${id}`)?.scrollIntoView({ block: "start" });
  }, [list.length]);

  function switchTab(next: "seguindo" | "para-voce") {
    setTab(next);
  }

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-black">
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center pt-[max(14px,env(safe-area-inset-top))]">
          <div className="pointer-events-auto flex items-center gap-7 rounded-full bg-black/35 px-5 py-2 text-[15px] font-semibold text-white/55 backdrop-blur-sm">
            <button
              type="button"
              className={`relative ${tab === "seguindo" ? "text-white" : ""}`}
              onClick={() => switchTab("seguindo")}
            >
              Seguindo
              {tab === "seguindo" && (
                <span className="absolute -bottom-1 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full gold-fill" />
              )}
            </button>
            <button
              type="button"
              className={`relative ${tab === "para-voce" ? "text-white" : ""}`}
              onClick={() => switchTab("para-voce")}
            >
              Para você
              {tab === "para-voce" && (
                <span className="absolute -bottom-1 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full gold-fill" />
              )}
            </button>
          </div>
        </div>

        {emptyFollowing ? (
          <div className="grid h-full place-items-center px-8 text-center text-white/70">
            <div>
              <p className="font-serif text-2xl text-gold">Seguindo está vazio</p>
              <p className="mt-2 text-sm">
                Em Para você, toque no + do avatar para seguir. Seus próprios reels também aparecem aqui.
              </p>
              <button
                type="button"
                className="mt-5 rounded-2xl gold-fill px-5 py-3 text-sm font-bold text-black"
                onClick={() => switchTab("para-voce")}
              >
                Ver Para você
              </button>
            </div>
          </div>
        ) : emptyForYou ? (
          <div className="grid h-full place-items-center px-8 text-center text-white/70">
            <div>
              <p className="font-serif text-2xl text-gold">Seu feed começa aqui</p>
              <p className="mt-2 text-sm">Publique o primeiro reel — ele aparece pra você e para outras pessoas no app.</p>
              <button
                type="button"
                className="mt-5 rounded-2xl gold-fill px-5 py-3 text-sm font-bold text-black"
                onClick={() => setPublishing(true)}
              >
                Publicar reel
              </button>
            </div>
          </div>
        ) : (
          <div ref={feedRef} className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto">
            {list.map((reel) => (
              <Slide
                key={`${tab}-${reel.id}`}
                reel={reel}
                me={me}
                muted={muted}
                following={following.includes(reel.authorId)}
                onActive={setActive}
                onToggleMute={() => setMuted((value) => !value)}
                onOpenProfile={() => {
                  if (reel.authorId === "me" || reel.mine) {
                    router.push("/perfil");
                    return;
                  }
                  router.push(`/perfil/${encodeURIComponent(reel.authorId)}`);
                }}
                onLike={() => {
                  if (!reel.liked) product.track("reel");
                  toggleLike(reel.id);
                }}
                onComment={() => setSheet(reel.id)}
                onFollow={() => toggleFollow(reel.authorId)}
                onReport={() => setReportReelId(reel.id)}
                onShare={async () => {
                  const url = await shareReel(reel.id);
                  try {
                    if (navigator.share) {
                      await navigator.share({
                        title: brand.name,
                        text: reel.caption,
                        url,
                      });
                    } else {
                      await navigator.clipboard.writeText(url);
                    }
                  } catch {
                    try {
                      await navigator.clipboard.writeText(url);
                    } catch {
                      /* ignore */
                    }
                  }
                }}
                onRepost={async () => {
                  try {
                    await repostReel(reel.id);
                    setToast("Reel republicado no seu perfil");
                    window.setTimeout(() => setToast(""), 2200);
                  } catch (err) {
                    window.alert(err instanceof Error ? err.message : "Não foi possível republicar.");
                  }
                }}
              />
            ))}
          </div>
        )}

        {toast ? (
          <div className="pointer-events-none absolute inset-x-0 top-[max(58px,calc(env(safe-area-inset-top)+48px))] z-40 flex justify-center px-4">
            <p className="rounded-full bg-black/80 px-4 py-2 text-sm font-semibold text-gold shadow-lg">{toast}</p>
          </div>
        ) : null}

        <button
          className="absolute right-3 bottom-[calc(72px+env(safe-area-inset-bottom))] z-30 flex items-center gap-2 rounded-full gold-fill px-4 py-3 text-sm font-bold text-black shadow-lg md:right-4 md:top-[max(12px,env(safe-area-inset-top))] md:bottom-auto md:grid md:h-11 md:w-11 md:place-items-center md:px-0 md:py-0"
          onClick={() => setPublishing(true)}
          aria-label="Publicar reel"
        >
          <IconPlus className="h-5 w-5" />
          <span className="md:hidden">Publicar</span>
        </button>
      </div>

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
          onPublish={async (file, caption, meta) => {
            await publishReel(file, caption, meta);
            setPublishing(false);
            setTab("para-voce");
            setToast("Reel publicado — já aparece no feed com o áudio original");
            window.setTimeout(() => setToast(""), 2400);
            void refreshCloudReels();
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
        <aside className="hidden w-[360px] shrink-0 border-l border-line bg-panel lg:block">
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
  onOpenProfile,
  onLike,
  onComment,
  onFollow,
  onReport,
  onShare,
  onRepost,
}: {
  reel: Reel;
  me: Me | null;
  muted: boolean;
  following: boolean;
  onActive: (id: string) => void;
  onToggleMute: () => void;
  onOpenProfile: () => void;
  onLike: () => void;
  onComment: () => void;
  onFollow: () => void;
  onReport: () => void;
  onShare: () => void;
  onRepost: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLElement>(null);
  const lastTap = useRef(0);
  const [burst, setBurst] = useState(false);
  const [shareNote, setShareNote] = useState(false);
  const [failed, setFailed] = useState(false);
  const [followNote, setFollowNote] = useState(false);
  const src = useMediaSrc(reel.media);
  const poster = useMediaSrc(reel.poster);

  useEffect(() => {
    setFailed(false);
  }, [reel.id, src]);
  const isVideo = !/\.(jpe?g|png|webp|gif)(\?|$)/i.test(reel.media);
  const author = authorOf(reel, me);
  const product = useProduct();
  const highlighted = product.highlighted(reel.id);
  const handle = `@${author.name.toLowerCase().replace(/\s+/g, ".")}`;
  const isMine = reel.authorId === "me" || Boolean(reel.mine);
  const tags = reel.hashtags?.length ? reel.hashtags : extractHashtags(reel.caption);
  const filter = effectCss(reel.effect?.filter);
  const speed = reel.effect?.speed && reel.effect.speed > 0 ? reel.effect.speed : 1;

  useEffect(() => {
    const node = boxRef.current;
    const video = videoRef.current;
    if (!node || !video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onActive(reel.id);
          video.muted = muted;
          video.volume = 1;
          video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.55 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reel.id, onActive, src, muted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    video.volume = 1;
    if (!muted) {
      const play = video.play();
      if (play) play.catch(() => undefined);
    }
  }, [muted, src]);

  function handleVideoTap(event: ReactMouseEvent) {
    event.preventDefault();
    const now = Date.now();
    if (now - lastTap.current < 280) {
      if (!reel.liked) onLike();
      setBurst(true);
      window.setTimeout(() => setBurst(false), 700);
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
    // Toque simples: liga/desliga o áudio (navegadores bloqueiam som sem gesto)
    onToggleMute();
  }

  return (
    <article id={`reel-${reel.id}`} ref={boxRef} className="relative h-full snap-start overflow-hidden bg-black">
      {src && isVideo && !failed ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster || undefined}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter, ...(speed !== 1 ? { animationDuration: `${speed}s` } : undefined) }}
          loop
          playsInline
          preload="auto"
          muted={muted}
          onLoadedMetadata={(e) => {
            e.currentTarget.playbackRate = speed;
            e.currentTarget.volume = 1;
            e.currentTarget.muted = muted;
          }}
          onError={() => setFailed(true)}
          onClick={handleVideoTap}
        />
      ) : (
        <Photo
          src={reel.poster}
          alt={`Capa do reel de ${author.name}`}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/35" />
      {burst && <IconHeart className="heart-pop pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 text-gold" />}
      {muted && src && isVideo && !failed ? (
        <button
          type="button"
          className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/70 px-5 py-3 text-sm font-bold text-white shadow-lg ring-1 ring-white/30"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
        >
          🔇 Toque para ativar o som
        </button>
      ) : null}

      <div className="absolute right-3 bottom-28 z-10 flex flex-col items-center gap-5 text-white drop-shadow-lg">
        <div className="relative h-12 w-12 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenProfile();
            }}
            aria-label={`Abrir perfil de ${author.name}`}
            className="block h-12 w-12 overflow-hidden rounded-full ring-2 ring-white"
          >
            <Photo
              src={author.photo}
              alt={`Foto de ${author.name}`}
              className="h-12 w-12 rounded-full object-cover"
            />
          </button>
          {!isMine && (
            <button
              type="button"
              aria-label={following ? "Deixar de seguir" : "Seguir"}
              className="absolute -bottom-1 left-1/2 z-10 grid h-5 w-5 -translate-x-1/2 place-items-center rounded-full gold-fill text-[11px] font-bold leading-none text-black shadow"
              onClick={(e) => {
                e.stopPropagation();
                onFollow();
                setFollowNote(true);
                window.setTimeout(() => setFollowNote(false), 1400);
              }}
            >
              {following ? "✓" : "+"}
            </button>
          )}
          {followNote && (
            <span className="absolute left-1/2 top-14 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-semibold">
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
          onClick={() => {
            onShare();
            setShareNote(true);
            window.setTimeout(() => setShareNote(false), 1200);
          }}
          aria-label="Compartilhar"
        >
          <IconShare className="h-7 w-7" />
          <span className="text-xs font-semibold">{shareNote ? "Ok" : formatCount(reel.shares || 0)}</span>
        </button>
        {!isMine && (
          <button className="grid place-items-center gap-1 text-[10px] font-semibold" onClick={onRepost} aria-label="Republicar">
            <span className="text-lg leading-none">↻</span>
            Repost
          </button>
        )}
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
          type="button"
          className={`mt-1 grid h-11 w-11 place-items-center rounded-full border-2 text-lg ${
            muted ? "border-gold bg-black/70 text-gold" : "border-white/50 bg-black/50 text-white"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          aria-label={muted ? "Ativar som" : "Silenciar"}
        >
          {muted ? "🔇" : "🔊"}
        </button>
        {reel.productId ? (
          <a
            href={`/shopping?product=${encodeURIComponent(reel.productId)}`}
            className="mt-1 grid place-items-center gap-0.5 text-[10px] font-semibold text-gold"
            aria-label="Comprar produto do vídeo"
          >
            <span className="text-base leading-none">🛍</span>
            Comprar
          </a>
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pr-20 pb-[max(20px,env(safe-area-inset-bottom))] pt-20 text-white [text-shadow:0_1px_2px_#000]">
        <p className="font-bold">
          <button type="button" className="pointer-events-auto font-bold" onClick={onOpenProfile}>
            {handle}
          </button>
          {reel.repostOf ? <span className="ml-2 text-[10px] font-semibold text-gold">↻ republicado</span> : null}
          {highlighted ? <span className="ml-2 rounded-full gold-fill px-2 py-0.5 text-[10px] text-black">Destaque</span> : null}
        </p>
        <p className="mt-1 text-sm leading-snug text-white/95">
          {reel.caption.replace(/#[\p{L}\p{N}_]+/gu, "").trim() || reel.caption}
          {tags.map((tag) => (
            <span key={tag} className="ml-1 text-gold">
              {tag}
            </span>
          ))}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-white/85">
          <span aria-hidden>♪</span>
          <span className="truncate">
            {reel.music
              ? `${reel.music.title} — ${reel.music.artist}`
              : `Som original — ${author.name.toLowerCase().replace(/\s+/g, ".")}`}
          </span>
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
  onPublish: (
    file: File,
    caption: string,
    meta: {
      hashtags: string[];
      effect: { filter: string; speed: number };
      music: { id: string; title: string; artist: string };
    },
  ) => Promise<void>;
}) {
  const [step, setStep] = useState<"media" | "edit" | "caption">("media");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [filter, setFilter] = useState<ReelEffectId>("none");
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  function pickFile(next: File | undefined) {
    if (!next) return;
    if (!next.type.startsWith("video/") && !/\.(mp4|mov|m4v|webm|3gp)$/i.test(next.name)) {
      setError("Escolha um arquivo de vídeo (MP4 ou MOV).");
      return;
    }
    if (next.size > 100 * 1024 * 1024) {
      setError("Escolha um vídeo de até 100 MB.");
      return;
    }
    setError("");
    setFile(next);
    setPreview(URL.createObjectURL(next));
    setStep("edit");
  }

  function addTag() {
    const raw = tagInput.trim();
    if (!raw) return;
    const tag = (raw.startsWith("#") ? raw : `#${raw}`).toLowerCase().replace(/[^\p{L}\p{N}_#]/gu, "");
    if (tag.length < 2) return;
    setTags((prev) => (prev.includes(tag) || prev.length >= 8 ? prev : [...prev, tag]));
    setTagInput("");
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/80 md:place-items-center" onClick={onClose}>
      <div
        className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-panel shadow-2xl md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4">
          <h3 className="font-serif text-2xl tracking-tight gold-text">
            {step === "media" ? "Novo reel" : step === "edit" ? "Efeitos" : "Publicar"}
          </h3>
          <button aria-label="Fechar" onClick={onClose}>
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <div className="app-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {step === "media" && (
            <div className="mt-4 space-y-3">
              <div className="grid aspect-[9/14] place-items-center rounded-2xl bg-black text-sm text-muted">
                Toque para escolher ou filmar
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="rounded-2xl gold-fill py-3 text-sm font-bold text-black"
                  onClick={() => galleryRef.current?.click()}
                >
                  Galeria
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-[#d4af37]/50 py-3 text-sm font-bold text-gold"
                  onClick={() => cameraRef.current?.click()}
                >
                  Filmar
                </button>
              </div>
              <p className="text-center text-[11px] text-muted">MP4/MOV · até 60s · até 100 MB</p>
              <input
                ref={galleryRef}
                className="sr-only"
                type="file"
                accept="video/*,video/mp4,video/webm,video/quicktime,.mp4,.mov,.m4v,.webm"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
              <input
                ref={cameraRef}
                className="sr-only"
                type="file"
                accept="video/*"
                capture="environment"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
            </div>
          )}

          {(step === "edit" || step === "caption") && preview && (
            <div className="mt-4 overflow-hidden rounded-2xl bg-black">
              <video
                key={`${filter}-${speed}`}
                src={preview}
                className="aspect-[9/14] w-full object-cover"
                style={{ filter: effectCss(filter) }}
                muted
                playsInline
                controls
                onLoadedMetadata={(e) => {
                  e.currentTarget.playbackRate = speed;
                }}
              />
            </div>
          )}

          {step === "edit" && (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Filtros</p>
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                  {REEL_EFFECTS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFilter(item.id)}
                      className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${
                        filter === item.id ? "gold-fill text-black" : "bg-black text-sand"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Velocidade</p>
                <div className="mt-2 flex gap-2">
                  {[0.5, 1, 1.5, 2].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSpeed(value)}
                      className={`rounded-full px-3 py-2 text-xs font-semibold ${
                        speed === value ? "gold-fill text-black" : "bg-black text-sand"
                      }`}
                    >
                      {value}x
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-[#d4af37]/25 bg-black/40 px-4 py-3">
                <p className="text-sm font-semibold text-gold">♪ Música</p>
                <p className="mt-1 text-xs text-muted">Em breve: biblioteca de sons como no TikTok/Kwai. Por agora usamos Som original.</p>
              </div>
              <button type="button" className="w-full rounded-2xl gold-fill py-3 font-bold text-black" onClick={() => setStep("caption")}>
                Continuar
              </button>
              <button type="button" className="w-full text-sm text-muted" onClick={() => setStep("media")}>
                Trocar vídeo
              </button>
            </div>
          )}

          {step === "caption" && (
            <div className="mt-4 space-y-3">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                placeholder="Escreva uma legenda..."
                className="w-full resize-none rounded-2xl bg-black px-4 py-3 outline-none"
              />
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="#hashtag"
                  className="min-w-0 flex-1 rounded-2xl bg-black px-4 py-3 text-sm outline-none"
                />
                <button type="button" className="rounded-2xl bg-panel px-4 text-sm font-bold ring-1 ring-[#d4af37]/40" onClick={addTag}>
                  + #
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-gold"
                    onClick={() => setTags((prev) => prev.filter((item) => item !== tag))}
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
              <button type="button" className="text-sm text-muted" onClick={() => setStep("edit")}>
                Voltar aos efeitos
              </button>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-gold">{error}</p>}
        </div>

        {step === "caption" && (
          <div className="border-t border-line px-5 py-4 pb-[max(16px,env(safe-area-inset-bottom))]">
            <button
              disabled={!file || busy}
              className="w-full rounded-2xl gold-fill py-3 font-bold text-black disabled:opacity-40"
              onClick={async () => {
                if (!file) return;
                setBusy(true);
                setError("");
                try {
                  let duration = 0;
                  try {
                    duration = await videoDuration(file);
                  } catch {
                    // Em alguns celulares a duração falha; seguimos com aviso leve
                    duration = 1;
                  }
                  if (!Number.isFinite(duration) || duration <= 0) {
                    setError("Não consegui ler esse vídeo. Tente exportar em MP4.");
                    return;
                  }
                  if (duration > 60) {
                    setError("O reel pode ter no máximo 60 segundos.");
                    return;
                  }
                  const mergedTags = Array.from(new Set([...tags, ...extractHashtags(caption)]));
                  await onPublish(file, caption, {
                    hashtags: mergedTags,
                    effect: { filter, speed },
                    music: { id: "original", title: "Som original", artist: "Você" },
                  });
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Falha ao publicar.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Publicando..." : "Publicar reel"}
            </button>
          </div>
        )}
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
    const mine = (me?.photos || []).find(Boolean);
    return { name: me?.name || "Você", photo: mine || reel.poster };
  }
  const person = getPerson(reel.authorId);
  const photo = (person?.photos || []).find(Boolean) || reel.poster;
  return { name: person?.name || brand.mark, photo };
}
