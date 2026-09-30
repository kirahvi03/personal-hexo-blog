/*!
 * pageview.js — 浏览量统计（Waline pageview 模块，gzip 后 < 1KB）
 *
 * 页面里所有 <span class="waline-pageview-count" data-path="/文章路径/"> 都会被自动填充，
 * 每次打开文章页都会 +1，所以数字是实时更新的。
 *
 * 这个文件由 layout.ejs 自动加载，不需要手动引用。
 */
(function () {
  'use strict';

  var seen = {};
  var body = document.body;
  var serverURL = (body.getAttribute('data-waline-server') || '').trim().replace(/\/+$/, '');
  var cdn = String(body.getAttribute('data-waline-cdn') || 'https://unpkg.com/@waline/client@v3/dist/').replace(/\/?$/, '/');

  /* 没配置服务端地址就跳过 */
  if (!serverURL) return;

  function currentPagePath() {
    var path = body.getAttribute('data-waline-path') || window.location.pathname;
    return path.replace(/\/+$/, '') || '/';
  }

  function markFailed() {
    var nodes = document.querySelectorAll('.waline-pageview-count');
    Array.prototype.forEach.call(nodes, function (node) {
      if (node.textContent === '—') node.textContent = '?';
    });
  }

  function boot() {
    import(/* webpackIgnore: true */ cdn + 'pageview.js')
      .then(function (mod) {
        var pageviewCount = (mod && (mod.default && mod.default.pageviewCount)) || (mod && mod.pageviewCount);
        if (typeof pageviewCount !== 'function') throw new Error('Waline pageviewCount() not found');

        function run(path) {
          if (!path) return;
          var key = String(path);
          if (seen[key]) return;
          seen[key] = true;
          try {
            pageviewCount({ serverURL: serverURL, path: key, update: true });
          } catch (error) {
            delete seen[key];
          }
        }

        /* 1) 文章页 / 首页 / 札记目录里写在 HTML 里的 data-path */
        var nodes = document.querySelectorAll('.waline-pageview-count');
        Array.prototype.forEach.call(nodes, function (node) {
          run(node.getAttribute('data-path') || currentPagePath());
        });

        /* 2) 运行时新增的节点（静态站点用不到，留着以防以后加动态列表） */
        if (window.MutationObserver) {
          new MutationObserver(function (records) {
            records.forEach(function (record) {
              Array.prototype.forEach.call(record.addedNodes, function (node) {
                if (!node || node.nodeType !== 1) return;
                if (node.classList && node.classList.contains('waline-pageview-count')) run(node.getAttribute('data-path') || currentPagePath());
                if (node.querySelectorAll) {
                  Array.prototype.forEach.call(node.querySelectorAll('.waline-pageview-count'), function (child) {
                    run(child.getAttribute('data-path') || currentPagePath());
                  });
                }
              });
            });
          }).observe(document.body, { childList: true, subtree: true });
        }
      })
      .catch(markFailed);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
