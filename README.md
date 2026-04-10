# 每日道痕

一个简洁、温和、偏东方留白风格的中文日记 Web 应用，用来记录每天的“道痕”。

## 功能列表

- 首页提供 7 个固定自省问题
- 按日期创建和查看记录
- 历史记录列表
- 按日期、标签、正文搜索
- 标签录入与展示
- 使用浏览器 `localStorage` 本地保存
- 导出单篇 Markdown
- 导出全部 JSON
- 适配桌面端与移动端

## 技术栈

- Next.js 15
- TypeScript
- Tailwind CSS
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

第一次运行 E2E 时，如果本机还没有 Playwright 浏览器，可执行：

```bash
npx playwright install chromium
```

## 项目结构

```text
app/              App Router 页面
components/       页面与交互组件
lib/              数据模型、问题定义、localStorage 逻辑
tests/unit/       单元测试
tests/e2e/        端到端测试
```

## 部署建议

适合优先部署到：

- Vercel：最适合 Next.js，部署最省心
- Netlify：可用于静态与 Node 运行场景
- 自托管 Node 环境：适合后续接登录、云同步、数据库

当前项目上线前还差的内容：

- 统一生产环境监控与错误上报
- 更完整的多浏览器回归测试
- 可选的数据备份或云同步方案
- 上线环境的隐私说明与导出/恢复说明

## 当前状态

项目已完成基础 QA、自测、依赖安全修复和自动化测试补齐，适合继续开发和对外演示。
