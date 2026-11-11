/* Thalamic — shared page behaviour.
   Replaces the DCLogic class from the Claude Design source: the design-time
   props become URL switches, and componentDidMount's reveal becomes a plain
   IntersectionObserver. */
(function () {
  // Design-time props, carried over as URL switches (index.html only):
  //   ?tone=quiet|visionary|human   (default quiet)  — hero copy register
  //   ?pipeline=off                 (default on)     — FIG. 01 data-path strip
  var params = new URLSearchParams(location.search);

  // Typography setting: ?type=unified|editorial|original (default unified,
  // already on <html> so it holds without scripting). See site.css.
  var type = params.get('type');
  if (['unified', 'editorial', 'original'].indexOf(type) !== -1) {
    document.documentElement.dataset.type = type;
  }

  var tone = params.get('tone');
  if (['quiet', 'visionary', 'human'].indexOf(tone) !== -1) {
    document.documentElement.dataset.tone = tone;
  }
  if (params.get('pipeline') === 'off') {
    document.documentElement.dataset.pipeline = 'off';
  }

  // Scroll reveal. The hidden state is applied from JS so that with scripting
  // disabled — or motion reduced — every section stays visible.
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if (reduced || !('IntersectionObserver' in window) || !els.length) return;

  els.forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity .8s ease, transform .8s cubic-bezier(.2,.65,.25,1)';
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.style.opacity = '1';
      e.target.style.transform = 'none';
      io.unobserve(e.target);
    });
  }, { threshold: 0.1 });

  els.forEach(function (el) { io.observe(el); });
})();

/* ------------------------------------------------------------------ menu */
/* The burger, below 900px. Its own IIFE because the block above returns early
   under reduced motion, and the menu has to work regardless. Setting
   data-menu is also what switches the mobile panel styles on at all — see the
   note in site.css — so scripting off leaves the plain wrapped nav. */
(function () {
  var root = document.documentElement;
  var nav = document.getElementById('nav');
  var burger = document.querySelector('.burger');
  var bar = document.querySelector('.masthead');
  if (!nav || !burger || !bar) return;

  /* the panel hangs off the bottom of the masthead and fills what's left */
  function measure() {
    var r = bar.getBoundingClientRect();
    root.style.setProperty('--bar', Math.round(r.height) + 'px');
    root.style.setProperty('--panel', Math.round(window.innerHeight - r.bottom) + 'px');
  }
  /* Order matters: setting data-menu is what lifts the nav out of the bar, so
     the bar is only its true one-row height afterwards. Measuring first would
     bake in the two-row height the panel exists to get rid of. */
  root.dataset.menu = 'closed';
  requestAnimationFrame(measure);

  function set(open) {
    root.dataset.menu = open ? 'open' : 'closed';
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
  }

  burger.addEventListener('click', function () {
    var open = root.dataset.menu !== 'open';
    if (open) measure();   /* mobile browser chrome resizes the bar as it hides */
    set(open);
    if (open) {
      var first = nav.querySelector('a');
      if (first) first.focus();
    } else {
      burger.focus();
    }
  });

  /* Same-page links don't navigate, so the panel has to stand down itself */
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) set(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.dataset.menu === 'open') {
      set(false);
      burger.focus();
    }
  });

  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(function () {
      measure();
      /* rotating into landscape can put the nav back on one line, where a
         panel left open would be a sheet of links over the page */
      if (window.innerWidth > 900) set(false);
    }, 150);
  });
})();
