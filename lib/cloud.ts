import type { Me, Prefs } from "./types";
import { createClient } from "./supabase/client";

export type CloudPersisted = {
  v: 1;
  me: Me | null;
  prefs: Prefs;
  passes: string[];
  likes: string[];
  supers: string[];
  matches: { id: string; at: number; super: boolean }[];
  messages: {
    id: string;
    matchId: string;
    from: "me" | "them";
    text: string;
    at: number;
    media?: string;
  }[];
  replyCursor: Record<string, number>;
  reelExtras: Record<string, { liked?: boolean; comments?: { id: string; author: string; text: string; at: number }[] }>;
  myReels: {
    id: string;
    authorId: string;
    caption: string;
    media: string;
    poster: string;
    likes: number;
    liked: boolean;
    comments: { id: string; author: string; text: string; at: number }[];
    at: number;
    mine?: boolean;
  }[];
  history: { id: string; action: "like" | "pass" | "super"; matched: boolean }[];
  lastRead: Record<string, number>;
  following: string[];
  reportedReels: string[];
  reposts?: string[];
};

export async function getSessionUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function signUp(email: string, password: string, name: string) {
  const supabase = createClient();
  const clean = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email: clean,
    password,
    options: { data: { name } },
  });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function loadCloudState(): Promise<CloudPersisted | null> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data, error } = await supabase
    .from("user_app_state")
    .select("payload")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const payload = data?.payload as CloudPersisted | null | undefined;
  if (!payload || payload.v !== 1) return null;
  return payload;
}

export async function saveCloudState(payload: CloudPersisted) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  const { error } = await supabase.from("user_app_state").upsert({
    user_id: auth.user.id,
    payload,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function upsertProfile(me: Me, prefs?: Prefs) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  const { error } = await supabase.from("profiles").upsert({
    id: auth.user.id,
    email: me.email ?? auth.user.email ?? null,
    name: me.name,
    age: me.age,
    city: me.city,
    job: me.job,
    bio: me.bio,
    gender: me.gender,
    interests: me.interests,
    photos: me.photos,
    prefs: prefs ?? {},
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function publishCloudReel(input: {
  caption: string;
  mediaUrl: string;
  posterUrl?: string;
  hashtags?: string[];
  effect?: { filter: string; speed: number } | null;
  music?: { id: string; title: string; artist: string } | null;
  repostOf?: string | null;
}) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Faça login para publicar.");

  const payload: Record<string, unknown> = {
    user_id: auth.user.id,
    caption: input.caption,
    media_url: input.mediaUrl,
    poster_url: input.posterUrl ?? null,
    likes: 0,
  };
  if (input.hashtags?.length) payload.hashtags = input.hashtags;
  if (input.effect) payload.effect = input.effect;
  if (input.music) payload.music = input.music;
  if (input.repostOf) payload.repost_of = input.repostOf;

  let { data, error } = await supabase.from("reels").insert(payload).select("id,created_at").single();

  // Base antiga sem colunas novas: tenta payload mínimo
  if (error && /hashtags|effect|music|repost_of|column/i.test(error.message)) {
    const retry = await supabase
      .from("reels")
      .insert({
        user_id: auth.user.id,
        caption: input.caption,
        media_url: input.mediaUrl,
        poster_url: input.posterUrl ?? null,
        likes: 0,
      })
      .select("id,created_at")
      .single();
    data = retry.data;
    error = retry.error;
  }
  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error("Falha ao gravar o reel.");
  return data as { id: string; created_at: string };
}

export type CloudReel = {
  id: string;
  user_id: string;
  caption: string;
  media_url: string;
  poster_url: string | null;
  likes: number;
  created_at: string;
  hashtags?: string[] | null;
  effect?: { filter: string; speed: number } | null;
  music?: { id: string; title: string; artist: string } | null;
  repost_of?: string | null;
};

export async function loadCloudReels(): Promise<CloudReel[]> {
  const supabase = createClient();
  const full = await supabase
    .from("reels")
    .select("id,user_id,caption,media_url,poster_url,likes,created_at,hashtags,effect,music,repost_of")
    .order("created_at", { ascending: false })
    .limit(80);
  if (!full.error) return (full.data ?? []) as CloudReel[];

  const basic = await supabase
    .from("reels")
    .select("id,user_id,caption,media_url,poster_url,likes,created_at")
    .order("created_at", { ascending: false })
    .limit(80);
  if (basic.error) throw new Error(basic.error.message);
  return (basic.data ?? []) as CloudReel[];
}

export async function loadLikedReelIds(): Promise<string[]> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase.from("reel_likes").select("reel_id").eq("user_id", auth.user.id);
  if (error) return [];
  return (data ?? []).map((row) => row.reel_id as string);
}

export async function toggleCloudReelLike(reelId: string, liked: boolean) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Faça login para curtir.");

  if (liked) {
    const { error } = await supabase.from("reel_likes").upsert(
      { user_id: auth.user.id, reel_id: reelId },
      { onConflict: "user_id,reel_id" },
    );
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("reel_likes")
      .delete()
      .eq("user_id", auth.user.id)
      .eq("reel_id", reelId);
    if (error) throw new Error(error.message);
  }
}

export async function uploadMedia(file: Blob, folder: string, ext = "jpg", contentType?: string) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Faça login para enviar mídia.");

  const path = `${auth.user.id}/${folder}/${crypto.randomUUID()}.${ext}`;
  const mime =
    contentType ||
    file.type ||
    (ext === "mp4" || ext === "mov" || ext === "webm" || ext === "3gp"
      ? `video/${ext === "mov" ? "quicktime" : ext}`
      : `image/${ext}`);
  const { error } = await supabase.storage.from("media").upload(path, file, {
    upsert: false,
    contentType: mime,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

export type CloudProfile = {
  id: string;
  name: string;
  age: number;
  city: string;
  job: string;
  bio: string;
  gender: "mulher" | "homem";
  interests: string[];
  photos: string[];
};

export async function loadDiscoverProfiles(excludeIds: string[] = []): Promise<CloudProfile[]> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  let query = supabase
    .from("profiles")
    .select("id,name,age,city,job,bio,gender,interests,photos")
    .order("updated_at", { ascending: false })
    .limit(80);

  if (auth.user) query = query.neq("id", auth.user.id);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row) => row?.id && row?.name && !excludeIds.includes(row.id))
    .map((row) => ({
      id: row.id as string,
      name: String(row.name || "Sem nome"),
      age: Number(row.age) || 18,
      city: String(row.city || "Brasil"),
      job: String(row.job || "Em descoberta"),
      bio: String(row.bio || ""),
      gender: row.gender === "homem" ? "homem" : "mulher",
      interests: Array.isArray(row.interests) ? (row.interests as string[]) : [],
      photos: Array.isArray(row.photos) ? (row.photos as string[]).filter(Boolean) : [],
    }));
}

