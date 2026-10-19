export type NewsCategory = "ai" | "chips" | "space" | "robotics" | "bio" | "energy";

export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  category: NewsCategory;
  source: string;
  region: string;
  isSnapshot?: boolean;
};

// Editorial snapshots verified on 2026-10-19. These keep their original dates
// and are used only when no live feed can be reached.
export const seedItems: NewsItem[] = [
  {
    id: "snapshot-nvidia-nemotron",
    title: "NVIDIA 扩展 Nemotron 开放模型家族，覆盖云端与本地设备",
    summary: "Super VL 与 Bolt 模型面向不同规模的智能体部署，将开放模型能力从企业服务器延伸到桌面和边缘设备。",
    url: "https://blogs.nvidia.com/blog/nemotron-3-5-super-vl/",
    publishedAt: "2026-10-15T00:00:00.000Z",
    category: "ai",
    source: "NVIDIA",
    region: "北美",
    isSnapshot: true,
  },
  {
    id: "snapshot-deepmind-antimicrobial",
    title: "Google DeepMind 用 AI 工作台加速抗菌肽候选物筛选",
    summary: "研究者使用 Antigravity 串联蛋白质检索、结构分析与文献筛选。发现的候选物仍在接受湿实验验证。",
    url: "https://deepmind.google/blog/accelerating-antimicrobial-discovery/",
    publishedAt: "2026-10-15T00:00:00.000Z",
    category: "ai",
    source: "Google DeepMind",
    region: "欧洲",
    isSnapshot: true,
  },
  {
    id: "snapshot-samsung-wireless",
    title: "三星未来无线峰会聚焦 AI 原生网络与 6G 协作",
    summary: "硅谷峰会汇集通信行业与研究机构，探讨下一代网络、AI 原生技术及通信生态的协同发展。",
    url: "https://news.samsung.com/global/samsung-hosts-silicon-valley-future-wireless-summit-2026",
    publishedAt: "2026-10-15T00:00:00.000Z",
    category: "chips",
    source: "Samsung Newsroom",
    region: "亚洲",
    isSnapshot: true,
  },
  {
    id: "snapshot-nature-structural-variants",
    title: "新方法提升跨测序技术的基因组结构变异检测",
    summary: "Nature Biotechnology 介绍 HitSV 方法，通过建模基因组重复性与信号强度之间的关系，提高结构变异检测表现。",
    url: "https://www.nature.com/articles/s41587-026-03332-9",
    publishedAt: "2026-10-15T00:00:00.000Z",
    category: "bio",
    source: "Nature Biotechnology",
    region: "全球",
    isSnapshot: true,
  },
  {
    id: "snapshot-nasa-moon-battery",
    title: "NASA 研发适应月球极寒环境的固态电池",
    summary: "SPEARS 项目探索在月球南极严苛环境中提供可靠电力，为未来月面设备与持续探测提供储能支持。",
    url: "https://www.nasa.gov/centers-and-facilities/langley/nasa-develops-batteries-to-power-humanitys-return-to-moon/",
    publishedAt: "2026-10-14T00:00:00.000Z",
    category: "space",
    source: "NASA",
    region: "北美",
    isSnapshot: true,
  },
  {
    id: "snapshot-nvidia-simulation",
    title: "NVIDIA 展示用前沿 AI 智能体搭建物理仿真应用",
    summary: "开发者将智能体与 Omniverse 库结合，用自然语言组织仿真资产、物理系统和渲染流程，并由人审核结果。",
    url: "https://blogs.nvidia.com/blog/developers-simulation-frontier-ai-agents/",
    publishedAt: "2026-10-09T00:00:00.000Z",
    category: "robotics",
    source: "NVIDIA",
    region: "北美",
    isSnapshot: true,
  },
  {
    id: "snapshot-esa-sentinel",
    title: "Sentinel-3C 传回首批地球观测图像",
    summary: "欧洲空间局发布 Sentinel-3C 的早期观测成果，展示该任务用于监测地球陆地与海洋的观测能力。",
    url: "https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-3/Sentinel-3C_returns_its_first_views_of_Earth",
    publishedAt: "2026-10-08T00:00:00.000Z",
    category: "space",
    source: "ESA",
    region: "欧洲",
    isSnapshot: true,
  },
  {
    id: "snapshot-mit-data-center",
    title: "MIT 研究用 AI 降低数据中心的能源与环境负担",
    summary: "研究聚焦大型云计算系统的运行方式，探索让持续扩张的数据中心更高效地使用能源。",
    url: "https://news.mit.edu/2026/mitigating-environmental-threat-of-data-centers-christina-delimitrou-1008",
    publishedAt: "2026-10-08T00:00:00.000Z",
    category: "energy",
    source: "MIT News",
    region: "北美",
    isSnapshot: true,
  },
  {
    id: "snapshot-mit-flight-planning",
    title: "MIT 新规划系统帮助飞行机器人保持无碰撞航线",
    summary: "SANDO 方法面向未知、危险环境中的机器人导航，有望帮助灾害响应设备规划更安全的飞行路径。",
    url: "https://news.mit.edu/2026/planning-system-ensures-robots-flight-path-will-remain-collision-free-1007",
    publishedAt: "2026-10-07T00:00:00.000Z",
    category: "robotics",
    source: "MIT News",
    region: "北美",
    isSnapshot: true,
  },
  {
    id: "snapshot-nature-carbon-capture",
    title: "天津大学等团队开发用于碳捕集的新型全有机膜",
    summary: "发表于 Nature Energy 的研究将单晶共价有机框架嵌入聚合物膜，在碳捕集材料的传输性能与稳定性方面取得进展。",
    url: "https://www.nature.com/articles/s41560-026-02149-9",
    publishedAt: "2026-10-07T00:00:00.000Z",
    category: "energy",
    source: "Nature Energy",
    region: "亚洲",
    isSnapshot: true,
  },
];
