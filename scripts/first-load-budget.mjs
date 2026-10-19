#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextRoot = path.join(repoRoot, ".next");
const outputRoot = path.join(nextRoot, "first-load");
const budgetBytes = 180_000;
const projectsDirectory = path.join(repoRoot, "content", "projects");

function representativeProjectSlug() {
  if (!fs.existsSync(projectsDirectory)) {
    return null;
  }

  const files = fs
    .readdirSync(projectsDirectory)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();

  for (const fileName of files) {
    try {
      const project = JSON.parse(
        fs.readFileSync(path.join(projectsDirectory, fileName), "utf8"),
      );

      if (typeof project.slug === "string" && project.slug.length > 0) {
        return project.slug;
      }
    } catch {
      // Content validation reports malformed files; skip them while measuring.
    }
  }

  return null;
}

const routes = [
  {
    name: "/",
    html: path.join(nextRoot, "server", "app", "index.html"),
    output: "home",
  },
];

const projectSlug = representativeProjectSlug();

if (projectSlug) {
  routes.push({
    name: "/projects/[slug]",
    html: path.join(
      nextRoot,
      "server",
      "app",
      "projects",
      `${projectSlug}.html`,
    ),
    output: "project",
  });
}

function scriptSources(html) {
  const sources = [];
  const pattern = /<script\b([^>]*)>/gi;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    const attributes = match[1];
    const src = /\bsrc="([^"]+)"/i.exec(attributes);

    if (!src || /\bnoModule\b/i.test(attributes)) {
      continue;
    }

    sources.push(src[1]);
  }

  return [...new Set(sources)];
}

function clean(directory) {
  fs.rmSync(directory, { recursive: true, force: true });
  fs.mkdirSync(directory, { recursive: true });
}

function formatKb(bytes) {
  return `${(bytes / 1000).toFixed(1)} kB`;
}

if (!fs.existsSync(nextRoot)) {
  console.error("Run `next build` before measuring first-load JavaScript.");
  process.exit(1);
}

clean(outputRoot);

let worstRoute = null;

console.log("\nFirst Load JS (initial <script> tags, noModule polyfills excluded)");
console.log("Route                    gzip      raw");

for (const route of routes) {
  if (!fs.existsSync(route.html)) {
    console.error(`Missing prerendered HTML: ${route.html}`);
    process.exit(1);
  }

  const sources = scriptSources(fs.readFileSync(route.html, "utf8"));
  const target = path.join(outputRoot, route.output);
  fs.mkdirSync(target, { recursive: true });

  let gzipBytes = 0;
  let rawBytes = 0;

  for (const source of sources) {
    const relativeSource = decodeURIComponent(source.replace(/^\/_next\//, ""));
    const file = path.join(nextRoot, relativeSource);
    const contents = fs.readFileSync(file);

    gzipBytes += zlib.gzipSync(contents, { level: 9 }).length;
    rawBytes += contents.length;
    fs.copyFileSync(file, path.join(target, path.basename(file)));
  }

  console.log(
    `${route.name.padEnd(24)} ${formatKb(gzipBytes).padStart(9)} ${formatKb(rawBytes).padStart(9)}`,
  );

  if (!worstRoute || gzipBytes > worstRoute.gzipBytes) {
    worstRoute = { ...route, gzipBytes, rawBytes };
  }
}

if (worstRoute && worstRoute.gzipBytes > budgetBytes) {
  console.error(
    `\nFirst-load budget exceeded: ${worstRoute.name} is ${formatKb(worstRoute.gzipBytes)}, budget is ${formatKb(budgetBytes)}.`,
  );
  process.exit(1);
}

console.log(
  `\nBudget: ${formatKb(budgetBytes)} gzip. Worst route: ${worstRoute.name} at ${formatKb(worstRoute.gzipBytes)}.`,
);
