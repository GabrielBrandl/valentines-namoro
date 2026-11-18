import sharp from "sharp";
import fs from "fs";
import path from "path";

const outDir = path.resolve("public/shop");
fs.mkdirSync(outDir, { recursive: true });

function frame(bg0, bg1, art, title, subtitle) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1125" viewBox="0 0 900 1125">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg0}"/>
      <stop offset="100%" stop-color="${bg1}"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F2D27A"/>
      <stop offset="100%" stop-color="#B8860B"/>
    </linearGradient>
  </defs>
  <rect width="900" height="1125" fill="url(#bg)"/>
  <rect x="60" y="70" width="780" height="985" rx="42" fill="rgba(0,0,0,0.26)" stroke="rgba(212,175,55,0.35)" stroke-width="2"/>
  <g transform="translate(0,20)">${art}</g>
  <text x="450" y="820" text-anchor="middle" font-family="Georgia, serif" font-size="50" fill="#F6EFE8">${title}</text>
  <text x="450" y="875" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#D4AF37">${subtitle}</text>
  <text x="450" y="980" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="rgba(246,239,232,0.55)">Valentine's</text>
</svg>`;
}

const arts = {
  vinho: `
    <ellipse cx="450" cy="690" rx="90" ry="18" fill="rgba(0,0,0,0.35)"/>
    <rect x="405" y="250" width="90" height="55" rx="8" fill="#5c1a24"/>
    <rect x="420" y="210" width="60" height="50" rx="8" fill="url(#gold)"/>
    <path d="M380 310 C360 390 360 470 380 560 L520 560 C540 470 540 390 520 310 Z" fill="#6b1d2a"/>
    <path d="M395 330 C385 400 385 460 398 540 L502 540 C515 460 515 400 505 330 Z" fill="#8a2435"/>
    <rect x="400" y="390" width="100" height="70" rx="8" fill="url(#gold)" opacity="0.9"/>
    <text x="450" y="435" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="#3a1a08">RESERVA</text>
  `,
  kit: `
    <rect x="280" y="320" width="340" height="280" rx="18" fill="#8B4513"/>
    <rect x="280" y="320" width="340" height="280" rx="18" fill="rgba(255,255,255,0.06)"/>
    <rect x="430" y="300" width="40" height="320" fill="url(#gold)"/>
    <rect x="260" y="430" width="380" height="40" fill="url(#gold)"/>
    <circle cx="450" cy="450" r="28" fill="#F6EFE8"/>
    <circle cx="450" cy="450" r="16" fill="#B8860B"/>
    <rect x="310" y="360" width="70" height="50" rx="8" fill="#5c1a24"/>
    <rect x="520" y="360" width="70" height="50" rx="8" fill="#1d3a2a"/>
  `,
  serum: `
    <ellipse cx="450" cy="680" rx="70" ry="16" fill="rgba(0,0,0,0.35)"/>
    <rect x="410" y="220" width="80" height="40" rx="6" fill="#c9d6e2"/>
    <rect x="425" y="190" width="50" height="40" rx="10" fill="#e8f0f6"/>
    <path d="M390 270 L390 620 Q390 660 450 660 Q510 660 510 620 L510 270 Z" fill="#9eb8cb"/>
    <path d="M405 290 L405 600 Q405 630 450 630 Q495 630 495 600 L495 290 Z" fill="#c7d9e8"/>
    <rect x="420" y="360" width="60" height="120" rx="8" fill="rgba(255,255,255,0.35)"/>
    <circle cx="450" cy="500" r="18" fill="url(#gold)" opacity="0.8"/>
  `,
  doce: `
    <rect x="270" y="300" width="360" height="300" rx="24" fill="#6b2140"/>
    <rect x="290" y="320" width="320" height="260" rx="18" fill="#8a2b52"/>
    <rect x="320" y="360" width="80" height="80" rx="12" fill="#3d1024"/>
    <rect x="420" y="360" width="80" height="80" rx="12" fill="#4a1830"/>
    <rect x="520" y="360" width="60" height="80" rx="12" fill="#3d1024"/>
    <rect x="320" y="460" width="260" height="70" rx="12" fill="#2a0c18"/>
    <path d="M330 390 Q360 370 390 390 Q360 410 330 390" fill="#F2D27A"/>
    <path d="M430 390 Q460 370 490 390 Q460 410 430 390" fill="#F2D27A"/>
    <circle cx="550" cy="400" r="14" fill="#F2D27A"/>
  `,
  bodega: `
    <rect x="250" y="280" width="400" height="360" rx="20" fill="#2a1a12"/>
    <rect x="270" y="300" width="360" height="80" fill="#3a2418"/>
    <text x="450" y="350" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="#D4AF37">BODEGA</text>
    <rect x="300" y="420" width="50" height="140" rx="6" fill="#5c1a24"/>
    <rect x="370" y="400" width="55" height="160" rx="6" fill="#6b2a14"/>
    <rect x="445" y="430" width="50" height="130" rx="6" fill="#3a1a10"/>
    <rect x="515" y="410" width="55" height="150" rx="6" fill="#7a2030"/>
    <ellipse cx="450" cy="620" rx="140" ry="18" fill="rgba(0,0,0,0.3)"/>
  `,
  cafe: `
    <ellipse cx="450" cy="650" rx="120" ry="22" fill="rgba(0,0,0,0.3)"/>
    <path d="M330 360 Q330 300 450 300 Q570 300 570 360 L550 560 Q450 600 350 560 Z" fill="#F6EFE8"/>
    <path d="M350 380 Q350 340 450 340 Q550 340 550 380 L535 540 Q450 570 365 540 Z" fill="#6b3e26"/>
    <path d="M570 400 Q640 400 640 470 Q640 540 570 540" fill="none" stroke="#F6EFE8" stroke-width="18" stroke-linecap="round"/>
    <ellipse cx="450" cy="390" rx="70" ry="14" fill="#3a2418"/>
    <path d="M410 250 Q430 220 450 250 Q470 220 490 250" fill="none" stroke="rgba(246,239,232,0.5)" stroke-width="8" stroke-linecap="round"/>
  `,
  mercado: `
    <rect x="260" y="300" width="380" height="300" rx="24" fill="#1a3a30"/>
    <rect x="290" y="340" width="100" height="80" rx="12" fill="#2d6a55"/>
    <rect x="410" y="340" width="100" height="80" rx="12" fill="#245a48"/>
    <rect x="530" y="340" width="80" height="80" rx="12" fill="#2d6a55"/>
    <rect x="290" y="450" width="320" height="100" rx="12" fill="#0f241e"/>
    <circle cx="360" cy="500" r="22" fill="#D4AF37"/>
    <circle cx="450" cy="500" r="22" fill="#F2D27A"/>
    <circle cx="540" cy="500" r="22" fill="#D4AF37"/>
    <path d="M300 280 L340 250 L560 250 L600 280" fill="none" stroke="#D4AF37" stroke-width="10" stroke-linecap="round"/>
  `,
  presente: `
    <rect x="300" y="360" width="300" height="240" rx="16" fill="#6b2140"/>
    <rect x="300" y="300" width="300" height="70" rx="12" fill="#8a2b52"/>
    <rect x="430" y="300" width="40" height="300" fill="url(#gold)"/>
    <rect x="300" y="420" width="300" height="40" fill="url(#gold)"/>
    <path d="M450 300 Q400 240 360 280 Q400 300 450 300" fill="#F2D27A"/>
    <path d="M450 300 Q500 240 540 280 Q500 300 450 300" fill="#D4AF37"/>
    <circle cx="450" cy="300" r="14" fill="#F6EFE8"/>
  `,
};

const items = [
  ["vinho.jpg", "#3a0f18", "#12080a", arts.vinho, "Vinho Tinto Reserva", "Garrafa 750ml"],
  ["kit-encontro.jpg", "#4a2c12", "#1a1208", arts.kit, "Kit Encontro", "Vela · Cartao · Chocolate"],
  ["serum.jpg", "#1d2a3a", "#0b1218", arts.serum, "Serum Glow", "Beleza noturna"],
  ["box-doce.jpg", "#4a1830", "#180810", arts.doce, "Box Doce", "Surpresa artesanal"],
  ["bodega.jpg", "#2a1810", "#0e0906", arts.bodega, "Bodega do Centro", "Bebidas e petiscos"],
  ["cafe.jpg", "#3a2618", "#140e08", arts.cafe, "Cafe Aurora", "Brunch e espresso"],
  ["mercado.jpg", "#143028", "#081410", arts.mercado, "Mercado Express", "Pronto em minutos"],
  ["presente.jpg", "#3a2030", "#140810", arts.presente, "Presentes", "Para o match"],
];

for (const [file, bg0, bg1, art, title, subtitle] of items) {
  const svg = frame(bg0, bg1, art, title, subtitle);
  await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(path.join(outDir, file));
}

console.log("SHOP_IMAGES_OK", fs.readdirSync(outDir));
