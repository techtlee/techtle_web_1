/* Techtlee - /sluzby and /sluzby/<service>
   Overview: the filter shows one field's cards; /sluzby#ai, #data, #vedeni
   and #software (links from the homepage) open the overview filtered.
   Service page: the field's drawing plays the first time it is on screen. */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  var grid = document.querySelector('.si-grid');
  if (grid) {
    var cards = $$('.si-card[data-cat]', grid), fbs = $$('.si-f button');
    var filter = function (f) {
      var n = 0;
      fbs.forEach(function (o) { o.setAttribute('aria-pressed', o.dataset.f === f); });
      grid.classList.toggle('is-filtered', f !== 'all');
      cards.forEach(function (c) {
        var hide = f !== 'all' && c.dataset.cat !== f;
        c.hidden = hide; c.classList.remove('si-in');
        if (!hide && !reduce) { void c.offsetWidth; c.style.setProperty('--i', n++); c.classList.add('si-in'); }
      });
    };
    fbs.forEach(function (b) { b.addEventListener('click', function () { filter(b.dataset.f); }); });
    var fromHash = function () {
      var f = location.hash.slice(1);
      if (fbs.some(function (b) { return b.dataset.f === f; })) filter(f);
    };
    addEventListener('hashchange', fromHash);
    fromHash();
  }

  var ctx = $$('.sd-ctx');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); } });
    }, { threshold: 0.2 });
    ctx.forEach(function (g) { io.observe(g); });
  } else ctx.forEach(function (g) { g.classList.add('seen'); });
})();
