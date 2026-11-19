import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client: sem cookie handlers custom → usa storage web.
 * Sessão SSR HttpOnly às vezes não chega aqui; o feed público (RLS anon)
 * garante Match/Reels mesmo sem JWT.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );
}
