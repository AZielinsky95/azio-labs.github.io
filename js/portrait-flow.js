(() => {
  const host = document.querySelector('.flow-portrait');
  if (!host) return;
  const photo = host.querySelector('img'), canvas = host.querySelector('canvas'), button = host.querySelector('button');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const strands = [], pointer = { x:120, y:110, targetX:120, targetY:110, active:false };
  let scale = 1, strength = 0, frame = 0, previous = 0, pulseUntil = 0, visible = true;
  let randomState = 241;
  function random() { randomState = (Math.imul(randomState,1664525) + 1013904223) >>> 0; return randomState / 4294967296; }

  function draw() {
    ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.setTransform(scale,0,0,scale,0,0); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const strand of strands) {
      const nearby = strength * Math.max(0, 1 - Math.hypot(strand.cx - pointer.x,strand.cy - pointer.y) / 65);
      ctx.strokeStyle = nearby > .1 ? `rgb(${strand.tone + (250 - strand.tone) * nearby * .65},${strand.tone * .94 + (128 - strand.tone * .94) * nearby * .65},${strand.tone * .86 + (111 - strand.tone * .86) * nearby * .65})` : strand.color;
      ctx.lineWidth = strand.width;
      ctx.beginPath();
      for (let i = 0; i < strand.points.length; i += 2) {
        let x = strand.points[i], y = strand.points[i + 1];
        if (strength > .001) {
          const dx = x - pointer.x, dy = y - pointer.y, distance = Math.hypot(dx,dy);
          const angle = strength * Math.max(0,1 - distance / 65) ** 2 * 1.15;
          if (angle) {
            x = pointer.x + dx * Math.cos(angle) - dy * Math.sin(angle);
            y = pointer.y + dx * Math.sin(angle) + dy * Math.cos(angle);
          }
        }
        if (!i) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();
    }
  }
  function tick(now) {
    frame = 0;
    if (!visible || document.hidden || reduced.matches) return;
    const dt = Math.min((now - previous) / 16.667,2); previous = now;
    if (pulseUntil && now > pulseUntil) { pulseUntil = 0; pointer.active = false; }
    const target = pointer.active ? 1 : 0, ease = 1 - Math.pow(.85,dt);
    strength += (target - strength) * ease;
    pointer.x += (pointer.targetX - pointer.x) * ease;
    pointer.y += (pointer.targetY - pointer.y) * ease;
    const unsettled = Math.abs(target - strength) > .003 || Math.hypot(pointer.targetX - pointer.x,pointer.targetY - pointer.y) > .05;
    if (!unsettled) { strength = target; pointer.x = pointer.targetX; pointer.y = pointer.targetY; }
    draw();
    if (unsettled || pulseUntil) frame = requestAnimationFrame(tick);
  }
  function wake() {
    if (!frame && strands.length && visible && !document.hidden && !reduced.matches) {
      previous = performance.now(); frame = requestAnimationFrame(tick);
    }
  }
  function reset() {
    cancelAnimationFrame(frame); frame = 0; strength = 0; pointer.active = false; pulseUntil = 0; draw();
  }
  function resize() {
    const width = canvas.getBoundingClientRect().width, dpr = Math.min(devicePixelRatio || 1,2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(width * 260 / 240 * dpr);
    scale = canvas.width / 240; draw();
  }
  function build() {
    if (!photo.naturalWidth || strands.length) return;
    const n = 160, sample = document.createElement('canvas'); sample.width = sample.height = n;
    const sampling = sample.getContext('2d',{willReadFrequently:true}); if (!sampling) return;
    const crop = Math.min(photo.naturalWidth,photo.naturalHeight) * .75;
    sampling.drawImage(photo,(photo.naturalWidth - crop) / 2,photo.naturalHeight * .05,crop,crop,0,0,n,n);
    let pixels; try { pixels = sampling.getImageData(0,0,n,n).data; } catch { return; }
    const gray = new Float32Array(n*n), blurred = new Float32Array(n*n), angles = new Float32Array(n*n);
    const background = new Uint8Array(n*n), seen = new Uint8Array(n*n), queue = [];
    for (let i = 0; i < n*n; i++) gray[i] = pixels[i*4]*.2126 + pixels[i*4+1]*.7152 + pixels[i*4+2]*.0722;
    for (let i = 0; i < n; i++) queue.push(i,(n-1)*n+i,i*n,i*n+n-1);
    for (let k = 0; k < queue.length; k++) {
      const i = queue[k]; if (seen[i]) continue; seen[i] = 1;
      const r = pixels[i*4], g = pixels[i*4+1], b = pixels[i*4+2];
      if (gray[i] < 143 || Math.max(r,g,b) - Math.min(r,g,b) > 24) continue;
      background[i] = 1; const x = i % n, y = Math.floor(i/n);
      if (x) queue.push(i-1); if (x<n-1) queue.push(i+1);
      if (y) queue.push(i-n); if (y<n-1) queue.push(i+n);
    }
    const index = (x,y) => Math.max(0,Math.min(n-1,Math.round(y)))*n + Math.max(0,Math.min(n-1,Math.round(x)));
    // A smoothed image gradient supplies the tangent direction along facial contours.
    for (let y=0;y<n;y++) for (let x=0;x<n;x++) {
      let total=0,weight=0;
      for (let oy=-2;oy<=2;oy++) for (let ox=-2;ox<=2;ox++) {
        const w=(3-Math.abs(ox))*(3-Math.abs(oy));total+=gray[index(x+ox,y+oy)]*w;weight+=w;
      }
      blurred[y*n+x]=total/weight;
    }
    for (let y=0;y<n;y++) for (let x=0;x<n;x++) {
      const gx=blurred[index(x+1,y)]-blurred[index(x-1,y)],gy=blurred[index(x,y+1)]-blurred[index(x,y-1)];
      const tangent=Math.atan2(gy,gx)+Math.PI/2;
      const curl=-.7 + .65*Math.sin(x*.045+y*.017) + .45*Math.cos(y*.05-x*.02);
      const confidence=Math.min(1,Math.hypot(gx,gy)/9);
      // Doubled angles blend line orientations without introducing 180-degree flips.
      angles[y*n+x]=Math.atan2(Math.sin(2*tangent)*confidence+Math.sin(2*curl)*(1-confidence),Math.cos(2*tangent)*confidence+Math.cos(2*curl)*(1-confidence))/2;
    }
    function trace(sx,sy,direction,length) {
      const result=[];let x=sx,y=sy,angle=angles[index(x,y)]+(direction<0?Math.PI:0);
      for (let step=0;step<length;step++) {
        let next=angles[index(x,y)];
        if (Math.cos(next-angle)<0) next+=Math.PI;
        const turn=Math.atan2(Math.sin(next-angle),Math.cos(next-angle));angle+=turn*.45;
        x+=Math.cos(angle)*.85;y+=Math.sin(angle)*.85;
        if (x<1||y<1||x>n-2||y>n-2||background[index(x,y)]) break;
        result.push([10+x/n*220,12+y/n*220]);
      }
      return result;
    }
    for (let y=2;y<n-2;y+=2.6) for (let x=2;x<n-2;x+=2.6) {
      const sx=x+(random()-.5)*1.6,sy=y+(random()-.5)*1.6,i=index(sx,sy);
      if (background[i]) continue;
      const length=5+Math.floor(random()*5),cx=10+sx/n*220,cy=12+sy/n*220;
      const line=[...trace(sx,sy,-1,length).reverse(),[cx,cy],...trace(sx,sy,1,length)];
      if (line.length<4) continue;
      const tone=Math.round(Math.max(55,Math.min(230,45+gray[i]*.9)));
      const fade=Math.min(1,(n-sy)/16);
      strands.push({points:new Float32Array(line.flat()),cx,cy,tone,color:`rgb(${tone},${tone*.94},${tone*.86})`,width:(.35+gray[i]/255*.5)*fade});
    }
    resize(); host.classList.add('flow-ready');button.hidden=false;button.disabled=reduced.matches;
  }
  function track(event) {
    if (reduced.matches||(event.pointerType==='touch'&&event.type==='pointermove')) return;
    const rect=canvas.getBoundingClientRect();
    pointer.targetX=(event.clientX-rect.left)/rect.width*240;pointer.targetY=(event.clientY-rect.top)/rect.height*260;pointer.active=true;
    if (event.pointerType==='touch') pulseUntil=performance.now()+500;
    wake();
  }
  canvas.addEventListener('pointermove',track);canvas.addEventListener('pointerdown',track);
  canvas.addEventListener('pointerleave',()=>{pointer.active=false;wake();});
  canvas.addEventListener('pointercancel',()=>{pointer.active=false;wake();});
  button.addEventListener('click',()=>{pointer.targetX=120;pointer.targetY=110;pointer.active=true;pulseUntil=performance.now()+700;wake();});
  reduced.addEventListener('change',()=>{button.disabled=reduced.matches;reset();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)reset();}).observe(host);
  new ResizeObserver(resize).observe(canvas);
  photo.addEventListener('load',build,{once:true});if(photo.complete)build();
})();
