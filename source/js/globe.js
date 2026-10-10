(function () {
  'use strict';
  var canvas = document.querySelector('[data-globe-canvas]');
  var stage = document.querySelector('[data-globe-stage]');
  var tooltip = document.querySelector('[data-globe-tooltip]');
  var dataNode = document.getElementById('globe-data');
  if (!canvas || !stage || !dataNode) return;
  var entries = [];
  try { entries = JSON.parse(dataNode.textContent || '[]'); } catch (error) { entries = []; }
  var markers = entries.map(function (entry) { return { location: [entry.lat, entry.lng], size: 0.07, color: [0.96, 0.77, 0.33], entry: entry }; });
  var globe = null;
  var phi = 0.15;
  var theta = 0.18;
  var pointer = { down: false, x: 0, y: 0, moved: false };
  var radius = 0;
  var cobeUrl = 'https://cdn.jsdelivr.net/npm/cobe@2.0.1/+esm';

  function resize() {
    var rect = stage.getBoundingClientRect();
    radius = Math.min(rect.width, rect.height) * 0.36;
    if (globe) globe.update({ width: rect.width * 2, height: rect.height * 2 });
    positionMarkers();
  }
  function project(location) {
    var lng = location[1] * Math.PI / 180;
    var lat = location[0] * Math.PI / 180;
    var x = -Math.cos(lng) * Math.sin(lat - Math.PI / 2);
    var y = Math.sin(lng);
    var z = Math.cos(lng) * Math.cos(lat - Math.PI / 2);
    var cosPhi = Math.cos(phi);
    var sinPhi = Math.sin(phi);
    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);
    var rotatedX = cosPhi * x + sinPhi * z;
    var rotatedY = sinTheta * sinPhi * x + cosTheta * y - cosPhi * sinTheta * z;
    var rotatedZ = -sinTheta * cosPhi * x + sinPhi * y + cosTheta * cosPhi * z;
    return { x: stage.clientWidth / 2 + rotatedX * radius, y: stage.clientHeight / 2 - rotatedY * radius, visible: rotatedZ > 0 };
  }
  function positionMarkers() {
    markers.forEach(function (marker) {
      if (!marker.node) return;
      var point = project(marker.location);
      marker.node.style.transform = 'translate3d(' + point.x + 'px,' + point.y + 'px,0)';
      marker.node.classList.toggle('is-hidden', !point.visible);
    });
  }
  function showTooltip(marker) {
    var point = project(marker.location);
    if (!point.visible) { tooltip.hidden = true; return; }
    tooltip.innerHTML = '<strong>' + marker.entry.title + '</strong><span>' + marker.entry.label + ' / ' + marker.entry.date + '</span>';
    tooltip.style.left = Math.min(point.x + 13, stage.clientWidth - 190) + 'px';
    tooltip.style.top = Math.max(point.y - 48, 8) + 'px';
    tooltip.hidden = false;
  }
  function mountMarkers() {
    markers.forEach(function (marker) {
      var link = document.createElement('a');
      link.className = 'globe-marker';
      link.href = marker.entry.url;
      link.title = marker.entry.title + ' / ' + marker.entry.date;
      link.setAttribute('aria-label', marker.entry.title + '，' + marker.entry.label + '，' + marker.entry.date);
      link.innerHTML = '<span></span>';
      link.addEventListener('pointerenter', function () { showTooltip(marker); });
      link.addEventListener('pointerleave', function () { tooltip.hidden = true; });
      marker.node = link;
      stage.appendChild(link);
    });
    positionMarkers();
  }
  function bindList() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-signal-index]'), function (row) {
      var marker = markers[Number(row.getAttribute('data-signal-index'))];
      if (!marker) return;
      row.addEventListener('mouseenter', function () { showTooltip(marker); });
      row.addEventListener('mouseleave', function () { tooltip.hidden = true; });
    });
  }
  function mountCobe() {
    import(/* webpackIgnore: true */ cobeUrl).then(function (module) {
      var createGlobe = module.default || module;
      globe = createGlobe(canvas, {
        devicePixelRatio: 2,
        width: stage.clientWidth * 2,
        height: stage.clientHeight * 2,
        phi: phi,
        theta: theta,
        dark: 1,
        diffuse: 1.2,
        mapSamples: 12000,
        mapBrightness: 3.2,
        mapBaseBrightness: 0.035,
        baseColor: [0.08, 0.45, 0.3],
        markerColor: [0.96, 0.77, 0.33],
        glowColor: [0.1, 0.75, 0.5],
        markers: markers,
        onRender: function (state) {
          if (!pointer.down) state.phi += 0.0016;
          phi = state.phi;
          theta = state.theta;
          positionMarkers();
        }
      });
    }).catch(function () {
      stage.classList.add('is-globe-fallback');
      tooltip.hidden = true;
    });
  }
  stage.addEventListener('pointerdown', function (event) { pointer.down = true; pointer.moved = false; pointer.x = event.clientX; pointer.y = event.clientY; stage.setPointerCapture(event.pointerId); stage.classList.add('is-orbiting'); });
  stage.addEventListener('pointermove', function (event) { if (!pointer.down || !globe) return; var dx = event.clientX - pointer.x; var dy = event.clientY - pointer.y; if (Math.abs(dx) + Math.abs(dy) > 2) pointer.moved = true; phi += dx * 0.008; theta = Math.max(-0.7, Math.min(0.7, theta + dy * 0.004)); pointer.x = event.clientX; pointer.y = event.clientY; globe.update({ phi: phi, theta: theta }); positionMarkers(); });
  function release() { pointer.down = false; stage.classList.remove('is-orbiting'); }
  stage.addEventListener('pointerup', release); stage.addEventListener('pointercancel', release); stage.addEventListener('pointerleave', function () { if (!pointer.down) tooltip.hidden = true; });
  window.addEventListener('resize', resize);
  mountMarkers(); bindList(); resize(); mountCobe();
}());
