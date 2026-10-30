/* Techtlee - interaction layer (every page).
   1. Services: each row of the services table collapses to a one-line
      preview and opens on click / Enter / Space, revealing its detail row
      (what we do, what you end up with, related). One row open at a time;
      /sluzby#sv-<id> opens a given service.
   2. Pointer spotlight: a faint mint highlight follows the mouse inside the
      hairline cells. Fine pointers only, off under reduced motion.
   3. "Zní vám to povědomě?": the ten sentences become toggles; the picks
      prefill the contact form (homepage and /kontakt).
   Nothing here writes inside a [data-en] element - i18n.js rewrites their
   innerHTML on every language switch. New nodes go next to them. */
(function () {
  'use strict';

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------ services */
  function initServices() {
    var tables = document.querySelectorAll('#sluzby table.dt');
    [].forEach.call(tables, function (table, t) {
      /* each service row may be followed by a .more-row with its details */
      var rows = [].slice.call(table.querySelectorAll('tbody tr:not(.more-row)'));
      if (!rows.length) return;
      table.classList.add('dt--acc');
      /* rows become grid boxes so a cell can clamp to one line; restate the
         table semantics that a display change can strip in some browsers */
      table.setAttribute('role', 'table');
      [].forEach.call(table.querySelectorAll('tr'), function (tr) { tr.setAttribute('role', 'row'); });
      [].forEach.call(table.querySelectorAll('th'), function (th) { th.setAttribute('role', 'columnheader'); });
      [].forEach.call(table.querySelectorAll('td'), function (td) { td.setAttribute('role', 'cell'); });
      function moreOf(row) {
        var n = row.nextElementSibling;
        return n && n.classList.contains('more-row') ? n : null;
      }
      var headRow = table.querySelector('thead tr');
      if (headRow) {
        var th = document.createElement('th');
        th.className = 'c-tog';
        th.setAttribute('role', 'columnheader');
        headRow.appendChild(th);
      }

      function set(row, open) {
        row.classList.toggle('open', open);
        row._btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        var m = moreOf(row);
        if (m) m.toggleAttribute('inert', !open);   /* closed details stay out of the tab order */
      }
      function toggle(row) {
        var open = !row.classList.contains('open');
        rows.forEach(function (r) { set(r, false); });
        set(row, open);
      }

      rows.forEach(function (row, i) {
        var name = row.querySelector('.c-name');
        var desc = row.querySelector('.c-desc');
        if (!name || !desc) return;
        name.id = name.id || 'sv' + t + '-n' + i;
        desc.id = desc.id || 'sv' + t + '-d' + i;
        var td = document.createElement('td');
        td.className = 'c-tog';
        td.setAttribute('role', 'cell');
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'tog';
        var more = moreOf(row);
        b.setAttribute('aria-controls', desc.id + (more ? ' ' + more.id : ''));
        b.setAttribute('aria-labelledby', name.id);
        b.addEventListener('click', function (e) { e.stopPropagation(); toggle(row); });
        td.appendChild(b);
        row.appendChild(td);
        row._btn = b;
        set(row, false);
        /* the whole row is the target, but never hijack a link or a text selection */
        row.addEventListener('click', function (e) {
          if (e.target.closest('a')) return;
          var sel = window.getSelection && String(window.getSelection());
          if (sel) return;
          toggle(row);
        });
      });

      /* /sluzby#sv-aplikace opens that service */
      function fromHash() {
        var id = decodeURIComponent(location.hash.slice(1));
        var hit = id && rows.filter(function (r) { return r.id === id; })[0];
        if (!hit) return false;
        rows.forEach(function (r) { set(r, r === hit); });
        hit.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
        return true;
      }
      if (!fromHash()) set(rows[0], true);
      window.addEventListener('hashchange', fromHash);
    });
  }

  /* ----------------------------------------------------------- spotlight */
  function initSpotlight() {
    if (reduce) return;
    if (!window.matchMedia || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var SEL = '.four > div, .rail > div, .who article, .dt tbody tr, .pil__svc';
    var cur = null, frame = 0, px = 0, py = 0;
    function paint() {
      frame = 0;
      if (!cur) return;
      var r = cur.getBoundingClientRect();
      cur.style.setProperty('--mx', (px - r.left) + 'px');
      cur.style.setProperty('--my', (py - r.top) + 'px');
    }
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var el = e.target.closest ? e.target.closest(SEL) : null;
      if (el !== cur) {
        if (cur) cur.classList.remove('is-sp');
        cur = el;
        if (cur) cur.classList.add('is-sp');
      }
      px = e.clientX; py = e.clientY;
      if (cur && !frame) frame = requestAnimationFrame(paint);
    }, { passive: true });
    document.addEventListener('pointerleave', function () {
      if (cur) cur.classList.remove('is-sp');
      cur = null;
    });
  }

  /* ---------------------------------------------- "Zní vám to povědomě?" */
  /* The ten sentences become toggles. The selection lives in sessionStorage
     and is written into the contact form's "Situace" field - but only while
     that field is empty or still holds our own earlier text, never over
     what the visitor typed. Each sentence's <span data-en> is moved inside
     its button untouched, so i18n keeps translating it. */
  var PICK = {
    cs: { hint: 'Označte, co platí i u vás.', count: 'Platí {n} z {t}', clear: 'Zrušit výběr',
          cta: 'Popsat naši situaci', head: 'Poznáváme se v těchto větách:',
          more: 'Zobrazit všech {t} vět', less: 'Skrýt věty' },
    en: { hint: 'Mark the ones that apply to you.', count: '{n} of {t} apply', clear: 'Clear selection',
          cta: 'Describe our situation', head: 'These sound familiar:',
          more: 'Show all {t} statements', less: 'Hide statements' }
  };
  var KEY = 'tt-pick-v4';            /* v4: sentences changed 2026-10-29 */
  function lang() { return document.documentElement.lang === 'en' ? 'en' : 'cs'; }
  function loadPick() {
    try { var v = JSON.parse(sessionStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function savePick(v) { try { sessionStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }

  /* plain text of a [data-en] node in either language, without touching it */
  var dec = document.createElement('textarea');
  function textOf(span, l) {
    var html = l === 'en' ? span.getAttribute('data-en') : (span.dataset.cs != null ? span.dataset.cs : span.innerHTML);
    dec.innerHTML = String(html).replace(/<[^>]*>/g, '');
    return dec.value.replace(/ /g, ' ');
  }

  /* the sentences, captured once so the contact page can prefill too */
  var SENT_KEY = 'tt-pick-text-v4';
  function prefill() {
    var ta = document.getElementById('s4');
    if (!ta) return;
    var pick = loadPick(), l = lang(), texts;
    try { texts = JSON.parse(sessionStorage.getItem(SENT_KEY) || 'null'); } catch (e) { texts = null; }
    var txt = '';
    if (pick.length && texts && texts[l]) {
      txt = PICK[l].head + '\n' + pick.map(function (i) { return '- ' + texts[l][i]; }).join('\n') + '\n\n';
    }
    var ours = ta.value === '' || ta.value === ta.dataset.auto;
    if (!ours) return;
    ta.value = txt;
    ta.dataset.auto = txt;
  }

  function initPick() {
    var ol = document.querySelector('ol.log');
    if (!ol) { prefill(); document.addEventListener('langchange', prefill); return; }
    var items = [].slice.call(ol.children);
    var spans = items.map(function (li) { return li.querySelector('span[data-en]'); });
    if (spans.some(function (s) { return !s; })) return;
    try {
      sessionStorage.setItem(SENT_KEY, JSON.stringify({
        cs: spans.map(function (s) { return textOf(s, 'cs'); }),
        en: spans.map(function (s) { return textOf(s, 'en'); })
      }));
    } catch (e) {}

    ol.classList.add('log--pick');
    var pick = loadPick();
    var buttons = items.map(function (li, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'log__b';
      b.dataset.i = i;
      li.insertBefore(b, spans[i]);
      b.appendChild(spans[i]);
      b.setAttribute('aria-pressed', pick.indexOf(i) > -1 ? 'true' : 'false');
      b.addEventListener('click', function () { choose(i, b); });
      return b;
    });

    function choose(i, from) {
      var p = loadPick(), k = p.indexOf(i);
      if (k > -1) p.splice(k, 1); else p.push(i);
      p.sort(function (a, c) { return a - c; });
      savePick(p);
      sync();
      if (k === -1 && !reduce) fly(from, count);   /* the picked chip flies into the counter */
    }

    var hint = document.createElement('p');
    hint.className = 'eyebrow log__hint';
    ol.parentNode.insertBefore(hint, ol);

    var sum = document.createElement('div');
    sum.className = 'log__sum';
    var count = document.createElement('span');
    count.className = 'log__n';
    count.setAttribute('aria-live', 'polite');
    var clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'log__clear';
    clear.addEventListener('click', function () { savePick([]); sync(); buttons[0].focus(); });
    var cta = document.createElement('a');
    cta.className = 'btn log__cta';
    cta.href = document.getElementById('kontakt') ? '#kontakt' : '/kontakt';
    sum.appendChild(cta); sum.appendChild(count); sum.appendChild(clear);
    var claim = ol.parentNode.querySelector('.claim');
    (claim || ol).parentNode.insertBefore(sum, (claim || ol).nextSibling);

    /* phones only (CSS hides it elsewhere): the list starts folded, this
       button opens the rest of the statements */
    var fold = document.createElement('button');
    fold.type = 'button';
    fold.className = 'log__fold';
    fold.setAttribute('aria-expanded', 'false');
    if (!ol.id) ol.id = 'log-list';
    fold.setAttribute('aria-controls', ol.id);
    fold.addEventListener('click', function () {
      var open = !ol.classList.contains('is-open');
      ol.classList.toggle('is-open', open);
      fold.setAttribute('aria-expanded', open ? 'true' : 'false');
      sync();
      if (!open) ol.scrollIntoView({ block: 'nearest' });
    });
    ol.parentNode.insertBefore(fold, ol.nextSibling);


    function sync() {
      var p = loadPick(), t = PICK[lang()];
      [].forEach.call(ol.querySelectorAll('.log__b'), function (b) {
        b.setAttribute('aria-pressed', p.indexOf(+b.dataset.i) > -1 ? 'true' : 'false');
      });
      hint.textContent = t.hint;
      count.textContent = t.count.replace('{n}', p.length).replace('{t}', items.length);
      clear.textContent = t.clear;
      cta.innerHTML = t.cta + ' <span aria-hidden="true">→</span>';
      sum.hidden = p.length === 0;
      fold.textContent = ol.classList.contains('is-open') ? t.less : t.more.replace('{t}', items.length);
      prefill();
    }
    document.addEventListener('langchange', sync);
    /* a successful send empties the form - start the next visit clean */
    var form = document.querySelector('form.contact-form');
    if (form) form.addEventListener('reset', function () {
      setTimeout(function () { savePick([]); sync(); var ta = document.getElementById('s4'); if (ta) ta.dataset.auto = ''; }, 0);
    });
    sync();
  }

  /* a copy of the picked chip flies into the counter */
  function fly(from, to) {
    if (!from || !to || !to.getBoundingClientRect) return;
    var a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    if (!b.width) return;
    var g = from.cloneNode(true);
    g.removeAttribute('data-i');
    g.className = 'log__b log__ghost';
    g.setAttribute('aria-hidden', 'true');
    g.style.left = a.left + 'px'; g.style.top = a.top + 'px'; g.style.width = a.width + 'px';
    document.body.appendChild(g);
    var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        g.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(.25)';
        g.style.opacity = '0';
      });
    });
    setTimeout(function () { g.remove(); to.classList.remove('bump'); void to.offsetWidth; to.classList.add('bump'); }, 600);
  }

  /* ------------------------------------------------------------ pillars */
  /* home "Co děláme": four pillar tabs, each opens its services. Without
     JS every panel stays visible, each under its own pillar name. */
  function initPillars() {
    var root = document.querySelector('.pil');
    if (!root) return;
    var tabs = [].slice.call(root.querySelectorAll('.pil__tab'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    if (!tabs.length || panels.some(function (p) { return !p; })) return;
    root.classList.add('pil--js');
    var cur = -1;
    /* desktop: the active pillar's intro is shown under the heading on the
       left (a visual copy; the original stays in its panel for readers) */
    var lead = root.querySelector('.pil__lead');
    function syncLead() {
      if (!lead || cur < 0) return;
      var src = panels[cur].querySelector('.pil__intro');
      lead.textContent = src ? src.textContent : '';
      lead.classList.remove('is-in'); void lead.offsetWidth; lead.classList.add('is-in');
    }
    document.addEventListener('langchange', function () { setTimeout(syncLead, 0); });
    function show(i, focus) {
      if (i === cur) return;
      cur = i;
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        /* panels stay in the layout (stacked in one cell, sized by the
           tallest) so switching never moves anything below */
        panels[k].classList.toggle('is-on', on);
        panels[k].inert = !on;
        panels[k].setAttribute('aria-hidden', on ? 'false' : 'true');
        panels[k].classList.remove('is-in');
      });
      syncLead();
      void panels[i].offsetWidth;          /* restart the entrance */
      panels[i].classList.add('is-in');
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(i); });
      t.addEventListener('keydown', function (e) {
        var k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (e.key === 'Home') k = -cur; else if (e.key === 'End') k = tabs.length - 1 - cur;
        if (k === undefined) return;
        e.preventDefault();
        show((cur + k + tabs.length) % tabs.length, true);
      });
    });
    /* a link to /#sv-ai opens the pillar that holds it */
    function fromHash() {
      var el = location.hash && document.getElementById(location.hash.slice(1));
      var k = el ? panels.findIndex(function (p) { return p.contains(el); }) : -1;
      if (k > -1) { show(k); el.scrollIntoView({ block: 'center' }); }
    }
    show(0);
    fromHash();
    window.addEventListener('hashchange', fromHash);
  }

  /* ----------------------------------------------------------- marquee */
  /* "Kde s námi mají zkušenosti": the company names run as an endless
     strip. The list is doubled (copy hidden from screen readers) and the
     strip slides by half its width, so the loop has no seam. */
  function initMarquee() {
    if (reduce) return;
    [].forEach.call(document.querySelectorAll('ul.cl'), function (ul) {
      var box = document.createElement('div');
      box.className = 'mq';
      ul.parentNode.insertBefore(box, ul);
      box.appendChild(ul);
      [].slice.call(ul.children).forEach(function (li) {
        var c = li.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        ul.appendChild(c);
      });
      ul.classList.add('cl--mq');
      ul.style.setProperty('--mq-dur', (ul.children.length * 3.2) + 's');
    });
  }

  /* -------------------------------------------------------- button glow */
  /* primary buttons: a light spot follows the cursor across the gradient */
  function initBtnGlow() {
    if (reduce) return;
    if (!window.matchMedia || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var frame = 0, cur = null, px = 0, py = 0;
    function paint() {
      frame = 0;
      if (!cur) return;
      var r = cur.getBoundingClientRect();
      cur.style.setProperty('--bx', (px - r.left) + 'px');
      cur.style.setProperty('--by', (py - r.top) + 'px');
    }
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      cur = e.target.closest ? e.target.closest('.btn:not(.btn--ghost), .send') : null;
      px = e.clientX; py = e.clientY;
      if (cur && !frame) frame = requestAnimationFrame(paint);
    }, { passive: true });
  }

  /* ---------------------------------------------------------- page dots */
  /* page background dots light up around the cursor; position from here,
     the rest is CSS (body::before / body::after) */
  function initDots() {
    if (reduce) return;
    if (!window.matchMedia || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var root = document.documentElement, frame = 0, px = 0, py = 0, idle = 0;
    var hero = document.querySelector('.hero');
    function paint() {
      frame = 0;
      root.style.setProperty('--hx', px + 'px');
      root.style.setProperty('--hy', py + 'px');
      /* the hero draws its own copy of the grid on top of its image, so it
         needs the cursor in its own coordinates */
      if (hero) {
        var r = hero.getBoundingClientRect();
        hero.style.setProperty('--lx', (px - r.left) + 'px');
        hero.style.setProperty('--ly', (py - r.top) + 'px');
      }
    }
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      px = e.clientX; py = e.clientY;
      root.classList.add('is-lit');
      if (!frame) frame = requestAnimationFrame(paint);
      /* the light fades out once the cursor has rested for 2 s */
      clearTimeout(idle);
      idle = setTimeout(function () { root.classList.remove('is-lit'); }, 2000);
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', function () { clearTimeout(idle); root.classList.remove('is-lit'); });
  }

  /* ------------------------------------------------------------- people */
  /* "Jméno, tvář, reference": one person is open at a time; picking a
     face opens that card and shows the bio. Arrows step through people. */
  function initPeople() {
    var root = document.querySelector('.ppl');
    if (!root) return;
    var cards = [].slice.call(root.querySelectorAll('.ppl__card'));
    var picks = cards.map(function (c) { return c.querySelector('.ppl__pick'); });
    var btns = root.querySelectorAll('.ppl__btn');
    var bar = root.querySelector('.ppl__bar i'), count = root.querySelector('.ppl__count');
    if (!cards.length) return;
    root.classList.add('ppl--js');
    var cur = -1;                         /* nobody is open until picked */
    function show(i, focus) {
      cur = i < 0 ? -1 : (i + cards.length) % cards.length;
      root.classList.toggle('has-open', cur > -1);
      cards.forEach(function (c, k) {
        var on = k === cur;
        c.classList.toggle('is-on', on);
        picks[k].setAttribute('aria-expanded', on ? 'true' : 'false');
        c.querySelector('.ppl__txt').inert = !on;
      });
      if (bar) bar.style.transform = 'scaleX(' + ((cur + 1) / cards.length) + ')';
      if (count) count.textContent = (cur < 0 ? '–' : cur + 1) + ' / ' + cards.length;
      if (focus && cur > -1) picks[cur].focus();
    }
    picks.forEach(function (p, i) {
      /* clicking the open person closes them again */
      p.addEventListener('click', function () { show(i === cur ? -1 : i); });
      p.addEventListener('keydown', function (e) {
        var k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (k) { e.preventDefault(); show((cur < 0 ? i : cur) + k, true); }
      });
    });
    [].forEach.call(btns, function (b) {
      b.addEventListener('click', function () {
        var d = +b.dataset.dir;
        show(cur < 0 ? (d > 0 ? 0 : cards.length - 1) : cur + d);
      });
    });
    show(-1);
  }

  /* ------------------------------------------------------------- mobile */
  /* phones: the page menu opens from a button; the pillar switch collapses
     into one row that expands into the full list. Desktop is untouched. */
  function initMobile() {
    var mq = window.matchMedia ? matchMedia('(max-width: 1120px)') : null;
    var btn = document.querySelector('.menu-btn'), nav = document.getElementById('navm');
    if (btn && nav) {
      var root = document.documentElement;
      function set(open) {
        root.classList.toggle('menu-open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      btn.addEventListener('click', function () { set(!root.classList.contains('menu-open')); });
      nav.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
      if (mq) mq.addEventListener('change', function () { if (!mq.matches) set(false); });
    }
    var tabs = document.querySelector('.pil__tabs');
    var small = window.matchMedia ? matchMedia('(max-width: 900px)') : null;
    if (tabs && small) {
      tabs.addEventListener('click', function (e) {
        if (!small.matches) return;
        var t = e.target.closest('.pil__tab');
        if (!t) return;
        /* the selected row opens / closes the list; picking another closes it */
        if (t.getAttribute('aria-selected') === 'true' && !tabs.classList.contains('is-open')) tabs.classList.add('is-open');
        else tabs.classList.remove('is-open');
      });
      small.addEventListener('change', function () { tabs.classList.remove('is-open'); });
    }
  }

  /* ---------------------------------------------------------- pillar fit */
  /* "Jdeme po konečném výsledku." is sized so it spans exactly from the top
     of the pillar switch to the last line of the pillar intro next to it.
     All intros share one row and sit on its bottom, so the target is the
     same for every pillar and nothing changes when switching. */
  function initPilFit() {
    var pil = document.querySelector('.pil');
    if (!pil) return;
    var h2 = pil.querySelector('.pil__side > h2'), tabs = pil.querySelector('.pil__tabs');
    var wide = window.matchMedia ? matchMedia('(min-width: 901px)') : null;
    if (!h2 || !tabs || !wide) return;
    /* font metrics as fractions of the font size */
    var cv = document.createElement('canvas').getContext('2d');
    function metrics(el) {
      var cs = getComputedStyle(el);
      cv.font = cs.fontWeight + ' 100px ' + cs.fontFamily;
      var m = cv.measureText('JHkx');
      return { A: m.fontBoundingBoxAscent / 100, D: m.fontBoundingBoxDescent / 100,
               C: cv.measureText('H').actualBoundingBoxAscent / 100, fs: parseFloat(cs.fontSize) };
    }
    function textRects(el) {
      var r = document.createRange(); r.selectNodeContents(el);
      var rs = r.getClientRects(); return rs.length ? rs : [el.getBoundingClientRect()];
    }
    /* visually: the heading's cap line meets the switch's cap line, and its
       last baseline sits on the intro's last baseline */
    function fit() {
      if (!wide.matches) { h2.style.fontSize = ''; h2.style.marginTop = ''; pil.style.gridTemplateColumns = ''; return; }
      var intro = pil.querySelector('.pil__panel.is-on .pil__intro') || pil.querySelector('.pil__intro');
      var tab = tabs.querySelector('[aria-selected="true"] .pil__t') || tabs.querySelector('.pil__t');
      if (!intro || !tab) return;
      var mt = metrics(tab), rt = textRects(tab)[0];
      var capTop = rt.top + (mt.A - mt.C) * mt.fs;
      /* intros sit at the top of a shared row; the heading reaches the last
         line of the longest one, so it stays put when switching pillars */
      var base = 0;
      [].forEach.call(pil.querySelectorAll('.pil__intro'), function (el) {
        var mi = metrics(el), rs = textRects(el), ri = rs[rs.length - 1];
        if (ri.height) base = Math.max(base, ri.bottom - mi.D * mi.fs);
      });
      var mh = metrics(h2);
      /* "Jdeme po / konečném / výsledku." - counted, so EN works too */
      var lines = Math.max(1, Math.round(h2.getBoundingClientRect().height / parseFloat(getComputedStyle(h2).fontSize)));
      var fs = (base - capTop) / ((lines - 1) + mh.C);
      if (!(fs > 20 && fs < 140)) return;
      h2.style.fontSize = fs + 'px';
      /* the heading column is as wide as the heading's longest line, so
         "Jdeme po" never breaks; the rest goes to the content column */
      var cs = getComputedStyle(h2);
      cv.font = cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
      var w = 0;
      h2.textContent.replace(/\u00a0/g, ' ').split(/ (?=konečném|výsledku|end)| (?=result)/).forEach(function (l) {
        w = Math.max(w, cv.measureText(l).width);
      });
      pil.style.gridTemplateColumns = Math.ceil(w + fs * .3) + 'px minmax(0,1fr)';
      h2.style.marginTop = '0px';
      var top = h2.getBoundingClientRect().top;
      var cap0 = top + (fs - (mh.A + mh.D) * fs) / 2 + (mh.A - mh.C) * fs;
      h2.style.marginTop = (capTop - cap0) + 'px';
    }
    var raf = 0;
    function later() { cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { fit(); fit(); }); }
    window.addEventListener('resize', later);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
    document.addEventListener('langchange', later);
    fit(); fit();
  }

  /* -------------------------------------------------------- pillar align */
  /* desktop: all service cards share the tallest card's height, and the
     intro under the heading starts on the same line as the descriptions */
  function initPilAlign() {
    var pil = document.querySelector('.pil');
    if (!pil) return;
    var lead = pil.querySelector('.pil__lead'), h2 = pil.querySelector('.pil__head h2');
    var wide = window.matchMedia ? matchMedia('(min-width: 901px)') : null;
    if (!lead || !h2 || !wide) return;
    function top(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
    function align() {
      if (!wide.matches) { ['--svc-h', '--svc-t', '--lead-y'].forEach(function (p) { pil.style.removeProperty(p); }); return; }
      var cards = pil.querySelectorAll('.pil__svc');
      /* titles first: natural height of the tallest one becomes the row */
      pil.style.setProperty('--svc-t', 'auto');
      var tmax = 0;
      [].forEach.call(pil.querySelectorAll('.pil__svc h3'), function (h) { tmax = Math.max(tmax, h.offsetHeight); });
      pil.style.setProperty('--svc-t', Math.ceil(tmax) + 'px');
      pil.style.setProperty('--svc-h', '0px');
      var max = 0;
      [].forEach.call(cards, function (c) { max = Math.max(max, c.offsetHeight); });
      pil.style.setProperty('--svc-h', Math.ceil(max) + 'px');
      var d = pil.querySelector('.pil__panel.is-on .pil__d') || pil.querySelector('.pil__d');
      if (!d) return;
      /* measure with entrance animations/transforms switched off for a
         moment, so they cannot leak into the numbers */
      pil.classList.add('is-measuring');
      void pil.offsetWidth;
      var y = d.getBoundingClientRect().top - h2.getBoundingClientRect().bottom;
      pil.classList.remove('is-measuring');
      pil.style.setProperty('--lead-y', Math.max(12, y) + 'px');
    }
    var raf = 0;
    function later() { cancelAnimationFrame(raf); raf = requestAnimationFrame(align); }
    window.addEventListener('resize', later);
    document.addEventListener('langchange', function () { setTimeout(later, 0); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
    window.addEventListener('load', later);
    pil.addEventListener('click', function (e) { if (e.target.closest('.pil__tab')) later(); });
    align();
  }

  /* ------------------------------------------------------- service index */
  /* /sluzby: the pill in the sticky index follows the service in view */
  function initSvx() {
    var nav = document.querySelector('.svx');
    if (!nav) return;
    var links = [].slice.call(nav.querySelectorAll('a[href^="#"]:not(.svx__p)'));
    var map = {};
    links.forEach(function (a) {
      var b = a.querySelector('b'); if (b) a.title = b.textContent;
      var el = document.getElementById(a.getAttribute('href').slice(1)); if (el) map[el.id] = a;
    });
    function on(id) {
      links.forEach(function (a) { a.classList.toggle('is-on', map[id] === a); });
      /* the pillar group that holds the current service */
      [].forEach.call(nav.querySelectorAll('.svx__grp'), function (g) { g.classList.toggle('is-in', !!(map[id] && g.contains(map[id]))); });
      var a = map[id];
    }
    /* the service whose top has passed 40% of the screen is the current one */
    var ids = Object.keys(map), last = null;
    function spy() {
      var line = innerHeight * .4, cur = ids[0];   /* before any service: the first one */
      ids.forEach(function (id) { if (document.getElementById(id).getBoundingClientRect().top <= line) cur = id; });
      if (cur !== last) { last = cur; on(cur); }
    }
    /* at the top of the page the menu shows every name; once the reader
       scrolls it folds into bubbles */
    function full() { nav.classList.toggle('is-full', scrollY < 80); }
    addEventListener('scroll', full, { passive: true });
    full();
    addEventListener('scroll', spy, { passive: true });   /* 7 rects - cheap enough per event */
    spy();
    /* a pick lights up right away, before the smooth scroll arrives.
       Narrow screens: the bar shows the current service only; the first
       tap opens the list, a pick in the open list scrolls and closes it */
    var small = window.matchMedia ? matchMedia('(max-width: 1000px)') : null;
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (small && small.matches && !nav.classList.contains('is-open')) {
          e.preventDefault(); nav.classList.add('is-open'); return;
        }
        nav.classList.remove('is-open');
        var id = a.getAttribute('href').slice(1); last = id; on(id);
      });
    });
  }

  function boot() { initServices(); initSpotlight(); initPick(); initPillars(); initMarquee(); initBtnGlow(); initDots(); initPeople(); initMobile(); initPilAlign(); initSvx(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
