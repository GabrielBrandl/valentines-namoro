/** Versão do cliente — muda a cada build de produção sem apagar dados. */
export const APP_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION ||
  process.env.NEXT_PUBLIC_BUILD_ID ||
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
  "1.1.0";

export const APP_RELEASE_NOTES =
  process.env.NEXT_PUBLIC_RELEASE_NOTES ||
  "Updates suaves: vídeos e contas ficam na nuvem; o app não reinicia do zero.";
