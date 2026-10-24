(function(){
"use strict";
function initPortalShell(){
 var path=window.location.pathname.replace(/\/+$/,"")||"/text2me";
 var isHome=path==="/text2me"||path==="/";
 var audience=path==="/text2me/people"||path==="/text2me"||path==="/"?"citizens":path==="/text2me/ip"?"ip":path==="/text2me/business"?"business":path==="/text2me/lawyer"?"business":"";
 if(path.indexOf("/text2me/documents/pretenziya-prodavtsu")===0||path.indexOf("/text2me/documents/isk-v-sud")===0||path.indexOf("/text2me/documents/dogovor-arendy")===0)audience="citizens";
 if(!document.querySelector("script[data-t2m-ai-review]")){var aiReviewScript=document.createElement("script");aiReviewScript.src="/text2me/assets/ai-block-review.js?v=3";aiReviewScript.defer=true;aiReviewScript.dataset.t2mAiReview="1";document.head.appendChild(aiReviewScript);}
 var params=new URLSearchParams(window.location.search);
 if(!document.querySelector("script[data-t2m-document-workflow]")){var workflowScript=document.createElement("script");workflowScript.src="/text2me/assets/document-workflow.js?v=workflow3";workflowScript.defer=true;workflowScript.dataset.t2mDocumentWorkflow="1";document.head.appendChild(workflowScript);}
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
 header.innerHTML='<a class="portal-shell-skip" href="#main">Перейти к содержанию</a><div class="portal-shell-wrap portal-shell-top"><a class="portal-shell-brand" href="/text2me/" aria-label="text2me — главная"><span class="portal-shell-brand-text">text</span><span class="shell-brand-mark">2</span><span class="portal-shell-brand-text">me</span></a><form class="portal-shell-inline-search" role="search" action="/text2me/documents/" method="get"><label class="portal-shell-visually-hidden" for="portal-shell-inline-query">Название документа</label><input id="portal-shell-inline-query" name="q" type="search" autocomplete="off" placeholder="Например: исковое заявление" aria-label="Название документа"><button type="submit" aria-label="Найти документ">НАЙТИ <span aria-hidden="true">⌕</span></button></form><div class="portal-shell-actions"><a class="portal-shell-contact" href="/text2me/request/">Контакты</a><button type="button" class="portal-shell-search" aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K" aria-label="Открыть расширенный поиск">⌕</button></div></div><nav class="portal-shell-wrap portal-shell-nav" aria-label="Основная навигация"><a href="/text2me/people/">Жизненные ситуации</a><a href="/text2me/documents/?audience=citizens">Каталог документов</a><a href="/text2me/documents/library/">Библиотека шаблонов</a><a href="/text2me/space/">Рабочий стол</a><a href="/text2me/law/">Правовая база</a><a href="/text2me/calendar/">Сроки и календарь</a><a href="/text2me/request/">Спросите эксперта</a><a href="/text2me/experts/">Профильные эксперты</a><a href="/text2me/workflows/document-lifecycle/">Жизненный цикл документов</a><a href="/text2me/government/">Госорганы</a></nav>';
 oldHeader.replaceWith(header);
 /* Breadcrumb trail: make the user's current section and next step visible on every internal page. */
 var base="/text2me", clean=path.indexOf(base)===0?path.slice(base.length):path;
 var parts=clean.split("/").filter(Boolean);
 var labels={
 "people":"Жизненные ситуации","ip":"Кабинет ИП","business":"Организациям","lawyer":"Для юристов",
 "documents":"Каталог документов","library":"Библиотека шаблонов","pretenziya-prodavtsu":"Претензия продавцу","isk-v-sud":"Иск в суд","dogovor-arendy":"Договор аренды",
 "space":"Рабочий стол · дела и документы","calendar":"Сроки и календарь","start":"Помощь по сайту","request":"Спросите эксперта",
 "law":"Правовая база","calculators":"Расчёты","knowledge":"База знаний","document-standard":"Стандарт документа",
 "privacy":"Конфиденциальность","security":"Безопасность","terms":"Условия использования","updates":"Обновления",
 "standards":"Стандарты","news":"Новости","sources":"Источники","data-engine":"Справочники и данные",
 "situations":"Ситуации","zatoplenie-kvartiry":"Затопление квартиры","guides":"Инструкции","services":"Сервисы",
 "prompts":"Помощник","ai":"Проверка документа","dashboard":"Рабочая панель","catalog":"Каталог","drafts":"Черновики и история","organizer":"Органайзер","settings":"Настройки","tools":"Инструменты","workflows":"Сценарии","document-lifecycle":"Жизненный цикл документов"
 };
 var previousCrumb=document.querySelector(".room-breadcrumb,.t2m-breadcrumbs");if(previousCrumb)previousCrumb.remove();
 var crumbNav=document.createElement("nav");crumbNav.className="t2m-breadcrumbs portal-shell-wrap";crumbNav.setAttribute("aria-label","Ваше местоположение");
 var crumbList=document.createElement("ol");var homeLi=document.createElement("li");var homeA=document.createElement("a");homeA.href=base+"/";homeA.textContent="Главная";homeLi.appendChild(homeA);crumbList.appendChild(homeLi);
 var currentPath=base;
 parts.forEach(function(part,index){currentPath+="/"+part;var li=document.createElement("li");li.setAttribute("aria-current",index===parts.length-1?"page":"false");var text=labels[part]||decodeURIComponent(part).replace(/[-_]+/g," ").replace(/^./,function(s){return s.toUpperCase();});if(index<parts.length-1){var a=document.createElement("a");a.href=currentPath+"/";a.textContent=text;li.appendChild(a);}else{var span=document.createElement("span");span.textContent=text;li.appendChild(span);}crumbList.appendChild(li);});
 crumbNav.appendChild(crumbList);header.insertAdjacentElement("afterend",crumbNav);
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
if(!document.querySelector(".text2me-rail-trigger")){
var rails=[
{cls:"text2me-rail-left",id:"quick-start",title:"Быстрый старт",trigger:"Быстрый старт",intro:"Действия, а не виды документов",links:[["＋","Создать документ","/text2me/documents/"],["⌖","Описать ситуацию","/text2me/people/"],["✓","Проверить документ","/text2me/ai/"],["↗","Подготовить к отправке","/text2me/start/"],["§","Заявления в госорганы","/text2me/government/"]]},
{cls:"text2me-rail-right",id:"text2me-tools-panel",title:"Инструменты",trigger:"Инструменты",intro:"Справка и сопутствующие сервисы",links:[["?","Спросите эксперта","/text2me/request/"],["▤","Мои документы","/text2me/space/"],["§","Правовые источники","/text2me/law/"],["▦","Календарь и сроки","/text2me/calendar/"],["∑","Таблицы и расчёты","/text2me/calculators/"],["⌖","Адреса и учреждения","/text2me/data-engine/"],["↗","Новости России","https://government.ru/news/"],["i","Помощь по сайту","/text2me/start/"]]}
];
rails.forEach(function(d){
 var trigger=document.createElement("button");trigger.type="button";trigger.className="text2me-rail-trigger "+d.cls+"-trigger";trigger.textContent=d.trigger;trigger.setAttribute("aria-controls",d.id);trigger.setAttribute("aria-expanded","false");
 var panel=document.createElement("aside");panel.className="text2me-rail "+d.cls;panel.id=d.id;panel.hidden=true;panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.setAttribute("aria-label",d.title);
 var heading=document.createElement("div");heading.className="text2me-rail-heading";
 var h=document.createElement("h2");h.textContent=d.title;
 var close=document.createElement("button");close.type="button";close.className="text2me-rail-close";close.textContent="Закрыть";close.setAttribute("aria-label","Закрыть панель "+d.title);
 heading.append(h,close);
 var p=document.createElement("p");p.textContent=d.intro;panel.append(heading,p);
 d.links.forEach(function(x){var a=document.createElement("a");a.href=x[2];if(x[2].indexOf("http")===0){a.target="_blank";a.rel="noopener noreferrer";}var m=document.createElement("span");m.className="rail-mark";m.textContent=x[0];m.setAttribute("aria-hidden","true");var t=document.createElement("span");t.textContent=x[1];a.append(m,t);panel.appendChild(a);});
 function shut(){panel.hidden=true;trigger.setAttribute("aria-expanded","false");trigger.focus();}
 trigger.addEventListener("click",function(){document.querySelectorAll(".text2me-rail").forEach(function(other){other.hidden=true;});document.querySelectorAll(".text2me-rail-trigger").forEach(function(other){other.setAttribute("aria-expanded","false");});panel.hidden=false;trigger.setAttribute("aria-expanded","true");close.focus();});
 close.addEventListener("click",shut);
 document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!panel.hidden)shut();});
 document.body.append(trigger,panel);
});
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

/* Side-panel triggers are responsive; no duplicate mobile action strip. */
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
  if(target&&target.parentNode)target.parentNode.insertBefore(nav,target);else footer.appendChild(nav);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",addPartnerLinks);else addPartnerLinks();
})();

