(() => {
  'use strict';

  const html = document.documentElement;
  const motionButton = document.querySelector('.motion-toggle');
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  let savedMotion = null;
  try { savedMotion = localStorage.getItem('mk-motion'); } catch { /* Storage is optional. */ }
  let motionOff = motionPreference.matches || savedMotion === 'off';
  function applyMotion() {
    if (motionPreference.matches) {
      html.dataset.motion = 'off';
      motionButton.textContent = 'Motion reduced';
      motionButton.disabled = true;
      motionButton.setAttribute('aria-pressed', 'true');
      motionButton.setAttribute('aria-label', 'Reduced motion follows your device settings');
      document.dispatchEvent(new Event('mk:motion'));
      return;
    }
    motionButton.disabled = false;
    html.dataset.motion = motionOff ? 'off' : 'on';
    motionButton.textContent = motionOff ? '▶ Motion off' : 'Ⅱ Motion on';
    motionButton.setAttribute('aria-pressed', String(motionOff));
    motionButton.setAttribute('aria-label', motionOff ? 'Enable page animations' : 'Pause page animations');
    document.dispatchEvent(new Event('mk:motion'));
  }
  motionButton.addEventListener('click', () => {
    motionOff = !motionOff; savedMotion = motionOff ? 'off' : 'on';
    try { localStorage.setItem('mk-motion', motionOff ? 'off' : 'on'); } catch { /* Storage is optional. */ }
    applyMotion();
  });
  motionPreference.addEventListener('change', event => {
    motionOff = event.matches || savedMotion === 'off';
    applyMotion();
  });
  applyMotion();

  const progress = document.querySelector('.reading-progress');
  let progressFrame = 0;
  function updateProgress() {
    progressFrame = 0;
    const distance = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${distance > 0 ? Math.min(scrollY / distance, 1) : 0})`;
  }
  addEventListener('scroll', () => { if (!progressFrame) progressFrame = requestAnimationFrame(updateProgress); }, { passive: true });
  addEventListener('resize', updateProgress);
  updateProgress();

  const products = document.querySelector('.product-studio');
  document.querySelectorAll('[data-explore-product]').forEach(link => {
    link.addEventListener('click', () => products.querySelector(`[data-product="${link.dataset.exploreProduct}"]`)?.click());
  });

  const scenes = {
    review: { position: '0%', name: 'ReviewBoost', title: 'Listen. Respond. Build trust.', copy: 'Invite honest feedback. Give customer concerns an owner. Follow through after resolution.', tags: ['Invite', 'Listen', 'Respond', 'Follow through'] },
    service: { position: '33.333%', name: 'Service Follow-up', title: 'Keep the next visit in view.', copy: 'A due date becomes a reminder. Customers can request a slot or callback; the team confirms the appointment.', tags: ['Plan', 'Remind', 'Request', 'Confirm'] },
    crm: { position: '66.666%', name: 'Lead Management CRM', title: 'Every enquiry. A next step.', copy: 'Capture the requirement, assign ownership and organize the next conversation. Live CRM intake requires reconnection.', tags: ['Capture', 'Assign', 'Follow up', 'Review'] },
    agency: { position: '100%', name: 'AgencyOS', title: 'Your business. Connected.', copy: 'A business workspace brings enabled products, team access and shared integrations together.', tags: ['Workspace', 'Products', 'Connect', 'Track'] },
  };
  const dialog = document.querySelector('#cinema-dialog');
  const openButton = document.querySelector('.open-cinema');
  if (!dialog || !openButton || typeof dialog.showModal !== 'function') {
    if (openButton) openButton.hidden = true;
    return;
  }
  const keys = ['review', 'service', 'crm', 'agency'];
  let active = 'review';
  let returnToWorkflow = false;
  function drawScene(key) {
    active = key;
    const scene = scenes[key];
    dialog.style.setProperty('--scene-position', scene.position);
    dialog.querySelector('#cinema-title').textContent = scene.title;
    dialog.querySelector('.cinema-product').textContent = scene.name;
    dialog.querySelector('#cinema-description').textContent = scene.copy;
    dialog.querySelector('.cinema-count').textContent = `0${keys.indexOf(key) + 1} / 04`;
    const tags = scene.tags.map((text, i) => {
      const item = document.createElement('span');
      item.textContent = `0${i + 1} ${text}`;
      return item;
    });
    dialog.querySelector('.cinema-tags').replaceChildren(...tags);
    dialog.querySelectorAll('[data-cinema-product]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.cinemaProduct === key));
    });
  }
  function step(direction) { drawScene(keys[(keys.indexOf(active) + direction + keys.length) % keys.length]); }
  openButton.addEventListener('click', () => {
    drawScene(products.querySelector('[data-product][aria-pressed="true"]')?.dataset.product || 'review');
    dialog.showModal();
    document.body.classList.add('cinema-open');
    dialog.querySelector('.cinema-close').focus();
  });
  dialog.querySelector('.cinema-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('cinema-open');
    if (returnToWorkflow) {
      products.querySelector('.product-switch [aria-pressed="true"]').focus();
      returnToWorkflow = false;
    } else {
      openButton.focus({ preventScroll: true });
    }
  });
  dialog.querySelector('[data-cinema-direction="previous"]').addEventListener('click', () => step(-1));
  dialog.querySelector('[data-cinema-direction="next"]').addEventListener('click', () => step(1));
  dialog.querySelectorAll('[data-cinema-product]').forEach(button => button.addEventListener('click', () => drawScene(button.dataset.cinemaProduct)));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      const controls = [...dialog.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]')]
        .filter(control => !control.disabled && !control.hidden && control.getClientRects().length);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
      return;
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); step(event.key === 'ArrowRight' ? 1 : -1); }
  });
  dialog.querySelector('.cinema-see-workflow').addEventListener('click', () => {
    products.querySelector(`[data-product="${active}"]`)?.click();
    returnToWorkflow = true;
    dialog.close();
  });

  // Decorative depth reacts to fine pointers without taking over touch scrolling.
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const artwork = document.querySelector('.product-art');
  if (artwork && finePointer.matches) {
    let frame = 0;
    artwork.addEventListener('pointermove', event => {
      if (motionOff) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = artwork.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        artwork.style.setProperty('--scene-rx', `${(0.5 - y) * 7}deg`);
        artwork.style.setProperty('--scene-ry', `${(x - 0.5) * 9}deg`);
        artwork.style.setProperty('--light-x', `${x * 100}%`);
        artwork.style.setProperty('--light-y', `${y * 100}%`);
      });
    });
    function clearDepth() {
      cancelAnimationFrame(frame);
      artwork.style.setProperty('--scene-rx', '0deg');
      artwork.style.setProperty('--scene-ry', '0deg');
    }
    artwork.addEventListener('pointerleave', clearDepth);
    document.addEventListener('mk:motion', clearDepth);
  }
})();
