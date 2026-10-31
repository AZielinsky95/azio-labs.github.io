(() => {
  const host = document.querySelector('.ascii-portrait');
  if (!host) return;
  const photo = host.querySelector('img'), canvas = host.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const glyphs = [], ramp = '.:-=+*#%@';
  const pointer = { x:-1000, y:-1000, active:false };
  let scale = 1, frame = 0, previous = 0, visible = true, pulseUntil = 0;

  function draw() {
    ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.setTransform(scale,0,0,scale,0,0);
    ctx.font = '5.6px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const glyph of glyphs) {
      const displaced = Math.abs(glyph.x-glyph.ox)+Math.abs(glyph.y-glyph.oy);
      ctx.fillStyle = displaced > 1.2 ? '#ffa58e' : glyph.color;
      ctx.globalAlpha = glyph.alpha;
      ctx.fillText(glyph.character,glyph.x,glyph.y);
    }
    ctx.globalAlpha = 1;
  }
  function tick(now) {
    frame = 0; if (!visible || document.hidden || reduced.matches) return;
    const dt = Math.min((now-previous)/16.667,2); previous=now;
    if(pulseUntil && now>pulseUntil){pulseUntil=0;pointer.active=false;}
    let moving=false;
    for(const g of glyphs){
      let tx=g.ox,ty=g.oy;
      if(pointer.active){
        const dx=g.ox-pointer.x,dy=g.oy-pointer.y,distance=Math.hypot(dx,dy);
        if(distance<40){const force=(1-distance/40)**2*3,angle=Math.atan2(dy,dx);tx+=Math.cos(angle)*force;ty+=Math.sin(angle)*force;}
      }
      const ease=1-Math.pow(.82,dt);g.x+=(tx-g.x)*ease;g.y+=(ty-g.y)*ease;
      if(Math.abs(tx-g.x)+Math.abs(ty-g.y)>.015)moving=true;
      else{g.x=tx;g.y=ty;}
    }
    draw();if(moving||pulseUntil)frame=requestAnimationFrame(tick);
  }
  function wake(){if(!frame&&glyphs.length&&visible&&!document.hidden&&!reduced.matches){previous=performance.now();frame=requestAnimationFrame(tick);}}
  function reset(){cancelAnimationFrame(frame);frame=0;pointer.active=false;pulseUntil=0;glyphs.forEach(g=>{g.x=g.ox;g.y=g.oy;});draw();}
  function resize(){const width=canvas.getBoundingClientRect().width,dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(width*260/240*dpr);scale=canvas.width/240;draw();}
  function build(){
    if(!photo.naturalWidth||glyphs.length)return;
    const cols=52,rows=50,sample=document.createElement('canvas');sample.width=cols;sample.height=rows;
    const source=sample.getContext('2d',{willReadFrequently:true});if(!source)return;
    // Head-only crop of the transparent beach portrait: hair through chin.
    const cropX=photo.naturalWidth*.315,cropY=photo.naturalHeight*.045;
    const cropWidth=photo.naturalWidth*.355,cropHeight=photo.naturalHeight*.465;
    source.drawImage(photo,cropX,cropY,cropWidth,cropHeight,0,0,cols,rows);
    const drawHeight=244,drawWidth=drawHeight*cropWidth/cropHeight,drawLeft=(240-drawWidth)/2;
    let pixels;try{pixels=source.getImageData(0,0,cols,rows).data;}catch{return;}
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const i=(y*cols+x)*4;if(pixels[i+3]<128)continue;
      const lum=pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722;
      const tone=Math.pow(Math.max(0,Math.min(1,(lum-20)/190)),.85);
      const character=ramp[Math.min(ramp.length-1,Math.floor(tone*ramp.length))];
      const shade=.58+tone*.42,ox=drawLeft+(x+.5)/cols*drawWidth,oy=8+(y+.5)/rows*drawHeight;
      glyphs.push({ox,oy,x:ox,y:oy,character,color:`rgb(${Math.round(250*shade)},${Math.round(128*shade)},${Math.round(111*shade)})`,alpha:Math.min(1,(rows-y)/2)});
    }
    resize();host.classList.add('ascii-ready');
  }
  function track(e){if(reduced.matches||(e.pointerType==='touch'&&e.type==='pointermove'))return;const r=canvas.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width*240;pointer.y=(e.clientY-r.top)/r.height*260;pointer.active=true;if(e.pointerType==='touch')pulseUntil=performance.now()+300;wake();}
  canvas.addEventListener('pointermove',track);canvas.addEventListener('pointerdown',track);
  canvas.addEventListener('pointerleave',()=>{pointer.active=false;wake();});canvas.addEventListener('pointercancel',()=>{pointer.active=false;wake();});
  reduced.addEventListener('change',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)reset();}).observe(host);
  new ResizeObserver(resize).observe(canvas);photo.addEventListener('load',build,{once:true});if(photo.complete)build();
})();
