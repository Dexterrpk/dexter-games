const CACHE='dexter-games-v9';
const CORE=['/','/index.html','/cube.html','/chess.html','/checkers.html','/domino.html','/puzzle.html','/assets/base.css','/assets/pro-ui.css','/js/audio.js','/js/branding.js','/js/peer-room.js','/js/game-core.js','/js/checkers-engine.js','/js/domino-engine.js','/js/puzzle-engine.js','/manifest.webmanifest','/icon.svg'];

async function withBranding(response,request){
  if(!response||!response.ok||request.mode!=='navigate')return response;
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return response;
  let html=await response.text();
  if(!html.includes('/assets/pro-ui.css'))html=html.replace(/<\/head>/i,'<link rel="stylesheet" href="/assets/pro-ui.css"></head>');
  if(!html.includes('/js/branding.js'))html=html.replace(/<\/body>/i,'<script src="/js/branding.js" defer></script></body>');
  const headers=new Headers(response.headers);headers.delete('content-length');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith((async()=>{
    try{
      const r=await fetch(e.request),url=new URL(e.request.url),cacheable=r&&r.ok&&(url.origin===location.origin||url.hostname==='cdn.jsdelivr.net');
      const served=await withBranding(r,e.request);
      if(cacheable){const copy=served.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{})}
      return served;
    }catch{
      const cached=await caches.match(e.request);
      if(cached)return withBranding(cached,e.request);
      if(e.request.mode==='navigate'){
        const fallback=await caches.match('/index.html');
        if(fallback)return withBranding(fallback,e.request);
      }
      return Response.error();
    }
  })());
});
