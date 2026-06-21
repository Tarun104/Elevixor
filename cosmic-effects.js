/**
 * ELEVIXOR COSMIC SPACE-TECH EXPERIENCE
 * Premium Animated Background System
 */

class CosmicEffects {
  constructor() {
    this.init();
  }

  init() {
    this.createCosmicBackground();
    this.initializeStarField();
    this.initializeParticles();
    this.initializeMouse();
    this.setupScrollAnimations();
  }

  createCosmicBackground() {
    // Create main cosmic container
    if (document.querySelector('.cosmic-container')) return;

    const cosmicContainer = document.createElement('div');
    cosmicContainer.className = 'cosmic-container';

    // Star field canvas
    const canvas = document.createElement('canvas');
    canvas.className = 'star-field-canvas';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cosmicContainer.appendChild(canvas);

    // Particle container
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particle-container';
    cosmicContainer.appendChild(particleContainer);

    // Nebula clouds layer
    const nebula = document.createElement('div');
    nebula.className = 'nebula-layer';
    cosmicContainer.appendChild(nebula);

    // Aurora layer
    const aurora = document.createElement('div');
    aurora.className = 'aurora-layer';
    cosmicContainer.appendChild(aurora);

    // Glow orbs
    const glowOrbs = document.createElement('div');
    glowOrbs.className = 'glow-orbs';
    for (let i = 0; i < 5; i++) {
      const orb = document.createElement('div');
      orb.className = 'glow-orb';
      glowOrbs.appendChild(orb);
    }
    cosmicContainer.appendChild(glowOrbs);

    document.body.prepend(cosmicContainer);

    // Handle window resize
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }

  initializeStarField() {
    const canvas = document.querySelector('.star-field-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const stars = [];
    const starCount = Math.floor((window.innerWidth * window.innerHeight) / 4000);

    // Generate stars
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 0.8,
        opacity: Math.random() * 0.7 + 0.3,
        twinkleDuration: Math.random() * 3000 + 2000,
        twinkling: 0,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
      });
    }

    const animateStars = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        // Twinkling effect
        star.twinkling += 1;
        const twinklePhase =
          (Math.sin((star.twinkling / star.twinkleDuration) * Math.PI * 2) + 1) / 2;
        star.opacity = Math.random() * 0.7 + 0.3 + twinklePhase * 0.2;

        // Slow drift
        star.x += star.vx;
        star.y += star.vy;

        // Wrap around
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        // Draw star
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();

        // Add glow
        const glowGradient = ctx.createRadialGradient(
          star.x,
          star.y,
          0,
          star.x,
          star.y,
          star.radius * 3
        );
        glowGradient.addColorStop(0, `rgba(96, 165, 250, ${star.opacity * 0.4})`);
        glowGradient.addColorStop(1, 'rgba(96, 165, 250, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animateStars);
    };

    animateStars();
  }

  initializeParticles() {
    const container = document.querySelector('.particle-container');
    if (!container) return;

    const particleCount = 183;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'cosmic-particle';

      const size = Math.random() * 3 + 1;
      const duration = Math.random() * 20 + 30;
      const delay = Math.random() * 10;

      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animation = `particleFloat ${duration}s ease-in-out ${delay}s infinite`;
      particle.style.opacity = Math.random() * 0.6 + 0.2;

      container.appendChild(particle);
    }
  }

  initializeMouse() {
    const cosmicContainer = document.querySelector('.cosmic-container');
    if (!cosmicContainer) return;

    document.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;

      cosmicContainer.style.setProperty('--mouse-x', x + '%');
      cosmicContainer.style.setProperty('--mouse-y', y + '%');
    });
  }

  setupScrollAnimations() {
    // Reveal elements on scroll
    const revealElements = () => {
      const elements = document.querySelectorAll(
        '.service-card, .business-service-card, .why-choose-card, .testimonial-card, .stat-box, .feature-box, .faq-item, .step, .plan-card, section'
      );

      elements.forEach((el) => {
        if (el.classList.contains('revealed')) return;

        const elementTop = el.getBoundingClientRect().top;
        const elementVisible = 150;

        if (elementTop < window.innerHeight - elementVisible) {
          el.classList.add('revealed');
        }
      });
    };

    window.addEventListener('scroll', revealElements);
    revealElements();
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new CosmicEffects();

  // Apply page-loaded state for both cosmic and premium styles
  document.body.classList.add('cosmic-loaded', 'loaded');
});

// Additional mouse-reactive glow effect
document.addEventListener('mousemove', (e) => {
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;

  document.body.style.setProperty('--glow-x', x * 100 + '%');
  document.body.style.setProperty('--glow-y', y * 100 + '%');
});