export async function recordSwipe(targetId: string, action: "like" | "pass" | "super") {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { matched: false };

  const { error } = await supabase.from("swipes").upsert(
    {
      user_id: auth.user.id,
      target_id: targetId,
      action,
    },
    { onConflict: "user_id,target_id" },
  );
  if (error) throw new Error(error.message);

  if (action === "pass") return { matched: false };

  // Match mútuo só entre contas reais (uuid).
  if (!/^[0-9a-f-]{36}$/i.test(targetId)) return { matched: false };

  const { data: theirs } = await supabase
    .from("swipes")
    .select("action")
    .eq("user_id", targetId)
    .eq("target_id", auth.user.id)
    .maybeSingle();

  const matched = theirs?.action === "like" || theirs?.action === "super";
  if (matched) {
    await supabase.from("matches").upsert(
      {
        user_id: auth.user.id,
        target_id: targetId,
        is_super: action === "super",
      },
      { onConflict: "user_id,target_id" },
    );
  }
  return { matched };
}

export async function loadAdminDashboard() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Faça login para abrir o painel.");

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id,name,email,age,city,gender,photos,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);

  const { count: swipeCount } = await supabase
    .from("swipes")
    .select("*", { count: "exact", head: true });

  const { count: matchCount } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true });

  const { count: reelCount } = await supabase
    .from("reels")
    .select("*", { count: "exact", head: true });

  return {
    meId: auth.user.id,
    meEmail: auth.user.email ?? null,
    profiles: profiles ?? [],
    totals: {
      users: profiles?.length ?? 0,
      swipes: swipeCount ?? 0,
      matches: matchCount ?? 0,
      reels: reelCount ?? 0,
    },
  };
}
