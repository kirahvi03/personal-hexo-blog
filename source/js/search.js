(function () {
  'use strict';
  var panel = document.querySelector('[data-search-panel]');
  var toggle = document.querySelector('[data-search-toggle]');
  var input = document.querySelector('[data-search-input]');
  var results = document.querySelector('[data-search-results]');
  var status = document.querySelector('[data-search-status]');
  var count = document.querySelector('[data-search-count]');
  var indexNode = document.querySelector('[data-search-index]');
  if (!panel || !toggle || !input || !results || !indexNode) return;
  var entries = [];
  try { entries = JSON.parse(indexNode.textContent || '[]'); } catch (error) { entries = []; }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (character) { return {'&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'}[character]; });
  }
  function openSearch() {
    document.body.classList.add('is-search-open');
    panel.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    window.setTimeout(function () { input.focus(); }, 80);
  }
  function closeSearch() {
    document.body.classList.remove('is-search-open');
    panel.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
  }
  function render(query) {
    var normalized = query.trim().toLowerCase();
    if (!normalized) {
      status.textContent = 'TYPE TO SEARCH';
      count.textContent = '0 RESULTS';
      results.innerHTML = '<p class="archive-empty">Search across the blog archive.</p>';
      return;
    }
    var matches = entries.filter(function (entry) { return (entry.title + ' ' + entry.text + ' ' + entry.type).toLowerCase().indexOf(normalized) !== -1; });
    status.textContent = 'QUERY / ' + query.trim().toUpperCase();
    count.textContent = matches.length + (matches.length === 1 ? ' RESULT' : ' RESULTS');
    if (!matches.length) { results.innerHTML = '<p class="archive-empty">No matching signal found.</p>'; return; }
    results.innerHTML = matches.slice(0, 30).map(function (entry) {
      var excerpt = entry.text.replace(/\s+/g, ' ').trim().slice(0, 160);
      return '<a class="search-result" href="' + escapeHtml(entry.url) + '"><span class="search-result-type">' + escapeHtml(entry.type) + '</span><span class="search-result-copy"><strong>' + escapeHtml(entry.title) + '</strong><small>' + escapeHtml(excerpt || 'Open archive entry') + '</small></span><span class="search-result-arrow">↗</span></a>';
    }).join('');
  }
  toggle.addEventListener('click', function () { document.body.classList.contains('is-search-open') ? closeSearch() : openSearch(); });
  document.querySelectorAll('[data-search-close]').forEach(function (element) { element.addEventListener('click', closeSearch); });
  input.addEventListener('input', function () { render(input.value); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && document.body.classList.contains('is-search-open')) closeSearch(); });
  render('');
}());
