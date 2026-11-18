export function videoDuration(file: File | Blob) {
  return new Promise<number>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    const done = (value: number | Error) => {
      URL.revokeObjectURL(url);
      if (value instanceof Error) reject(value);
      else resolve(value);
    };
    video.onloadedmetadata = () => {
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) done(new Error("duration"));
      else done(duration);
    };
    video.onerror = () => done(new Error("video"));
    // iOS sometimes needs a tick after setting src
    window.setTimeout(() => {
      video.src = url;
      try {
        video.load();
      } catch {
        /* ignore */
      }
    }, 0);
  });
}

export function videoExtFromFile(file: File | Blob) {
  const type = (file.type || "").toLowerCase();
  const name = "name" in file && typeof file.name === "string" ? file.name.toLowerCase() : "";
  if (type.includes("mp4") || type.includes("mpeg") || name.endsWith(".mp4") || name.endsWith(".m4v")) return "mp4";
  if (type.includes("webm") || name.endsWith(".webm")) return "webm";
  if (type.includes("quicktime") || type.includes("mov") || name.endsWith(".mov")) return "mov";
  if (type.includes("3gpp") || name.endsWith(".3gp")) return "3gp";
  return "mp4";
}

export function videoContentType(file: File | Blob, ext: string) {
  if (file.type) return file.type;
  if (ext === "webm") return "video/webm";
  if (ext === "mov") return "video/quicktime";
  if (ext === "3gp") return "video/3gpp";
  return "video/mp4";
}

export function extractHashtags(text: string) {
  const found = text.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  const unique = Array.from(new Set(found.map((tag) => tag.toLowerCase())));
  return unique.slice(0, 12);
}

export function ensureHashtagsInCaption(caption: string, tags: string[]) {
  const base = caption.trim() || "Novo reel";
  const existing = new Set(extractHashtags(base).map((t) => t.toLowerCase()));
  const extra = tags
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`).toLowerCase().replace(/[^\p{L}\p{N}_#]/gu, ""))
    .filter((tag) => tag.length > 1 && !existing.has(tag));
  if (!extra.length) return base;
  return `${base} ${extra.join(" ")}`.trim();
}

export type ReelEffectId = "none" | "vivid" | "warm" | "cool" | "mono" | "vintage";

export const REEL_EFFECTS: { id: ReelEffectId; label: string; css: string }[] = [
  { id: "none", label: "Original", css: "none" },
  { id: "vivid", label: "Vívido", css: "contrast(1.15) saturate(1.35)" },
  { id: "warm", label: "Quente", css: "sepia(0.25) saturate(1.2) brightness(1.05)" },
  { id: "cool", label: "Frio", css: "saturate(0.9) hue-rotate(195deg) brightness(1.05)" },
  { id: "mono", label: "P&B", css: "grayscale(1) contrast(1.1)" },
  { id: "vintage", label: "Vintage", css: "sepia(0.45) contrast(0.95) brightness(1.05)" },
];

export function effectCss(id?: string | null) {
  return REEL_EFFECTS.find((item) => item.id === id)?.css || "none";
}

/** Gera um poster JPEG a partir do primeiro frame (quando o browser permitir). */
export async function capturePosterFrame(file: File | Blob): Promise<Blob | null> {
  try {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("poster"));
      video.src = url;
      video.load();
    });
    video.currentTime = Math.min(0.2, (video.duration || 1) * 0.05);
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
      window.setTimeout(() => resolve(), 400);
    });
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 1280;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      URL.revokeObjectURL(url);
      return null;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    return await new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.82));
  } catch {
    return null;
  }
}
