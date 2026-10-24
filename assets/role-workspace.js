(function(){
"use strict";
var ROLE_KEY="text2me.role.v1",ROLE_MAP_KEY="text2me.draft-roles.v1";
var ROLES={
 citizen:{label:"Гражданин",short:"Гражданин",color:"citizen",description:"Личные, семейные, жилищные, трудовые вопросы и защита прав.",common:["Претензия продавцу","Иск о защите прав потребителя","Жалоба в Роспотребнадзор","Заявление в управляющую компанию","Жалоба в трудовую инспекцию"],links:["/text2me/documents/pretenziya-prodavtsu/","/text2me/documents/isk-v-sud/","/text2me/people/","/text2me/people/","/text2me/people/"]},
 ip:{label:"Индивидуальный предприниматель",short:"ИП",color:"ip",description:"Документы ИП и общие документы гражданина для личных задач.",common:["Договор поставки","Претензия контрагенту","Договор оказания услуг","Уведомление по налогам","Акт сверки"],links:["/text2me/business/","/text2me/business/","/text2me/business/","/text2me/sources/","/text2me/business/"]},
 organization:{label:"Организация",short:"Организация",color:"organization",description:"Договоры, корпоративные решения, кадровые и претензионно-исковые документы.",common:["Договор поставки","Претензия по договору","Решение единственного участника","Трудовой договор","Акт приёма-передачи"],links:["/text2me/business/","/text2me/business/","/text2me/business/","/text2me/business/","/text2me/business/"]}
};
function safeRead(key,fallback){try{var x=localStorage.getItem(key);return x?JSON.parse(x):fallback}catch(e){return fallback}}
function safeWrite(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch(e){return false}}
function role(){var r=safeRead(ROLE_KEY,"");return ROLES[r]?r:""}
function setRole(r){if(!ROLES[r])return;safeWrite(ROLE_KEY,r);document.documentElement.setAttribute("data-text2me-role",r);document.dispatchEvent(new CustomEvent("text2me:rolechange",{detail:{role:r}}));renderRoleState()}
function el(tag,attrs,text){var n=document.createElement(tag);Object.keys(attrs||{}).forEach(function(k){if(k==="class")n.className=attrs[k];else n.setAttribute(k,attrs[k])});if(text!==undefined)n.textContent=text;return n}
function addStyle(){if(document.getElementById("text2me-role-style"))return;var l=document.createElement("link");l.id="text2me-role-style";l.rel="stylesheet";l.href="/text2me/assets/role-workspace.css?v=roles1";document.head.appendChild(l)}
function header(){
 var existing=document.querySelector("body > header");
 if(existing&&existing.classList.contains("role-workspace-header"))return existing;
 var h=el("header",{class:"role-workspace-header"});
 h.innerHTML='<div class="rw-top"><a class="rw-brand" href="/text2me/">text2me</a><div class="rw-role-control"><label for="rw-role">Режим работы</label><select id="rw-role"><option value="" disabled>Выберите роль</option><option value="citizen">Гражданин</option><option value="ip">ИП</option><option value="organization">Организация</option></select></div><button class="rw-search-button" type="button">Поиск</button></div><nav class="rw-nav" aria-label="Основная навигация"><a href="/text2me/documents/">Каталог</a><a href="/text2me/drafts/">Черновики</a><a href="/text2me/calculators/">Калькуляторы</a><a href="/text2me/sources/">Источники</a><a href="/text2me/settings/">Настройки</a></nav><div class="rw-role-indicator" aria-live="polite"></div>';
 if(existing)existing.replaceWith(h);else document.body.insertBefore(h,document.body.firstChild);var oldServiceNav=document.querySelector(".portal-service-nav");if(oldServiceNav)oldServiceNav.remove();
 var select=h.querySelector("#rw-role");select.addEventListener("change",function(){setRole(select.value)});
 h.querySelector(".rw-search-button").addEventListener("click",function(){var q=prompt("Название документа или ситуация");if(q&&q.trim())window.location.href="/text2me/documents/?q="+encodeURIComponent(q.trim())});
 var current=window.location.pathname.replace(/\/+$/,"");h.querySelectorAll(".rw-nav a").forEach(function(a){var u=new URL(a.href,location.href).pathname.replace(/\/+$/,"");if(u===current)a.setAttribute("aria-current","page")});
 return h;
}
function chooser(){
 if(role())return;
 var overlay=el("div",{class:"rw-role-overlay"}),dialog=el("section",{class:"rw-role-dialog",role:"dialog","aria-modal":"true","aria-labelledby":"rw-choice-title"});
 dialog.innerHTML='<p class="rw-eyebrow">Первичная настройка</p><h2 id="rw-choice-title">В каком качестве вы готовите документы?</h2><p>Выбор изменит доступные категории и подсказки. Его можно поменять в шапке в любой момент.</p><div class="rw-role-options"><button type="button" data-pick="citizen"><strong>Гражданин</strong><span>Личные и бытовые ситуации</span></button><button type="button" data-pick="ip"><strong>ИП</strong><span>Личные и предпринимательские документы</span></button><button type="button" data-pick="organization"><strong>Организация</strong><span>Договоры и документы юридического лица</span></button></div>';
 overlay.append(dialog);document.body.append(overlay);
 dialog.querySelectorAll("[data-pick]").forEach(function(b){b.addEventListener("click",function(){setRole(b.dataset.pick);overlay.remove()})});
}
function rolePanel(){
 var main=document.querySelector("main");if(!main)return;
 if(!main.querySelector(".rw-page-role")){
  var p=el("div",{class:"rw-page-role"});
  p.innerHTML='<span class="rw-role-badge"></span><span class="rw-role-description"></span><button type="button" class="rw-change-role">Сменить режим</button>';
  var first=main.querySelector("h1");if(first&&first.parentElement){first.parentElement.insertBefore(p,first.nextSibling)}else main.insertBefore(p,main.firstChild);
  p.querySelector(".rw-change-role").addEventListener("click",function(){var s=document.getElementById("rw-role");if(s)s.focus()});
 }
}
function renderRoleState(){
 var r=role();if(!r)return;
 var data=ROLES[r];document.documentElement.setAttribute("data-text2me-role",r);
 var select=document.getElementById("rw-role");if(select)select.value=r||"";
 var ind=document.querySelector(".rw-role-indicator");if(ind)ind.textContent="Вы работаете как: "+data.label;
 document.querySelectorAll(".rw-page-role").forEach(function(p){var b=p.querySelector(".rw-role-badge"),d=p.querySelector(".rw-role-description");if(b){b.textContent="Вы работаете как: "+data.label;b.dataset.role=r}if(d)d.textContent=data.description});
 renderHome(r);filterCatalog(r);adaptFields(r);
}
function renderHome(r){
 var main=document.querySelector("main");if(!main)return;
 var host=document.getElementById("rw-frequent-documents");
 if(!host){host=el("section",{id:"rw-frequent-documents",class:"rw-frequent-documents","aria-labelledby":"rw-frequent-title"});var first=main.querySelector("section");if(first)first.insertAdjacentElement("afterend",host);else main.insertBefore(host,main.firstChild)}
 var data=ROLES[r];host.innerHTML='<div class="rw-section-heading"><div><p class="rw-eyebrow">Быстрый доступ</p><h2 id="rw-frequent-title">Частые документы · '+data.label+'</h2></div><a href="/text2me/documents/">Весь каталог →</a></div><div class="rw-frequent-grid"></div><div class="rw-recent"><h3>Последние черновики</h3><div class="rw-recent-list"></div></div>';
 var grid=host.querySelector(".rw-frequent-grid");data.common.forEach(function(name,i){var a=el("a",{href:data.links[i]||"/text2me/documents/",class:"rw-frequent-card"});a.append(el("strong",{},name),el("span",{},"Открыть направление →"));grid.append(a)});
 var list=host.querySelector(".rw-recent-list"),drafts=safeRead("text2me.drafts.v1",{}),items=[];
 if(Array.isArray(drafts))items=drafts;else if(drafts&&typeof drafts==="object")items=Object.keys(drafts).map(function(k){var d=drafts[k]||{};d._draftKey=k;return d});
 items=items.filter(function(d){return d&&(!d.role||d.role===r)}).slice(-4).reverse();
 if(!items.length)list.append(el("p",{},"Сохранённых черновиков пока нет."));
 else items.forEach(function(d){var a=el("a",{href:"/text2me/drafts/",class:"rw-recent-item"});a.textContent=d.title||d.name||d.documentTitle||d.type||"Черновик документа";list.append(a)});
}
function filterCatalog(r){
 var grid=document.getElementById("full-doc-catalog");if(!grid)return;
 var select=document.getElementById("full-filter-audience");
 if(select){select.innerHTML='<option value="">Все документы вашей роли</option>';select.value=""}
 var cards=Array.from(grid.querySelectorAll("a[data-audience]"));
 cards.forEach(function(card){
  var aud=(card.getAttribute("data-audience")||"").toLowerCase().split(/[\s,]+/),allowed=false;
  if(r==="citizen")allowed=aud.indexOf("citizens")>=0||aud.indexOf("citizen")>=0;
  if(r==="ip")allowed=aud.indexOf("citizens")>=0||aud.indexOf("business")>=0||aud.indexOf("ip")>=0;
  if(r==="organization")allowed=aud.indexOf("business")>=0||aud.indexOf("organization")>=0||aud.indexOf("org")>=0;
  card.dataset.roleAllowed=allowed?"true":"false";card.hidden=!allowed;
  var badges=card.querySelector(".rw-card-roles");if(!badges){badges=el("span",{class:"rw-card-roles"});var status=card.querySelector(".status-badge");if(status)status.insertAdjacentElement("beforebegin",badges);else card.append(badges)}badges.innerHTML="";var roleLabels=[];if(aud.indexOf("citizens")>=0||aud.indexOf("citizen")>=0){roleLabels.push("Гражданин");roleLabels.push("ИП")}if(aud.indexOf("business")>=0){roleLabels.push("ИП");roleLabels.push("Организация")}if(aud.indexOf("organization")>=0||aud.indexOf("org")>=0)roleLabels.push("Организация");Array.from(new Set(roleLabels)).forEach(function(label){badges.append(el("span",{class:"rw-card-role"},label))});
 });
 var audienceFilter=document.getElementById("full-filter-audience");
 ["full-catalog-search","full-filter-category","full-filter-situation","full-filter-nature","full-filter-audience"].forEach(function(id){var n=document.getElementById(id);if(n&&!n.dataset.rwCountListener){n.dataset.rwCountListener="1";n.addEventListener("input",updateCount);n.addEventListener("change",updateCount)}});
 function updateCount(){var visible=cards.filter(function(c){return !c.hidden&&c.dataset.roleAllowed==="true"}).length;var countNode=document.getElementById("full-catalog-count");if(countNode)countNode.textContent="Документов и направлений для роли «"+ROLES[role()].label+"»: "+visible+".";var emptyNode=document.getElementById("full-catalog-empty");if(emptyNode)emptyNode.hidden=visible>0}
 var count=document.getElementById("full-catalog-count");if(count){var n=cards.filter(function(c){return !c.hidden}).length;count.textContent="Документов и направлений для роли «"+ROLES[r].label+"»: "+n+"."}
 var empty=document.getElementById("full-catalog-empty");if(empty)empty.hidden=cards.some(function(c){return !c.hidden});
}
function adaptFields(r){
 var form=document.querySelector("form");if(!form)return;
 var roleHints={citizen:"Укажите ФИО сторон и факты простыми словами. Не заполняйте реквизиты организации, если вы обращаетесь как частное лицо.",ip:"Укажите статус ИП, ОГРНИП и реквизиты контрагента. Печать указывается только если она фактически используется.",organization:"Укажите полное наименование, ОГРН, адрес организации и основание полномочий подписанта."};
 if(!form.querySelector(".rw-form-role-hint")&&form.querySelector("input,textarea,select")){var hint=el("p",{class:"rw-form-role-hint"});hint.textContent=roleHints[r];form.insertBefore(hint,form.firstChild)}
 form.querySelectorAll("label").forEach(function(label){var t=(label.innerText||label.textContent||"").toLowerCase(),field=label.querySelector("input,select,textarea"),wrap=label;
  if(!field&&label.htmlFor)field=document.getElementById(label.htmlFor);
  if(!field)return;
  if(r==="citizen"&&/(ндс|огрн организации|огрнип|основание полномочий|генеральн.*директор)/i.test(t)){wrap.hidden=true;field.required=false}
  if(r!=="organization"&&/основание полномочий/i.test(t)){wrap.hidden=true;field.required=false}
  if(r==="citizen"&&/(контрагент.*огрн|реквизиты юридического лица)/i.test(t)){wrap.hidden=true;field.required=false}
 });
}
function patchDraftRole(){
 if(window.__text2meDraftRolePatched)return;window.__text2meDraftRolePatched=true;
 var baseline=safeRead("text2me.draft-roles.v1",{});if(!baseline||typeof baseline!=="object")baseline={};
 var original=Storage.prototype.setItem;
 Storage.prototype.setItem=function(key,value){
  if((key==="text2me.drafts.v1"||key==="text2me.space.v1")&&role()){
   try{var parsed=JSON.parse(value),items=Array.isArray(parsed)?parsed:(parsed&&typeof parsed==="object"?parsed:null);
    if(items){Object.keys(items).forEach(function(k){var d=items[k];if(!d||typeof d!=="object")return;var id=String(d.id||d._draftKey||k);if(!baseline[id]&& !d.role){baseline[id]=role()}if(!d.role&&baseline[id])d.role=baseline[id]});value=JSON.stringify(parsed);safeWrite(ROLE_MAP_KEY,baseline)}
   }catch(e){}
  }
  return original.call(this,key,value);
 };
}
function footer(){
 var f=document.querySelector("body > footer");if(!f)return;
 if(!f.querySelector(".rw-footer-note")){var n=el("p",{class:"rw-footer-note"});n.textContent="Черновики и настройки хранятся локально в этом браузере. Они не синхронизируются между устройствами.";f.append(n)}
}
function init(){
 addStyle();var h=header();var r=role();
 renderRoleState();rolePanel();patchDraftRole();footer();
 if(!r)chooser();
 document.addEventListener("text2me:rolechange",function(){renderRoleState()});
 window.addEventListener("storage",function(e){if(e.key===ROLE_KEY)renderRoleState()});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();