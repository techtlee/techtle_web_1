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
    data: { cs: 'Data',         en: 'Data' },
    pm:   { cs: 'Řízení',       en: 'Management' },
    people: { cs: 'Lidé',       en: 'People' }
  };
  var SCENARIOS = [
    { tab: { cs: 'Adopce AI', en: 'AI adoption' },
      title: { cs: 'Licence AI, které nikdo nepoužívá', en: 'AI licences nobody uses' },
      steps: [
        { b: { cs: 'Licence koupené, každý zkouší sám', en: 'Licences bought, everyone tries alone' },
          a: { cs: 'Use-casy pro každý tým', en: 'Use cases for every team' }, t: 'people',
          w: { cs: 'Bez konkrétních úloh se AI po pár týdnech přestane používat.', en: 'Without concrete tasks, people stop using AI after a few weeks.' },
          h: { cs: 'S týmy vybereme úlohy, kde AI opravdu šetří čas, a naučíme je na jejich vlastní práci.', en: 'With each team we pick the tasks where AI really saves time and train them on their own work.' } },
        { b: { cs: 'Firemní data v soukromých AI nástrojích', en: 'Company data in private AI tools' },
          a: { cs: 'Firemní AI prostor a pravidla', en: 'A company AI workspace and rules' }, t: 'ai',
          w: { cs: 'Lidé vkládají smlouvy a čísla do vlastních účtů a firma o tom neví.', en: 'People paste contracts and figures into their own accounts and the company does not know.' },
          h: { cs: 'Bezpečné prostředí napojené na firemní data a jasná pravidla, co se smí.', en: 'A secure environment connected to company data and clear rules on what is allowed.' } },
        { b: { cs: 'Nikdo neví, jestli to pomáhá', en: 'Nobody knows if it helps' },
          a: { cs: 'Měříme využití a ušetřený čas', en: 'We measure usage and time saved' }, t: 'data',
          w: { cs: 'Licence se platí, ale přínos nikdo neměří.', en: 'The licences are paid for, but nobody measures the benefit.' },
          h: { cs: 'Přehled, kdo AI používá, na co a kolik času to šetří.', en: 'An overview of who uses AI, for what, and how much time it saves.' } },
        { b: { cs: 'Pilot běží měsíce bez rozhodnutí', en: 'The pilot runs for months with no decision' },
          a: { cs: 'Rozhodnutí a rozšíření do dalších týmů', en: 'A decision and rollout to more teams' }, t: 'pm',
          w: { cs: 'Zkouší se dál, ale nikdo neřekne „ano, rozšiřujeme“.', en: 'Testing goes on, but nobody says "yes, let\'s roll it out".' },
          h: { cs: 'Na konci pilotu jasné vyhodnocení a plán nasazení do dalších týmů.', en: 'At the end of the pilot, a clear evaluation and a plan to roll out to more teams.' } }
      ] },
    { tab: { cs: 'BI', en: 'BI' },
      title: { cs: 'BI a reporting pro vedení', en: 'BI and management reporting' },
      steps: [
        { b: { cs: 'Ruční export z pěti systémů', en: 'Manual exports from five systems' },
          a: { cs: 'Systémy jsou propojené', en: 'The systems are connected' }, t: 'auto',
          w: { cs: 'Každý měsíc někdo ručně stahuje exporty z ERP, CRM, e-shopu a dalších systémů.', en: 'Every month someone manually pulls exports from the ERP, CRM, e-shop and other systems.' },
          h: { cs: 'Data se ze systémů stahují automaticky každou noc přes jejich rozhraní.', en: 'Data is pulled from the systems automatically every night through their APIs.' } },
        { b: { cs: 'Slepování tabulek v Excelu', en: 'Stitching spreadsheets in Excel' },
          a: { cs: 'Data na jednom místě', en: 'Data in one place' }, t: 'data',
          w: { cs: 'Tabulky se slepují ručně a každá verze reportu počítá trochu jinak.', en: 'Spreadsheets are stitched by hand and every version of the report calculates slightly differently.' },
          h: { cs: 'Jedna datová vrstva se sjednocenými definicemi metrik, ze které čerpají všechny reporty.', en: 'One data layer with unified metric definitions that every report draws from.' } },
        { b: { cs: 'Review a produkcionalizace trvají týdny', en: 'Review and productionisation take weeks' },
          a: { cs: 'Review a nasazení odbaví agenti', en: 'Agents handle review and deployment' }, t: 'ai',
          w: { cs: 'Každou změnu reportu ručně kontroluje a nasazuje analytik, takže úpravy čekají ve frontě.', en: 'An analyst reviews and deploys every report change by hand, so changes wait in a queue.' },
          h: { cs: 'AI agenti zkontrolují změnu, ověří čísla proti historii a připraví nasazení. Člověk jen schválí.', en: 'AI agents review the change, check the numbers against history and prepare the deployment. A person just approves.' } },
        { b: { cs: 'Report vedení jednou měsíčně', en: 'A management report once a month' },
          a: { cs: 'Přehled každé ráno', en: 'An overview every morning' }, t: 'data',
          w: { cs: 'Vedení rozhoduje podle čísel, která jsou v den prezentace už staré.', en: 'Management decides on numbers that are already stale on presentation day.' },
          h: { cs: 'Přehled se aktualizuje každé ráno a důležité změny přijdou rovnou e-mailem.', en: 'The overview refreshes every morning and important changes arrive straight by e-mail.' } }
      ] },
    { tab: { cs: 'Projekt', en: 'Project' },
      title: { cs: 'Projekt, který se rozjíždí', en: 'A project drifting off course' },
      steps: [
        { b: { cs: 'Zadání rozeseté v e-mailech', en: 'Requirements scattered across e-mails' },
          a: { cs: 'Jeden backlog s prioritami', en: 'One backlog with priorities' }, t: 'pm',
          w: { cs: 'Každý pracuje podle jiné verze a priority se mění podle toho, kdo zrovna volá.', en: 'Everyone works from a different version and priorities change with whoever calls last.' },
          h: { cs: 'Všechny požadavky na jednom místě, seřazené podle priority a odsouhlasené.', en: 'All requirements in one place, ranked by priority and agreed.' } },
        { b: { cs: 'Stav zjišťujeme na poradách', en: 'We find out the status in meetings' },
          a: { cs: 'Status se napíše sám z úkolů', en: 'The status writes itself from the tasks' }, t: 'ai',
          w: { cs: 'Hodina týdně jen na to, abychom zjistili, kdo je kde.', en: 'An hour a week just to find out where everyone is.' },
          h: { cs: 'AI každý týden shrne pokrok, blokery a změny přímo z úkolů v nástroji.', en: 'Every week AI summarises progress, blockers and changes straight from the tasks in the tool.' } },
        { b: { cs: 'Skluz zjistíme až u termínu', en: 'We spot delays only at the deadline' },
          a: { cs: 'Milníky a rizika hlídané průběžně', en: 'Milestones and risks tracked continuously' }, t: 'pm',
          w: { cs: 'Problém se ukáže, až když se s ním už nedá nic dělat.', en: 'The problem shows up only when nothing can be done about it.' },
          h: { cs: 'Riziko je vidět týdny dopředu a má svého vlastníka.', en: 'Risks are visible weeks ahead and each has an owner.' } },
        { b: { cs: 'Rozpočet se počítá až na konci', en: 'The budget is counted only at the end' },
          a: { cs: 'Čerpání proti plánu průběžně', en: 'Spend against plan, all the time' }, t: 'data',
          w: { cs: 'O překročení se vedení dozví z poslední faktury.', en: 'Management learns about the overrun from the final invoice.' },
          h: { cs: 'Průběžný přehled odpracovaného a utraceného proti plánu.', en: 'A running overview of hours worked and money spent against the plan.' } }
      ] },
    { tab: { cs: 'Faktury', en: 'Invoices' },
      title: { cs: 'Zpracování přijatých faktur', en: 'Processing incoming invoices' },
      steps: [
        { b: { cs: 'Faktura přijde e-mailem jako PDF', en: 'An invoice arrives by e-mail as a PDF' },
          a: { cs: 'AI ji přečte a vytáhne údaje', en: 'AI reads it and extracts the data' }, t: 'ai',
          w: { cs: 'Faktury chodí v různých formátech a někdo je musí otevírat jednu po druhé.', en: 'Invoices arrive in all kinds of formats and someone has to open them one by one.' },
          h: { cs: 'AI rozpozná dodavatele, částky, DPH i splatnost a nejisté případy označí ke kontrole.', en: 'AI recognises the supplier, amounts, VAT and due date, and flags uncertain cases for review.' } },
        { b: { cs: 'Někdo ji přepíše do účetnictví', en: 'Someone retypes it into accounting' },
          a: { cs: 'Údaje se zapíšou samy', en: 'The data is entered automatically' }, t: 'auto',
          w: { cs: 'Ruční přepis je pomalý a překlepy v částkách se najdou až při uzávěrce.', en: 'Retyping is slow and typos in amounts only surface at month-end close.' },
          h: { cs: 'Vytěžené údaje se zapíšou přímo do účetního systému přes jeho rozhraní.', en: 'The extracted data is written straight into the accounting system through its API.' } },
        { b: { cs: 'Schvalování přes e-mail a telefon', en: 'Approval by e-mail and phone' },
          a: { cs: 'Schválení jedním klikem v aplikaci', en: 'One-click approval in an app' }, t: 'app',
          w: { cs: 'Faktura čeká v něčí schránce a nikdo neví, u koho zrovna je.', en: 'The invoice sits in someone\'s inbox and nobody knows who has it.' },
          h: { cs: 'Schvalovatel dostane upozornění, vidí fakturu i objednávku a schválí ji jedním klikem.', en: 'The approver gets a notification, sees the invoice and the order, and approves in one click.' } },
        { b: { cs: 'Párování s platbou v Excelu', en: 'Matching payments in Excel' },
          a: { cs: 'Platby se spárují automaticky', en: 'Payments are matched automatically' }, t: 'auto',
          w: { cs: 'Párování plateb s fakturami se dělá ručně v Excelu a snadno se v něm něco ztratí.', en: 'Payments are matched to invoices by hand in Excel, where things easily get lost.' },
          h: { cs: 'Bankovní výpis se načte sám, platby se spárují podle symbolu a částky a výjimky jdou k člověku.', en: 'The bank statement loads itself, payments match on reference and amount, exceptions go to a person.' } }
      ] }
  ];
  var UI = {
    cs: { manual: 'ručně', count: 'Ruční kroky', pause: 'Pozastavit animaci', play: 'Spustit animaci', replay: 'Přehrát znovu',
          why: 'Proč to bolí', how: 'Jak to řešíme', step: 'Krok' },
    en: { manual: 'manual', count: 'Manual steps', pause: 'Pause animation', play: 'Play animation', replay: 'Replay',
          why: 'Why it hurts', how: 'How we solve it', step: 'Step' }
  };
  var ICON_PAUSE = '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1" y="0" width="3" height="10" fill="currentColor"/><rect x="6" y="0" width="3" height="10" fill="currentColor"/></svg>';
  var ICON_PLAY = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 0v10L9.5 5z" fill="currentColor"/></svg>';
  var ICON_REPLAY = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M10 6a4 4 0 1 1-1.17-2.83" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M10.4 1.4v2.9H7.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* timing (ms): first look at the old process, then each card loads
     through its own bar (LOAD) and flips to the solution, one per beat */
  var LEAD = 1400, LOAD = 1100, BEAT = 1700, HOLD = 3200;

  function initFlow() {
    var root = document.getElementById('flow');
    if (!root) return;
    var tabsEl = root.querySelector('.flow__tabs');
    var titleEl = root.querySelector('.flow__title b');
    var list = root.querySelector('.flow__steps');
    var countEl = root.querySelector('.flow__count');
    var bar = root.querySelector('.flow__bar i');
    var pauseBtn = root.querySelector('.flow__pause');

    /* plays the scenarios once, in order, then freezes on the last one with
       the button turned into "replay" */
    var cur = 0, done = 0, timers = [], userPaused = reduce, ended = false,
        visible = !('IntersectionObserver' in window);   /* starts once it is on screen */

    /* phones show one card at a time (CSS, ≤600px); `shown` is that card.
       The dots and the swipe live here; on wider screens CSS hides the dots
       and every card stays visible, so nothing changes there. */
    var shown = 0;
    var dots = document.createElement('div');
    dots.className = 'flow__dots';
    list.parentNode.insertBefore(dots, list.nextSibling);
    function setShown(i) {
      var n = list.children.length;
      if (!n) return;
      shown = Math.max(0, Math.min(n - 1, i));
      [].forEach.call(list.children, function (li, k) { li.classList.toggle('is-shown', k === shown); });
      [].forEach.call(dots.children, function (d, k) {
        if (k === shown) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
      });
    }
    function renderDots() {
      dots.innerHTML = '';
      [].forEach.call(list.children, function (li, k) {
        var d = document.createElement('button');
        d.type = 'button';
        d.setAttribute('aria-label', UI[lang()].step + ' ' + (k + 1));
        d.addEventListener('click', function () { hold(); setShown(k); });
        dots.appendChild(d);
      });
    }
    /* a manual pick stops the autoplay, like the pause button */
    function hold() { if (!userPaused) { userPaused = true; renderPause(); pause(); } }
    var tx = null;
    list.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    list.addEventListener('touchend', function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx; tx = null;
      if (Math.abs(dx) > 40) { hold(); setShown(shown + (dx < 0 ? 1 : -1)); }
    }, { passive: true });

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
      pauseBtn.innerHTML = ended ? ICON_REPLAY : userPaused ? ICON_PLAY : ICON_PAUSE;
      pauseBtn.setAttribute('aria-label', ended ? u.replay : userPaused ? u.play : u.pause);
      pauseBtn.setAttribute('aria-pressed', !ended && userPaused ? 'true' : 'false');
      pauseBtn.hidden = reduce;
    }
    function renderCount() {
      var n = SCENARIOS[cur].steps.length - done;
      countEl.innerHTML = UI[lang()].count + ' <b>' + n + '</b>';
      countEl.classList.toggle('zero', n === 0);
    }
    function card(st, i, l) {
      var u = UI[l], li = document.createElement('li');
      li.className = 'step' + (i < done ? ' done' : '');
      li.innerHTML =
        '<div class="step__top"><span class="step__no">0' + (i + 1) + '</span><span class="step__tag"></span></div>' +
        '<p class="step__before"><span></span></p>' +
        '<p class="step__why"><span class="step__lbl"></span><span class="step__w"></span></p>' +
        '<span class="step__load" aria-hidden="true"><i></i></span>' +
        '<div class="step__res"><p class="step__after"></p>' +
        '<p class="step__how"><span class="step__lbl"></span><span class="step__h"></span></p></div>';
      li.querySelector('.step__before span').textContent = st.b[l];
      li.querySelector('.step__w').textContent = st.w[l];
      li.querySelector('.step__after').textContent = st.a[l];
      li.querySelector('.step__h').textContent = st.h[l];
      var lbl = li.querySelectorAll('.step__lbl');
      lbl[0].textContent = u.why; lbl[1].textContent = u.how;
      li.querySelector('.step__tag').textContent = i < done ? TOOL[st.t][l] : u.manual;
      return li;
    }
    function render() {
      var sc = SCENARIOS[cur], l = lang();
      titleEl.textContent = sc.title[l];
      list.innerHTML = '';
      sc.steps.forEach(function (st, i) { list.appendChild(card(st, i, l)); });
      renderTabs(); renderPause(); renderCount();
      /* autoplay: the card being worked on; reduced motion / language switch: keep the reader's card */
      renderDots(); setShown(reduce || !done ? shown : done - 1);
    }

    /* the card's bar loads, then the manual step flips to the solution */
    function convert(i) {
      var li = list.children[i];
      if (!li) return;
      setShown(i);
      li.style.setProperty('--load', LOAD + 'ms');
      li.classList.add('active');
      later(function () {
        li.classList.remove('active');
        li.classList.add('done');
        li.querySelector('.step__tag').textContent = TOOL[SCENARIOS[cur].steps[i].t][lang()];
        done = i + 1;
        renderCount();
      }, LOAD);
    }

    function running() { return !userPaused && !ended && visible && !document.hidden; }
    function next() {
      if (cur < SCENARIOS.length - 1) go(cur + 1);
      else { ended = true; clear(); renderPause(); }
    }

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
      later(next, total);
    }
    function go(i) {
      clear();
      cur = i;
      ended = false;
      done = reduce ? SCENARIOS[i].steps.length : 0;
      shown = 0;
      render();
      if (reduce) return;
      bar.classList.remove('run'); bar.style.transform = '';
      play();
    }
    function pause() { clear(); bar.style.animationPlayState = 'paused'; }
    function resume() {
      if (!running()) return;
      bar.style.animationPlayState = '';
      if (done >= SCENARIOS[cur].steps.length) { next(); return; }
      play();
    }

    pauseBtn.addEventListener('click', function () {
      if (ended) { ended = false; userPaused = false; go(0); return; }
      userPaused = !userPaused;
      renderPause();
      userPaused ? pause() : resume();
    });
    document.addEventListener('visibilitychange', function () { document.hidden ? pause() : resume(); });
    document.addEventListener('langchange', render);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        visible ? resume() : pause();
      }, { threshold: .15 }).observe(root);
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
