#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const scanRoots = ["content", "src", "public", "docs"];
const scanFiles = ["site.config.ts", "README.md"];
const attributionHandle = ["kvmy", "666"].join("");
const attributionFiles = new Set(["README.md", "NOTICE", "LICENSE"]);

const forbidden = [
  { label: "personal email", value: ["a.alshdukhi", "gmail.com"].join("@") },
  { label: "private IP address", value: "192.168.100.245" },
  { label: "GitHub token prefix", value: "ghp_" },
  { label: "GitHub fine-grained token prefix", value: "github_pat_" },
  { label: "keystore reference", value: "keystore" },
  { label: "real project name", value: "Puzzle for Geniuses" },
  { label: "real project name", value: "تسجيلة بلوت" },
  { label: "real project name", value: "duoStatusBar" },
  { label: "real project name", value: "AutoExpandNotifications" },
  { label: "real project name", value: "iosEmojis" },
  { label: "real project name", value: "Gboard+" },
];

function walk(directory, files) {
  if (!fs.existsSync(directory)) {
    return;
  }

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") {
      continue;
    }

    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
}

function collectFiles() {
  const files = [];

  for (const root of scanRoots) {
    walk(path.join(repoRoot, root), files);
  }

  for (const name of scanFiles) {
    const filePath = path.join(repoRoot, name);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      files.push(filePath);
    }
  }

  for (const name of fs.readdirSync(repoRoot)) {
    if (!name.startsWith(".env")) {
      continue;
    }
    const filePath = path.join(repoRoot, name);
    if (fs.statSync(filePath).isFile()) {
      files.push(filePath);
    }
  }

  return [...new Set(files)].sort();
}

function main() {
  const files = collectFiles();
  const findings = [];

  for (const filePath of files) {
    const relative = path.relative(repoRoot, filePath).split(path.sep).join("/");
    const text = fs.readFileSync(filePath, "utf8");
    const lines = text.split(/\r?\n/);
    const lowerLines = lines.map((line) => line.toLowerCase());
    const attributionAllowed = attributionFiles.has(relative);

    for (const term of forbidden) {
      const needle = term.value.toLowerCase();
      lowerLines.forEach((line, index) => {
        if (line.includes(needle)) {
          findings.push({
            file: relative,
            line: index + 1,
            label: term.label,
          });
        }
      });
    }

    if (!attributionAllowed) {
      lowerLines.forEach((line, index) => {
        if (line.includes(attributionHandle.toLowerCase())) {
          findings.push({
            file: relative,
            line: index + 1,
            label: "attribution handle outside allowed files",
          });
        }
      });
    }
  }

  if (findings.length === 0) {
    console.log(`Privacy scan passed (${files.length} files checked).`);
    return;
  }

  console.error("Privacy scan failed:");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} ${finding.label}`);
  }
  process.exitCode = 1;
}

main();
