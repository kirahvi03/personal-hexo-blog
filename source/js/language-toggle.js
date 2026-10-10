(function () {
  'use strict';
  var key = 'ssy-language';
  var root = document.documentElement;
  var toggles = document.querySelectorAll('[data-language-toggle]');
  var translations = {
    'Index': '首页', '首页': 'Index', 'About': '关于', '关于': 'About', 'Search': '搜索', '搜索': 'Search',
    '札记': 'Notes', '图片库': 'Gallery', '音频库': 'Audio', '模型库': 'Models', '关闭菜单': 'Close menu',
    'CHANNELS': '频道', 'INDEX SIGNAL': '索引信号', 'DIRECTORY / 01': '目录 / 01', 'PERSONAL SYSTEM': '个人系统',
    'LOAD': '负载', 'SIGNAL archive': '信号档案', 'MONITOR // 01': '显示器 // 01', 'REC': '录制',
    'Dark': '深色', '深色': 'Dark', 'Light': '浅色', '浅色': 'Light', 'Follow': '关注', '关注': 'Follow',
    'Main navigation': '主导航', 'Interactive archive globe': '可交互的档案地球仪', 'HOLD + DRAG TO ROTATE': '按住并拖动旋转',
    'ORBITAL INDEX': '轨道索引', 'EARTH / SIGNAL MAP': '地球 / 信号地图', 'FIELD SIGNALS': '现场信号',
    'HOVER TO INSPECT': '悬停查看', 'Latest transmissions': '最新记录', 'posts': '篇文章',
    'VISITOR: LOCATING…': '访客：定位中…', 'VISITOR: UNAVAILABLE': '访客：不可用',
    'Visitor location is approximate and derived from IP. No raw IP is stored here.': '访客位置为基于 IP 的粗略估计。此处不会保存原始 IP。',
    'NO LOCATION DATA': '暂无位置数据', 'Add location to a post front-matter': '请在文章 front-matter 中添加位置',
    'No mapped signals yet.': '暂无已映射信号', 'No articles in this channel yet.': '此频道暂无文章',
    'CHANNEL 01': '频道 01', 'INDEX / NOTES': '索引 / 札记', 'PERSONAL ARCHIVE / NOTES': '个人档案 / 札记',
    'ARCHIVE DESK': '档案工作台', 'SAVED ITEMS': '已保存项目', 'READY': '就绪', 'PLAYLIST': '播放列表',
    'CLEAR': '清空', '+ IMPORT AUDIO': '+ 导入音频', '+ IMPORT PHOTOS': '+ 导入图片', 'DROP FILES HERE': '将文件拖放到这里',
    'DROP IMAGES HERE': '将图片拖放到这里', 'DROP AUDIO HERE': '将音频拖放到这里', 'LOCAL PLAYER': '本地播放器',
    'NO AUDIO LOADED': '未加载音频', 'VOL': '音量', 'MIN': '最小化', 'COMMENTS / 评论': '评论 / COMMENTS',
    '留言': 'Comments', '昵称与邮箱必填': 'Nickname and email required', 'SYSTEM ONLINE': '系统在线',
    'A personal index of notes, images, and sound.': '一个收录札记、图片与声音的个人索引。'
  };
  var original = new WeakMap();
  function translateText(text, lang) { var value = translations[text]; if (!value) return text; return lang === 'zh' ? (text.match(/[\u4e00-\u9fff]/) ? text : value) : (text.match(/[\u4e00-\u9fff]/) ? value : text); }
  function walk(node, lang) {
    if (!node || node.nodeType !== 1 || /^(SCRIPT|STYLE|INPUT|TEXTAREA|CANVAS|AUDIO)$/.test(node.tagName)) return;
    if (node.closest('.article-content, .post-card-body, .notes-directory-title')) return;
    Array.prototype.forEach.call(node.childNodes, function (child) {
      if (child.nodeType === 3) {
        var value = child.nodeValue.trim();
        if (!value || !translations[value]) return;
        if (!original.has(child)) original.set(child, value);
        child.nodeValue = translateText(original.get(child), lang);
      } else walk(child, lang);
    });
  }
  function setLanguage(lang) {
    root.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
    root.setAttribute('data-language', lang);
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-zh][data-i18n-en]'), function (node) {
      node.textContent = lang === 'zh' ? node.getAttribute('data-i18n-zh') : node.getAttribute('data-i18n-en');
    });
    walk(document.body, lang);
    Array.prototype.forEach.call(toggles, function (toggle) {
      toggle.setAttribute('aria-pressed', lang === 'zh' ? 'true' : 'false');
      var label = toggle.querySelector('[data-language-label]');
      if (label) label.textContent = lang === 'zh' ? 'En / 中文' : '中文 / En';
    });
    document.dispatchEvent(new CustomEvent('ssy-language-change', { detail: { language: lang } }));
  }
  var saved = null;
  try { saved = localStorage.getItem(key); } catch (error) { saved = null; }
  setLanguage(saved === 'en' ? 'en' : 'zh');
  Array.prototype.forEach.call(toggles, function (toggle) { toggle.addEventListener('click', function () {
    var next = root.getAttribute('data-language') === 'zh' ? 'en' : 'zh';
    try { localStorage.setItem(key, next); } catch (error) { /* private mode */ }
    setLanguage(next);
  }); });
  window.SSYI18n = { getLanguage: function () { return root.getAttribute('data-language') || 'zh'; }, t: function (zh, en) { return this.getLanguage() === 'zh' ? zh : en; } };
}());
