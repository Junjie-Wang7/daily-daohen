# CloudBase 云托管部署

当前项目是 Next.js App Router 应用，包含 `/records/[date]` 动态路由。建议部署到 CloudBase 云托管，而不是静态网站托管。

你的环境 ID 目前推断为：

```bash
dailydaohen-d8gt2sbf061f0d5a
```

## 方式一：控制台上传部署

1. 进入 CloudBase 控制台。
2. 左侧选择「云托管 / 云开发云托管」。
3. 新建服务，服务名建议：

```bash
daily-daohen
```

4. 部署方式选择「本地代码」或「上传代码包」。
5. 上传当前项目目录。
6. 端口填写：

```bash
3000
```

7. 运行环境建议选择 Node.js 20。
8. 环境变量按需填写：

```bash
NEXT_PUBLIC_CLOUDBASE_ENV_ID=dailydaohen-d8gt2sbf061f0d5a
NEXT_PUBLIC_WECHAT_APP_ID=
NEXT_PUBLIC_WECHAT_SCOPE=snsapi_login
```

微信 AppId 为空时，网站仍会以本地模式运行。

## 方式二：CLI 部署

在项目目录执行：

```bash
npm run deploy:cloudbase
```

CLI 会提示登录腾讯云、选择环境和服务。环境选择：

```bash
dailydaohen-d8gt2sbf061f0d5a
```

服务名建议：

```bash
daily-daohen
```

## 本地验证命令

```bash
npm install
npm run build
npm test
```

## 注意事项

- CloudBase 的「HTTP 访问服务」默认域名可以用于访问云函数/云托管服务，但它不是微信登录的正式回调域名。
- 若要微信网页登录，需要微信开放平台网站应用 AppId，并配置授权回调域名。
- 若域名部署在中国大陆，通常需要 ICP 备案。
- 当前版本仍以浏览器 `localStorage` 为主，登录只是为下一步云同步做准备。
