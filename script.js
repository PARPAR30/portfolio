const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Theme toggle (the dot in the header)
const root = document.documentElement;
document.getElementById('theme').addEventListener('click', () => {
  const dark = root.dataset.theme
    ? root.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
  syncThemeButton();
});
function syncThemeButton() {
  const dark = root.dataset.theme
    ? root.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  document.getElementById('theme').setAttribute('aria-pressed', String(dark));
}
syncThemeButton();

// Buttons: the label flips on hover (same effect as the Paraphe site). The text moves into
// .btn__txt, which carries a copy of itself as a text-shadow one line below; the arrow gets a twin.
document.querySelectorAll('.cta, .pill-link').forEach((b) => {
  const arrow = b.querySelector(':scope > .arrow');
  const file = b.querySelector(':scope > .file');
  const content = [...b.childNodes].filter((n) => n !== arrow && n !== file
    && !(n.classList && n.classList.contains('sr-only'))
    && !(n.nodeType === 3 && !n.textContent.trim()));
  const txt = document.createElement('span');
  const inner = document.createElement('span');
  txt.className = 'btn__txt';
  inner.append(...content);
  txt.append(inner);
  b.prepend(txt);
  if (arrow) {
    const ico = document.createElement('span');
    ico.className = 'btn__ico';
    ico.setAttribute('aria-hidden', 'true');
    ico.append(arrow, arrow.cloneNode(true));
    b.append(ico);
  }
});

// Hero video: plays unless the visitor asked for reduced motion, and can always be paused
const video = document.querySelector('.hero-screen video');
const videoToggle = document.getElementById('video-toggle');
function syncVideoToggle() {
  videoToggle.classList.toggle('paused', video.paused);
  videoToggle.setAttribute('aria-label', video.paused ? 'Lire la vidéo de Paraphe' : 'Mettre en pause la vidéo de Paraphe');
}
videoToggle.addEventListener('click', () => { if (video.paused) video.play(); else video.pause(); });
video.addEventListener('play', syncVideoToggle);
video.addEventListener('pause', syncVideoToggle);
if (!reduce) video.play().catch(syncVideoToggle);
syncVideoToggle();

// Hero sentence: reveal word by word. Screen readers get the sentence in one piece.
const intro = document.querySelector('.intro');
const bubble = intro.querySelector('.bubble');
const sentence = intro.textContent.trim();
const spoken = document.createElement('span');
spoken.className = 'sr-only';
spoken.textContent = sentence;
const shown = document.createElement('span');
shown.setAttribute('aria-hidden', 'true');
intro.textContent = '';
intro.append(bubble, spoken, shown);
sentence.split(/\s+/).forEach((w, i) => {
  const s = document.createElement('span');
  s.className = 'w';
  s.textContent = w;
  s.style.animationDelay = `${0.25 + i * 0.035}s`;
  shown.append(s, ' ');
});
document.querySelectorAll('.logos li').forEach((li, i) => {
  li.style.animationDelay = `${0.9 + i * 0.08}s`;
});

// Scroll reveal, staggered per row
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const siblings = [...e.target.parentElement.children].filter((c) => c.classList.contains('reveal'));
    e.target.style.transitionDelay = `${Math.max(0, siblings.indexOf(e.target)) * 0.09}s`;
    e.target.classList.add('in');
    io.unobserve(e.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Active nav link
const links = [...document.querySelectorAll('.nav-link')];
const spy = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) links.forEach((l) => l.classList.toggle('active', l.hash === `#${e.target.id}`));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('#projets, #parcours').forEach((s) => spy.observe(s));

