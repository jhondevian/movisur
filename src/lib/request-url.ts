import { siteUrl } from "@/lib/site-metadata";
import { NextRequest } from "next/server";

function normalizeHost(host: string) {
  return host.replace(/^www\./, "").toLowerCase();
}

export function getPublicOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const siteOrigin = new URL(siteUrl).origin;

  if (!host || host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
    return siteOrigin;
  }

  return `${forwardedProto || request.nextUrl.protocol.replace(":", "")}://${host}`;
}

export function getPublicUrl(request: NextRequest, path: string) {
  return new URL(path, getPublicOrigin(request));
}

export function isAllowedSiteReferrer(request: NextRequest) {
  const referer = request.headers.get("referer");
  if (!referer) return true;

  try {
    const refererHost = normalizeHost(new URL(referer).hostname);
    const allowedHosts = [
      request.nextUrl.hostname,
      request.headers.get("host") || "",
      request.headers.get("x-forwarded-host") || "",
      new URL(siteUrl).hostname,
    ]
      .filter(Boolean)
      .map(normalizeHost);

    return allowedHosts.includes(refererHost);
  } catch {
    return false;
  }
}
