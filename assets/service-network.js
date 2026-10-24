/* Shared service network banner for pages that do not load the full portal shell. */
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
  [
   {href:"/text2me/",name:"text2me",desc:"Подготовка документов, шаблоны и контроль следующих действий",kind:"Документы и процессы"},
   {href:"https://expert2me.ru/",name:"expert2me.ru",desc:"Профильная помощь специалистов по юридическим и деловым задачам",kind:"Экспертные услуги"},
   {href:"https://safe2me.ru/",name:"safe2me.ru",desc:"Страховые решения и помощь с выбором защиты",kind:"Страхование"}
  ].forEach(function(item){
   var a=document.createElement("a");
   a.className="text2me-service-card";a.href=item.href;
   a.setAttribute("aria-label",item.name+" — "+item.desc);
   if(item.href.indexOf("https://")===0){a.target="_blank";a.rel="noopener noreferrer";}
   var copy=document.createElement("span");copy.className="text2me-service-copy";
   var title=document.createElement("strong");title.textContent=item.name;
   var desc=document.createElement("span");desc.className="text2me-service-description";desc.textContent=item.desc;
   var kind=document.createElement("span");kind.className="text2me-service-kind";kind.textContent=item.kind;
   copy.append(title,desc,kind);a.appendChild(copy);nav.appendChild(a);
  });
  header.insertAdjacentElement("afterend",nav);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",addServiceNetwork);else addServiceNetwork();
})();