// Cursor glow on featured cards
document.querySelectorAll('.glow').forEach((card) => {
  card.addEventListener('pointermove', (ev) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${ev.clientX - r.left}px`);
    card.style.setProperty('--my', `${ev.clientY - r.top}px`);
  });
});

// Hero card tilts gently with the pointer
const heroCard = document.querySelector('.hero-card');
if (!reduce && matchMedia('(pointer: fine)').matches) {
  heroCard.addEventListener('pointermove', (ev) => {
    const r = heroCard.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width - 0.5;
    const y = (ev.clientY - r.top) / r.height - 0.5;
    heroCard.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
  });
  heroCard.addEventListener('pointerleave', () => { heroCard.style.transform = ''; });
}

// Screenshots drift slightly as the page scrolls
const shots = [...document.querySelectorAll('.tile-shot img')];
let ticking = false;
function drift() {
  const vh = innerHeight;
  // Read every position first, then write, so the browser lays out once per frame
  const offsets = shots.map((img) => {
    const r = img.parentElement.getBoundingClientRect();
    return (r.top + r.height / 2 - vh / 2) / vh;
  });
  shots.forEach((img, i) => img.parentElement.style.setProperty('--drift', `${offsets[i] * -18}px`));
  ticking = false;
}
if (!reduce) {
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(drift); } }, { passive: true });
  drift();
}

// Project modals
document.querySelectorAll('.project').forEach((p) => {
  const dialog = document.getElementById(p.dataset.modal);
  p.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    dialog.showModal();
    dialog.scrollTop = 0;
  }));
});
document.querySelectorAll('.modal').forEach((d) => {
  d.querySelector('.close').addEventListener('click', () => d.close());
  d.addEventListener('click', (ev) => {
    const r = d.getBoundingClientRect();
    const outside = ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom;
    if (outside) d.close();
  });
});

// Screenshot viewer: gallery images in the project windows open full screen,
// with previous / next (buttons, arrow keys, swipe) and the image's alt text as caption
const viewer = document.createElement('dialog');
viewer.className = 'viewer';
viewer.setAttribute('aria-label', 'Capture en grand');
viewer.innerHTML = `
  <div class="viewer-top">
    <span class="viewer-count" aria-live="polite"></span>
    <button class="viewer-close" aria-label="Fermer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
  </div>
  <div class="viewer-stage">
    <button class="prev" aria-label="Capture précédente"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
    <img alt="">
    <button class="next" aria-label="Capture suivante"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
  </div>
  <p class="viewer-caption"></p>`;
document.body.append(viewer);
const viewerImg = viewer.querySelector('img');
let viewerList = [];
let viewerIndex = 0;
let viewerOpener = null;

function showShot(i, animate) {
  viewerIndex = (i + viewerList.length) % viewerList.length;
  const img = viewerList[viewerIndex];
  viewerImg.src = img.currentSrc || img.src;
  viewerImg.alt = img.alt;
  viewer.querySelector('.viewer-caption').textContent = img.alt;
  viewer.querySelector('.viewer-count').textContent = `${viewerIndex + 1} / ${viewerList.length}`;
  if (animate && !reduce) {
    viewerImg.classList.remove('swap');
    void viewerImg.offsetWidth;
    viewerImg.classList.add('swap');
  }
}

document.querySelectorAll('.modal .gallery').forEach((gallery) => {
  const imgs = [...gallery.querySelectorAll('img')];
  imgs.forEach((img, i) => {
    const shot = document.createElement('button');
    shot.className = 'shot';
    shot.setAttribute('aria-label', `Agrandir la capture : ${img.alt}`);
    img.replaceWith(shot);
    shot.append(img);
    shot.addEventListener('click', () => {
      viewerList = imgs;
      viewerOpener = shot;
      viewer.classList.toggle('single', imgs.length < 2);
      showShot(i, false);
      viewer.showModal();
      viewer.querySelector('.viewer-close').focus();
    });
  });
});

viewer.querySelector('.prev').addEventListener('click', () => showShot(viewerIndex - 1, true));
viewer.querySelector('.next').addEventListener('click', () => showShot(viewerIndex + 1, true));
viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
viewer.addEventListener('close', () => { if (viewerOpener) viewerOpener.focus(); });
viewer.addEventListener('keydown', (ev) => {
  if (ev.key === 'ArrowLeft') showShot(viewerIndex - 1, true);
  if (ev.key === 'ArrowRight') showShot(viewerIndex + 1, true);
});
// A click on the dark background (not on the image or a button) closes the viewer
viewer.addEventListener('click', (ev) => {
  if (ev.target === viewer || ev.target.classList.contains('viewer-stage') || ev.target.classList.contains('viewer-top')) viewer.close();
});
// Swipe left or right on touch screens
let swipeX = null;
viewer.querySelector('.viewer-stage').addEventListener('pointerdown', (ev) => { if (ev.pointerType !== 'mouse') swipeX = ev.clientX; });
viewer.querySelector('.viewer-stage').addEventListener('pointerup', (ev) => {
  if (swipeX === null || viewerList.length < 2) return;
  const dx = ev.clientX - swipeX;
  swipeX = null;
  if (Math.abs(dx) > 50) showShot(viewerIndex + (dx < 0 ? 1 : -1), true);
});
