(() => {
  const host = document.querySelector('.editorial-points');
  if (!host) return;
  const photo = host.querySelector('img');
  const canvas = host.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const groups = Array.from({length: 16}, () => []);
  const points = [];
  const pointer = {x: -1000, y: -1000, active: false};
  let frame = 0, previous = 0, scale = 1, visible = true;
  const width = 240, height = 320;

  function draw() {
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.setTransform(scale,0,0,scale,0,0);
    groups.forEach((group,index) => {
      const shade = Math.round(20 + index * 3.4);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.beginPath();
      for (const p of group) {
        ctx.moveTo(p.x + p.radius,p.y);
        ctx.arc(p.x,p.y,p.radius,0,Math.PI * 2);
      }
      ctx.fill();
    });
  }
  function tick(now) {
    frame = 0;
    if (!visible || document.hidden || reduced.matches) return;
    const dt = Math.min((now-previous)/16.667,2); previous=now;
    let moving = false;
    for (const p of points) {
      let tx=p.ox, ty=p.oy;
      if (pointer.active) {
        const dx=p.ox-pointer.x,dy=p.oy-pointer.y,d=Math.hypot(dx,dy);
        if(d<34 && d>0){const push=(1-d/34)**2*3;tx+=dx/d*push;ty+=dy/d*push;}
      }
      const ease=1-Math.pow(.82,dt);
      p.x+=(tx-p.x)*ease; p.y+=(ty-p.y)*ease;
      if(Math.abs(tx-p.x)+Math.abs(ty-p.y)>.015) moving=true;
      else {p.x=tx;p.y=ty;}
    }
    draw();
    if(moving) frame=requestAnimationFrame(tick);
  }
  function wake(){if(!frame&&points.length&&visible&&!document.hidden&&!reduced.matches){previous=performance.now();frame=requestAnimationFrame(tick);}}
  function reset(){cancelAnimationFrame(frame);frame=0;pointer.active=false;points.forEach(p=>{p.x=p.ox;p.y=p.oy});draw();}
  function resize(){const w=canvas.getBoundingClientRect().width,dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(w*height/width*dpr);scale=canvas.width/width;draw();}
  function build(){
    if(!photo.naturalWidth||points.length)return;
    const cols=120,rows=160,sample=document.createElement('canvas');sample.width=cols;sample.height=rows;
    const source=sample.getContext('2d',{willReadFrequently:true});if(!source)return;
    source.drawImage(photo,0,0,cols,rows);
    let pixels;try{pixels=source.getImageData(0,0,cols,rows).data;}catch{return;}
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const i=(y*cols+x)*4;if(pixels[i+3]<128)continue;
      const luminance=(pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722)/255;
      const tone=Math.pow(Math.max(0,Math.min(1,luminance)),.9);
      const ox=(x+.5)/cols*width,oy=(y+.5)/rows*height;
      const p={ox,oy,x:ox,y:oy,radius:.26+(1-tone)*.88};
      points.push(p);groups[Math.min(15,Math.floor(tone*16))].push(p);
    }
    resize();host.classList.add('points-ready');
  }
  function track(event){
    if(reduced.matches||event.pointerType==='touch')return;
    const r=canvas.getBoundingClientRect();pointer.x=(event.clientX-r.left)/r.width*width;pointer.y=(event.clientY-r.top)/r.height*height;pointer.active=true;wake();
  }
  canvas.addEventListener('pointermove',track);
  canvas.addEventListener('pointerleave',()=>{pointer.active=false;wake();});
  canvas.addEventListener('pointercancel',reset);
  reduced.addEventListener('change',reset);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)reset();}).observe(host);
  new ResizeObserver(resize).observe(canvas);
  photo.addEventListener('load',build,{once:true});if(photo.complete)build();
})();
