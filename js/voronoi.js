(() => {
  const canvas = document.querySelector('.voronoi-background');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 760px), (pointer: coarse)');
  const edgePairs = [[], [3, 0], [0, 1], [3, 1], [1, 2], null, [0, 2], [3, 2], [2, 3], [0, 2], null, [1, 2], [1, 3], [0, 1], [3, 0], []];
  const seeds = Array.from({ length: 20 }, (_, i) => ({
    x: (i % 5) / 4,
    y: Math.floor(i / 5) / 3,
    phase: i * 2.39996,
  }));
  const points = new Float32Array(seeds.length * 2);
  let width, height, cols, rows, dx, dy, dpr, field;
  let time = 5, last = 0, frame = 0;

  // Trace an edge without allocating a new point array for every segment.
  function trace(edge, px, py, level, a, b, c, d, move) {
    let x, y;
    if (edge === 0) { x = px + dx * (level - a) / (b - a); y = py; }
    else if (edge === 1) { x = px + dx; y = py + dy * (level - b) / (c - b); }
    else if (edge === 2) { x = px + dx * (level - d) / (c - d); y = py + dy; }
    else { x = px; y = py + dy * (level - a) / (d - a); }
    if (move) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#141313';
    ctx.fillRect(0, 0, width, height);
    const scale = Math.max(620, width);
    seeds.forEach((seed, i) => {
      points[i * 2] = seed.x * scale + Math.sin(time * .065 + seed.phase) * 85;
      points[i * 2 + 1] = seed.y * Math.max(height, 650) + Math.cos(time * .055 + seed.phase * 1.7) * 85;
    });

    // Euclidean Voronoi distance field: F1 and F2 are distances to the two
    // nearest moving sites. Their equality defines the actual cell boundaries.
    // Smooth the F1 creases near boundaries, then trace its contour bands.
    const blend = 85;
    for (let y = 0; y <= rows; y++) {
      for (let x = 0; x <= cols; x++) {
        let first = Infinity, second = Infinity;
        const px = x * dx, py = y * dy;
        for (let i = 0; i < points.length; i += 2) {
          const distanceSquared = (px - points[i]) ** 2 + (py - points[i + 1]) ** 2;
          if (distanceSquared < first) { second = first; first = distanceSquared; }
          else if (distanceSquared < second) second = distanceSquared;
        }
        first = Math.sqrt(first); second = Math.sqrt(second);
        const h = Math.max(blend - (second - first), 0) / blend;
        field[y * (cols + 1) + x] = first - h * h * blend * .25;
      }
    }

    // Marching squares only traces the Voronoi field; it does not generate it.
    ctx.beginPath();
    const spacing = 23;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const offset = y * (cols + 1) + x;
        const a = field[offset], b = field[offset + 1], c = field[offset + cols + 2], d = field[offset + cols + 1];
        const min = Math.min(a, b, c, d), max = Math.max(a, b, c, d), px = x * dx, py = y * dy;
        for (let level = Math.ceil(min / spacing) * spacing; level < max; level += spacing) {
          const mask = (a >= level ? 1 : 0) | (b >= level ? 2 : 0) | (c >= level ? 4 : 0) | (d >= level ? 8 : 0);
          let edges = edgePairs[mask];
          if (!edges) {
            const center = (a + b + c + d) / 4;
            edges = (mask === 5) === (center >= level) ? [0, 1, 2, 3] : [3, 0, 1, 2];
          }
          for (let k = 0; k < edges.length; k += 2) {
            trace(edges[k], px, py, level, a, b, c, d, true);
            trace(edges[k + 1], px, py, level, a, b, c, d, false);
          }
        }
      }
    }
    ctx.strokeStyle = 'rgba(238, 233, 224, .12)';
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function active() { return !document.hidden && !reducedMotion.matches; }
  function tick(now) {
    frame = 0;
    if (!active()) return;
    if (now - last >= 1000 / (compact.matches ? 12 : 24)) {
      time += Math.min((now - last) / 1000, .1);
      last = now;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = performance.now();
    if (active()) frame = requestAnimationFrame(tick);
  }
  function resize(force = false) {
    const rect = canvas.getBoundingClientRect();
    const nextWidth = Math.round(rect.width), nextHeight = Math.round(rect.height);
    if (!nextWidth || !nextHeight || (!force && nextWidth === width && nextHeight === height)) return;
    width = nextWidth; height = nextHeight;
    // Cap grid work and output resolution independently of display pixel density.
    const step = Math.max(compact.matches ? 10 : 7, Math.sqrt(width * height / (compact.matches ? 6000 : 18000)));
    cols = Math.ceil(width / step); rows = Math.ceil(height / step);
    dx = width / cols; dy = height / rows;
    dpr = Math.min(devicePixelRatio || 1, compact.matches ? 1 : 1.25);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    field = new Float32Array((cols + 1) * (rows + 1));
    draw(); sync();
  }
  reducedMotion.addEventListener('change', sync);
  compact.addEventListener('change', () => resize(true));
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame));
  window.addEventListener('pageshow', sync);
  new ResizeObserver(() => resize()).observe(canvas);
  resize();
})();
