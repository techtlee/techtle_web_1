/* Techtlee - motion.
   1. Hero process flow: a real four-step process per scenario; each manual
      step is struck out and replaced by what we build. Pausable (button,
      hover, focus), switchable by tabs, static under reduced motion.
   2. Scroll reveals: opacity + lift, lists cascade, section rules draw in.
   No dependencies. */
(function () {
  'use strict';

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function lang() { return document.documentElement.lang === 'en' ? 'en' : 'cs'; }

  /* ---------------------------------------------------------------- flow */
  var TOOL = {
    auto: { cs: 'Automatizace', en: 'Automation' },
    app:  { cs: 'Aplikace',     en: 'App' },
    ai:   { cs: 'AI',           en: 'AI' },
    data: { cs: 'Data',         en: 'Data' }
  };
  var SCENARIOS = [
    { tab: { cs: 'Faktury', en: 'Invoices' },
      title: { cs: 'Zpracování přijatých faktur', en: 'Processing incoming invoices' },
      steps: [
        { b: { cs: 'Faktura přijde e-mailem jako PDF', en: 'An invoice arrives by e-mail as a PDF' },
          a: { cs: 'AI ji přečte a vytáhne údaje', en: 'AI reads it and extracts the data' }, t: 'ai' },
        { b: { cs: 'Někdo ji přepíše do účetnictví', en: 'Someone retypes it into accounting' },
          a: { cs: 'Údaje se zapíšou samy', en: 'The data is entered automatically' }, t: 'auto' },
        { b: { cs: 'Schvalování přes e-mail a telefon', en: 'Approval by e-mail and phone' },
          a: { cs: 'Schválení jedním klikem v aplikaci', en: 'One-click approval in an app' }, t: 'app' },
        { b: { cs: 'Párování s platbou v Excelu', en: 'Matching payments in Excel' },
          a: { cs: 'Platby se spárují automaticky', en: 'Payments are matched automatically' }, t: 'auto' }
      ] },
    { tab: { cs: 'Servis', en: 'Service' },
      title: { cs: 'Servisní zakázka od hovoru po fakturu', en: 'A service job from call to invoice' },
      steps: [
        { b: { cs: 'Zákazník volá a píše na pět adres', en: 'Customers call and write to five addresses' },
          a: { cs: 'Jeden formulář, vše v jednom systému', en: 'One form, everything in one system' }, t: 'app' },
        { b: { cs: 'Dispečer přiděluje techniky z hlavy', en: 'A dispatcher assigns technicians from memory' },
          a: { cs: 'Přidělení podle kapacity a místa', en: 'Assigned by capacity and location' }, t: 'auto' },
        { b: { cs: 'Protokol na papíře, pak přepis', en: 'A paper report, then retyping' },
          a: { cs: 'Protokol v mobilu, PDF hned', en: 'Report on the phone, PDF instantly' }, t: 'app' },
        { b: { cs: 'Fakturace až na konci měsíce', en: 'Invoicing only at month end' },
          a: { cs: 'Faktura odejde po dokončení', en: 'The invoice goes out on completion' }, t: 'auto' }
      ] },
    { tab: { cs: 'Reporting', en: 'Reporting' },
      title: { cs: 'Měsíční reporting pro vedení', en: 'Monthly management reporting' },
      steps: [
        { b: { cs: 'Ruční export z pěti systémů', en: 'Manual exports from five systems' },
          a: { cs: 'Systémy jsou propojené', en: 'The systems are connected' }, t: 'auto' },
        { b: { cs: 'Slepování tabulek v Excelu', en: 'Stitching spreadsheets in Excel' },
          a: { cs: 'Data na jednom místě', en: 'Data in one place' }, t: 'data' },
        { b: { cs: 'Kontrola čísel trvá dny', en: 'Checking the numbers takes days' },
          a: { cs: 'AI hlídá odchylky sama', en: 'AI flags deviations by itself' }, t: 'ai' },
        { b: { cs: 'Report vedení jednou měsíčně', en: 'A management report once a month' },
          a: { cs: 'Přehled každé ráno', en: 'An overview every morning' }, t: 'data' }
      ] }
  ];
  var UI = {
    cs: { manual: 'ručně', count: 'Ruční kroky', pause: 'Pozastavit animaci', play: 'Spustit animaci' },
    en: { manual: 'manual', count: 'Manual steps', pause: 'Pause animation', play: 'Play animation' }
  };
  var ICON_PAUSE = '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1" y="0" width="3" height="10" fill="currentColor"/><rect x="6" y="0" width="3" height="10" fill="currentColor"/></svg>';
  var ICON_PLAY = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 0v10L9.5 5z" fill="currentColor"/></svg>';

  /* timing (ms): first look at the old process, then one step per beat */
  var LEAD = 1300, STRIKE = 420, BEAT = 950, HOLD = 2800;

  function initFlow() {
    var root = document.getElementById('flow');
    if (!root) return;
    var tabsEl = root.querySelector('.flow__tabs');
    var titleEl = root.querySelector('.flow__title b');
    var list = root.querySelector('.flow__steps');
    var countEl = root.querySelector('.flow__count');
    var bar = root.querySelector('.flow__bar i');
    var pauseBtn = root.querySelector('.flow__pause');

    var cur = 0, done = 0, timers = [], userPaused = reduce, hoverPaused = false, visible = true;

    function clear() { timers.forEach(clearTimeout); timers = []; }
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

    function renderTabs() {
      tabsEl.innerHTML = '';
      SCENARIOS.forEach(function (sc, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', i === cur ? 'true' : 'false');
        b.textContent = sc.tab[lang()];
        b.addEventListener('click', function () { go(i); });
        tabsEl.appendChild(b);
      });
    }
    function renderPause() {
      var u = UI[lang()];
      pauseBtn.innerHTML = userPaused ? ICON_PLAY : ICON_PAUSE;
      pauseBtn.setAttribute('aria-label', userPaused ? u.play : u.pause);
      pauseBtn.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
      pauseBtn.hidden = reduce;
    }
    function renderCount() {
      var n = SCENARIOS[cur].steps.length - done;
      countEl.innerHTML = UI[lang()].count + ' <b>' + n + '</b>';
      countEl.classList.toggle('zero', n === 0);
    }
    function render() {
      var sc = SCENARIOS[cur], l = lang();
      titleEl.textContent = sc.title[l];
      list.innerHTML = '';
      sc.steps.forEach(function (st, i) {
        var li = document.createElement('li');
        li.className = 'step' + (i < done ? ' done' : '');
        li.innerHTML =
          '<span class="step__node" aria-hidden="true"></span>' +
          '<span class="step__txt"><span class="step__before"></span><span class="step__after"></span></span>' +
          '<span class="step__tag"></span>';
        li.querySelector('.step__before').textContent = st.b[l];
        li.querySelector('.step__after').textContent = st.a[l];
        li.querySelector('.step__tag').textContent = i < done ? TOOL[st.t][l] : UI[l].manual;
        list.appendChild(li);
      });
      renderTabs(); renderPause(); renderCount();
    }

    function convert(i) {
      var li = list.children[i];
      if (!li) return;
      li.classList.add('active', 'struck');
      later(function () {
        li.classList.remove('active', 'struck');
        li.classList.add('done');
        li.querySelector('.step__tag').textContent = TOOL[SCENARIOS[cur].steps[i].t][lang()];
        done = i + 1;
        renderCount();
      }, STRIKE);
    }

    function running() { return !userPaused && !hoverPaused && visible && !document.hidden; }

    /* plays the current scenario from step `done`, then moves on */
    function play() {
      clear();
      if (!running()) return;
      var steps = SCENARIOS[cur].steps.length;
      var t = done === 0 ? LEAD : 300;
      var total = t + (steps - done) * BEAT + HOLD;
      bar.classList.remove('run'); void bar.offsetWidth;
      bar.style.setProperty('--dur', total + 'ms');
      if (done === 0) bar.classList.add('run');
      for (var i = done; i < steps; i++) {
        (function (k) { later(function () { convert(k); }, t + (k - done) * BEAT); })(i);
      }
      later(function () { go((cur + 1) % SCENARIOS.length); }, total);
    }
    function go(i) {
      clear();
      cur = i;
      done = reduce ? SCENARIOS[i].steps.length : 0;
      render();
      if (reduce) return;
      bar.classList.remove('run'); bar.style.transform = '';
      play();
    }
    function pause() { clear(); bar.style.animationPlayState = 'paused'; }
    function resume() {
      if (!running()) return;
      bar.style.animationPlayState = '';
      if (done >= SCENARIOS[cur].steps.length) { go((cur + 1) % SCENARIOS.length); return; }
      play();
    }

    pauseBtn.addEventListener('click', function () {
      userPaused = !userPaused;
      renderPause();
      userPaused ? pause() : resume();
    });
    root.addEventListener('mouseenter', function () { hoverPaused = true; pause(); });
    root.addEventListener('mouseleave', function () { hoverPaused = false; resume(); });
    root.addEventListener('focusin', function () { hoverPaused = true; pause(); });
    root.addEventListener('focusout', function (e) {
      if (!root.contains(e.relatedTarget)) { hoverPaused = false; resume(); }
    });
    document.addEventListener('visibilitychange', function () { document.hidden ? pause() : resume(); });
    document.addEventListener('langchange', render);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        var was = visible;
        visible = es[0].isIntersecting;
        if (!visible) pause();
        else if (!was) resume();   /* the first callback reports what we already assume */
      }).observe(root);
    }
    go(0);
  }

  /* ------------------------------------------------------------- reveal */
  function initReveal() {
    document.querySelectorAll('[data-stagger]').forEach(function (box) {
      var kids = box.tagName === 'TABLE' ? box.querySelectorAll('tbody tr') : box.children;
      for (var i = 0; i < kids.length; i++) kids[i].style.setProperty('--i', Math.min(i, 10));
    });
    var targets = document.querySelectorAll('[data-reveal-s], .spec');
    function show(el) {
      if (el.hasAttribute('data-reveal-s')) el.setAttribute('data-reveal-s', 'in');
      else el.classList.add('in');
    }
    if (reduce || !('IntersectionObserver' in window)) { targets.forEach(show); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: .04 });
    targets.forEach(function (el) { io.observe(el); });
  }

  function boot() { initFlow(); initReveal(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
