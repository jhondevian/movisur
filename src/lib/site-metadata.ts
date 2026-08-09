export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3001";

export const defaultShareImage = "/images/movisur-logo.png";

export function getShareImage(imageUrl?: string | null) {
  return imageUrl || defaultShareImage;
}

