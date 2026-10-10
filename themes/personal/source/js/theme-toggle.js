(function () {
  'use strict';

  var storageKey = 'ssy-theme';
  var root = document.documentElement;
  var toggles = document.querySelectorAll('[data-theme-toggle]');

  function setTheme(theme) {
    var dark = theme === 'dark';
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    Array.prototype.forEach.call(toggles, function (toggle) {
      toggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
      var label = toggle.querySelector('[data-theme-label]');
      var icon = toggle.querySelector('.theme-toggle-icon');
      var language = root.getAttribute('data-language') || 'zh';
      if (label) label.textContent = language === 'zh' ? (dark ? '浅色' : '深色') : (dark ? 'Light' : 'Dark');
      if (icon) icon.textContent = dark ? '☀' : '☾';
    });
  }

  var saved = localStorage.getItem(storageKey);
  setTheme(saved === 'dark' ? 'dark' : 'light');

  Array.prototype.forEach.call(toggles, function (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      localStorage.setItem(storageKey, next);
      setTheme(next);
    });
  });
  document.addEventListener('ssy-language-change', function () { setTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'); });
}());
