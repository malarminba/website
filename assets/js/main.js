/* ══════════════════════════════════════════════════════
   Minba — main.js
   Phase 1 prototype — debug + animation fix
   ══════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────
   DIAGNOSTICS
   These logs confirm the script and its dependencies
   loaded correctly. Remove or wrap in a debug flag
   once QA passes.
   ───────────────────────────────────────────────────── */
console.log('Minba main.js loaded');
console.log('GSAP available:',         typeof gsap);
console.log('ScrollTrigger available:', typeof ScrollTrigger);
console.log('MINBA_CONTENT available:', typeof MINBA_CONTENT);

/* ─────────────────────────────────────────────────────
   MODULE-LEVEL STATE
   prefersReduced resolved inside DOMContentLoaded so
   the media query is read after the document is ready.
   ───────────────────────────────────────────────────── */
let prefersReduced = false;
const isMobile = () => window.innerWidth <= 900;

/* ══════════════════════════════════════════════════════
   1. CONTENT — populate DOM from content.js data
      Must run first so every GSAP selector resolves.
   ══════════════════════════════════════════════════════ */
function initContent() {
  console.log('initContent running');

  const C = MINBA_CONTENT;

  /* Nav */
  document.getElementById('nav-brand-word').textContent = C.nav[0];
  document.getElementById('nav-signal').textContent     = C.nav[1];
  document.getElementById('nav-method').textContent     = C.nav[2];
  document.getElementById('nav-proof').textContent      = C.nav[3];
  const emailNav       = document.getElementById('nav-email');
  emailNav.textContent = C.nav[4];
  emailNav.href        = `mailto:${C.email}`;

  /* Section 1 */
  document.getElementById('noise-title').textContent = C.hero.title;
  document.getElementById('noise-micro').textContent = C.hero.micro;

  /* Section 2 */
  document.getElementById('signal-title').textContent     = C.signal.title;
  document.getElementById('signal-body').textContent      = C.signal.body;
  document.getElementById('signal-secondary').textContent = C.signal.secondary;
  const areasEl = document.getElementById('signal-areas');
  C.signal.areas.forEach(area => {
    const d      = document.createElement('div');
    d.className  = 'signal-area';
    d.innerHTML  = `<h4>${area.title}</h4><p>${area.text}</p>`;
    areasEl.appendChild(d);
  });

  /* Section 3 */
  document.getElementById('method-title').textContent = C.method.title;
  document.getElementById('method-body').textContent  = C.method.body;
  const stepsEl = document.getElementById('method-steps');
  C.method.steps.forEach((step, i) => {
    const side        = i % 2 === 0 ? 'left' : 'right';
    const d           = document.createElement('div');
    d.className       = `method-step method-step--${side}`;
    const leftHtml    = side === 'left'  ? `<h3 class="step-title">${step.title}</h3><p class="step-text">${step.text}</p>` : '';
    const rightHtml   = side === 'right' ? `<h3 class="step-title">${step.title}</h3><p class="step-text">${step.text}</p>` : '';
    d.innerHTML       = `
      <div class="step-content-left">${leftHtml}</div>
      <div class="step-marker-col"><div class="step-marker"></div></div>
      <div class="step-content-right">${rightHtml}</div>`;
    stepsEl.appendChild(d);
  });

  /* Section 4 */
  document.getElementById('proof-title').textContent    = C.proof.title;
  document.getElementById('proof-subtitle').textContent = C.proof.body;
  const catsEl = document.getElementById('proof-cats');
  C.proof.categories.forEach((cat, i) => {
    const li         = document.createElement('li');
    li.className     = `proof-cat${i === 0 ? ' active' : ''}`;
    li.textContent   = cat.name;
    li.dataset.index = i;
    catsEl.appendChild(li);
  });

  /* Section 5 */
  document.getElementById('contact-title').textContent = C.contact.title;
  document.getElementById('contact-body').textContent  = C.contact.body;
  const ctaEl       = document.getElementById('contact-cta');
  ctaEl.textContent = C.contact.cta;
  ctaEl.href        = `mailto:${C.email}`;
  document.getElementById('footer-brand').textContent  = C.footer.brand;
  document.getElementById('footer-line').textContent   = C.footer.line;
}

