# 中国大陆访问与微信登录方案

“每日道痕”当前没有后端，默认把记录保存在浏览器 `localStorage`。如果主要用户在中国大陆，推荐把登录与后续同步放到腾讯云开发 CloudBase 上，前端仍保持 Next.js。

## 推荐路线

1. 部署前端到腾讯云 EdgeOne Pages、CloudBase Webify 或国内可访问的静态/Node 托管服务。
2. 在腾讯云开发创建 CloudBase 环境，记录环境 ID。
3. 准备微信登录能力：
   - 网站扫码登录：使用微信开放平台网站应用，scope 使用 `snsapi_login`。
   - 微信内网页：使用微信公众号网页授权，scope 使用 `snsapi_userinfo` 或 `snsapi_base`。
4. 在部署平台配置环境变量：

```bash
NEXT_PUBLIC_CLOUDBASE_ENV_ID=你的 CloudBase 环境 ID
NEXT_PUBLIC_WECHAT_APP_ID=你的微信 AppId
NEXT_PUBLIC_WECHAT_SCOPE=snsapi_login
```

5. 在微信开放平台或公众平台后台配置授权回调域名。域名必须是已备案、可访问的正式域名。

## 当前代码支持什么

- 未配置 CloudBase 时：显示“微信登录尚未配置”，应用保持本地模式。
- 配置 CloudBase 与微信 AppId 后：顶部出现“使用微信登录”，通过 CloudBase Web SDK 唤起微信授权登录。
- 登录完成后：CloudBase SDK 会在浏览器端保存登录态，页面显示已登录用户。
- 当前版本仍优先保证本地记录不变；云端同步建议作为下一步单独实现，避免一次改动过大。

## 后续云同步建议

CloudBase 数据库可建立 `journal_entries` 集合，字段建议保持与本地结构一致：

```ts
{
  user_id: string;
  date: string;
  answers: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

安全规则建议限制用户只能读写自己的记录。上线前不要把任何微信 AppSecret、CloudBase 私钥或服务端密钥放进 `NEXT_PUBLIC_*` 环境变量。

## ICP 与大陆部署注意

- 如果使用中国大陆服务器或 CDN 域名，通常需要 ICP 备案。
- 微信网页授权回调域名必须与微信后台配置一致。
- 如果面向微信内用户，建议优先测试微信内置浏览器。
- 如果希望国外也稳定访问，可以做双部署：国内主站使用腾讯云，海外镜像使用 Vercel/Netlify，统一用自定义域名分流。
