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

export async function uploadMedia(file: Blob, folder: string, ext = "jpg") {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Faça login para enviar mídia.");

  const path = `${auth.user.id}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    upsert: false,
    contentType: file.type || `image/${ext}`,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

export async function loadDiscoverProfiles(excludeIds: string[] = []) {
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

  return (data ?? []).filter((row) => !excludeIds.includes(row.id));
}