/* ══════════════════════════════════════════════════════
   2. PARTICLES — canvas hero system
   ══════════════════════════════════════════════════════ */

/* Holds the running ParticleCanvas instance so scroll
   triggers can update its convergence value. */
let _particles = null;

class ParticleCanvas {
  constructor(canvas) {
    this.canvas      = canvas;
    this.ctx         = canvas.getContext('2d');
    this.mouse       = { x: null, y: null };
    this.particles   = [];
    this.convergence = 0; // 0 = scattered | 1 = converged to star
    this.raf         = null;
  }

  start() {
    this.resize();
    this.spawnParticles();
    window.addEventListener('resize',     () => this.resize(), { passive: true });
    window.addEventListener('mousemove',  e  => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; });
    window.addEventListener('mouseleave', () => { this.mouse.x = null; this.mouse.y = null; });
    this.loop();
    console.log(
      `ParticleCanvas started — ${this.particles.length} particles`,
      `| canvas ${this.canvas.width}×${this.canvas.height}`
    );
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.particles.length) this.setTargets();
  }

  spawnParticles() {
    const count = isMobile() ? 55 : 130;
    this.particles = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.08 + Math.random() * 0.22;
      this.particles.push({
        x:  Math.random() * this.canvas.width,
        y:  Math.random() * this.canvas.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        /* ── Visibility fix ───────────────────────────
           Previous values (0.4–1.8 px / 6–34% opacity)
           were sub-perceptible on a dark background.
           These values are the correct production values
           for the atmospheric-but-visible effect.       */
        size:    1.2 + Math.random() * 2.0,   // 1.2 – 3.2 px
        opacity: 0.18 + Math.random() * 0.38, // 18  – 56 %
        tx: 0, ty: 0                           // convergence targets
      });
    }
    this.setTargets();
  }

  /* Distribute convergence targets along a 6-pointed star */
  setTargets() {
    const cx     = this.canvas.width  * 0.5;
    const cy     = this.canvas.height * 0.5;
    const outerR = Math.min(this.canvas.width, this.canvas.height) * 0.22;
    const innerR = outerR * 0.48;
    const n      = this.particles.length;
    this.particles.forEach((p, i) => {
      const t       = i / n;
      const seg     = t * 12;
      const segIdx  = Math.floor(seg);
      const segFrac = seg - segIdx;
      const a1      = (segIdx     * Math.PI / 6) - Math.PI / 2;
      const a2      = ((segIdx+1) * Math.PI / 6) - Math.PI / 2;
      const r1      = segIdx % 2 === 0 ? outerR : innerR;
      const r2      = (segIdx+1) % 2 === 0 ? outerR : innerR;
      const ax      = Math.cos(a1) * r1, ay = Math.sin(a1) * r1;
      const bx      = Math.cos(a2) * r2, by = Math.sin(a2) * r2;
      p.tx = cx + ax + (bx - ax) * segFrac + (Math.random() - 0.5) * 12;
      p.ty = cy + ay + (by - ay) * segFrac + (Math.random() - 0.5) * 12;
    });
  }

  update() {
    const cv = this.convergence;
    this.particles.forEach(p => {
      if (cv < 0.05) {
        /* Free float */
        p.x += p.vx;
        p.y += p.vy;
        /* Mouse push */
        if (this.mouse.x !== null) {
          const dx = p.x - this.mouse.x;
          const dy = p.y - this.mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 14400) { // 120px radius
            const d = Math.sqrt(d2);
            const f = (1 - d / 120) * 0.8;
            p.x += (dx / d) * f;
            p.y += (dy / d) * f;
          }
        }
        /* Wrap edges */
        if (p.x < -5)                     p.x = this.canvas.width  + 5;
        if (p.x > this.canvas.width  + 5) p.x = -5;
        if (p.y < -5)                     p.y = this.canvas.height + 5;
        if (p.y > this.canvas.height + 5) p.y = -5;
      } else {
        /* Converge toward star targets */
        const pull = 0.04 + cv * 0.06;
        p.x += (p.tx - p.x) * pull;
        p.y += (p.ty - p.y) * pull;
      }
    });
  }

  draw() {
    const cv = this.convergence;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach(p => {
      const op = p.opacity * (1 - cv * 0.2);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      /* Purple — matches --color-purple (#8b5cf6 = rgb 139,92,246) */
      this.ctx.fillStyle = `rgba(139,92,246,${op.toFixed(3)})`;
      this.ctx.fill();
    });

    /* Connection lines appear as particles converge */
    if (cv > 0.45) {
      const maxDist = 35 + cv * 15;
      const lineOp  = (cv - 0.45) / 0.55;
      this.particles.forEach((p, i) => {
        for (let j = i + 1; j < this.particles.length; j++) {
          const p2 = this.particles[j];
          const dx = p.x - p2.x, dy = p.y - p2.y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < maxDist) {
            this.ctx.beginPath();
            this.ctx.moveTo(p.x, p.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.strokeStyle = `rgba(139,92,246,${((1 - d / maxDist) * lineOp * 0.18).toFixed(3)})`;
            this.ctx.lineWidth   = 0.5;
            this.ctx.stroke();
          }
        }
      });
    }
  }

  loop() {
    this.update();
    this.draw();
    this.raf = requestAnimationFrame(() => this.loop());
  }

  destroy() { if (this.raf) cancelAnimationFrame(this.raf); }
}

