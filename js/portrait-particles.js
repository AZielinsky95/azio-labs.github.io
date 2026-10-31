(() => {
  const host = document.querySelector('.particle-portrait');
  if (!host) return;
  const photo = host.querySelector('img');
  const canvas = host.querySelector('canvas');
  const replay = host.querySelector('button');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const groups = Array.from({ length: 24 }, () => []);
  const particles = [];
  const pointer = { x: -1000, y: -1000, active: false };
  let raf = 0, previous = 0, visible = true, scale = 1, pulseUntil = 0;

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    groups.forEach((group, index) => {
      const shade = 68 + index * 7.5;
      ctx.fillStyle = `rgb(${shade},${shade * .94},${shade * .88})`;
      ctx.beginPath();
      for (const p of group) {
        ctx.moveTo(p.x + p.radius, p.y);
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      }
      ctx.fill();
    });
    // Displaced points briefly pick up the portfolio's coral accent.
    ctx.fillStyle = 'rgba(250,128,111,.2)';
    ctx.beginPath();
    for (const p of particles) {
      if (Math.abs(p.x - p.ox) + Math.abs(p.y - p.oy) < 1.5) continue;
      ctx.moveTo(p.x + p.radius, p.y);
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  function tick(now) {
    raf = 0;
    if (!visible || document.hidden || reduced.matches) return;
    const dt = Math.min((now - previous) / 16.667, 2);
    previous = now;
    if (pulseUntil && now > pulseUntil) { pointer.active = false; pulseUntil = 0; }
    let moving = false;
    for (const p of particles) {
      let tx = p.ox, ty = p.oy;
      if (pointer.active) {
        const dx = p.ox - pointer.x, dy = p.oy - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 40) {
          const push = (1 - distance / 40) ** 2 * 5;
          const angle = (distance < .1 ? p.ox * 3.1 : Math.atan2(dy, dx)) + Math.sin(p.ox * .43 + p.oy * .31) * .55;
          tx += Math.cos(angle) * push;
          ty += Math.sin(angle) * push;
        }
      }
      p.vx = (p.vx + (tx - p.x) * .065 * dt) * Math.pow(.76, dt);
      p.vy = (p.vy + (ty - p.y) * .065 * dt) * Math.pow(.76, dt);
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (Math.abs(tx - p.x) + Math.abs(ty - p.y) + Math.abs(p.vx) + Math.abs(p.vy) > .025) moving = true;
      else { p.x = tx; p.y = ty; p.vx = p.vy = 0; }
    }
    draw();
    if (moving || pulseUntil) raf = requestAnimationFrame(tick);
  }
  function wake() {
    if (!raf && particles.length && visible && !document.hidden && !reduced.matches) {
      previous = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }
  function reset() {
    cancelAnimationFrame(raf); raf = 0; pulseUntil = 0; pointer.active = false;
    particles.forEach(p => { p.x = p.ox; p.y = p.oy; p.vx = p.vy = 0; });
    draw();
  }
  function resize() {
    const width = canvas.getBoundingClientRect().width;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(width * 260 / 240 * dpr);
    scale = canvas.width / 240;
    draw();
  }
  function build() {
    if (!photo.naturalWidth || particles.length) return;
    const n = 56, sample = document.createElement('canvas');
    sample.width = sample.height = n;
    const sampleContext = sample.getContext('2d', { willReadFrequently: true });
    if (!sampleContext) return;
    const crop = Math.min(photo.naturalWidth, photo.naturalHeight) * .75;
    sampleContext.drawImage(photo, (photo.naturalWidth - crop) / 2, photo.naturalHeight * .05, crop, crop, 0, 0, n, n);
    let pixels;
    try { pixels = sampleContext.getImageData(0, 0, n, n).data; } catch { return; }

    // Use the supplied cutout alpha directly so only the person becomes points.
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = y * n + x;
      if (pixels[i * 4 + 3] < 128) continue;
      const lum = pixels[i * 4] * .2126 + pixels[i * 4 + 1] * .7152 + pixels[i * 4 + 2] * .0722;
      const tone = Math.pow(Math.max(0, Math.min(1, (lum - 25) / 185)), .8);
      const fade = Math.min(1, (n - y) / 16);
      const ox = 10 + (x + .5) / n * 220, oy = 12 + (y + .5) / n * 220;
      const p = { ox, oy, x: ox, y: oy, vx: 0, vy: 0, radius: (1.1 + tone * .5) * fade };
      particles.push(p); groups[Math.min(23, Math.floor(tone * 24))].push(p);
    }
    resize();
    host.classList.add('particles-ready');
    replay.hidden = false;
    replay.disabled = reduced.matches;
  }
  function track(event) {
    if (reduced.matches || (event.pointerType === 'touch' && event.type === 'pointermove')) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width * 240;
    pointer.y = (event.clientY - rect.top) / rect.height * 260;
    pointer.active = true;
    if (event.pointerType === 'touch') pulseUntil = performance.now() + 350;
    wake();
  }
  canvas.addEventListener('pointermove', track);
  canvas.addEventListener('pointerdown', track);
  canvas.addEventListener('pointerleave', () => { pointer.active = false; wake(); });
  canvas.addEventListener('pointercancel', () => { pointer.active = false; wake(); });
  replay.addEventListener('click', () => {
    pointer.x = 120; pointer.y = 110; pointer.active = true;
    pulseUntil = performance.now() + 450; wake();
  });
  reduced.addEventListener('change', () => { replay.disabled = reduced.matches; reset(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (!visible) reset(); }).observe(host);
  new ResizeObserver(resize).observe(canvas);
  photo.addEventListener('load', build, { once: true });
  if (photo.complete) build();
})();
