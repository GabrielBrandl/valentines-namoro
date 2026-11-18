"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useFecon } from "@/lib/store";

export function useMediaSrc(src?: string) {
  const { resolve } = useFecon();
  const [url, setUrl] = useState(src && !src.startsWith("idb:") ? src : "");

  useEffect(() => {
    let alive = true;
    if (!src) {
      setUrl("");
      return;
    }
    if (!src.startsWith("idb:")) {
      setUrl(src);
      return;
    }
    setUrl("");
    resolve(src).then((next) => {
      if (alive) setUrl(next);
    });
    return () => {
      alive = false;
    };
  }, [src, resolve]);

  return url;
}

export function Photo({
  src,
  alt,
  className,
  style,
}: {
  src?: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
}) {
  const url = useMediaSrc(src);
  const [failed, setFailed] = useState(false);
  const letter = (alt.replace(/^Foto de\s+/i, "").trim().slice(0, 1) || "V").toUpperCase();

  useEffect(() => {
    setFailed(false);
  }, [url, src]);

  if (!url || failed) {
    return (
      <div
        className={`grid place-items-center overflow-hidden bg-gradient-to-br from-[#9d2348] to-[#3a1630] font-serif font-bold text-white ${className ?? ""}`}
        style={style}
        aria-label={alt}
      >
        <span className="select-none text-[length:max(0.85rem,45%)] leading-none">{letter}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}

export function When({ at, mode = "relative" }: { at: number; mode?: "relative" | "day" }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (mode === "day") {
      setLabel(new Date(at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }));
      return;
    }
    setLabel(formatWhen(at));
  }, [at, mode]);
  return <>{label}</>;
}

export function Clock({ at }: { at: number }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    setLabel(clock(at));
  }, [at]);
  return <>{label}</>;
}

export function formatWhen(at: number) {
  const diff = Date.now() - at;
  const min = Math.round(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "ontem" : `há ${days} dias`;
}

export function clock(at: number) {
  return new Date(at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
