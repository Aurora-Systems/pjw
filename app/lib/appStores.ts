/**
 * Where the PocketJobs mobile app lives, and which store a visitor's device should go to.
 * Shared by the store badges, the download prompt and the /download smart link, so a store
 * URL only ever has to change here.
 */

export const APP_STORE_ID = "6791999235";
export const APP_STORE_URL = `https://apps.apple.com/us/app/pocketjobs-co/id${APP_STORE_ID}`;

export const ANDROID_PACKAGE = "co.pocketjobs.app";
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

/** One link for both stores — it redirects by device. Printed in the QR code. */
export const DOWNLOAD_PATH = "/download";

export type Platform = "ios" | "android" | "other";

/**
 * Best-effort platform from a user-agent string. iPadOS 13+ reports itself as a Mac, so a
 * "Macintosh" that also has touch is treated as iOS by the client (see isIpadOs below);
 * on the server that case falls through to "other", which safely shows both stores.
 */
export function platformFromUserAgent(ua: string | null | undefined): Platform {
  const s = ua ?? "";
  if (/android/i.test(s)) return "android";
  if (/iphone|ipad|ipod/i.test(s)) return "ios";
  return "other";
}

/** Client-only: iPadOS pretends to be desktop Safari, but has touch points. */
export function detectClientPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const p = platformFromUserAgent(navigator.userAgent);
  if (p !== "other") return p;
  const isIpadOs = /macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
  return isIpadOs ? "ios" : "other";
}

export function storeUrlFor(platform: Platform): string | null {
  if (platform === "ios") return APP_STORE_URL;
  if (platform === "android") return PLAY_STORE_URL;
  return null;
}
