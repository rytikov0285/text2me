(function(){
"use strict";
function initPortalShell(){
 var path=window.location.pathname.replace(/\/+$/,"")||"/text2me";
 var isHome=path==="/text2me"||path==="/";
 var audience=path==="/text2me/people"?"citizens":path==="/text2me/business"?"business":"";
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
 header.innerHTML='<a class="portal-shell-skip" href="#main">Перейти к содержанию</a><div class="portal-shell-wrap portal-shell-top"><a class="portal-shell-brand" href="/text2me/" aria-label="text2me — главная">text2<span class="shell-brand-mark">me</span></a><nav class="portal-shell-audience" aria-label="Выбор аудитории"><a href="/text2me/people/" data-audience="citizens">Гражданам</a><a href="/text2me/business/" data-audience="business">Организациям и ИП</a></nav><div class="portal-shell-actions"><button type="button" class="portal-shell-search" aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K">⌕ Поиск</button><a class="portal-shell-space" href="/text2me/space/">Моё пространство</a></div></div><nav class="portal-shell-wrap portal-shell-nav" aria-label="Основная навигация"><a href="/text2me/#popular">Направления</a><a href="/text2me/documents/?audience=citizens">Документы граждан</a><a href="/text2me/#business-services">Для бизнеса</a><a href="/text2me/#useful-services">Полезные сервисы</a><a href="/text2me/law/">Правовая база</a><a href="/text2me/knowledge/">База знаний</a><a href="/text2me/start/">Помощь</a></nav>';
 oldHeader.replaceWith(header);
 header.querySelectorAll("[data-audience]").forEach(function(a){if(a.getAttribute("data-audience")===audience)a.setAttribute("aria-current","page");});
 var navLinks=header.querySelectorAll(".portal-shell-nav a");
 navLinks.forEach(function(a){var u=new URL(a.href,window.location.href);if(u.pathname===window.location.pathname&&u.hash===window.location.hash)a.setAttribute("aria-current","page");});
 var dialog=document.createElement("div");dialog.className="portal-shell-dialog";dialog.hidden=true;
 var panel=document.createElement("section");panel.className="portal-shell-panel";panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.setAttribute("aria-labelledby","portal-shell-search-title");
 var close=document.createElement("button");close.type="button";close.className="portal-shell-close";close.textContent="Закрыть";close.setAttribute("aria-label","Закрыть поиск");
 var title=document.createElement("h2");title.id="portal-shell-search-title";title.textContent="Поиск по документам и сервисам";
 var form=document.createElement("form");form.className="portal-shell-form";form.action="/text2me/documents/";form.method="get";
 var label=document.createElement("label");label.htmlFor="portal-shell-query";label.textContent="Введите название документа, тему или задачу";
 var input=document.createElement("input");input.id="portal-shell-query";input.name="q";input.type="search";input.placeholder="Например: претензия, договор, налоги";input.autocomplete="off";
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