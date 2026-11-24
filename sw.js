const CACHE='bdmt-rc64-isolated-d419646daff6e91f';
const FILES=['./','./index.html','./style.css','./app.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./build.json','./licenses.txt','./fonts/NotoSansJP-Regular.ttf','./fonts/OFL.txt','./fonts/SOURCE.txt','./score-sheets/singles.pdf','./score-sheets/doubles.pdf'];
const INTEGRITY={"./index.html":"caa11b6ca6876c540e91066facb0bfeacefc20833d743f9f56020e7faa9b5438","./app.js":"ae6a16a84cfc9a59662fc4ad48e44c2a03626250a276090f63dd40f78f84990b","./style.css":"095311e2e38750bbad71efd1f10c8b821a9a011e856ccf976cd180ea2084ece2","./manifest.webmanifest":"f65b55c77133daf4443704d148608420e19f36d83d299b10fd39f3c7467e7a6b","./icon.svg":"ae11699cf2ae39dc23ef4ce0a67b2aacdf8a211ec5bf9999127ec82bfbce9c9a","./icon-192.png":"3923c9ea9717121318f3903daf91ae6546ed3e45d801f763084c315f343455c9","./icon-512.png":"138002aee459a9a67e7b9563e96c91bf38128f668c6962eeeeb62d8c2ae2e04b","./build.json":"2b16cbaac6e5de88d6533d2830016713add5907fa77d44e65a020f2276b702c8","./licenses.txt":"0d439aa7c1f6a73552a6d64f88f284a80e58aac08d30f81f3e8a2f5f941c4cf2","./fonts/NotoSansJP-Regular.ttf":"45cd530d8064e752de41de61ab4195220b52036a7daf9bd3f0d0c8af888a3bd9","./fonts/OFL.txt":"1c05c68c34f9708415aada51f17e1b0092d2cea709bf4a94cd38114f9e73d7d9","./fonts/SOURCE.txt":"cdd442bcf89747bc07dbbea7dacfec3efb9e1571cbedd8e3b70306080441812e","./score-sheets/singles.pdf":"80774dc6c30646951f2d8fa62f4d15c4b03fbffea13ef6bbe806dcc15559b504","./score-sheets/doubles.pdf":"a0310373911759de2753355f3c045544bda50cbf5b27b3a4876641f538a86353","./":"caa11b6ca6876c540e91066facb0bfeacefc20833d743f9f56020e7faa9b5438"};
async function verified(response,expected){if(!response||!response.ok)throw Error('配布資産の取得に失敗');const bytes=await response.clone().arrayBuffer();const actual=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');if(actual!==expected)throw Error('配布資産のSHA-256不一致');return response;}
self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(CACHE);if(!Object.keys(INTEGRITY).length){await c.addAll(FILES);return;}const fetched=await Promise.all(FILES.map(async f=>[f,await verified(await fetch(f,{cache:'reload'}),INTEGRITY[f])]));for(const [f,response]of fetched)await c.put(f,response);
 // This template-only update can replace the verified cache without reloading open pages.
 await self.skipWaiting();
})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{const keys=await caches.keys();const old=keys.filter(k=>k.startsWith('bdmt-rc64-isolated-'));await Promise.all(old.filter(k=>k!==CACHE).slice(0,-1).map(k=>caches.delete(k)));await self.clients.claim();})()));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.open(CACHE).then(async c=>{if(!Object.keys(INTEGRITY).length)return await c.match(e.request)||fetch(e.request);const key=FILES.find(f=>new URL(f,self.registration.scope).href===(new URL(e.request.url).origin+new URL(e.request.url).pathname));if(!key)return fetch(e.request);try{const cached=await c.match(key);if(cached){try{return await verified(cached,INTEGRITY[key]);}catch{}}const response=await verified(await fetch(e.request,{cache:'reload'}),INTEGRITY[key]);await c.put(key,response.clone());return response;}catch{return new Response('オフライン資産が不足または破損しています。大会データを消去せず、通信を戻して同じURLを再読込してください。',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});}}));});
// Also accept the explicit activation message used by older versions.
self.addEventListener('message',e=>{
  if(e.data==='ACTIVATE'){self.skipWaiting();return;}
  if(e.data!=='OFFLINE_STATUS'||!e.ports[0])return;
  e.waitUntil((async()=>{
    let complete=false;
    try{
      const cache=await caches.open(CACHE);
      await Promise.all(FILES.map(async key=>verified(await cache.match(key),INTEGRITY[key])));
      complete=true;
    }catch{}
    e.ports[0].postMessage({complete});
  })());
});
