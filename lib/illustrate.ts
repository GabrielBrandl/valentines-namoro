function hueOf(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return { hash, hue: hash % 360 };
}

/** Retrato ilustrado e fictício. Não usa foto de pessoa real. */
export function illustrated(seed: string) {
  const { hash, hue } = hueOf(seed);
  const hair = ["#1c1917", "#5c3317", "#c45c26", "#2c1810"][hash % 4];
  const shirt = `hsl(${(hue + 20) % 360} 42% 42%)`;
  const bg = `hsl(${hue} 46% 62%)`;
  const bg2 = `hsl(${(hue + 28) % 360} 38% 38%)`;
  const variant = hash % 3;
  const hairPath =
    variant === 0
      ? `<path d="M250 250c20-120 280-130 300 10 10 40-20 70-40 40-30-50-190-60-220 0-20 30-50 0-40-50z" fill="${hair}"/>`
      : variant === 1
        ? `<path d="M230 280c10-150 340-160 350 20-40-30-80-20-110 10-40-40-120-50-160 0-30-20-60-20-80-30z" fill="${hair}"/>`
        : `<path d="M260 240c40-90 240-90 280 10v80c-40-40-240-40-280 0z" fill="${hair}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${bg}"/>
        <stop offset="1" stop-color="${bg2}"/>
      </linearGradient>
    </defs>
    <rect width="800" height="1000" fill="url(#bg)"/>
    <ellipse cx="400" cy="860" rx="220" ry="180" fill="${shirt}"/>
    <circle cx="400" cy="430" r="150" fill="#f3d2b5"/>
    ${hairPath}
    <circle cx="345" cy="430" r="10" fill="#1c1917"/>
    <circle cx="455" cy="430" r="10" fill="#1c1917"/>
    <path d="M360 490c25 28 55 28 80 0" fill="none" stroke="#a15b45" stroke-width="8" stroke-linecap="round"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
