/* ─── Lenis Smooth Scroll ─────────────────────────────── */
let lenis;
try {
  if (typeof Lenis !== 'undefined' && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        return arguments.length ? lenis.scrollTo(value) : lenis.scroll.instance.scroll.y;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
      pinType: document.body.style.transform ? 'transform' : 'fixed',
    });

    lenis.on('scroll', ScrollTrigger.update);
    ScrollTrigger.addEventListener('refresh', () => lenis.update());
    gsap.ticker.lagSmoothing(0);
  } else {
    console.warn('Lenis, GSAP, or ScrollTrigger not available. Skipping smooth scroll initialization.');
  }
} catch (error) {
  console.warn('Smooth scroll initialization failed:', error);
}

/* ─── Loader ──────────────────────────────────────────── */
const loaderBar = document.getElementById('loaderBar');
const loader = document.getElementById('loader');
let progress = 0;
const loaderInterval = setInterval(() => {
  progress += Math.random() * 25;
  if (loaderBar) loaderBar.style.width = Math.min(progress, 90) + '%';
  if (progress >= 90) clearInterval(loaderInterval);
}, 120);

function hideLoader() {
  clearInterval(loaderInterval);
  if (loader) {
    loader.style.opacity = '0';
    loader.style.display = 'none';
  }
}

window.addEventListener('load', () => {
  if (loaderBar) loaderBar.style.width = '100%';
  setTimeout(() => {
    if (typeof gsap !== 'undefined' && loader) {
      gsap.to(loader, {
        opacity: 0, duration: 0.6, ease: 'power2.inOut',
        onComplete: () => {
          hideLoader();
          if (typeof initAnimations === 'function') {
            initAnimations();
            if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();

            // re-run layout refresh after fonts load to avoid intermittent layout shifts
            if (document.fonts && document.fonts.ready) {
              document.fonts.ready.then(() => {
                if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
                if (typeof lenis !== 'undefined' && lenis && typeof lenis.update === 'function') lenis.update();
              }).catch(() => {});
            }
          }
        }
      });
    } else {
      hideLoader();
      if (typeof initAnimations === 'function') initAnimations();
    }
  }, 300);
});

window.addEventListener('error', () => {
  hideLoader();
});

/* ─── Navbar scroll effect ────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

/* ─── Mobile Menu ─────────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
function closeMobile() { mobileMenu.classList.remove('open'); }

/* ─── FAQ ─────────────────────────────────────────────── */
function toggleFaq(el) {
  const item = el.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

/* ─── Pricing Toggle ──────────────────────────────────── */
let isYearly = false;
function togglePricing() {
  isYearly = !isYearly;
  const pill = document.getElementById('togglePill');
  const mLabel = document.getElementById('monthlyLabel');
  const yLabel = document.getElementById('yearlyLabel');
  pill.classList.toggle('yearly', isYearly);
  mLabel.classList.toggle('active', !isYearly);
  yLabel.classList.toggle('active', isYearly);
  document.querySelectorAll('.price-amount').forEach(el => {
    const target = isYearly ? el.dataset.yearly : el.dataset.monthly;
    gsap.to({ val: parseInt(el.textContent.replace(/,/g, '')) }, {
      val: parseInt(target),
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: function () { el.textContent = Math.round(this.targets()[0].val).toLocaleString(); }
    });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.price-amount').forEach(el => {
    el.textContent = Number(el.dataset.monthly).toLocaleString();
  });
});

/* ─── Contact Form Submit ─────────────────────────────── */
function handleSubmit(btn) {
  const original = btn.innerHTML;
  btn.innerHTML = 'Sending... ⏳';
  btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = '✅ Message Sent!';
    btn.style.background = 'linear-gradient(135deg, #22c55e, #06c8d4)';
    setTimeout(() => {
      btn.innerHTML = original;
      btn.style.background = '';
      btn.disabled = false;
    }, 3000);
  }, 1800);
}

