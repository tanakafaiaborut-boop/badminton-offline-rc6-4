const CACHE='bdmt-rc64-isolated-498361b21fa018e5';
const FILES=['./','./index.html','./style.css','./app.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./build.json','./licenses.txt','./fonts/NotoSansJP-Regular.ttf','./fonts/OFL.txt','./fonts/SOURCE.txt','./score-sheets/singles.pdf','./score-sheets/doubles.pdf'];
const INTEGRITY={"./index.html":"a967327a2dc844633b1070f611b1a57a4c8b92f9e565773482da9beb11688a04","./app.js":"5c9abe9a6cfa597f6eef58b99ad6ed5ceb7b5f2d1ece65c4c2572e56ab6aff4a","./style.css":"095311e2e38750bbad71efd1f10c8b821a9a011e856ccf976cd180ea2084ece2","./manifest.webmanifest":"8ca4dfb555398e48f0726b90b0d77481bc569616007084c71fd2d46d02a88d03","./icon.svg":"ae11699cf2ae39dc23ef4ce0a67b2aacdf8a211ec5bf9999127ec82bfbce9c9a","./icon-192.png":"3923c9ea9717121318f3903daf91ae6546ed3e45d801f763084c315f343455c9","./icon-512.png":"138002aee459a9a67e7b9563e96c91bf38128f668c6962eeeeb62d8c2ae2e04b","./build.json":"a5a13cf01467cff959b2bae550df07bf1942b95cd77742dd40badd31a0159da9","./licenses.txt":"0d439aa7c1f6a73552a6d64f88f284a80e58aac08d30f81f3e8a2f5f941c4cf2","./fonts/NotoSansJP-Regular.ttf":"45cd530d8064e752de41de61ab4195220b52036a7daf9bd3f0d0c8af888a3bd9","./fonts/OFL.txt":"1c05c68c34f9708415aada51f17e1b0092d2cea709bf4a94cd38114f9e73d7d9","./fonts/SOURCE.txt":"cdd442bcf89747bc07dbbea7dacfec3efb9e1571cbedd8e3b70306080441812e","./score-sheets/singles.pdf":"87e565938ec7d626e38dccd1c638e50c68ad92b09f108d4d2058115ffa7e76c1","./score-sheets/doubles.pdf":"de65f7f78a196ee664860fd5bdbc14d5e0afcfd6995fb4618d191dc0adc3e7a9","./":"a967327a2dc844633b1070f611b1a57a4c8b92f9e565773482da9beb11688a04"};
async function verified(response,expected){if(!response||!response.ok)throw Error('配布資産の取得に失敗');const bytes=await response.clone().arrayBuffer();const actual=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');if(actual!==expected)throw Error('配布資産のSHA-256不一致');return response;}
self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(CACHE);if(!Object.keys(INTEGRITY).length){await c.addAll(FILES);return;}const fetched=await Promise.all(FILES.map(async f=>[f,await verified(await fetch(f,{cache:'reload'}),INTEGRITY[f])]));for(const [f,response]of fetched)await c.put(f,response);})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{const keys=await caches.keys();const old=keys.filter(k=>k.startsWith('bdmt-rc64-isolated-'));await Promise.all(old.filter(k=>k!==CACHE).slice(0,-1).map(k=>caches.delete(k)));await self.clients.claim();})()));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.open(CACHE).then(async c=>{if(!Object.keys(INTEGRITY).length)return await c.match(e.request)||fetch(e.request);const key=FILES.find(f=>new URL(f,self.registration.scope).href===(new URL(e.request.url).origin+new URL(e.request.url).pathname));if(!key)return fetch(e.request);try{const cached=await c.match(key);if(cached){try{return await verified(cached,INTEGRITY[key]);}catch{}}const response=await verified(await fetch(e.request,{cache:'reload'}),INTEGRITY[key]);await c.put(key,response.clone());return response;}catch{return new Response('オフライン資産が不足または破損しています。大会データを消去せず、通信を戻して同じURLを再読込してください。',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});}}));});
// Waiting worker is activated only by a user requested reload, never during a save.
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
