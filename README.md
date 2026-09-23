# 个人 Hexo 博客

这是一个不预置文章内容的 Hexo 个人博客基础框架，内置了一个简洁的中文响应式主题。

## 开始使用

先安装 [Node.js](https://nodejs.org/)，然后在本目录执行：

```bash
npm install
npm run server
```

打开 `http://localhost:4000/` 即可预览。

## 修改个人信息

编辑根目录 `_config.yml`，修改 `title`、`subtitle`、`description` 和 `author`；再编辑 `themes/personal/_config.yml` 更新导航和社交链接。

## 发布第一篇文章

```bash
npx hexo new post "文章标题"
npm run server
```

生成静态文件：

```bash
npm run build
```

生成结果位于 `public/` 目录。
