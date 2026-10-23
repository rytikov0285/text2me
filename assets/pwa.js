(function(){
"use strict";
if(!("serviceWorker" in navigator))return;
var deferredPrompt=null;
function addInstallControl(){
  var host=document.querySelector(".text2me-home-actions")||document.querySelector(".organizer-hero > div");
  if(!host||document.getElementById("text2me-install-app"))return;
  var button=document.createElement("button");
  button.type="button";
  button.id="text2me-install-app";
  button.className="text2me-install-app";
  button.textContent="Установить text2me";
  button.setAttribute("aria-label","Установить text2me на устройство");
  button.addEventListener("click",function(){
    if(deferredPrompt){
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function(){deferredPrompt=null;button.hidden=true}).catch(function(){deferredPrompt=null});
      return;
    }
    var ua=navigator.userAgent||"";
    var isIOS=/iphone|ipad|ipod/i.test(ua);
    var message=isIOS
      ?"Чтобы установить text2me на iPhone или iPad: откройте сайт в Safari, нажмите «Поделиться», затем «На экран Домой»."
      :"Откройте меню браузера и выберите пункт «Установить приложение» или «Добавить на главный экран», если он доступен.";
    window.alert(message);
  });
  host.appendChild(button);
  button.hidden=true;
  window.addEventListener("beforeinstallprompt",function(event){
    event.preventDefault();
    deferredPrompt=event;
    button.hidden=false;
  });
  window.addEventListener("appinstalled",function(){button.hidden=true;button.textContent="text2me установлено"});
}
window.addEventListener("load",function(){
  addInstallControl();
  navigator.serviceWorker.register("/text2me/sw.js",{scope:"/text2me/"}).catch(function(error){
    console.warn("text2me: offline mode could not be enabled.",error);
  });
});
})();