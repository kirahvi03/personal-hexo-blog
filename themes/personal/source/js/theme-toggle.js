(function () {
  'use strict';

  var storageKey = 'ssy-theme';
  var root = document.documentElement;
  var toggle = document.querySelector('[data-theme-toggle]');
  var label = document.querySelector('[data-theme-label]');
  var icon = toggle && toggle.querySelector('.theme-toggle-icon');

  function setTheme(theme) {
    var dark = theme === 'dark';
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    if (toggle) toggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
    if (label) label.textContent = dark ? 'Light' : 'Dark';
    if (icon) icon.textContent = dark ? '☀' : '☾';
  }

  var saved = localStorage.getItem(storageKey);
  setTheme(saved === 'dark' ? 'dark' : 'light');

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      localStorage.setItem(storageKey, next);
      setTheme(next);
    });
  }
}());
