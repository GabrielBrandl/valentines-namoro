/**
 * Troca mídia dos reels seed por vídeos Mixkit (licença free) + captions/sons virais.
 * Não usa áudio/vídeo com copyright restrito.
 */
import pg from "pg";
import { randomUUID } from "crypto";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:k3izBoCOOehZ76vt@db.xzlvbukpblxxuoutxyqe.supabase.co:5432/postgres";

const VIDEO_IDS = [
  303, 4640, 4627, 4607, 4508, 4556, 4855, 4889, 2385, 4808, 4661, 4636, 43490, 4567,
  3195, 4872, 33031, 4504, 31414, 28321, 4623, 4701, 43523, 50657, 34563, 52422,
  34486, 41723, 52317, 40766, 52079, 32799, 41875, 44448, 4688, 4764, 4643, 4788,
];

const videoUrl = (id) => `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`;
const posterUrl = (id) => `https://mixkit.imgix.net/videos/${id}/${id}-thumb-720-0.jpg`;

const CAPTIONS = [
  "eu fingindo que entendi a conversa inteira #meme #relatable",
  "POV: segunda-feira te encontrou no corredor #viral #humor",
  "quando o plano era dormir cedo #caos #memebr",
  "essa música bateu diferente hoje #fyp #som",
  "eu depois de 3 stories e zero respostas #crush #real",
  "modo sobrevivência: café e fé #cafe #viral",
  "tentando parecer produtiva no home office #trabalho #meme",
  "o entrega chegou e eu ainda escolhendo o que pedir #delivery",
  "treino? eu pensei nisso também kkkk #academia #humor",
  "quando a playlist acerta o mood #musica #vibes",
  "amiga me mandou isso e eu salvei na hora #viral",
  "não é spoiler: eu ri sozinho no ônibus #memebr",
  "brasil em 15 segundos #foryou #brasil",
  "se identificou? comenta aí #relatable #comentarios",
  "só um vídeo rápido… 40 minutos depois #reels",
  "a vibe que eu prometi pra mim mesma #paz #lifestyle",
  "ele: ‘to ocupado’ · também ele: #meme #relacionamento",
  "quem nunca fez essa cara #humor #real",
  "som original do Valentine's batendo #trend #audio",
  "match bom começa com conversa assim #namoro #fyp",
  "quando o algoritmo te entende melhor que a família #internet",
  "mini vlog do nada #vlog #diaadia",
  "dança errada, coração certo #dance #viral",
  "esse áudio não sai da minha cabeça #somviral",
  "plot twist: eu gostei #plot #meme",
];

const SOUNDS = [
  { id: "snd-elevador", title: "Áudio viral do elevador", artist: "Tendência BR" },
  { id: "snd-cafe", title: "Beat do café gelado", artist: "Som Original" },
  { id: "snd-segunda", title: "Segunda-feira speed up", artist: "Valentine's Audio" },
  { id: "snd-crush", title: "Notificação do crush", artist: "Trend Áudio" },
  { id: "snd-festa", title: "Bass da madrugada", artist: "DJ Livre" },
  { id: "snd-chuva", title: "Chuva lo-fi loop", artist: "Som Original" },
  { id: "snd-treino", title: "Motivação 0% treino 100%", artist: "Gym Meme Audio" },
  { id: "snd-risa", title: "Risada que viralizou", artist: "Meme Sound" },
  { id: "snd-noite", title: "Noite no quarto speed", artist: "Trend BR" },
  { id: "snd-match", title: "Som do primeiro match", artist: "Valentine's" },
];

