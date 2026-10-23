(function(){
"use strict";
if(!("serviceWorker" in navigator))return;
window.addEventListener("load",function(){
  navigator.serviceWorker.register("/text2me/sw.js",{scope:"/text2me/"}).catch(function(error){
    console.warn("text2me: offline mode could not be enabled.",error);
  });
});
})();