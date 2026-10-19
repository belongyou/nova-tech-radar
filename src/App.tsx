"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowDownWideNarrow, ArrowRight, ArrowUpRight, Bookmark, Bot, Check, Cpu, Dna, Grid2X2, Menu, Orbit, Radio, RefreshCw, Search, ShieldCheck, Sparkles, X, Zap } from "lucide-react";
import { seedItems, type NewsCategory, type NewsItem } from "./lib/seed-news";
import type { NewsResponse, SourceResult } from "./lib/news-types";
import { ArticleVisual, RadarGlobe } from "./components/radar-visuals";

const categories = [
  { id: "ai", label: "人工智能", english: "ARTIFICIAL INTELLIGENCE", Icon: Sparkles, color: "#b3abff" },
  { id: "chips", label: "芯片与计算", english: "CHIPS & COMPUTING", Icon: Cpu, color: "#78aee0" },
  { id: "space", label: "航天探索", english: "SPACE EXPLORATION", Icon: Orbit, color: "#dfb37b" },
  { id: "robotics", label: "机器人", english: "ROBOTICS", Icon: Bot, color: "#70c7bd" },
  { id: "bio", label: "生物科技", english: "BIOTECHNOLOGY", Icon: Dna, color: "#c799d7" },
  { id: "energy", label: "新能源", english: "NEW ENERGY", Icon: Zap, color: "#a8c875" },
] as const;

const sourceDirectory = [
  { name: "Google DeepMind", url: "https://deepmind.google/blog/", category: "ai" },
  { name: "NVIDIA", url: "https://blogs.nvidia.com/", category: "chips" },
  { name: "NASA", url: "https://www.nasa.gov/news/", category: "space" },
  { name: "NASA Technology", url: "https://www.nasa.gov/technology/", category: "space" },
  { name: "ESA", url: "https://www.esa.int/", category: "space" },
  { name: "Samsung Newsroom", url: "https://news.samsung.com/global/", category: "chips" },
  { name: "Nature Biotechnology", url: "https://www.nature.com/nbt/", category: "bio" },
  { name: "Nature Energy", url: "https://www.nature.com/nenergy/", category: "energy" },
  { name: "MIT News", url: "https://news.mit.edu/", category: "ai" },
] as const;

const topics: { category: NewsCategory; title: string; subtitle: string; description: string; tags: string[] }[] = [
  { category: "ai", title: "智能，正在发生", subtitle: "THE INTELLIGENCE SHIFT", description: "从大模型到自主智能体，追踪人工智能的下一次跃迁。", tags: ["大模型", "AI 智能体", "具身智能"] },
  { category: "space", title: "向更远处出发", subtitle: "BEYOND OUR PLANET", description: "月球、深空与新的太空经济，见证人类探索的边界。", tags: ["深空探索", "商业航天", "地球观测"] },
  { category: "energy", title: "为未来充能", subtitle: "POWERING TOMORROW", description: "关注储能与清洁技术，寻找通向可持续未来的突破。", tags: ["新型储能", "清洁能源", "低碳技术"] },
];

const storageKey = "nova-tech-radar-bookmarks-v1";

function categoryInfo(id: NewsCategory) {
  return categories.find((category) => category.id === id) ?? categories[0];
}

function articleDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Shanghai" }).format(new Date(value));
}

function BrandMark() {
  return <svg viewBox="0 0 36 40" fill="none" aria-hidden="true"><path d="M3 33V7l13 17V7h8v26L11 16v17H3Z" fill="currentColor"/><path d="m29 4 3 7-7-3 4-4Z" fill="currentColor"/></svg>;
}

