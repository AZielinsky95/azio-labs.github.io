(() => {
  const host = document.querySelector('.mosaic-portrait');
  if (!host) return;
  const photo = host.querySelector('img'), canvas = host.querySelector('canvas'), replay = host.querySelector('button');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const cells = [], pointer = { x: -1000, y: -1000, active: false };
  let scale = 1, frame = 0, previous = 0, visible = true, pulseUntil = 0;
  let randomState = 417;
  function random() { randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0; return randomState / 4294967296; }

  // Intersect the current polygon with the half-plane closer to site p than q.
  // Repeating for all sites constructs the exact Euclidean Voronoi cell.
  function clip(poly, nx, ny, limit) {
    const next = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const da = a[0] * nx + a[1] * ny - limit, db = b[0] * nx + b[1] * ny - limit;
      if (da <= 0) next.push(a);
      if ((da < 0) !== (db < 0)) {
        const t = da / (da - db);
        next.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
      }
    }
    return next;
  }
  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.lineWidth = .45;
    for (const cell of cells) {
      ctx.save(); ctx.translate(cell.x, cell.y);
      ctx.fillStyle = cell.color;
      ctx.fill(cell.path);
      if (Math.abs(cell.x) + Math.abs(cell.y) > .4) {
        ctx.strokeStyle = 'rgba(250,128,111,.85)'; ctx.stroke(cell.path);
      }
      ctx.restore();
    }
  }
  function tick(now) {
    frame = 0;
    if (!visible || document.hidden || reduced.matches) return;
    const dt = Math.min((now - previous) / 16.667, 2); previous = now;
    if (pulseUntil && now > pulseUntil) { pulseUntil = 0; pointer.active = false; }
    let moving = false;
    for (const cell of cells) {
      let tx = 0, ty = 0;
      if (pointer.active) {
        const dx = cell.cx - pointer.x, dy = cell.cy - pointer.y, distance = Math.hypot(dx, dy);
        if (distance < 52) {
          const force = (1 - distance / 52) ** 2 * 10;
          const angle = Math.atan2(dy, dx);
          tx = Math.cos(angle) * force; ty = Math.sin(angle) * force;
        }
      }
      cell.vx = (cell.vx + (tx - cell.x) * .07 * dt) * Math.pow(.74, dt);
      cell.vy = (cell.vy + (ty - cell.y) * .07 * dt) * Math.pow(.74, dt);
      cell.x += cell.vx * dt; cell.y += cell.vy * dt;
      if (Math.abs(tx - cell.x) + Math.abs(ty - cell.y) + Math.abs(cell.vx) + Math.abs(cell.vy) > .02) moving = true;
      else { cell.x = tx; cell.y = ty; cell.vx = cell.vy = 0; }
    }
    draw();
    if (moving || pulseUntil) frame = requestAnimationFrame(tick);
  }
  function wake() {
    if (!frame && cells.length && visible && !document.hidden && !reduced.matches) {
      previous = performance.now(); frame = requestAnimationFrame(tick);
    }
  }
  function reset() {
    cancelAnimationFrame(frame); frame = 0; pulseUntil = 0; pointer.active = false;
    cells.forEach(cell => { cell.x = cell.y = cell.vx = cell.vy = 0; }); draw();
  }
  function resize() {
    const width = canvas.getBoundingClientRect().width, dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(width * 260 / 240 * dpr);
    scale = canvas.width / 240; draw();
  }
  function build() {
    if (!photo.naturalWidth || cells.length) return;
    const n = 160, sample = document.createElement('canvas');
    sample.width = sample.height = n;
    const sampleContext = sample.getContext('2d', { willReadFrequently: true });
    if (!sampleContext) return;
    const crop = Math.min(photo.naturalWidth, photo.naturalHeight) * .75;
    sampleContext.drawImage(photo, (photo.naturalWidth - crop) / 2, photo.naturalHeight * .05, crop, crop, 0, 0, n, n);
    let pixels;
    try { pixels = sampleContext.getImageData(0, 0, n, n).data; } catch { return; }
    const background = new Uint8Array(n * n), visited = new Uint8Array(n * n), queue = [];
    for (let i = 0; i < n; i++) queue.push(i, (n - 1) * n + i, i * n, i * n + n - 1);
    for (let k = 0; k < queue.length; k++) {
      const i = queue[k]; if (visited[i]) continue; visited[i] = 1;
      const r = pixels[i * 4], g = pixels[i * 4 + 1], b = pixels[i * 4 + 2];
      if (r * .2126 + g * .7152 + b * .0722 < 143 || Math.max(r, g, b) - Math.min(r, g, b) > 24) continue;
      background[i] = 1;
      const x = i % n, y = Math.floor(i / n);
      if (x) queue.push(i - 1); if (x < n - 1) queue.push(i + 1);
      if (y) queue.push(i - n); if (y < n - 1) queue.push(i + n);
    }
    const sites = [];
    for (let y = 0; y < 20; y++) for (let x = 0; x < 18; x++) {
      sites.push([10 + (x + .15 + random() * .7) / 18 * 220, 12 + (y + .15 + random() * .7) / 20 * 220]);
    }
    // Smaller cells around the face retain eyes, mouth, and expression.
    for (let i = 0; i < 230; i++) {
      const angle = random() * Math.PI * 2, radius = Math.sqrt(random());
      sites.push([118 + Math.cos(angle) * radius * 53, 115 + Math.sin(angle) * radius * 75]);
    }
    const pixelAt = (x, y) => Math.max(0, Math.min(n - 1, Math.floor((y - 12) / 220 * n))) * n + Math.max(0, Math.min(n - 1, Math.floor((x - 10) / 220 * n)));
    for (let i = 0; i < sites.length; i++) {
      const p = sites[i];
      if (background[pixelAt(...p)]) continue;
      let poly = [[10,12],[230,12],[230,232],[10,232]];
      for (let j = 0; j < sites.length && poly.length; j++) {
        if (i === j) continue;
        const q = sites[j], nx = q[0] - p[0], ny = q[1] - p[1];
        poly = clip(poly, nx, ny, (q[0] ** 2 + q[1] ** 2 - p[0] ** 2 - p[1] ** 2) / 2);
      }
      if (poly.length < 3) continue;
      const cx = poly.reduce((sum,v) => sum + v[0], 0) / poly.length;
      const cy = poly.reduce((sum,v) => sum + v[1], 0) / poly.length;
      const color = [0, 0, 0]; let count = 0;
      for (const [ox,oy] of [[0,0],[-1.5,0],[1.5,0],[0,-1.5],[0,1.5]]) {
        const index = pixelAt(p[0] + ox, p[1] + oy); if (background[index]) continue;
        for (let c = 0; c < 3; c++) color[c] += pixels[index * 4 + c]; count++;
      }
      const path = new Path2D();
      poly.forEach((v,k) => {
        const x = cx + (v[0] - cx) * .95, y = cy + (v[1] - cy) * .95;
        if (!k) path.moveTo(x,y); else path.lineTo(x,y);
      });
      path.closePath();
      const rgb = color.map(v => Math.min(245, Math.round(v / Math.max(1,count) * 1.12 + 12)));
      cells.push({ path, cx, cy, color: `rgb(${rgb.join(',')})`, x:0, y:0, vx:0, vy:0 });
    }
    resize(); host.classList.add('mosaic-ready'); replay.hidden = false; replay.disabled = reduced.matches;
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
  canvas.addEventListener('pointermove', track); canvas.addEventListener('pointerdown', track);
  canvas.addEventListener('pointerleave', () => { pointer.active = false; wake(); });
  canvas.addEventListener('pointercancel', () => { pointer.active = false; wake(); });
  replay.addEventListener('click', () => {
    pointer.x = 120; pointer.y = 110; pointer.active = true; pulseUntil = performance.now() + 450; wake();
  });
  reduced.addEventListener('change', () => { replay.disabled = reduced.matches; reset(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (!visible) reset(); }).observe(host);
  new ResizeObserver(resize).observe(canvas);
  photo.addEventListener('load', build, { once: true });
  if (photo.complete) build();
})();
