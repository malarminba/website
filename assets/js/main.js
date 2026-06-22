/* ══════════════════════════════════════════════════════
   Minba — main.js
   Phase 1 static prototype
   ══════════════════════════════════════════════════════ */

'use strict';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => window.innerWidth <= 900;

/* ─── Content Population ──────────────────────────── */
function populateContent() {
  const C = MINBA_CONTENT;

  // Nav — brand word targets the inner span (allows logo SVG to sit alongside it later)
  document.getElementById('nav-brand-word').textContent = C.nav[0];
  document.getElementById('nav-signal').textContent = C.nav[1];
  document.getElementById('nav-method').textContent = C.nav[2];
  document.getElementById('nav-proof').textContent  = C.nav[3];
  const emailNav = document.getElementById('nav-email');
  emailNav.textContent = C.nav[4];
  emailNav.href = `mailto:${C.email}`;

  // Section 1
  document.getElementById('noise-title').textContent = C.hero.title;
  document.getElementById('noise-micro').textContent = C.hero.micro;

  // Section 2
  document.getElementById('signal-title').textContent    = C.signal.title;
  document.getElementById('signal-body').textContent     = C.signal.body;
  document.getElementById('signal-secondary').textContent = C.signal.secondary;
  const areasEl = document.getElementById('signal-areas');
  C.signal.areas.forEach(area => {
    const d = document.createElement('div');
    d.className = 'signal-area';
    d.innerHTML = `<h4>${area.title}</h4><p>${area.text}</p>`;
    areasEl.appendChild(d);
  });

  // Section 3
  document.getElementById('method-title').textContent = C.method.title;
  document.getElementById('method-body').textContent  = C.method.body;
  const stepsEl = document.getElementById('method-steps');
  C.method.steps.forEach((step, i) => {
    const side = i % 2 === 0 ? 'left' : 'right';
    const d = document.createElement('div');
    d.className = `method-step method-step--${side}`;
    const leftContent  = side === 'left'  ? `<h3 class="step-title">${step.title}</h3><p class="step-text">${step.text}</p>` : '';
    const rightContent = side === 'right' ? `<h3 class="step-title">${step.title}</h3><p class="step-text">${step.text}</p>` : '';
    d.innerHTML = `
      <div class="step-content-left">${leftContent}</div>
      <div class="step-marker-col"><div class="step-marker"></div></div>
      <div class="step-content-right">${rightContent}</div>`;
    stepsEl.appendChild(d);
  });

  // Section 4
  document.getElementById('proof-title').textContent    = C.proof.title;
  document.getElementById('proof-subtitle').textContent = C.proof.body;
  const catsEl = document.getElementById('proof-cats');
  C.proof.categories.forEach((cat, i) => {
    const li = document.createElement('li');
    li.className = `proof-cat${i === 0 ? ' active' : ''}`;
    li.textContent = cat.name;
    li.dataset.index = i;
    catsEl.appendChild(li);
  });

  // Section 5
  document.getElementById('contact-title').textContent = C.contact.title;
  document.getElementById('contact-body').textContent  = C.contact.body;
  const ctaEl = document.getElementById('contact-cta');
  ctaEl.textContent = C.contact.cta;
  ctaEl.href = `mailto:${C.email}`;

  document.getElementById('footer-brand').textContent = C.footer.brand;
  document.getElementById('footer-line').textContent  = C.footer.line;
}

