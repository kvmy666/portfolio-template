import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { getWwwRedirect, middleware } from "./middleware";

function request(url: string, method = "GET"): NextRequest {
  return new NextRequest(url, { method });
}

describe("getWwwRedirect", () => {
  it("redirects www GET requests to the same apex path and query", () => {
    expect(
      getWwwRedirect(
        "https://www.example.com/projects/example?ref=smoke",
        "GET",
      )?.href,
    ).toBe("https://example.com/projects/example?ref=smoke");
  });

  it("redirects www HEAD requests", () => {
    expect(
      getWwwRedirect("https://www.example.com/credits", "HEAD")?.href,
    ).toBe("https://example.com/credits");
  });

  it("does not redirect non-GET/HEAD methods", () => {
    expect(
      getWwwRedirect("https://www.example.com/api/contact", "POST"),
    ).toBeNull();
  });

  it("does not redirect the apex host", () => {
    expect(getWwwRedirect("https://example.com/", "GET")).toBeNull();
  });

  it("does not redirect localhost or preview hosts", () => {
    expect(getWwwRedirect("http://localhost:3000/", "GET")).toBeNull();
    expect(
      getWwwRedirect("https://phase-8.example.workers.dev/", "GET"),
    ).toBeNull();
  });
});

describe("middleware", () => {
  it("returns a 301 to the apex for www requests", () => {
    const response = middleware(
      request("https://www.example.com/about?source=test"),
    );

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(
      "https://example.com/about?source=test",
    );
  });

  it("marks preview hosts noindex without redirecting", () => {
    const response = middleware(request("https://phase-8.example.workers.dev/"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
  });

  it("does not mark the canonical host noindex", () => {
    const response = middleware(request("https://example.com/"));

    expect(response.headers.get("x-robots-tag")).toBeNull();
  });
});
