(function(){
"use strict";
var form=document.getElementById("portal-search-form"),input=document.getElementById("portal-search"),results=document.getElementById("portal-search-results"),status=document.getElementById("portal-search-status");
var searchable=Array.prototype.slice.call(document.querySelectorAll("[data-search-item]"));
var stopWords=["как","что","для","при","или","мне","нужно","надо","хочу","это","есть","мой","моя","мое","мои","все","по","на","из","от","за","с","и","в","к","о","об","подготовить","создать","составить","оформить","найти","документ","документы","могу","можно"];
var synonyms={
 "вернуть":["возврат","деньги","претензия","продавец","товар"],
 "возврат":["вернуть","деньги","претензия","продавец","товар"],
 "затопило":["затопление","залив","квартира","управляющая","акт"],
 "залив":["затопление","затопило","квартира","управляющая","акт"],
 "долг":["расписка","взыскание","иск","суд"],
 "взыскать":["долг","расписка","иск","суд"],
 "уволиться":["увольнение","работодатель","заявление","работа"],
 "увольнение":["уволиться","работодатель","заявление","работа"],
 "сломался":["некачественный","товар","претензия","продавец"],
 "некачественный":["сломался","товар","претензия","продавец"]
};
function tokensOf(q){
 var raw=(q||"").toLocaleLowerCase("ru-RU").split(/[^\p{L}\p{N}]+/u).filter(Boolean),out=[];
 raw.forEach(function(t){if(t.length<2||stopWords.indexOf(t)>=0)return;out.push(t);(synonyms[t]||[]).forEach(function(s){out.push(s)})});
 return Array.from(new Set(out));
}
function search(q){
 q=(q||"").trim();
 if(!results||!status)return;
 results.replaceChildren();
 if(!q){results.classList.add("portal-hidden");status.textContent="";return;}
 var tokens=tokensOf(q);
 if(!tokens.length)tokens=[q.toLocaleLowerCase("ru-RU")];
 var ranked=searchable.map(function(el){
  var text=(el.textContent+" "+(el.getAttribute("data-keywords")||"")).toLocaleLowerCase("ru-RU");
  var matched=tokens.filter(function(t){return text.indexOf(t)>=0});
  return {el:el,score:matched.length,matched:matched.length===tokens.length};
 }).filter(function(x){return x.score>0}).sort(function(a,b){return Number(b.matched)-Number(a.matched)||b.score-a.score});
 var hits=ranked.slice(0,10).map(function(x){return x.el});
 results.classList.remove("portal-hidden");
 if(!hits.length){status.textContent="На главной странице точных совпадений нет. Выполните поиск по полному каталогу.";addCatalogLink(q,"Искать по всему каталогу документов","Открыть каталог с вашим запросом");return;}
 status.textContent="Найдено подходящих разделов: "+ranked.length+(ranked.length>10?" (показаны первые 10)":"")+".";
 hits.forEach(function(el){
  var a=el.matches("a")?el:el.querySelector("a");if(!a)return;
  var row=document.createElement("a");row.className="portal-search-result";row.href=a.href;
  var title=document.createElement("strong");title.textContent=(el.querySelector("strong,h3,h2")||a).textContent.trim();
  var hint=document.createElement("span");hint.textContent="Открыть подходящий раздел";
  row.append(title,hint);results.appendChild(row);
 });
 addCatalogLink(q,"Искать по всему каталогу документов","Показать дополнительные результаты");
}
function addCatalogLink(q,titleText,hintText){
 var all=document.createElement("a");all.className="portal-search-result";all.href="/text2me/documents/?q="+encodeURIComponent(q);
 var title=document.createElement("strong");title.textContent=titleText;
 var hint=document.createElement("span");hint.textContent=hintText;all.append(title,hint);results.appendChild(all);
}
if(form)form.addEventListener("submit",function(e){e.preventDefault();search(input.value);if(results)results.scrollIntoView({behavior:"smooth",block:"nearest"});});
document.querySelectorAll("[data-search-term]").forEach(function(a){a.addEventListener("click",function(e){e.preventDefault();if(input){input.value=a.getAttribute("data-search-term");search(input.value);input.focus();}});});
var shortcut=document.getElementById("portal-search-shortcut");if(shortcut)shortcut.addEventListener("click",function(){if(input){input.focus();input.scrollIntoView({behavior:"smooth",block:"center"});}});
document.querySelectorAll("[data-audience-link]").forEach(function(a){a.addEventListener("click",function(){try{sessionStorage.setItem("text2me.audience",a.getAttribute("data-audience-link"));}catch(e){}});});
})();