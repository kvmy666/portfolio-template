const techQueries: Record<string, string> = {
  TypeScript: "TypeScript programming language",
  "Next.js": "Next.js React framework",
  "Tailwind CSS": "Tailwind CSS framework",
  Kotlin: "Kotlin programming language",
  "Jetpack Compose": "Jetpack Compose Android UI toolkit",
  Room: "Room persistence library Android",
  Rust: "Rust programming language",
};

export function techSearchQuery(technology: string): string {
  return techQueries[technology] ?? technology;
}

export function hasCuratedTechQuery(technology: string): boolean {
  return technology in techQueries;
}

export function techSearchHref(technology: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(
    `what is ${techSearchQuery(technology)}`,
  )}`;
}