function SectorRadar({ counts }: { counts: number[] }) {
  const max = Math.max(1, ...counts);
  const points = counts.map((count, index) => {
    const angle = (index * 60 - 90) * Math.PI / 180;
    const radius = 22 + count / max * 49;
    return `${110 + Number(Math.cos(angle).toFixed(6)) * radius},${110 + Number(Math.sin(angle).toFixed(6)) * radius}`;
  }).join(" ");
  return <svg viewBox="0 0 220 220" role="img" aria-label="当前资讯在六个科技领域的分布雷达图">
    <defs><radialGradient id="radar-fill"><stop stopColor="#ff7555" stopOpacity=".28"/><stop offset="1" stopColor="#ff7555" stopOpacity=".06"/></radialGradient></defs>
    {[25, 45, 65, 85].map((radius) => <polygon key={radius} points={Array.from({ length: 6 }, (_, index) => { const angle = (index * 60 - 90) * Math.PI / 180; return `${110 + Number(Math.cos(angle).toFixed(6)) * radius},${110 + Number(Math.sin(angle).toFixed(6)) * radius}`; }).join(" ")} fill="none" stroke="#303947" strokeWidth=".7"/>)}
    {categories.map((category, index) => { const angle = (index * 60 - 90) * Math.PI / 180; return <g key={category.id}><line x1="110" y1="110" x2={110 + Number(Math.cos(angle).toFixed(6)) * 85} y2={110 + Number(Math.sin(angle).toFixed(6)) * 85} stroke="#303947" strokeWidth=".7"/><text x={110 + Number(Math.cos(angle).toFixed(6)) * 101} y={113 + Number(Math.sin(angle).toFixed(6)) * 101} textAnchor="middle" fill="#718094" fontSize="8">{["AI", "芯片", "航天", "机器人", "生物", "能源"][index]}</text></g>; })}
    <polygon points={points} fill="url(#radar-fill)" stroke="#ff7555" strokeWidth="1.3"/>
    {points.split(" ").map((point, index) => { const [x, y] = point.split(","); return <circle key={index} cx={x} cy={y} r="2.3" fill="#ff987c"/>; })}
    <circle cx="110" cy="110" r="2" fill="#ff7555"/>
  </svg>;
}