/* ─── Canvas Particle System ──────────────────────── */
class ParticleCanvas {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.mouse  = { x: null, y: null };
    this.particles = [];
    this.convergence = 0; // 0 = scattered, 1 = converged
    this.raf  = null;
    this.init();
  }

  init() {
    this.resize();
    this.spawnParticles();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', e => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    window.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });
    this.loop();
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.particles.length) this.setTargets();
  }

  spawnParticles() {
    const count = isMobile() ? 55 : 140;
    this.particles = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.08 + Math.random() * 0.22;
      this.particles.push({
        x:  Math.random() * this.canvas.width,
        y:  Math.random() * this.canvas.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size:    0.4 + Math.random() * 1.4,
        opacity: 0.06 + Math.random() * 0.28,
        tx: 0, ty: 0 // convergence targets
      });
    }
    this.setTargets();
  }

  setTargets() {
    // Distribute along a 6-pointed star centred in the canvas
    const cx = this.canvas.width  * 0.5;
    const cy = this.canvas.height * 0.5;
    const outerR = Math.min(this.canvas.width, this.canvas.height) * 0.22;
    const innerR = outerR * 0.48;
    const n = this.particles.length;

    this.particles.forEach((p, i) => {
      const t = i / n;
      const seg = t * 12;                   // 12 star vertices
      const segIdx = Math.floor(seg);
      const segFrac = seg - segIdx;
      const a1 = (segIdx     * Math.PI / 6) - Math.PI / 2;
      const a2 = ((segIdx+1) * Math.PI / 6) - Math.PI / 2;
      const r1 = segIdx % 2 === 0 ? outerR : innerR;
      const r2 = (segIdx+1) % 2 === 0 ? outerR : innerR;
      const ax = Math.cos(a1) * r1, ay = Math.sin(a1) * r1;
      const bx = Math.cos(a2) * r2, by = Math.sin(a2) * r2;
      p.tx = cx + ax + (bx - ax) * segFrac + (Math.random() - 0.5) * 12;
      p.ty = cy + ay + (by - ay) * segFrac + (Math.random() - 0.5) * 12;
    });
  }

  update() {
    const cv = this.convergence;
    this.particles.forEach(p => {
      if (cv < 0.05) {
        // free float
        p.x += p.vx;
        p.y += p.vy;
        // gentle mouse push
        if (this.mouse.x !== null) {
          const dx = p.x - this.mouse.x;
          const dy = p.y - this.mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 14400) { // 120px
            const d  = Math.sqrt(d2);
            const f  = (1 - d / 120) * 0.8;
            p.x += (dx / d) * f;
            p.y += (dy / d) * f;
          }
        }
        // wrap
        if (p.x < -5)  p.x = this.canvas.width  + 5;
        if (p.x > this.canvas.width  + 5) p.x = -5;
        if (p.y < -5)  p.y = this.canvas.height + 5;
        if (p.y > this.canvas.height + 5) p.y = -5;
      } else {
        // converge
        const pull = 0.04 + cv * 0.06;
        p.x += (p.tx - p.x) * pull;
        p.y += (p.ty - p.y) * pull;
      }
    });
  }

  draw() {
    const cv = this.convergence;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw particles
    this.particles.forEach((p, i) => {
      const op = p.opacity * (1 - cv * 0.2);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      // Particle colour — matches --color-purple (#8b5cf6 = rgb 139,92,246)
      this.ctx.fillStyle = `rgba(139,92,246,${op})`;
      this.ctx.fill();
    });

    // Draw connecting lines when converging
    if (cv > 0.45) {
      const maxDist = 35 + cv * 15;
      const lineOp  = (cv - 0.45) / 0.55;
      this.particles.forEach((p, i) => {
        for (let j = i + 1; j < this.particles.length; j++) {
          const p2 = this.particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < maxDist) {
            this.ctx.beginPath();
            this.ctx.moveTo(p.x, p.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.strokeStyle = `rgba(139,92,246,${(1 - d / maxDist) * lineOp * 0.16})`;
            this.ctx.lineWidth = 0.5;
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

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
  }
}

/* ─── Navigation ──────────────────────────────────── */
function initNav() {
  const nav = document.getElementById('main-nav');

  // Scroll state
  ScrollTrigger.create({
    start: 'top -60',
    onUpdate: self => {
      if (self.progress > 0) nav.classList.add('nav--scrolled');
      else nav.classList.remove('nav--scrolled');
    }
  });

  // Smooth scroll for anchors
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      gsap.to(window, {
        scrollTo: { y: target, offsetY: 0 },
        duration: 1.2,
        ease: 'power3.inOut'
      });
    });
  });
}

/* ─── Section 1: Noise ────────────────────────────── */
function initNoise(particles) {
  if (prefersReduced) {
    gsap.set(['#noise-title', '#noise-micro', '.scroll-indicator'], { opacity: 1 });
    return;
  }

  const tl = gsap.timeline({ delay: 0.3 });
  tl.to('#noise-title', { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }, 0)
    .to('#noise-micro',  { opacity: 1, y: 0, duration: 1,   ease: 'power3.out' }, 0.4)
    .to('.scroll-indicator', { opacity: 1, duration: 0.8, ease: 'power2.out' }, 1.0);

  gsap.set(['#noise-title', '#noise-micro'], { y: 30 });

  // Particle convergence on scroll out of section 1
  ScrollTrigger.create({
    trigger: '#noise',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate: self => {
      particles.convergence = self.progress;
    }
  });

  // Fade canvas as user enters signal section
  ScrollTrigger.create({
    trigger: '#signal',
    start: 'top 80%',
    end: 'top 20%',
    scrub: true,
    onUpdate: self => {
      document.getElementById('hero-canvas').style.opacity = 1 - self.progress;
    }
  });

  // Hide scroll indicator on first scroll
  ScrollTrigger.create({
    trigger: '#noise',
    start: 'top -20',
    onEnter: () => gsap.to('.scroll-indicator', { opacity: 0, duration: 0.4 })
  });
}

