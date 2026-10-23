import { NextResponse, type NextRequest } from "next/server";

import siteJson from "../content/site.json";

const canonical = new URL(siteJson.url);
const canonicalHost = canonical.hostname;
const wwwHost = `www.${canonicalHost}`;
const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function getWwwRedirect(
  requestUrl: string,
  method: string,
): URL | null {
  if (method !== "GET" && method !== "HEAD") {
    return null;
  }

  let url: URL;

  try {
    url = new URL(requestUrl);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  if (url.hostname !== wwwHost) {
    return null;
  }

  return new URL(`${url.pathname}${url.search}`, canonical.origin);
}

function isPreviewHost(hostname: string): boolean {
  return (
    hostname !== canonicalHost &&
    hostname !== wwwHost &&
    !localHosts.has(hostname)
  );
}

export function middleware(request: NextRequest) {
  const redirect = getWwwRedirect(request.url, request.method);

  if (redirect) {
    return NextResponse.redirect(redirect, 301);
  }

  const response = NextResponse.next();

  if (isPreviewHost(request.nextUrl.hostname)) {
    response.headers.set("x-robots-tag", "noindex, nofollow");
  }

  return response;
}
