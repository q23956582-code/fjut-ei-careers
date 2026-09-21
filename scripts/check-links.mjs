import { readFile } from "node:fs/promises";

const events = JSON.parse(await readFile(new URL("../src/events.json", import.meta.url), "utf8"));
const urls = [...new Set(events.flatMap((event) => [event.applicationUrl, event.sourceUrl]))];
const invalid = [];

for (const value of urls) {
  let url;
  try {
    url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("unsupported protocol");
  } catch (error) {
    invalid.push({ url: value, error: error instanceof Error ? error.message : String(error) });
    continue;
  }
  if (process.env.LIVE_LINK_CHECK !== "true") continue;
  try {
    const response = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(15_000) });
    if (response.status >= 400 && response.status !== 405) invalid.push({ url: value, error: `HTTP ${response.status}` });
  } catch (error) {
    invalid.push({ url: value, error: error instanceof Error ? error.message : String(error) });
  }
}

console.log(JSON.stringify({ checked: urls.length, live: process.env.LIVE_LINK_CHECK === "true", invalid }, null, 2));
if (invalid.length) process.exitCode = 1;
