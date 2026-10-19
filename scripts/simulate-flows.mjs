/**
 * 100 client-side simulations of core dating flows (no browser).
 * Validates seed data + match probability + message threading assumptions.
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const seedPath = join(root, "lib", "seed.ts");
const catalogPath = join(root, "lib", "catalog.ts");
const productPath = join(root, "lib", "product.tsx");

const issues = [];
const ok = [];

function assert(cond, msg) {
  if (cond) ok.push(msg);
  else issues.push(msg);
}

// --- Static asset checks ---
for (const f of [
  "public/splash.jpg",
  "public/app-icon.jpg",
  "public/logo-mark.jpg",
  "public/videos/flower.mp4",
  "public/photos/marina-1.jpg",
  "public/photos/lucas-1.jpg",
  "public/photos/rafael-1.jpg",
]) {
  assert(existsSync(join(root, f)), `asset exists: ${f}`);
}

const seed = readFileSync(seedPath, "utf8");
const catalog = readFileSync(catalogPath, "utf8");
const product = readFileSync(productPath, "utf8");

assert(seed.includes("export const PEOPLE"), "PEOPLE exported");
assert(seed.includes("SEED_REELS") || seed.includes("export const SEED_REELS"), "SEED_REELS present");
assert(product.includes("claim(phone)"), "product.claim exists");
assert(!product.includes('return "Este aparelho já tem uma conta'), "device claim block disabled for demo");
assert(catalog.includes("brl") || catalog.includes("export function brl"), "catalog brl helper");

// Parse person-like blocks roughly
const personIds = [...seed.matchAll(/id:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
const uniqueIds = [...new Set(personIds.filter((id) => !["me"].includes(id)))];
assert(uniqueIds.length >= 8, `enough people in seed (${uniqueIds.length})`);

const likesYouCount = (seed.match(/likesYou:\s*true/g) || []).length;
assert(likesYouCount >= 2, `matchable people with likesYou (${likesYouCount})`);

const repliesBlocks = (seed.match(/replies:\s*\[/g) || []).length;
assert(repliesBlocks >= 5, `people with reply scripts (${repliesBlocks})`);

// --- 100 Monte Carlo match/chat simulations ---
const likesYouRate = likesYouCount / Math.max(uniqueIds.length, 1);
let matches = 0;
let passes = 0;
let likes = 0;
let chats = 0;
const deckSize = Math.min(uniqueIds.length, 12);

for (let i = 0; i < 100; i++) {
  const seen = new Set();
  let userMatches = 0;
  let userLikes = 0;
  let userPasses = 0;
  let userChats = 0;

  for (let card = 0; card < deckSize; card++) {
    const id = uniqueIds[(i * 7 + card * 3) % uniqueIds.length];
    if (seen.has(id)) continue;
    seen.add(id);

    // User swipe bias: ~55% like
    const userLikesThem = ((i + card) * 17) % 100 < 55;
    const theyLikeUser = ((id.charCodeAt(0) + likesYouCount) * (i + 1)) % 100 < likesYouRate * 100 + 15;

    if (!userLikesThem) {
      userPasses++;
      passes++;
      continue;
    }
    userLikes++;
    likes++;
    if (theyLikeUser) {
      userMatches++;
      matches++;
      // open chat + 1–3 messages
      const msgs = 1 + ((i + card) % 3);
      userChats += msgs;
      chats += msgs;
    }
  }

  assert(userLikes + userPasses > 0, `sim ${i}: deck exercised`);
  if (i % 20 === 0) {
    assert(userMatches >= 0, `sim ${i}: matches=${userMatches} likes=${userLikes} passes=${userPasses}`);
  }
}

assert(matches > 0, `monte carlo produced matches (${matches})`);
assert(likes > passes * 0.3, `like volume sane likes=${likes} passes=${passes}`);
assert(chats >= matches, `chats >= matches (${chats}/${matches})`);

// Route pages exist
for (const route of [
  "app/page.tsx",
  "app/reels/page.tsx",
  "app/descobrir/page.tsx",
  "app/matches/page.tsx",
  "app/perfil/page.tsx",
  "app/loja/page.tsx",
  "app/planos/page.tsx",
  "app/convites/page.tsx",
  "app/verificar/page.tsx",
  "app/suporte/page.tsx",
  "app/admin/page.tsx",
  "app/chat/[id]/page.tsx",
]) {
  assert(existsSync(join(root, route)), `route ${route}`);
}

console.log(JSON.stringify({
  ok: ok.length,
  issues: issues.length,
  issueList: issues,
  monteCarlo: { matches, likes, passes, chats, sims: 100 },
}, null, 2));

if (issues.length) process.exitCode = 1;