const HASHTAGS = (caption) => (caption.match(/#[\p{L}\p{N}_]+/gu) || []).slice(0, 6);

function pick(arr, i) {
  return arr[i % arr.length];
}

function naturalLikes(i) {
  const base = [120, 340, 890, 1200, 4500, 8200, 15000, 42000, 88000];
  return base[i % base.length] + (i * 17) % 400;
}

function naturalComments(likes) {
  return Math.max(3, Math.floor(likes * (0.04 + (likes % 7) * 0.002)));
}

function naturalShares(likes) {
  return Math.max(1, Math.floor(likes * 0.015));
}

async function main() {
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 180000,
  });
  await client.connect();
  console.log("CONNECTED");

  await client.query(`
    alter table public.reels add column if not exists comments_count int not null default 0;
    alter table public.reels add column if not exists shares int not null default 0;
  `);

  const { rows: seedUsers } = await client.query(`
    select id from auth.users
    where email like 'seed%@valentines.seed'
    order by created_at desc
  `);
  console.log("SEED_USERS", seedUsers.length);

  // Atualiza reels existentes dos seeds em lotes
  const { rows: reels } = await client.query(`
    select r.id
    from public.reels r
    join auth.users u on u.id = r.user_id
    where u.email like 'seed%@valentines.seed'
    order by r.created_at desc
  `);
  console.log("SEED_REELS", reels.length);

  const BATCH = 200;
  let updated = 0;
  for (let i = 0; i < reels.length; i += BATCH) {
    const chunk = reels.slice(i, i + BATCH);
    const values = [];
    const params = [];
    let p = 1;
    for (let j = 0; j < chunk.length; j++) {
      const idx = i + j;
      const vid = pick(VIDEO_IDS, idx);
      const caption = pick(CAPTIONS, idx * 3);
      const sound = pick(SOUNDS, idx * 5);
      const likes = naturalLikes(idx);
      const comments = naturalComments(likes);
      const shares = naturalShares(likes);
      const at = new Date(Date.now() - idx * 90_000 - (idx % 11) * 60_000);
      values.push(`($${p++}::uuid,$${p++},$${p++},$${p++},$${p++}::int,$${p++}::int,$${p++}::int,$${p++}::text[],$${p++}::jsonb,$${p++}::timestamptz)`);
      params.push(
        chunk[j].id,
        videoUrl(vid),
        posterUrl(vid),
        caption,
        likes,
        comments,
        shares,
        HASHTAGS(caption),
        JSON.stringify(sound),
        at.toISOString(),
      );
    }

    await client.query(
      `
      update public.reels r set
        media_url = v.media,
        poster_url = v.poster,
        caption = v.caption,
        likes = v.likes,
        comments_count = v.comments,
        shares = v.shares,
        hashtags = v.hashtags,
        music = v.music,
        created_at = v.created_at
      from (values ${values.join(",")}) as v(id, media, poster, caption, likes, comments, shares, hashtags, music, created_at)
      where r.id = v.id
      `,
      params,
    );
    updated += chunk.length;
    console.log(`UPDATED ${updated}/${reels.length}`);
  }

  // Injeta 600 reels frescos no topo do feed
  const EXTRA = 600;
  const insertValues = [];
  const insertParams = [];
  let ip = 1;
  for (let n = 0; n < EXTRA; n++) {
    const user = seedUsers[n % seedUsers.length];
    if (!user) break;
    const vid = pick(VIDEO_IDS, n * 2 + 3);
    const caption = pick(CAPTIONS, n * 7 + 1);
    const sound = pick(SOUNDS, n * 3);
    const likes = naturalLikes(n + 50) + 200;
    const at = new Date(Date.now() - n * 35_000);
    insertValues.push(
      `($${ip++}::uuid,$${ip++}::uuid,$${ip++},$${ip++},$${ip++},$${ip++}::int,$${ip++}::int,$${ip++}::int,$${ip++}::text[],$${ip++}::jsonb,$${ip++}::timestamptz)`,
    );
    insertParams.push(
      randomUUID(),
      user.id,
      caption,
      videoUrl(vid),
      posterUrl(vid),
      likes,
      naturalComments(likes),
      naturalShares(likes),
      HASHTAGS(caption),
      JSON.stringify(sound),
      at.toISOString(),
    );
  }

  for (let i = 0; i < insertValues.length; i += 100) {
    const sliceVals = insertValues.slice(i, i + 100);
    // rebuild params slice carefully
    const startParam = i * 11;
    const endParam = Math.min(insertParams.length, (i + 100) * 11);
    const sliceParams = insertParams.slice(startParam, endParam);
    // Fix: each row has 11 params, re-index
    const localVals = [];
    const localParams = [];
    let lp = 1;
    for (let r = i; r < Math.min(i + 100, EXTRA); r++) {
      const base = r * 11;
      const row = insertParams.slice(base, base + 11);
      localVals.push(
        `($${lp++}::uuid,$${lp++}::uuid,$${lp++},$${lp++},$${lp++},$${lp++}::int,$${lp++}::int,$${lp++}::int,$${lp++}::text[],$${lp++}::jsonb,$${lp++}::timestamptz)`,
      );
      localParams.push(...row);
    }
    await client.query(
      `insert into public.reels (
        id, user_id, caption, media_url, poster_url, likes, comments_count, shares, hashtags, music, created_at
      ) values ${localVals.join(",")}`,
      localParams,
    );
    console.log(`INSERTED ${Math.min(i + 100, EXTRA)}/${EXTRA}`);
  }

  const counts = await client.query(`
    select count(*)::int as reels,
      (select count(*)::int from public.reels where music is not null) as with_music,
      (select avg(likes)::int from public.reels) as avg_likes
    from public.reels
  `);
  console.log("DONE", counts.rows[0]);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