/* ─── Section 2: Signal ───────────────────────────── */
function initSignal() {
  if (prefersReduced) {
    gsap.set(['#signal-title', '#signal-body', '#signal-secondary', '.signal-areas', '.star-container'], { opacity: 1 });
    return;
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#signal',
      start: 'top 70%',
      once: true
    }
  });

  tl.from('.signal-text-block .section-label', { opacity: 0, y: 16, duration: 0.6, ease: 'power2.out' })
    .to('#signal-title',     { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.3')
    .to('#signal-body',      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
    .to('#signal-secondary', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5')
    .to('.signal-areas',     { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.4')
    .to('#star-container',   { opacity: 1, scale: 1, duration: 1.1, ease: 'power2.out' }, '-=0.7');

  gsap.set(['#signal-title', '#signal-body', '#signal-secondary'], { y: 24 });
  gsap.set('.signal-areas', { y: 16 });
  gsap.set('#star-container', { scale: 0.85 });

  // Star breathing & slow rotation (starts when section enters)
  ScrollTrigger.create({
    trigger: '#signal',
    start: 'top 60%',
    once: true,
    onEnter: () => {
      if (prefersReduced) return;
      gsap.to('#main-star', {
        rotation: 360,
        duration: 90,
        repeat: -1,
        ease: 'none',
        transformOrigin: 'center center'
      });
      gsap.to('#main-star', {
        scale: 1.06,
        duration: 4.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        transformOrigin: 'center center'
      });
    }
  });

  // Signal area hover reveal
  document.querySelectorAll('.signal-area').forEach((el, i) => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      opacity: 0,
      y: 12,
      duration: 0.5,
      delay: i * 0.07,
      ease: 'power2.out'
    });
  });
}

/* ─── Section 3: Method ───────────────────────────── */
function initMethod() {
  if (prefersReduced) {
    gsap.set(['.method-header', '.method-star-wrap'], { opacity: 1 });
    document.querySelectorAll('.method-step').forEach(el => {
      gsap.set(el, { opacity: 1, y: 0 });
    });
    gsap.set('#method-line-fill', { height: '100%' });
    return;
  }

  // Header reveal
  gsap.to('.method-header', {
    scrollTrigger: { trigger: '#method', start: 'top 70%', once: true },
    opacity: 1, y: 0, duration: 0.9, ease: 'power3.out'
  });
  gsap.set('.method-header', { y: 24 });

  // Star drop-in
  ScrollTrigger.create({
    trigger: '#method',
    start: 'top 65%',
    once: true,
    onEnter: () => {
      gsap.to('.method-star-wrap', { opacity: 1, duration: 0.8, ease: 'power2.out' });
      gsap.to('.star-crystal--sm', {
        rotation: 360,
        duration: 120,
        repeat: -1,
        ease: 'none',
        transformOrigin: 'center center'
      });
    }
  });

  // Line fill + steps
  ScrollTrigger.create({
    trigger: '.method-layout',
    start: 'top 65%',
    once: true,
    onEnter: () => {
      gsap.to('#method-line-fill', {
        height: '100%',
        duration: 1.8,
        ease: 'power2.inOut'
      });

      document.querySelectorAll('.method-step').forEach((el, i) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.65,
          delay: 0.25 + i * 0.18,
          ease: 'power3.out'
        });
      });
    }
  });
}

/* ─── Section 4: Proof ────────────────────────────── */
class ProofSection {
  constructor() {
    this.activeIndex  = 0;
    this.currentCards = [];
    this.isAnimating  = false;
    this.stage = document.getElementById('proof-stage');
    this.init();
  }

  init() {
    // Header
    if (!prefersReduced) {
      gsap.set('.proof-header', { y: 20 });
      gsap.to('.proof-header', {
        scrollTrigger: { trigger: '#proof', start: 'top 70%', once: true },
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out'
      });
    } else {
      gsap.set('.proof-header', { opacity: 1 });
    }

    // Category clicks
    document.querySelectorAll('.proof-cat').forEach(cat => {
      cat.addEventListener('click', () => {
        const idx = parseInt(cat.dataset.index, 10);
        if (idx === this.activeIndex || this.isAnimating) return;
        this.switchCategory(idx);
      });
    });

    // Initial load
    ScrollTrigger.create({
      trigger: '#proof',
      start: 'top 60%',
      once: true,
      onEnter: () => this.loadCategory(0, true)
    });
  }

