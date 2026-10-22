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
 }
 host.insertAdjacentElement("beforebegin",panel);
 refresh();
 if(window.MutationObserver){new MutationObserver(refresh).observe(host,{childList:true})}
 window.addEventListener("storage",refresh);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install);else install();
})();