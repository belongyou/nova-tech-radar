# NOVA 全球科技雷达

深色未来科技风的中文资讯网站，覆盖人工智能、芯片与计算、航天探索、机器人、生物科技和新能源。支持领域筛选、关键词搜索、日期排序、浏览器本地收藏、趋势专题和手机布局。

## 本地运行

安装 Node.js 24 或更新版本，然后运行：

```sh
npm install
npm run update-news
npm run dev
```

生产构建使用 `npm run build`，结果位于 `dist/`。可运行 `npm run preview` 查看静态构建。

## GitHub Pages 发布

将代码推送到 GitHub 仓库的 `main` 分支，在仓库 **Settings → Pages → Build and deployment** 中选择 **GitHub Actions**。内置工作流会构建并部署网站。也可在 **Actions → Update news and deploy GitHub Pages → Run workflow** 手动发布。

Vite 使用相对资源路径，因此支持 `https://用户名.github.io/仓库名/` 以及自定义域名。无需数据库、服务器、API 密钥或客户端跨域代理。

## 新闻更新与来源

GitHub Actions 每 6 小时尝试抓取一次新闻并重新部署（UTC 00:17、06:17、12:17、18:17；北京时间 08:17、14:17、20:17、次日 02:17）。定时任务可能排队延迟；GitHub 也可能因仓库长期无活动暂停计划任务。浏览器每 15 分钟检查已发布的静态 JSON，刷新按钮重新读取最近一次构建的数据，不会直接抓取 RSS。

抓取的 9 个一手信源为 Google DeepMind、NVIDIA、NASA、NASA Technology、ESA、Samsung Newsroom、Nature Biotechnology、Nature Energy、MIT News。文章保留原文语言、原始日期及原文链接；分类由关键词辅助判断，可能存在偏差。

每次部署保留成功获取时间。部分信源不可用时显示已取得的内容和各信源状态；全部失败时通过工作流缓存保留上次内容，不伪造更新时间。首次无法获取时使用明确标注的编辑快照。数据超过 18 小时未成功更新时，页面提示数据可能过期。收藏仅保存在当前浏览器，不会上传到 GitHub。

文章版权及相关权利归原始发布方所有，网站展示摘要并链接回原文。
