#!/usr/bin/env node
// fix-durations.mjs — Update frame durations to match real TTS audio lengths
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const FRAMES_DIR = resolve(HERE, "..", "compositions", "frames");

// [filename, oldDuration, newDuration]
const updates = [
  ["01-title.html",       9.0,  9.244],
  ["02-capabilities.html", 10.5, 13.732],
  ["03-engines.html",      10.5, 16.684],
  ["04-architecture.html", 10.5, 16.012],
  ["05-mcp.html",          10.5, 14.500],
  ["06-opensource.html",    9.5, 12.200],
];

for (const [filename, oldDur, newDur] of updates) {
  const filePath = join(FRAMES_DIR, filename);
  let content = readFileSync(filePath, "utf8");
  const oldStr = oldDur.toString();
  const newStr = newDur.toString();
  const delta = newDur - oldDur;

  // 1. Replace template data-duration
  content = content.replace(
    `data-duration="${oldStr}"`,
    `data-duration="${newStr}"`
  );

  // 2. Replace all background clip durations (ground, bloom, label, pagenum, pulse, etc.)
  // These all have data-duration="<oldDur>"
  content = content.split(`data-duration="${oldStr}"`).join(`data-duration="${newStr}"`);

  // 3. Extend content clip durations by delta
  // Find all data-duration="X" where X is not the newDur, and add delta
  content = content.replace(/data-duration="([\d.]+)"/g, (match, val) => {
    const num = parseFloat(val);
    if (num === newDur) return match; // skip already-updated values
    const adjusted = (num + delta).toFixed(3);
    return `data-duration="${adjusted}"`;
  });

  writeFileSync(filePath, content, "utf8");
  console.log(`✓ ${filename}: ${oldStr}s → ${newStr}s (delta +${delta.toFixed(3)}s)`);
}

console.log("\nAll frame durations updated.");
