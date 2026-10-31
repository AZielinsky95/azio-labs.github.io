// FLIP the four real letters of AZIO into their positions in the full name.
(() => {
  const heading = document.querySelector('.home-name-intro');
  if (!heading) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = [];
  let started = false, complete = false;
  const hold = 1200;
  const fallback = setTimeout(finish, 5500);
  function finish() {
    if (complete) return;
    complete = true;
    clearTimeout(fallback);
    heading.classList.add('name-complete');
    heading.classList.remove('name-playing');
    animations.forEach(animation => animation.cancel());
  }
  async function reveal() {
    if (reduced.matches || !Element.prototype.animate || document.hidden) return finish();
    // The monogram is already visible while the display font arrives.
    await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 700))]);
    if (complete || reduced.matches || document.hidden) return finish();
    const accent = getComputedStyle(heading).getPropertyValue('--coral').trim();
    const ink = getComputedStyle(heading).color;
    const starts = Object.fromEntries([...heading.querySelectorAll('[data-origin]')].map(el => [el.dataset.origin,el.getBoundingClientRect()]));
    const anchors = [...heading.querySelectorAll('[data-anchor]')];
    const destinations = anchors.map(el => ({el,rect:el.getBoundingClientRect()}));
    started = true;
    for (const {el,rect} of destinations) {
      const start=starts[el.dataset.anchor];
      const x=start.left-rect.left, y=start.top-rect.top;
      const arc=el.dataset.anchor==='o'?-13:el.dataset.anchor==='z'?8:0;
      animations.push(el.animate([
        {transform:`translate(${x}px,${y}px)`,color:accent},
        {offset:.18,transform:`translate(${x*.96}px,${y+arc}px)`,color:accent},
        {transform:'translate(0,0)',color:ink}
      ],{duration:1350,delay:hold,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'}));
    }
    [...heading.querySelectorAll('.name-row')].forEach((row,rowIndex) => {
      [...row.querySelectorAll('.name-char:not([data-anchor])')].forEach((el,index) => {
        animations.push(el.animate([
          {opacity:0,transform:'translateY(9px) scale(.94)',filter:'blur(3px)'},
          {opacity:1,transform:'translateY(0) scale(1)',filter:'blur(0)'}
        ],{duration:650,delay:hold+420+rowIndex*80+index*44,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'}));
      });
    });
    const period=heading.querySelector('.name-period');
    animations.push(period.animate([{opacity:0,transform:'scale(.5)'},{opacity:1,transform:'scale(1)'}],{duration:320,delay:hold+1300,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'}));
    heading.classList.add('name-playing');
    await Promise.allSettled(animations.map(animation=>animation.finished));
    finish();
  }
  reduced.addEventListener('change',()=>{if(reduced.matches)finish();});
  window.addEventListener('resize',()=>{if(started)finish();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)finish();});
  reveal().catch(finish);
})();