/* Persistent audience switcher: keep the three primary entry points above every page. */
(function(){
 "use strict";
 function addGlobalAudience(){
  var existingHome=document.querySelector(".reference-audience");
  if(existingHome){
   existingHome.classList.add("global-audience-switcher");
   existingHome.querySelectorAll("a.mockup-role-card").forEach(function(a){
    a.classList.add("global-audience-card");
    a.querySelectorAll(".reference-open").forEach(function(n){n.remove();});
   });
   return;
  }
  if(document.querySelector(".global-audience-switcher"))return;
  var header=document.querySelector(".portal-shell-header,.reference-header,.portal-header,.site-header,body > header");
  if(!header)return;
  var section=document.createElement("nav");
  section.className="global-audience-switcher";
  section.setAttribute("aria-label","Выберите рабочее пространство");
  var items=[
   {href:"/text2me/people/",icon:"♙",title:"Физическим лицам",desc:"Жизненные ситуации, жильё, семья, работа и личные документы"},
   {href:"/text2me/ip/",icon:"▦",title:"Индивидуальным предпринимателям",desc:"Договоры, акты, налоги и деловая переписка"},
   {href:"/text2me/business/",icon:"▤",title:"Юридическим лицам",desc:"Документы организации, претензии и корпоративные вопросы"}
  ];
  items.forEach(function(item){
   var a=document.createElement("a");a.className="global-audience-card";a.href=item.href;
   var icon=document.createElement("span");icon.className="global-audience-icon";icon.setAttribute("aria-hidden","true");icon.textContent=item.icon;
   var copy=document.createElement("span");copy.className="global-audience-copy";
   var title=document.createElement("strong");title.textContent=item.title;
   var desc=document.createElement("small");desc.textContent=item.desc;
   copy.append(title,desc);a.append(icon,copy);section.appendChild(a);
  });
  header.insertAdjacentElement("afterend",section);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",addGlobalAudience);else addGlobalAudience();
})();


/* Cross-service navigation: keep related owned services available on every page. */
(function(){
 "use strict";
 function addServiceNetwork(){
  if(document.querySelector(".text2me-service-network"))return;
  var header=document.querySelector(".portal-shell-header,.portal-header,.reference-header,.site-header,body > header");
  if(!header)return;
  var nav=document.createElement("nav");
  nav.className="text2me-service-network portal-shell-wrap";
  nav.setAttribute("aria-label","Сервисы экосистемы");
  var heading=document.createElement("div");
  heading.className="text2me-service-network-heading";
  heading.textContent="Сервисы экосистемы";
  nav.appendChild(heading);
  var items=[
   {href:"https://expert2me.ru/",name:"expert2me.ru",desc:"Профильная помощь специалистов по юридическим и деловым задачам",kind:"Экспертные услуги"},
   {href:"https://safe2me.ru/",name:"safe2me.ru",desc:"Страховые решения и помощь с выбором защиты",kind:"Страхование"}
  ];
  items.forEach(function(item){
   var a=document.createElement("a");
   a.className="text2me-service-card";
   a.href=item.href;
   a.setAttribute("aria-label",item.name+" — "+item.desc);
   if(item.href.indexOf("https://")===0){a.target="_blank";a.rel="noopener noreferrer";}
   var copy=document.createElement("span");copy.className="text2me-service-copy";
   var title=document.createElement("strong");title.textContent=item.name;
   var desc=document.createElement("span");desc.className="text2me-service-description";desc.textContent=item.desc;
   var kind=document.createElement("span");kind.className="text2me-service-kind";kind.textContent=item.kind;
   copy.append(title,desc,kind);a.appendChild(copy);nav.appendChild(a);
  });
  header.parentNode.insertBefore(nav,header);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",addServiceNetwork);else addServiceNetwork();
})();