function initParticles() {
  console.log('initParticles running');

  if (prefersReduced) {
    console.log('initParticles: skipped (prefers-reduced-motion is ON)');
    return;
  }

  const canvas = document.getElementById('hero-canvas');
  if (!canvas) {
    console.error('initParticles: #hero-canvas element not found in DOM');
    return;
  }

  _particles = new ParticleCanvas(canvas);
  _particles.start();
}

/* ══════════════════════════════════════════════════════
   3. NAVIGATION
   ══════════════════════════════════════════════════════ */
function initNav() {
  const nav = document.getElementById('main-nav');

  /* ── Scroll state ─────────────────────────────────────
     Using a native scroll listener instead of a
     ScrollTrigger without a trigger element — the
     triggerless pattern was unreliable in practice.    */
  function updateNav() {
    nav.classList.toggle('nav--scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav(); // apply correct class on initial load

  /* ── Smooth anchor scrolling ─────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      gsap.to(window, {
        scrollTo: { y: target, offsetY: 0 },
        duration: 1.2,
        ease:     'power3.inOut'
      });
    });
  });
}

/* ══════════════════════════════════════════════════════
   4. SCROLL ANIMATIONS — all section reveals
      All gsap.set() initial states are set BEFORE
      their corresponding tweens/timelines are created.
   ══════════════════════════════════════════════════════ */
function initScrollAnimations() {
  console.log('initScrollAnimations running');

  if (prefersReduced) {
    console.log('initScrollAnimations: reduced motion — making all elements immediately visible');
    /* Show everything instantly, no transforms */
    gsap.set([
      '#noise-title', '#noise-micro', '.scroll-indicator',
      '.signal-text-block .section-label',
      '#signal-title', '#signal-body', '#signal-secondary',
      '.signal-areas', '#star-container',
      '.method-header', '.method-star-wrap',
      '.proof-header',
      '.contact-inner .section-label',
      '#contact-title', '#contact-body', '#contact-cta',
      '.contact-star-bg', '.footer'
    ], { opacity: 1, y: 0, scale: 1, filter: 'none' });
    gsap.set('.method-step',    { opacity: 1, y: 0 });
    gsap.set('#method-line-fill', { height: '100%' });
    return;
  }

  _sectionNoise();
  _sectionSignal();
  _sectionMethod();
  _sectionContact();
}

/* ── Section 1: Noise ─────────────────────────────── */
function _sectionNoise() {
  /* ① Set initial states */
  gsap.set('#noise-title',      { opacity: 0, y: 30 });
  gsap.set('#noise-micro',      { opacity: 0, y: 20 });
  gsap.set('.scroll-indicator', { opacity: 0 });

  /* ② Create timeline */
  const tl = gsap.timeline({ delay: 0.4 });
  tl.to('#noise-title',      { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }, 0  )
    .to('#noise-micro',       { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' }, 0.4)
    .to('.scroll-indicator',  { opacity: 1,        duration: 0.8, ease: 'power2.out' }, 1.0);

  /* ③ Scroll triggers */
  /* Drive particle convergence via scroll progress through section 1 */
  ScrollTrigger.create({
    trigger:  '#noise',
    start:    'top top',
    end:      'bottom top',
    scrub:    true,
    onUpdate: self => {
      if (_particles) _particles.convergence = self.progress;
    }
  });

  /* Fade canvas as signal section rises into view */
  ScrollTrigger.create({
    trigger:  '#signal',
    start:    'top 80%',
    end:      'top 20%',
    scrub:    true,
    onUpdate: self => {
      const c = document.getElementById('hero-canvas');
      if (c) c.style.opacity = String((1 - self.progress).toFixed(3));
    }
  });

  /* Hide scroll indicator on first downward scroll */
  ScrollTrigger.create({
    trigger: '#noise',
    start:   'top -20',
    onEnter: () => gsap.to('.scroll-indicator', { opacity: 0, duration: 0.4 })
  });
}

/* ── Section 2: Signal ────────────────────────────── */
function _sectionSignal() {
  /* ① Set initial states */
  gsap.set('.signal-text-block .section-label', { opacity: 0, y: 12 });
  gsap.set('#signal-title',                      { opacity: 0, y: 24 });
  gsap.set('#signal-body',                       { opacity: 0, y: 20 });
  gsap.set('#signal-secondary',                  { opacity: 0, y: 16 });
  gsap.set('.signal-areas',                      { opacity: 0, y: 16 });
  gsap.set('#star-container',                    { opacity: 0, scale: 0.85 });

  /* ② Create ScrollTrigger timeline */
  const tl = gsap.timeline({
    scrollTrigger: { trigger: '#signal', start: 'top 70%', once: true }
  });

  tl.to('.signal-text-block .section-label', { opacity: 0.65, y: 0, duration: 0.6, ease: 'power2.out' })
    .to('#signal-title',     { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.3')
    .to('#signal-body',      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
    .to('#signal-secondary', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5')
    .to('.signal-areas',     { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.4')
    .to('#star-container',   { opacity: 1, scale: 1, duration: 1.1, ease: 'power2.out' }, '-=0.7');

  /* ③ Star rotation + breathing (starts when section is 60% in view) */
  ScrollTrigger.create({
    trigger: '#signal',
    start:   'top 60%',
    once:    true,
    onEnter: () => {
      /* Slow continuous rotation */
      gsap.to('#main-star', {
        rotation:        360,
        duration:        90,
        repeat:          -1,
        ease:            'none',
        transformOrigin: 'center center'
      });
      /* Gentle breathing pulse */
      gsap.to('#main-star', {
        scale:           1.06,
        duration:        4.5,
        repeat:          -1,
        yoyo:            true,
        ease:            'sine.inOut',
        transformOrigin: 'center center'
      });
    }
  });
}

/* ── Section 3: Method ────────────────────────────── */
function _sectionMethod() {
  /* ① Set initial states — steps queried after initContent ran */
  gsap.set('.method-header',    { opacity: 0, y: 24 });
  gsap.set('.method-star-wrap', { opacity: 0 });
  document.querySelectorAll('.method-step').forEach(el => {
    gsap.set(el, { opacity: 0, y: 18 });
  });

  /* ② Header reveal */
  gsap.to('.method-header', {
    scrollTrigger: { trigger: '#method', start: 'top 70%', once: true },
    opacity: 1, y: 0, duration: 0.9, ease: 'power3.out'
  });

  /* ③ Star drop-in + rotation */
  ScrollTrigger.create({
    trigger: '#method',
    start:   'top 65%',
    once:    true,
    onEnter: () => {
      gsap.to('.method-star-wrap', { opacity: 1, duration: 0.8, ease: 'power2.out' });
      gsap.to('.star-crystal--sm', {
        rotation:        360,
        duration:        120,
        repeat:          -1,
        ease:            'none',
        transformOrigin: 'center center'
      });
    }
  });

  /* ④ Timeline line fill + step cascade */
  ScrollTrigger.create({
    trigger: '.method-layout',
    start:   'top 65%',
    once:    true,
    onEnter: () => {
      gsap.to('#method-line-fill', { height: '100%', duration: 1.8, ease: 'power2.inOut' });
      document.querySelectorAll('.method-step').forEach((el, i) => {
        gsap.to(el, {
          opacity:  1,
          y:        0,
          duration: 0.65,
          delay:    0.25 + i * 0.18,
          ease:     'power3.out'
        });
      });
    }
  });
}

/* ── Section 5: Contact ───────────────────────────── */
function _sectionContact() {
  /* ① Set initial states */
  gsap.set('.contact-inner .section-label', { opacity: 0 });
  gsap.set('#contact-title',                { opacity: 0, y: 24 });
  gsap.set('#contact-body',                 { opacity: 0, y: 24 });
  gsap.set('#contact-cta',                  { opacity: 0, y: 24 });
  gsap.set('.contact-star-bg',              { opacity: 0, scale: 0.9 });
  gsap.set('.footer',                       { opacity: 0 });

  /* ② Timeline */
  const tl = gsap.timeline({
    scrollTrigger: { trigger: '#contact', start: 'top 70%', once: true }
  });

  tl.to('.contact-star-bg',             { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.out'  }, 0   )
    .to('.contact-inner .section-label', { opacity: 0.65,         duration: 0.6, ease: 'power2.out'  }, 0.20)
    .to('#contact-title',                { opacity: 1, y: 0,       duration: 1.0, ease: 'power3.out' }, 0.35)
    .to('#contact-body',                 { opacity: 1, y: 0,       duration: 0.8, ease: 'power3.out' }, 0.60)
    .to('#contact-cta',                  { opacity: 1, y: 0,       duration: 0.7, ease: 'power3.out' }, 0.80)
    .to('.footer',                       { opacity: 1,              duration: 0.6, ease: 'power2.out'  }, 1.0 );

  /* ③ Contact star breathe + rotation */
  ScrollTrigger.create({
    trigger: '#contact',
    start:   'top 60%',
    once:    true,
    onEnter: () => {
      gsap.to('.star-crystal--contact', {
        rotation:        360,
        duration:        120,
        repeat:          -1,
        ease:            'none',
        transformOrigin: 'center center'
      });
      gsap.to('.star-crystal--contact', {
        scale:           1.04,
        duration:        6,
        repeat:          -1,
        yoyo:            true,
        ease:            'sine.inOut',
        transformOrigin: 'center center'
      });
    }
  });
}

/* ══════════════════════════════════════════════════════
   5. PROOF SECTION — category switching with fly-in cards
   ══════════════════════════════════════════════════════ */

/* Module-level state replaces the class for simpler access */
let _proofActiveIndex  = 0;
let _proofCurrentCards = [];
let _proofAnimating    = false;
let _proofStage        = null;

function initProofSection() {
  console.log('initProofSection running');

  _proofStage = document.getElementById('proof-stage');
  if (!_proofStage) {
    console.error('initProofSection: #proof-stage not found');
    return;
  }

  /* Header reveal */
  if (!prefersReduced) {
    gsap.set('.proof-header', { opacity: 0, y: 20 });
    gsap.to('.proof-header', {
      scrollTrigger: { trigger: '#proof', start: 'top 70%', once: true },
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out'
    });
  } else {
    gsap.set('.proof-header', { opacity: 1 });
  }

  /* Category click handlers */
  document.querySelectorAll('.proof-cat').forEach(cat => {
    cat.addEventListener('click', () => {
      const idx = parseInt(cat.dataset.index, 10);
      if (idx === _proofActiveIndex || _proofAnimating) return;
      _proofSwitch(idx);
    });
  });

  /* Load initial cards when section enters viewport */
  ScrollTrigger.create({
    trigger: '#proof',
    start:   'top 60%',
    once:    true,
    onEnter: () => {
      console.log('Proof section entered — loading initial cards');
      _proofLoad(0, true);
    }
  });
}

function _proofBuildCard(item) {
  const card      = document.createElement('div');
  card.className  = 'proof-card';
  card.innerHTML  = `
    <div class="proof-card-img">
      <img src="${item.image}" alt="${item.title}" loading="lazy"
           onerror="this.parentElement.style.background='var(--surface-2)'">
    </div>
    <div class="proof-card-body">
      <div class="proof-card-title">${item.title}</div>
      <div class="proof-card-desc">${item.description}</div>
    </div>`;
  return card;
}

function _proofLoad(index, initial = false) {
  const cat   = MINBA_CONTENT.proof.categories[index];
  _proofStage.innerHTML = '';
  _proofStage.classList.toggle('single-card', cat.items.length === 1);

  const cards = cat.items.map(item => {
    const card = _proofBuildCard(item);
    _proofStage.appendChild(card);
    return card;
  });
  _proofCurrentCards = cards;

  if (prefersReduced) {
    cards.forEach(c => { c.style.opacity = '1'; });
    _proofAnimating = false;
    return;
  }

  const origins = [
    { x: -80, y: -40 },
    { x:  80, y: -50 },
    { x: -50, y:  70 },
    { x:  60, y:  60 }
  ];

  gsap.fromTo(cards,
    {
      opacity: 0,
      x:       i => origins[i % origins.length].x,
      y:       i => origins[i % origins.length].y,
      scale:   0.92,
      filter:  'blur(6px)'
    },
    {
      opacity:    1,
      x:          0,
      y:          0,
      scale:      1,
      filter:     'blur(0px)',
      duration:   initial ? 0.75 : 0.65,
      stagger:    0.1,
      ease:       'power3.out',
      delay:      initial ? 0.1 : 0,
      onComplete: () => { _proofAnimating = false; }
    }
  );
}

function _proofSwitch(newIndex) {
  _proofAnimating = true;

  document.querySelectorAll('.proof-cat').forEach((el, i) => {
    el.classList.toggle('active', i === newIndex);
  });

  if (prefersReduced || _proofCurrentCards.length === 0) {
    _proofActiveIndex = newIndex;
    _proofLoad(newIndex);
    return;
  }

  const exitDirs = [
    { x:  80, y: -40 },
    { x: -70, y: -50 },
    { x:  50, y:  60 },
    { x: -60, y:  50 }
  ];

  gsap.to(_proofCurrentCards, {
    opacity:    0,
    x:          i => exitDirs[i % exitDirs.length].x,
    y:          i => exitDirs[i % exitDirs.length].y,
    scale:      0.9,
    filter:     'blur(4px)',
    duration:   0.4,
    stagger:    0.06,
    ease:       'power2.in',
    onComplete: () => {
      _proofActiveIndex = newIndex;
      _proofLoad(newIndex);
    }
  });
}

/* ══════════════════════════════════════════════════════
   ENTRY POINT
   Correct order:
     1. registerPlugin          — before any ScrollTrigger use
     2. prefersReduced check    — before any animation init
     3. initContent             — DOM must be populated first
     4. initNav                 — needs nav element
     5. initParticles           — needs canvas element
     6. initScrollAnimations    — needs all DOM + gsap.set
     7. initProofSection        — needs categories in DOM
     8. ScrollTrigger.refresh() — recalculates all positions
                                  after dynamic content added
   ══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  /* Must be first — plugins needed by all scroll animations */
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  /* Resolve reduced-motion after document is ready */
  prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  console.log('prefers-reduced-motion:', prefersReduced);

  initContent();
  initNav();
  initParticles();
  initScrollAnimations();
  initProofSection();

  /* Recalculate all scroll trigger positions now that dynamic
     content (areas, steps, categories) has been injected.    */
  ScrollTrigger.refresh();

  /* Final diagnostic — confirms how many triggers are active */
  console.log('ScrollTriggers registered:', ScrollTrigger.getAll().length);
  console.log('ScrollTrigger list:', ScrollTrigger.getAll());
});
