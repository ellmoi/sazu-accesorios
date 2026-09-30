import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { dirname, extname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const excluded = new Set([".git", "node_modules", "dist", "build", "coverage", "tmp"]);
function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (excluded.has(entry.name) || entry.isSymbolicLink()) return [];
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

let failures = 0;
let scripts = 0;
let references = 0;
for (const path of walk(root)) {
  const extension = extname(path);
  if ([".js", ".mjs", ".cjs"].includes(extension)) {
    scripts++;
    const result = spawnSync(process.execPath, ["--check", path], { encoding: "utf8" });
    if (result.status !== 0) {
      console.error(result.error?.message || result.stderr);
      failures++;
    }
  }
  const pattern = {
    ".html": /\b(?:src|href)\s*=\s*["']([^"']+)["']/gi,
    ".css": /url\(\s*["']?([^\s"')]+)["']?\s*\)/gi,
    ".md": /\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g,
  }[extension];
  if (!pattern) continue;
  for (const match of readFileSync(path, "utf8").matchAll(pattern)) {
    const target = match[1];
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(target)) continue;
    const local = decodeURIComponent(target.split(/[?#]/)[0]);
    if (!local) continue;
    const destination = local.startsWith("/")
      ? resolve(root, local.slice(1))
      : resolve(dirname(path), local);
    references++;
    if (!existsSync(destination) || !statSync(destination).isFile()) {
      console.error(`${relative(root, path)}: missing local file ${target}`);
      failures++;
    }
  }
}
console.log(`${scripts} JavaScript files checked; ${references} local references checked; ${failures} errors.`);
process.exitCode = failures ? 1 : 0;
