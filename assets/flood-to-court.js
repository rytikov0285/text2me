(function(){
"use strict";
var KEY="text2me.flood.workflow.v1";
function get(id){return document.getElementById(id)}
function value(id){var n=get(id);return n&&typeof n.value==="string"?n.value.trim():""}
function setIfEmpty(id,text){var n=get(id);if(!n||value(id)||!String(text||"").trim())return false;n.value=String(text).trim();n.dispatchEvent(new Event("input",{bubbles:true}));n.dispatchEvent(new Event("change",{bubbles:true}));return true}
function dateRu(s){if(!s)return "";var p=s.split("-");return p.length===3?p[2]+"."+p[1]+"."+p[0]:s}
function init(){
 var form=get("court-builder");if(!form)return;
 var data;try{data=JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){data=null}
 if(!data||typeof data!=="object")return;
 var box=document.createElement("section");box.className="changes-box flood-court-transfer";box.setAttribute("aria-labelledby","flood-court-transfer-title");
 var h=document.createElement("h2");h.id="flood-court-transfer-title";h.textContent="Продолжить сценарий затопления квартиры";
 var p=document.createElement("p");p.textContent="В этом браузере найдены сохранённые данные сценария. Можно перенести их в черновик иска. Заполняются только пустые поля; ничего не отправляется на сервер.";
 var button=document.createElement("button");button.type="button";button.className="button button-outline";button.textContent="Перенести данные в черновик";
 var status=document.createElement("p");status.className="field-help";status.setAttribute("aria-live","polite");
 box.append(h,p,button,status);form.parentNode.insertBefore(box,form);
 button.addEventListener("click",function(){
  var facts=[];
  if(data["f-date"])facts.push("Дата затопления: "+dateRu(data["f-date"])+".");
  if(data["f-address"])facts.push("Адрес помещения: "+data["f-address"]+".");
  if(data["f-role"])facts.push("Заявитель указывает свой статус: "+data["f-role"]+".");
  if(data["f-cause"])facts.push("Предполагаемая причина по сведениям заявителя: "+data["f-cause"]+". Причина требует проверки и не считается установленной только на основании этих сведений.");
  if(data["f-damage"])facts.push("Описанные повреждения: "+data["f-damage"]+".");
  if(data["f-ticket"])facts.push("Номер обращения в аварийную службу: "+data["f-ticket"]+".");
  if(data["claim-evidence"])facts.push("Материалы, указанные пользователем: "+data["claim-evidence"]+".");
  if(data["claim-act-date"])facts.push("Дата акта о заливе: "+dateRu(data["claim-act-date"])+".");
  if(data["claim-estimate-date"])facts.push("Дата отчёта об оценке: "+dateRu(data["claim-estimate-date"])+".");
  var pre=[];
  if(data["claim-sent-date"])pre.push("Дата отправки претензии: "+dateRu(data["claim-sent-date"])+".");
  if(data["claim-response"])pre.push("Ответ на претензию по сведениям заявителя: "+data["claim-response"]+".");
  var attachments=[];
  if(data["c-photos"])attachments.push("фото- и видеоматериалы повреждений");
  if(data["c-act"])attachments.push("акт о заливе (проверьте, что он получен и будет приложен)");
  if(data["claim-evidence"])attachments.push(data["claim-evidence"]);
  var count=0;
  count+=setIfEmpty("plaintiff-name",data["f-name"])?1:0;
  count+=setIfEmpty("plaintiff-address",data["f-address"])?1:0;
  count+=setIfEmpty("defendant-name",data["claim-recipient"])?1:0;
  count+=setIfEmpty("court-price",data["claim-amount"])?1:0;
  count+=setIfEmpty("court-case-type","о взыскании ущерба, причинённого затоплением квартиры")?1:0;
  count+=setIfEmpty("court-facts",facts.join("\n"))?1:0;
  count+=setIfEmpty("court-pretrial",pre.join("\n"))?1:0;
  count+=setIfEmpty("court-attachments",attachments.join("\n"))?1:0;
  status.textContent=count?"Перенесено полей: "+count+". Проверьте каждое поле, укажите надлежащего ответчика, суд, требования и правовые основания. Перенос не подтверждает ответственность или размер ущерба.":"Все соответствующие поля уже заполнены либо в сценарии нет данных для переноса. Существующие значения не изменены.";
 });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();