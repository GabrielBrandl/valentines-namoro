import { NextResponse } from "next/server";
import { APP_RELEASE_NOTES, APP_VERSION } from "@/lib/version";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Cliente consulta isso em background.
 * Se a versão mudar após um deploy, mostra banner — sem limpar reels/conta.
 */
export async function GET() {
  const maintenance = process.env.MAINTENANCE_MODE === "1" || process.env.MAINTENANCE_MODE === "true";
  const message =
    process.env.MAINTENANCE_MESSAGE ||
    (maintenance
      ? "Estamos aplicando melhorias. Seus vídeos e contas continuam salvos."
      : "");

  return NextResponse.json(
    {
      version: APP_VERSION,
      notes: APP_RELEASE_NOTES,
      maintenance,
      message,
      soft: true,
      preserve: ["reels", "profiles", "likes", "matches", "messages"],
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