/* ─── GSAP Animations ─────────────────────────────────── */
function initAnimations() {
  // guard against multiple initializations
  if (window._animationsInitialized) return;
  window._animationsInitialized = true;

  gsap.registerPlugin(ScrollTrigger);

  const heroTL = gsap.timeline({ delay: 0.04 });
  heroTL
    .from('.hero-badge', { opacity: 0, y: 20, duration: 0.55, ease: 'power3.out' })
    .from('.hero-title', { opacity: 0, y: 55, duration: 0.9, ease: 'power3.out' }, '-=0.55')
    .from('.hero-sub', { opacity: 0, y: 35, duration: 0.7, ease: 'power3.out' }, '-=0.8')
    .from('.hero-actions', { opacity: 0, y: 25, duration: 0.7, ease: 'power3.out' }, '-=0.7')
    .from('.hero-stats', { opacity: 0, y: 25, duration: 0.7, ease: 'power3.out' }, '-=0.65')
    .from('.hero-card-main', { opacity: 0, scale: 0.88, y: 22, rotationX: 10, rotationY: -8, duration: 0.8, ease: 'back.out(1.5)' }, '-=0.55')
    .from(['.hero-card-1', '.hero-card-2', '.hero-card-3'], { opacity: 0, scale: 0.9, y: 22, rotationX: 10, duration: 0.65, stagger: 0.12, ease: 'back.out(1.6)' }, '-=0.55')
    .from('.floating-shape', { opacity: 0, scale: 0, duration: 0.75, stagger: 0.15, ease: 'back.out(2)' }, '-=0.75');

  gsap.to('.hero-card-main', {
    rotationY: 12,
    rotationX: 6,
    x: 12,
    y: 10,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.8,
    }
  });

  gsap.to('.hero-card-1', {
    rotationY: -10,
    rotationX: 8,
    x: -14,
    y: 6,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.8,
    }
  });

  gsap.to('.hero-card-2', {
    rotationY: 10,
    rotationX: -6,
    x: 16,
    y: 12,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.8,
    }
  });

  gsap.to('.hero-card-3', {
    rotationY: 8,
    rotationX: 6,
    x: 10,
    y: -4,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.8,
    }
  });

  gsap.utils.toArray('.logo-item').forEach((logo, index) => {
    gsap.from(logo, {
      opacity: 0,
      y: 40,
      rotationX: 25,
      rotationY: -15,
      z: -30,
      duration: 1.1,
      ease: 'back.out(1.4)',
      delay: index * 0.06,
      scrollTrigger: {
        trigger: logo,
        start: 'top 95%',
        once: true
      },
      onComplete: () => { logo.classList.add('animated'); }
    });

    gsap.to(logo, {
      rotationX: 12,
      rotationY: 10,
      z: 12,
      ease: 'none',
      scrollTrigger: {
        trigger: '#trusted',
        start: 'top 95%',
        end: 'bottom top',
        scrub: 1,
      }
    });
  });

  document.querySelectorAll('.hero-stat-num[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    gsap.to({ val: 0 }, {
      val: target, delay: 1.2, duration: 2, ease: 'power2.out',
      onUpdate: function () { el.textContent = Math.round(this.targets()[0].val); }
    });
  });

  gsap.utils.toArray('.reveal').forEach((el) => {
    gsap.fromTo(el,
      { opacity: 0, y: 50 },
      {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
        onComplete: () => { el.classList.add('animated'); }
      }
    );
  });

  gsap.utils.toArray('.service-card').forEach((card, index) => {
    gsap.from(card, {
      opacity: 0,
      y: 60,
      rotationX: 12,
      rotationY: -8,
      duration: 1.0,
      ease: 'power3.out',
      delay: index * 0.08,
      scrollTrigger: { trigger: card, start: 'top 92%', once: true },
      onComplete: () => { card.classList.add('animated'); }
    });

    gsap.to(card, {
      rotationY: 10,
      rotationX: 6,
      z: 16,
      x: index % 2 === 0 ? 12 : -12,
      ease: 'none',
      scrollTrigger: { trigger: card, start: 'top 100%', end: 'bottom top', scrub: 0.8 }
    });
  });

  gsap.utils.toArray('.section-title').forEach((title) => {
    gsap.from(title, {
      opacity: 0,
      y: 52,
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: { trigger: title, start: 'top 90%', once: true },
      onComplete: () => { title.classList.add('animated'); }
    });
  });

  gsap.from('.testi-card', {
    opacity: 0, y: 30, duration: 0.6, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: '.testi-grid', start: 'top 82%', once: true },
    onComplete: () => { document.querySelectorAll('.testi-card').forEach(el => el.classList.add('animated')); }
  });

  document.querySelectorAll('.counter[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to({ val: 0 }, {
          val: target, duration: 2.2, ease: 'power2.out',
          onUpdate: function () { el.textContent = Math.round(this.targets()[0].val); }
        });
      }
    });
  });

  document.querySelectorAll('.stat-bar').forEach(bar => {
    const w = bar.dataset.width + '%';
    ScrollTrigger.create({
      trigger: bar,
      start: 'top 85%',
      once: true,
      onEnter: () => { gsap.to(bar, { width: w, duration: 1.6, ease: 'power3.out', delay: 0.3 }); }
    });
  });

  gsap.utils.toArray('.port-item').forEach((item, index) => {
    gsap.from(item, {
      opacity: 0,
      y: 80,
      rotationX: 20,
      rotationY: index % 2 === 0 ? -12 : 12,
      z: -40,
      duration: 1.3,
      ease: 'back.out(1.3)',
      delay: index * 0.12,
      scrollTrigger: {
        trigger: item,
        start: 'top 92%',
        once: true
      },
      onComplete: () => { item.classList.add('animated'); }
    });

    gsap.to(item, {
      rotationX: 8,
      rotationY: index % 2 === 0 ? 4 : -4,
      z: 20,
      x: index % 2 === 0 ? 8 : -8,
      ease: 'none',
      scrollTrigger: {
        trigger: item,
        start: 'top 100%',
        end: 'bottom top',
        scrub: 1.2
      }
    });
  });

  gsap.utils.toArray('.port-bg').forEach(bg => {
    gsap.to(bg, {
      yPercent: -12,
      ease: 'none',
      scrollTrigger: { trigger: bg.closest('.port-item'), scrub: 1.5 }
    });
  });

  gsap.from('.process-step', {
    opacity: 0, y: 40, scale: 0.95, duration: 0.7, stagger: 0.15, ease: 'power3.out',
    scrollTrigger: { trigger: '.process-steps', start: 'top 80%', once: true },
    onComplete: () => { document.querySelectorAll('.process-step').forEach(el => el.classList.add('animated')); }
  });

  gsap.from('.industry-card', {
    opacity: 0, y: 30, duration: 0.5, stagger: 0.07, ease: 'power3.out',
    scrollTrigger: { trigger: '.industry-grid', start: 'top 82%', once: true },
    onComplete: () => { document.querySelectorAll('.industry-card').forEach(el => el.classList.add('animated')); }
  });

  gsap.from('.pricing-card', {
    opacity: 0, y: 40, scale: 0.96, duration: 0.7, stagger: 0.15, ease: 'back.out(1.2)',
    scrollTrigger: { trigger: '.pricing-grid', start: 'top 80%', once: true },
    onComplete: () => { document.querySelectorAll('.pricing-card').forEach(el => el.classList.add('animated')); }
  });

  gsap.from('.faq-item', {
    opacity: 0, x: -20, duration: 0.6, stagger: 0.08, ease: 'power3.out',
    scrollTrigger: { trigger: '.faq-list', start: 'top 82%', once: true },
    onComplete: () => { document.querySelectorAll('.faq-item').forEach(el => el.classList.add('animated')); }
  });

  gsap.from('.contact-form', {
    opacity: 0, x: 40, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '.contact-form', start: 'top 82%', once: true },
    onComplete: () => { document.querySelector('.contact-form')?.classList.add('animated'); }
  });

  gsap.from('#final-cta .reveal > *', {
    opacity: 0, y: 30, duration: 0.7, stagger: 0.15, ease: 'power3.out',
    scrollTrigger: { trigger: '#final-cta', start: 'top 80%', once: true },
    onComplete: () => { document.querySelectorAll('#final-cta .reveal > *').forEach(el => el.classList.add('animated')); }
  });

  gsap.from('.section-label', {
    opacity: 0, x: -20, duration: 0.6, ease: 'power3.out',
    scrollTrigger: { trigger: '.section-label', start: 'top 88%', once: true },
    onComplete: () => { document.querySelectorAll('.section-label').forEach(el => el.classList.add('animated')); }
  });

  // Ensure ScrollTrigger is fully refreshed after all animations are set up
  ScrollTrigger.refresh();
}

document.addEventListener('scroll', () => {
  // Scroll event listeners removed
});
