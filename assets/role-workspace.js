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
function setRole(r){if(!ROLES[r])return;safeWrite(ROLE_KEY,r);var currentUrl=new URL(window.location.href);if(currentUrl.searchParams.has("role")){currentUrl.searchParams.set("role",r);window.history.replaceState({}, "", currentUrl.pathname+currentUrl.search+currentUrl.hash)}document.documentElement.setAttribute("data-text2me-role",r);document.dispatchEvent(new CustomEvent("text2me:rolechange",{detail:{role:r}}));renderRoleState()}
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
function addTemplateWorkspace(r){
 var path=window.location.pathname.replace(/\/+$/,""),info=null;
 if(path.indexOf("/text2me/documents/pretenziya-prodavtsu")===0)info={id:"pretenziya-prodavtsu",title:"Претензия продавцу"};
 else if(path.indexOf("/text2me/documents/isk-v-sud")===0)info={id:"isk-v-sud",title:"Исковое заявление"};
 else if(path.indexOf("/text2me/documents/dogovor-arendy")===0)info={id:"dogovor-arendy",title:"Договор найма жилого помещения"};
 if(!info)return;
 var main=document.querySelector("main");if(!main||main.dataset.rwBlocked==="1")return;
 var old=main.querySelector(".rw-template-workspace");if(old)old.remove();
 var noteStore=safeRead("text2me.template-notes.v1",{}),checkStore=safeRead("text2me.template-checks.v1",{}),checkKey=info.id+":"+r;
 var checks=r==="organization"?["Реквизиты организации и подписанта сверены","Основание полномочий подтверждено","НДС и цена проверены, если применимо","Корпоративные согласования проверены","Факты и доказательства сверены","Приложения и порядок направления проверены"]:r==="ip"?["Статус ИП и реквизиты сторон сверены","Договор, даты и суммы проверены","Факты и доказательства подтверждены","Правовое основание и срок проверены","Приложения и порядок направления проверены"]:["ФИО и реквизиты сторон сверены","Факты, даты и суммы проверены","Требования и правовое основание проверены","Приложения, адресат и способ направления проверены"];
 var panel=el("section",{class:"rw-template-workspace","aria-labelledby":"rw-template-title"});panel.dataset.checkKey=checkKey;panel.dataset.checkCount=String(checks.length);
 var heading=el("h2",{id:"rw-template-title"},"Проверка документа: "+info.title),intro=el("p",{},"Контрольный список перед скачиванием или отправкой. Отметьте каждый пункт после проверки по исходным материалам и актуальным правилам.");
 panel.append(heading,intro);
 var checklist=el("div",{class:"rw-template-checklist"}),saved=checkStore[checkKey]||{};
 checks.forEach(function(label,i){var row=el("label",{class:"rw-check-row"}),cb=el("input",{type:"checkbox"});cb.checked=!!saved[i];cb.addEventListener("change",function(){var latest=safeRead("text2me.template-checks.v1",{});if(!latest||typeof latest!=="object")latest={};if(!latest[checkKey])latest[checkKey]={};latest[checkKey][i]=cb.checked;safeWrite("text2me.template-checks.v1",latest);status.textContent=checks.every(function(_,n){return !!latest[checkKey][n]})?"Все пункты отмечены. Проверьте документ по существу перед использованием.":"Проверено пунктов: "+checks.filter(function(_,n){return !!latest[checkKey][n]}).length+" из "+checks.length+".";});row.append(cb,el("span",{},label));checklist.append(row)});
 panel.append(checklist);
 var nextTitle=el("h3",{},"Что делать дальше");panel.append(nextTitle);var nextText=r==="citizen"?"Проверьте адресата и применимый срок. Подготовьте копии приложений. При личной подаче сохраните экземпляр с отметкой о принятии; при отправке почтой сохраните квитанцию и опись. Срок ответа зависит от вида требования — не используйте универсальный срок без проверки.":r==="ip"?"Сверьте договорный претензионный порядок и срок. Направьте документ по адресу и способом, предусмотренными договором, сохраните подтверждение доставки. Перед обращением в суд проверьте подсудность и расчёт требований.":"Проверьте полномочия подписанта и внутреннее согласование. Присвойте исходящий номер, направьте документ по согласованному каналу и сохраните доказательства отправки и доставки.";panel.append(el("p",{class:"rw-next-steps"},nextText));
 var legalBasis=info.id==="pretenziya-prodavtsu"?"Правовая основа: Закон РФ «О защите прав потребителей»; конкретные статьи зависят от требования и обстоятельств.":info.id==="isk-v-sud"?"Правовая основа: нормы процессуального законодательства и материального закона по спору; проверьте подсудность и актуальную редакцию норм.":"Правовая основа: нормы ГК РФ о найме жилого помещения и применимые положения договора; проверьте, какой тип отношений оформляется.";panel.append(el("p",{class:"rw-template-legal-basis"},legalBasis));
 var status=el("p",{class:"rw-check-status","aria-live":"polite"});status.textContent=checks.every(function(_,i){return !!saved[i]})?"Все пункты отмечены.":"Проверено пунктов: "+checks.filter(function(_,i){return !!saved[i]}).length+" из "+checks.length+".";panel.append(status);
 var noteLabel=el("label",{class:"rw-template-note-label"},"Мои заметки к шаблону"),note=el("textarea",{class:"rw-template-note",rows:"4",placeholder:"Запишите вопросы, недостающие сведения или замечания к этому документу."});note.value=String(noteStore[info.id]||"");note.addEventListener("input",function(){var all=safeRead("text2me.template-notes.v1",{});if(!all||typeof all!=="object")all={};all[info.id]=note.value;safeWrite("text2me.template-notes.v1",all)});noteLabel.append(note);panel.append(noteLabel);
 var h1=main.querySelector("h1"),roleIndicator=main.querySelector(".rw-page-role");if(roleIndicator)roleIndicator.insertAdjacentElement("afterend",panel);else if(h1&&h1.parentElement)h1.parentElement.insertAdjacentElement("afterend",panel);else main.insertBefore(panel,main.firstChild);
 if(!main.dataset.rwDownloadGuard){main.dataset.rwDownloadGuard="1";main.addEventListener("click",function(e){var target=e.target.closest("a,button,input[type=button],input[type=submit]");if(!target)return;var label=((target.innerText||target.value||target.getAttribute("aria-label")||"")+"").toLowerCase();if(!/(скачать|download|docx|pdf|экспортировать документ)/i.test(label))return;var active=main.querySelector(".rw-template-workspace");if(!active)return;var all=safeRead("text2me.template-checks.v1",{}),marks=all[active.dataset.checkKey]||{},count=Number(active.dataset.checkCount||0),complete=true;for(var i=0;i<count;i++){if(!marks[i])complete=false}if(!complete){e.preventDefault();e.stopImmediatePropagation();alert("Скачивание приостановлено: сначала проверьте все обязательные пункты контрольного списка.");}},true);}
}
function filterRoleBlocks(r){
 document.querySelectorAll("[data-visible-roles]").forEach(function(node){if(node.dataset.rwOriginalHidden===undefined)node.dataset.rwOriginalHidden=node.hidden?"1":"0";var allowed=(node.getAttribute("data-visible-roles")||"").toLowerCase().split(/[\\s,]+/);var roleAllowed=allowed.indexOf(r)>=0;node.hidden=node.dataset.rwOriginalHidden==="1"||!roleAllowed});
}
function renderRoleState(){
 var r=role();if(!r)return;
 var data=ROLES[r];document.documentElement.setAttribute("data-text2me-role",r);enforcePageRole(r);
 var select=document.getElementById("rw-role");if(select)select.value=r||"";
 var ind=document.querySelector(".rw-role-indicator");if(ind)ind.textContent="Вы работаете как: "+data.label;
 document.querySelectorAll(".rw-page-role").forEach(function(p){var b=p.querySelector(".rw-role-badge"),d=p.querySelector(".rw-role-description");if(b){b.textContent="Вы работаете как: "+data.label;b.dataset.role=r}if(d)d.textContent=data.description});
 renderHome(r);filterCatalog(r);filterRoleBlocks(r);adaptFields(r);addTemplateWorkspace(r);
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
 var cards=Array.from(grid.querySelectorAll("a[data-audience],a[data-role]"));
 cards.forEach(function(card){
  var hasExplicit=!!card.getAttribute("data-role"),aud=(card.getAttribute(hasExplicit?"data-role":"data-audience")||"").toLowerCase().split(/[\s,]+/),allowed=false;
  if(hasExplicit){if(r==="citizen")allowed=aud.indexOf("citizen")>=0;if(r==="ip")allowed=aud.indexOf("citizen")>=0||aud.indexOf("ip")>=0;if(r==="organization")allowed=aud.indexOf("organization")>=0||aud.indexOf("org")>=0}
  else{if(r==="citizen")allowed=aud.indexOf("citizens")>=0||aud.indexOf("citizen")>=0;if(r==="ip")allowed=aud.indexOf("citizens")>=0||aud.indexOf("business")>=0||aud.indexOf("ip")>=0;if(r==="organization")allowed=aud.indexOf("business")>=0||aud.indexOf("organization")>=0||aud.indexOf("org")>=0}
  card.dataset.roleAllowed=allowed?"true":"false";card.hidden=!allowed;
  var badges=card.querySelector(".rw-card-roles");if(!badges){badges=el("span",{class:"rw-card-roles"});var status=card.querySelector(".status-badge");if(status)status.insertAdjacentElement("beforebegin",badges);else card.append(badges)}badges.innerHTML="";var roleLabels=[];if(hasExplicit){if(aud.indexOf("citizen")>=0){roleLabels.push("Гражданин");roleLabels.push("ИП")}if(aud.indexOf("ip")>=0)roleLabels.push("ИП");if(aud.indexOf("organization")>=0||aud.indexOf("org")>=0)roleLabels.push("Организация")}else{if(aud.indexOf("citizens")>=0||aud.indexOf("citizen")>=0){roleLabels.push("Гражданин");roleLabels.push("ИП")}if(aud.indexOf("business")>=0){roleLabels.push("ИП");roleLabels.push("Организация")}}Array.from(new Set(roleLabels)).forEach(function(label){var key=label==="Гражданин"?"citizen":label==="ИП"?"ip":"organization";badges.append(el("span",{class:"rw-card-role","data-role":key},label))});
 });
 var audienceFilter=document.getElementById("full-filter-audience");
 ["full-catalog-search","full-filter-category","full-filter-situation","full-filter-nature","full-filter-audience"].forEach(function(id){var n=document.getElementById(id);if(n&&!n.dataset.rwCountListener){n.dataset.rwCountListener="1";n.addEventListener("input",updateCount);n.addEventListener("change",updateCount)}});
 function updateCount(){var visible=cards.filter(function(c){return !c.hidden&&c.dataset.roleAllowed==="true"}).length;var countNode=document.getElementById("full-catalog-count");if(countNode)countNode.textContent="Документов и направлений для роли «"+ROLES[role()].label+"»: "+visible+".";var emptyNode=document.getElementById("full-catalog-empty");if(emptyNode)emptyNode.hidden=visible>0}
 var count=document.getElementById("full-catalog-count");if(count){var n=cards.filter(function(c){return !c.hidden}).length;count.textContent="Документов и направлений для роли «"+ROLES[r].label+"»: "+n+"."}
 var empty=document.getElementById("full-catalog-empty");if(empty)empty.hidden=cards.some(function(c){return !c.hidden});
 var categoryFilter=document.getElementById("full-filter-category");if(categoryFilter)categoryFilter.dispatchEvent(new Event("change",{bubbles:true}));
}
function adaptFields(r){
 var path=window.location.pathname.replace(/\/+$/,"");if(!(path.indexOf("/text2me/documents/pretenziya-prodavtsu")===0||path.indexOf("/text2me/documents/isk-v-sud")===0||path.indexOf("/text2me/documents/dogovor-arendy")===0||path==="/text2me/business"))return;
 var form=Array.from(document.querySelectorAll("main form")).find(function(f){return f.id!=="complex-request-form"&&f.querySelector("input,textarea,select")});if(!form)return;
 var roleHints={citizen:"Укажите ФИО сторон и факты простыми словами. Не заполняйте реквизиты организации, если вы обращаетесь как частное лицо.",ip:"Укажите статус ИП, ОГРНИП и реквизиты контрагента. Печать указывается только если она фактически используется.",organization:"Укажите полное наименование, ОГРН, адрес организации и основание полномочий подписанта."};
 var hint=form.querySelector(".rw-form-role-hint");if(!hint&&form.querySelector("input,textarea,select")){hint=el("p",{class:"rw-form-role-hint"});form.insertBefore(hint,form.firstChild)}if(hint)hint.textContent=roleHints[r];
 form.querySelectorAll("label").forEach(function(label){var t=(label.innerText||label.textContent||"").toLowerCase(),field=label.querySelector("input,select,textarea"),wrap=label.closest(".form-field, .form-group, .field, .request-field, .form-row")||label;
  if(!field&&label.htmlFor)field=document.getElementById(label.htmlFor);if(!field)return;
  if(wrap.dataset.rwOriginalHidden===undefined)wrap.dataset.rwOriginalHidden=wrap.hidden?"1":"0";
  if(field.dataset.rwOriginalRequired===undefined)field.dataset.rwOriginalRequired=field.required?"1":"0";
  wrap.hidden=wrap.dataset.rwOriginalHidden==="1";field.required=field.dataset.rwOriginalRequired==="1";
  if(/основание полномочий/i.test(t)){wrap.hidden=r!=="organization";field.required=r==="organization";return}
  if(/ндс/i.test(t)){wrap.hidden=r==="citizen";if(r==="citizen")field.required=false}
  if(r==="citizen"&&/(огрн организации|огрнип|генеральн.*директор|контрагент.*огрн|реквизиты юридического лица)/i.test(t)){wrap.hidden=true;field.required=false}
  if(r==="ip"&&/печать/i.test(t))wrap.hidden=false;
 });
}
function enforcePageRole(r){
 var path=window.location.pathname.replace(/\/+$/,""),allowed=null;
 if(path.indexOf("/text2me/documents/pretenziya-prodavtsu")===0||path.indexOf("/text2me/documents/isk-v-sud")===0||path.indexOf("/text2me/documents/dogovor-arendy")===0)allowed=["citizen","ip"];
 else if(path==="/text2me/people")allowed=["citizen","ip"];
 else if(path==="/text2me/business")allowed=["ip","organization"];
 var main=document.querySelector("main");if(!main)return;
 if(!allowed||allowed.indexOf(r)>=0){
  if(main.dataset.rwBlocked==="1"&&main.__rwOriginalNodes){main.replaceChildren.apply(main,main.__rwOriginalNodes);delete main.__rwOriginalNodes;delete main.dataset.rwBlocked}
  return;
 }
 if(main.dataset.rwBlocked==="1")return;
 main.__rwOriginalNodes=Array.from(main.childNodes);main.dataset.rwBlocked="1";
 main.innerHTML='<section class="rw-access-denied"><h1>Документ недоступен в выбранном режиме</h1><p>Этот раздел предназначен для другой роли. Переключите режим работы в шапке, чтобы открыть подходящие материалы.</p><button type="button" class="rw-access-change">Сменить режим</button><a href="/text2me/documents/">Вернуться в каталог</a></section>';
 main.querySelector(".rw-access-change").addEventListener("click",function(){var s=document.getElementById("rw-role");if(s)s.focus()});
}
function patchDraftRole(){
 if(window.__text2meDraftRolePatched)return;window.__text2meDraftRolePatched=true;
 var baseline=safeRead("text2me.draft-roles.v1",{});if(!baseline||typeof baseline!=="object")baseline={};
 ["text2me.drafts.v1","text2me.space.v1"].forEach(function(k){var old=safeRead(k,{});if(Array.isArray(old)){old.forEach(function(d,i){var id=String(d&&d.id||i);if(!baseline[id])baseline[id]="legacy"})}else if(old&&typeof old==="object"){Object.keys(old).forEach(function(id){var d=old[id]||{};var key=String(d.id||id);if(!baseline[key])baseline[key]="legacy"})}});
 var original=Storage.prototype.setItem;
 Storage.prototype.setItem=function(key,value){
  if((key==="text2me.drafts.v1"||key==="text2me.space.v1")&&role()){
   try{var parsed=JSON.parse(value),items=Array.isArray(parsed)?parsed:(parsed&&typeof parsed==="object"?parsed:null);
    if(items){Object.keys(items).forEach(function(k){var d=items[k];if(!d||typeof d!=="object")return;var id=String(d.id||d._draftKey||k);if(!baseline[id]&& !d.role){baseline[id]=role()}if(!d.role&&ROLES[baseline[id]])d.role=baseline[id]});value=JSON.stringify(parsed);safeWrite(ROLE_MAP_KEY,baseline)}
   }catch(e){}
  }
  return original.call(this,key,value);
 };
}
function footer(){
 var f=document.querySelector("body > footer");if(!f){f=el("footer",{class:"rw-shared-footer"});document.body.append(f)}f.classList.add("rw-shared-footer");
 if(!f.querySelector(".rw-footer-note")){var n=el("p",{class:"rw-footer-note"});n.textContent="Черновики и настройки хранятся локально в этом браузере. Облачная синхронизация не подключена. Дата правовой проверки указывается в карточке документа; если её нет, проверьте актуальность перед использованием.";f.append(n)}
 if(!f.querySelector(".rw-footer-links")){var nav=el("nav",{class:"rw-footer-links","aria-label":"Навигация по рабочему пространству"});[["Каталог","/text2me/documents/"],["Черновики","/text2me/drafts/"],["Калькуляторы","/text2me/calculators/"],["Источники","/text2me/sources/"],["Настройки","/text2me/settings/"]].forEach(function(x){nav.append(el("a",{href:x[1]},x[0]))});f.append(nav)}
}
function init(){
 addStyle();var h=header();var params=new URLSearchParams(window.location.search),requestedRole=params.get("role");if(ROLES[requestedRole])safeWrite(ROLE_KEY,requestedRole);var r=role();
 rolePanel();renderRoleState();patchDraftRole();footer();
 if(!r)chooser();
 document.addEventListener("text2me:rolechange",function(){renderRoleState()});
 window.addEventListener("storage",function(e){if(e.key===ROLE_KEY)renderRoleState()});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();