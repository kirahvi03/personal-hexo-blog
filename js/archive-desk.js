(function () {
  'use strict';
  var root = document.querySelector('[data-archive-desk]');
  if (!root || !window.PersonalArchiveStore) return;
  var type = root.getAttribute('data-archive-type');
  var status = root.querySelector('[data-archive-status]');
  var count = root.querySelector('[data-archive-count]');
  var itemsRoot = root.querySelector('[data-archive-items]');
  var fileInput = root.querySelector('[data-archive-file-input]');
  var dropzone = root.querySelector('[data-archive-dropzone]');
  var objectUrls = [];

  function setStatus(value) { status.textContent = value; }
  function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]; }); }
  function dateLabel(value) { return new Date(value).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }); }

  function render(items) {
    objectUrls.forEach(URL.revokeObjectURL);
    objectUrls = [];
    count.textContent = items.length + (items.length === 1 ? ' ITEM' : ' ITEMS');
    if (!items.length) { itemsRoot.innerHTML = '<p class="archive-empty">No saved items yet. Add something above.</p>'; return; }
    itemsRoot.innerHTML = '';
    items.forEach(function (item) {
      var card = document.createElement('article');
      card.className = 'archive-item';
      var media = '';
      if (item.type === 'image') {
        var url = URL.createObjectURL(item.blob); objectUrls.push(url);
        media = '<img src="' + url + '" alt="' + escapeHtml(item.name) + '">';
      } else if (item.type === 'audio') {
        var audioUrl = URL.createObjectURL(item.blob); objectUrls.push(audioUrl);
        media = '<audio controls preload="metadata" src="' + audioUrl + '"></audio>';
      }
      card.innerHTML = '<div class="archive-item-media">' + media + '</div><div class="archive-item-info"><strong>' + escapeHtml(item.title || item.name) + '</strong><small>' + dateLabel(item.createdAt) + ' / ' + escapeHtml(item.name || 'NOTE') + '</small>' + (item.type === 'note' ? '<p>' + escapeHtml(item.text).replace(/\n/g, '<br>') + '</p>' : '') + '</div><button class="archive-delete" type="button">DELETE</button>';
      card.querySelector('.archive-delete').addEventListener('click', function () {
        window.PersonalArchiveStore.remove(item.id).then(load).then(function () { setStatus('REMOVED'); });
      });
      itemsRoot.appendChild(card);
    });
  }

  function load() { return window.PersonalArchiveStore.getAll(type).then(render).catch(function () { setStatus('STORAGE ERROR'); }); }

  function saveFiles(fileList) {
    var files = Array.prototype.filter.call(fileList, function (file) { return type === 'gallery' ? file.type.indexOf('image/') === 0 : file.type.indexOf('audio/') === 0; });
    if (!files.length) { setStatus(type === 'gallery' ? 'IMAGES ONLY' : 'AUDIO ONLY'); return; }
    Promise.all(files.map(function (file) {
      var item = { id: Date.now() + '-' + Math.random().toString(16).slice(2), type: type === 'gallery' ? 'image' : 'audio', name: file.name, blob: file, createdAt: Date.now() };
      return window.PersonalArchiveStore.put(item).then(function () {
        if (item.type === 'audio') window.dispatchEvent(new CustomEvent('personal-audio-added', { detail: item }));
      });
    })).then(load).then(function () { setStatus('SAVED TO THIS BROWSER'); });
  }

  if (fileInput) fileInput.addEventListener('change', function (event) { saveFiles(event.target.files); fileInput.value = ''; });
  if (dropzone) {
    ['dragenter', 'dragover'].forEach(function (name) { dropzone.addEventListener(name, function (event) { event.preventDefault(); dropzone.classList.add('is-dragging'); }); });
    ['dragleave', 'drop'].forEach(function (name) { dropzone.addEventListener(name, function (event) { event.preventDefault(); dropzone.classList.remove('is-dragging'); }); });
    dropzone.addEventListener('drop', function (event) { saveFiles(event.dataTransfer.files); });
  }
  var noteForm = root.querySelector('[data-archive-note-form]');
  if (noteForm) noteForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var data = new FormData(noteForm);
    window.PersonalArchiveStore.put({ id: Date.now() + '-' + Math.random().toString(16).slice(2), type: 'notes', title: data.get('title'), text: data.get('text'), createdAt: Date.now() }).then(function () { noteForm.reset(); return load(); }).then(function () { setStatus('NOTE SAVED'); });
  });
  load();
}());
