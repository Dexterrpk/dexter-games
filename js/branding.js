(()=>{
  const BRAND='NeriInfotech';
  function ensureAuthorMeta(){
    let meta=document.querySelector('meta[name="author"]');
    if(!meta){meta=document.createElement('meta');meta.name='author';document.head.appendChild(meta)}
    meta.content=BRAND;
  }
  function mount(){
    ensureAuthorMeta();
    if(document.getElementById('neriinfotech-signature'))return;
    const style=document.createElement('style');
    style.id='neriinfotech-signature-style';
    style.textContent=`#neriinfotech-signature{width:min(100%,980px);margin:14px auto 0;padding:14px max(14px,env(safe-area-inset-right)) max(18px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));text-align:center;color:rgba(210,210,224,.58);font:600 .64rem/1.4 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.04em}#neriinfotech-signature strong{color:rgba(235,232,255,.82);font-weight:850;letter-spacing:.02em}`;
    document.head.appendChild(style);
    const footer=document.createElement('footer');
    footer.id='neriinfotech-signature';
    footer.setAttribute('aria-label','Créditos de desenvolvimento');
    footer.innerHTML='Desenvolvido por <strong>NeriInfotech</strong>';
    document.body.appendChild(footer);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
