import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function text(path) { return readFile(new URL(path, import.meta.url), "utf8"); }

test("Vercel artifact serves matching responsive source scripts and styles", async () => {
  const [script, productionScript, css, productionCss, html] = await Promise.all([
    text("../public/mobile-reader.js"),
    text("../vercel-static/mobile-reader.js"),
    text("../public/mobile-reader.css"),
    text("../vercel-static/mobile-reader.css"),
    text("../vercel-static/index.html"),
  ]);
  assert.equal(script, productionScript);
  assert.equal(css, productionCss);
  assert.match(html, /href="\/mobile-reader\.css"/);
  assert.match(html, /src="\/mobile-reader\.js"/);
  assert.match(script, /pocket-sheet-host/);
  assert.match(script, /Enlarge event flyer/);
  assert.match(script, /page\.cloneNode\(true\)/);
});

test("Mobile reader preserves native scroll, tap targets, and responsive page width", async () => {
  const [js, css] = await Promise.all([
    text("../public/mobile-reader.js"), text("../public/mobile-reader.css"),
  ]);
  assert.doesNotMatch(js, /touchmove|wheel|scrollIntoView\(/);
  assert.match(css, /\.pocket-sheet-host\s*\{\s*width:min\(100%,620px\)/);
  assert.match(css, /\.pocket-bottom button\s*\{\s*min-height:48px/);
  assert.match(css, /\.pocket-app \.page-content :is\(\.story-copy/);
  assert.match(js, /media\.addEventListener\("change"/);
});
