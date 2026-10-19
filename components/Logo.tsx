import { brand } from "@/lib/brand";

export function Logo({
  size = "md",
  mark = false,
  wordmark = false,
}: {
  size?: "sm" | "md" | "lg";
  mark?: boolean;
  wordmark?: boolean;
}) {
  const box = size === "lg" ? "h-16 w-16" : size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const title = size === "lg" ? "text-[28px]" : size === "sm" ? "text-[15px]" : "text-[20px]";
  return (
    <span className="inline-flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/app-icon.jpg"
        alt={mark || wordmark ? brand.name : ""}
        className={`${box} shrink-0 rounded-[22%] object-cover`}
      />
      {!mark && (
        <span className={`font-serif tracking-[0.18em] uppercase gold-text ${title}`}>
          {wordmark ? "Valentine's" : brand.name}
        </span>
      )}
    </span>
  );
}