export default function Home() {
  const [items, setItems] = useState<NewsItem[]>(seedItems);
  const [sources, setSources] = useState<SourceResult[]>([]);
  const [mode, setMode] = useState<NewsResponse["mode"]>("snapshot");
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [category, setCategory] = useState<NewsCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [savedOnly, setSavedOnly] = useState(false);
  const [saved, setSaved] = useState<NewsItem[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState("");
  const sourceDialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const fetchController = useRef<AbortController | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  }, []);

  const refresh = useCallback(async () => {
    fetchController.current?.abort();
    const controller = new AbortController();
    fetchController.current = controller;
    setLoading(true);
    try {
      const response = await fetch("./data/news.json", { cache: "no-cache", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(16000)]) });
      if (!response.ok) throw new Error("News unavailable");
      const data: NewsResponse = await response.json();
      if (!Array.isArray(data.items) || !Array.isArray(data.sources) || !["live", "partial", "snapshot"].includes(data.mode)) throw new Error("Invalid news response");
      setItems(data.items);
      setSources(data.sources);
      setMode(data.mode);
      setFetchedAt(data.fetchedAt);
      setStale(Boolean(data.stale) || Boolean(data.fetchedAt && Date.now() - Date.parse(data.fetchedAt) > 18 * 60 * 60 * 1000));
    } catch {
      // Retain the last successful response and its correct origin after a refresh failure.
      if (!controller.signal.aborted) setStale(true);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialFetch = setTimeout(() => void refresh(), 0);
    const interval = setInterval(() => void refresh(), 15 * 60 * 1000);
    return () => { clearTimeout(initialFetch); clearInterval(interval); fetchController.current?.abort(); if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, [refresh]);

  useEffect(() => {
    const storageSync = setTimeout(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      if (Array.isArray(stored)) {
        const valid = stored.filter((item): item is NewsItem => item && typeof item.id === "string" && typeof item.title === "string" && typeof item.summary === "string" && typeof item.source === "string" && typeof item.region === "string" && typeof item.url === "string" && /^https?:\/\//i.test(item.url) && categories.some((entry) => entry.id === item.category) && Number.isFinite(Date.parse(item.publishedAt)));
        setSaved([...new Map(valid.map((item) => [item.url, item])).values()].slice(0, 200));
      }
    } catch { /* Storage restrictions should not prevent reading news. */ }
    setStorageReady(true);
    }, 0);
    return () => clearTimeout(storageSync);
  }, []);

  function changeCategory(value: NewsCategory | "all") { setCategory(value); setVisibleCount(6); }
  function changeQuery(value: string) { setQuery(value); setVisibleCount(6); }
  function changeSort(value: string) { setSort(value); setVisibleCount(6); }

  function toggleSaved(item: NewsItem) {
    if (!storageReady) return;
    const exists = saved.some((entry) => entry.url === item.url);
    const next = exists ? saved.filter((entry) => entry.url !== item.url) : [item, ...saved].slice(0, 200);
    setSaved(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      notify(exists ? "已从收藏中移除" : "已收藏，可在「我的收藏」中查看");
    } catch { notify(exists ? "已移除收藏；浏览器未允许长期保存" : "已暂存收藏；浏览器未允许长期保存"); }
  }

  const counts = useMemo(() => categories.map((entry) => items.filter((item) => item.category === entry.id).length), [items]);
  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return (savedOnly ? saved : items).filter((item) => (category === "all" || item.category === category) && (!text || `${item.title} ${item.summary} ${item.source} ${item.region} ${categoryInfo(item.category).label}`.toLowerCase().includes(text))).sort((a, b) => sort === "oldest" ? a.publishedAt.localeCompare(b.publishedAt) : b.publishedAt.localeCompare(a.publishedAt));
  }, [items, saved, savedOnly, category, query, sort]);

  function goToFeed(nextCategory: NewsCategory | "all" = "all", nextSaved = false) {
    setCategory(nextCategory);
    setSavedOnly(nextSaved);
    setQuery("");
    setVisibleCount(6);
    setMobileOpen(false);
    document.getElementById("latest")?.scrollIntoView({ behavior: "smooth" });
  }

  function focusSearch() {
    document.getElementById("latest")?.scrollIntoView({ behavior: "smooth" });
    searchInput.current?.focus({ preventScroll: true });
    setMobileOpen(false);
  }

  const statusText = loading ? "正在载入全球信号" : stale ? (fetchedAt ? "数据可能过期 · 保留上次内容" : "连接暂不可用 · 编辑快照") : mode === "snapshot" ? "已核验编辑快照" : mode === "partial" ? "已载入部分信源资讯" : "已载入定时资讯";

  return <>
    <header className="site-header">
      <div className="shell header-inner">
        <a className="brand" href="#" aria-label="NOVA 科技雷达首页"><span className="brand-symbol"><BrandMark/></span><span className="brand-name">NOVA<span>全球科技雷达</span></span></a>
        <nav className="desktop-nav" aria-label="主导航">
          <button className={!savedOnly ? "active" : ""} onClick={() => goToFeed()}>全球动态</button>
          <a href="#topics">趋势专题<span>↗</span></a>
          <button onClick={() => sourceDialog.current?.showModal()}>信源网络</button>
        </nav>
        <div className="header-actions">
          <button className="icon-button" aria-label="搜索资讯" onClick={focusSearch}><Search/></button>
          <span className="header-divider" aria-hidden="true"/>
          <button className={`save-header ${savedOnly ? "selected" : ""}`} onClick={() => goToFeed("all", !savedOnly)}><Bookmark/>我的收藏{saved.length > 0 && <em>{saved.length}</em>}</button>
          <button className="icon-button mobile-menu" aria-label={mobileOpen ? "关闭导航" : "打开导航"} aria-expanded={mobileOpen} aria-controls="mobile-nav" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X/> : <Menu/>}</button>
        </div>
      </div>
      {mobileOpen && <nav id="mobile-nav" className="mobile-navigation" aria-label="移动导航"><button onClick={() => goToFeed()}>全球动态</button><a href="#topics" onClick={() => setMobileOpen(false)}>趋势专题 ↗</a><button onClick={() => { sourceDialog.current?.showModal(); setMobileOpen(false); }}>信源网络</button><button onClick={() => goToFeed("all", true)}>我的收藏（{saved.length}）</button></nav>}
    </header>

    <main>
      <section className="shell hero" aria-labelledby="hero-heading">
        <div className="hero-topline"><div className="eyebrow"><span className="short-line"/>SIGNALS FROM THE FUTURE</div><span>INDEPENDENT PERSPECTIVE · GLOBAL COVERAGE</span></div>
        <div className="hero-copy">
          <h1 id="hero-heading">看见科技前沿，<br/>读懂<span>下一个未来</span><span className="heading-period">.</span></h1>
          <p>连接全球创新现场，追踪改变世界的科技信号。<br/>从人工智能到星际探索，让每一次突破触手可及。</p>
          <div className="hero-buttons"><button className="primary-button" onClick={() => goToFeed()}>探索最新动态<ArrowUpRight/></button><a className="secondary-button" href="#topics">发现趋势专题<ArrowRight/></a></div>
          <div className="hero-footnote"><ShieldCheck/>精选全球一手信源 · 尊重事实与原始出处</div>
        </div>
        <div className="hero-visual"><RadarGlobe/><span className="visual-top-label">GLOBAL INNOVATION NETWORK</span><div className="globe-callout callout-ai"><span className="callout-point"/><span>人工智能</span><span>持续演进 ↗</span></div><div className="globe-callout callout-space"><span className="callout-point"/><span>深空探索</span><span>边界之外 ↗</span></div><span className="visual-lower-label">MAPPING THE NEXT BREAKTHROUGH</span><span className="coordinate">31.23° N / 121.47° E</span></div>
      </section>

      <section className="signal-strip" aria-label="关注中的科技主题"><div className="shell signal-inner"><div className="signal-title"><Radio/>前沿信号<small>ON OUR RADAR</small></div><button onClick={() => goToFeed("ai")}><span>01</span>AI 智能体走向真实世界<span>↗</span></button><button onClick={() => goToFeed("chips")}><span>02</span>下一代计算的竞速<span>↗</span></button><button onClick={() => goToFeed("energy")}><span>03</span>寻找能源新答案<span>↗</span></button></div></section>

      <section id="latest" className="shell news-section" aria-labelledby="news-heading">
        <div className="section-heading"><h2 id="news-heading"><span className="heading-square"/>{savedOnly ? "我的收藏" : "最新动态"}<small>{savedOnly ? "SAVED SIGNALS" : "LATEST SIGNALS"}</small></h2><div className="sync-state" role="status"><span className={`status-dot ${mode === "snapshot" || stale ? "muted" : ""}`}/><span>{statusText}</span><button aria-label="刷新资讯" title="重新载入最近一次发布的资讯" disabled={loading} onClick={() => void refresh()}><RefreshCw className={loading ? "spinning" : ""}/></button></div></div>
        <div className="category-bar" role="group" aria-label="按科技领域筛选"><button className={category === "all" ? "selected" : ""} aria-pressed={category === "all"} onClick={() => changeCategory("all")}><Grid2X2/>全部领域</button>{categories.map(({ id, label, Icon }) => <button key={id} className={category === id ? "selected" : ""} aria-pressed={category === id} onClick={() => changeCategory(id)}><Icon/>{label}</button>)}</div>
        <div className="feed-tools"><p className="result-label">{savedOnly ? "已收藏" : "共发现"}<span className="result-count">{filtered.length.toString().padStart(2, "0")}</span>条科技信号{query && ` · 搜索「${query}」`}</p><div className="search-sort"><label className="search-field"><Search/><input ref={searchInput} aria-label="搜索科技资讯" placeholder="搜索感兴趣的科技…" value={query} onChange={(event) => changeQuery(event.target.value)}/>{query && <button aria-label="清空搜索" onClick={() => changeQuery("")}><X size={12}/></button>}</label><label className="sort-field"><ArrowDownWideNarrow/><select aria-label="资讯排序" value={sort} onChange={(event) => changeSort(event.target.value)}><option value="newest">最新发布</option><option value="oldest">最早发布</option></select></label></div></div>
        <div className="feed-layout"><div>
          {filtered.length ? <div className="news-grid">{filtered.slice(0, visibleCount).map((item, index) => <article className="news-card" key={item.id}>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="article-art" style={{ display: "block" }} aria-label={`阅读原文：${item.title}`}><ArticleVisual category={item.category}/><span className="art-index">{categoryInfo(item.category).english} / {String(index + 1).padStart(2, "0")}</span><span className="art-corner"/></a>
            <div className="card-body"><div className="article-meta"><span className={`category-label ${item.category}`}>{categoryInfo(item.category).label}</span><span>{item.region}</span></div><a className="article-title" href={item.url} target="_blank" rel="noopener noreferrer"><h3>{item.title}</h3></a><p>{item.summary || "追踪科技的最新进展。点击标题，前往原始信源了解详情。"}</p><div className="card-footer"><span className="source-name">{item.source}</span><span className="article-date"><time dateTime={item.publishedAt}>{articleDate(item.publishedAt)}</time>{item.isSnapshot && <em>快照</em>}</span><button className={`bookmark-button ${saved.some((entry) => entry.url === item.url) ? "is-saved" : ""}`} aria-label={`${saved.some((entry) => entry.url === item.url) ? "取消收藏" : "收藏"}：${item.title}`} aria-pressed={saved.some((entry) => entry.url === item.url)} disabled={!storageReady} onClick={() => toggleSaved(item)}><Bookmark/></button></div></div>
          </article>)}</div> : <div className="empty-state">{savedOnly ? <Bookmark/> : <Search/>}<h3>{savedOnly && !saved.length ? "收藏你的下一个灵感" : "暂未发现匹配的科技信号"}</h3><p>{savedOnly && !saved.length ? "点击文章右下角的书签，即可把它保存在这里。" : "试试其他关键词，或切换到全部领域。"}</p><button className="secondary-button" onClick={() => goToFeed()}>浏览全部动态<ArrowRight/></button></div>}
          {filtered.length > visibleCount && <button className="load-more" onClick={() => setVisibleCount((count) => count + 6)}>加载更多动态<ArrowDown/></button>}
          <p className="feed-note">{savedOnly ? "收藏保存在当前浏览器中，随时回来继续探索。" : mode === "snapshot" ? "当前展示经核验的编辑快照，保留原始发布日期；定时抓取成功后更新。" : `资讯按原始发布日期排序 · 每 6 小时定时发布${fetchedAt ? ` · 最近获取 ${articleDate(fetchedAt)} ${new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Shanghai" }).format(new Date(fetchedAt))}（北京时间）` : ""}`}</p>
        </div><aside className="radar-sidebar" aria-label="科技领域分布"><div className="sidebar-top"><h3>科技雷达</h3><span>SECTOR MAP</span></div><p className="sidebar-intro">六大前沿领域，连接创新的每一个方向。</p><div className="mini-radar"><SectorRadar counts={counts}/></div><div className="radar-caption"><span/>当前资讯的领域分布</div><div className="sector-list">{categories.map((entry, index) => <button key={entry.id} onClick={() => goToFeed(entry.id)}><span><i style={{ background: entry.color }}/>{entry.label}</span><span>{String(counts[index]).padStart(2, "0")} ↗</span></button>)}</div><div className="sidebar-editorial"><span className="tiny-cross">＋</span><p>未来从不突然到来。<br/>它藏在今天值得关注的信号里。</p><span>STAY CURIOUS. LOOK FORWARD.</span></div></aside></div>
      </section>

      <section id="topics" className="shell topics-section" aria-labelledby="topics-heading"><div className="section-heading"><h2 id="topics-heading"><span className="heading-square"/>趋势专题<small>THE BIG PICTURE</small></h2><span className="section-aside">把信号连成未来<ArrowUpRight/></span></div><div className="topic-grid">{topics.map((topic, index) => <button key={topic.category} className={`topic-card topic-${topic.category}`} onClick={() => goToFeed(topic.category)} aria-label={`查看专题：${topic.title}`}><div className="topic-top"><span>FIELD NOTES / 0{index + 1}</span><ArrowUpRight/></div><div className="topic-art"><ArticleVisual category={topic.category}/></div><div className="topic-content"><span>{topic.subtitle}</span><h3>{topic.title}</h3><p>{topic.description}</p><div className="topic-tags">{topic.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div></button>)}</div></section>

      <div className="shell"><section className="manifesto"><span className="manifesto-mark">✳</span><div><h3>保持好奇，始终走在变化之前。</h3><p>NOVA 汇集全球一手科技信源，让重要的创新拥有清晰的坐标。</p></div><button onClick={() => sourceDialog.current?.showModal()}>了解我们的信源<ArrowUpRight/></button></section><footer className="site-footer"><div className="footer-brand"><span>NOVA</span><span>全球科技雷达 · 看见下一个未来</span></div><div className="footer-end"><span>© 2026 NOVA</span><button onClick={() => sourceDialog.current?.showModal()}>信源与说明</button><a href="#">返回顶部 ↑</a></div></footer></div>
    </main>

    <dialog ref={sourceDialog} className="source-dialog" aria-labelledby="sources-heading" onClick={(event) => { if (event.target === event.currentTarget) sourceDialog.current?.close(); }}><div className="dialog-header"><h2 id="sources-heading">连接全球创新现场</h2><button aria-label="关闭信源说明" onClick={() => sourceDialog.current?.close()}><X/></button></div><p className="source-explanation">从科研机构、科技企业与学术期刊的一手发布中捕捉新进展。每条资讯都附有原始出处，点击文章即可阅读完整内容。</p><div className="sources-list">{sourceDirectory.map((source, index) => { const state = sources.find((entry) => entry.name === source.name); return <a key={source.name} href={source.url} target="_blank" rel="noopener noreferrer"><span className="source-number">{String(index + 1).padStart(2, "0")}</span><div><strong>{source.name}</strong><p>{categoryInfo(source.category).label} · 官方发布</p></div><span className="source-state">{loading ? "同步中" : state?.status === "ok" ? `${state.count} 条资讯` : state?.status === "error" ? "暂不可用" : "未连接"}</span><ArrowUpRight/></a>; })}</div><p className="source-legal">{fetchedAt && <>最近获取：{new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(new Date(fetchedAt))}（北京时间）。<br/></>}本站由 GitHub Actions 每 6 小时尝试抓取并发布一次资讯，可能因排队而延迟；页面每 15 分钟检查已发布的静态数据，刷新按钮重新读取最近一次发布。部分信源不可用时展示已取得的内容；全部不可用时保留上次数据或标注日期的编辑快照。超过 18 小时未更新会提示可能过期。资讯保留原文语言，分类由关键词辅助整理，可能存在偏差。收藏仅保存在当前浏览器。文章及相关权利归原始发布方所有。</p></dialog>
    {toast && <div className="toast" role="status"><Check/>{toast}</div>}
  </>;
}

