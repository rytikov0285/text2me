(function(){
"use strict";
function readLocal(k,f){try{var v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}}
function install(){
 var host=document.getElementById("space-app");if(!host)return;
 var storeKey="text2me.space.v1",draftKey="text2me.drafts.v1",panel=document.createElement("section");
 panel.className="space-dashboard";panel.setAttribute("aria-label","Сводка по документам и черновикам");
 function missing(d){
  var data=d&&d.data||{},required=[];
  if(d&&d.form==="court-builder")required=["plaintiff-name","defendant-name","court-case-type","court-facts","court-demands"];
  else if(d&&d.form==="claim-builder")required=["seller","buyer","product","defect","demand"];else if(d&&d.form==="rental-builder")required=["landlord","tenant","property-address","start-date","end-date","rent"];
  else return [];
  return required.filter(function(k){return !String(data[k]||"").trim()});
 }
 function refresh(){
  var docs=readLocal(storeKey,[]);if(!Array.isArray(docs))docs=[];
  var drafts=readLocal(draftKey,{});if(!drafts||typeof drafts!=="object")drafts={};
  var values=Object.keys(drafts).map(function(k){var d=drafts[k]||{};d._key=k;return d});
  var incomplete=values.filter(function(d){return missing(d).length>0});
  panel.innerHTML="";
  var metrics=document.createElement("div");metrics.className="space-dashboard-grid";
  [[docs.filter(function(d){return !d.archived}).length,"Документов в работе","Сохранённые документы вне архива"],[values.length,"Черновиков форм","Автосохранённые формы на этом устройстве"],[incomplete.length,"Требуют проверки","В известных обязательных полях есть пропуски"]].forEach(function(x){
   var card=document.createElement("article");card.className="space-metric";var strong=document.createElement("strong");strong.textContent=String(x[0]);var title=document.createElement("span");title.textContent=x[1];var note=document.createElement("small");note.textContent=x[2];card.append(strong,title,note);metrics.appendChild(card)
  });
  panel.appendChild(metrics);
  var warnings=document.createElement("div");warnings.className="space-dashboard-notice";
  if(!values.length){warnings.textContent="Пока нет автосохранённых черновиков. Откройте конструктор документа и начните заполнять форму."}
  else if(incomplete.length){warnings.textContent="Есть черновики с незаполненными обязательными полями. Откройте вкладку «Автосохранённые формы» и проверьте: "+incomplete.map(function(d){return d.form==="court-builder"?"Исковое заявление":d.form==="claim-builder"?"Претензия продавцу":d.form==="rental-builder"?"Договор найма жилья":d.form||"форма"}).join(", ")+". Проверка охватывает известные поля и не является юридической проверкой."}
  else{warnings.textContent="Автосохранённые черновики найдены. Перед использованием откройте форму и проверьте все данные и требования."}
  panel.appendChild(warnings);
  host.querySelectorAll(".space-doc").forEach(function(card){
   var h=card.querySelector("h3");if(!h)return;
   var old=card.querySelector(".space-item-status");if(old)old.remove();
   var status=document.createElement("span");status.className="space-item-status";
   if(h.textContent.indexOf("Черновик формы:")===0){
    var formName=h.textContent.replace("Черновик формы: ",""),d=values.find(function(v){return v.form===formName});
    var n=missing(d);status.textContent=n.length?"Есть пропуски: "+n.length:"Автосохранён · проверьте перед использованием";status.setAttribute("data-status",n.length?"warning":"saved");
   }else{status.textContent=card.innerText.indexOf("Архив")>=0?"В архиве":"Сохранён";status.setAttribute("data-status","saved")}
   h.insertAdjacentElement("afterend",status)
  })
  renderFileVault();
 }
 function renderFileVault(){var old=panel.querySelector(".space-file-vault");if(!old){old=document.createElement("section");old.className="space-file-vault";panel.appendChild(old)}if(!window.Text2MeFileVault||!window.Text2MeFileVault.list){old.hidden=true;return}window.Text2MeFileVault.list().then(function(files){old.replaceChildren();var heading=document.createElement("h2");heading.textContent="Загруженные файлы";old.appendChild(heading);if(!files.length){var empty=document.createElement("p");empty.className="space-file-intro";empty.textContent="Пока нет загруженных файлов. Выберите «Загрузить файл» в верхней части сайта.";old.appendChild(empty);return}var intro=document.createElement("p");intro.className="space-file-intro";intro.textContent="Файлы сохранены автоматически в этом браузере.";old.appendChild(intro);files.forEach(function(file){var row=document.createElement("article");row.className="space-file-row";var meta=document.createElement("div");meta.className="space-file-meta";var name=document.createElement("strong");name.textContent=file.name||"Загруженный файл";var details=document.createElement("small");details.textContent=Math.max(1,Math.round((file.size||0)/1024))+" КБ · "+new Date(file.savedAt||Date.now()).toLocaleDateString("ru-RU");meta.append(name,details);var actions=document.createElement("div");actions.className="space-file-actions";function addFileAction(label,open){var b=document.createElement("button");b.type="button";b.className="button button-small button-outline";b.textContent=label;b.addEventListener("click",function(){if(!file.blob)return;var url=URL.createObjectURL(file.blob);if(open){var w=window.open(url,"_blank");if(!w){var a=document.createElement("a");a.href=url;a.download=file.name||"document";a.click()}}else{var a=document.createElement("a");a.href=url;a.download=file.name||"document";document.body.appendChild(a);a.click();a.remove()}setTimeout(function(){URL.revokeObjectURL(url)},60000)});actions.appendChild(b)}addFileAction("Открыть",true);addFileAction("Скачать",false);var del=document.createElement("button");del.type="button";del.className="button button-small button-outline";del.textContent="Удалить";del.addEventListener("click",function(){window.Text2MeFileVault.remove(file.id).then(renderFileVault).catch(function(){details.textContent="Не удалось удалить файл."})});actions.appendChild(del);row.append(meta,actions);old.appendChild(row)})}).catch(function(){old.replaceChildren();var heading=document.createElement("h2");heading.textContent="Загруженные файлы";var note=document.createElement("p");note.className="space-file-intro";note.textContent="Локальное хранилище файлов недоступно в этом браузере.";old.append(heading,note)})}
 host.insertAdjacentElement("beforebegin",panel);
 refresh();
 renderFileVault();
 window.addEventListener("text2me:file-vault-changed",renderFileVault);
 if(window.MutationObserver){new MutationObserver(refresh).observe(host,{childList:true})}
 window.addEventListener("storage",refresh);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install);else install();
})();