(()=>{
  const BRAND='NeriInfotech';
  function ensureAuthorMeta(){
    let meta=document.querySelector('meta[name="author"]');
    if(!meta){meta=document.createElement('meta');meta.name='author';document.head.appendChild(meta)}
    meta.content=BRAND;
  }
  function ensureProUI(){
    if(document.querySelector('link[data-neri-pro-ui]'))return;
    const link=document.createElement('link');
    link.rel='stylesheet';link.href='/assets/pro-ui.css';link.dataset.neriProUi='1';
    document.head.appendChild(link);
  }
  function compactGameUI(){
    const game=document.querySelector('.game-layout'),cube=document.querySelector('.cube-panel');
    if(!game&&!cube)return;
    document.body.classList.add('game-ui');
    document.querySelectorAll('.room-box h3').forEach(h=>{if(/sala|pvp|corrida/i.test(h.textContent))h.textContent='Online'});
    if(game){
      const side=document.querySelector('.game-side');
      const source=[...document.querySelectorAll('.game-side .legend .rule,.game-side .note,.game-side .micro')];
      const texts=[...new Set(source.map(el=>el.textContent.replace(/\s+/g,' ').trim()).filter(t=>t.length>12))];
      if(side&&texts.length&&!side.querySelector('.game-help')){
        const details=document.createElement('details');details.className='game-help';
        const summary=document.createElement('summary');summary.textContent='Regras e ajuda';details.appendChild(summary);
        const content=document.createElement('div');content.className='game-help-content';
        texts.forEach(text=>{const p=document.createElement('p');p.textContent=text;content.appendChild(p)});
        details.appendChild(content);
        const target=side.firstElementChild||side;target.appendChild(details);
      }
    }
    const hint=document.querySelector('.viewer .hint');
    if(hint){setTimeout(()=>hint.classList.add('quiet'),5200);document.querySelector('.viewer')?.addEventListener('pointerdown',()=>hint.classList.add('quiet'),{once:true})}
  }
  function mount(){
    ensureAuthorMeta();ensureProUI();compactGameUI();
    if(document.getElementById('neriinfotech-signature'))return;
    const footer=document.createElement('footer');
    footer.id='neriinfotech-signature';
    footer.setAttribute('aria-label','Créditos de desenvolvimento');
    footer.innerHTML='Desenvolvido por <strong>NeriInfotech</strong>';
    document.body.appendChild(footer);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
