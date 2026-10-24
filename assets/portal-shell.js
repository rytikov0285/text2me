(function(){
"use strict";
function initPortalShell(){
 var path=window.location.pathname.replace(/\/+$/,"")||"/text2me";
 var isHome=path==="/text2me"||path==="/";
 var audience=path==="/text2me/people"||path==="/text2me"||path==="/"?"citizens":path==="/text2me/ip"?"ip":path==="/text2me/business"?"business":path==="/text2me/lawyer"?"business":"";
 if(path.indexOf("/text2me/documents/pretenziya-prodavtsu")===0||path.indexOf("/text2me/documents/isk-v-sud")===0||path.indexOf("/text2me/documents/dogovor-arendy")===0)audience="citizens";
 var params=new URLSearchParams(window.location.search);
 if(path==="/text2me/documents"&&params.get("audience")==="citizens")audience="citizens";
 if(path==="/text2me/documents"&&params.get("audience")==="business")audience="business";
 if(isHome){
  var homeHeader=document.querySelector(".portal-header");
  if(homeHeader){
   homeHeader.querySelectorAll("[data-audience-link]").forEach(function(a){if(a.getAttribute("data-audience-link")===audience)a.setAttribute("aria-current","page");});
  }
  return;
 }
 var oldHeader=document.querySelector("body > header");
 if(!oldHeader)return;
 var header=document.createElement("header");header.className="portal-shell-header";
 header.innerHTML='<a class="portal-shell-skip" href="#main">Перейти к содержанию</a><div class="portal-shell-wrap portal-shell-top"><a class="portal-shell-brand" href="/text2me/" aria-label="text2me — главная">text2<span class="shell-brand-mark">me</span></a><nav class="portal-shell-audience" aria-label="Выбор аудитории"><a href="/text2me/people/" data-audience="citizens">Физическим лицам</a><a href="/text2me/ip/" data-audience="ip">ИП</a><a href="/text2me/business/" data-audience="business">Юридическим лицам</a></nav><div class="portal-shell-actions"><span class="portal-shell-phone">Телефон поддержки не опубликован</span><a class="portal-shell-contact" href="/text2me/request/">Контакты</a><button type="button" class="portal-shell-search" aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K">⌕ Поиск</button></div></div><nav class="portal-shell-wrap portal-shell-nav" aria-label="Основная навигация"><a href="/text2me/people/">Жизненные ситуации</a><a href="/text2me/documents/?audience=citizens">Каталог документов</a><a href="/text2me/law/">Правовая база</a><a href="/text2me/calendar/">Сроки и календарь</a><a href="/text2me/request/">Спросите эксперта</a><a href="/text2me/business/">Организациям</a></nav>';
 oldHeader.replaceWith(header);
 var mainTarget=document.querySelector("main[id]");if(mainTarget){var skip=header.querySelector(".portal-shell-skip");if(skip)skip.href="#"+mainTarget.id;}
 header.querySelectorAll("[data-audience]").forEach(function(a){if(a.getAttribute("data-audience")===audience)a.setAttribute("aria-current","page");});
 var navLinks=header.querySelectorAll(".portal-shell-nav a");
 navLinks.forEach(function(a){var u=new URL(a.href,window.location.href);if(u.pathname===window.location.pathname&&u.hash===window.location.hash)a.setAttribute("aria-current","page");});
 var dialog=document.createElement("div");dialog.className="portal-shell-dialog";dialog.hidden=true;
 var panel=document.createElement("section");panel.className="portal-shell-panel";panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.setAttribute("aria-labelledby","portal-shell-search-title");
 var close=document.createElement("button");close.type="button";close.className="portal-shell-close";close.textContent="Закрыть";close.setAttribute("aria-label","Закрыть поиск");
 var title=document.createElement("h2");title.id="portal-shell-search-title";title.textContent="Поиск по документам и сервисам";
 var form=document.createElement("form");form.className="portal-shell-form";form.action="/text2me/documents/";form.method="get";
 var label=document.createElement("label");label.htmlFor="portal-shell-query";label.textContent="Введите название документа, тему или задачу";
 var input=document.createElement("input");input.id="portal-shell-query";input.name="q";input.type="search";input.placeholder="Например: претензия, иск, заявление, срок";input.autocomplete="off";
 var submit=document.createElement("button");submit.className="portal-shell-submit";submit.type="submit";submit.textContent="Найти в каталоге";
 var note=document.createElement("p");note.textContent="Поиск выполняется по каталогу документов. Ctrl+K или ⌘K — открыть поиск, Esc — закрыть.";
 form.append(label,input,submit);panel.append(close,title,form,note);dialog.append(panel);document.body.append(dialog);
 var opener=header.querySelector(".portal-shell-search");
 function open(){dialog.hidden=false;input.value="";window.setTimeout(function(){input.focus();},0);}
 function shut(){dialog.hidden=true;opener.focus();}
 opener.addEventListener("click",open);close.addEventListener("click",shut);
 dialog.addEventListener("click",function(e){if(e.target===dialog)shut();});
 document.addEventListener("keydown",function(e){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();open();}else if(e.key==="Escape"&&!dialog.hidden){e.preventDefault();shut();}});
 form.addEventListener("submit",function(e){if(!input.value.trim()){e.preventDefault();input.focus();}});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initPortalShell);else initPortalShell();
})();
/* Global document navigation and selected-text tools */
(function(){ "use strict";
function addUtilities(){
if(!document.querySelector(".text2me-rail")){
var rails=[
{cls:"text2me-rail-left",title:"Быстрый старт",intro:"Действия, а не виды документов",links:[["＋","Создать документ","/text2me/documents/"],["⌖","Описать ситуацию","/text2me/people/"],["✓","Проверить документ","/text2me/ai/"],["↗","Подготовить к отправке","/text2me/start/"]]},
{cls:"text2me-rail-right",title:"Справка и инструменты",intro:"Сопутствующие сервисы",links:[["?","Спросите эксперта","/text2me/request/"],["▤","Мои документы","/text2me/space/"],["§","Правовые источники","/text2me/law/"],["▦","Календарь и сроки","/text2me/calendar/"],["∑","Таблицы и расчёты","/text2me/calculators/"],["⌖","Адреса и учреждения","/text2me/data-engine/"],["↗","Новости России","https://government.ru/news/"],["i","Помощь по сайту","/text2me/start/"]]}];
rails.forEach(function(d){var el=document.createElement("aside");el.className="text2me-rail "+d.cls;if(d.cls==="text2me-rail-left")el.id="quick-start";el.setAttribute("aria-label",d.title);var h=document.createElement("h2");h.textContent=d.title;var p=document.createElement("p");p.textContent=d.intro;el.append(h,p);d.links.forEach(function(x){var a=document.createElement("a");a.href=x[2];if(x[2].indexOf("http")===0){a.target="_blank";a.rel="noopener";}var m=document.createElement("span");m.className="rail-mark";m.textContent=x[0];var t=document.createElement("span");t.textContent=x[1];a.append(m,t);el.appendChild(a);});document.body.appendChild(el);});
}
if(!document.querySelector(".text2me-selection-tools")){
var bar=document.createElement("div");bar.className="text2me-selection-tools";bar.hidden=true;bar.setAttribute("role","toolbar");bar.setAttribute("aria-label","Действия с выделенным текстом");[["copy","Копировать"],["share","Поделиться"],["print","Печать"]].forEach(function(x){var b=document.createElement("button");b.type="button";b.dataset.action=x[0];b.textContent=x[1];bar.appendChild(b);});document.body.appendChild(bar);var selected="";
document.addEventListener("mouseup",function(e){if(bar.contains(e.target))return;var s=window.getSelection();selected=s?s.toString().trim():"";if(selected.length<2){bar.hidden=true;return;}var r=s.getRangeAt(0).getBoundingClientRect();bar.hidden=false;bar.style.left=Math.max(8,Math.min(window.innerWidth-250,r.left+r.width/2-110))+"px";bar.style.top=Math.max(8,Math.min(window.innerHeight-48,r.top-48))+"px";});
document.addEventListener("selectionchange",function(){var s=window.getSelection();if(!s||!s.toString().trim())bar.hidden=true;});
bar.addEventListener("click",function(e){var act=e.target&&e.target.dataset.action;if(!act||!selected)return;
if(act==="copy"){if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(selected).then(function(){e.target.textContent="Скопировано";}).catch(function(){window.prompt("Скопируйте выделенный текст:",selected);});else window.prompt("Скопируйте выделенный текст:",selected);}
if(act==="share"){if(navigator.share)navigator.share({title:document.title,text:selected,url:window.location.href}).catch(function(){});else if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(selected+"\n"+window.location.href).then(function(){e.target.textContent="Текст и ссылка скопированы";});else window.prompt("Скопируйте текст и ссылку:",selected+"\n"+window.location.href);}
if(act==="print"){var w=window.open("","_blank");if(w){w.document.write("<!doctype html><html lang='ru'><meta charset='utf-8'><title>Выделенный текст</title><body style='font:16px/1.6 Arial,sans-serif;max-width:800px;margin:40px auto;white-space:pre-wrap'></body></html>");w.document.body.textContent=selected;w.document.close();w.focus();w.print();}}
});
}}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",addUtilities);else addUtilities();
})();

