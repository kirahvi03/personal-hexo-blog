(function () {
  'use strict';
  var body = document.body;
  var toggle = document.querySelector('[data-sidebar-toggle]');
  var closeButtons = document.querySelectorAll('[data-sidebar-close]');
  if (!toggle) return;
  function setOpen(open) { body.classList.toggle('is-sidebar-open', open); toggle.setAttribute('aria-expanded', String(open)); }
  toggle.addEventListener('click', function () { setOpen(!body.classList.contains('is-sidebar-open')); });
  closeButtons.forEach(function (button) { button.addEventListener('click', function () { setOpen(false); }); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') setOpen(false); });
  document.querySelectorAll('.sidebar-nav a').forEach(function (link) { link.addEventListener('click', function () { setOpen(false); }); });
}());
