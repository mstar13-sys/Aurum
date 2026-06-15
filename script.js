/* ─── AURUM GRAND HOTEL — script.js ────────────────────── */

(function () {
  'use strict';

  // ── HELPERS ────────────────────────────────────────────
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return [...(ctx || document).querySelectorAll(sel)]; }

  function showToast(msg, duration = 3000) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
  }

  // ── NAV: SCROLL + ACTIVE STATE ─────────────────────────
  const nav = $('#nav');
  let lastScrollY = 0;

  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 80);
    // Back-to-top visibility
    const btt = $('#backToTop');
    if (btt) btt.classList.toggle('visible', y > 500);
    lastScrollY = y;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  // ── NAV: HAMBURGER ──────────────────────────────────────
  const hamburger = $('#hamburger');
  const navLinks  = $('#navLinks');
  const navOverlay = $('#navOverlay');

  function openNav() {
    navLinks.classList.add('open');
    navOverlay.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    navLinks.classList.remove('open');
    navOverlay.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.contains('open');
      isOpen ? closeNav() : openNav();
    });

    // Close on link click
    $$('a', navLinks).forEach(a => a.addEventListener('click', closeNav));

    // Close on overlay click
    if (navOverlay) navOverlay.addEventListener('click', closeNav);

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) closeNav();
    });
  }

  // ── SCROLL REVEAL ───────────────────────────────────────
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal').forEach(el => revealObserver.observe(el));

  // ── COUNTER ANIMATION ───────────────────────────────────
  function animateCounter(el) {
    const target  = parseInt(el.dataset.target);
    const suffix  = el.dataset.suffix || '';
    if (isNaN(target)) return;
    const duration = 1800;
    const start    = performance.now();

    function tick(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const statsObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        $$('.stat-num', e.target).forEach(el => animateCounter(el));
        statsObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });

  const statsSection = $('#stats');
  if (statsSection) statsObserver.observe(statsSection);

  // ── FAQ ACCORDION ───────────────────────────────────────
  $$('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq-item');
      const answer = btn.nextElementSibling;
      const isOpen = item.classList.contains('open');

      // Close all
      $$('.faq-item.open').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        const a = i.querySelector('.faq-a');
        a.removeAttribute('style');
      });

      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // ── LIGHTBOX ────────────────────────────────────────────
  const lightbox     = $('#lightbox');
  const lightboxImg  = $('#lightbox-img');
  const lightboxClose = $('#lightbox-close');

  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || 'Gallery image';
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lightboxImg.src = '';
  }

  if (lightbox) {
    lightbox.addEventListener('click', e => {
      if (e.target === lightbox) closeLightbox();
    });
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && lightbox.getAttribute('aria-hidden') === 'false') closeLightbox();
    });
  }

  $$('[data-lightbox-src]').forEach(item => {
    const open = () => openLightbox(item.dataset.lightboxSrc, item.querySelector('.gallery-img')?.getAttribute('aria-label') || 'Gallery image');
    item.addEventListener('click', open);
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });

  // ── TESTIMONIAL CAROUSEL ────────────────────────────────
  const track = $('#testiTrack');
  const dots  = $$('.testi-dot');
  const cards = $$('.testi-card');
  const prevBtn = $('#testiPrev');
  const nextBtn = $('#testiNext');

  let currentSlide = 0;
  let autoSlide;
  let isDragging = false;
  let startX = 0;
  let startScroll = 0;

  function getVisibleCount() {
    const w = window.innerWidth;
    if (w <= 560) return 1;
    if (w <= 900) return 2;
    return 3;
  }

  function getCardWidth() {
    if (!cards[0]) return 0;
    const gap = 24; // 1.5rem
    return cards[0].offsetWidth + gap;
  }

  function maxSlide() {
    return Math.max(0, cards.length - getVisibleCount());
  }

  function goToSlide(n) {
    if (!track) return;
    const max = maxSlide();
    n = Math.max(0, Math.min(n, max));
    currentSlide = n;
    track.style.transform = `translateX(-${n * getCardWidth()}px)`;
    dots.forEach((d, i) => {
      const active = i === n;
      d.classList.toggle('active', active);
      d.setAttribute('aria-selected', String(active));
    });
  }

  function startAutoSlide() {
    stopAutoSlide();
    autoSlide = setInterval(() => goToSlide((currentSlide + 1) > maxSlide() ? 0 : currentSlide + 1), 4800);
  }

  function stopAutoSlide() {
    clearInterval(autoSlide);
  }

  if (track && cards.length) {
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        goToSlide(parseInt(dot.dataset.slide));
        stopAutoSlide(); startAutoSlide();
      });
    });

    if (prevBtn) prevBtn.addEventListener('click', () => {
      goToSlide(currentSlide - 1 < 0 ? maxSlide() : currentSlide - 1);
      stopAutoSlide(); startAutoSlide();
    });

    if (nextBtn) nextBtn.addEventListener('click', () => {
      goToSlide((currentSlide + 1) > maxSlide() ? 0 : currentSlide + 1);
      stopAutoSlide(); startAutoSlide();
    });

    // Touch/swipe support
    const outer = track.closest('.testi-outer');
    if (outer) {
      outer.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        stopAutoSlide();
      }, { passive: true });

      outer.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 50) {
          goToSlide(dx < 0 ? currentSlide + 1 : currentSlide - 1);
        }
        startAutoSlide();
      }, { passive: true });
    }

    track.addEventListener('mouseenter', stopAutoSlide);
    track.addEventListener('mouseleave', startAutoSlide);

    window.addEventListener('resize', () => goToSlide(currentSlide), { passive: true });

    goToSlide(0);
    startAutoSlide();
  }

  // ── LIVE CHAT TOGGLE ────────────────────────────────────
  const chatFab    = $('#chatFab');
  const chatBubble = $('#chatBubble');
  const chatClose  = $('#chatClose');
  const chatInput  = $('#chatInput');
  const chatStartBtn = $('#chatStartBtn');

  function openChat() {
    if (!chatBubble) return;
    chatBubble.setAttribute('aria-hidden', 'false');
    chatFab.setAttribute('aria-expanded', 'true');
    setTimeout(() => chatInput && chatInput.focus(), 100);
  }

  function closeChat() {
    if (!chatBubble) return;
    chatBubble.setAttribute('aria-hidden', 'true');
    chatFab.setAttribute('aria-expanded', 'false');
    chatFab.focus();
  }

  if (chatFab) chatFab.addEventListener('click', () => {
    const isOpen = chatBubble.getAttribute('aria-hidden') === 'false';
    isOpen ? closeChat() : openChat();
  });

  if (chatClose) chatClose.addEventListener('click', closeChat);

  if (chatStartBtn) chatStartBtn.addEventListener('click', () => {
    const val = chatInput ? chatInput.value.trim() : '';
    if (!val) { showToast('Please type a message first.'); return; }
    showToast('Connecting you to our concierge…');
    closeChat();
  });

  // ── BACK TO TOP ─────────────────────────────────────────
  const bttBtn = $('#backToTop');
  if (bttBtn) {
    bttBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── BOOKING BAR ─────────────────────────────────────────
  const searchBtn = $('#searchAvailBtn');
  const checkin   = $('#checkin');
  const checkout  = $('#checkout');

  // Set default dates
  if (checkin && checkout) {
    const today    = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    checkin.min  = today.toISOString().split('T')[0];
    checkin.value = tomorrow.toISOString().split('T')[0];
    checkout.min = tomorrow.toISOString().split('T')[0];
    checkout.value = nextWeek.toISOString().split('T')[0];

    checkin.addEventListener('change', () => {
      const d = new Date(checkin.value);
      d.setDate(d.getDate() + 1);
      checkout.min   = d.toISOString().split('T')[0];
      if (new Date(checkout.value) <= new Date(checkin.value)) {
        checkout.value = d.toISOString().split('T')[0];
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      if (checkin && checkout) {
        const ci = new Date(checkin.value);
        const co = new Date(checkout.value);
        if (ci >= co) {
          showToast('Check-out must be after check-in.');
          return;
        }
      }
      showToast('Searching availability…');
      setTimeout(() => {
        document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' });
      }, 800);
    });
  }

  // ── CONTACT FORM ────────────────────────────────────────
  const sendBtn = $('#sendMsgBtn');
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const name  = $('#fname')?.value.trim();
      const email = $('#femail')?.value.trim();
      const msg   = $('#fmessage')?.value.trim();
      if (!name || !email || !msg) {
        showToast('Please fill in all required fields.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Please enter a valid email address.');
        return;
      }
      showToast("Message sent \u2014 we\u2019ll respond within the hour!", 4000);
      ['#fname','#femail','#fphone','#fmessage'].forEach(s => {
        const el = $(s);
        if (el) el.value = '';
      });
    });
  }

  // ── OFFER BUTTONS ────────────────────────────────────────
  $$('.offer-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      showToast('Package details — please contact our concierge.');
    });
  });

  // ── CLAIM OFFER BANNER ───────────────────────────────────
  const claimBtn = $('#claimOfferBtn');
  if (claimBtn) {
    claimBtn.addEventListener('click', () => {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => showToast('Use code DIRECT20 when contacting us.', 4000), 600);
    });
  }

  // ── NEWSLETTER ───────────────────────────────────────────
  const nlBtn = $('#newsletterBtn');
  if (nlBtn) {
    nlBtn.addEventListener('click', () => {
      const input = $('#newsletter-email');
      const val   = input ? input.value.trim() : '';
      if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        showToast('Please enter a valid email address.');
        return;
      }
      showToast('Subscribed! Welcome to Aurum.', 3500);
      if (input) input.value = '';
    });
  }

  // ── TEAM CHAT BUTTONS ────────────────────────────────────
  $$('.team-actions .btn-gold').forEach(btn => {
    btn.addEventListener('click', () => {
      openChat();
    });
  });

  // ── ROOM BUTTONS ─────────────────────────────────────────
  $$('.room-actions .btn-ghost').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const name = btn.closest('.room-card-info')?.querySelector('h3')?.textContent;
      showToast(`Viewing details for: ${name || 'this room'}`);
    });
  });

  $$('.room-actions .btn-gold').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const name = btn.closest('.room-card-info')?.querySelector('h3')?.textContent;
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => showToast(`Booking: ${name || 'room'} — complete the form below.`, 3500), 700);
    });
  });

  // ── SMOOTH ANCHOR SCROLL (offset for sticky nav) ─────────
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ── SCROLLSPY: Active nav link ──────────────────────────
  const sections = $$('section[id], div[id]').filter(el =>
    $$('#navLinks a').some(a => a.getAttribute('href') === '#' + el.id)
  );
  const navAnchors = $$('#navLinks a:not(.btn-gold, .nav-book-btn)');

  function updateActiveNav() {
    const scrollMid = window.scrollY + window.innerHeight / 3;
    let active = null;
    sections.forEach(sec => {
      if (sec.offsetTop <= scrollMid) active = sec.id;
    });
    navAnchors.forEach(a => {
      const isActive = a.getAttribute('href') === '#' + active;
      a.style.color = isActive ? 'var(--gold)' : '';
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

  // ── KEYBOARD TRAP for lightbox ──────────────────────────
  if (lightbox) {
    lightbox.addEventListener('keydown', e => {
      if (lightbox.getAttribute('aria-hidden') === 'false') {
        if (e.key === 'Tab') { e.preventDefault(); lightboxClose && lightboxClose.focus(); }
      }
    });
  }

  // ── LAZY-LOAD background images (IntersectionObserver) ──
  const bgEls = $$('[class*="asset-bg-"]');
  if ('IntersectionObserver' in window) {
    const bgObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          // Image is already in CSS via class; just ensure it paints
          e.target.style.willChange = 'transform';
          bgObserver.unobserve(e.target);
        }
      });
    }, { rootMargin: '200px' });
    bgEls.forEach(el => bgObserver.observe(el));
  }

  // ── ROOM CARD: keyboard accessibility ──────────────────
  $$('.room-card').forEach(card => {
    card.setAttribute('tabindex', '0');
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        card.querySelector('.btn-gold')?.click();
      }
    });
  });

  // ── OFFER CARD hover via keyboard ──────────────────────
  $$('.offer-card').forEach(card => {
    card.setAttribute('tabindex', '0');
  });

  // ── GALLERY keyboard support (already added tabindex in HTML) ─
  // Already handled in lightbox section above via keydown 'Enter'/' '

  // ── DATE INPUT: native date picker fallback ─────────────
  // If browser doesn't support date input, show ISO placeholder
  if (checkin && checkin.type !== 'date') {
    checkin.type = 'text';
    checkin.placeholder = 'YYYY-MM-DD';
    if (checkout) { checkout.type = 'text'; checkout.placeholder = 'YYYY-MM-DD'; }
  }


})();
