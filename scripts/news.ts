import { seedItems, type NewsCategory, type NewsItem } from "../src/lib/seed-news.ts";

export type FeedSource = {
  name: string;
  url: string;
  category: NewsCategory;
  region: string;
};

export type SourceResult = {
  name: string;
  url: string;
  category: NewsCategory;
  status: "ok" | "error";
  count: number;
};

export type NewsResponse = {
  items: NewsItem[];
  sources: SourceResult[];
  updatedAt: string | null;
  fetchedAt: string;
  mode: "live" | "partial" | "snapshot";
};

export const feedSources: FeedSource[] = [
  { name: "Google DeepMind", url: "https://deepmind.google/blog/rss.xml", category: "ai", region: "欧洲" },
  { name: "NVIDIA", url: "https://blogs.nvidia.com/feed/", category: "chips", region: "北美" },
  { name: "NASA", url: "https://www.nasa.gov/news-release/feed/", category: "space", region: "北美" },
  { name: "NASA Technology", url: "https://www.nasa.gov/technology/feed/", category: "space", region: "北美" },
  { name: "ESA", url: "https://www.esa.int/rssfeed/Our_Activities/Space_News", category: "space", region: "欧洲" },
  { name: "Samsung Newsroom", url: "https://news.samsung.com/global/feed", category: "chips", region: "亚洲" },
  { name: "Nature Biotechnology", url: "https://www.nature.com/nbt.rss", category: "bio", region: "全球" },
  { name: "Nature Energy", url: "https://www.nature.com/nenergy.rss", category: "energy", region: "全球" },
  { name: "MIT News", url: "https://news.mit.edu/rss/topic/artificial-intelligence2", category: "ai", region: "北美" },
];

const CACHE_MS = 10 * 60 * 1000;
const MAX_XML_LENGTH = 2_000_000;
let cache: { value: NewsResponse; expiresAt: number } | undefined;
let inFlight: Promise<NewsResponse> | undefined;

function decodeEntities(value: string): string {
  const entities: Record<string, string> = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
    ndash: "–", mdash: "—", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", hellip: "…",
  };
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (!code.startsWith("#")) return entities[code.toLowerCase()] ?? match;
    const point = code[1]?.toLowerCase() === "x" ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
    return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : "";
  });
}

