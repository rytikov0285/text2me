"use strict";
var CACHE_NAME="text2me-shell-v1";
var SHELL_URLS=[
  "/text2me/",
  "/text2me/organizer/",
  "/text2me/assets/style.css",
  "/text2me/assets/enhancements.css",
  "/text2me/assets/organizer.css",
  "/text2me/assets/enhancements.js",
  "/text2me/assets/organizer.js",
  "/text2me/assets/pwa.js",
  "/text2me/manifest.webmanifest",
  "/text2me/assets/text2me-icon.svg"
];
self.addEventListener("install",function(event){
  event.waitUntil(caches.open(CACHE_NAME).then(function(cache){
    return Promise.all(SHELL_URLS.map(function(url){
      return cache.add(url).catch(function(){return undefined});
    }));
  }).then(function(){return self.skipWaiting()}));
});
self.addEventListener("activate",function(event){
  event.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(key){return key.indexOf("text2me-shell-")===0&&key!==CACHE_NAME}).map(function(key){return caches.delete(key)}));
  }).then(function(){return self.clients.claim()}));
});
self.addEventListener("fetch",function(event){
  var request=event.request;
  if(request.method!=="GET")return;
  var url=new URL(request.url);
  if(url.origin!==self.location.origin||!url.pathname.startsWith("/text2me/"))return;
  if(request.mode==="navigate"){
    event.respondWith(fetch(request).then(function(response){
      if(response&&response.ok){var copy=response.clone();caches.open(CACHE_NAME).then(function(cache){cache.put(request,copy)});}
      return response;
    }).catch(function(){return caches.match(request).then(function(hit){return hit||caches.match("/text2me/")})}));
    return;
  }
  event.respondWith(caches.match(request).then(function(cached){
    if(cached)return cached;
    return fetch(request).then(function(response){
      if(response&&response.ok&&response.type==="basic"){var copy=response.clone();caches.open(CACHE_NAME).then(function(cache){cache.put(request,copy)});}
      return response;
    });
  }));
});