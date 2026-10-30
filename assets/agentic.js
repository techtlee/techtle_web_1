/* Techtlee - /projekty/agentic-analytics
   Live pieces of the Agentic Analytics briefing. Each section gets .in the
   first time it is on screen (that starts the CSS reveal); the looping demos
   run only while their section is visible. Copy that JS writes follows the
   CZ/EN switch (i18n.js sets <html lang>). */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var EN = function () { return document.documentElement.lang === 'en'; };
  var T = function (cs, en) { return EN() ? en : cs; };
  var num = function (v, d) { var s = v.toFixed(d); return EN() ? s : s.replace('.', ','); };

  /* run start() while a section is on screen, stop() when it leaves */
  function whileVisible(sec, start, stop) {
    if (!sec) return;
    var on = false;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && !on) { on = true; start(); }
        else if (!e.isIntersecting && on) { on = false; stop(); }
      });
    }, { threshold: 0.15 }).observe(sec);
  }

  /* ---- reveal + card glow ---- */
  function initReveal() {
    var secs = $$('.aa-s');
    if (reduce || !('IntersectionObserver' in window)) { secs.forEach(function (s) { s.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    secs.forEach(function (s) { io.observe(s); });
    document.addEventListener('mousemove', function (e) {
      var c = e.target.closest ? e.target.closest('.aa-card') : null;
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty('--cx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--cy', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* ---- 1a. problem: the queue ---- */
  function initQueue() {
    var v = $('#problem .aa-q'); if (!v) return;
    var bar = $('.aa-desk i', v), waitEl = $('.aa-q-wait', v), doneEl = $('.aa-q-done', v);
    var q = [], n = 1, done = 0, tA = 0, tS = 0;
    var deskL = function () { return v.clientWidth - 104 - 36 - 14; };
    function layout() {
      var L = deskL();
      q.forEach(function (t, i) {
        var x = L - i * 44;
        t.style.transform = 'translateX(' + x + 'px)';
        t.style.opacity = x < -30 ? 0 : 1;
        t.classList.toggle('old', i < 2 && q.length > 6);
      });
      waitEl.textContent = q.length; doneEl.textContent = done;
    }
    function arrive() {
      var t = document.createElement('span');
      t.className = 'aa-tk'; t.textContent = 'Q' + (n++);
      t.style.transform = 'translateX(' + (deskL() - (q.length + 1) * 44) + 'px)'; t.style.opacity = 0;
      v.appendChild(t); q.push(t);
      requestAnimationFrame(function () { requestAnimationFrame(layout); });
      if (q.length > 14) { q.splice(0, 6).forEach(function (x) { x.style.opacity = 0; setTimeout(function () { x.remove(); }, 500); }); layout(); }
    }
    function serve() {
      var t = q.shift(); if (!t) return;
      t.style.transform = 'translateX(' + (deskL() + 70) + 'px) scale(.4)'; t.style.opacity = 0;
      setTimeout(function () { t.remove(); }, 750);
      done++; layout();
      bar.classList.remove('run'); void bar.offsetWidth; bar.classList.add('run');
    }
    for (var i = 0; i < 4; i++) arrive();
    layout();
    if (reduce) return;
    whileVisible(v.closest('section'),
      function () { tA = setInterval(arrive, 1150); tS = setInterval(serve, 2400); bar.classList.add('run'); },
      function () { clearInterval(tA); clearInterval(tS); });
  }

  /* ---- 1b. problem: the fast, wrong feed ---- */
  function initFeed() {
    var v = $('#problem .aa-f'); if (!v) return;
    var speed = $('.aa-bolt b', v);
    var M = [
      ['Tržby za minulý kvartál', 'Revenue, last quarter', function () { return num(rnd(8, 40), 1) + T(' mil.', 'M'); }],
      ['Aktivní zákazníci', 'Active customers', function () { return Math.round(rnd(18, 96)) + T(' tis.', 'k'); }],
      ['Marže po regionech', 'Margin by region', function () { return num(rnd(12, 38), 1) + ' %'; }],
      ['Churn za září', 'Churn, September', function () { return num(rnd(1.5, 7), 1) + ' %'; }],
      ['Čisté tržby CZ', 'Net sales, CZ', function () { return num(rnd(5, 30), 1) + T(' mil.', 'M'); }],
      ['Průměrná objednávka', 'Average order value', function () { return Math.round(rnd(480, 1450)) + ' Kč'; }],
      ['Hrubý zisk od začátku roku', 'Gross profit, year to date', function () { return num(rnd(3, 18), 1) + T(' mil.', 'M'); }],
      ['Cena za akvizici', 'Cost per acquisition', function () { return Math.round(rnd(190, 820)) + ' Kč'; }]
    ];
    var F = [['bez definice', 'no definition'], ['které tržby?', 'which revenue?'], ['bez zdroje', 'no source'],
      ['vymyšlené?', 'made up?'], ['vloženo do chatu', 'pasted into chat']];
    var lines = [], timer = 0;
    function push() {
      var el = document.createElement('div'), m = pick(M), f = pick(F);
      el.className = 'aa-fl';
      el.innerHTML = '<span>' + T(m[0], m[1]) + '</span><b>' + m[2]() + '</b><em>' + T(f[0], f[1]) + '</em>';
      el.style.transform = 'translateY(-14px)'; el.style.opacity = 0; el.style.top = '10px';
      v.appendChild(el); lines.unshift(el);
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        lines.forEach(function (l, i) { l.style.transform = 'translateY(' + (i * 25) + 'px)'; l.style.opacity = i > 2 ? 0 : (1 - i * .3); });
      }); });
      lines.splice(4).forEach(function (l) { setTimeout(function () { l.remove(); }, 400); });
      speed.textContent = num(rnd(.6, 1.3), 1) + ' s';
    }
    push(); push(); push();
    if (reduce) { lines.forEach(function (l, i) { l.style.transform = 'translateY(' + (i * 25) + 'px)'; l.style.opacity = 1 - i * .3; }); return; }
    whileVisible(v.closest('section'), function () { timer = setInterval(push, 620); }, function () { clearInterval(timer); });
  }

  /* ---- 2. menu: chart, build, chat, schedule ---- */
  function initMenu() {
    var sec = $('#menu'); if (!sec) return;
    var bars = $$('.aa-mchart i', sec);
    var pr = $('.aa-pr', sec), prn = $('.aa-pr b', sec);
    var me = $('.aa-cb--me', sec), ai = $('.aa-cb--ai', sec);
    var wks = $$('.aa-wk', sec), note = $('.aa-ms', sec), noteB = $('.aa-ms b', sec);
    var gen = 0, n = 142, timer = 0;
    function shuffle() {
      var hs = bars.map(function () { return rnd(18, 100); }), max = Math.max.apply(null, hs);
      bars.forEach(function (b, i) { b.style.height = hs[i] + '%'; b.classList.toggle('top', hs[i] === max); });
    }
    function build(g) {
      return (async function () {
        while (g === gen) {
          pr.classList.remove('go'); void pr.offsetWidth; pr.classList.add('go');
          await sleep(2600); if (g !== gen) return;
          pr.classList.add('swap'); await sleep(300); prn.textContent = ++n; pr.classList.remove('swap');
        }
      })();
    }
    function chat(g) {
      return (async function () {
        while (g === gen) {
          me.classList.remove('show'); ai.classList.remove('show', 'done');
          await sleep(500); if (g !== gen) return;
          me.classList.add('show'); await sleep(700); if (g !== gen) return;
          ai.classList.add('show'); await sleep(1300); if (g !== gen) return;
          ai.classList.add('done'); await sleep(2600);
        }
      })();
    }
    function sched(g) {
      return (async function () {
        while (g === gen) {
          wks.forEach(function (w) { w.className = 'aa-wk'; }); noteB.textContent = ''; note.classList.remove('al');
          var alertAt = 1 + Math.floor(Math.random() * 4);
          for (var i = 0; i < wks.length; i++) {
            await sleep(750); if (g !== gen) return;
            wks.forEach(function (w) { w.classList.remove('now'); });
            wks[i].classList.add(i === alertAt ? 'alert' : 'sent', 'now');
            var al = i === alertAt, wk = wks[i].querySelector('span').textContent, pct = Math.round(rnd(9, 18));
            note.classList.toggle('al', al);
            noteB.textContent = al ? T(wk + ' se pohnul o ' + pct + ' % · označeno', wk + ' moved ' + pct + ' % · flagged') : '';
          }
          await sleep(1800);
        }
      })();
    }
    shuffle();
    if (reduce) { pr.classList.add('go'); me.classList.add('show'); ai.classList.add('show', 'done'); wks.forEach(function (w) { w.classList.add('sent'); }); return; }
    whileVisible(sec,
      function () { gen++; build(gen); chat(gen); sched(gen); timer = setInterval(shuffle, 1500); },
      function () { gen++; clearInterval(timer); });
  }

  /* ---- 3. value: weeks -> minutes ---- */
  function initValue() {
    var sec = $('#value'); if (!sec) return;
    var row = $('.aa-tl-row--now', sec), v = $('.aa-tl-v', sec), shift = $('.aa-shift', sec);
    var gen = 0, fast = false;
    function word() { return fast ? T('minuty', 'minutes') : T('týdny', 'weeks'); }
    function label() { v.classList.add('swap'); setTimeout(function () { v.textContent = word(); v.classList.remove('swap'); }, 300); }
    document.addEventListener('langchange', function () { v.textContent = word(); });
    v.textContent = word();
    async function loop(g) {
      while (g === gen) {
        fast = false; row.classList.remove('fast'); label(); shift.classList.remove('go');
        await sleep(1600); if (g !== gen) return;
        fast = true; row.classList.add('fast'); setTimeout(label, 500);
        await sleep(900); if (g !== gen) return;
        shift.classList.add('go');
        await sleep(6500);
      }
    }
    if (reduce) { fast = true; row.classList.add('fast'); v.textContent = word(); shift.classList.add('go'); return; }
    whileVisible(sec, function () { gen++; loop(gen); }, function () { gen++; });
  }

  /* ---- 4. gap: one word, four numbers ---- */
  function initFan() {
    var sec = $('#gap'); if (!sec) return;
    var svg = $('.aa-fan-svg', sec), paths = $$('.aa-fan-svg path', sec), outs = $$('.aa-fo', sec), lab = $('.aa-fan-pick', sec);
    var cur = -1, timer = 0;
    function geom() {
      var r = svg.getBoundingClientRect(); if (!r.width) return;
      var W = r.width, H = r.height, src = $('.aa-fan-src .aa-chip', sec).getBoundingClientRect();
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var y0 = src.top + src.height / 2 - r.top;
      outs.forEach(function (o, i) {
        var b = o.getBoundingClientRect(), y = b.top + b.height / 2 - r.top;
        paths[i].setAttribute('d', 'M0 ' + y0 + ' C ' + W * .5 + ' ' + y0 + ', ' + W * .5 + ' ' + y + ', ' + W + ' ' + y);
      });
    }
    function show() { if (cur >= 0) lab.textContent = outs[cur].querySelector('span').textContent; }
    function choose() {
      var i; do { i = Math.floor(Math.random() * outs.length); } while (i === cur);
      cur = i;
      paths.forEach(function (p, k) { p.classList.toggle('pick', k === i); });
      outs.forEach(function (o, k) { o.classList.toggle('pick', k === i); });
      lab.style.opacity = 0;
      setTimeout(function () { show(); lab.style.opacity = 1; }, 180);
    }
    geom(); addEventListener('resize', geom); setTimeout(geom, 1300);
    document.addEventListener('langchange', function () { setTimeout(function () { geom(); show(); }, 0); });
    if (reduce) { choose(); return; }
    whileVisible(sec, function () { geom(); setTimeout(choose, 1500); timer = setInterval(choose, 1900); }, function () { clearInterval(timer); });
  }

  /* ---- 5. conditions: one question through the three checks ---- */
  function initPipeline() {
    var sec = $('#conditions'); if (!sec) return;
    var who = $('.aa-pq-who', sec), qt = $('.aa-pq-text', sec), stages = $$('.aa-stage', sec), ans = $('.aa-pans', sec);
    var SC = [
      { who: ['Ptá se finanční manažer', 'A finance manager asks'],
        q: ['Jak se vyvíjela EBITDA za posledních dvanáct měsíců?', 'How did EBITDA develop over the last twelve months?'],
        st: [['ok', 'Definice nalezena · EBITDA', 'Definition found · EBITDA'], ['ok', 'Povoleno pro roli finance', 'Allowed for the finance role'], ['ok', 'Dotaz sestaven, postup přiložen', 'Query compiled, working attached']],
        a: ['ok', ['EBITDA po měsících · 12 řádků', 'EBITDA by month · 12 rows'],
          [['Definice · EBITDA', 'Definition · EBITDA'], ['Období · posledních 12 měsíců', 'Period · last 12 months'], ['Filtry · všechny trhy', 'Filters · all markets'], ['Zdroj · gold vrstva', 'Source · gold layer'], ['Čerstvost · dnes 6:00', 'Fresh · 06:00 today']]] },
      { who: ['Ptá se vedoucí obchodu', 'A sales lead asks'],
        q: ['Jaká je celoživotní hodnota našeho zákazníka?', 'What is our customer lifetime value?'],
        st: [['no', 'Chybí dohodnutá definice', 'No agreed definition'], ['skip', 'Nedosaženo', 'Not reached'], ['skip', 'Nedosaženo', 'Not reached']],
        a: ['no', ['Nevím - pro tohle neexistuje dohodnutá definice. Nic se nehádá; mezera se zaloguje a rozhodne o ní vlastník.', 'I don’t know - there is no agreed definition for that. Nothing is guessed; the gap is logged for an owner to decide.']] },
      { who: ['Ptá se vedoucí týmu', 'A team lead asks'],
        q: ['Kolik jsme zaplatili na mzdách, po odděleních?', 'What did we pay in salaries, by department?'],
        st: [['ok', 'Definice nalezena · Mzdové náklady', 'Definition found · Salary cost'], ['no', 'Pro vaši roli nepovoleno', 'Not permitted for your role'], ['skip', 'Nedosaženo', 'Not reached']],
        a: ['no', ['Odmítnuto vaším jménem, ne potichu. Požadavek se zaloguje i s tím, kdo se ptal.', 'Refused in your name, not silently. The request is logged with who asked.']] }
    ];
    var L = function (pair) { return T(pair[0], pair[1]); };
    var gen = 0, idx = 0, visible = false;
    var alive = function (g) { return g === gen; };
    function reset() {
      stages.forEach(function (s) { s.classList.remove('active', 'ok', 'no', 'skip'); $('.aa-st-t', s).textContent = T('Čeká', 'Waiting'); });
      ans.className = ans.className.replace(/\b(ok|no)\b/g, '').trim();
      ans.innerHTML = '<p class="aa-idle">' + T('Odpověď se objeví, jakmile proběhnou všechny tři kontroly.', 'The answer appears here once all three checks have run.') + '</p>';
    }
    async function type(g, text) {
      qt.textContent = '';
      for (var i = 1; i <= text.length; i++) { if (!alive(g)) return; qt.textContent = text.slice(0, i); await sleep(rnd(22, 48)); }
    }
    async function run(g) {
      while (alive(g)) {
        var s = SC[idx % SC.length]; idx++;
        reset(); who.style.opacity = 0; await sleep(250); if (!alive(g)) return;
        who.textContent = L(s.who); who.style.opacity = 1;
        await type(g, L(s.q)); await sleep(450); if (!alive(g)) return;
        for (var i = 0; i < 3; i++) {
          var st = stages[i], res = s.st[i][0], txt = T(s.st[i][1], s.st[i][2]);
          if (res === 'skip') { st.classList.add('skip'); $('.aa-st-t', st).textContent = txt; continue; }
          st.classList.add('active'); $('.aa-st-t', st).textContent = T('Ověřuji…', 'Checking…');
          await sleep(780); if (!alive(g)) return;
          st.classList.remove('active'); st.classList.add(res); $('.aa-st-t', st).textContent = txt;
          await sleep(280); if (!alive(g)) return;
        }
        await sleep(250); if (!alive(g)) return;
        var kind = s.a[0], chips = s.a[2];
        ans.classList.add(kind);
        ans.innerHTML = '<p class="aa-pa-t">' + L(s.a[1]) + '</p>' + (chips ? '<div class="aa-chips">' + chips.map(function (c, k) { return '<span class="aa-chip' + (k ? '' : ' aa-chip--on') + '">' + L(c) + '</span>'; }).join('') + '</div>' : '');
        await sleep(30); $('.aa-pa-t', ans).classList.add('show');
        var cs = $$('.aa-chip', ans);
        for (var c = 0; c < cs.length; c++) { await sleep(190); if (!alive(g)) return; cs[c].classList.add('show'); }
        await sleep(kind === 'ok' ? 3400 : 3000);
      }
    }
    function still() {
      var s = SC[0]; reset(); who.textContent = L(s.who); qt.textContent = L(s.q);
      stages.forEach(function (st, i) { st.classList.add('ok'); $('.aa-st-t', st).textContent = T(s.st[i][1], s.st[i][2]); });
    }
    reset();
    if (reduce) { still(); document.addEventListener('langchange', still); return; }
    /* a language switch restarts the current question in the new language */
    document.addEventListener('langchange', function () { gen++; idx = Math.max(0, idx - 1); if (visible) run(gen); else reset(); });
    whileVisible(sec, function () { visible = true; gen++; run(gen); }, function () { visible = false; gen++; });
  }

  /* ---- 6. audit: readiness scan ---- */
  function initScan() {
    var sec = $('#start'); if (!sec) return;
    var grid = $('.aa-scan-grid', sec), bar = $('.aa-scan-bar', sec), vb = $('.aa-verdict b', sec);
    var COLS = 14, ROWS = 4, gen = 0, last = null;
    grid.innerHTML = new Array(COLS * ROWS + 1).join('<i></i>');
    var cells = $$('i', grid);
    var V = { rd: ['připraveno', 'ready'], '': ['připraveno s podmínkami', 'ready with conditions'], nv: ['zatím ne', 'not yet'] };
    function verdict(cls) { last = cls; vb.textContent = T(V[cls][0], V[cls][1]); vb.className = cls + ' show'; }
    document.addEventListener('langchange', function () { if (last !== null) vb.textContent = T(V[last][0], V[last][1]); });
    async function scan(g) {
      while (g === gen) {
        cells.forEach(function (c) { c.className = ''; }); vb.className = ''; last = null; bar.classList.remove('run'); void bar.offsetWidth;
        await sleep(500); if (g !== gen) return;
        bar.classList.add('run');
        var cd = 0, bk = 0;
        for (var col = 0; col < COLS; col++) {
          await sleep(2600 / COLS); if (g !== gen) return;
          for (var r = 0; r < ROWS; r++) {
            var x = Math.random(), c = cells[r * COLS + col];
            if (x < .72) c.className = 'ok'; else if (x < .93) { c.className = 'cd'; cd++; } else { c.className = 'bk'; bk++; }
          }
        }
        verdict(bk >= 4 ? 'nv' : (bk > 0 || cd > 12) ? '' : 'rd');
        await sleep(3000);
      }
    }
    if (reduce) { cells.forEach(function (c) { c.className = 'ok'; }); verdict('rd'); return; }
    whileVisible(sec, function () { gen++; scan(gen); }, function () { gen++; });
  }

  function boot() { initReveal(); initQueue(); initFeed(); initMenu(); initValue(); initFan(); initPipeline(); initScan(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
