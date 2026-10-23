(function(){
"use strict";
var STORE="text2me.space.v1",DRAFTS="text2me.drafts.v1",FEEDBACK="text2me.feedback.v1";
function read(key,fallback){try{var v=localStorage.getItem(key);return v?JSON.parse(v):fallback}catch(e){return fallback}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch(e){return false}}
function el(tag,attrs,text){var n=document.createElement(tag);Object.keys(attrs||{}).forEach(function(k){if(k==="class")n.className=attrs[k];else n.setAttribute(k,attrs[k])});if(text!==undefined)n.textContent=text;return n}
function button(label,cls,fn){var b=el("button",{type:"button",class:cls||"button button-outline"},label);b.addEventListener("click",fn);return b}
function openFileVault(){return new Promise(function(resolve,reject){if(!window.indexedDB){reject(new Error("В этом браузере недоступно локальное хранилище файлов."));return}var req=indexedDB.open("text2me-file-vault",1);req.onupgradeneeded=function(){var db=req.result;if(!db.objectStoreNames.contains("files"))db.createObjectStore("files",{keyPath:"id"})};req.onsuccess=function(){resolve(req.result)};req.onerror=function(){reject(req.error||new Error("Не удалось открыть хранилище файлов."))}})}
function saveUploadedFile(file){return openFileVault().then(function(db){return new Promise(function(resolve,reject){var tx=db.transaction("files","readwrite"),store=tx.objectStore("files"),id="f"+Date.now().toString(36)+Math.random().toString(36).slice(2,7),item={id:id,name:file.name||"Загруженный файл",type:file.type||"application/octet-stream",size:file.size||0,modified:file.lastModified||Date.now(),savedAt:new Date().toISOString(),blob:file};store.put(item);tx.oncomplete=function(){db.close();window.dispatchEvent(new CustomEvent("text2me:file-vault-changed"));resolve(item)};tx.onerror=function(){db.close();reject(tx.error||new Error("Не удалось сохранить файл."))};tx.onabort=function(){db.close();reject(tx.error||new Error("Сохранение файла отменено."))}})})}
function listUploadedFiles(){return openFileVault().then(function(db){return new Promise(function(resolve,reject){var tx=db.transaction("files","readonly"),req=tx.objectStore("files").getAll();req.onsuccess=function(){resolve((req.result||[]).sort(function(a,b){return String(b.savedAt).localeCompare(String(a.savedAt))}))};req.onerror=function(){reject(req.error||new Error("Не удалось прочитать файлы."))};tx.oncomplete=function(){db.close()}})})}
function removeUploadedFile(id){return openFileVault().then(function(db){return new Promise(function(resolve,reject){var tx=db.transaction("files","readwrite");tx.objectStore("files").delete(id);tx.oncomplete=function(){db.close();window.dispatchEvent(new CustomEvent("text2me:file-vault-changed"));resolve(true)};tx.onerror=function(){db.close();reject(tx.error||new Error("Не удалось удалить файл."))}})})}
window.Text2MeFileVault={save:saveUploadedFile,list:listUploadedFiles,remove:removeUploadedFile};
function statusBadge(status,label){return el("span",{"class":"status-badge","data-status":status},label)}
function saveDrafts(){var forms=Array.from(document.querySelectorAll("#claim-builder,#court-builder,#need-form,#rental-builder"));if(!forms.length)return;var all=read(DRAFTS,{}),privateIds=["plaintiff-inn","defendant-inn","plaintiff-snils"];forms.forEach(function(form){var data={};Array.from(form.elements).forEach(function(x){if(!x.name||["submit","button","reset","file"].includes(x.type)||privateIds.includes(x.id))return;if((x.type==="checkbox"||x.type==="radio")&&!x.checked)return;data[x.name]=x.value});var key=location.pathname+"#"+form.id;if(all[key]&&all[key].data)privateIds.forEach(function(id){var node=document.getElementById(id);if(node&&node.name)delete all[key].data[node.name]});if(Object.keys(data).length)all[key]={path:location.pathname,form:form.id,updated:new Date().toISOString(),data:data}});write(DRAFTS,all)}
function installDraftAutosave(){document.querySelectorAll("#claim-builder,#court-builder,#need-form,#rental-builder").forEach(function(form){var key=location.pathname+"#"+form.id,allDrafts=read(DRAFTS,{}),item=allDrafts[key],privateIds=["plaintiff-inn","defendant-inn","plaintiff-snils"];if(item&&item.data){privateIds.forEach(function(id){var node=document.getElementById(id);if(node&&node.name)delete item.data[node.name]});write(DRAFTS,allDrafts);Array.from(form.elements).forEach(function(x){if(x.name&&!privateIds.includes(x.id)&&Object.prototype.hasOwnProperty.call(item.data,x.name))x.value=item.data[x.name]});}var note=el("p",{class:"save-draft-status","aria-live":"polite"},"Автосохранение включено только в этом браузере.");form.insertAdjacentElement("afterend",note);var t;form.addEventListener("input",function(){clearTimeout(t);note.textContent="Сохраняем черновик…";t=setTimeout(function(){saveDrafts();note.textContent="Черновик сохранён на этом устройстве · "+new Date().toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"})},350)});form.addEventListener("reset",function(){setTimeout(function(){var all=read(DRAFTS,{});delete all[key];write(DRAFTS,all);note.textContent="Локальный черновик очищен."},0)})})}
function crc32(bytes){var c=~0;for(var i=0;i<bytes.length;i++){c^=bytes[i];for(var j=0;j<8;j++)c=(c>>>1)^((c&1)?0xEDB88320:0)}return(c^~0)>>>0}
function u16(v){return[v&255,(v>>>8)&255]}function u32(v){return[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255]}
function zipStore(files){var enc=new TextEncoder(),local=[],central=[],offset=0;files.forEach(function(f){var name=enc.encode(f.name),data=enc.encode(f.data),crc=crc32(data);var lh=[0x50,0x4b,3,4].concat(u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),Array.from(name),Array.from(data));local=local.concat(lh);var ch=[0x50,0x4b,1,2].concat(u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),Array.from(name));central=central.concat(ch);offset+=lh.length});var end=[0x50,0x4b,5,6].concat(u16(0),u16(0),u16(files.length),u16(files.length),u32(central.length),u32(local.length),u16(0));return new Blob([new Uint8Array(local.concat(central,end))],{type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"})}
function xmlEscape(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function docxBlob(text){var paras=String(text).split(/\r?\n/).map(function(line){return"<w:p><w:r><w:t xml:space=\"preserve\">"+xmlEscape(line)+"</w:t></w:r></w:p>"}).join("");return zipStore([{name:"[Content_Types].xml",data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'},{name:"_rels/.rels",data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'},{name:"word/document.xml",data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+paras+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1701"/></w:sectPr></w:body></w:document>'}])}
function downloadBlob(blob,name){var url=URL.createObjectURL(blob),a=el("a",{href:url,download:name});document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1000)}
function getSaved(){var d=read(STORE,[]);return Array.isArray(d)?d:[]}function setSaved(d){return write(STORE,d)}
function saveDocument(title,text,source){if(!String(text||"").trim())return false;var now=new Date().toISOString(),docs=getSaved(),src=source||location.pathname,cleanTitle=String(title||"Документ").trim()||"Документ",existing=docs.find(function(d){return d&&!d.archived&&d.source===src&&d.title===cleanTitle});if(existing){if(existing.text!==text){existing.versions=Array.isArray(existing.versions)?existing.versions:[];existing.versions.unshift({text:existing.text,updated:existing.updated||existing.created});existing.versions=existing.versions.slice(0,10);existing.text=text;existing.updated=now;existing.version=(existing.version||1)+1}return setSaved(docs)}docs.unshift({id:"d"+Date.now().toString(36)+Math.random().toString(36).slice(2,7),title:cleanTitle,text:text,source:src,created:now,updated:now,version:1,versions:[],collection:"Без коллекции",tags:[],archived:false});return setSaved(docs)}
function addExports(outputId,baseName,title){var output=document.getElementById(outputId);if(!output)return;var actions=output.parentElement.querySelector(".document-export-actions");if(!actions){actions=el("div",{class:"document-export-actions"});output.insertAdjacentElement("afterend",actions)}if(!actions.querySelector("[data-export-docx]")){var d=button("Скачать DOCX","button button-outline",function(){if(!output.textContent.trim())return alert("Сначала сформируйте черновик.");downloadBlob(docxBlob(output.textContent),baseName+".docx")});d.setAttribute("data-export-docx","");actions.appendChild(d)}if(!actions.querySelector("[data-export-pdf]")){var p=button("Печать / PDF","button button-outline",function(){if(!output.textContent.trim())return alert("Сначала сформируйте черновик.");var w=window.open("","_blank");if(!w){alert("Разрешите всплывающее окно для предпросмотра и PDF.");return}w.document.write("<!doctype html><html lang='ru'><head><meta charset='utf-8'><title>"+xmlEscape(title)+"</title><style>body{font:12pt/1.6 Arial,sans-serif;max-width:800px;margin:40px auto;color:#111}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}h1{font-size:18pt}@media print{body{margin:15mm auto}}</style></head><body><h1>"+xmlEscape(title)+"</h1><pre>"+xmlEscape(output.textContent)+"</pre><script>window.onload=function(){setTimeout(function(){window.print()},200)}<\/script></body></html>");w.document.close()});p.setAttribute("data-export-pdf","");actions.appendChild(p)}}
function initAutoSaveGeneratedDocuments(){var defs=[["claim-output","Претензия продавцу"],["court-output","Исковое заявление"],["rental-output","Договор найма жилого помещения"],["rental-act-output","Акт приёма-передачи"]];defs.forEach(function(def){var output=document.getElementById(def[0]);if(!output||output.dataset.autoSaveInstalled)return;output.dataset.autoSaveInstalled="1";var note=el("p",{class:"save-draft-status","aria-live":"polite"},"Готовый текст будет автоматически сохранён в «Мои документы».");output.insertAdjacentElement("afterend",note);var timer=0,last="";function persist(){var text=String(output.textContent||"").trim();if(!text||text===last)return;last=text;if(saveDocument(def[1],text,location.pathname)){note.textContent="Сохранено автоматически в «Мои документы» · "+new Date().toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"})}else{note.textContent="Не удалось сохранить автоматически. Проверьте свободное место в браузере."}}if(window.MutationObserver){new MutationObserver(function(){clearTimeout(timer);timer=setTimeout(persist,450)}).observe(output,{childList:true,subtree:true,characterData:true})}if(output.textContent.trim())persist()})}
function initExports(){addExports("claim-output","pretenziya-prodavtsu","Претензия продавцу");addExports("court-output","iskovoe-zayavlenie","Исковое заявление");addExports("rental-output","dogovor-nayma-zhilya","Договор найма жилого помещения");addExports("rental-act-output","akt-priema-peredachi","Акт приёма-передачи") }
function initBrandAndFooter(){
document.querySelectorAll(".brand,.dash-logo").forEach(function(b){
 b.replaceChildren(document.createTextNode("text2me"));
 b.setAttribute("aria-label","text2me — главная");
});
var primaryLinks=[
["/text2me/space/","Моё пространство"],
["/text2me/documents/","Документы"],
["/text2me/prompts/#personal-prompts","Личное"],
["/text2me/guides/","Инструкции"],
["/text2me/people/","Гражданам"],
["/text2me/business/","Организациям"],
["/text2me/knowledge/","База знаний"],
["/text2me/sources/","Официальные источники"]
];
document.querySelectorAll(".site-header .main-nav").forEach(function(nav){
nav.setAttribute("aria-label","Быстрая навигация");
nav.replaceChildren();
primaryLinks.forEach(function(pair){var a=el("a",{href:pair[0]},pair[1]);if(location.pathname===pair[0].replace(/#.*$/,""))a.setAttribute("aria-current","page");nav.appendChild(a)});
});
document.querySelectorAll(".site-header .header-inner").forEach(function(inner){
if(inner.querySelector(".site-header-search"))return;
var form=el("form",{class:"site-header-search",role:"search",action:"/text2me/documents/",method:"get"});
form.appendChild(el("label",{class:"sr-only",for:"site-header-search-input"},"Поиск по документам и материалам"));
form.appendChild(el("input",{id:"site-header-search-input",name:"q",type:"search",placeholder:"Найти документ или тему",autocomplete:"off","aria-label":"Найти документ или тему"}));
form.appendChild(el("button",{type:"submit"},"Найти"));
var nav=inner.querySelector(".main-nav");
if(nav)inner.insertBefore(form,nav);else inner.appendChild(form);
});
var footerLinks=[
["/text2me/","Главная"],
["/text2me/space/","Моё пространство"],
["/text2me/documents/","Документы"],
["/text2me/prompts/#personal-prompts","Личное"],
["/text2me/guides/","Инструкции"],
["/text2me/people/","Гражданам"],
["/text2me/business/","Организациям"],
["/text2me/knowledge/","База знаний"],
["/text2me/sources/","Официальные источники"],
["/text2me/privacy/","Конфиденциальность"],
["/text2me/security/","Безопасность данных"],
["/text2me/terms/","Условия использования"],
["/text2me/updates/","Обновления"]
];
document.querySelectorAll(".site-footer nav").forEach(function(nav){
nav.setAttribute("aria-label","Быстрая навигация и информация о сайте");
nav.replaceChildren();
footerLinks.forEach(function(pair){nav.appendChild(el("a",{href:pair[0]},pair[1]))});
});
}
function initToolNav(){var header=document.querySelector(".site-header");if(!header||header.querySelector(".tool-nav"))return;var nav=el("nav",{class:"tool-nav","aria-label":"Инструменты"}),inner=el("div",{class:"container tool-nav-inner"});[["/text2me/prompts/","PDF и файлы","demo"],["/text2me/knowledge/","Подпись","demo"],["/text2me/documents/pretenziya-prodavtsu/","Конструктор","live"]].forEach(function(x){var a=el("a",{href:x[0]}),label=el("span",{},x[1]);a.appendChild(label);a.appendChild(statusBadge(x[2],x[2]==="live"?"Работает":"Демо"));inner.appendChild(a)});nav.appendChild(inner);header.appendChild(nav)}
function initGlobalNavigation(){
var main=document.querySelector("body > main")||document.querySelector(".dash-shell > main")||document.querySelector(".workspace-main");
if(!main)return;
var progress=el("div",{class:"reading-progress","aria-hidden":"true"});
document.body.appendChild(progress);
var top=document.querySelector("[data-back-to-top]");
if(!top){top=el("a",{href:"#main",class:"back-to-top","data-back-to-top":"true","aria-label":"Наверх",title:"Наверх"},"↑");document.body.appendChild(top)}
var path=location.pathname.toLowerCase(),section="Материалы",audience="Гражданам и организациям";
var routes=[
["/text2me/people/","Гражданам","Гражданам"],
["/text2me/prompts/","Личное и тексты","Для разных задач"],
["/text2me/business/","Организациям","Организациям"],
["/text2me/guides/","Инструкции","Гражданам и организациям"],
["/text2me/documents/","Документы","Гражданам и организациям"],
["/text2me/situations/","Жизненные ситуации","Гражданам"],
["/text2me/knowledge/","Справочные материалы","Гражданам и организациям"],
["/text2me/sources/","Официальные источники","Гражданам и организациям"],
["/text2me/prompts/","Тексты и редактура","Для разных задач"],
["/text2me/space/","Моё пространство","Пользователям сервиса"],
["/text2me/updates/","Обновления","Всем посетителям"]
];
routes.forEach(function(r){if(path.indexOf(r[0])===0){section=r[1];audience=r[2]}});
if(path.indexOf("/text2me/documents/dogovor-arendy/")===0){section="Договор найма жилья";audience="Гражданам"}
else if(path.indexOf("/text2me/documents/pretenziya-prodavtsu/")===0){section="Претензия продавцу";audience="Гражданам"}
else if(path.indexOf("/text2me/documents/isk-v-sud/")===0){section="Исковое заявление";audience="Гражданам"}
var context=el("div",{class:"reading-context","aria-label":"Текущее место на сайте"});
var innerContext=el("div",{class:"reading-context-inner"});
var where=el("span",{class:"reading-context-where"},"Раздел: ");
var current=el("strong",{class:"reading-context-section"},section);
var forWho=el("span",{class:"reading-context-audience","aria-live":"polite"},"Аудитория: "+audience);
where.appendChild(current);
innerContext.appendChild(where);
innerContext.appendChild(forWho);
innerContext.appendChild(el("span",{class:"reading-context-label"},"Перейти:"));
innerContext.appendChild(el("a",{href:"/text2me/people/"},"Гражданам"));
innerContext.appendChild(el("a",{href:"/text2me/business/"},"Организациям"));
context.appendChild(innerContext);
document.body.appendChild(context);
var headings=Array.from(main.querySelectorAll("h1,h2")).filter(function(h){return h.textContent.trim()&&!h.closest("aside")});
var sectionAudience={
"situations":"Гражданам",
"categories":"Гражданам и организациям",
"tools":"Гражданам и организациям",
"trust":"Всем посетителям",
"guides":"Гражданам и организациям",
"my-space-preview":"Пользователям сервиса",
"updates-feed":"Всем посетителям",
"route-builder":"Гражданам и организациям",
"ai-path":"Гражданам и организациям",
"catalog":"Гражданам и организациям",
"space":"Пользователям сервиса",
"faq":"Всем посетителям"
};
function updateCurrentContext(){
var currentHeading=null;
headings.forEach(function(h){if(h.getBoundingClientRect().top<155)currentHeading=h});
if(currentHeading&&window.scrollY>100){
current.textContent=currentHeading.textContent.trim().replace(/\s+/g," ").slice(0,70);
var parentSection=currentHeading.closest("section[id]");
if(parentSection&&sectionAudience[parentSection.id])forWho.textContent="Аудитория: "+sectionAudience[parentSection.id];
}else{
current.textContent=section;
forWho.textContent="Аудитория: "+audience;
}
var activeSection=currentHeading&&currentHeading.closest("section[id]"),activeId=activeSection?activeSection.id:"main";
document.querySelectorAll(".workspace-nav-link").forEach(function(a){
var href=a.getAttribute("href")||"";
var active=href==="#"+activeId||(activeId==="main"&&href==="#main");
a.classList.toggle("active",active);
if(active)a.setAttribute("aria-current","location");else a.removeAttribute("aria-current");
});
document.querySelectorAll(".section-nav a").forEach(function(a){
var active=a.getAttribute("href")==="#"+activeId;
if(active)a.setAttribute("aria-current","location");else a.removeAttribute("aria-current");
});
}
function update(){
var max=document.documentElement.scrollHeight-window.innerHeight;
progress.style.width=(max>0?Math.min(100,window.scrollY/max*100):0)+"%";
top.classList.toggle("is-visible",window.scrollY>420);
context.classList.toggle("is-visible",window.scrollY>180);
updateCurrentContext();
}
window.addEventListener("scroll",update,{passive:true});
window.addEventListener("resize",update);
update();
var ids=[["route-builder","Ситуации"],["ai-path","Помощь"],["catalog","Документы"],["space","Моё пространство"],["faq","Вопросы"],["categories","Категории"],["tools","Инструменты"],["trust","О сервисе"]].filter(function(x){return document.getElementById(x[0])});
if(ids.length>=3){
var nav=el("nav",{class:"section-nav","aria-label":"Оглавление страницы"});
var inner=el("div",{class:"container section-nav-inner"});
ids.forEach(function(x){inner.appendChild(el("a",{href:"#"+x[0]},x[1]))});
nav.appendChild(inner);
var header=document.querySelector(".site-header")||document.querySelector(".dash-header");
if(header)header.insertAdjacentElement("afterend",nav);
}
}
function initStatusLabels(){document.querySelectorAll(".tool-card,.ai-path-form,.space-preview article,[data-feature-status]").forEach(function(card){if(card.querySelector(".status-badge"))return;var text=(card.innerText||"").toLocaleLowerCase("ru"),status=card.getAttribute("data-feature-status");if(!status){if(card.id==="ai-path-form"||/пока не подключ|ещё не подключ|не подписывает|не подключена|не доступны|не реализован|не поддерживается|нет облачной|демонстрац|пока не выполнено|будущая функция/.test(text))status="demo";else if(/скоро|будет добав|планируется/.test(text))status="soon";else status="live"}card.appendChild(el("div",{class:"feature-status-line"})).appendChild(statusBadge(status,status==="live"?"Работает":status==="demo"?"Демо":"Скоро"))})}
function parseCSV(text){var rows=[],row=[],cell="",quoted=false;for(var i=0;i<text.length;i++){var ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(ch===","&&!quoted){row.push(cell);cell=""}else if((ch==="\n"||ch==="\r")&&!quoted){if(ch==="\r"&&text[i+1]==="\n")i++;row.push(cell);rows.push(row);row=[];cell=""}else cell+=ch}if(cell.length||row.length){row.push(cell);rows.push(row)}return rows}
function initFormImport(){document.querySelectorAll("#claim-builder,#court-builder,#need-form").forEach(function(form){var input=el("input",{type:"file",accept:".csv,.txt,text/csv","aria-label":"Загрузка таблицы CSV из Excel"});input.hidden=true;var row=el("div",{class:"space-controls"}),b=button("Заполнить поля из таблицы Excel","button button-outline",function(){input.click()}),note=el("p",{class:"save-draft-status","aria-live":"polite"},"Загрузите таблицу Excel, сохранённую в формате CSV UTF-8: в первой строке — названия полей, во второй — значения.");row.appendChild(b);row.appendChild(input);form.insertAdjacentElement("beforebegin",row);row.insertAdjacentElement("afterend",note);input.addEventListener("change",function(){var file=input.files&&input.files[0];if(!file)return;var reader=new FileReader();reader.onload=function(){try{var rows=parseCSV(String(reader.result).replace(/^\uFEFF/,""));if(rows.length<2)throw new Error("empty");var headers=rows[0],values=rows[1],filled=0;headers.forEach(function(h,i){var key=h.trim(),field=form.elements.namedItem(key)||document.getElementById(key);if(!field||field.form!==form||["file","button","submit","reset"].includes(field.type))return;field.value=values[i]||"";field.dispatchEvent(new Event("input",{bubbles:true}));field.dispatchEvent(new Event("change",{bubbles:true}));filled++});note.textContent=filled?"Заполнено полей: "+filled+". Проверьте каждое значение перед генерацией.":"Не найдено совпадений. Используйте в заголовках CSV точные имена name или id из формы."}catch(e){note.textContent="Не удалось разобрать CSV. Сохраните файл как CSV UTF-8 и проверьте структуру."}};reader.readAsText(file,"utf-8")})})}
function initAI(){var form=document.getElementById("ai-path-form"),input=document.getElementById("ai-path-input");if(!form||!input)return;var stage=0,firstText="",panel=el("div",{class:"ai-dialogue",id:"ai-dialogue","aria-live":"polite"});form.insertAdjacentElement("afterend",panel);function reset(){stage=0;firstText="";panel.innerHTML="";panel.hidden=true;input.disabled=false}function render(){panel.hidden=false;panel.innerHTML="";panel.appendChild(el("h3",{},stage===1?"Уточнение 1 из 2: какая у вас ситуация?":"Уточнение 2 из 2: какой результат нужен?"));panel.appendChild(el("p",{},stage===1?"Выберите ближайшую тему. Текст не отправляется на внешний сервер.":"Уточните желаемый результат, чтобы подобрать следующий шаг."));var select=el("select",{"aria-label":stage===1?"Тема ситуации":"Желаемый результат"}),options=stage===1?[["consumer","Покупка, товар или услуга"],["housing","Жильё и ЖКХ"],["work","Работа"],["money","Деньги и платежи"],["court","Судебный вопрос"],["business","Бизнес и договоры"],["government","Государственная услуга"],["other","Другая ситуация"]]:[["document","Подготовить документ"],["understand","Понять порядок действий"],["official","Найти официальный сервис"],["contact","Написать письмо или обращение"]];options.forEach(function(o){select.appendChild(el("option",{value:o[0]},o[1]))});panel.appendChild(select);var actions=el("div",{class:"builder-actions"});actions.appendChild(button(stage===1?"Продолжить":"Подобрать вариант","button",function(){var val=select.value;if(stage===1){panel.dataset.area=val;stage=2;render();return}var area=panel.dataset.area,isRental=/сдаю|снимать|снимаю|снять|аренд|найм жилья|квартир/i.test(firstText)&&(area==="housing"||area==="business"),map={consumer:["/text2me/documents/pretenziya-prodavtsu/","Претензия продавцу"],court:["/text2me/documents/isk-v-sud/","Исковое заявление"],business:["/text2me/business/","Деловые документы"],housing:["/text2me/people/","Обращения по жилью и ЖКХ"],work:["/text2me/people/","Обращения по работе"],money:["/text2me/prompts/","Сценарии по платежам и долгам"],government:["/text2me/knowledge/","Официальные источники"],other:["/text2me/prompts/","Каталог задач"]},target=isRental?["/text2me/documents/dogovor-arendy/","Договор найма жилья"]:map[area]||map.other,result=el("div",{class:"ai-result"});result.appendChild(el("strong",{},isRental?"Подходящий сценарий: подготовить договор и акт приёма-передачи":"Рекомендуемый следующий шаг: "+target[1]));if(isRental){var steps=el("ol",{});["Согласовать срок, плату, обеспечительный платёж и коммунальные расходы.","Зафиксировать состояние жилья, имущество, ключи и показания счётчиков.","Проверить реквизиты сторон и условия прекращения перед подписанием."].forEach(function(t){steps.appendChild(el("li",{},t))});result.appendChild(steps);result.appendChild(el("p",{},"Для задачи «"+firstText+"» доступны два документа: договор найма жилого помещения и акт приёма-передачи. Это предварительный подбор по заданным правилам, а не юридическая проверка."));result.appendChild(el("a",{class:"button",href:target[0]},"Заполнить договор →"));result.appendChild(el("a",{class:"button button-outline",href:"/text2me/guides/"},"Открыть инструкции"));}else{result.appendChild(el("p",{},"Ваше описание: "+firstText+" Желаемый результат: "+options.find(function(o){return o[0]===val})[1]+". Подбор выполнен по правилам навигации. Проверьте применимость шаблона."));result.appendChild(el("a",{class:"button",href:target[0]},"Открыть раздел"));}panel.appendChild(result);actions.replaceChildren(button("Начать заново","button button-outline",reset))}));if(stage===2)actions.appendChild(button("Назад","button button-outline",function(){stage=1;render()}));panel.appendChild(actions)}form.addEventListener("submit",function(e){e.preventDefault();e.stopImmediatePropagation();if(!input.value.trim()){input.focus();return}if(stage===0){firstText=input.value.trim();stage=1;input.disabled=true;render()}},true);form.appendChild(button("Сбросить диалог","button button-outline",reset));var params=new URLSearchParams(window.location.search),task=params.get("task"),area=params.get("area"),areaSelect=document.getElementById("need-area"),pendingTask="";try{pendingTask=sessionStorage.getItem("text2me.pending-ai-task")||"";sessionStorage.removeItem("text2me.pending-ai-task")}catch(e){}if(area&&areaSelect){areaSelect.value=area;areaSelect.dispatchEvent(new Event("change",{bubbles:true}))}if(!task)task=pendingTask;if(task){input.value=task;window.setTimeout(function(){if(form.requestSubmit)form.requestSubmit();else form.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}))},0)}}
function initCatalogFilters(){var grid=document.getElementById("catalog-cards");if(!grid)return;var cards=Array.from(grid.querySelectorAll("[data-search-item]")),wrap=el("div",{class:"catalog-filters","aria-label":"Фильтры каталога"}),defs=[["type","Тип аудитории",[["","Все аудитории"],["citizen","Гражданам"],["business","Бизнесу"],["study","Учёба и аналитика"]]],["situation","Ситуация",[["","Все ситуации"],["consumer","Покупки и услуги"],["work","Работа"],["housing","Жильё и ЖКХ"],["contract","Договоры"],["court","Суд"]]],["nature","Правовая природа",[["","Любой тип"],["legal","Правовой документ"],["business","Деловой документ"],["info","Информационный материал"]]]];defs.forEach(function(d){var lab=el("label",{},d[1]),sel=el("select",{"data-filter":d[0]});d[2].forEach(function(o){sel.appendChild(el("option",{value:o[0]},o[1]))});lab.appendChild(sel);wrap.appendChild(lab)});var count=el("p",{class:"catalog-count","aria-live":"polite"}),heading=grid.parentElement.querySelector(".section-heading");if(heading)heading.insertAdjacentElement("afterend",wrap);else grid.insertAdjacentElement("beforebegin",wrap);wrap.insertAdjacentElement("afterend",count);function apply(){var q=((document.getElementById("search-input")||{}).value||"").toLocaleLowerCase("ru"),filters={};wrap.querySelectorAll("select").forEach(function(s){filters[s.dataset.filter]=s.value});var visible=0;cards.forEach(function(card){var t=(card.innerText+" "+(card.dataset.search||"")).toLocaleLowerCase("ru"),type=!filters.type||(filters.type==="citizen"?/претенз|заявлен|граждан|покуп|судебн/.test(t):filters.type==="business"?/делов|договор|бизнес|компан|кадр|бухгалтер/.test(t):/учеб|доклад|аналитическ|исследован/.test(t)),sit=!filters.situation||(filters.situation==="consumer"?/претенз|продав|товар|покуп|возврат/.test(t):filters.situation==="work"?/работ|кадр|увольн|зарплат/.test(t):filters.situation==="housing"?/жкх|жиль|дом|недвижим/.test(t):filters.situation==="contract"?/договор|аренд|условия/.test(t):/суд|иск|судебн|взыскан/.test(t)),nat=!filters.nature||(filters.nature==="legal"?/претенз|заявлен|иск|судебн|доверенност/.test(t):filters.nature==="business"?/делов|договор|акт|кадр|бухгалтер/.test(t):/доклад|аналитическ|исследован|инструкц/.test(t)),match=(!q||t.indexOf(q)>=0)&&type&&sit&&nat;card.hidden=!match;if(match)visible++});count.textContent="Показано направлений: "+visible+" из "+cards.length+" в стартовой подборке.";var empty=document.getElementById("empty-state");if(empty)empty.hidden=visible!==0}wrap.addEventListener("change",apply);var search=document.getElementById("search-input");if(search)search.addEventListener("input",function(){setTimeout(apply,0)});apply()}
function initPromptCatalog(){var prose=document.querySelector("main .prose");if(!prose)return;var cards=Array.from(prose.querySelectorAll("article.info-card")).filter(function(card){return !!card.querySelector("textarea")});if(!cards.length)return;var filters=el("div",{class:"catalog-filters","aria-label":"Фильтры каталога задач"});var defs=[["type","Аудитория / тип задачи",[["","Все типы"],["citizen","Для граждан"],["legal","Документы и право"],["business","Бизнес"],["technical","Разработка и технологии"],["research","Исследование и личные задачи"]]],["situation","Ситуация",[["","Все ситуации"],["consumer","Покупки и услуги"],["work","Работа"],["housing","Жильё и ЖКХ"],["court","Суд и документы"],["contract","Договоры"],["software","Код и цифровые продукты"],["research","Исследование и прочее"]]],["nature","Правовая природа",[["","Любая природа"],["legal","Правовой документ / задача"],["business","Деловая задача"],["technical","Техническая задача"],["info","Информационная задача"]]]];defs.forEach(function(d){var lab=el("label",{},d[1]),sel=el("select",{"data-prompt-filter":d[0]});d[2].forEach(function(o){sel.appendChild(el("option",{value:o[0]},o[1]))});lab.appendChild(sel);filters.appendChild(lab)});var count=el("p",{class:"catalog-count","aria-live":"polite"});var first=prose.querySelector("#personal-prompts");if(first)first.insertAdjacentElement("beforebegin",filters);else prose.insertBefore(filters,prose.firstChild);filters.insertAdjacentElement("afterend",count);function groupFor(card){var n=card.previousElementSibling;while(n&&n.tagName!=="H2")n=n.previousElementSibling;return n&&n.id?n.id:"research-prompts"}var groups={};cards.forEach(function(card){var group=groupFor(card);card.dataset.promptGroup=group;groups[group]=(groups[group]||0)+1;var t=(card.innerText+" "+(card.querySelector("textarea")||{}).value).toLocaleLowerCase("ru");card.dataset.promptSituation=/покуп|товар|услуг|возврат|деньг/.test(t)?"consumer":/жкх|жиль|управляющ/.test(t)?"housing":/работ|зарплат|кадр/.test(t)?"work":/суд|иск|претенз|договор|правов/.test(t)?"court":/код|бот|программ|сайт|инцидент|тестирован/.test(t)?"software":"research";card.dataset.promptNature=/договор|претенз|иск|правов|закон|юрисдикц|суд/.test(t)?"legal":/делов|компан|контрагент|бизнес/.test(t)?"business":/код|бот|программ|техническ|инцидент|релиз/.test(t)?"technical":"info"});Object.keys(groups).forEach(function(id){var h=document.getElementById(id);if(h&&!h.dataset.countAdded){h.appendChild(document.createTextNode(" · "+groups[id]+" сценария"));h.dataset.countAdded="1"}});function apply(){var f={};filters.querySelectorAll("select").forEach(function(s){f[s.dataset.promptFilter]=s.value});var n=0;cards.forEach(function(card){var g=card.dataset.promptGroup,typ=!f.type||(f.type==="citizen"&&g==="personal-prompts")||(f.type==="legal"&&g==="document-prompts")||(f.type==="business"&&g==="business-prompts")||(f.type==="technical"&&g==="software-prompts")||(f.type==="research"&&g==="research-prompts"),sit=!f.situation||card.dataset.promptSituation===f.situation||(f.situation==="court"&&g==="document-prompts"),nat=!f.nature||card.dataset.promptNature===f.nature;card.hidden=!(typ&&sit&&nat);if(!card.hidden)n++});count.textContent="Показано сценариев: "+n+" из "+cards.length+" в каталоге."; }filters.addEventListener("change",apply);apply()}
function initSuggestions(){var area=document.getElementById("need-area"),form=document.getElementById("need-form");if(!area||!form)return;var box=el("div",{class:"route-suggestions",id:"route-suggestions"}),map={consumer:[["Претензия продавцу","/text2me/documents/pretenziya-prodavtsu/"],["Сценарии покупок и услуг","/text2me/prompts/"]],housing:[["Обращения по ЖКХ","/text2me/people/"],["База официальных источников","/text2me/knowledge/"]],work:[["Материалы для граждан","/text2me/people/"],["Шаблоны и сценарии","/text2me/prompts/"]],money:[["Сценарии по платежам","/text2me/prompts/"],["Официальные источники","/text2me/knowledge/"]],court:[["Исковое заявление","/text2me/documents/isk-v-sud/"],["Проверка правовых источников","/text2me/knowledge/"]],business:[["Деловые документы","/text2me/business/"],["Каталог задач","/text2me/prompts/"]],government:[["База знаний","/text2me/knowledge/"],["Материалы для граждан","/text2me/people/"]],other:[["Полный каталог задач","/text2me/prompts/"],["База знаний","/text2me/knowledge/"]]};function render(){box.innerHTML="";box.appendChild(el("strong",{},"Что может пригодиться по выбранной ситуации"));(map[area.value]||map.other).forEach(function(x){box.appendChild(el("a",{href:x[1]},x[0]+" →"))})}var label=form.querySelector('label[for="need-area"]')?.parentElement;if(label)label.insertAdjacentElement("afterend",box);else form.insertAdjacentElement("afterbegin",box);area.addEventListener("change",render);render()}
function initFeedback(){var launcher=el("div",{class:"feedback-launcher","aria-label":"Обратная связь"}),panel=el("section",{class:"feedback-panel",hidden:"",role:"dialog","aria-label":"Обратная связь"});panel.appendChild(el("h3",{},"Помогите улучшить text2me"));panel.appendChild(el("p",{},"Сообщение сохраняется только в этом браузере и не отправляется команде."));var textarea=el("textarea",{placeholder:"Какого документа или функции не хватает? Не указывайте персональные данные."});panel.appendChild(textarea);panel.appendChild(button("Сохранить отзыв","button",function(){if(!textarea.value.trim())return alert("Введите текст отзыва.");var arr=read(FEEDBACK,[]);arr.push({page:location.pathname,text:textarea.value.trim(),created:new Date().toISOString()});if(write(FEEDBACK,arr))panel.replaceChildren(el("p",{},"Отзыв сохранён локально. Он не отправлен разработчику."),button("Закрыть","button button-outline",function(){panel.hidden=true}))}));panel.appendChild(button("Закрыть","button button-outline",function(){panel.hidden=true}));launcher.appendChild(button("Не подошёл документ","",function(){panel.hidden=false;textarea.placeholder="Что не подошло? Какой результат ожидали? Не указывайте персональные данные.";textarea.focus()}));launcher.appendChild(button("Чего не хватает","",function(){panel.hidden=false;textarea.placeholder="Какого документа, ситуации или функции не хватает?";textarea.focus()}));document.body.appendChild(panel);document.body.appendChild(launcher)}
function initSpace(){var host=document.getElementById("space-app");if(!host)return;function render(){host.innerHTML="";var docs=getSaved(),drafts=read(DRAFTS,{}),top=el("div",{class:"space-controls"});top.appendChild(button("Скачать резервную копию","button button-outline",function(){downloadBlob(new Blob([JSON.stringify({schema:"text2me-space-v1",exportedAt:new Date().toISOString(),documents:getSaved(),drafts:read(DRAFTS,{}),feedback:read(FEEDBACK,[])},null,2)],{type:"application/json"}),"text2me-rezervnaya-kopiya.json")}));var inp=el("input",{type:"file",accept:".json,.csv,.txt,application/json,text/csv,text/plain","aria-label":"Выберите резервную копию или таблицу CSV из Excel"});top.appendChild(inp);top.appendChild(button("Загрузить документы из файла","button button-outline",function(){inp.click()}));inp.addEventListener("change",function(){var file=inp.files&&inp.files[0];if(!file)return;var reader=new FileReader();reader.onload=function(){try{var imported=[];if(/\.json$/i.test(file.name)){var val=JSON.parse(reader.result);imported=Array.isArray(val)?val:(val.documents||[])}else{var rows=String(reader.result).split(/\r?\n/).filter(Boolean);imported=rows.slice(1).map(function(row){var cols=row.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(function(x){return x.replace(/^"|"$/g,"").replace(/""/g,'"')});return{id:"csv"+Math.random().toString(36).slice(2),title:cols[0]||"Импортированный документ",text:cols[1]||"",created:new Date().toISOString(),collection:cols[2]||"Импорт из Excel",tags:[],archived:false,source:"import-csv"}}).filter(function(x){return x.text})}setSaved(getSaved().concat(imported.filter(function(x){return x&&x.text})));alert("Импортировано документов: "+imported.length);render()}catch(e){alert("Не удалось прочитать файл. Выберите резервную копию text2me или таблицу CSV, сохранённую из Excel.")}};reader.readAsText(file)});host.appendChild(top);host.appendChild(el("p",{class:"field-help"},"Скачать резервную копию — сохранить документы и черновики в один файл на компьютер. «Загрузить документы из файла» добавляет документы из такой копии или из таблицы Excel, сохранённой как CSV UTF-8 со столбцами «название», «текст», «коллекция». Данные остаются в этом браузере; облачной синхронизации нет."));var controls=el("div",{class:"space-controls"}),search=el("input",{type:"search",placeholder:"Найти документ"}),filter=el("select",{"aria-label":"Фильтр документов"});[["all","Все документы"],["active","Не в архиве"],["archived","Архив"],["drafts","Автосохранённые формы"]].forEach(function(x){filter.appendChild(el("option",{value:x[0]},x[1]))});controls.appendChild(search);controls.appendChild(filter);host.appendChild(controls);var list=el("div",{class:"space-doc-list"});host.appendChild(list);function drawList(){list.innerHTML="";var q=search.value.toLocaleLowerCase("ru"),mode=filter.value,shown=docs.filter(function(d){return(mode==="all"||(mode==="active"&&!d.archived)||(mode==="archived"&&d.archived))&&((d.title+" "+d.text+" "+(d.tags||[]).join(" ")+" "+(d.collection||"")).toLocaleLowerCase("ru").indexOf(q)>=0)});if(mode==="drafts")shown=Object.keys(drafts).map(function(k){var d=drafts[k],label=d.form==="rental-builder"?"Договор найма жилья":d.form==="claim-builder"?"Претензия продавцу":d.form==="court-builder"?"Исковое заявление":d.form||"форма";return{id:k,title:"Черновик: "+label,text:JSON.stringify(d.data,null,2),created:d.updated,collection:"Черновики",tags:[],archived:false,draft:true,form:d.form,path:d.path}}).filter(function(d){return(d.title+d.text).toLocaleLowerCase("ru").indexOf(q)>=0});if(!shown.length){list.appendChild(el("p",{},mode==="drafts"?"Автосохранённых форм пока нет. Заполните форму на странице документа.":"Документов пока нет. После создания черновик сохранится автоматически."));return}shown.forEach(function(d){var card=el("article",{class:"space-doc"});card.appendChild(el("h3",{},d.title||"Без названия"));card.appendChild(el("p",{},(d.created?new Date(d.created).toLocaleString("ru-RU"):"")+(d.collection?" · "+d.collection:"")+(d.archived?" · Архив":"")));card.appendChild(el("p",{},String(d.text||"").slice(0,220)+(String(d.text||"").length>220?"…":"")));var meta=el("div",{class:"space-controls"}),collection=el("input",{value:d.collection||"Без коллекции",placeholder:"Коллекция","aria-label":"Коллекция"}),tags=el("input",{value:(d.tags||[]).join(", "),placeholder:"Теги через запятую","aria-label":"Теги"});meta.appendChild(collection);meta.appendChild(tags);card.appendChild(meta);var actions=el("div",{class:"space-doc-actions"});if(d.draft&&d.form==="rental-builder"){actions.appendChild(button("Продолжить заполнение","button",function(){location.href=(d.path||"/text2me/documents/dogovor-arendy/")+"?restore=1"}))}if(!d.draft){actions.appendChild(button("История версий ("+(Array.isArray(d.versions)?d.versions.length:0)+")","button button-outline",function(){var existing=card.querySelector(".space-version-history");if(existing){existing.remove();return}var history=el("div",{class:"space-version-history","aria-label":"История версий"});var versions=(Array.isArray(d.versions)?d.versions:[]).slice().reverse();if(!versions.length){history.appendChild(el("p",{class:"field-help"},"История начнётся после первого сохранения изменений. Текущий текст — версия "+(d.version||1)+"."))}versions.forEach(function(v){var row=el("div",{class:"space-version-row"});row.appendChild(el("div",{}, "Версия "+(v.version||"—")+" · "+(v.createdAt?new Date(v.createdAt).toLocaleString("ru-RU"):"дата неизвестна")));row.appendChild(button("Просмотреть","button button-outline",function(){var preview=history.querySelector(".space-version-preview");if(!preview){preview=el("pre",{class:"space-version-preview"});history.appendChild(preview)}preview.textContent=v.text||""}));row.appendChild(button("Восстановить эту версию","button button-outline",function(){if(!confirm("Восстановить версию "+(v.version||"")+"? Текущий текст останется в истории."))return;var idx=docs.findIndex(function(x){return x.id===d.id});if(idx<0)return;var current=docs[idx],now=new Date().toISOString();current.versions=Array.isArray(current.versions)?current.versions:[];current.versions.push({version:current.version||1,text:current.text||"",createdAt:current.updated||current.created||now,note:"Перед восстановлением"});if(current.versions.length>30)current.versions=current.versions.slice(-30);current.text=v.text||"";current.version=(current.version||1)+1;current.updated=now;setSaved(docs);render()}));history.appendChild(row)});card.appendChild(history)}));actions.appendChild(button("Редактировать текст","button button-outline",function(){var existing=card.querySelector(".space-edit-text");if(existing){existing.focus();return}var area=el("textarea",{class:"space-edit-text","aria-label":"Редактировать текст документа"});area.value=d.text||"";area.rows=Math.max(8,Math.min(24,area.value.split("\n").length));card.appendChild(area);var editActions=el("div",{class:"space-doc-actions"});editActions.appendChild(button("Сохранить изменения","button",function(){var idx=docs.findIndex(function(x){return x.id===d.id});if(idx>=0){var current=docs[idx],now=new Date().toISOString();current.versions=Array.isArray(current.versions)?current.versions:[];current.versions.push({version:current.version||1,text:current.text||"",createdAt:current.updated||current.created||now,note:"Перед изменением"});if(current.versions.length>30)current.versions=current.versions.slice(-30);current.text=area.value;current.updated=now;current.version=(current.version||1)+1;setSaved(docs);render()}}));editActions.appendChild(button("Отмена","button button-outline",function(){area.remove();editActions.remove()}));card.appendChild(editActions);area.focus()}))}actions.appendChild(button(d.draft?"Посмотреть данные черновика":"Открыть / копировать","",function(){var w=window.open("","_blank");if(w){w.document.write("<pre style='white-space:pre-wrap;font:16px/1.6 Arial;margin:32px'>"+xmlEscape(d.text||"")+"</pre>");w.document.close()}else if(navigator.clipboard)navigator.clipboard.writeText(d.text||"")}));actions.appendChild(button("Скачать TXT","",function(){downloadBlob(new Blob(["\ufeff",d.text||""],{type:"text/plain;charset=utf-8"}),(d.title||"document").replace(/[^\p{L}\p{N}-]+/gu,"-")+".txt")}));actions.appendChild(button("Сохранить теги","",function(){var idx=docs.findIndex(function(x){return x.id===d.id});if(idx>=0){docs[idx].collection=collection.value;docs[idx].tags=tags.value.split(",").map(function(x){return x.trim()}).filter(Boolean);docs[idx].updated=new Date().toISOString();setSaved(docs);render()}}));actions.appendChild(button(d.archived?"Вернуть из архива":"В архив","",function(){var idx=docs.findIndex(function(x){return x.id===d.id});if(idx>=0){docs[idx].archived=!docs[idx].archived;setSaved(docs);render()}}));actions.appendChild(button("Удалить","",function(){if(confirm("Удалить документ только из этого браузера?")){setSaved(docs.filter(function(x){return x.id!==d.id}));render()}}));card.appendChild(actions);list.appendChild(card)})}search.addEventListener("input",drawList);filter.addEventListener("change",drawList);drawList()}render()}
function initPriorityWorkspace(){
var main=document.querySelector("body > main")||document.querySelector(".workspace-main");if(!main)return;
var hero=main.querySelector(".page-hero"),form=main.querySelector("#claim-builder,#court-builder,#rental-builder");
if(form&&hero){var section=form.closest("section.section");if(section&&hero.nextElementSibling!==section)hero.insertAdjacentElement("afterend",section)}
var courtForm=main.querySelector("#court-builder"),readiness=main.querySelector("#court-readiness"),result=main.querySelector("#court-result");
if(courtForm&&readiness&&result&&readiness.compareDocumentPosition(courtForm)&Node.DOCUMENT_POSITION_FOLLOWING){result.insertAdjacentElement("afterend",readiness)}
var params=new URLSearchParams(location.search);
if(form&&params.get("focus")==="form"){var field=form.querySelector("input:not([type=hidden]),textarea,select");if(field){form.scrollIntoView({block:"start",behavior:"auto"});field.focus({preventScroll:true})}}
}
function initDaDataPartyLookup(){
var endpoint=String(window.TEXT2ME_DADATA_ENDPOINT||"").trim();
function panelFor(form,config){
if(!form)return;
var target=form.querySelector(config.target);if(!target)return;
var existingPanels=form.querySelectorAll(".dadata-party-panel");for(var pi=0;pi<existingPanels.length;pi++){if(existingPanels[pi].getAttribute("data-target")===config.nameTarget)return;}
var panel=el("section",{class:"dadata-party-panel","aria-label":"Проверка реквизитов организации или ИП"});panel.setAttribute("data-target",config.nameTarget);
panel.appendChild(el("h3",{},"Проверить ИНН и заполнить реквизиты"));
panel.appendChild(el("p",{class:"field-help"},"Введите ИНН организации (10 цифр) или ИП (12 цифр). Данные будут показаны для проверки; поля изменятся только после вашего подтверждения."));
var grid=el("div",{class:"dadata-party-controls"});
var label=el("label",{class:"dadata-party-label"},"ИНН");
var inn=el("input",{type:"text",inputMode:"numeric",autocomplete:"off",maxLength:12,placeholder:"10 или 12 цифр",class:"dadata-party-inn","aria-label":"ИНН организации или ИП"});
label.appendChild(inn);grid.appendChild(label);
var lookup=button("Проверить ИНН","button",function(){runLookup()});grid.appendChild(lookup);
panel.appendChild(grid);
var status=el("p",{class:"dadata-party-status","aria-live":"polite"},"Проверка выполняется через защищённый серверный шлюз. ИНН не отправляется напрямую из браузера в DaData.");
var resultBox=el("div",{class:"dadata-party-result",hidden:"hidden"});
var apply=button("Применить выбранные реквизиты","button",function(){
if(!found)return;
var name=form.querySelector(config.nameTarget);
if(name&&found.name)name.value=found.name;
if(config.addressTarget&&found.address){var address=form.querySelector(config.addressTarget);if(address)address.value=found.address}
var innField=config.innTarget?form.querySelector(config.innTarget):null;if(innField)innField.value=found.inn||inn.value.trim();
[name,config.addressTarget?form.querySelector(config.addressTarget):null,innField].filter(Boolean).forEach(function(x){x.dispatchEvent(new Event("input",{bubbles:true}));x.dispatchEvent(new Event("change",{bubbles:true}))});
status.textContent="Реквизиты внесены в поля формы. Проверьте их перед созданием документа.";
apply.disabled=true;
});
apply.disabled=true;
resultBox.appendChild(apply);panel.appendChild(status);panel.appendChild(resultBox);
target.insertAdjacentElement("beforebegin",panel);
var found=null;
inn.addEventListener("input",function(){inn.value=inn.value.replace(/\D/g,"").slice(0,12);found=null;resultBox.hidden=true;apply.disabled=true});
async function runLookup(){
var value=inn.value.replace(/\D/g,"");
if(!/^\d{10}(\d{2})?$/.test(value)){status.textContent="Введите корректную длину ИНН: 10 цифр для организации или 12 для ИП.";inn.focus();return}
if(!endpoint){status.textContent="Интеграция ещё не подключена: требуется развернуть серверный шлюз и задать window.TEXT2ME_DADATA_ENDPOINT. API-ключ в код страницы добавлять нельзя.";return}
lookup.disabled=true;lookup.textContent="Проверяем…";status.textContent="Запрашиваем сведения по ИНН…";resultBox.hidden=true;found=null;
try{
var response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({inn:value}),credentials:"omit"});
var payload=await response.json().catch(function(){return {}});
if(!response.ok||!payload.result){var messages={invalid_inn:"ИНН должен содержать 10 или 12 цифр.",not_found:"По этому ИНН организация или ИП не найдены.",service_not_configured:"Серверная интеграция не настроена.",provider_error:"DaData временно не отвечает.",upstream_unavailable:"Не удалось связаться с DaData."};throw new Error(messages[payload.error]||payload.message||"Проверка не выполнена. Попробуйте позже.")}
found=payload.result;
var previousFields=resultBox.querySelector(".dadata-party-fields");if(previousFields)previousFields.remove();
var dl=el("dl",{class:"dadata-party-fields"});
[["Наименование",found.name],["ИНН",found.inn],["КПП",found.kpp],["ОГРН",found.ogrn],["Адрес",found.address],["Руководитель",found.manager],["Статус",({ACTIVE:"Действует",LIQUIDATING:"В процессе ликвидации",LIQUIDATED:"Ликвидирована",BANKRUPT:"Банкротство",REORGANIZING:"Реорганизация"})[found.status]||found.status],["Отметка о недостоверности",found.invalid?"Есть отметка в данных сервиса":"Не указана"]].forEach(function(pair){if(!pair[1])return;dl.appendChild(el("dt",{},pair[0]));dl.appendChild(el("dd",{},String(pair[1])));});
resultBox.insertBefore(dl,apply);resultBox.hidden=false;apply.disabled=false;
status.textContent="Найдены сведения. Проверьте название, адрес и статус. Сервис не подтверждает полномочия подписанта и не заменяет юридическую проверку.";
}catch(error){status.textContent=error&&error.message?error.message:"Не удалось выполнить проверку."}
finally{lookup.disabled=false;lookup.textContent="Проверить ИНН"}
}
}
panelFor(document.getElementById("claim-builder"),{target:".form-grid",nameTarget:"#seller-name",addressTarget:"#seller-address",innTarget:"#seller-inn"});
panelFor(document.getElementById("rental-builder"),{target:".rental-form-grid",nameTarget:"#rental-landlord",innTarget:"#rental-inn"});
panelFor(document.getElementById("court-builder"),{target:".form-grid",nameTarget:"#plaintiff-name",addressTarget:"#plaintiff-address",innTarget:"#plaintiff-inn"});
panelFor(document.getElementById("court-builder"),{target:".form-grid",nameTarget:"#defendant-name",addressTarget:"#defendant-address",innTarget:"#defendant-inn"});
}
function initDocumentCapture(){
var header=document.querySelector(".site-header .header-inner")||document.querySelector(".workspace-header")||document.querySelector(".dash-header");
if(!header||document.getElementById("document-capture-launcher"))return;
var launch=button("Загрузить файл","button button-outline",function(){openCapture()});
launch.id="document-capture-launcher";launch.setAttribute("aria-haspopup","dialog");var host=header.querySelector(".workspace-top-links")||header;host.appendChild(launch);
var modal=el("section",{class:"document-capture-modal",role:"dialog","aria-modal":"true","aria-labelledby":"document-capture-title",hidden:"hidden"});
var panel=el("div",{class:"document-capture-panel"}),heading=el("div",{class:"document-capture-heading"});
heading.appendChild(el("h2",{id:"document-capture-title"},"Загрузить документ"));
heading.appendChild(button("Закрыть","button button-outline",closeCapture));
panel.appendChild(heading);
panel.appendChild(el("p",{class:"field-help"},"Выберите файл или сделайте снимок. Файл автоматически сохранится в «Мои документы» на этом устройстве. Распознавание изображения запускается отдельно."));
var actions=el("div",{class:"document-capture-actions"});
var upload=el("input",{type:"file",accept:"image/*,.pdf,.doc,.docx,.rtf,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain",hidden:"hidden"});
var camera=el("input",{type:"file",accept:"image/*",capture:"environment",hidden:"hidden"});
actions.appendChild(button("Выбрать файл","button",function(){upload.click()}));
actions.appendChild(button("Сфотографировать","button button-outline",function(){camera.click()}));
panel.appendChild(actions);
var status=el("p",{class:"field-help","aria-live":"polite"},"Файлы сохраняются в локальной библиотеке этого браузера.");
var lastTextArea=null;document.addEventListener("focusin",function(e){if(e.target&&e.target.tagName==="TEXTAREA"&&!e.target.closest(".document-capture-panel"))lastTextArea=e.target});
var preview=el("div",{class:"document-capture-preview","aria-live":"polite"});
panel.appendChild(status);panel.appendChild(preview);
modal.appendChild(panel);document.body.appendChild(modal);modal.addEventListener("click",function(e){if(e.target===modal)closeCapture()});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!modal.hidden)closeCapture()});
var objectUrl=null;
function clearPreview(){if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null}preview.replaceChildren()}
function openCapture(){modal.hidden=false;document.body.classList.add("capture-modal-open");upload.value="";camera.value="";status.textContent="Выберите файл или сделайте снимок. После выбора файл сохранится автоматически.";launch.setAttribute("aria-expanded","true");var close=modal.querySelector("button");if(close)close.focus()}
function closeCapture(){modal.hidden=true;document.body.classList.remove("capture-modal-open");launch.setAttribute("aria-expanded","false");clearPreview();status.textContent="Окно закрыто. Загруженные файлы доступны в «Мои документы».";launch.focus()}
function showFile(file){if(!file)return;clearPreview();status.textContent="Сохраняем файл в «Мои документы»…";saveUploadedFile(file).then(function(){status.textContent="Файл сохранён в «Мои документы» на этом устройстве."}).catch(function(err){status.textContent="Не удалось сохранить файл автоматически: "+(err&&err.message?err.message:"ошибка локального хранилища")});var link=el("a",{class:"document-capture-download",download:file.name},"Скачать исходный файл");objectUrl=URL.createObjectURL(file);link.href=objectUrl;preview.appendChild(link);
if(file.type.indexOf("image/")===0){var img=el("img",{class:"document-capture-image",alt:"Предпросмотр выбранного изображения"});img.src=objectUrl;preview.appendChild(img);
var ocrActions=el("div",{class:"document-ocr-actions"}),ocrButton=button("Распознать текст","button",runOCR);ocrActions.appendChild(ocrButton);preview.appendChild(ocrActions);
var ocrOutput=el("textarea",{class:"document-ocr-output",rows:"8",maxlength:"50000","aria-label":"Распознанный текст","placeholder":"Результат распознавания появится здесь. Проверьте имена, номера, даты и суммы вручную."});ocrOutput.hidden=true;preview.appendChild(ocrOutput);
var ocrResultActions=el("div",{class:"document-ocr-actions"});ocrResultActions.hidden=true;var copyOCR=button("Скопировать текст","button button-outline",function(){var value=ocrOutput.value;if(!value)return; if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(value).then(function(){status.textContent="Распознанный текст скопирован."}).catch(function(){ocrOutput.focus();ocrOutput.select();status.textContent="Выделите текст и скопируйте его вручную."})}else{ocrOutput.focus();ocrOutput.select();status.textContent="Выделите текст и скопируйте его вручную."}});ocrResultActions.appendChild(copyOCR);
var insertOCR=button("Добавить в последнее текстовое поле","button button-outline",function(){if(!lastTextArea||!document.contains(lastTextArea)){status.textContent="Сначала выберите текстовое поле формы, затем снова откройте загрузку документа.";return}var current=lastTextArea.value||"";lastTextArea.value=current?(current+"\n\n"+ocrOutput.value):ocrOutput.value;lastTextArea.dispatchEvent(new Event("input",{bubbles:true}));lastTextArea.dispatchEvent(new Event("change",{bubbles:true}));status.textContent="Текст добавлен в выбранное поле. Проверьте и отредактируйте его."});ocrResultActions.appendChild(insertOCR);preview.appendChild(ocrResultActions);
async function runOCR(){var endpoint=window.TEXT2ME_OCR_ENDPOINT||"";if(!endpoint){status.textContent="OCR пока не активирован: сначала нужно развернуть серверный шлюз и указать его адрес в конфигурации.";return}if(file.size>5*1024*1024){status.textContent="Файл больше 5 МБ. Выберите изображение меньшего размера.";return}if(!["image/jpeg","image/png","image/webp","image/gif"].includes(file.type)){status.textContent="Этот формат изображения не поддерживается OCR. Используйте JPG, PNG, WEBP или GIF.";return}ocrButton.disabled=true;ocrButton.textContent="Распознаём…";status.textContent="Распознаём изображение…";try{var dataUrl=await new Promise(function(resolve,reject){var reader=new FileReader();reader.onload=function(){resolve(String(reader.result||""))};reader.onerror=function(){reject(new Error("read_failed"))};reader.readAsDataURL(file)});var base64=dataUrl.slice(dataUrl.indexOf(",")+1);var response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mimeType:file.type,imageBase64:base64})});var payload=await response.json().catch(function(){return {}});if(!response.ok)throw new Error(payload.message||"Сервис OCR вернул ошибку ("+response.status+").");ocrOutput.value=String(payload.text||"").slice(0,50000);ocrOutput.hidden=false;ocrResultActions.hidden=false;status.textContent=ocrOutput.value.trim()?"Распознавание завершено. Проверьте текст: OCR может ошибаться в именах, датах, суммах и номерах.":"Текст не обнаружен. Попробуйте более чёткое изображение."}catch(err){status.textContent=err&&err.message?err.message:"Не удалось распознать изображение. Попробуйте позже."}finally{ocrButton.disabled=false;ocrButton.textContent="Распознать текст"}}
}
else if(file.type==="application/pdf"||/\.pdf$/i.test(file.name)){var frame=el("iframe",{class:"document-capture-pdf",title:"Предпросмотр PDF"});frame.src=objectUrl;preview.appendChild(frame)}
else if(file.type.indexOf("text/")===0||/\.(txt|csv|rtf)$/i.test(file.name)){var reader=new FileReader();reader.onload=function(){var pre=el("pre",{class:"document-capture-text"});pre.textContent=String(reader.result||"").slice(0,20000);preview.appendChild(pre)};reader.readAsText(file)}
else{preview.appendChild(el("p",{class:"field-help"},"Предпросмотр этого формата в браузере недоступен. Скачайте исходный файл или откройте его в подходящей программе."))}
}
upload.addEventListener("change",function(){showFile(upload.files&&upload.files[0])});camera.addEventListener("change",function(){showFile(camera.files&&camera.files[0])});
}
function initFAQAndLegal(){var main=document.querySelector("body > main")||document.querySelector(".dash-shell > main");if(!main)return;if(location.pathname==="/text2me/"&&!document.getElementById("faq")){var faq=el("section",{class:"section section-muted",id:"faq"}),container=el("div",{class:"container"});container.appendChild(el("p",{class:"eyebrow"},"Частые вопросы"));container.appendChild(el("h2",{},"Как пользоваться text2me"));[["Это юридическая консультация?","Нет. Сервис помогает подобрать сценарий и подготовить черновик. Проверяйте факты, актуальные нормы и применимость документа; сложные случаи передавайте квалифицированному специалисту."],["Где сохраняются мои данные?","Черновики сохраняются только в локальном хранилище браузера. Они не синхронизируются между устройствами и могут быть удалены вместе с данными браузера."],["Как работает навигатор?","Навигатор помогает выбрать раздел по ответам на вопросы. Для сложной задачи можно подготовить обращение специалисту."],["Как получить PDF или DOCX?","В конструкторе сформируйте текст. DOCX создаётся в браузере; для PDF откроется окно печати, где можно выбрать «Сохранить как PDF»."],["Можно ли загрузить Excel?","В «Моём пространстве» можно загрузить резервную копию text2me или таблицу CSV из Excel. Прямой импорт файлов Excel XLSX пока не поддерживается."]].forEach(function(pair){var d=el("details",{});d.appendChild(el("summary",{},pair[0]));d.appendChild(el("p",{},pair[1]));container.appendChild(d)});faq.appendChild(container);main.appendChild(faq)}}
function initSocialProof(){var grid=document.getElementById("catalog-cards");if(!grid)return;var n=grid.querySelectorAll("[data-search-item]").length,box=el("div",{class:"trust-stats","aria-label":"Проверяемые сведения о сервисе"});[[String(n),"направлений в стартовом каталоге"],["3","локальных конструктора документов"],["0","неподтверждённых пользовательских рейтингов"]].forEach(function(x){var c=el("div",{class:"trust-stat"});c.appendChild(el("strong",{},x[0]));c.appendChild(el("span",{},x[1]));box.appendChild(c)});var faq=document.getElementById("faq");if(faq)faq.insertAdjacentElement("beforebegin",box)}
document.addEventListener("click",function(e){var b=e.target.closest("#copy-claim,#copy-court,[data-copy-target]");if(!b)return;var target=b.id==="copy-claim"?document.getElementById("claim-output"):b.id==="copy-court"?document.getElementById("court-output"):document.getElementById(b.getAttribute("data-copy-target"));if(target){target.classList.add("copied-highlight");target.setAttribute("tabindex","0");setTimeout(function(){target.classList.remove("copied-highlight")},3500)}});
document.addEventListener("DOMContentLoaded",function(){initBrandAndFooter();initDocumentCapture();initDaDataPartyLookup();initPriorityWorkspace();installDraftAutosave();initFormImport();initExports();initAutoSaveGeneratedDocuments();initAI();initCatalogFilters();initPromptCatalog();initSuggestions();initFeedback();initSpace();initFAQAndLegal();initGlobalNavigation();initSocialProof();document.querySelectorAll("[data-template-updated]").forEach(function(x){x.textContent="Обновлено: 22.10.2026 · изменён интерфейс; правовая актуальность отдельно не подтверждена."})});
}());
/* Shared page rails, local document count, quick search and Ctrl/Cmd+K shortcut. */
(function(){
"use strict";
if(document.querySelector(".dash-shell")) return;
var main=document.querySelector("main#main"),header=document.querySelector(".site-header");
if(!main||!header) return;
var current=(location.pathname||"/").replace(/\/index\.html$/,"").replace(/\/+$/,"")||"/text2me";
var mainNav=header.querySelector(".main-nav");
if(mainNav){
var navItems=[
{label:"Главная",url:"/text2me/",match:function(){return current==="/text2me"}},
{label:"Документы",url:"/text2me/documents/",match:function(){return current.indexOf("/text2me/documents")===0}},
{label:"По ситуации",url:"/text2me/situations/",match:function(){return current.indexOf("/text2me/situations")===0||current.indexOf("/text2me/people")===0}},
{label:"Для бизнеса",url:"/text2me/business/",match:function(){return current.indexOf("/text2me/business")===0||current.indexOf("/text2me/services")===0||current.indexOf("/text2me/request")===0}},
{label:"Мои документы",url:"/text2me/space/",match:function(){return current.indexOf("/text2me/space")===0}}
];
mainNav.replaceChildren();mainNav.setAttribute("aria-label","Основная навигация");
navItems.forEach(function(item){var a=document.createElement("a");a.href=item.url;a.textContent=item.label;if(item.match())a.setAttribute("aria-current","page");mainNav.appendChild(a)});
}
var sections=[
{title:"Главная",url:"/text2me/",keys:"домой начало старт"},
{title:"Документы",url:"/text2me/documents/",keys:"договор претензия иск заявление шаблон"},
{title:"По ситуации",url:"/text2me/situations/",keys:"возврат зарплата жкх жилье банк долг проблема"},
{title:"Для бизнеса",url:"/text2me/business/",keys:"организация компания договор контрагент"},
{title:"Тексты и инструменты",url:"/text2me/prompts/",keys:"письмо инструкция текст подготовить"},
{title:"Жизненные ситуации",url:"/text2me/people/",keys:"жалоба заявление гражданин"},
{title:"Инструкции",url:"/text2me/guides/",keys:"пошагово руководство"},
{title:"База знаний",url:"/text2me/knowledge/",keys:"справка материалы объяснение"},
{title:"Официальные источники",url:"/text2me/sources/",keys:"государство официальный сайт орган"},
{title:"Мои документы",url:"/text2me/space/",keys:"сохранить черновик библиотека файлы"},
{title:"Сложная задача",url:"/text2me/request/",keys:"специалист сложная задача обращение"},
{title:"Профессиональные услуги",url:"/text2me/services/",keys:"специалист услуга бухгалтер юридический"},
{title:"Что нового",url:"/text2me/updates/",keys:"обновления изменения"},
{title:"Конфиденциальность",url:"/text2me/privacy/",keys:"данные приватность"},
{title:"Безопасность данных",url:"/text2me/security/",keys:"безопасность хранение"}
];
function railCard(title){var c=document.createElement("section");c.className="workspace-rail-card";var h=document.createElement("h2");h.textContent=title;c.appendChild(h);return c}
var left=document.createElement("aside");left.className="workspace-page-left";left.setAttribute("aria-label","Быстрый доступ");
var quick=railCard("Быстрый старт");
[["＋","Создать документ","/text2me/documents/"],["↗","Разобрать ситуацию","/text2me/situations/"],["✎","Подготовить текст","/text2me/prompts/"],["▦","Задача для бизнеса","/text2me/business/"]].forEach(function(item){var a=document.createElement("a");a.className="workspace-rail-link";a.href=item[2];var i=document.createElement("span");i.className="ws-rail-icon";i.setAttribute("aria-hidden","true");i.textContent=item[0];a.append(i,document.createTextNode(item[1]));quick.appendChild(a)});left.appendChild(quick);
var nav=railCard("Разделы сайта");sections.slice(1,10).forEach(function(s){var a=document.createElement("a");a.className="workspace-rail-link";a.href=s.url;if(current===s.url.replace(/\/+$/,""))a.setAttribute("aria-current","page");a.textContent=s.title;nav.appendChild(a)});left.appendChild(nav);
var helpful=railCard("Перед отправкой");
var checklist=document.createElement("div");checklist.className="workspace-checklist";
var checks=[
 ["dates","Проверил даты и реквизиты"],
 ["rules","Сверил порядок на официальном сайте"],
 ["copy","Сохранил копию документа"]
];
var checklistState={};
try{checklistState=JSON.parse(localStorage.getItem("text2me.preflight.v1")||"{}")||{}}catch(e){checklistState={}}
var checklistStatus=document.createElement("p");checklistStatus.className="workspace-rail-status";
function updateChecklistStatus(){var count=checks.filter(function(item){return !!checklistState[item[0]]}).length;checklistStatus.textContent="Проверено: "+count+" из "+checks.length}
checks.forEach(function(item){
 var label=document.createElement("label");label.className="workspace-check-item";
 var input=document.createElement("input");input.type="checkbox";input.checked=!!checklistState[item[0]];
 var text=document.createElement("span");text.textContent=item[1];
 input.addEventListener("change",function(){checklistState[item[0]]=input.checked;try{localStorage.setItem("text2me.preflight.v1",JSON.stringify(checklistState))}catch(e){}updateChecklistStatus()});
 label.append(input,text);checklist.appendChild(label);
});
helpful.append(checklist,checklistStatus);
var sourceLink=document.createElement("a");sourceLink.className="workspace-rail-link";sourceLink.href="/text2me/sources/";sourceLink.textContent="Открыть официальные источники →";helpful.appendChild(sourceLink);
var docsLink=document.createElement("a");docsLink.className="workspace-rail-link";docsLink.href="/text2me/space/";docsLink.textContent="Перейти к сохранённым документам →";helpful.appendChild(docsLink);
updateChecklistStatus();
left.appendChild(helpful);
var right=document.createElement("aside");right.className="workspace-page-right";right.setAttribute("aria-label","Мои документы и инструменты");
var search=document.createElement("section");search.className="workspace-rail-search";var label=document.createElement("label");label.htmlFor="workspace-rail-search-input";label.textContent="Быстрый поиск";var input=document.createElement("input");input.id="workspace-rail-search-input";input.type="search";input.placeholder="Документ, тема, действие…";input.autocomplete="off";var status=document.createElement("div");status.className="workspace-rail-status";status.setAttribute("aria-live","polite");status.textContent="Поиск по разделам сайта · Ctrl+K";var results=document.createElement("div");results.className="workspace-rail-results";search.append(label,input,status,results);right.appendChild(search);
var saved=railCard("Мои документы"),savedStatus=document.createElement("p"),savedLink=document.createElement("a");savedStatus.className="workspace-rail-status";savedLink.className="workspace-rail-primary";savedLink.href="/text2me/space/";savedLink.textContent="Открыть библиотеку →";
try{var docs=JSON.parse(localStorage.getItem("text2me.space.v1")||"[]"),drafts=JSON.parse(localStorage.getItem("text2me.drafts.v1")||"{}");var active=Array.isArray(docs)?docs.filter(function(x){return x&&!x.archived}).length:0;savedStatus.textContent=active+" сохранённых документов · "+Object.keys(drafts||{}).length+" черновиков. Только в этом браузере."}catch(e){savedStatus.textContent="Черновики и файлы сохраняются локально в браузере."}
saved.append(savedStatus,savedLink);right.appendChild(saved);
var tools=railCard("Полезные инструменты");
[["Каталог документов","/text2me/documents/"],["Пошаговые инструкции","/text2me/guides/"],["База знаний","/text2me/knowledge/"],["Официальные источники","/text2me/sources/"],["Помощь и обновления","/text2me/updates/"]].forEach(function(item){var a=document.createElement("a");a.className="workspace-rail-link";a.href=item[1];a.textContent=item[0];tools.appendChild(a)});
var note=document.createElement("p");note.className="workspace-rail-note";note.textContent="Доступны 3 конструктора документов. Аккаунты и облачная синхронизация пока не подключены.";tools.appendChild(note);right.appendChild(tools);
var layout=document.createElement("div");layout.className="workspace-page-layout";main.classList.add("workspace-page-main");main.parentNode.insertBefore(layout,main);layout.append(left,main,right);
var footer=document.querySelector("footer");if(footer)footer.classList.add("workspace-page-footer");
function runSearch(){var q=input.value.trim().toLocaleLowerCase("ru");results.replaceChildren();if(q.length<2){status.textContent=q?"Введите ещё хотя бы один символ.":"Поиск по разделам сайта · Ctrl+K";return}var terms=q.split(/\s+/).filter(Boolean);var found=sections.map(function(s){var hay=(s.title+" "+s.keys).toLocaleLowerCase("ru");return{s:s,score:terms.reduce(function(n,t){return n+(hay.indexOf(t)!==-1?1:0)},0)}}).filter(function(x){return x.score>0}).sort(function(a,b){return b.score-a.score}).slice(0,5);if(!found.length){status.textContent="Совпадений нет. Попробуйте: договор, возврат, зарплата, письмо.";return}status.textContent="Подходящие разделы: "+found.length;found.forEach(function(x){var a=document.createElement("a");a.href=x.s.url;a.textContent=x.s.title;results.appendChild(a)})}
input.addEventListener("input",runSearch);
document.addEventListener("keydown",function(e){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();input.focus();input.select()}if(e.key==="Escape"&&document.activeElement===input){input.value="";results.replaceChildren();status.textContent="Поиск очищен.";input.blur()}});
})();
/* Persistent service description shared by every page. */
(function(){
"use strict";
function installSiteDescription(){
 if(document.getElementById("text2me-site-description"))return;
 var header=document.querySelector(".site-header, .dash-header");
 if(!header)return;
 var band=document.createElement("section");
 band.id="text2me-site-description";
 band.className="text2me-site-description";
 band.setAttribute("aria-label","О text2me");
 var inner=document.createElement("div");inner.className="text2me-site-description-inner";
 var title=document.createElement("strong");title.textContent="От задачи — к документу и следующему шагу.";
 var description=document.createElement("p");description.textContent="text2me помогает разобраться в ситуации, найти подходящие документы, шаблоны, инструкции и официальные источники, а также подготовить рабочий текст для личных и деловых задач.";
 inner.append(title,description);band.appendChild(inner);
 header.insertAdjacentElement("afterend",band);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",installSiteDescription);else installSiteDescription();
})();

/* Full-width section navigation: the links span the entire workspace, including both rails. */
(function(){
"use strict";
function installFullWidthSectionNav(){
 if(document.getElementById("text2me-section-strip"))return;
 var header=document.querySelector(".site-header, .dash-header");
 if(!header)return;
 var strip=document.createElement("nav");
 strip.id="text2me-section-strip";
 strip.className="text2me-section-strip";
 if(header.classList.contains("dash-header"))strip.classList.add("text2me-section-strip-home");
 strip.setAttribute("aria-label","Основные разделы сайта");
 var links=[
 ["Главная","/text2me/"],
 ["Жизненные ситуации","/text2me/situations/"],
 ["Документы и шаблоны","/text2me/documents/"],
 ["Тексты и инструменты","/text2me/prompts/"],
 ["Инструкции","/text2me/guides/"],
 ["Для бизнеса","/text2me/business/"],
 ["Официальные источники","/text2me/sources/"],
 ["Мои документы","/text2me/space/"]
 ];
 var current=(location.pathname||"/").replace(/index\.html$/,"").replace(/\/+$/,"")||"/text2me";
 links.forEach(function(item){
  var a=document.createElement("a");a.href=item[1];a.textContent=item[0];
  var target=item[1].replace(/\/+$/,"")||"/text2me";
  if(current===target||(target==="/text2me"&&current==="/text2me"))a.setAttribute("aria-current","page");
  strip.appendChild(a);
 });
 var description=document.getElementById("text2me-site-description");
 (description||header).insertAdjacentElement("afterend",strip);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",installFullWidthSectionNav);else installFullWidthSectionNav();
})();
