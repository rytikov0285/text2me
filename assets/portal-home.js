(function(){
"use strict";
var form=document.getElementById("portal-search-form"),input=document.getElementById("portal-search"),results=document.getElementById("portal-search-results"),status=document.getElementById("portal-search-status");
var searchable=Array.prototype.slice.call(document.querySelectorAll("[data-search-item]"));
function search(q){
 q=(q||"").trim().toLocaleLowerCase("ru-RU");
 if(!results||!status)return;
 results.replaceChildren();
 if(!q){results.classList.add("portal-hidden");status.textContent="";return;}
 var hits=searchable.filter(function(el){return (el.textContent+" "+(el.getAttribute("data-keywords")||"")).toLocaleLowerCase("ru-RU").indexOf(q)!==-1;}).slice(0,12);
 results.classList.remove("portal-hidden");
 if(!hits.length){status.textContent="Совпадений в каталоге главной страницы не найдено. Попробуйте другое слово или откройте полный каталог.";return;}
 status.textContent="Найдено: "+hits.length+(hits.length===12?" (показаны первые 12)":"")+".";
 hits.forEach(function(el){
  var a=el.matches("a")?el:el.querySelector("a");
  if(!a)return;
  var row=document.createElement("a");row.className="portal-search-result";row.href=a.href;
  var title=document.createElement("strong");title.textContent=(el.querySelector("strong,h3,h2")||a).textContent.trim();
  var hint=document.createElement("span");hint.textContent=a.getAttribute("href").indexOf("#")>=0?"Перейти к разделу":"Открыть раздел";
  row.append(title,hint);results.appendChild(row);
 });
}
if(form)form.addEventListener("submit",function(e){e.preventDefault();search(input.value);if(results)results.scrollIntoView({behavior:"smooth",block:"nearest"});});
document.querySelectorAll("[data-search-term]").forEach(function(a){a.addEventListener("click",function(e){e.preventDefault();if(input){input.value=a.getAttribute("data-search-term");search(input.value);input.focus();}});});
var shortcut=document.getElementById("portal-search-shortcut");if(shortcut)shortcut.addEventListener("click",function(){if(input){input.focus();input.scrollIntoView({behavior:"smooth",block:"center"});}});
document.querySelectorAll("[data-audience-link]").forEach(function(a){a.addEventListener("click",function(){try{sessionStorage.setItem("text2me.audience",a.getAttribute("data-audience-link"));}catch(e){}});});
})();