/* Techtlee - interaction layer (every page).
   1. Services: each row of the services table collapses to a one-line
      preview and opens on click / Enter / Space. One row open at a time.
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
      var rows = [].slice.call(table.querySelectorAll('tbody tr'));
      if (!rows.length) return;
      table.classList.add('dt--acc');
      /* rows become grid boxes so a cell can clamp to one line; restate the
         table semantics that a display change can strip in some browsers */
      table.setAttribute('role', 'table');
      [].forEach.call(table.querySelectorAll('tr'), function (tr) { tr.setAttribute('role', 'row'); });
      [].forEach.call(table.querySelectorAll('th'), function (th) { th.setAttribute('role', 'columnheader'); });
      [].forEach.call(table.querySelectorAll('td'), function (td) { td.setAttribute('role', 'cell'); });
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
        b.setAttribute('aria-controls', desc.id);
        b.setAttribute('aria-labelledby', name.id);
        b.addEventListener('click', function (e) { e.stopPropagation(); toggle(row); });
        td.appendChild(b);
        row.appendChild(td);
        row._btn = b;
        set(row, i === 0);
        /* the whole row is the target, but never hijack a link or a text selection */
        row.addEventListener('click', function (e) {
          if (e.target.closest('a')) return;
          var sel = window.getSelection && String(window.getSelection());
          if (sel) return;
          toggle(row);
        });
      });
    });
  }

  /* ----------------------------------------------------------- spotlight */
  function initSpotlight() {
    if (reduce) return;
    if (!window.matchMedia || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var SEL = '.four > div, .rail > div, .who article, .dt tbody tr';
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
    cs: { hint: 'Označte, co platí i u vás.', count: 'Platí {n} z 10', clear: 'Zrušit výběr',
          cta: 'Popsat naši situaci', head: 'Poznáváme se v těchto větách:' },
    en: { hint: 'Mark the ones that apply to you.', count: '{n} of 10 apply', clear: 'Clear selection',
          cta: 'Describe our situation', head: 'These sound familiar:' }
  };
  var KEY = 'tt-pick';
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
  var SENT_KEY = 'tt-pick-text';
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


    function sync() {
      var p = loadPick(), t = PICK[lang()];
      [].forEach.call(ol.querySelectorAll('.log__b'), function (b) {
        b.setAttribute('aria-pressed', p.indexOf(+b.dataset.i) > -1 ? 'true' : 'false');
      });
      hint.textContent = t.hint;
      count.textContent = t.count.replace('{n}', p.length);
      clear.textContent = t.clear;
      cta.innerHTML = t.cta + ' <span aria-hidden="true">→</span>';
      sum.hidden = p.length === 0;
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

  function boot() { initServices(); initSpotlight(); initPick(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
