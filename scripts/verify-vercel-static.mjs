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

console.log(
  `Validated ${requiredCopy.length} identity markers and ${localReferences.size} local asset references.`,
);
