/* Techtlee - /projekty
   The index: the row under the pointer (or keyboard focus) lights up and
   the preview beside the list switches to it; the filter hides rows;
   Revizář and Vlkorez open in place, also straight from /projekty#revizar.
   Each preview is a small live piece: Agentic Analytics types a question,
   Appolino's data flows, Revizář is the app in miniature (new report, PDF
   export) and Vlkorez is their homepage hero (the pointer picks the wolf,
   a click makes it talk). On phones the last two live inside the opened
   row instead. A preview only runs while it is the one on show. */
(function () {
  'use strict';
  var root = document.getElementById('projekty');
  if (!root) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var EN = function () { return document.documentElement.lang === 'en'; };
  var T = function (cs, en) { return EN() ? en : cs; };
  var rows = $$('.pj-row', root), views = $$('.pj-v', root), fbs = $$('.pj-f button', root);
  var flow = $('.pj-flow', root), chat = $('.pj-chat', root), q = $('.pj-chat__q', root);
  var cur = null, typing = 0;

  /* ════════ Vlkorez ════════ */
  var CLAIMS = [
    ['Co vám můžu nabídnout?', 'What can I get you?'], ['Hoďte mi kost!', 'Throw me a bone!'],
    ['Mám hlad jako vlk!', 'Hungry as a wolf!'], ['Už víte, co chcete?', 'Know what you want yet?'],
    ['Tady se ví, kde říznout.', 'We know where to cut.'], ['Vykostíme to. Zabalíme dnes.', 'Deboned. Wrapped today.'],
    ['Nakrojíme problém.', 'Let’s slice into it.']
  ];
  function vlkorez(host) {
    var N = 9, imgs = '', bars = '';
    for (var i = 1; i <= N; i++) { imgs += '<img alt="" width="1100" height="658" data-src="/assets/img/vlkorez/w' + i + '.webp">'; bars += '<i></i>'; }
    host.innerHTML = '<div class="vk">' +
      '<div class="vk__nav"><span>Vlkorez</span><span>Portfolio</span><span>Studio</span><em>Praha</em></div>' +
      '<div class="vk__w">' + imgs + '</div>' +
      '<span class="vk__b"><span class="vk__t"></span><i></i></span>' +
      '<svg class="vk__word" viewBox="0 0 1000 158" aria-hidden="true"><text x="0" y="128" font-size="170">vlkorez</text></svg>' +
      '<span class="vk__hint"></span><div class="vk__track">' + bars + '</div></div>';
    var el = $('.vk', host), ims = $$('img', el), ts = $$('.vk__track i', el), txt = $('.vk__t', el), hint = $('.vk__hint', el);
    var w = 0, ci = 2, tick = null, tt = 0, loaded = false, steer = false;
    function fit() {
      var t = $('text', el), svg = $('svg', el);
      try { var b = t.getBBox(); if (b.width) svg.setAttribute('viewBox', b.x + ' ' + b.y + ' ' + b.width + ' ' + b.height); } catch (e) {}
    }
    function wolf(i) {
      w = i;
      ims.forEach(function (m, k) { m.classList.toggle('on', k === i); });
      ts.forEach(function (b, k) { b.classList.toggle('on', k === i); });
    }
    function say(next) {
      var t = ++tt, s = T(CLAIMS[ci][0], CLAIMS[ci][1]);
      if (next) { ci = (ci + 1 + Math.floor(Math.random() * (CLAIMS.length - 1))) % CLAIMS.length; s = T(CLAIMS[ci][0], CLAIMS[ci][1]); }
      if (reduce) { txt.textContent = s; return; }
      var n = 0;
      (function type() { if (t !== tt) return; txt.textContent = s.slice(0, n++); if (n <= s.length) setTimeout(type, 45); })();
    }
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect(), i = Math.min(N - 1, Math.max(0, Math.floor((e.clientX - r.left) / r.width * N)));
      steer = true; el.classList.add('touched');
      if (i !== w) wolf(i);
    });
    el.addEventListener('pointerleave', function () { steer = false; });
    el.addEventListener('click', function () {
      el.classList.add('touched', 'pop'); setTimeout(function () { el.classList.remove('pop'); }, 220);
      if (!steer) wolf((w + 1) % N);
      say(true);
    });
    return {
      start: function () {
        if (!loaded) { loaded = true; ims.forEach(function (m) { m.src = m.dataset.src; }); (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit); fit(); }
        hint.textContent = matchMedia('(hover: hover)').matches ? T('Pohněte myší · klikněte', 'Move the mouse · click') : T('Klepněte', 'Tap');
        wolf(w); say(false);
        /* like their homepage: a new wolf every second until someone steers */
        if (!reduce && !tick) tick = setInterval(function () { if (!steer) wolf((w + 1 + Math.floor(Math.random() * (N - 1))) % N); }, 1000);
      },
      stop: function () { clearInterval(tick); tick = null; tt++; }
    };
  }

  /* ════════ Revizář ════════ */
  var REPORTS = [
    ['RZ-2026-042', 'Jan Novák', 'Hlavní 123, Praha', 'ok'], ['RZ-2026-041', 'Petr Svoboda', 'Školní 45, Brno', 'ok'],
    ['RZ-2026-040', 'Marie Králová', 'Nádražní 8, Ostrava', 'no'], ['RZ-2026-039', 'Tomáš Dvořák', 'Průmyslová 22, Plzeň', 'ok'],
    ['RZ-2026-038', 'Eva Malá', 'Lipová 3, Olomouc', 'ok']
  ];
  var NEW = [['Pavel Černý', 'Polní 17, Kolín'], ['Lucie Horáková', 'Zahradní 9, Tábor'], ['Karel Beneš', 'Mlýnská 2, Písek']];
  function revizar(host) {
    function row(r, cls) {
      var pill = r[3] === 'ok' ? '<b class="rz__ok">OK</b>' : r[3] === 'no' ? '<b class="rz__no">' + T('Závady', 'Defects') + '</b>' : '<b class="rz__dr">' + T('Koncept', 'Draft') + '</b>';
      return '<button type="button" class="rz__row' + (cls ? ' ' + cls : '') + '" data-id="' + r[0] + '"><code>' + r[0] + '</code><span>' + r[1] + '<small>' + r[2] + '</small></span>' + pill + '</button>';
    }
    host.innerHTML = '<div class="rz">' +
      '<div class="rz__top"><i></i><i></i><i></i><span>revizar.cz</span><em class="rz__hint">' + T('Zkuste kliknout', 'Try clicking') + '</em></div>' +
      '<div class="rz__app"><nav class="rz__side"><span class="rz__logo"><b>⚡</b>REVIZÁŘ</span>' +
      '<button type="button" class="rz__new">+ ' + T('Nová revize', 'New inspection') + '</button>' +
      '<a>' + T('Přehled', 'Overview') + '</a><a class="on">' + T('Zprávy', 'Reports') + '</a><a>' + T('Termíny', 'Deadlines') + '</a><a>' + T('Klienti', 'Clients') + '</a><a>' + T('Objekty', 'Sites') + '</a></nav>' +
      '<div class="rz__main"><h4>' + T('Seznam zpráv', 'Reports') + '</h4><small>' + T('Revizní zprávy dle ČSN EN 62305', 'Inspection reports per ČSN EN 62305') + '</small>' +
      '<div class="rz__card"><div class="rz__row hd"><span>' + T('Ev. č.', 'No.') + '</span><span>' + T('Objednatel', 'Client') + '</span><span style="text-align:right">' + T('Posudek', 'Result') + '</span></div>' +
      '<div class="rz__list"></div></div>' +
      '<div class="rz__pdf"><div class="rz__doc"><b class="rz__id"></b><i></i><i></i><i></i><i></i><i></i><em>PDF ✓ ' + T('hotovo', 'done') + '</em></div></div>' +
      '</div></div></div>';
    var list = $('.rz__list', host), pdf = $('.rz__pdf', host), id = $('.rz__id', host);
    var data = REPORTS.slice(), num = 42, k = 0, timers = [];
    function later(f, ms) { timers.push(setTimeout(f, reduce ? 0 : ms)); }
    function draw(fresh) { list.innerHTML = data.slice(0, 5).map(function (r, i) { return row(r, i === 0 && fresh ? 'new' : ''); }).join(''); }
    function exportPdf(code) {
      id.textContent = code + '.pdf'; pdf.classList.remove('on'); void pdf.offsetWidth; pdf.classList.add('on');
      later(function () { pdf.classList.remove('on'); }, 1900);
    }
    function add() {
      var n = NEW[k++ % NEW.length], code = 'RZ-2026-0' + (++num);
      data.unshift([code, n[0], n[1], 'draft']); draw(true);
      later(function () { if (data[0][0] === code) { data[0][3] = 'ok'; draw(false); } }, 900);
    }
    host.onclick = function (e) {
      if (e.target.closest('.rz__new')) { add(); return; }
      var r = e.target.closest('.rz__row[data-id]');
      if (r) exportPdf(r.dataset.id);
      else if (e.target.closest('.rz__pdf')) pdf.classList.remove('on');
    };
    draw(false);
    var played = false;
    return {
      start: function () {
        if (played) return; played = true;
        /* shows what it does once by itself: a new report, then its PDF */
        later(add, 700); later(function () { exportPdf(data[0][0]); }, 2000);
      },
      stop: function () { timers.forEach(clearTimeout); timers = []; pdf.classList.remove('on'); }
    };
  }

  /* mount every live preview: the aside copy (desktop) and the in-row copy (phones) */
  var live = {};
  $$('[data-live]', root).forEach(function (h) {
    var c = (h.dataset.live === 'vk' ? vlkorez : revizar)(h);
    (live[h.dataset.live] = live[h.dataset.live] || []).push({ host: h, c: c });
  });
  var narrow = matchMedia('(max-width: 900px)');
  function liveFor(p) { return (live[p] || []).filter(function (m) { return narrow.matches ? !m.host.classList.contains('pj-v') : m.host.classList.contains('pj-v'); }); }
  function stopAll() { Object.keys(live).forEach(function (p) { live[p].forEach(function (m) { m.c.stop(); }); }); }

  /* ════════ Agentic Analytics ════════ */
  function typeQ() {
    var t = ++typing, text = T('Jaké byly tržby za Q3?', 'What was revenue in Q3?'), i = 0;
    chat.classList.remove('done');
    if (reduce) { q.textContent = text; chat.classList.add('done'); return; }
    (function step() {
      if (t !== typing) return;
      if (i <= text.length) { q.innerHTML = text.slice(0, i++) + '<i class="pj-cur"></i>'; setTimeout(step, 28 + Math.random() * 30); return; }
      q.textContent = text;
      setTimeout(function () { if (t === typing) chat.classList.add('done'); }, 350);
    })();
  }

  function show(row) {
    if (!row || row === cur) return;
    cur = row;
    rows.forEach(function (r) { r.classList.toggle('on', r === row); });
    var p = row.dataset.p;
    views.forEach(function (v) { var on = v.dataset.p === p; v.classList.toggle('on', on); v.inert = !on; });
    if (flow && flow.pauseAnimations) { if (p === 'ap' && !reduce) flow.unpauseAnimations(); else flow.pauseAnimations(); }
    if (p === 'aa') typeQ(); else typing++;
    if (!narrow.matches) { stopAll(); liveFor(p).forEach(function (m) { m.c.start(); }); }
  }
  function first() { return rows.filter(function (r) { return !r.hidden; })[0]; }

  function toggle(r, open) {
    open = open === undefined ? !r.classList.contains('open') : open;
    r.classList.toggle('open', open);
    r.querySelector('.pj-h').setAttribute('aria-expanded', open);
    if (open) show(r);
    if (narrow.matches) liveFor(r.dataset.p).forEach(function (m) { m.c[open ? 'start' : 'stop'](); });
  }

  rows.forEach(function (r) {
    var h = r.querySelector('.pj-h');
    r.addEventListener('mouseenter', function () { show(r); });
    h.addEventListener('focus', function () { show(r); });
    if (h.tagName === 'BUTTON') h.addEventListener('click', function () { toggle(r); });
  });
  /* leaving the list keeps the last row lit, so the preview never goes blank */

  fbs.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.dataset.f, n = 0;
      fbs.forEach(function (o) { o.setAttribute('aria-pressed', o === b); });
      rows.forEach(function (r) {
        var hide = f !== 'all' && r.dataset.cat !== f;
        r.hidden = hide;
        r.classList.remove('pj-in');
        if (!hide) { void r.offsetWidth; r.style.setProperty('--i', n++); r.classList.add('pj-in'); }
      });
      cur = null; show(first());
    });
  });

  /* /projekty#revizar (the nav links there): open that row */
  function fromHash() {
    var r = location.hash && document.getElementById(location.hash.slice(1));
    if (!r || rows.indexOf(r) < 0) return;
    if (r.hidden) fbs[0].click();
    if (r.querySelector('button.pj-h')) toggle(r, true); else show(r);
  }
  addEventListener('hashchange', fromHash);
  /* the live previews write their own copy: rebuild them in the new language */
  document.addEventListener('langchange', function () {
    stopAll();
    Object.keys(live).forEach(function (p) { live[p].forEach(function (m) { m.c = (p === 'vk' ? vlkorez : revizar)(m.host); }); });
    var c = cur; cur = null; show(c);
    rows.forEach(function (r) { if (r.classList.contains('open') && narrow.matches) liveFor(r.dataset.p).forEach(function (m) { m.c.start(); }); });
  });

  /* the preview is exactly as tall as the list beside it (while no row is
     open; an open row keeps the last height rather than stretching it) */
  var list = $('.pj-list', root), pvIn = $('.pj-pv__in', root);
  if (window.ResizeObserver && pvIn) new ResizeObserver(function () {
    if (narrow.matches || $('.pj-row.open', root)) return;
    pvIn.style.setProperty('--pj-h', list.getBoundingClientRect().height + 'px');
  }).observe(list);

  if (flow && flow.pauseAnimations) flow.pauseAnimations();
  show(first());
  fromHash();
})();
