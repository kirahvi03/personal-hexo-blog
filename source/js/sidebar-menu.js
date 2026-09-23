(function () {
  'use strict';
  var body = document.body;
  var toggle = document.querySelector('[data-sidebar-toggle]');
  var closeButtons = document.querySelectorAll('[data-sidebar-close]');
  if (!toggle) return;
  var desktopQuery = window.matchMedia('(min-width: 721px)');
  var desktopExpanded = false;
  var mobileOpen = false;
  function isDesktop() { return desktopQuery.matches; }
  function render() {
    var expanded = isDesktop() ? desktopExpanded : mobileOpen;
    body.classList.toggle('is-sidebar-collapsed', isDesktop() && !desktopExpanded);
    body.classList.toggle('is-sidebar-expanded', isDesktop() && desktopExpanded);
    body.classList.toggle('is-sidebar-open', !isDesktop() && mobileOpen);
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.setAttribute('aria-label', expanded ? '收起菜单' : '展开菜单');
  }
  toggle.addEventListener('click', function () {
    if (isDesktop()) desktopExpanded = !desktopExpanded;
    else mobileOpen = !mobileOpen;
    render();
  });
  closeButtons.forEach(function (button) { button.addEventListener('click', function () {
    if (isDesktop()) desktopExpanded = false;
    else mobileOpen = false;
    render();
  }); });
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (isDesktop()) desktopExpanded = false;
    else mobileOpen = false;
    render();
  });
  document.querySelectorAll('.sidebar-nav a').forEach(function (link) { link.addEventListener('click', function () {
    if (!isDesktop()) { mobileOpen = false; render(); }
  }); });
  if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', render);
  else desktopQuery.addListener(render);
  render();
}());
