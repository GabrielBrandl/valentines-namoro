const PREF_KEY = "valentines-notify";

export type NotifyPrefs = {
  enabled: boolean;
  asked: boolean;
};

export function getNotifyPrefs(): NotifyPrefs {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) return { enabled: false, asked: false, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { enabled: false, asked: false };
}

export function setNotifyPrefs(prefs: Partial<NotifyPrefs>) {
  const next = { ...getNotifyPrefs(), ...prefs };
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export async function requestNotifyPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  const ok = permission === "granted";
  setNotifyPrefs({ enabled: ok, asked: true });
  return ok;
}

export function notify(title: string, body: string, tag?: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  const prefs = getNotifyPrefs();
  if (!prefs.enabled || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body,
      icon: "/app-icon.jpg",
      tag: tag || title,
      badge: "/app-icon.jpg",
    });
    window.setTimeout(() => n.close(), 6000);
  } catch {
    /* alguns browsers bloqueiam fora de gesto do usuário */
  }
}

export function notifyMatch(name: string) {
  notify("Novo match!", `Você e ${name} se curtiram.`, `match-${name}`);
}

export function notifyChatReply(name: string, text: string) {
  notify(name, text.slice(0, 120), `chat-${name}`);
}

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch {
    /* SW opcional na demo */
  }
}
