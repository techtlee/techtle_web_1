/* Techtlee - contact form. */
(function(){
  /* contact form: validates name + e-mail inline. Without a configured
     endpoint it opens the visitor's mail client with the message prefilled
     instead of pretending to send; a failed send says so. */
  var EMAIL='info@techtlee.com';
  var T={
    cs:{ok:'Děkujeme. Zpráva odešla, ozveme se do jednoho pracovního dne.',
        mail:'Otevřeli jsme vám e-mail s předvyplněnou zprávou. Stačí ji odeslat.',
        err:'Zprávu se nepodařilo odeslat. Napište nám prosím přímo na ', subj:'Poptávka z webu'},
    en:{ok:'Thank you. Your message is on its way - we reply within one business day.',
        mail:'We opened an e-mail with your message prefilled. Just hit send.',
        err:'The message could not be sent. Please write to us directly at ', subj:'Enquiry from the website'}
  };
  var form=document.querySelector('form.contact-form'); if(!form) return;
  var status=form.querySelector('.form-status');
  var req=[].slice.call(form.querySelectorAll('[required]'));
  function lang(){ return document.documentElement.lang==='en'?'en':'cs'; }
  function show(kind,text,withMail){
    status.className='form-status '+kind; status.textContent=text;
    if(withMail){ var a=document.createElement('a'); a.href='mailto:'+EMAIL; a.textContent=EMAIL;
      status.appendChild(a); status.appendChild(document.createTextNode('.')); }
  }
  function check(i){
    var bad=!i.value.trim()||(i.type==='email'&&!i.validity.valid);
    i.closest('.field').classList.toggle('bad',bad); i.setAttribute('aria-invalid',bad?'true':'false');
    return !bad;
  }
  req.forEach(function(i){
    i.addEventListener('blur',function(){ if(i.value) check(i); });
    i.addEventListener('input',function(){ if(i.closest('.field.bad')) check(i); });
  });
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var first=null; req.forEach(function(i){ if(!check(i)&&!first) first=i; });
    if(first){ first.focus(); return; }
    var t=T[lang()], action=form.getAttribute('action')||'';
    if(action.indexOf('FORM_ENDPOINT')!==-1){
      var fd=new FormData(form);
      var body=((fd.get('message')||'')+'\n\n'+fd.get('name')+'\n'+fd.get('email')).trim();
      location.href='mailto:'+EMAIL+'?subject='+encodeURIComponent(t.subj+' - '+fd.get('name'))+'&body='+encodeURIComponent(body);
      show('ok',t.mail); return;
    }
    var btn=form.querySelector('.send'); btn.disabled=true;
    var fd=new FormData(form), data={lang:lang()}; fd.forEach(function(v,k){ data[k]=v; });
    fetch(action,{method:'POST',body:JSON.stringify(data),headers:{'Content-Type':'application/json',Accept:'application/json'}})
      .then(function(r){ if(!r.ok) throw 0; show('ok',t.ok); form.reset(); })
      .catch(function(){ show('err',t.err,true); })
      .finally(function(){ btn.disabled=false; });
  });
})();
