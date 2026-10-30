/* Techtlee - /sluzby
   Four chapters, one per pillar, every service written out in full. The
   filter shows one pillar; a chapter's drawing plays the first time it
   comes into view. /sluzby#sv-procesy and /sluzby#vedeni land on their
   service or chapter even when a filter has hidden it. */
(function () {
  'use strict';
  var root = document.getElementById('sluzby');
  if (!root) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var groups = $$('.si-g', root), fbs = $$('.si-f button', root);

  function filter(f) {
    var n = 0, first = null;
    fbs.forEach(function (o) { o.setAttribute('aria-pressed', o.dataset.f === f); });
    groups.forEach(function (g) {
      var hide = f !== 'all' && g.dataset.cat !== f;
      g.hidden = hide; g.classList.remove('si-in', 'first');
      if (!hide) {
        if (!first) { first = g; g.classList.add('first'); }
        if (!reduce) { void g.offsetWidth; g.style.setProperty('--i', n++); g.classList.add('si-in'); }
      }
    });
  }
  fbs.forEach(function (b) { b.addEventListener('click', function () { filter(b.dataset.f); }); });

  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); } });
    }, { threshold: 0.2 });
    groups.forEach(function (g) { io.observe(g); });
  } else groups.forEach(function (g) { g.classList.add('seen'); });

  function fromHash() {
    var el = location.hash && document.getElementById(location.hash.slice(1));
    if (!el || !root.contains(el)) return;
    var g = el.closest('.si-g');
    if (g && g.hidden) { filter('all'); el.scrollIntoView(); }
  }
  addEventListener('hashchange', fromHash);
  fromHash();
})();
