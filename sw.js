const CACHE='dexter-games-v3';
const CORE=['/','/index.html','/cube.html','/chess.html','/checkers.html','/domino.html','/puzzle.html','/assets/base.css','/js/audio.js','/js/peer-room.js','/js/game-core.js','/js/checkers-engine.js','/js/domino-engine.js','/js/puzzle-engine.js','/manifest.webmanifest','/icon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{
    const url=new URL(e.request.url),cacheable=r&&r.ok&&(url.origin===location.origin||url.hostname==='cdn.jsdelivr.net');
    if(cacheable){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{})}
    return r;
  }).catch(async()=>{
    const cached=await caches.match(e.request);if(cached)return cached;
    if(e.request.mode==='navigate')return caches.match('/index.html');
    return Response.error();
  }));
});
