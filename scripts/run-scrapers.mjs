import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { adapters, pendingSources } from "./scrapers/registry.mjs";

const results = [];
const failures = [];

for (const adapter of adapters) {
  try {
    const response = await fetch(adapter.url, { headers: { "user-agent": "FJUT-EI-Careers/1.0 (+public student project)" }, signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    results.push(...adapter.parse(await response.text()));
  } catch (error) {
    failures.push({ source: adapter.name, message: error instanceof Error ? error.message : String(error) });
  }
}

if (results.length) {
  const directory = resolve("data", "candidates");
  await mkdir(directory, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  await writeFile(resolve(directory, `scrape-${stamp}.json`), `${JSON.stringify(results, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify({ candidates: results.length, failures, pendingSources }, null, 2));
