(() => {
  'use strict';

  const viewer = document.querySelector('.core-viewer');
  if (!viewer) return;
  const stage = viewer.querySelector('.core-stage');
  const status = viewer.querySelector('.core-render-status');
  if (!CSS.supports('transform-style', 'preserve-3d')) {
    status.textContent = 'Product illustration';
    stage.hidden = true;
    viewer.querySelectorAll('[data-core-control]').forEach(button => { button.hidden = true; });
    viewer.querySelector('.core-help').textContent = 'Explore a product below';
    return;
  }

  const camera = document.createElement('div');
  camera.className = 'spatial-camera';
  camera.setAttribute('aria-hidden', 'true');
  const faces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
  function cube(size, className, mark = '') {
    const element = document.createElement('div');
    element.className = `spatial-cube ${className}`;
    element.style.setProperty('--cube-size', `${size}px`);
    element.innerHTML = faces.map(face => `<div class="cube-face face-${face}">${face === 'front' ? mark : '<span class="face-line"></span>'}</div>`).join('');
    return element;
  }
  const core = cube(128, 'main-crystal', '<span class="crystal-monogram">MK<small>AGENCYOS</small></span>');
  camera.append(core);
  const inner = cube(70, 'inner-crystal');
  camera.append(inner);
  for (let i = 0; i < 3; i++) {
    const ring = document.createElement('div');
    ring.className = `spatial-ring spatial-ring-${i + 1}`;
    ring.innerHTML = '<span class="ring-spark"></span>';
    camera.append(ring);
  }
  const satellites = [
    { x: -166, y: -60, z: 35, label: '★', color: '#9cebd4' },
    { x: 160, y: -62, z: -60, label: '◷', color: '#9edafa' },
    { x: 129, y: 88, z: 62, label: '↗', color: '#c5b8ff' },
    { x: -130, y: 78, z: -78, label: '▦', color: '#c4e9de' },
  ];
  satellites.forEach((item, i) => {
    const satellite = cube(35, `satellite satellite-${i + 1}`, `<span>${item.label}</span>`);
    satellite.style.setProperty('--sat-x', `${item.x}px`);
    satellite.style.setProperty('--sat-y', `${item.y}px`);
    satellite.style.setProperty('--sat-z', `${item.z}px`);
    satellite.style.setProperty('--sat-color', item.color);
    camera.append(satellite);
  });
  const floor = document.createElement('div');
  floor.className = 'spatial-floor';
  camera.append(floor);
  for (let i = 0; i < 18; i++) {
    const star = document.createElement('span');
    star.className = 'spatial-star';
    star.style.transform = `translate3d(${(i * 73 % 420) - 210}px, ${(i * 47 % 250) - 125}px, ${(i * 61 % 240) - 120}px)`;
    star.style.opacity = String(.25 + (i % 4) * .13);
    camera.append(star);
  }
  stage.append(camera);
  viewer.classList.add('spatial-ready');
  status.textContent = 'Interactive 3D';

  const sparks = camera.querySelectorAll('.ring-spark');
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let targetX = -18, targetY = -28, rotationX = targetX, rotationY = targetY;
  let time = 0, zoom = 1, request = 0, last = 0, visible = false, baseScale = 1;
  let dragStart = null, dragging = false;
  const canMove = () => document.documentElement.dataset.motion !== 'off' && !motionQuery.matches;
  function render(now) {
    request = 0;
    if (!visible || document.hidden) { last = 0; return; }
    const delta = last ? Math.min((now - last) / 1000, .05) : 0;
    last = now;
    const moving = canMove();
    if (moving && !dragging) time += delta;
    rotationX += (targetX - rotationX) * (moving ? .18 : 1);
    rotationY += (targetY - rotationY) * (moving ? .18 : 1);
    camera.style.transform = `translate(-50%, -50%) scale(${zoom * baseScale}) rotateX(${rotationX}deg) rotateY(${rotationY + Math.sin(time * .14) * 12}deg)`;
    core.style.transform = `translate3d(-50%, -50%, 0) rotateY(${time * 6}deg) rotateZ(15deg)`;
    inner.style.transform = `translate3d(-50%, -50%, 0) rotateY(${-time * 9}deg) rotateZ(-25deg)`;
    sparks.forEach((spark, index) => { spark.style.transform = `rotate(${time * (12 + index * 5)}deg)`; });
    if (moving || dragging || Math.abs(rotationX - targetX) + Math.abs(rotationY - targetY) > .01) request = requestAnimationFrame(render);
  }
  function wake() { if (!request) request = requestAnimationFrame(render); }
  function reset() { targetX = -18; targetY = -28; zoom = 1; time = 0; wake(); }
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) wake(); else { cancelAnimationFrame(request); request = 0; last = 0; }
  }, { threshold: .01 }).observe(viewer);

  stage.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragStart = { x: event.clientX, y: event.clientY, rx: targetX, ry: targetY };
    dragging = false;
  });
  stage.addEventListener('pointermove', event => {
    if (!dragStart) return;
    const dx = event.clientX - dragStart.x, dy = event.clientY - dragStart.y;
    if (!dragging) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      if (event.pointerType !== 'mouse' && Math.abs(dy) > Math.abs(dx)) { dragStart = null; return; }
      dragging = true;
      stage.setPointerCapture(event.pointerId);
      viewer.classList.add('is-dragging');
    }
    targetY = dragStart.ry + dx * .35;
    targetX = Math.max(-55, Math.min(55, dragStart.rx - dy * .25));
    wake();
  });
  function release() { dragStart = null; dragging = false; viewer.classList.remove('is-dragging'); wake(); }
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener('lostpointercapture', release);
  stage.addEventListener('keydown', event => {
    const action = {
      ArrowLeft: () => { targetY -= 12; }, ArrowRight: () => { targetY += 12; },
      ArrowUp: () => { targetX = Math.max(-55, targetX - 10); },
      ArrowDown: () => { targetX = Math.min(55, targetX + 10); }, Home: reset,
    }[event.key];
    if (action) { event.preventDefault(); action(); wake(); }
  });
  viewer.querySelector('[data-core-control="reset"]').addEventListener('click', reset);
  viewer.querySelector('[data-core-control="in"]').addEventListener('click', () => { zoom = Math.min(1.3, zoom + .1); wake(); });
  viewer.querySelector('[data-core-control="out"]').addEventListener('click', () => { zoom = Math.max(.7, zoom - .1); wake(); });
  document.addEventListener('mk:motion', wake);
  motionQuery.addEventListener('change', wake);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(request); request = 0; last = 0; }
    else wake();
  });
  new ResizeObserver(() => { baseScale = Math.min(1, stage.clientWidth / 520); wake(); }).observe(stage);
  wake();
})();
