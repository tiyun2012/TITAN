import fs from "node:fs";
import path from "node:path";
// Import process explicitly to satisfy environment-specific type checks for process.exit
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.resolve(__dirname, "..", "apps", "manager", "dist");
const dst = path.resolve(__dirname, "..", "dist");

function rmDir(p) {
  if (!fs.existsSync(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
}
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const ent of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, ent.name);
    const b = path.join(to, ent.name);
    if (ent.isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

if (!fs.existsSync(src)) {
  console.error("[copy-dist] Source not found:", src);
  console.error("Did you run: npm run build -w @ti/manager ?");
  // Explicitly using the imported process to ensure exit() is available
  process.exit(1);
}

rmDir(dst);
copyDir(src, dst);
console.log("[copy-dist] Copied", src, "->", dst);