function plainText(value: string, maxLength: number): string {
  // Decode before stripping, so escaped HTML cannot survive into the response.
  return decodeEntities(decodeEntities(value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")))
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function tagValue(block: string, names: string[]): string {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const tag = name.includes(":") ? escaped : `(?:[\\w.-]+:)?${escaped}`;
    const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}\\s*>`, "i"));
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return "";
}

function safeUrl(value: string): string | null {
  const decoded = decodeEntities(value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim());
  if (decoded.length > 2048 || !/^https?:\/\//i.test(decoded)) return null;
  try {
    const url = new URL(decoded);
    if (!url.hostname || url.username || url.password) return null;
    url.hash = "";
    // Remove tracking parameters to deduplicate articles seen in several feeds.
    [...url.searchParams.keys()].forEach((key) => {
      if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
    });
    return url.toString();
  } catch {
    return null;
  }
}

function articleUrl(block: string): string | null {
  const direct = safeUrl(tagValue(block, ["link"]));
  if (direct) return direct;
  const links = block.match(/<(?:[\w.-]+:)?link\b[^>]*\/?>/gi) ?? [];
  for (const link of links) {
    const rel = link.match(/\brel\s*=\s*(["'])(.*?)\1/i)?.[2]?.toLowerCase();
    if (rel && rel !== "alternate") continue;
    const href = link.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2];
    const url = href ? safeUrl(href) : null;
    if (url) return url;
  }
  return safeUrl(tagValue(block, ["guid", "id"]));
}

function categoryFor(title: string, description: string, fallback: NewsCategory): NewsCategory {
  const text = `${title} ${description}`.toLowerCase();
  if (/robot|robotic|humanoid|autonomous vehicle|physical ai|机器人|人形/.test(text)) return "robotics";
  if (/biotech|genom|protein|peptide|drug discovery|immunotherap|gene edit|cell therap|生物|基因|蛋白/.test(text)) return "bio";
  if (/battery|batteries|solar cell|hydrogen|fusion|renewable|carbon capture|电池|储能|氢能|核聚变/.test(text)) return "energy";
  if (/spacecraft|astronaut|satellite|lunar|artemis|rocket|mars|月球|卫星|航天/.test(text)) return "space";
  if (/semiconductor|chip\b|chips\b|gpu\b|rubin|blackwell|transistor|foundry|芯片|半导体/.test(text)) return "chips";
  if (/artificial intelligence|\bai\b|machine learning|gemini|nemotron|模型|人工智能/.test(text)) return "ai";
  return fallback;
}

function stableId(url: string): string {
  let hash = 2166136261;
  for (let i = 0; i < url.length; i++) hash = Math.imul(hash ^ url.charCodeAt(i), 16777619);
  return `news-${(hash >>> 0).toString(36)}`;
}

/** Parse bounded RSS 2.0, RDF/RSS 1.0 and Atom entries without evaluating XML. */
export function parseFeed(xml: string, source: FeedSource, now = Date.now()): NewsItem[] {
  if (!xml || xml.length > MAX_XML_LENGTH || !/<(?:[\w.-]+:)?(?:rss|feed|RDF)\b/i.test(xml)) return [];
  const blocks = xml.match(/<(?:[\w.-]+:)?(?:item|entry)\b[^>]*>[\s\S]*?<\/(?:[\w.-]+:)?(?:item|entry)\s*>/gi) ?? [];
  const items: NewsItem[] = [];
  const seen = new Set<string>();
  // A pathological source cannot consume unbounded work or response space.
  for (const block of blocks.slice(0, 80)) {
    const title = plainText(tagValue(block, ["title"]), 240);
    const url = articleUrl(block);
    const rawDate = plainText(tagValue(block, ["pubDate", "published", "dc:date", "updated"]), 100);
    const timestamp = Date.parse(rawDate);
    if (!title || !url || seen.has(url) || rawDate.length < 8 || !Number.isFinite(timestamp) || timestamp < 0 || timestamp > now + 24 * 60 * 60 * 1000) continue;
    const summary = plainText(tagValue(block, ["description", "summary", "content:encoded", "content"]), 520);
    seen.add(url);
    items.push({
      id: stableId(url), title, summary, url,
      publishedAt: new Date(timestamp).toISOString(),
      category: categoryFor(title, summary, source.category),
      source: source.name, region: source.region,
    });
  }
  return items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 20);
}

async function readXml(response: Response): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let xml = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return xml + decoder.decode();
      size += value.byteLength;
      if (size > MAX_XML_LENGTH) {
        await reader.cancel();
        throw new Error("Feed is too large");
      }
      xml += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

async function fetchSource(source: FeedSource): Promise<{ status: SourceResult; items: NewsItem[] }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(source.url, {
      headers: { Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9" },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!response.ok) throw new Error(`Feed HTTP ${response.status}`);
    const length = Number(response.headers.get("content-length"));
    if (length > MAX_XML_LENGTH) throw new Error("Feed is too large");
    const items = parseFeed(await readXml(response), source);
    // Empty or blocked HTML is a source failure, never a healthy live feed.
    if (items.length === 0) throw new Error("Feed has no valid dated articles");
    return { status: { name: source.name, url: source.url, category: source.category, status: "ok", count: items.length }, items };
  } catch {
    return { status: { name: source.name, url: source.url, category: source.category, status: "error", count: 0 }, items: [] };
  } finally {
    clearTimeout(timeout);
  }
}

async function refreshNews(): Promise<NewsResponse> {
  const results = await Promise.all(feedSources.map(fetchSource));
  const sources = results.map((result) => result.status);
  const liveItems = results.flatMap((result) => result.items).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const unique = new Map<string, NewsItem>();
  for (const item of liveItems) if (!unique.has(item.url)) unique.set(item.url, item);
  const mode = unique.size === 0 ? "snapshot" : sources.every((source) => source.status === "ok") ? "live" : "partial";
  const items = mode === "snapshot" ? seedItems.map((item) => ({ ...item, isSnapshot: true })) : [...unique.values()].slice(0, 100);
  return {
    items, sources, mode,
    updatedAt: mode === "snapshot" ? null : items[0]?.publishedAt ?? null,
    fetchedAt: new Date().toISOString(),
  };
}

export async function getNews(): Promise<NewsResponse> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;
  if (inFlight) return inFlight;
  inFlight = refreshNews().then((value) => {
    cache = { value, expiresAt: Date.now() + CACHE_MS };
    return value;
  }).finally(() => { inFlight = undefined; });
  return inFlight;
}
