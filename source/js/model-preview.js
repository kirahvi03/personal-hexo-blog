(function () {
  'use strict';
  var previews = document.querySelectorAll('[data-model-preview]');
  if (!previews.length) return;
  var loader = document.createElement('script');
  loader.src = 'https://cdn.jsdelivr.net/npm/rhino3dm@8.4.0/rhino3dm.js';
  loader.onload = function () { window.rhino3dm().then(function (rhino) { previews.forEach(function (preview) { initPreview(preview, rhino); }); }); };
  loader.onerror = function () { previews.forEach(function (preview) { setStatus(preview, 'VIEWER OFFLINE'); }); };
  document.head.appendChild(loader);

  function setStatus(preview, text) { var node = preview.querySelector('[data-model-status]'); if (node) node.textContent = text; }
  function initPreview(preview, rhino) {
    var canvas = preview.querySelector('[data-model-canvas]');
    var context = canvas.getContext('2d');
    var angle = 0, zoom = 1, drag = null;
    function resize() { var rect = canvas.getBoundingClientRect(); var ratio = window.devicePixelRatio || 1; canvas.width = Math.max(1, rect.width * ratio); canvas.height = Math.max(1, rect.height * ratio); context.setTransform(ratio, 0, 0, ratio, 0, 0); draw(); }
    function project(point) { var b = preview._bounds; var cx = (b.min[0] + b.max[0]) / 2, cy = (b.min[1] + b.max[1]) / 2, cz = (b.min[2] + b.max[2]) / 2; var size = Math.max(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2], 1); var x = point[0] - cx, y = point[1] - cy, z = point[2] - cz; var rx = x * Math.cos(angle) - z * Math.sin(angle), rz = x * Math.sin(angle) + z * Math.cos(angle); var scale = Math.min(canvas.clientWidth, canvas.clientHeight) * .72 * zoom / size; return [canvas.clientWidth / 2 + rx * scale, canvas.clientHeight / 2 - (y - rz * .16) * scale]; }
    function draw() { context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight); context.fillStyle = '#181816'; context.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight); if (!preview._lines) return; context.strokeStyle = '#ff5a1f'; context.lineWidth = preview.classList.contains('model-preview-thumb') ? .75 : 1.15; context.globalAlpha = .9; preview._lines.forEach(function (line) { context.beginPath(); line.forEach(function (point, index) { var p = project(point); if (index) context.lineTo(p[0], p[1]); else context.moveTo(p[0], p[1]); }); context.stroke(); }); context.globalAlpha = 1; }
    function addLine(lines, points, bounds) { if (!points || points.length < 2) return; points.forEach(function (point) { point.forEach(function (value, index) { bounds.min[index] = Math.min(bounds.min[index], value); bounds.max[index] = Math.max(bounds.max[index], value); }); }); lines.push(points); }
    function meshLines(mesh, lines, bounds) { var vertices = mesh.vertices(), faces = mesh.faces(); for (var i = 0; i < faces.count; i += 1) { var face = faces.get(i); var ids = [face.a, face.b, face.c]; if (face.d !== face.c) ids.push(face.d); ids.push(face.a); addLine(lines, ids.map(function (id) { var point = vertices.get(id); return [point.x, point.y, point.z]; }), bounds); } }
    function readGeometry(geometry, lines, bounds) { if (!geometry) return; if (geometry.objectType === 'mesh' || geometry.vertices) { meshLines(geometry, lines, bounds); return; } if (geometry.objectType === 'brep' && rhino.Mesh && rhino.Mesh.createFromBrep) { var meshes = rhino.Mesh.createFromBrep(geometry, rhino.MeshingParameters.default); if (meshes) meshes.forEach(function (mesh) { meshLines(mesh, lines, bounds); }); return; } if (geometry.controlPolygon) { var polygon = geometry.controlPolygon(), points = []; for (var i = 0; i < polygon.count; i += 1) { var point = polygon.get(i); points.push([point.x, point.y, point.z]); } addLine(lines, points, bounds); } }
    canvas.addEventListener('pointerdown', function (event) { drag = { x: event.clientX, angle: angle }; canvas.setPointerCapture(event.pointerId); });
    canvas.addEventListener('pointermove', function (event) { if (drag) { angle = drag.angle + (event.clientX - drag.x) * .012; draw(); } });
    canvas.addEventListener('pointerup', function () { drag = null; });
    canvas.addEventListener('wheel', function (event) { event.preventDefault(); zoom = Math.max(.55, Math.min(2.3, zoom - event.deltaY * .001)); draw(); }, { passive: false });
    window.addEventListener('resize', resize);
    fetch(preview.getAttribute('data-model-url')).then(function (response) { if (!response.ok) throw new Error('model fetch failed'); return response.arrayBuffer(); }).then(function (buffer) { var file = rhino.File3dm.fromByteArray(new Uint8Array(buffer)); var lines = [], bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }; for (var i = 0; i < file.objects().count; i += 1) readGeometry(file.objects().get(i).geometry(), lines, bounds); if (!lines.length) throw new Error('no preview geometry'); preview._lines = lines; preview._bounds = bounds; setStatus(preview, 'ONLINE'); resize(); }).catch(function () { setStatus(preview, 'PREVIEW UNAVAILABLE'); });
  }
}());
