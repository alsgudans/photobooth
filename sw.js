/* 네컷 포토부스: 한 번 열어 두면 인터넷 없이도 열리게 저장하는 파일 */
const VER='photobooth-v1';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VER).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VER).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  /* 글꼴(구글 폰트): 한 번 받으면 저장해 두고 이후엔 저장본 사용 */
  if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.open(VER).then(async c=>{
      const hit=await c.match(r);
      const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res}).catch(()=>null);
      return hit||(await net)||Response.error();
    }));
    return;
  }
  if(u.origin!==location.origin)return;
  /* 앱 파일: 인터넷이 되면 최신을 받아 저장, 안 되면 저장본 */
  e.respondWith(
    fetch(r).then(res=>{
      if(res&&res.ok){const cp=res.clone();caches.open(VER).then(c=>c.put(r,cp))}
      return res;
    }).catch(()=>caches.match(r,{ignoreSearch:true}).then(h=>h||caches.match('./index.html')))
  );
});
