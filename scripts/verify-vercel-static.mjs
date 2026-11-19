import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const outputDirectory = resolve(process.argv[2] ?? "vercel-static");
const entryPath = resolve(outputDirectory, "index.html");
const html = await readFile(entryPath, "utf8");
const assetDirectory = resolve(outputDirectory, "assets");
const assetFiles = await readdir(assetDirectory);
const JavaScriptFiles = assetFiles.filter((name) => name.endsWith(".js"));
const JavaScript = await Promise.all(
  JavaScriptFiles.map((name) => readFile(resolve(assetDirectory, name), "utf8")),
);
const deployableCorpus = [html, ...JavaScript].join("\n");

const requiredCopy = [
  "ASC3ND",
  "The ASC3ND Collective",
  "Empower youth.",
  "Page-turn sound?",
];

for (const copy of requiredCopy) {
  if (!deployableCorpus.includes(copy)) {
    throw new Error(`Vercel artifact is missing required book copy: ${copy}`);
  }
}

const localReferences = new Set();
for (const match of html.matchAll(/(?:src|href)=["'](\/(?!\/)[^"'#?]+)["']/g)) {
  localReferences.add(match[1]);
}

if (localReferences.size === 0) {
  throw new Error("Vercel entry does not reference any local assets");
}

for (const reference of localReferences) {
  await access(resolve(outputDirectory, `.${reference}`));
}

// The Vercel deployment is an immutable checked-in static bundle, not the
// live Vinext build output. Never ship a new mobile reader without its real
// deployable CSS/JS or with source and production copies out of sync.
const mobileAssets = ["mobile-reader.css", "mobile-reader.js"];
for (const asset of mobileAssets) {
  if (!html.includes(`/${asset}`)) throw new Error(`Static HTML does not load ${asset}`);
  const deployed = await readFile(resolve(outputDirectory, asset), "utf8");
  const source = await readFile(resolve(outputDirectory, "../public", asset), "utf8");
  if (!deployed || deployed !== source) throw new Error(`Mobile reader source and deployment disagree: ${asset}`);
}

console.log(
  `Validated ${requiredCopy.length} identity markers and ${localReferences.size} local asset references.`,
);
