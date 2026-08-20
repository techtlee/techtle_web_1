/* Techtlee - bilingual toggle + reveal.
   Czech is authored in the DOM; English lives in data-en.
   No framework, no dependencies, ~1.2 kB. */
(function () {
  'use strict';

  function apply(lang) {
    document.documentElement.setAttribute('lang', lang);
    var nodes = document.querySelectorAll('[data-en]');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.dataset.cs === undefined) n.dataset.cs = n.innerHTML;
      n.innerHTML = lang === 'en' ? n.dataset.en : n.dataset.cs;
    }
    var ph = document.querySelectorAll('[data-en-ph]');
    for (var j = 0; j < ph.length; j++) {
      var p = ph[j];
      if (p.dataset.csPh === undefined) p.dataset.csPh = p.getAttribute('placeholder') || '';
      p.setAttribute('placeholder', lang === 'en' ? p.dataset.enPh : p.dataset.csPh);
    }
    var al = document.querySelectorAll('[data-en-al]');
    for (var a = 0; a < al.length; a++) {
      var e = al[a];
      if (e.dataset.csAl === undefined) e.dataset.csAl = e.getAttribute('aria-label') || '';
      e.setAttribute('aria-label', lang === 'en' ? e.dataset.enAl : e.dataset.csAl);
    }
    var btns = document.querySelectorAll('[data-lang]');
    for (var k = 0; k < btns.length; k++) {
      btns[k].setAttribute('aria-current', btns[k].dataset.lang === lang ? 'true' : 'false');
    }
    try { localStorage.setItem('tt-lang', lang); } catch (e) {}
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-lang]') : null;
    if (!b) return;
    e.preventDefault();
    apply(b.dataset.lang);
  });

  function boot() {
    var saved = 'cs';
    try { saved = localStorage.getItem('tt-lang') || 'cs'; } catch (e) {}
    apply(saved);

    /* Reveal: opacity only, one observer, honours reduced motion. */
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var targets = document.querySelectorAll('[data-reveal]');
    if (reduce || !('IntersectionObserver' in window)) {
      for (var i = 0; i < targets.length; i++) targets[i].removeAttribute('data-reveal');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.setAttribute('data-reveal', 'in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    for (var t = 0; t < targets.length; t++) io.observe(targets[t]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
