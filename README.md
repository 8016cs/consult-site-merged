# 咨询站最简验证流（Workers Static Assets 合并方案）

一个仓库、一个部署、一个域名：静态页面 + Worker 后端同域运行。

## 仓库结构（不要改）

```
consult-site/
├── public/
│   └── index.html      # 前端表单页（静态资源）
├── src/
│   └── index.js        # Worker 后端，只处理 /api/apply
├── wrangler.jsonc      # 同时声明 assets 与 main
├── package.json
├── .gitignore
└── README.md
```

要点：
- `public/` 里的文件直接对外可访问，`/` 对应 `index.html`
- `src/index.js` 只接管 `/api/*`，其余请求走 `env.ASSETS.fetch()`
- `run_worker_first: ["/api/*"]` 保证 API 不会被静态资源拦截

## 部署步骤（Cloudflare 控制台连 GitHub）

1. 把本目录整个推到 GitHub 仓库 `consult-site`
2. Cloudflare 控制台 → Workers & Pages → Create → 连 GitHub → 选该仓库
3. 构建配置（无框架静态 + Worker）：
   - 构建命令：**留空**
   - 部署命令：`npx wrangler deploy`
4. 部署完成后进入项目 → Settings → Variables and Secrets → 添加 Secret：
   - `DINGTALK_WEBHOOK` = 钉钉自定义机器人 Webhook（安全设置选「自定义关键词」，填 `咨询`）
5. 访问 `https://consult-site.你的账号.workers.dev` → 填表提交 → 钉钉群收到卡片

## 本地开发（可选）

```bash
npm install
npx wrangler dev        # http://localhost:8787
# 本地 Secret 放 .dev.vars（已被 gitignore）：DINGTALK_WEBHOOK=xxx
```

## 排错

| 现象 | 原因 |
|---|---|
| 提交报网络错误 | Secret 没配 / Worker 未部署 |
| 钉钉不弹 | Webhook 错、或机器人关键词不是「咨询」 |
| API 返回 index.html | `run_worker_first` 配置缺失 |
| 页面 404 | 文件没放对：`index.html` 必须在 `public/` 下 |

## 安全提醒

Webhook 只在 Worker Secret 里，绝不写进 `public/` 或提交到 GitHub。
