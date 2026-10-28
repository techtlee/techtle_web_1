/* Techtlee - Semanthics engine demo (projekty/ only).
   Plays the four steps of the "Jak to funguje" rail in a panel under it:
   the question is typed, the semantic graph lights its join path, the
   compiled SQL appears, and the result table fills in. The matching rail
   cell lights up with each step.
   Same contract as the process flow in motion.js: starts once on screen,
   plays once and freezes (button -> replay), pausable (button, hidden tab,
   off-screen), re-renders on 'langchange', and shows
   the finished state straight away under reduced motion. The result table
   is always in the DOM - only its look is staged - so screen readers get
   the whole answer. */
(function () {
  'use strict';

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function lang() { return document.documentElement.lang === 'en' ? 'en' : 'cs'; }

  var T = {
    cs: { head: 'Ukázka výstupu · demo data',
          ask: 'Jak si tento měsíc stojíme proti plánu?',
          cols: ['Metrika', 'Aktuálně', 'Plán', 'Odchylka'],
          rows: [['Tržby / měsíc', '14 820 000', '14 400 000', '+2,9 %'],
                 ['Hrubá marže', '31,4 %', '31,0 %', '+0,4 pb'],
                 ['Objednávka → expedice', '4,1 dne', '2,5 dne', '+64 %'],
                 ['Náklad na objednávku', '218 Kč', '225 Kč', '−3,1 %'],
                 ['Uzávěrka měsíce', '6 dní', '3 dny', '+100 %']],
          chip: '2 z 5 metrik mimo toleranci',
          audit: 'Audit: metrika gross_margin v3 · zdroj erp.invoices · 4 pravidla',
          pause: 'Pozastavit animaci', play: 'Spustit animaci', replay: 'Přehrát znovu' },
    en: { head: 'Sample output · demo data',
          ask: 'How are we doing against plan this month?',
          cols: ['Metric', 'Actual', 'Plan', 'Variance'],
          rows: [['Revenue / month', '14,820,000', '14,400,000', '+2.9 %'],
                 ['Gross margin', '31.4 %', '31.0 %', '+0.4 pp'],
                 ['Order → dispatch', '4.1 days', '2.5 days', '+64 %'],
                 ['Cost per order', 'CZK 218', 'CZK 225', '−3.1 %'],
                 ['Monthly close', '6 days', '3 days', '+100 %']],
          chip: '2 of 5 metrics outside tolerance',
          audit: 'Audit: metric gross_margin v3 · source erp.invoices · 4 rules',
          pause: 'Pause animation', play: 'Play animation', replay: 'Replay' }
  };
  var FLAG = [false, false, true, false, true];   /* rows outside tolerance */
  var NODES = ['orders', 'invoices', 'calendar', 'plan', 'metric'];
  var SQL = [
    'SELECT m.metric, m.actual, p.plan,',
    '       (m.actual - p.plan) / p.plan AS variance',
    "FROM   semantic.metrics('2026-10') m",
    'JOIN   plan.monthly p USING (metric)',
    'WHERE  m.metric IN (certified_metrics())',
    'ORDER  BY abs(variance) DESC;'
  ];
  var ICON_PAUSE = '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1" y="0" width="3" height="10" fill="currentColor"/><rect x="6" y="0" width="3" height="10" fill="currentColor"/></svg>';
  var ICON_PLAY = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 0v10L9.5 5z" fill="currentColor"/></svg>';
  var ICON_REPLAY = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M10 6a4 4 0 1 1-1.17-2.83" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M10.4 1.4v2.9H7.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  /* the join path as plain elements, not SVG: text stays crisp at any width
     and the chain wraps on narrow screens */
  function graphHTML() {
    return NODES.map(function (n, i) {
      return (i ? '<span class="sx__e"></span>' : '') + '<span class="sx__n">' + n + '</span>';
    }).join('');
  }

  function init() {
    var sec = document.getElementById('semanthics');
    var rail = sec && sec.querySelector('.rail');
    if (!rail) return;
    rail.classList.add('rail--sync');
    var cells = [].slice.call(rail.children);
    var steps = cells.map(function (c) { return c.querySelector('h3'); });
    var nums = cells.map(function (c) { var p = c.querySelector('.eyebrow'); return p ? p.textContent : ''; });

    /* ---- build (structure once, text in render()) ---- */
    var root = el('div', 'sx panel');
    root.setAttribute('role', 'region');
    var head = el('div', 'panel__h');
    var hb = el('b', null, 'Agentic Analytics');
    var hs = el('span', 'eyebrow');
    var pause = el('button', 'flow__pause sx__pause'); pause.type = 'button';
    var hr = el('span', 'sx__hr'); hr.appendChild(hs); hr.appendChild(pause);
    head.appendChild(hb); head.appendChild(hr);

    var body = el('div', 'sx__body');
    function stage(i, extra) {
      var s = el('div', 'sx__stage sx__st' + i);
      var l = el('p', 'sx__lbl eyebrow');
      s.appendChild(l);
      if (extra) s.appendChild(extra);
      s._lbl = l;
      return s;
    }
    var ask = el('p', 'sx__ask');
    var askSr = el('span', 'sx__sr');
    var typed = el('span', 'sx__typed'); typed.setAttribute('aria-hidden', 'true');
    var caret = el('i', 'sx__caret'); caret.setAttribute('aria-hidden', 'true');
    ask.appendChild(askSr); ask.appendChild(typed); ask.appendChild(caret);
    var graph = el('div', 'sx__g', graphHTML());
    graph.setAttribute('aria-hidden', 'true');
    var sql = el('pre', 'sx__sql');
    var code = el('code', null, SQL.map(function (l) { return '<span class="sx__ln">' + esc(l) + '</span>'; }).join('\n'));
    sql.appendChild(code);
    var st = [stage(0, ask), stage(1, graph), stage(2, sql)];
    st.forEach(function (s) { body.appendChild(s); });

    var res = stage(3);
    res.classList.add('sx__res');
    var table = el('table');
    var thead = el('thead'), tbody = el('tbody');
    table.appendChild(thead); table.appendChild(tbody);
    var foot = el('div', 'panel__f sx__foot');
    var chip = el('span', 'eyebrow chip'), audit = el('span', 'eyebrow');
    foot.appendChild(chip); foot.appendChild(audit);
    res.appendChild(table); res.appendChild(foot);

    root.appendChild(head); root.appendChild(body); root.appendChild(res);
    rail.parentNode.insertBefore(root, rail.nextSibling);

    var lines = [].slice.call(code.querySelectorAll('.sx__ln'));
    var gNodes = [].slice.call(graph.querySelectorAll('.sx__n'));
    var gEdges = [].slice.call(graph.querySelectorAll('.sx__e'));

    /* ---- state ---- */
    var stageNo = -1, typedLen = 0, lit = 0, shownLines = 0, shownRows = 0, footOn = false;
    /* plays once from the moment it is on screen, then freezes on the
       finished answer; the button turns into "replay" */
    var userPaused = reduce, ended = false, visible = false, timer = 0, idx = 0;

    function render() {
      var t = T[lang()];
      hs.textContent = t.head;
      root.setAttribute('aria-label', 'Agentic Analytics · ' + t.head);
      askSr.textContent = t.ask;
      typed.textContent = t.ask.slice(0, typedLen);
      st.concat(res).forEach(function (s, i) {
        s._lbl.textContent = (nums[i] || '0' + (i + 1)) + ' · ' + (steps[i] ? steps[i].textContent : '');
      });
      thead.innerHTML = '<tr>' + t.cols.map(function (c, i) { return '<th' + (i ? ' class="r"' : '') + '>' + esc(c) + '</th>'; }).join('') + '</tr>';
      tbody.innerHTML = t.rows.map(function (r, i) {
        var up = !FLAG[i];
        return '<tr class="' + (FLAG[i] ? 'flag' : '') + '"><td class="k">' + esc(r[0]) + '</td><td class="r">' + esc(r[1]) +
               '</td><td class="r">' + esc(r[2]) + '</td><td class="r ' + (up ? 'up' : 'dn') + '">' + esc(r[3]) + '</td></tr>';
      }).join('');
      chip.textContent = t.chip;
      audit.textContent = t.audit;
      pause.innerHTML = ended ? ICON_REPLAY : userPaused ? ICON_PLAY : ICON_PAUSE;
      pause.setAttribute('aria-label', ended ? t.replay : userPaused ? t.play : t.pause);
      pause.setAttribute('aria-pressed', !ended && userPaused ? 'true' : 'false');
      pause.hidden = reduce;
      paint();
    }
    function paint() {
      root.setAttribute('data-stage', String(stageNo + 1));
      st.concat(res).forEach(function (s, i) { s.classList.toggle('on', i <= stageNo); s.classList.toggle('now', i === stageNo); });
      cells.forEach(function (c, i) { c.classList.toggle('is-on', i === stageNo); c.classList.toggle('is-done', i < stageNo); });
      typed.textContent = T[lang()].ask.slice(0, typedLen);
      root.classList.toggle('typing', stageNo === 0 && typedLen < T[lang()].ask.length);
      gNodes.forEach(function (n, i) { n.classList.toggle('lit', i < lit); });
      gEdges.forEach(function (e, i) { e.classList.toggle('lit', i + 1 < lit); });
      lines.forEach(function (l, i) { l.classList.toggle('on', i < shownLines); });
      [].forEach.call(tbody.children, function (r, i) { r.classList.toggle('on', i < shownRows); });
      foot.classList.toggle('on', footOn);
    }

    /* the whole sequence as a flat list of [action, delay-after] */
    function sequence() {
      var a = [], q = T[lang()].ask.length;
      a.push([function () { stageNo = -1; typedLen = 0; lit = 0; shownLines = 0; shownRows = 0; footOn = false; }, 500]);
      a.push([function () { stageNo = 0; }, 180]);
      for (var c = 1; c <= q; c++) (function (n) { a.push([function () { typedLen = n; }, 25]); })(c);
      a.push([function () {}, 420]);
      a.push([function () { stageNo = 1; }, 160]);
      for (var i = 1; i <= NODES.length; i++) (function (n) { a.push([function () { lit = n; }, 180]); })(i);
      a.push([function () {}, 350]);
      a.push([function () { stageNo = 2; }, 160]);
      for (var j = 1; j <= SQL.length; j++) (function (n) { a.push([function () { shownLines = n; }, 130]); })(j);
      a.push([function () {}, 350]);
      a.push([function () { stageNo = 3; }, 160]);
      for (var k = 1; k <= 5; k++) (function (n) { a.push([function () { shownRows = n; }, 115]); })(k);
      a.push([function () { footOn = true; }, 0]);
      return a;
    }
    var seq = sequence();

    function finish() {
      stageNo = 3; typedLen = T[lang()].ask.length; lit = NODES.length; shownLines = SQL.length; shownRows = 5; footOn = true;
      paint();
    }
    function running() { return !userPaused && !ended && visible && !document.hidden; }
    function step() {
      timer = 0;
      if (!running()) return;
      var a = seq[idx];
      a[0]();
      paint();
      idx++;
      if (idx >= seq.length) { ended = true; render(); return; }   /* freeze on the result */
      timer = setTimeout(step, a[1]);
    }
    function stop() { if (timer) clearTimeout(timer); timer = 0; }
    function resume() { if (!timer && running()) step(); }

    pause.addEventListener('click', function () {
      if (ended) { ended = false; userPaused = false; idx = 0; render(); resume(); return; }
      userPaused = !userPaused;
      render();
      userPaused ? stop() : resume();
    });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : resume(); });
    document.addEventListener('langchange', function () {
      seq = sequence();                      /* the question length changed */
      render();
      if (reduce) { finish(); return; }
      stop(); idx = 0; ended = false;        /* replay from the top in the new language */
      seq[0][0](); paint();
      resume();
    });

    render();
    if (reduce) { finish(); return; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        visible ? resume() : stop();
      }, { threshold: .1 }).observe(root);
    } else { visible = true; resume(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
