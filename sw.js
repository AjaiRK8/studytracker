/* Offline support for CA Final Study Punch Card.
   Keep this file in the same folder as index.html. Bump VERSION to force a refresh of the cache. */
const VERSION='punchcard-v1',CORE=['./','./index.html'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);

  /* Page itself (and any same-folder file): network first so updates arrive, cache when offline */
  if(u.origin===location.origin){
    e.respondWith(
      fetch(r).then(res=>{
        if(res&&res.ok){const cp=res.clone();caches.open(VERSION).then(c=>c.put(r,cp))}
        return res;
      }).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?(caches.match('./index.html').then(x=>x||caches.match('./'))):undefined)))
    );
    return;
  }

  /* Google Fonts: cache after first load so the look stays the same offline */
  if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{
      if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(VERSION).then(c=>c.put(r,cp))}
      return res;
    })));
  }
  /* Everything else (Google sign-in, Drive API, study links) is left alone */
});
