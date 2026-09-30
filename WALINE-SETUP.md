# 评论 + 浏览量（Waline）部署说明

这个博客是 Hexo + GitHub Pages 纯静态站，本身没有数据库，所以「浏览量」和「评论」
必须依赖一个外部服务来存数据。这里用的是 **Waline**：一个免费开源的服务，
自己在 Vercel 上部署一份，就能同时提供**浏览量统计**和**评论系统**。

代码已经全部改好了，你只需要做两件事：**① 部署 Waline 服务端；② 把地址填进配置。**

---

## 第一步：部署 Waline 服务端（约 5 分钟，免费）

1. 打开 https://waline.js.org/guide/deploy/vercel.html
2. 点击页面里的 **Deploy with Vercel** 按钮（模板地址
   `https://github.com/walinejs/waline/tree/main/example`）。
3. 用 **GitHub 账号登录 Vercel**，输入一个项目名（例如 `ssy-blog-comment`），点 `Create`。
4. 等部署完成（满屏烟花）。点 `Go to Dashboard`。
5. **创建数据库**：左侧 `Storage` → `Create Database` → 在
   `Marketplace Database Providers` 里选 **Neon** → `Continue` → 接受并创建 Neon 账号
   → 套餐和地区保持默认 → `Continue` → 数据库名不用改 → `Create`。
6. 数据库创建好后，点 **`Connect`** → **`Connect Project`**，把它连接到刚才的 Waline 项目。
7. 回到 Neon（点 `Open in Neon`），左侧 `SQL Editor`，把
   https://github.com/walinejs/waline/blob/main/assets/waline.pgsql
   里的 SQL 全部粘贴进去，点 `Run` 执行建表。
8. 回到 Vercel → 左侧 `Deployments` → 选中最新一次部署 → 右上角 **`Redeploy`**
   重新部署一次（让数据库配置生效）。
9. 等 1～2 分钟状态变成 `Ready`，点 **`Visit`**。打开的网址就是你的**服务端地址**，
   形如 `https://ssy-blog-comment.vercel.app`。

> ⚠️ 部署完请**尽快**访问 `你的服务端地址/ui/register` 注册一个账号，
> **第一个注册的人会自动成为管理员**，以后用它登录 `你的服务端地址/ui` 就能管理评论。

---

## 第二步：把服务端地址填进主题配置

打开 `themes/personal/_config.yml`，把 `waline.serverURL` 填上第一步拿到的地址
（**结尾不要带 `/`**）：

```yaml
waline:
  serverURL: 'https://ssy-blog-comment.vercel.app'
```

**保存后浏览量和评论就同时生效了。** 没填之前，札记页会显示一句配置提示，不会报错。

同一份配置里顺便改一下：

```yaml
social:
  GitHub: https://github.com/你的用户名     # 页脚 GitHub 链接
  邮箱: mailto:你的邮箱@example.com         # 页脚邮箱链接

follow:                                     # 顶部导航栏 Follow 按钮
  label: Follow
  url: https://github.com/你的用户名
```

---

## 第三步：发布

```bash
npm run clean     # 清理旧产物
npm run generate  # 生成静态文件
git add -A
git commit -m "add pageview, comments and follow link"
git push
```

推送到 `main` 后，`.github/workflows/pages.yml` 会自动构建并发布到 GitHub Pages。

本地预览可以用：

```bash
npm run server
```

> 注意：本地用 `hexo server` 预览时，浏览量和评论同样会连到线上 Waline 服务，
> 所以本地刷新也会让浏览量 +1。如果不想这样，可以先不填 `serverURL` 预览样式。

---

# 各功能对应的文件位置（备份 / 回滚参考）

| 功能 | 文件 | 说明 |
| --- | --- | --- |
| 浏览量 | `source/js/pageview.js` | **新增**，Waline pageview 模块，负责把数字填进页面 |
| 浏览量 | `themes/personal/layout/post.ejs` | 文章页标题下方的「浏览 N 次」 |
| 浏览量 | `themes/personal/layout/index.ejs` | 首页文章卡片上的浏览量 |
| 浏览量 | `themes/personal/layout/library.ejs` | 札记目录列表里的浏览量 |
| 评论 | `themes/personal/layout/_partial/comments.ejs` | **新增**，评论区容器 |
| 评论 | `source/js/comments.js` | **新增**，初始化 Waline（昵称 + 邮箱必填） |
| 评论 | `themes/personal/layout/post.ejs` | 在札记正文后插入评论区 |
| Follow | `themes/personal/_config.yml` | `follow.url` 配置 GitHub 主页地址 |
| Follow | `themes/personal/layout/layout.ejs` | 顶部导航 Follow 按钮 + 页脚链接 |
| 样式 | `themes/personal/source/css/main.css` | 文件末尾新增的样式块 |

## 几个可调项

- **评论显示在哪些文章**：默认只显示在 `categories: notes` 的札记上。
  如果想让某篇札记单独关闭评论，在它的 front-matter 里加一行 `comments: false`。
- **必填项**：`themes/personal/_config.yml` 里的
  `waline.requiredMeta: [nick, mail]` 就是「必须填昵称和邮箱」。
  邮箱只用于接收回复通知，不会公开显示。
- **CDN 慢**：国内访问 unpkg 慢的话，把 `waline.cdn` 换成
  `https://cdn.jsdelivr.net/npm/@waline/client@v3/dist/`
  （把 `waline.css` 和脚本一并换掉，配置里改一处即可）。
- **评论迁移**：数据都在 Neon 里，换域名不影响；换了博客域名后
  `path` 会变（Waline 用 URL 路径区分文章），旧评论需要到 `/ui` 后台改路径。
