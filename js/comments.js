/*!
 * comments.js — 札记评论框（Waline）
 *
 * 昵称与邮箱必填：由 themes/personal/_config.yml 里的
 *   waline.requiredMeta: [nick, mail]
 * 控制，邮箱只用于接收回复通知，不会公开显示。
 *
 * 这个文件由 layout.ejs 自动加载，不需要手动引用。
 */
(function () {
  'use strict';

  function readThemeConfig() {
    try { return (window.__DSH_THEME__ && window.__DSH_THEME__.waline) || {}; } catch (error) { return {}; }
  }

  var themeWaline = readThemeConfig();
  var body = document.body;
  var mount = document.querySelector('[data-waline-comments]');
  var mountPoint = document.getElementById('waline');

  if (!mount || !mountPoint) return;

  /* serverURL 由 layout.ejs 写在 body 的 data 属性上 */
  var serverURL = (themeWaline.serverURL || body.getAttribute('data-waline-server') || '').trim().replace(/\/+$/, '');
  var cdn = String(themeWaline.cdn || body.getAttribute('data-waline-cdn') || 'https://cdn.jsdelivr.net/npm/@waline/client@v3/dist/').replace(/\/?$/, '/');
  var path = (themeWaline.path || body.getAttribute('data-waline-path') || window.location.pathname);

  /* 没配置服务端地址就不加载，页面上已经显示了配置提示 */
  if (!serverURL) return;

  function setStatus(text) {
    mount.setAttribute('data-waline-status', text);
  }

  function pickWalineConfig(mod) {
    var source = (mod && (mod.default || mod)) || {};
    return (source.waline && typeof source.waline === 'object') ? source.waline : (themeWaline || {});
  }

  function buildOptions(Waline) {
    var config = pickWalineConfig(Waline);
    var options = {
      el: '#waline',
      serverURL: config.serverURL || serverURL,
      path: path,
      lang: config.lang || 'zh-CN',
      dark: config.dark || 'html[data-theme="dark"]',
      /* 评论前必须先填写昵称和邮箱 */
      meta: ['nick', 'mail', 'link'],
      requiredMeta: config.requiredMeta || ['nick', 'mail'],
      login: config.login || 'disable',
      commentSorting: config.commentSorting || 'latest',
      pageSize: config.pageSize || 10,
      /* 由 pageview.js 单独负责浏览量统计，避免同一个页面重复计数 */
      pageview: false,
      search: false,
      imageUploader: false,
      emoji: config.emoji || ['https://unpkg.com/@waline/emojis@1.1.0/weibo', 'https://unpkg.com/@waline/emojis@1.1.0/bilibili']
    };
    if (config.recaptchaV3Key) options.recaptchaV3Key = config.recaptchaV3Key;
    if (config.turnstileKey) options.turnstileKey = config.turnstileKey;
    return options;
  }

  function loadWaline(urls, index) {
    return import(/* webpackIgnore: true */ urls[index] + 'waline.js').catch(function (error) {
      if (index + 1 < urls.length) return loadWaline(urls, index + 1);
      throw error;
    });
  }

  function boot() {
    setStatus('loading');
    var cdnUrls = [cdn];
    if (cdn !== 'https://cdn.jsdelivr.net/npm/@waline/client@v3/dist/') cdnUrls.push('https://cdn.jsdelivr.net/npm/@waline/client@v3/dist/');
    if (cdn !== 'https://unpkg.com/@waline/client@v3/dist/') cdnUrls.push('https://unpkg.com/@waline/client@v3/dist/');
    loadWaline(cdnUrls, 0)
      .then(function (mod) {
        var Waline = (mod && (mod.default || mod)) || {};
        if (typeof Waline.init !== 'function') throw new Error('Waline init() not found');
        window.__walineInstance = Waline.init(buildOptions(Waline));
        setStatus('ready');
      })
      .catch(function (error) {
        setStatus('error');
        mountPoint.innerHTML = '<p class="waline-error">评论加载失败：' + String(error && error.message ? error.message : error) + '<br>请检查 waline.serverURL 与网络（CDN）是否可用。</p>';
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