  createCard(item) {
    const card = document.createElement('div');
    card.className = 'proof-card';
    card.innerHTML = `
      <div class="proof-card-img">
        <img src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.parentElement.style.background='var(--surface-2)'">
      </div>
      <div class="proof-card-body">
        <div class="proof-card-title">${item.title}</div>
        <div class="proof-card-desc">${item.description}</div>
      </div>`;
    return card;
  }

  loadCategory(index, initial = false) {
    const cat   = MINBA_CONTENT.proof.categories[index];
    const items = cat.items;
    this.stage.innerHTML = '';

    if (items.length === 1) {
      this.stage.classList.add('single-card');
    } else {
      this.stage.classList.remove('single-card');
    }

    const cards = items.map(item => {
      const card = this.createCard(item);
      this.stage.appendChild(card);
      return card;
    });

    this.currentCards = cards;

    if (prefersReduced) {
      cards.forEach(c => { c.style.opacity = '1'; });
      return;
    }

    const origins = [
      { x: -80, y: -40 },
      { x:  80, y: -50 },
      { x: -50, y:  70 },
      { x:  60, y:  60 }
    ];

    gsap.fromTo(cards, {
      opacity: 0,
      x: (i) => (origins[i % origins.length] || origins[0]).x,
      y: (i) => (origins[i % origins.length] || origins[0]).y,
      scale: 0.92,
      filter: 'blur(6px)'
    }, {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      duration: initial ? 0.75 : 0.65,
      stagger: 0.1,
      ease: 'power3.out',
      delay: initial ? 0.1 : 0,
      onComplete: () => { this.isAnimating = false; }
    });
  }

  switchCategory(newIndex) {
    this.isAnimating = true;

    // Update active state
    document.querySelectorAll('.proof-cat').forEach((el, i) => {
      el.classList.toggle('active', i === newIndex);
    });

    if (prefersReduced || this.currentCards.length === 0) {
      this.activeIndex = newIndex;
      this.loadCategory(newIndex);
      return;
    }

    const exitDirs = [
      { x:  80, y: -40 },
      { x: -70, y: -50 },
      { x:  50, y:  60 },
      { x: -60, y:  50 }
    ];

    gsap.to(this.currentCards, {
      opacity: 0,
      x: (i) => (exitDirs[i % exitDirs.length]).x,
      y: (i) => (exitDirs[i % exitDirs.length]).y,
      scale: 0.9,
      filter: 'blur(4px)',
      duration: 0.4,
      stagger: 0.06,
      ease: 'power2.in',
      onComplete: () => {
        this.activeIndex = newIndex;
        this.loadCategory(newIndex);
      }
    });
  }
}

/* ─── Section 5: Contact ──────────────────────────── */
function initContact() {
  if (prefersReduced) {
    gsap.set(['#contact-title', '#contact-body', '#contact-cta', '.contact-star-bg', '.footer'], { opacity: 1 });
    return;
  }

  // Set all initial states BEFORE creating the timeline that reads them
  gsap.set(['#contact-title', '#contact-body', '#contact-cta'], { y: 24 });
  gsap.set('.contact-star-bg', { scale: 0.9 });
  gsap.set('.contact-inner .section-label', { opacity: 0 });

  const tl = gsap.timeline({
    scrollTrigger: { trigger: '#contact', start: 'top 70%', once: true }
  });

  tl.to('.contact-star-bg',             { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.out' }, 0)
    .to('.contact-inner .section-label', { opacity: 0.65, duration: 0.6, ease: 'power2.out' }, 0.2)
    .to('#contact-title',                { opacity: 1, y: 0, duration: 1,   ease: 'power3.out' }, 0.35)
    .to('#contact-body',                 { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.60)
    .to('#contact-cta',                  { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.80)
    .to('.footer',                       { opacity: 1, duration: 0.6, ease: 'power2.out' }, 1.0);

  // Breathing star in contact
  ScrollTrigger.create({
    trigger: '#contact',
    start: 'top 60%',
    once: true,
    onEnter: () => {
      gsap.to('.star-crystal--contact', {
        rotation: 360,
        duration: 120,
        repeat: -1,
        ease: 'none',
        transformOrigin: 'center center'
      });
      gsap.to('.star-crystal--contact', {
        scale: 1.04,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        transformOrigin: 'center center'
      });
    }
  });
}

/* ─── Init ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  populateContent();

  // Particles
  const canvas = document.getElementById('hero-canvas');
  const particles = prefersReduced ? null : new ParticleCanvas(canvas);

  initNav();
  initNoise(particles || { convergence: 0 });
  initSignal();
  initMethod();
  new ProofSection();
  initContact();
});
