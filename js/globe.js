(function () {
  'use strict';
  var canvas = document.querySelector('[data-globe-canvas]');
  var stage = document.querySelector('[data-globe-stage]');
  var tooltip = document.querySelector('[data-globe-tooltip]');
  var dataNode = document.getElementById('globe-data');
  if (!canvas || !stage || !dataNode) return;
  var entries = [];
  try { entries = JSON.parse(dataNode.textContent || '[]'); } catch (error) { entries = []; }
  var articleGroups = [];
  entries.forEach(function (entry) {
    var key = entry.lat.toFixed(4) + ':' + entry.lng.toFixed(4) + ':' + entry.label;
    var group = articleGroups.filter(function (item) { return item.key === key; })[0];
    if (!group) { group = { key: key, location: [entry.lat, entry.lng], label: entry.label, entries: [] }; articleGroups.push(group); }
    group.entries.push(entry);
  });
  var markers = articleGroups.map(function (group) {
    var marker = { location: group.location, size: 0.07, color: [0.96, 0.77, 0.33], group: group, article: true };
    group.entries.forEach(function (entry) { entry.marker = marker; });
    return marker;
  });
  var visitorMarker = null;
  var globe = null;
  var phi = 0.15;
  var theta = 0.18;
  var pointer = { down: false, x: 0, y: 0, moved: false };
  var radius = 0;
  var cobeUrl = 'https://cdn.jsdelivr.net/npm/cobe@2.0.1/+esm';
  var spinSpeed = 0.00075;
  var ssyLocation = { lat: 39.9042, lng: 116.4074, city: '北京' };
  var ssyMarker = { location: [ssyLocation.lat, ssyLocation.lng], size: 0.12, color: [0.55, 1, 0.75], ssy: true };
  var resizeFrame = 0;
  var lastSize = { width: 0, height: 0 };
  function allMarkers() { return [ssyMarker].concat(markers, visitorMarker ? [visitorMarker] : []); }

  function resize() {
    var rect = stage.getBoundingClientRect();
    var width = Math.max(1, Math.round(rect.width));
    var height = Math.max(1, Math.round(rect.height));
    radius = Math.min(width, height) * 0.36;
    if (width !== lastSize.width || height !== lastSize.height) {
      lastSize = { width: width, height: height };
      if (globe) globe.update({ width: width * 2, height: height * 2 });
    }
    positionMarkers();
  }
  function scheduleResize() {
    if (resizeFrame) return;
    resizeFrame = window.requestAnimationFrame(function () {
      resizeFrame = 0;
      resize();
    });
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
    allMarkers().forEach(function (marker) {
      if (!marker.node) return;
      var point = project(marker.location);
      marker.node.style.transform = 'translate3d(' + point.x + 'px,' + point.y + 'px,0)';
      marker.node.classList.toggle('is-hidden', !point.visible);
    });
  }
  function showTooltip(marker) {
    var point = project(marker.location);
    if (!point.visible) { tooltip.hidden = true; return; }
    tooltip.replaceChildren();
    var title = document.createElement('strong');
    var detail = document.createElement('span');
    title.textContent = marker.ssy ? (window.SSYI18n ? window.SSYI18n.t('这里是 SSY', 'THIS IS SSY') : 'THIS IS SSY') : marker.visitor ? (window.SSYI18n ? window.SSYI18n.t('当前访客', 'CURRENT VISITOR') : 'CURRENT VISITOR') : marker.group.label;
    tooltip.appendChild(title);
    if (marker.ssy) {
      var ssyDetail = document.createElement('span');
      ssyDetail.textContent = window.SSYI18n ? window.SSYI18n.t('北京 / SSY 信号源', 'Beijing / SSY signal source') : 'Beijing / SSY signal source';
      tooltip.appendChild(ssyDetail);
    } else if (marker.visitor) {
      var visitorDetail = document.createElement('span');
      visitorDetail.textContent = window.SSYI18n ? window.SSYI18n.t('大致位置：' + marker.label, 'Approx. ' + marker.label) : 'Approx. ' + marker.label;
      tooltip.appendChild(visitorDetail);
    } else {
      var list = document.createElement('div');
      list.className = 'globe-tooltip-list';
      marker.group.entries.forEach(function (entry) {
        var link = document.createElement('a');
        link.href = entry.url;
        link.innerHTML = '<strong></strong><small></small>';
        link.querySelector('strong').textContent = entry.title;
        link.querySelector('small').textContent = entry.date + ' / ' + entry.type;
        list.appendChild(link);
      });
      tooltip.appendChild(list);
    }
    tooltip.style.left = Math.min(point.x + 13, stage.clientWidth - 190) + 'px';
    tooltip.style.top = Math.max(point.y - 48, 8) + 'px';
    tooltip.hidden = false;
  }
  function mountMarkers() {
    markers.forEach(function (marker) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'globe-marker globe-marker-notes';
      button.title = marker.group.label;
      button.setAttribute('aria-label', marker.group.label + '，' + marker.group.entries.length + ' 篇札记');
      button.innerHTML = '<span></span>';
      bindMarker(marker, button);
    });
    var home = document.createElement('button');
    home.type = 'button';
    home.className = 'globe-marker globe-marker-ssy';
    home.title = 'SSY / Beijing';
    home.setAttribute('aria-label', '这里是 SSY，北京');
    home.innerHTML = '<span></span><i></i>';
    bindMarker(ssyMarker, home);
    positionMarkers();
  }
  function bindMarker(marker, node) {
    node.addEventListener('pointerenter', function () { showTooltip(marker); });
    node.addEventListener('pointerleave', function () { window.setTimeout(function () { if (!tooltip.matches(':hover')) tooltip.hidden = true; }, 80); });
    marker.node = node;
    stage.appendChild(node);
  }
  function mountVisitorMarker() {
    if (!visitorMarker) return;
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'globe-marker globe-marker-visitor';
    button.title = 'Current visitor location (approximate)';
    button.setAttribute('aria-label', 'Current visitor location, approximate');
    button.innerHTML = '<span></span>';
    button.addEventListener('click', function (event) { event.stopPropagation(); });
    bindMarker(visitorMarker, button);
    positionMarkers();
  }
  function setVisitorStatus(text, ready) {
    var node = document.querySelector('[data-visitor-status]');
    if (!node) return;
    node.textContent = text;
    node.classList.toggle('is-ready', !!ready);
  }
  function setVisitorDistance(text) {
    var node = document.querySelector('[data-visitor-distance]');
    if (node) node.textContent = text;
  }
  function setVisitorCard(text) {
    var node = document.querySelector('[data-visitor-card]');
    if (node) node.textContent = text;
  }
  function toRad(value) { return value * Math.PI / 180; }
  function getDistance(lat1, lng1, lat2, lng2) {
    var earthRadius = 6371;
    var dLat = toRad(lat2 - lat1);
    var dLng = toRad(lng2 - lng1);
    var a = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.pow(Math.sin(dLng / 2), 2);
    return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function refreshVisitorDistance() {
    if (!visitorMarker) return;
    var distance = Math.round(getDistance(ssyLocation.lat, ssyLocation.lng, visitorMarker.location[0], visitorMarker.location[1]));
    var zh = '你在 ' + visitorMarker.city + '，距离 SSY（北京）约 ' + distance + ' 公里';
    var en = 'You are in ' + visitorMarker.city + ', approx. ' + distance + ' km from SSY (Beijing)';
    setVisitorDistance(window.SSYI18n ? window.SSYI18n.t(zh, en) : en);
    setVisitorCard(window.SSYI18n ? window.SSYI18n.t(visitorMarker.city + ' / ' + distance + ' KM', visitorMarker.city + ' / ' + distance + ' KM') : visitorMarker.city + ' / ' + distance + ' KM');
  }
  function refreshVisitorStatus() {
    if (!visitorMarker) return;
    var prefix = window.SSYI18n ? window.SSYI18n.t('访客：大致位置 ', 'VISITOR: APPROX. ') : 'VISITOR: APPROX. ';
    setVisitorStatus(prefix + visitorMarker.label.toUpperCase(), true);
  }
  function updateGlobeMarkers() {
    if (globe) globe.update({ markers: allMarkers() });
    positionMarkers();
  }
  function addVisitorLocation(data) {
    var lat = Number(data.latitude);
    var lng = Number(data.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new Error('Invalid location');
    var city = typeof data.city === 'string' ? data.city.trim() : '';
    var country = typeof data.country === 'string' ? data.country.trim() : '';
    visitorMarker = {
      location: [lat, lng],
      size: 0.1,
      color: [1, 0.45, 0.36],
      visitor: true,
      city: city || (typeof data.region === 'string' ? data.region.trim() : '') || '未知地区',
      label: [city, country].filter(Boolean).join(' / ') || 'undisclosed area'
    };
    mountVisitorMarker();
    updateGlobeMarkers();
    refreshVisitorStatus();
    refreshVisitorDistance();
  }
  function locateVisitor() {
    setVisitorStatus(window.SSYI18n ? window.SSYI18n.t('访客：定位中…', 'VISITOR: LOCATING…') : 'VISITOR: LOCATING…');
    fetch('https://ipwho.is/', { headers: { Accept: 'application/json' } })
      .then(function (response) { if (!response.ok) throw new Error('Location service unavailable'); return response.json(); })
      .then(function (data) { if (data && data.success === false) throw new Error('Location unavailable'); addVisitorLocation(data); })
      .catch(function () {
        return fetch('https://ipapi.co/json/', { headers: { Accept: 'application/json' } })
          .then(function (response) { if (!response.ok) throw new Error('Location service unavailable'); return response.json(); })
          .then(addVisitorLocation);
      })
      .catch(function () { setVisitorStatus(window.SSYI18n ? window.SSYI18n.t('访客：不可用', 'VISITOR: UNAVAILABLE') : 'VISITOR: UNAVAILABLE'); });
  }
  function bindList() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-signal-index]'), function (row) {
      var entry = entries[Number(row.getAttribute('data-signal-index'))];
      var marker = entry && entry.marker;
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
        markers: allMarkers(),
        onRender: function (state) {
          // Positive phi advances the globe from west to east.
          if (!pointer.down) state.phi += spinSpeed;
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
  stage.addEventListener('pointerup', release); stage.addEventListener('pointercancel', release); stage.addEventListener('pointerleave', function () { if (!pointer.down && !tooltip.matches(':hover')) tooltip.hidden = true; });
  tooltip.addEventListener('pointerenter', function () { });
  tooltip.addEventListener('pointerleave', function () { tooltip.hidden = true; });
  tooltip.addEventListener('pointerdown', function (event) { event.stopPropagation(); });
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) {
    var observer = new ResizeObserver(scheduleResize);
    observer.observe(stage);
    var consolePanel = stage.closest('.globe-console');
    if (consolePanel) observer.observe(consolePanel);
  }
  document.addEventListener('transitionend', function (event) {
    if (event.propertyName === 'width' || event.propertyName === 'margin-left' || event.propertyName === 'padding') scheduleResize();
  });
  document.addEventListener('ssy-language-change', refreshVisitorStatus);
  document.addEventListener('ssy-language-change', refreshVisitorDistance);
  mountMarkers(); bindList(); resize(); mountCobe(); locateVisitor();
}());
