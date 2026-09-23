(function () {
  'use strict';

  var root = document.querySelector('[data-music-player]');
  if (!root) return;

  var audio = root.querySelector('[data-player-audio]');
  var fileInput = root.querySelector('[data-player-input]');
  var dropzone = root.querySelector('[data-player-dropzone]');
  var list = root.querySelector('[data-player-list]');
  var tracks = [];
  var activeIndex = -1;
  var objectUrls = [];

  var status = root.querySelector('[data-player-status]');
  var count = root.querySelector('[data-player-count]');
  var title = root.querySelector('[data-player-title]');
  var current = root.querySelector('[data-player-current]');
  var duration = root.querySelector('[data-player-duration]');
  var progress = root.querySelector('[data-player-progress]');
  var volume = root.querySelector('[data-player-volume]');
  var volumeValue = root.querySelector('[data-player-volume-value]');
  var playButton = root.querySelector('[data-player-action="toggle"]');
  var dragHandle = root.querySelector('[data-player-drag-handle]');
  var dragState = null;
  var minimizeButton = root.querySelector('[data-player-minimize]');

  audio.volume = Number(volume.value);

  function restorePosition() {
    try {
      var saved = JSON.parse(localStorage.getItem('personal-blog-player-position'));
      if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
        root.style.left = Math.max(8, Math.min(saved.left, window.innerWidth - root.offsetWidth - 8)) + 'px';
        root.style.top = Math.max(8, Math.min(saved.top, window.innerHeight - root.offsetHeight - 8)) + 'px';
        root.style.right = 'auto';
        root.style.bottom = 'auto';
      }
    } catch (error) { /* localStorage may be unavailable */ }
  }

  function savePosition() {
    try { localStorage.setItem('personal-blog-player-position', JSON.stringify({ left: root.offsetLeft, top: root.offsetTop })); } catch (error) { /* ignore storage errors */ }
  }

  function movePlayer(event) {
    if (!dragState) return;
    var left = Math.max(8, Math.min(event.clientX - dragState.offsetX, window.innerWidth - root.offsetWidth - 8));
    var top = Math.max(8, Math.min(event.clientY - dragState.offsetY, window.innerHeight - root.offsetHeight - 8));
    root.style.left = left + 'px';
    root.style.top = top + 'px';
    root.style.right = 'auto';
    root.style.bottom = 'auto';
  }

  dragHandle.addEventListener('pointerdown', function (event) {
    if (event.button !== 0) return;
    var rect = root.getBoundingClientRect();
    dragState = { offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    root.classList.add('is-dragging');
    dragHandle.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  dragHandle.addEventListener('pointermove', movePlayer);
  dragHandle.addEventListener('pointerup', function (event) {
    if (!dragState) return;
    dragState = null;
    root.classList.remove('is-dragging');
    if (dragHandle.hasPointerCapture(event.pointerId)) dragHandle.releasePointerCapture(event.pointerId);
    savePosition();
  });
  dragHandle.addEventListener('pointercancel', function () { dragState = null; root.classList.remove('is-dragging'); });
  window.addEventListener('resize', function () {
    if (!root.style.left) return;
    var rect = root.getBoundingClientRect();
    root.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - root.offsetWidth - 8)) + 'px';
    root.style.top = Math.max(8, Math.min(rect.top, window.innerHeight - root.offsetHeight - 8)) + 'px';
    savePosition();
  });

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '00:00';
    var minutes = Math.floor(seconds / 60);
    var remainder = Math.floor(seconds % 60);
    return String(minutes).padStart(2, '0') + ':' + String(remainder).padStart(2, '0');
  }

  function setStatus(value) { status.textContent = value; }

  function saveAudioFile(file) {
    if (!window.PersonalArchiveStore) return Promise.resolve();
    var item = { id: Date.now() + '-' + Math.random().toString(16).slice(2), type: 'audio', name: file.name, blob: file, createdAt: Date.now() };
    return window.PersonalArchiveStore.put(item);
  }

  function addStoredTrack(item) {
    var url = URL.createObjectURL(item.blob);
    objectUrls.push(url);
    tracks.push({ name: item.name, url: url, storedId: item.id });
  }

  function renderList() {
    count.textContent = tracks.length + (tracks.length === 1 ? ' TRACK' : ' TRACKS');
    list.innerHTML = '';
    if (!tracks.length) {
      list.innerHTML = '<li class="playlist-empty">Your local tracks appear here.</li>';
      return;
    }
    tracks.forEach(function (track, index) {
      var item = document.createElement('li');
      item.className = index === activeIndex ? 'is-active' : '';
      item.innerHTML = '<button type="button" class="playlist-item" aria-label="Play ' + escapeHtml(track.name) + '"><span class="playlist-index">' + String(index + 1).padStart(2, '0') + '</span><span class="playlist-name">' + escapeHtml(track.name) + '</span><span class="playlist-state">' + (index === activeIndex ? '●' : '·') + '</span></button>';
      item.querySelector('button').addEventListener('click', function () { loadTrack(index, true); });
      list.appendChild(item);
    });
  }

  function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, function (character) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[character];
    });
  }

  function addFiles(fileList) {
    var files = Array.prototype.filter.call(fileList, function (file) { return file.type.indexOf('audio/') === 0; });
    if (!files.length) {
      setStatus('AUDIO ONLY');
      return;
    }
    files.forEach(function (file) {
      var url = URL.createObjectURL(file);
      objectUrls.push(url);
      tracks.push({ name: file.name, url: url });
      saveAudioFile(file);
    });
    renderList();
    setStatus('FILES READY');
    if (activeIndex === -1) loadTrack(0, false);
  }

  function loadTrack(index, autoplay) {
    if (!tracks[index]) return;
    activeIndex = index;
    audio.src = tracks[index].url;
    title.textContent = tracks[index].name.toUpperCase();
    current.textContent = '00:00';
    duration.textContent = '00:00';
    progress.value = 0;
    renderList();
    setStatus('LOADED');
    if (autoplay) audio.play().catch(function () { setStatus('CLICK PLAY'); });
  }

  function togglePlayback() {
    if (!tracks.length) { setStatus('IMPORT AUDIO'); return; }
    if (audio.paused) {
      audio.play().then(function () { setStatus('PLAYING'); }).catch(function () { setStatus('CLICK PLAY'); });
    } else {
      audio.pause();
      setStatus('PAUSED');
    }
  }

  function step(direction) {
    if (!tracks.length) return;
    var next = activeIndex + direction;
    if (next < 0) next = tracks.length - 1;
    if (next >= tracks.length) next = 0;
    loadTrack(next, true);
  }

  fileInput.addEventListener('change', function (event) { addFiles(event.target.files); fileInput.value = ''; });
  window.addEventListener('personal-audio-added', function (event) {
    if (!event.detail || tracks.some(function (track) { return track.name === event.detail.name; })) return;
    addStoredTrack(event.detail);
    renderList();
    setStatus('ARCHIVE READY');
    if (activeIndex === -1) loadTrack(0, false);
  });
  root.querySelectorAll('[data-player-action]').forEach(function (button) {
    button.addEventListener('click', function () {
      var action = button.getAttribute('data-player-action');
      if (action === 'toggle') togglePlayback();
      if (action === 'previous') step(-1);
      if (action === 'next') step(1);
    });
  });
  root.querySelector('[data-player-clear]').addEventListener('click', function () {
    audio.pause();
    audio.removeAttribute('src');
    objectUrls.forEach(URL.revokeObjectURL);
    objectUrls = [];
    tracks = [];
    activeIndex = -1;
    title.textContent = 'NO AUDIO LOADED';
    setStatus('READY');
    current.textContent = '00:00';
    duration.textContent = '00:00';
    progress.value = 0;
    playButton.textContent = '▶';
    renderList();
  });
  volume.addEventListener('input', function () {
    audio.volume = Number(volume.value);
    volumeValue.textContent = String(Math.round(Number(volume.value) * 100)).padStart(2, '0');
  });
  progress.addEventListener('input', function () {
    if (audio.duration) audio.currentTime = (Number(progress.value) / 100) * audio.duration;
  });
  audio.addEventListener('loadedmetadata', function () { duration.textContent = formatTime(audio.duration); });
  audio.addEventListener('timeupdate', function () {
    current.textContent = formatTime(audio.currentTime);
    progress.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  });
  audio.addEventListener('play', function () { playButton.textContent = 'Ⅱ'; setStatus('PLAYING'); renderList(); });
  audio.addEventListener('pause', function () { playButton.textContent = '▶'; if (audio.currentTime > 0) setStatus('PAUSED'); });
  audio.addEventListener('ended', function () { step(1); });
  ['dragenter', 'dragover'].forEach(function (eventName) { dropzone.addEventListener(eventName, function (event) { event.preventDefault(); dropzone.classList.add('is-dragging'); }); });
  ['dragleave', 'drop'].forEach(function (eventName) { dropzone.addEventListener(eventName, function (event) { event.preventDefault(); dropzone.classList.remove('is-dragging'); }); });
  dropzone.addEventListener('drop', function (event) { addFiles(event.dataTransfer.files); });
  window.addEventListener('beforeunload', function () { objectUrls.forEach(URL.revokeObjectURL); });
  if (minimizeButton) minimizeButton.addEventListener('click', function (event) {
    event.stopPropagation();
    root.classList.toggle('is-minimized');
    minimizeButton.textContent = root.classList.contains('is-minimized') ? '+' : '_';
    minimizeButton.setAttribute('aria-label', root.classList.contains('is-minimized') ? 'Expand player' : 'Minimize player');
    try { localStorage.setItem('personal-blog-player-minimized', String(root.classList.contains('is-minimized'))); } catch (error) { /* ignore */ }
  });
  try {
    if (localStorage.getItem('personal-blog-player-minimized') === 'true') { root.classList.add('is-minimized'); minimizeButton.textContent = '+'; }
  } catch (error) { /* ignore */ }
  if (window.PersonalArchiveStore) window.PersonalArchiveStore.getAll('audio').then(function (items) {
    items.forEach(addStoredTrack);
    renderList();
    if (activeIndex === -1 && tracks.length) loadTrack(0, false);
  }).catch(function () { /* archive storage may be unavailable */ });
  restorePosition();
  renderList();
}());
