/**
 * Popula ~2200 perfis BR + reels (fotos/vídeos livres de copyright restritivo).
 * Fotos: randomuser.me + pravatar (demo).
 * Vídeos: Google sample bucket + Blender Foundation (CC).
 */
import pg from "pg";
import { randomUUID } from "crypto";

const TOTAL = Number(process.env.SEED_COUNT || 2200);
const BATCH = 80;
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:k3izBoCOOehZ76vt@db.xzlvbukpblxxuoutxyqe.supabase.co:5432/postgres";

const FIRST_F = [
  "Ana", "Beatriz", "Camila", "Daniela", "Eduarda", "Fernanda", "Gabriela", "Helena", "Isabela", "Julia",
  "Larissa", "Marina", "Natalia", "Olivia", "Patricia", "Rafaela", "Sofia", "Tatiane", "Valentina", "Yasmin",
  "Amanda", "Bruna", "Carolina", "Debora", "Elisa", "Flavia", "Giovana", "Ingrid", "Jessica", "Karen",
  "Leticia", "Melissa", "Nicole", "Paula", "Renata", "Sabrina", "Thais", "Vitoria", "Aline", "Priscila",
];
const FIRST_M = [
  "Andre", "Bruno", "Carlos", "Diego", "Eduardo", "Felipe", "Gabriel", "Henrique", "Igor", "Joao",
  "Kaique", "Lucas", "Mateus", "Nicolas", "Otavio", "Pedro", "Rafael", "Samuel", "Thiago", "Vitor",
  "Alexandre", "Bernardo", "Caio", "Daniel", "Enzo", "Francisco", "Guilherme", "Hugo", "Isaac", "Jose",
  "Leonardo", "Miguel", "Nathan", "Paulo", "Ricardo", "Sergio", "Tiago", "Vinicius", "William", "Yuri",
];
const LASTS = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes",
  "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa",
  "Rocha", "Dias", "Nunes", "Mendes", "Moreira", "Cardoso", "Teixeira", "Correia", "Cavalcanti", "Araujo",
];
const CITIES = [
  "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre", "Brasília", "Salvador",
  "Fortaleza", "Recife", "Campinas", "Florianópolis", "Goiânia", "Manaus", "Belém", "Vitória", "Natal",
  "Maceió", "Santos", "Niterói", "Ribeirão Preto", "Uberlândia", "Joinville", "Londrina", "Cuiabá",
  "Campo Grande", "João Pessoa", "Teresina", "São Luís", "Aracaju", "Palmas",
];
const JOBS = [
  "Designer", "Dev", "Enfermeira", "Advogada", "Professor", "Fotógrafa", "Médico", "Arquiteto",
  "Nutricionista", "Músico", "Jornalista", "Personal", "Publicitário", "Estudante", "Empreendedora",
  "Barista", "Psicóloga", "Engenheiro", "Atendente", "Chef", "Analista", "Vendedora", "Motorista",
];
const INTERESTS = [
  "Café", "Música", "Viagem", "Trilha", "Cinema", "Cozinha", "Praia", "Livros", "Academia", "Arte",
  "Games", "Pets", "Vinho", "Dança", "Fotografia", "Corrida", "Séries", "Memes", "Churrasco", "Yoga",
];
const BIOS = [
  "Acabei de chegar no Valentine's.",
  "Procuro alguém pra rir dos mesmos memes.",
  "Café primeiro, plano depois.",
  "Se mandar áudio longo, a gente combina.",
  "Mais rolê de barzinho do que balada.",
  "Dog person assumida.",
  "Treino de manhã, série à noite.",
  "Me leva num show e a gente já tem história.",
  "Sem frescura, com humor.",
  "Aberto a conhecer gente nova de verdade.",
  "Match bom é conversa boa.",
  "Foto antiga? Não. Sorriso atual? Sim.",
];
const CAPTIONS = [
  "quando o planilha abre na segunda #meme #trabalho",
  "eu tentando parecer produtiva #humor #vida",
  "o entrega chegou antes de eu decidir o que pedir #delivery",
  "modo sobrevivência ativado #segundafeira",
  "quando o crush visualiza e não responde #relatable",
  "café: 1 · motivação: 0 #cafe #meme",
  "POV: você abriu o Valentine's só pra ver reels #foryou",
  "essa vibe de fim de tarde #paz",
  "não é spoiler: eu ri sozinho #humor",
  "treino? pensei nisso também #academia",
  "gato julgando minha vida #pets #meme",
  "quando a playlist acerta #musica",
  "brasil em um vídeo #memebr",
  "eu depois de 3 stories seguidos #internet",
  "quem nunca #real",
  "mini aventura do dia #viagem",
  "só um vídeo rápido e já volto — menti #reels",
  "humor duvidoso, coração bom #match",
];

const VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
  "https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4",
  "https://download.blender.org/durian/trailer/sintel_trailer-480p.mp4",
];

const pick = (arr, i) => arr[i % arr.length];

