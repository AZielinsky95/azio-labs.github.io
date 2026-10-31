// Gently tilt the card toward the cursor; return to flat when it leaves.
(() => {
  const card = document.querySelector('.home-profile-frame, .vinyl-card');
  if (!card) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let frame = 0, x = 0, y = 0, targetX = 0, targetY = 0;
  function paint() {
    card.style.setProperty('--tilt-x', `${-y * 6}deg`);
    card.style.setProperty('--tilt-y', `${x * 6}deg`);
  }
  function tick() {
    frame = 0;
    x += (targetX - x) * .13;
    y += (targetY - y) * .13;
    const moving = Math.abs(targetX-x) + Math.abs(targetY-y) > .001;
    if (!moving) { x = targetX; y = targetY; }
    paint();
    if (moving) frame = requestAnimationFrame(tick);
  }
  function wake() { if (!frame) frame = requestAnimationFrame(tick); }
  function reset() { cancelAnimationFrame(frame); frame=0; x=y=targetX=targetY=0; paint(); }
  function track(event) {
    if (reduced.matches || !fine.matches || event.pointerType === 'touch') return;
    const bounds = card.getBoundingClientRect();
    targetX = Math.max(-1,Math.min(1,(event.clientX-bounds.left)/bounds.width*2-1));
    targetY = Math.max(-1,Math.min(1,(event.clientY-bounds.top)/bounds.height*2-1));
    wake();
  }
  card.addEventListener('pointerenter', track);
  card.addEventListener('pointermove', track);
  card.addEventListener('pointerleave', () => { targetX=targetY=0; wake(); });
  card.addEventListener('pointercancel', reset);
  reduced.addEventListener('change', reset);
  fine.addEventListener('change', reset);
  document.addEventListener('visibilitychange', () => { if(document.hidden) reset(); });
})();
