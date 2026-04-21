# 每日道痕

一个安静、克制、偏东方留白风格的中文日记 Web 应用，用来记录每天的“道痕”。

“道痕”不是流水账，也不只是情绪。它是事情经过你之后，在你心里留下的痕。每天把它捞出来一点，是为了慢慢看见自己。

## 功能列表

- 首页提供 7 个固定自省问题
- 自动草稿保存
- 按日期创建和查看记录
- 历史记录、搜索、标签
- 月历视图与日期轻预览
- 回顾页、关键词、标签和主石头筛选
- 深色模式
- 浏览器 `localStorage` 本地保存
- 保存本篇为文稿、备份全部记录
- 恢复备份、覆盖、合并、清空、撤销
- 可选 CloudBase 微信登录入口

## 登录与同步

登录是可选能力。未配置 CloudBase 时，应用仍完整保留本地模式，记录默认只保存在当前浏览器。

如需为中国大陆用户接入微信登录，请参考：

- [中国大陆访问与微信登录方案](./docs/china-cloudbase-wechat.md)
- [CloudBase 云托管部署](./docs/cloudbase-deploy.md)

## 技术栈

- Next.js 15
- TypeScript
- Tailwind CSS
- CloudBase Web SDK
- Vitest
- Playwright

## 本地运行

```bash
npm install
npm run dev
```

默认访问：

```bash
http://localhost:3000
```

## 环境变量

复制 `.env.example` 为 `.env.local`，按需填写：

```bash
NEXT_PUBLIC_CLOUDBASE_ENV_ID=
NEXT_PUBLIC_WECHAT_APP_ID=
NEXT_PUBLIC_WECHAT_SCOPE=snsapi_login
```

留空时会保持本地模式。

## 构建命令

```bash
npm run build
npm run start
```

## 测试命令

```bash
npm run test:unit
npm run test:e2e
npm test
```

首次运行 E2E 时，如果本机还没有 Playwright 浏览器，可执行：

```bash
npx playwright install chromium
```

## CloudBase 部署

当前项目推荐部署到 CloudBase 云托管，端口为 `3000`。本项目已包含 `Dockerfile` 与 `standalone` 构建配置。

```bash
npm run deploy:cloudbase
```
