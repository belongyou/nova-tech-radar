import type { NewsCategory, NewsItem } from './seed-news';

export type SourceResult = {
  name: string;
  url: string;
  category: NewsCategory;
  status: 'ok' | 'error';
  count: number;
};

export type NewsResponse = {
  items: NewsItem[];
  sources: SourceResult[];
  updatedAt: string | null;
  fetchedAt: string | null;
  lastAttemptAt?: string;
  stale?: boolean;
  mode: 'live' | 'partial' | 'snapshot';
};
