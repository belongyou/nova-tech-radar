import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { getNews } from './news.ts';

const destination = new URL('../public/data/news.json', import.meta.url);
let previous;
try {
  previous = JSON.parse(await readFile(destination, 'utf8'));
} catch { /* The first deployment can start from the dated editorial snapshot. */ }

const result = await getNews();
const attemptedAt = new Date().toISOString();
let output;
if (result.mode === 'snapshot') {
  // A failed refresh must never change the last successful acquisition time.
  output = previous?.items?.length
    ? { ...previous, sources: result.sources, stale: true, lastAttemptAt: attemptedAt }
    : { ...result, fetchedAt: null, stale: true, lastAttemptAt: attemptedAt };
} else {
  output = { ...result, stale: false, lastAttemptAt: attemptedAt };
}
await mkdir(new URL('../public/data/', import.meta.url), { recursive: true });
await writeFile(destination, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`NOVA: ${output.items.length} articles; ${result.sources.filter((s) => s.status === 'ok').length}/9 sources; ${output.stale ? 'retained previous snapshot' : 'updated'}; acquired ${output.fetchedAt ?? 'editorial snapshot'}`);