function sampleInterests(i) {
  const out = [];
  for (let k = 0; k < 3 + (i % 3); k++) out.push(INTERESTS[(i + k * 5) % INTERESTS.length]);
  return Array.from(new Set(out));
}

function photoUrls(gender, i) {
  const folder = gender === "mulher" ? "women" : "men";
  return [
    `https://randomuser.me/api/portraits/${folder}/${i % 100}.jpg`,
    `https://i.pravatar.cc/800?u=valentines-${gender}-${i}`,
    `https://randomuser.me/api/portraits/${folder}/${(i * 7) % 100}.jpg`,
  ];
}

function tagsFromCaption(caption) {
  return (caption.match(/#[\p{L}\p{N}_]+/gu) || []).slice(0, 6);
}

async function main() {
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 120000,
  });
  await client.connect();
  console.log("CONNECTED");

  // Evita trigger lento/duplicado durante seed em massa
  await client.query(`
    do $$ begin
      alter table auth.users disable trigger on_auth_user_created;
    exception when undefined_object then null;
    end $$;
  `).catch(() => {});
  await client.query(`
    do $$ begin
      alter table auth.users disable trigger on_auth_user_created_trigger;
    exception when undefined_object then null;
    end $$;
  `).catch(() => {});

  const { rows: inst } = await client.query(`select id from auth.instances limit 1`);
  const instanceId = inst[0]?.id || "00000000-0000-0000-0000-000000000000";

  const { rows: existing } = await client.query(`
    select
      count(*)::int as n,
      coalesce(max(substring(email from 'seed([0-9]+)')::int), 0) as max_n
    from auth.users
    where email like 'seed%@valentines.seed'
  `);
  const already = existing[0]?.n || 0;
  const maxN = existing[0]?.max_n || 0;
  console.log("ALREADY_SEED", { already, maxN });
  if (already >= TOTAL) {
    console.log("ENOUGH_USERS");
    await client.end();
    return;
  }

  const passwordHash = (await client.query(`select crypt('SeedUser2026!', gen_salt('bf')) as hash`))
    .rows[0].hash;

  let created = 0;
  let reels = 0;

  const need = TOTAL - already;
  console.log("WILL_CREATE", { need, maxN });
  let made = 0;
  let serial = maxN;

  while (made < need) {
    const batchSize = Math.min(BATCH, need - made);
    const users = [];
    for (let k = 0; k < batchSize; k++) {
      serial += 1;
      const n = serial;
      const gender = n % 2 === 0 ? "mulher" : "homem";
      const first = gender === "mulher" ? pick(FIRST_F, n) : pick(FIRST_M, n);
      const last = pick(LASTS, Math.floor(n / 3));
      const id = randomUUID();
      const email = `seed${String(n).padStart(4, "0")}.${id.slice(0, 8)}@valentines.seed`;
      const createdAt = new Date(Date.now() - (TOTAL - n) * 40_000 - (n % 17) * 3_600_000);
      users.push({
        id,
        email,
        name: `${first} ${last}`,
        gender,
        age: 18 + ((n * 3) % 35),
        city: pick(CITIES, n),
        job: pick(JOBS, n + 11),
        bio: pick(BIOS, n + 5),
        interests: sampleInterests(n),
        photos: photoUrls(gender, n),
        createdAt,
        n,
      });
    }
    const fresh = users;
    const chunkEnd = serial;
    const i = serial - batchSize + 1;

    const nowIso = (d) => d.toISOString();

    const userValues = [];
    const userParams = [];
    let p = 1;
    for (const u of fresh) {
      userValues.push(
        `($${p++}::uuid,$${p++}::uuid,'authenticated','authenticated',$${p++},$${p++},$${p++}::timestamptz,'{"provider":"email","providers":["email"]}'::jsonb,jsonb_build_object('name',$${p++}::text,'seed',true),$${p++}::timestamptz,$${p++}::timestamptz,'','','','')`,
      );
      userParams.push(instanceId, u.id, u.email, passwordHash, nowIso(u.createdAt), u.name, nowIso(u.createdAt), nowIso(u.createdAt));
    }

    await client.query("begin");
    try {
      await client.query(
        `insert into auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
          confirmation_token, recovery_token, email_change_token_new, email_change
        ) values ${userValues.join(",")}
        on conflict (id) do nothing`,
        userParams,
      );

      const idValues = [];
      const idParams = [];
      p = 1;
      for (const u of fresh) {
        idValues.push(
          `($${p++}::uuid,$${p++}::uuid,jsonb_build_object('sub',$${p++}::text,'email',$${p++}::text,'email_verified',true),'email',$${p++},$${p++}::timestamptz,$${p++}::timestamptz,$${p++}::timestamptz)`,
        );
        idParams.push(randomUUID(), u.id, u.id, u.email, u.email, nowIso(u.createdAt), nowIso(u.createdAt), nowIso(u.createdAt));
      }
      await client.query(
        `insert into auth.identities (
          id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
        ) values ${idValues.join(",")}
        on conflict do nothing`,
        idParams,
      );

      const profileValues = [];
      const profileParams = [];
      p = 1;
      for (const u of fresh) {
        profileValues.push(
          `($${p++}::uuid,$${p++},$${p++},$${p++}::int,$${p++},$${p++},$${p++},$${p++},$${p++}::text[],$${p++}::text[],'{"seed":true}'::jsonb,$${p++}::timestamptz,$${p++}::timestamptz)`,
        );
        profileParams.push(
          u.id,
          u.email,
          u.name,
          u.age,
          u.city,
          u.job,
          u.bio,
          u.gender,
          u.interests,
          u.photos,
          nowIso(u.createdAt),
          nowIso(u.createdAt),
        );
      }
      await client.query(
        `insert into public.profiles (
          id, email, name, age, city, job, bio, gender, interests, photos, prefs, created_at, updated_at
        ) values ${profileValues.join(",")}
        on conflict (id) do update set
          name = excluded.name,
          age = excluded.age,
          city = excluded.city,
          job = excluded.job,
          bio = excluded.bio,
          gender = excluded.gender,
          interests = excluded.interests,
          photos = excluded.photos,
          prefs = excluded.prefs,
          updated_at = excluded.updated_at`,
        profileParams,
      );

      const stateValues = [];
      const stateParams = [];
      p = 1;
      for (const u of fresh) {
        stateValues.push(`($${p++}::uuid,'{}'::jsonb,now())`);
        stateParams.push(u.id);
      }
      await client.query(
        `insert into public.user_app_state (user_id, payload, updated_at)
         values ${stateValues.join(",")}
         on conflict (user_id) do nothing`,
        stateParams,
      );

      const reelValues = [];
      const reelParams = [];
      p = 1;
      for (const u of fresh) {
        const reelCount = 1 + (u.n % 3 === 0 ? 1 : 0) + (u.age % 5 === 0 ? 1 : 0);
        for (let r = 0; r < reelCount; r++) {
          const caption = pick(CAPTIONS, u.n + r * 9);
          const media = pick(VIDEOS, u.n + r * 3);
          const poster = u.photos[r % u.photos.length];
          const likes = 3 + ((u.n * 17 + r * 13) % 420);
          const at = new Date(u.createdAt.getTime() + (r + 1) * 3_600_000);
          reelValues.push(
            `($${p++}::uuid,$${p++}::uuid,$${p++},$${p++},$${p++},$${p++}::int,$${p++}::text[],$${p++}::timestamptz)`,
          );
          reelParams.push(
            randomUUID(),
            u.id,
            caption,
            media,
            poster,
            likes,
            tagsFromCaption(caption),
            at.toISOString(),
          );
          reels += 1;
        }
      }
      if (reelValues.length) {
        await client.query(
          `insert into public.reels (
            id, user_id, caption, media_url, poster_url, likes, hashtags, created_at
          ) values ${reelValues.join(",")}`,
          reelParams,
        );
      }

      await client.query("commit");
      created += fresh.length;
      made += fresh.length;
      console.log(`BATCH ${i}-${chunkEnd} ok · +${fresh.length} · made=${made}/${need} reels=${reels}`);
    } catch (err) {
      await client.query("rollback");
      console.error(`BATCH_FAIL ${i}-${chunkEnd}`, err.message);
      throw err;
    }
  }

  // Follows aleatórios
  const { rows: seedUsers } = await client.query(
    `select id from auth.users where email like 'seed%@valentines.seed' order by random() limit 900`,
  );
  let follows = 0;
  const followValues = [];
  const followParams = [];
  let fp = 1;
  for (let i = 0; i < 1800 && seedUsers.length > 1; i++) {
    const a = seedUsers[Math.floor(Math.random() * seedUsers.length)].id;
    const b = seedUsers[Math.floor(Math.random() * seedUsers.length)].id;
    if (a === b) continue;
    followValues.push(`($${fp++}::uuid,$${fp++}::uuid)`);
    followParams.push(a, b);
  }
  if (followValues.length) {
    try {
      const res = await client.query(
        `insert into public.follows (follower_id, following_id)
         values ${followValues.join(",")}
         on conflict do nothing`,
        followParams,
      );
      follows = res.rowCount || 0;
    } catch (err) {
      console.log("FOLLOWS_SKIP", err.message);
    }
  }

  // Reabilita trigger se existir
  await client.query(`
    do $$ begin
      alter table auth.users enable trigger on_auth_user_created;
    exception when undefined_object then null;
    end $$;
  `).catch(() => {});

  const counts = await client.query(`
    select
      (select count(*)::int from public.profiles) as profiles,
      (select count(*)::int from public.reels) as reels,
      (select count(*)::int from auth.users where email like 'seed%@valentines.seed') as seeds
  `);
  console.log("DONE", { created, reels, follows, ...counts.rows[0] });
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
