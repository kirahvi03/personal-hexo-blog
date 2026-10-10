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

## 给札记添加地理位置

在文章的 front-matter 中加入 `location`，主页的 Earth / Signal Map 会自动显示该文章的位置标记。`lat` 是纬度，`lng` 是经度，`label` 是悬停时显示的地点名称：

```yaml
location:
  label: Shanghai / CN
  lat: 31.2304
  lng: 121.4737
```

位置字段同样适用于带图片的文章；文章的 `media_type` 可以继续使用 `image`，地球会显示文章标题、日期和地点。