/* Mobile equivalent of persistent side rails */
(function(){function addMobileActions(){if(document.querySelector(".text2me-mobile-actions"))return;var nav=document.createElement("nav");nav.className="text2me-mobile-actions";nav.setAttribute("aria-label","Быстрый доступ");[["Создать документ","/text2me/documents/"],["Описать ситуацию","/text2me/people/"],["Спросить эксперта","/text2me/request/"],["Календарь","/text2me/calendar/"]].forEach(function(x){var a=document.createElement("a");a.href=x[1];a.textContent=x[0];nav.appendChild(a);});document.body.appendChild(nav);}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",addMobileActions);else addMobileActions();})();

/* Official public-resource links in the footer; the third-party counter is linked, not embedded. */
(function(){
 "use strict";
 function addPartnerLinks(){
  if(document.querySelector(".t2m-partner-links"))return;
  var footer=document.querySelector(".portal-footer,.site-footer");
  if(!footer)return;
  var nav=document.createElement("nav");
  nav.className="t2m-partner-links";
  nav.setAttribute("aria-label","Официальные информационные ресурсы");
  var items=[
   ["https://government.ru/","https://www.nalog.gov.ru/images_ca/banners/government.png","Правительство России"],
   ["https://www.gosuslugi.ru/","https://www.nalog.gov.ru/images_ca/banners/ul2018/c45c164d-bcde-46d1-9e51-5853c9a10971.png","Госуслуги"],
   ["https://www.nalog.gov.ru/rn77/about_fts/og/","https://www.nalog.gov.ru/images_ca/banners/ul2018/open.png","Открытые данные ФНС России"],
   ["https://www.nalog.gov.ru/","https://data.nalog.ru/css/ul2018/img/logo-footer.svg","Федеральная налоговая служба России"]
  ];
  items.forEach(function(item){
   var a=document.createElement("a");a.className="t2m-partner-link";a.href=item[0];a.target="_blank";a.rel="noopener noreferrer";
   var img=document.createElement("img");img.src=item[1];img.alt=item[2];img.loading="lazy";
   a.appendChild(img);nav.appendChild(a);
  });
  var counter=document.createElement("a");counter.className="t2m-partner-link";counter.href="https://cnt.sputnik.ru/public/nalog.gov.ru";counter.target="_blank";counter.rel="noopener noreferrer";
  var label=document.createElement("span");label.textContent="Счётчик «Спутник» — источник";counter.appendChild(label);nav.appendChild(counter);
  var target=footer.querySelector(".portal-footer-bottom,.footer-bottom");
  if(target)footer.insertBefore(nav,target);else footer.appendChild(nav);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",addPartnerLinks);else addPartnerLinks();
})();
