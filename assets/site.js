/* Techtlee - theme toggle + Prague clock (every page). */
(function(){
  /* theme toggle */
  var root=document.documentElement, tc=document.getElementById('tc');
  var btn = document.getElementById('theme');
  function paint(){
    var light = root.getAttribute('data-theme')==='light';
    if(tc) tc.setAttribute('content', light ? '#F8F9F8' : '#0A0C0B');
    btn.setAttribute('aria-pressed', light ? 'true' : 'false');
  }
  paint();
  btn.addEventListener('click',function(){
    var light = root.getAttribute('data-theme')==='light';
    if(light) root.removeAttribute('data-theme'); else root.setAttribute('data-theme','light');
    try{ localStorage.setItem('tt-theme', light ? 'dark' : 'light'); }catch(e){}
    paint();
  });
})();
(function(){
  /* real local time in Prague - metadata, not decoration */
  var el = document.getElementById('clock');
  function tick(){
    try{
      var t = new Intl.DateTimeFormat('cs-CZ',{timeZone:'Europe/Prague',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
      el.textContent = 'Praha ' + t;
    }catch(e){}
  }
  tick(); setInterval(tick, 30000);
})();
