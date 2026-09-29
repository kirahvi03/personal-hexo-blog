(function () {
  'use strict';
  var station = document.querySelector('[data-pet-station]');
  if (!station) return;
  var initialImage = document.body.getAttribute('data-pet-image');
  var animationFrames = [document.body.getAttribute('data-pet-frame-1'), document.body.getAttribute('data-pet-frame-2'), document.body.getAttribute('data-pet-frame-3')];
  animationFrames.forEach(function (src) { if (src) { var preload = new Image(); preload.src = src; } });
  var pet = document.createElement('div');
  pet.className = 'desktop-pet';
  pet.setAttribute('role', 'button');
  pet.setAttribute('aria-label', 'Interactive desktop pet');
  pet.innerHTML = '<div class="desktop-pet-name">SSY PET <span>ONLINE</span></div><img src="' + initialImage + '" alt="Pixel desktop pet"><div class="desktop-pet-status">CLICK ME</div>';
  document.body.appendChild(pet);
  var image = pet.querySelector('img');
  var status = pet.querySelector('.desktop-pet-status');
  var dragging = null;
  var home = { left: null, top: null };
  try { var saved = JSON.parse(localStorage.getItem('ssy-desktop-pet-position')); if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) home = saved; } catch (error) { /* ignore */ }
  function setPosition(left, top) { pet.style.left = Math.max(8, Math.min(left, window.innerWidth - pet.offsetWidth - 8)) + 'px'; pet.style.top = Math.max(8, Math.min(top, window.innerHeight - pet.offsetHeight - 8)) + 'px'; pet.classList.add('is-placed'); }
  function summon() {
    if (pet.classList.contains('is-visible')) return;
    pet.classList.add('is-visible');
    window.setTimeout(function () { if (home.left === null) setPosition(window.innerWidth - pet.offsetWidth - 34, window.innerHeight - pet.offsetHeight - 70); else setPosition(home.left, home.top); }, 30);
  }
  station.addEventListener('click', summon);
  station.addEventListener('keydown', function (event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); summon(); } });
  pet.addEventListener('pointerdown', function (event) {
    if (event.button !== 0) return;
    var rect = pet.getBoundingClientRect(); dragging = { offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, moved: false };
    pet.setPointerCapture(event.pointerId); pet.classList.add('is-dragging'); event.preventDefault();
  });
  pet.addEventListener('pointermove', function (event) { if (!dragging) return; dragging.moved = true; setPosition(event.clientX - dragging.offsetX, event.clientY - dragging.offsetY); });
  pet.addEventListener('pointerup', function (event) {
    if (!dragging) return;
    var moved = dragging.moved; dragging = null; pet.classList.remove('is-dragging');
    if (pet.hasPointerCapture(event.pointerId)) pet.releasePointerCapture(event.pointerId);
    try { localStorage.setItem('ssy-desktop-pet-position', JSON.stringify({ left: pet.offsetLeft, top: pet.offsetTop })); } catch (error) { /* ignore */ }
    if (!moved) {
      pet.classList.remove('is-talking'); void pet.offsetWidth; pet.classList.add('is-talking'); status.textContent = '鈾?HAPPY';
      animationFrames.forEach(function (src, index) { if (src) window.setTimeout(function () { image.src = src; }, index * 333); });
      window.setTimeout(function () { image.src = initialImage; status.textContent = 'CLICK ME'; }, 1000);
    }
  });
  image.addEventListener('error', function () { status.textContent = 'IMAGE MISSING'; });
  window.addEventListener('resize', function () { if (pet.classList.contains('is-placed')) setPosition(pet.offsetLeft, pet.offsetTop); });
}());
