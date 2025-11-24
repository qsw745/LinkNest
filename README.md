# LinkNest （链巢）

一套可运行的在线书签中心，包含前端（Vue3）、后端（Express + MySQL + Knex）以及 Chrome 扩展（MV3）。

## 目录结构

- `apps/web`：Vue3 + Vite + Pinia + Ant Design Vue 前端
- `apps/api`：Node.js + Express + Knex + JWT 的 API
- `apps/extension`：Chrome 扩展（Manifest v3，后台监听书签）
- `pnpm-workspace.yaml` / `package.json`：工作区配置，使用 Yarn workspaces

## 快速开始

1) 安装依赖（已配置 yarn workspaces）：

```bash
yarn install
```

2) 配置 API 环境变量（复制模板）：

```bash
cp apps/api/.env.example apps/api/.env
# 按需修改 DB_HOST/DB_USER/DB_PASSWORD/DB_NAME/JWT_SECRET
```

3) 初始化数据库（在 MySQL 中提前创建好 `DB_NAME` 数据库）：

```bash
yarn workspace @linknest/api migrate
```

4) 启动服务：

```bash
# 启动后端（默认 http://localhost:4000）
yarn dev:api

# 启动前端（默认 http://localhost:5173，已代理 /api 到 4000）
yarn dev:web
```

## 前端功能（apps/web）

- 登录 / 注册（成功后自动保存 JWT 到 localStorage）
- 书签列表：分页、按标题/URL 搜索
- 手动新增书签（弹窗），删除书签
- “请安装扩展以自动同步”提示栏
- 技术栈：Vue3 + TypeScript + Pinia + Vue Router + Ant Design Vue
- 配置：`VITE_API_BASE_URL`（默认 `http://localhost:4000/api`，见 `apps/web/env.d.ts`）

## 后端 API（apps/api）

- Auth
  - `POST /api/auth/register`（email, password）注册并返回 `{ token, user }`
  - `POST /api/auth/login`（email, password）登录并返回 `{ token, user }`
- Bookmarks（需 Bearer Token）
  - `GET /api/bookmarks`：列表 + 搜索（q），分页（page, pageSize）
  - `POST /api/bookmarks`：手动新增
  - `PUT /api/bookmarks/:id`：更新
  - `DELETE /api/bookmarks/:id`：软删除（deleted = 1）
  - `POST /api/bookmarks/sync`：扩展同步入口，事件 `created|changed|removed`
- 迁移脚本：`apps/api/src/migrations/*`（users / bookmarks，含索引 & 软删除）
- 本地脚本：
  - `yarn workspace @linknest/api dev` 启动 API
  - `yarn workspace @linknest/api migrate` 迁移
  - 环境变量：见 `apps/api/.env.example`

## Chrome 扩展（apps/extension）

- `manifest.json`：MV3，权限 `bookmarks`/`storage`，后台 `background.js`，`options_page`
- `background.js`：监听 `onCreated/onChanged/onRemoved`，携带 token 调 `POST /api/bookmarks/sync`
- `options.html + options.js`：
  - 输入 API 地址（默认已有） + email + password，调用 `/api/auth/login` 保存 token
  - “🔄 全量同步”按钮：`chrome.bookmarks.getTree` 遍历所有叶子节点，逐条 `event=created` 上传
- 开发安装：Chrome 扩展管理页 → 打开开发者模式 → “加载已解压的扩展程序” → 选择 `apps/extension`
- 面向普通用户分发：修改 `apps/extension/manifest.json` 的 `host_permissions` 为你的 API 域名，重新打包 zip；或上传到 Chrome 应用商店。

## 路由与同步逻辑（核心实现）

- 所有书签接口都走 JWT 校验（中间件 `apps/api/src/middlewares/auth.ts`）
- `/api/bookmarks/sync` 逻辑：
  - `created`：按 `user_id + browser_bookmark_id` 去重，不存在则插入
  - `changed`：按 `user_id + browser_bookmark_id` 更新 title/url
  - `removed`：软删除（deleted = 1）
- 分页 & 搜索：`GET /api/bookmarks` 支持 `q`（title/url like）+ `page/pageSize`

## 其他说明

- Node 版本：`^20.19.0 || >=22.12.0`
- 常用脚本（根目录）：
  - `yarn dev:api` / `yarn dev:web`
  - `yarn workspace @linknest/api build` / `yarn workspace @linknest/web build`
- 若需修改 API 端口，更新 `apps/api/.env` 的 `PORT`，前端通过 `VITE_API_BASE_URL` 指向新地址。

验收提示：浏览器创建书签 2 秒内应出现在前端（扩展事件 → API `/api/bookmarks/sync` → 列表刷新）；删除/修改同理；列表支持搜索 & 分页，可支撑 10 万条（数据库索引 + 分页查询）。
