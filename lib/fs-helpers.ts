import { readFile } from "fs/promises";

/**
 * Thin wrapper around `fs/promises.readFile` for utf-8 text files.
 * Exists as a separate module so tests can spy on it without hitting
 * the non-configurable ESM namespace of the Node.js built-in.
 */
export async function readTextFile(filePath: string): Promise<string> {
  return readFile(filePath, "utf-8");
}
