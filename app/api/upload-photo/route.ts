import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return NextResponse.json({ error: "Faça login para enviar foto." }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size < 32) {
      return NextResponse.json({ error: "Arquivo de imagem inválido." }, { status: 400 });
    }
    if (file.size > 12 * 1024 * 1024) {
      return NextResponse.json({ error: "Imagem muito grande (máx. 12 MB)." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const path = `${auth.user.id}/photos/${crypto.randomUUID()}.jpg`;
    const { error: upErr } = await supabase.storage.from("media").upload(path, bytes, {
      upsert: false,
      contentType: file.type || "image/jpeg",
    });
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    }

    const { data } = supabase.storage.from("media").getPublicUrl(path);
    const publicUrl = data.publicUrl;

    const { data: profile } = await supabase
      .from("profiles")
      .select("photos")
      .eq("id", auth.user.id)
      .maybeSingle();
    const prev = Array.isArray(profile?.photos) ? (profile?.photos as string[]) : [];
    const photos = [publicUrl, ...prev.filter((p) => p !== publicUrl)].slice(0, 3);
    await supabase
      .from("profiles")
      .upsert({ id: auth.user.id, photos, updated_at: new Date().toISOString() }, { onConflict: "id" });

    return NextResponse.json({ url: publicUrl, photos });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha no upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
