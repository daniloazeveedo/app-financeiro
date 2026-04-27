const CACHE='meu-controle-v32-geovea';
const ASSETS=['./','./index.html','./style.css','./app.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./assets/banks/nubank.svg','./assets/banks/cofrinho.svg','./assets/banks/itau.svg','./assets/banks/bb.svg','./assets/banks/santander.svg','./assets/banks/caixa.svg','./assets/banks/inter.svg','./assets/banks/default.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
