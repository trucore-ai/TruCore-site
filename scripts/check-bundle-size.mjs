#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

const PROJECT_ROOT = process.cwd();
const NEXT_DIR = path.join(PROJECT_ROOT, ".next");
const MAX_INITIAL_ROUTE_JS_BYTES = 200 * 1024;
const MAX_SINGLE_CHUNK_BYTES = 150 * 1024;

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function normalizeAssetPath(assetPath) {
  return assetPath.startsWith("/") ? assetPath.slice(1) : assetPath;
}

function byteSizeForAsset(assetPath) {
  const normalized = normalizeAssetPath(assetPath);
  const absolute = path.join(NEXT_DIR, normalized);
  const content = readFileSync(absolute);
  return gzipSync(content, { level: 9 }).length;
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function collectPageRoutes() {
  const appPathRoutes = readJson(path.join(NEXT_DIR, "app-path-routes-manifest.json"));
  const pageRoutes = [];

  for (const [appPath, route] of Object.entries(appPathRoutes)) {
    if (!appPath.endsWith("/page")) continue;
    if (route.startsWith("/_")) continue;
    if (route.startsWith("/api/")) continue;
    pageRoutes.push(route);
  }

  return [...new Set(pageRoutes)].sort();
}

function getSharedInitialJsAssets(buildManifest) {
  const files = [
    ...(buildManifest.rootMainFiles ?? []),
    ...(buildManifest.polyfillFiles ?? []),
  ];
  return [...new Set(files.filter((asset) => asset.endsWith(".js")))];
}

function listJsChunks(directory) {
  const files = [];
  const entries = readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listJsChunks(absolutePath));
      continue;
    }
    if (!entry.name.endsWith(".js")) continue;
    files.push(absolutePath);
  }

  return files;
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function gzipSizeForFile(filePath) {
  const content = readFileSync(filePath);
  return gzipSync(content, { level: 9 }).length;
}

function main() {
  const buildManifest = readJson(path.join(NEXT_DIR, "build-manifest.json"));
  const pageRoutes = collectPageRoutes();
  const sharedInitialAssets = getSharedInitialJsAssets(buildManifest);

  if (pageRoutes.length === 0 || sharedInitialAssets.length === 0) {
    console.error("Could not derive page routes or shared initial JS assets from Next.js manifests.");
    process.exit(1);
  }

  const routeSizes = [];
  const sharedInitialRouteBytes = sharedInitialAssets.reduce(
    (sum, asset) => sum + byteSizeForAsset(asset),
    0,
  );

  for (const route of pageRoutes) {
    routeSizes.push({ route, bytes: sharedInitialRouteBytes });
  }

  const allChunks = listJsChunks(path.join(NEXT_DIR, "static", "chunks"));
  const chunkSizes = [];
  for (const chunk of allChunks) {
    const relativeToNext = toPosixPath(path.relative(NEXT_DIR, chunk));
    chunkSizes.push({ chunk: relativeToNext, bytes: gzipSizeForFile(chunk) });
  }

  const oversizedRoutes = routeSizes
    .filter(({ bytes }) => bytes > MAX_INITIAL_ROUTE_JS_BYTES)
    .sort((a, b) => b.bytes - a.bytes);
  const oversizedChunks = chunkSizes
    .filter(({ bytes }) => bytes > MAX_SINGLE_CHUNK_BYTES)
    .sort((a, b) => b.bytes - a.bytes);

  const largestRoute = [...routeSizes].sort((a, b) => b.bytes - a.bytes)[0];
  const largestChunk = [...chunkSizes].sort((a, b) => b.bytes - a.bytes)[0];

  console.log(`Largest initial route JS (gzip): ${largestRoute.route} (${formatKb(largestRoute.bytes)})`);
  console.log(`Largest single chunk (gzip): ${largestChunk.chunk} (${formatKb(largestChunk.bytes)})`);

  if (oversizedRoutes.length > 0) {
    console.error(`\nBundle budget exceeded: initial route JS must be <= ${formatKb(MAX_INITIAL_ROUTE_JS_BYTES)}`);
    for (const item of oversizedRoutes) {
      console.error(`- ${item.route}: ${formatKb(item.bytes)}`);
    }
  }

  if (oversizedChunks.length > 0) {
    console.error(`\nBundle budget exceeded: single chunk must be <= ${formatKb(MAX_SINGLE_CHUNK_BYTES)}`);
    for (const item of oversizedChunks) {
      console.error(`- ${item.chunk}: ${formatKb(item.bytes)}`);
    }
  }

  if (oversizedRoutes.length > 0 || oversizedChunks.length > 0) {
    process.exit(1);
  }

  console.log("Bundle budget check passed.");
}

main();
