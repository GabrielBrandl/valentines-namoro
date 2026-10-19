const FECON_KEY = "fecon-v1";
const PRODUCT_KEY = "valentine-product-v1";
const AUTH_KEY = "valentines-auth";
const NOTIFY_KEY = "valentines-notify";
const RESET_KEY = "valentines-reset-pending";

export type LocalBackup = {
  v: 1;
  label: "backup-local-pre-backend";
  at: number;
  fecon: string | null;
  product: string | null;
  auth: string | null;
  notify: string | null;
  resetPending: string | null;
};

export function exportLocalBackup(): LocalBackup {
  return {
    v: 1,
    label: "backup-local-pre-backend",
    at: Date.now(),
    fecon: localStorage.getItem(FECON_KEY),
    product: localStorage.getItem(PRODUCT_KEY),
    auth: localStorage.getItem(AUTH_KEY),
    notify: localStorage.getItem(NOTIFY_KEY),
    resetPending: localStorage.getItem(RESET_KEY),
  };
}

export function downloadLocalBackup() {
  const payload = exportLocalBackup();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `valentine-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function importLocalBackup(raw: string): string | null {
  try {
    const data = JSON.parse(raw) as LocalBackup & { perfil?: string | null; produto?: string | null };
    const fecon = data.fecon ?? data.perfil ?? null;
    const product = data.product ?? data.produto ?? null;
    if (!fecon && !product) return "Arquivo sem dados reconhecíveis.";
    if (fecon) localStorage.setItem(FECON_KEY, fecon);
    if (product) localStorage.setItem(PRODUCT_KEY, product);
    if (data.auth) localStorage.setItem(AUTH_KEY, data.auth);
    if (data.notify) localStorage.setItem(NOTIFY_KEY, data.notify);
    if (data.resetPending) localStorage.setItem(RESET_KEY, data.resetPending);
    return null;
  } catch {
    return "Não consegui ler esse arquivo JSON.";
  }
}

export function storePendingReset(email: string) {
  localStorage.setItem(
    RESET_KEY,
    JSON.stringify({ email: email.trim().toLowerCase(), at: Date.now() }),
  );
}

export function getPendingReset(): { email: string; at: number } | null {
  try {
    const raw = localStorage.getItem(RESET_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { email: string; at: number };
  } catch {
    return null;
  }
}

/** Demo auth — senha simples (não é segurança real). */
export function saveAuth(email: string, password: string) {
  const hash = simpleHash(`${email.trim().toLowerCase()}::${password}`);
  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({ email: email.trim().toLowerCase(), hash, at: Date.now() }),
  );
}

export function checkAuth(email: string, password: string): boolean {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as { email: string; hash: string };
    if (data.email !== email.trim().toLowerCase()) return false;
    return data.hash === simpleHash(`${email.trim().toLowerCase()}::${password}`);
  } catch {
    return false;
  }
}

function simpleHash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
