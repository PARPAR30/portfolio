const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Theme toggle (the dot in the header)
const root = document.documentElement;
const darkScheme = matchMedia('(prefers-color-scheme: dark)');
const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : darkScheme.matches);
document.getElementById('theme').addEventListener('click', () => {
  root.dataset.theme = isDark() ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
  syncThemeButton();
});
function syncThemeButton() {
  document.getElementById('theme').setAttribute('aria-pressed', String(isDark()));
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

// Home animation. Wide screens get the full-width scene: an opening shot played once per visit, a silent loop
// whose flying icon opens its project, and a dive into the machine driven by the scroll. Smaller screens get the
// loop alone, cropped on the scene. Everything rests off screen, and reduced motion leaves the still image.
const heroFilm = document.querySelector('.hero-film');
const sceneFilm = document.querySelector('.scene-film');
const sceneOuverture = document.querySelector('.scene-ouverture');
const scenePlongee = document.querySelector('.scene-plongee');
const sceneIcone = document.querySelector('.scene-icone');
const heroStage = document.querySelector('.hero-stage');
const heroLeft = document.querySelector('.hero-left');
const siteTop = document.querySelector('.top');
const large = matchMedia('(min-width:1280px)');
const surScene = () => siteTop.classList.toggle('sur-scene', scrollY < 40);
surScene();
addEventListener('scroll', surScene, { passive: true });
if (!reduce) {
  const V = 6, IMAGES = 48, DUREE = 20, PAS = 2.5, DEBUT = 6;
  const ICONES = ['paraphe', 'audit', 'suivi', 'sillage', 'arbre', 'vigie', 'etabli'];
  const theme = () => (isDark() ? 'sombre' : 'clair');
  let film = null, heroSrc = '', enOuverture = false, profondeur = 0;
  const hote = (f) => (f === sceneFilm ? heroStage : heroCard);
  const playHero = () => { if (film && profondeur < 1 && !enOuverture) film.play().catch(() => {}); };

  const loadHero = () => {
    const suivant = large.matches ? sceneFilm : heroFilm;
    const src = `assets/img/atelier-${large.matches ? '' : 'mobile-'}${theme()}.mp4?v=${V}`;
    if (src === heroSrc) return;
    const at = suivant === film ? film.currentTime : 0;
    if (film && film !== suivant) film.pause();
    film = suivant;
    heroSrc = src;
    film.classList.remove('pret');
    hote(film).classList.remove('film-pret');
    film.src = src;
    film.addEventListener('loadedmetadata', () => { film.currentTime = at; }, { once: true });
    playHero();
  };

  // The still image must leave once the film shows: the blend would otherwise mix the two
  [heroFilm, sceneFilm].forEach((f) => {
    f.addEventListener('canplay', () => { if (f === film && !enOuverture) f.classList.add('pret'); });
    f.addEventListener('transitionend', () => hote(f).classList.toggle('film-pret', f.classList.contains('pret')));
  });

  // The opening shot: the text and the bar wait for it, and a slow connection goes straight to the loop
  const montreTexte = () => root.classList.remove('film-ouverture');
  const finOuverture = () => {
    if (!enOuverture) return;
    enOuverture = false;
    montreTexte();
    heroStage.classList.remove('ouvre');
    sceneOuverture.removeAttribute('src');
    sceneOuverture.load();
  };
  // Back to the plain start: the still image first, then the loop
  const repli = () => {
    finOuverture();
    film = null;
    heroSrc = '';
    heroStage.classList.remove('film-pret');
    loadHero();
  };
  const lanceOuverture = () => {
    enOuverture = true;
    const th = theme();
    try { sessionStorage.setItem('ouverture-vue', '1'); } catch (e) {}
    heroStage.classList.add('film-pret');
    // The loop waits underneath, ready to take over on the very frame the opening ends on
    film = sceneFilm;
    heroSrc = `assets/img/atelier-${th}.mp4?v=${V}`;
    film.preload = 'auto';
    film.src = heroSrc;
    sceneOuverture.preload = 'auto';
    sceneOuverture.src = `assets/img/atelier-ouverture-${th}.mp4?v=${V}`;
    const abandon = setTimeout(repli, 1600);
    sceneOuverture.addEventListener('canplay', () => {
      clearTimeout(abandon);
      if (!enOuverture) return;
      heroStage.classList.add('ouvre');
      sceneOuverture.play().catch(repli);
    }, { once: true });
    sceneOuverture.addEventListener('timeupdate', () => { if (sceneOuverture.currentTime > 4.72) montreTexte(); });
    sceneOuverture.addEventListener('ended', () => {
      film.addEventListener('playing', () => {
        // Same frame, no fade: the loop takes the place of the opening at once
        film.style.transition = 'none';
        film.classList.add('pret');
        void film.offsetWidth;
        finOuverture();
        film.style.transition = '';
      }, { once: true });
      film.play().catch(repli);
    }, { once: true });
    addEventListener('scroll', montreTexte, { once: true, passive: true });
  };

  const changeHero = () => {
    if (enOuverture) repli(); else loadHero();
    chargePlongee();
  };
  new MutationObserver(changeHero).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  darkScheme.addEventListener('change', changeHero);
  large.addEventListener('change', changeHero);
  [heroFilm, heroStage].forEach((el) => new IntersectionObserver(([e]) => {
    if (!heroSrc || !film) return;
    if (e.isIntersecting) playHero(); else film.pause();
  }, { threshold: 0.2 }).observe(el));

  // The dive: still frames follow the scroll exactly, which a video cannot do without stutter
  const images = [];
  let serie = '', vue = -1, finPiste = 1, attente = 0;
  const ctx = scenePlongee.getContext('2d');
  const connexionLente = () => navigator.connection && navigator.connection.saveData;
  function chargePlongee() {
    if (!large.matches || connexionLente() || serie === theme()) return;
    serie = theme();
    vue = -1;
    images.length = 0;
    for (let i = 1; i <= IMAGES; i++) {
      const img = new Image();
      img.src = `assets/img/atelier-plongee-${serie}/${String(i).padStart(2, '0')}.jpg?v=${V}`;
      images.push(img);
    }
  }
  const mesurePiste = () => {
    finPiste = Math.max(1, document.getElementById('parcours').getBoundingClientRect().top + scrollY - innerHeight);
  };
  const lisse = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  let dx = 0, dy = 0, cx = 0, cy = 0, zoom = 1, derive = 0;
  const pose = () => {
    sceneFilm.style.transform = `translate3d(${cx.toFixed(2)}px,${cy.toFixed(2)}px,0) scale(${zoom.toFixed(3)})`;
    sceneIcone.style.transform = `translate3d(${cx.toFixed(2)}px,${cy.toFixed(2)}px,0)`;
  };
  const plonge = () => {
    attente = 0;
    if (!large.matches) { heroLeft.removeAttribute('style'); return; }
    const p = Math.min(1, scrollY / finPiste);
    const avant = profondeur;
    profondeur = p;
    const i = Math.round(p * (IMAGES - 1));
    const img = images[i];
    const prete = img && img.complete && img.naturalWidth > 0;
    if (prete && i !== vue) { ctx.drawImage(img, 0, 0, 1280, 800); vue = i; }
    const q = prete ? lisse(0, .1, p) : 0;
    heroStage.classList.toggle('plonge', p > 0);
    scenePlongee.style.opacity = q;
    if (p > 0) sceneFilm.style.opacity = 1 - q; else sceneFilm.style.opacity = '';
    zoom = prete ? 1 : 1 + p * .8;
    pose();
    heroStage.style.opacity = p > 0 ? 1 - lisse(.84, 1, p) : '';
    siteTop.classList.toggle('efface', p > .04 && p < 1);
    // The text leaves before the dive reaches it: the scene never runs behind the words
    const texte = p > 0 ? 1 - lisse(.03, .16, p) : 1;
    heroLeft.style.transition = p > 0 ? 'none' : '';
    heroLeft.style.opacity = p > 0 ? texte : '';
    heroLeft.style.pointerEvents = texte < .1 ? 'none' : '';
    // Above the dive the loop plays; once the frames cover it, it can rest
    if (q >= 1 && avant < 1 && film === sceneFilm) film.pause();
    if (q < 1 && film === sceneFilm && film.paused && !enOuverture) playHero();
  };
  addEventListener('scroll', () => { if (!attente) attente = requestAnimationFrame(plonge); }, { passive: true });
  addEventListener('resize', mesurePiste);

  // The scene follows the pointer a little, and the flying icon opens its project
  if (matchMedia('(pointer: fine)').matches) {
    const glisse = () => {
      cx += (dx - cx) * .08;
      cy += (dy - cy) * .08;
      pose();
      derive = Math.abs(dx - cx) + Math.abs(dy - cy) > .1 ? requestAnimationFrame(glisse) : 0;
    };
    addEventListener('pointermove', (ev) => {
      if (!large.matches || enOuverture || scrollY > 0) return;
      dx = (.5 - ev.clientX / innerWidth) * 18;
      dy = (.5 - ev.clientY / innerHeight) * 10;
      if (!derive) derive = requestAnimationFrame(glisse);
    }, { passive: true });
  }
  const icone = () => Math.floor((((sceneFilm.currentTime - DEBUT) % DUREE) + DUREE) % DUREE / PAS);
  const dialogue = (id) => document.getElementById(`m-${id}`);
  sceneFilm.addEventListener('timeupdate', () => {
    const id = ICONES[icone()];
    sceneIcone.hidden = !id || enOuverture || profondeur > 0;
    if (id) sceneIcone.dataset.nom = dialogue(id).querySelector('h2').textContent;
  });
  sceneIcone.addEventListener('click', () => {
    const id = ICONES[icone()];
    if (!id) return;
    dialogue(id).showModal();
    dialogue(id).scrollTop = 0;
  });

  mesurePiste();
  if (root.classList.contains('film-ouverture') && large.matches) lanceOuverture();
  addEventListener('load', () => {
    mesurePiste();
    plonge();
    if (!enOuverture && !film) { montreTexte(); loadHero(); }
    setTimeout(chargePlongee, enOuverture ? 5500 : 1500);
  });
  addEventListener('scroll', chargePlongee, { once: true, passive: true });
}

// Videos in the project windows: each loads and plays only while on screen, so the page stays light.
// Reduced motion leaves it on its poster, and a pause stays paused until the visitor resumes it.
document.querySelectorAll('.modal-film').forEach((box) => {
  const film = box.querySelector('video');
  const toggle = box.querySelector('.video-toggle');
  let held = reduce;
  function sync() {
    toggle.classList.toggle('paused', film.paused);
    toggle.setAttribute('aria-label', `${film.paused ? 'Lire' : 'Mettre en pause'} la vidéo de ${box.dataset.name}`);
  }
  toggle.addEventListener('click', () => {
    held = !film.paused;
    if (held) film.pause(); else film.play();
  });
  film.addEventListener('play', sync);
  film.addEventListener('pause', sync);
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) film.pause();
    else if (!held) film.play().catch(sync);
  }, { threshold: 0.25 }).observe(film);
  sync();
});

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
    // A click made with the keyboard reports 0,0: only a click on the backdrop itself counts
    if (ev.target !== d) return;
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
