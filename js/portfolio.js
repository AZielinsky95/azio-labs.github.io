const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#site-navigation');
let refreshSelection = () => {};
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
  refreshSelection();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('open');
    menuButton.focus();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) document.querySelectorAll('video').forEach(video => video.pause());
});

// Fold the current capsule closed, then open it at the next route.
(() => {
  if (!navigation) return;
  const links = [...navigation.querySelectorAll('.nav-group .nav-link')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const capsule = document.createElement('span');
  capsule.className = 'nav-selection';
  capsule.setAttribute('aria-hidden', 'true');
  capsule.hidden = true;
  navigation.prepend(capsule);
  let active = null, motion = null, sequence = 0, destination = null;
  const normalPath = path => path.replace(/\/+$/, '') || '/';

  function position(link) {
    if (!link) return;
    const parent = navigation.getBoundingClientRect();
    const target = link.getBoundingClientRect();
    if (!parent.width || !target.width) { capsule.hidden = true; return; }
    // Geometry changes instantly while folded; only horizontal scale animates.
    capsule.style.left = `${target.left-parent.left}px`;
    capsule.style.top = `${target.top-parent.top}px`;
    capsule.style.width = `${target.width}px`;
    capsule.style.height = `${target.height}px`;
    capsule.hidden = false;
    navigation.classList.add('has-selection');
  }
  function choose(link) {
    active = link;
    links.forEach(item => {
      const selected = item === link;
      item.classList.toggle('selected', selected);
      if (selected) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
    position(link);
  }
  function stop() {
    sequence++;
    motion?.cancel();
    motion = null;
    destination = null;
  }
  function syncRoute() {
    stop();
    links.forEach(link => link.classList.remove('route-pressed'));
    const current = links.find(link => normalPath(link.pathname) === normalPath(location.pathname));
    if (current) choose(current);
  }
  async function foldTo(link) {
    stop();
    const currentSequence = sequence;
    destination = link;
    links.forEach(item => item.classList.remove('route-pressed'));
    motion = capsule.animate([
      {transform:'scaleX(1)',opacity:1},
      {transform:'scaleX(.035)',opacity:.5}
    ],{duration:110,easing:'cubic-bezier(.4,0,1,1)',fill:'both'});
    await motion.finished.catch(() => {});
    if (sequence !== currentSequence) return;
    motion.cancel();
    choose(link);
    link.classList.add('route-pressed');
    motion = capsule.animate([
      {transform:'scaleX(.035)',opacity:.5},
      {offset:.8,transform:'scaleX(1.025)',opacity:1},
      {transform:'scaleX(1)',opacity:1}
    ],{duration:190,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'});
    await motion.finished.catch(() => {});
    if (sequence !== currentSequence) return;
    motion.cancel();
    motion = null;
    location.assign(link.href);
  }
  navigation.addEventListener('click', event => {
    const link = event.target.closest?.('a');
    if (!links.includes(link) || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download') || reduced.matches || !Element.prototype.animate) return;
    if (link.origin !== location.origin || normalPath(link.pathname) === normalPath(location.pathname)) return;
    event.preventDefault();
    foldTo(link).catch(() => location.assign(link.href));
  });
  refreshSelection = () => position(active);
  new ResizeObserver(refreshSelection).observe(navigation);
  document.fonts.ready.then(refreshSelection);
  reduced.addEventListener('change', () => {
    if (reduced.matches && destination) { const href=destination.href; stop(); location.assign(href); }
    else refreshSelection();
  });
  window.addEventListener('pageshow', syncRoute);
  window.addEventListener('pagehide', stop);
  syncRoute();
})();
