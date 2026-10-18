import "server-only";

import fs from "node:fs";
import path from "node:path";

import { siteConfig } from "../../site.config";
import {
  createProjectsSchema,
  type Project,
} from "./schema";

const projectsDirectory = path.join(process.cwd(), "content", "projects");


function readProjects(): Project[] {
  if (!fs.existsSync(projectsDirectory)) {
    return [];
  }

  const fileNames = fs
    .readdirSync(projectsDirectory)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();

  const rawProjects = fileNames.map((fileName) => {
    const filePath = path.join(projectsDirectory, fileName);

    try {
      return JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Could not read ${filePath}: ${message}`);
    }
  });

  if (rawProjects.length === 0) {
    return [];
  }

  const schema = createProjectsSchema(siteConfig.defaultLocale);
  const result = schema.safeParse(rawProjects);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => {
        const location = issue.path.length > 0 ? issue.path.join(".") : "(root)";
        return `- ${location}: ${issue.message}`;
      })
      .join("\n");

    throw new Error(
      `Invalid project content in content/projects. Fix these problems before building:\n${details}`,
    );
  }

  return result.data.sort(
    (left, right) =>
      left.order - right.order || left.slug.localeCompare(right.slug),
  );
}

export function getAllProjects(): Project[] {
  return readProjects();
}

export function getProject(slug: string): Project | undefined {
  return getAllProjects().find((project) => project.slug === slug);
}
