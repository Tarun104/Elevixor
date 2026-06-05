document.addEventListener('DOMContentLoaded', function () {
    if (!document.querySelector('.page-ambient')) {
        const ambient = document.createElement('div');
        ambient.className = 'page-ambient';
        document.body.prepend(ambient);
    }

    document.body.classList.add('loaded');

    const selectorList = [
        'section',
        '.hero',
        '.card',
        '.plan-card',
        '.service-card',
        '.business-service-card',
        '.feature-box',
        '.testimonial-card',
        '.info-card',
        '.payment-card',
        '.modal-card',
        '.why-choose-card',
        '.faq-item',
        '.step',
        '.hero-image',
        '.section-card'
    ];

    const revealItems = [];
    selectorList.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => revealItems.push(el));
    });

    revealItems.forEach(el => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const index = revealItems.indexOf(entry.target);
                entry.target.style.transitionDelay = `${(index % 10) * 60}ms`;
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.18,
        rootMargin: '0px 0px -80px 0px'
    });

    revealItems.forEach(el => observer.observe(el));

    document.querySelectorAll('.stat-number').forEach(element => {
        const valueText = element.textContent.trim();
        const match = valueText.match(/^\d+/);
        if (!match) return;

        const endValue = parseInt(match[0], 10);
        const suffix = valueText.slice(match[0].length);
        let started = false;

        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !started) {
                    started = true;
                    const start = performance.now();
                    const duration = 1400;

                    const step = (timestamp) => {
                        const elapsed = Math.min(duration, timestamp - start);
                        const progress = 1 - Math.pow(1 - elapsed / duration, 3);
                        element.textContent = `${Math.round(endValue * progress)}${suffix}`;
                        if (elapsed < duration) {
                            requestAnimationFrame(step);
                        }
                    };
                    requestAnimationFrame(step);
                    counterObserver.unobserve(element);
                }
            });
        }, { threshold: 0.55 });

        counterObserver.observe(element);
    });

    const tiltCards = document.querySelectorAll('.service-card, .business-service-card, .plan-card, .info-card, .payment-card');
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', event => {
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            const rotateX = -y * 7;
            const rotateY = x * 7;
            card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.005)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
        });
    });

    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mousemove', event => {
            const rect = btn.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
            const y = ((event.clientY - rect.top) / rect.height - 0.5) * 7;
            btn.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.02)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });

    const hero = document.querySelector('.hero');
    const heroText = document.querySelector('.hero-text');
    const heroImage = document.querySelector('.hero-image');
    let heroX = 0;
    let heroY = 0;
    let heroScroll = 0;

    function updateHeroMotion() {
        if (hero) {
            hero.style.transform = `translateY(${heroScroll}px)`;
        }
        if (heroText) {
            heroText.style.transform = `translateZ(12px) rotateY(${heroX * 8}deg) rotateX(${-heroY * 6}deg)`;
        }
        if (heroImage) {
            heroImage.style.transform = `translateY(${heroScroll / 1.8}px) translateZ(14px) rotateY(${heroX * 7}deg) rotateX(${-heroY * 5}deg)`;
        }
    }

    if (hero) {
        hero.addEventListener('mousemove', event => {
            const rect = hero.getBoundingClientRect();
            heroX = (event.clientX - rect.left) / rect.width - 0.5;
            heroY = (event.clientY - rect.top) / rect.height - 0.5;
            updateHeroMotion();
        });
        hero.addEventListener('mouseleave', () => {
            heroX = 0;
            heroY = 0;
            updateHeroMotion();
        });
    }

    window.addEventListener('mousemove', event => {
        document.body.style.setProperty('--mouse-x', `${event.clientX}px`);
        document.body.style.setProperty('--mouse-y', `${event.clientY}px`);
    });

    if (hero) {
        window.addEventListener('scroll', () => {
            heroScroll = window.scrollY * 0.04;
            updateHeroMotion();
        }, { passive: true });
    }
});
