import { NextResponse } from "next/server";
import { APP_VERSION } from "@/lib/version";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Healthcheck para EasyPanel / Traefik — não mexe em dados. */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "valentines",
      version: APP_VERSION,
      ts: Date.now(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
