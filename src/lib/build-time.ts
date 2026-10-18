export async function getCopyrightYear(): Promise<number> {
  "use cache";
  return new Date().getFullYear();
}
