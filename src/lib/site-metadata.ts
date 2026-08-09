export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://www.movisur.net";

export const defaultShareImage = "/images/movisur-logo.png";

export function getShareImage(imageUrl?: string | null) {
  return imageUrl || defaultShareImage;
}

export function absoluteUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  return new URL(path, siteUrl).toString();
}

export function cleanSeoText(value: string | null | undefined, fallback: string) {
  const text = (value || fallback).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  return text.length > 158 ? `${text.slice(0, 155).trim()}...` : text;
}
