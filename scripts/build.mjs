import { cp, mkdir, readFile, writeFile } from "node:fs/promises";

const legacyFiles = [
  "index.html", "styles.css", "updates.css", "script.js", "profile.js", "login.js",
  "counter.js", "selection.js", "opportunity-summary.js", "notifications.js", "assistant.js", "i18n.js", "checklist.js", "pages.css", "pages.js", "profile-page.css", "profile-page.js", "profile.html", "study.html",
  "jobs.html", "housing.html", "events.html", "grants.html", "market.html", "community.html", "community.js",
];
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" };
const assets = Object.fromEntries(await Promise.all(legacyFiles.map(async (file) => {
  const content = await readFile(`dist/${file}`);
  const extension = file.slice(file.lastIndexOf("."));
  return [`/${file}`, { content: content.toString("base64"), contentType: types[extension] }];
})));
await writeFile("worker/legacy-assets.js", `// Generated from the preserved StudentHub interface.\nexport const legacyAssets = ${JSON.stringify(assets)};\n`);

await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai/drizzle", { recursive: true });
await cp("worker/index.js", "dist/server/index.js");
await cp("worker/legacy-assets.js", "dist/server/legacy-assets.js");
await cp(".openai/hosting.json", "dist/.openai/hosting.json");
await cp("drizzle/0000_studenthub_initial.sql", "dist/.openai/drizzle/0000_studenthub_initial.sql");
console.log("Worker artifact prepared.");
