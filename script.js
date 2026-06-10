/* ============================================================================
   Jarvis One — vibeverseos.com landing interactions
   Plain vanilla JS, no frameworks. Loaded with `defer`.
   Modules: nav, scroll-reveal, active-link, video switcher, chat demo,
            contact form, footer year, toast helper.
   ========================================================================== */
(function () {
  'use strict';

  /* Small helpers */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------- */
  /*  Footer year                                                           */
  /* ---------------------------------------------------------------------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------------------- */
  /*  Toast helper                                                          */
  /* ---------------------------------------------------------------------- */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    // force reflow so the transition runs even on rapid calls
    void toastEl.offsetWidth;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('is-visible');
      setTimeout(() => { toastEl.hidden = true; }, 320);
    }, 2600);
  }

  /* ---------------------------------------------------------------------- */
  /*  Navbar: scroll state, mobile toggle, smooth-close on click            */
  /* ---------------------------------------------------------------------- */
  const nav        = $('.nav');
  const navToggle  = $('#navToggle');
  const navLinks   = $('#navLinks');

  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function closeMenu() {
    if (!navLinks || !navToggle) return;
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open menu');
  }
  function openMenu() {
    if (!navLinks || !navToggle) return;
    navLinks.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Close menu');
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.contains('is-open');
      open ? closeMenu() : openMenu();
    });
    // close the mobile menu after tapping any link
    $$('#navLinks a').forEach((a) => a.addEventListener('click', closeMenu));
    // close on Escape / outside click
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
    document.addEventListener('click', (e) => {
      if (!navLinks.classList.contains('is-open')) return;
      if (!navLinks.contains(e.target) && !navToggle.contains(e.target)) closeMenu();
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  Scroll-reveal animations                                              */
  /* ---------------------------------------------------------------------- */
  const revealEls = $$('.reveal');
  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ---------------------------------------------------------------------- */
  /*  Active nav link highlighting via section visibility                   */
  /* ---------------------------------------------------------------------- */
  const sections = ['home', 'features', 'demo', 'chat', 'about', 'download', 'faq', 'contact']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const linkFor = (id) => $(`#navLinks a[href="#${id}"]`);

  if ('IntersectionObserver' in window && sections.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          $$('#navLinks a').forEach((a) => a.classList.remove('is-active'));
          const link = linkFor(entry.target.id);
          if (link) link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach((s) => navObserver.observe(s));
  }

  /* ---------------------------------------------------------------------- */
  /*  Demo video switcher (+ graceful fallback when a file is missing)      */
  /* ---------------------------------------------------------------------- */
  const featuredVideo  = $('#featuredVideo');
  const featuredSource = $('#featuredSource');
  const videoCaption   = $('#videoCaption');
  const videoFallback  = $('#videoFallback');
  const thumbs         = $$('#videoList .video__thumb');

  function showFallback(missingSrc) {
    if (!videoFallback || !featuredVideo) return;
    featuredVideo.style.display = 'none';
    videoFallback.hidden = false;
    const codeEl = $('code', videoFallback);
    if (codeEl && missingSrc) codeEl.textContent = missingSrc;
  }
  function hideFallback() {
    if (!videoFallback || !featuredVideo) return;
    featuredVideo.style.display = '';
    videoFallback.hidden = true;
  }

  if (featuredVideo) {
    // If the source 404s / can't load, swap to the friendly fallback panel.
    featuredVideo.addEventListener('error', () => {
      showFallback(featuredSource ? featuredSource.getAttribute('src') : '');
    }, true);
    // The <source> element fires its own error too.
    if (featuredSource) {
      featuredSource.addEventListener('error', () => {
        showFallback(featuredSource.getAttribute('src'));
      });
    }
  }

  function switchVideo(thumb) {
    if (!featuredVideo || !featuredSource) return;
    const src   = thumb.getAttribute('data-src');
    const title = thumb.getAttribute('data-title') || 'Jarvis One demo';

    thumbs.forEach((t) => t.classList.remove('is-active'));
    thumb.classList.add('is-active');

    hideFallback();
    featuredSource.setAttribute('src', src);
    featuredVideo.load(); // re-evaluate the new source
    if (videoCaption) videoCaption.textContent = title.replace(/&amp;/g, '&');

    // Try to play; ignore promise rejection (e.g., autoplay policies / missing file)
    featuredVideo.play().catch(() => { /* user can press play; no-op */ });
  }

  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => switchVideo(thumb));
  });

  /* ---------------------------------------------------------------------- */
  /*  Interactive Jarvis chat demo (front-end mock, no backend)             */
  /* ---------------------------------------------------------------------- */
  const chatLog   = $('#chatLog');
  const chatForm  = $('#chatForm');
  const chatField = $('#chatField');
  const suggestWrap = $('#chatSuggest');

  // Pre-written responses. Keys are matched case-insensitively against the
  // suggested-prompt text; free-typed messages fall back to keyword matching.
  const SCRIPTED = {
    'call me at 3:00 am':
      "I can schedule a call reminder, but I'll make sure it's intentional before waking you up at 3:00 AM.",
    'help me launch my app':
      "I can help turn your app idea into a launch checklist with coding, design, payments, and deployment steps.",
    'show my local ai models':
      "Local model support lets you connect compatible local providers for private, offline-friendly workflows.",
    'message me a reminder':
      "Messaging can be used for reminders, updates, and assistant-triggered notifications.",
    'explain jarvis one':
      "Jarvis One is designed to be your AI command center across chat, voice, tools, and automation.",
  };

  // Keyword fallback for anything typed freely.
  function keywordReply(text) {
    const t = text.toLowerCase();
    if (/(call|phone|ring|wake)/.test(t))
      return "I can set up call reminders and voice check-ins — and I'll confirm the timing so a 3:00 AM call is always on purpose.";
    if (/(launch|ship|app|build|startup|business)/.test(t))
      return "Tell me about your project and I'll draft a launch checklist covering build, design, payments, and deployment.";
    if (/(local|ollama|offline|private|model)/.test(t))
      return "Local model support lets you connect compatible providers like Ollama for private, offline-friendly workflows.";
    if (/(message|remind|notify|notification|text)/.test(t))
      return "I can send reminders, updates, and assistant-triggered notifications whenever you need a nudge.";
    if (/(voice|talk|speak|mic)/.test(t))
      return "Voice is built in — talk to me hands-free for quick help while you keep working.";
    if (/(plugin|connect|tool|api|integrat)/.test(t))
      return "The plugin system connects your tools, APIs, and workflows into one assistant.";
    if (/(price|cost|free|pay|subscri)/.test(t))
      return "Pricing and availability vary by release — the download section always shows the latest option.";
    if (/(hi|hello|hey|yo)\b/.test(t))
      return "Hey! I'm Jarvis. Ask me about chat, voice, local models, plugins, or launching your next project.";
    return "I'm a quick demo of Jarvis One. Try a suggested prompt, or download the app to do this for real across chat, voice, and automation.";
  }

  function replyFor(text) {
    const key = text.trim().toLowerCase();
    return SCRIPTED[key] || keywordReply(text);
  }

  function addMessage(text, who) {
    if (!chatLog) return null;
    const msg = document.createElement('div');
    msg.className = `msg msg--${who}`;
    if (who === 'ai') {
      const label = document.createElement('span');
      label.className = 'msg__who';
      label.textContent = 'Jarvis';
      msg.appendChild(label);
    }
    msg.appendChild(document.createTextNode(text));
    chatLog.appendChild(msg);
    chatLog.scrollTop = chatLog.scrollHeight;
    return msg;
  }

  function showTyping() {
    if (!chatLog) return null;
    const t = document.createElement('div');
    t.className = 'msg msg--ai typing';
    t.innerHTML = '<i></i><i></i><i></i>';
    t.setAttribute('aria-label', 'Jarvis is typing');
    chatLog.appendChild(t);
    chatLog.scrollTop = chatLog.scrollHeight;
    return t;
  }

  let chatBusy = false;
  function jarvisRespond(userText) {
    if (!chatLog) return;
    chatBusy = true;
    const typingEl = showTyping();
    const reply = replyFor(userText);
    // Typing time scales gently with reply length, capped for snappiness.
    const delay = prefersReduced ? 250 : Math.min(1500, 550 + reply.length * 12);
    setTimeout(() => {
      if (typingEl) typingEl.remove();
      addMessage(reply, 'ai');
      chatBusy = false;
    }, delay);
  }

  function sendUserMessage(text) {
    const clean = (text || '').trim();
    if (!clean || chatBusy) return;
    addMessage(clean, 'me');
    jarvisRespond(clean);
  }

  // Preload the opening conversation.
  function seedChat() {
    if (!chatLog) return;
    addMessage('Welcome back. I’m online and ready.', 'ai');
    addMessage('What can you help me with?', 'me');
    addMessage(
      'I can help you code, research, organize projects, automate workflows, call or message you, and connect tools into one command center.',
      'ai'
    );
  }
  seedChat();

  if (chatForm && chatField) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      sendUserMessage(chatField.value);
      chatField.value = '';
      chatField.focus();
    });
  }

  if (suggestWrap) {
    $$('.suggest', suggestWrap).forEach((btn) => {
      btn.addEventListener('click', () => {
        sendUserMessage(btn.getAttribute('data-prompt') || btn.textContent);
      });
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  Contact form — front-end success state                                */
  /*  BACKEND: replace the body of handleContactSubmit() with a fetch()     */
  /*  POST to your endpoint (Supabase Edge Function, Formspree, etc.).      */
  /* ---------------------------------------------------------------------- */
  const contactForm    = $('#contactForm');
  const contactSuccess = $('#contactSuccess');

  function handleContactSubmit(e) {
    e.preventDefault();
    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }
    // --- Begin demo behavior (swap for a real request when ready) ---
    if (contactSuccess) contactSuccess.hidden = false;
    toast('Message captured ✓');
    contactForm.reset();
    // --- End demo behavior ---
  }

  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
    // Hide the success note again as soon as the user starts editing.
    contactForm.addEventListener('input', () => {
      if (contactSuccess && !contactSuccess.hidden) contactSuccess.hidden = true;
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  Subtle parallax on the hero mockup (pointer-driven, desktop only)     */
  /* ---------------------------------------------------------------------- */
  const heroVisual = $('.hero__visual');
  const mockup = $('.mockup');
  if (heroVisual && mockup && !prefersReduced && window.matchMedia('(pointer:fine)').matches) {
    heroVisual.addEventListener('mousemove', (e) => {
      const r = heroVisual.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      mockup.style.transform =
        `perspective(1400px) rotateY(${-7 + dx * 6}deg) rotateX(${3 - dy * 6}deg)`;
    });
    heroVisual.addEventListener('mouseleave', () => {
      mockup.style.transform = '';
    });
  }
})();
