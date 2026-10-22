(function(){
"use strict";
var STORAGE_KEY="text2me.partyProfiles.v1";
var roles=[
 {form:"claim-builder",role:"seller",title:"Продавец",name:"seller-name",address:"seller-address",inn:"seller-inn"},
 {form:"rental-builder",role:"landlord",title:"Арендодатель",name:"rental-landlord",address:"rental-address",inn:"rental-inn"},
 {form:"court-builder",role:"plaintiff",title:"Истец",name:"plaintiff-name",address:"plaintiff-address",inn:"plaintiff-inn"},
 {form:"court-builder",role:"defendant",title:"Ответчик",name:"defendant-name",address:"defendant-address",inn:"defendant-inn"}
];
function readProfiles(){try{var data=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");return Array.isArray(data)?data.filter(function(p){return p&&typeof p.id==="string"&&typeof p.name==="string"}):[]}catch(e){return []}}
function writeProfiles(items){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(items));return true}catch(e){return false}}
function node(tag,attrs,text){var n=document.createElement(tag);Object.keys(attrs||{}).forEach(function(k){if(k==="class")n.className=attrs[k];else n.setAttribute(k,attrs[k])});if(text!==undefined)n.textContent=text;return n}
function field(form,id){return id?form.querySelector("#"+id):null}
function initRole(config){
 var form=document.getElementById(config.form);if(!form)return;
 var nameField=field(form,config.name);if(!nameField)return;
 var marker=form.querySelector(".form-grid");if(!marker)return;
 var panel=node("section",{class:"party-profile-panel","aria-label":"Карточка участника: "+config.title});
 panel.appendChild(node("h3",{},"Карточка: "+config.title));
 panel.appendChild(node("p",{class:"party-profile-note"},"Сохраните часто используемые реквизиты в этом браузере или выберите ранее сохранённую карточку. Сведения не отправляются на сервер. ИНН хранится локально — не сохраняйте его на чужом устройстве."));
 var selectLabel=node("label",{class:"party-profile-select-label"},"Сохранённые карточки");
 var select=node("select",{"aria-label":"Сохранённые карточки участника"});select.appendChild(node("option",{value:""},"Выберите карточку…"));selectLabel.appendChild(select);panel.appendChild(selectLabel);
 var nameInput=node("input",{type:"text",maxlength:"100",placeholder:"Например, ООО «Пример»","aria-label":"Название карточки"});
 var nameLabel=node("label",{class:"party-profile-name-label"},"Название карточки");nameLabel.appendChild(nameInput);panel.appendChild(nameLabel);
 var actions=node("div",{class:"party-profile-actions"});
 var save=node("button",{type:"button",class:"button"},"Сохранить текущие реквизиты");
 var apply=node("button",{type:"button",class:"button button-outline"},"Подставить выбранную карточку");
 var remove=node("button",{type:"button",class:"button button-outline"},"Удалить карточку");
 actions.appendChild(save);actions.appendChild(apply);actions.appendChild(remove);panel.appendChild(actions);
 var status=node("p",{class:"party-profile-status","aria-live":"polite"},"Сохраняются только название, адрес и ИНН. СНИЛС и другие поля не копируются.");
 panel.appendChild(status);marker.parentNode.insertBefore(panel,marker);
 function refresh(selectId){var profiles=readProfiles().filter(function(p){return true});select.textContent="";select.appendChild(node("option",{value:""},"Выберите карточку…"));profiles.forEach(function(p){select.appendChild(node("option",{value:p.id},p.label||p.name))});if(selectId)select.value=selectId;updateLabel()}
 function selected(){return readProfiles().find(function(p){return p.id===select.value})}
 function updateLabel(){var p=selected();if(p&&!nameInput.value)nameInput.value=p.label||p.name}
 select.addEventListener("change",function(){var p=selected();nameInput.value=p?(p.label||p.name):"";status.textContent=p?"Выбрана карточка. Перед подстановкой проверьте, что это нужный участник.":"Выберите сохранённую карточку."});
 save.addEventListener("click",function(){
 var name=(nameField.value||"").trim(),address=(field(form,config.address)&&field(form,config.address).value||"").trim(),inn=(field(form,config.inn)&&field(form,config.inn).value||"").replace(/\D/g,"");
 if(!name){status.textContent="Сначала укажите имя или наименование участника.";nameField.focus();return}
 if(inn&&!/^\d{10}(\d{2})?$/.test(inn)){status.textContent="ИНН должен содержать 10 или 12 цифр.";field(form,config.inn).focus();return}
 var label=(nameInput.value||"").trim()||name,items=readProfiles(),existing=selected(),record={id:existing?existing.id:"party-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8),role:existing?existing.role:config.role,label:label,name:name,address:address,inn:inn,updatedAt:new Date().toISOString()};
 if(existing)items=items.filter(function(p){return p.id!==existing.id});items.unshift(record);items=items.slice(0,50);
 if(!writeProfiles(items)){status.textContent="Не удалось сохранить карточку: проверьте настройки хранения браузера.";return}
 refresh(record.id);status.textContent="Карточка сохранена в локальном хранилище этого браузера.";
 });
 apply.addEventListener("click",function(){
 var p=selected();if(!p){status.textContent="Сначала выберите карточку.";return}
 nameField.value=p.name||"";nameField.dispatchEvent(new Event("input",{bubbles:true}));nameField.dispatchEvent(new Event("change",{bubbles:true}));
 var addressField=field(form,config.address);if(addressField){addressField.value=p.address||"";addressField.dispatchEvent(new Event("input",{bubbles:true}));addressField.dispatchEvent(new Event("change",{bubbles:true}))}
 var innField=field(form,config.inn);if(innField){innField.value=p.inn||"";innField.dispatchEvent(new Event("input",{bubbles:true}));innField.dispatchEvent(new Event("change",{bubbles:true}))}
 status.textContent="Реквизиты подставлены. Проверьте их и исправьте при необходимости.";
 });
 remove.addEventListener("click",function(){var p=selected();if(!p){status.textContent="Выберите карточку для удаления.";return}if(!window.confirm("Удалить карточку «"+(p.label||p.name)+"» из этого браузера?"))return;var items=readProfiles().filter(function(x){return x.id!==p.id});if(!writeProfiles(items)){status.textContent="Не удалось удалить карточку.";return}nameInput.value="";refresh();status.textContent="Карточка удалена из локального хранилища этого браузера."});
 refresh();
}
function init(){roles.forEach(initRole)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();