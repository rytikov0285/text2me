(function(){
"use strict";
var PROFILE_KEY="text2me.party-profiles.v1",REGISTRY_KEY="text2me.document-registry.v1",SEQ_KEY="text2me.document-sequence.v1";
function read(k,f){try{var x=localStorage.getItem(k);return x?JSON.parse(x):f}catch(e){return f}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function el(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
function btn(text,fn){var b=el("button","button button-outline",text);b.type="button";b.addEventListener("click",fn);return b}
function installProfiles(){
 var forms=Array.from(document.forms).filter(function(f){return !f.matches('[role="search"]')&&!f.querySelector('input[type="search"]')&&f.querySelector("input:not([type=hidden]),textarea")});
 forms.forEach(function(form){
  if(form.dataset.t2mProfiles==="1")return;form.dataset.t2mProfiles="1";
  var wrap=el("details","t2m-profile-tools");var sum=el("summary","","Подставить сохранённые реквизиты");wrap.appendChild(sum);
  var note=el("p","t2m-profile-note","Профили сохраняются только в этом браузере. Не сохраняйте здесь сведения, которыми не хотите делиться с другими пользователями устройства.");wrap.appendChild(note);
  var row=el("div","t2m-profile-row");var select=el("select","");select.setAttribute("aria-label","Сохранённый профиль");var empty=el("option","","Выберите профиль");empty.value="";select.appendChild(empty);
  var profiles=read(PROFILE_KEY,[]);if(!Array.isArray(profiles))profiles=[];
  profiles.forEach(function(p,i){var o=el("option","",p.name||("Профиль "+(i+1)));o.value=p.id;select.appendChild(o)});
  var apply=btn("Заполнить форму",function(){var p=read(PROFILE_KEY,[]).find(function(x){return x.id===select.value});if(!p)return;var count=0;
   Array.from(form.elements).forEach(function(field){if(!field.name&&!field.id&&!field.labels?.length)return;if(!("value" in field)||field.type==="hidden"||field.type==="submit"||field.type==="button")return;var key=((field.name||"")+" "+(field.id||"")+" "+(field.labels?Array.from(field.labels).map(function(l){return l.textContent}).join(" "):"")+" "+(field.placeholder||"")).toLowerCase();var val;
    if(/inn|инн|tax.?id/.test(key))val=p.inn;
    else if(/email|электронн.*почт|e-mail/.test(key))val=p.email;
    else if(/phone|телефон|мобильн/.test(key))val=p.phone;
    else if(/address|адрес|местонахожд|место жительств/.test(key))val=p.address;
    else if(/company|организац|юридическ.*лиц|работодатель|наименован.*организац/.test(key))val=p.company;
    else if(/surname|last.?name|фамил/.test(key))val=p.surname;
    else if(/firstname|first.?name|имя заявител|имя контакт/.test(key))val=p.firstName;
    else if(/patronymic|middle.?name|отчеств/.test(key))val=p.patronymic;
    else if(/fio|full.?name|фио|заявитель|от кого|представител/.test(key))val=[p.surname,p.firstName,p.patronymic].filter(Boolean).join(" ")||p.company;
    if(val&&!String(field.value||"").trim()){field.value=val;field.dispatchEvent(new Event("input",{bubbles:true}));field.dispatchEvent(new Event("change",{bubbles:true}));count++}
   });var result=wrap.querySelector(".t2m-profile-result");if(!result){result=el("p","t2m-profile-result");wrap.appendChild(result)}result.textContent=count?"Заполнено полей: "+count+". Проверьте каждое значение.":"Подходящих пустых полей не найдено; заполните их вручную.";
  });
  var save=btn("Сохранить профиль из формы",function(){var p={id:"p"+Date.now().toString(36),name:"",company:"",inn:"",surname:"",firstName:"",patronymic:"",address:"",phone:"",email:""};Array.from(form.elements).forEach(function(field){if(!("value" in field)||!field.value.trim())return;var key=((field.name||"")+" "+(field.id||"")+" "+(field.labels?Array.from(field.labels).map(function(l){return l.textContent}).join(" "):"")+" "+(field.placeholder||"")).toLowerCase(),v=field.value.trim();if(/inn|инн|tax.?id/.test(key))p.inn=v;else if(/email|электронн.*почт|e-mail/.test(key))p.email=v;else if(/phone|телефон|мобильн/.test(key))p.phone=v;else if(/address|адрес|местонахожд|место жительств/.test(key))p.address=v;else if(/company|организац|юридическ.*лиц|работодатель|наименован.*организац/.test(key))p.company=v;else if(/surname|last.?name|фамил/.test(key))p.surname=v;else if(/firstname|first.?name|имя заявител|имя контакт/.test(key))p.firstName=v;else if(/patronymic|middle.?name|отчеств/.test(key))p.patronymic=v;else if(/fio|full.?name|фио|заявитель|от кого|представител/.test(key)){var a=v.split(/\s+/);p.surname=a[0]||"";p.firstName=a[1]||"";p.patronymic=a.slice(2).join(" ")}});
   p.name=window.prompt("Название профиля (например, «Мои реквизиты» или название организации):",p.company||[p.surname,p.firstName,p.patronymic].filter(Boolean).join(" ")||"Мои реквизиты");if(!p.name)return;
   if(!p.inn&&!p.email&&!p.phone&&!p.address&&!p.company&&!p.surname&&!p.firstName){window.alert("Не найдено распознаваемых реквизитов. Заполните поля и попробуйте снова.");return}
   var all=read(PROFILE_KEY,[]);all.push(p);if(!write(PROFILE_KEY,all)){window.alert("Не удалось сохранить профиль: хранилище браузера недоступно.");return}var option=el("option","",p.name);option.value=p.id;select.appendChild(option);select.value=p.id;window.alert("Профиль сохранён локально. Он не проверен по государственным справочникам.");
  });
  row.append(select,apply,save);wrap.appendChild(row);form.insertAdjacentElement("beforebegin",wrap);
 });
}
function installRegistry(){
 var main=document.querySelector(".lifecycle-wrap");if(!main||document.querySelector(".t2m-registry"))return;
 var section=el("section","lifecycle-section t2m-registry");section.id="document-registry";section.appendChild(el("h2","","8. Локальный реестр документов — рабочий прототип"));
 section.appendChild(el("p","","Создавайте регистрационные карточки, назначайте локальные номера, фиксируйте статус и срок. Данные доступны только в этом браузере; это не корпоративный реестр и не юридически значимая регистрация."));
 var form=el("form","t2m-registry-form");
 function field(label,type,name,placeholder){var l=el("label","t2m-registry-field",label),i=document.createElement(type==="textarea"?"textarea":"input");if(type!=="textarea"&&type!=="select")i.type=type;i.name=name;i.placeholder=placeholder||"";if(name==="title")i.required=true;l.appendChild(i);return l}
 form.append(field("Название документа","text","title","Например, претензия по договору"),field("Автор / ответственный","text","author","ФИО или подразделение"),field("Статус","select","status",""));var st=form.querySelector('select[name="status"]');["Черновик","На согласовании","Согласован","Подписан","Отправлен","Исполняется","Исполнен","В архиве","Аннулирован"].forEach(function(v){var o=el("option","",v);o.value=v;st.appendChild(o)});
 form.append(field("Дата документа","date","date",""),field("Срок / контрольная дата","date","due",""),field("Место хранения / ссылка","text","location","Путь или ссылка"),field("Примечание","textarea","notes","Приложения, версия, срок хранения"));
 var submit=el("button","button button-primary","Зарегистрировать локально");submit.type="submit";form.appendChild(submit);section.appendChild(form);
 var output=el("div","t2m-registry-list");section.appendChild(output);
 function render(){output.replaceChildren();var docs=read(REGISTRY_KEY,[]);if(!docs.length){output.appendChild(el("p","t2m-registry-empty","Реестр пока пуст."));return}
 var table=document.createElement("table");table.className="lifecycle-table";var thead=document.createElement("thead"),tr=document.createElement("tr");["Номер","Документ","Статус","Срок","Действия"].forEach(function(t){tr.appendChild(el("th","",t))});thead.appendChild(tr);table.appendChild(thead);var body=document.createElement("tbody");
 docs.slice().reverse().forEach(function(d){var row=document.createElement("tr");[d.number,d.title,d.status,d.due||"—"].forEach(function(v){row.appendChild(el("td","",v||"—"))});var td=el("td","");var del=btn("Удалить",function(){if(!window.confirm("Удалить локальную карточку "+d.number+"?"))return;write(REGISTRY_KEY,read(REGISTRY_KEY,[]).filter(function(x){return x.id!==d.id}));render()});td.appendChild(del);row.appendChild(td);body.appendChild(row)});table.appendChild(body);output.appendChild(table)}
 form.addEventListener("submit",function(e){e.preventDefault();var fd=new FormData(form),title=String(fd.get("title")||"").trim();if(!title)return;var seq=read(SEQ_KEY,0)+1;var year=new Date().getFullYear(),number="T2M-"+year+"-"+String(seq).padStart(5,"0");var d={id:"r"+Date.now().toString(36),number:number,title:title,author:String(fd.get("author")||""),status:String(fd.get("status")||"Черновик"),date:String(fd.get("date")||""),due:String(fd.get("due")||""),location:String(fd.get("location")||""),notes:String(fd.get("notes")||""),createdAt:new Date().toISOString()};var docs=read(REGISTRY_KEY,[]);docs.push(d);if(!write(SEQ_KEY,seq)||!write(REGISTRY_KEY,docs)){window.alert("Не удалось сохранить запись в браузере.");return}form.reset();render()});
 section.appendChild(el("p","lifecycle-note","Нумерация локальная и может совпасть на другом устройстве или после очистки данных. Не используйте этот номер как официальный регистрационный номер организации."));
 main.appendChild(section);render();
}
function styles(){var s=el("style","");s.textContent=".t2m-profile-tools{margin:12px 0;padding:13px;border:1px solid #d8e0e8;border-radius:10px;background:#f8fafc}.t2m-profile-tools summary{font-weight:750;cursor:pointer;color:#174b7d}.t2m-profile-note,.t2m-profile-result{font-size:13px;color:#536477;line-height:1.5}.t2m-profile-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.t2m-profile-row select{min-width:180px;max-width:100%;padding:10px;border:1px solid #cbd5df;border-radius:8px;background:white}.t2m-registry-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:16px 0}.t2m-registry-field{display:grid;gap:5px;font-size:14px;font-weight:700}.t2m-registry-field input,.t2m-registry-field select,.t2m-registry-field textarea{width:100%;min-width:0;padding:10px;border:1px solid #cbd5df;border-radius:8px;font:inherit;font-weight:400;background:#fff}.t2m-registry-field:has(textarea){grid-column:1/-1}.t2m-registry-form button{justify-self:start}.t2m-registry-list{overflow-x:auto}.t2m-registry-list table{min-width:700px}@media(max-width:650px){.t2m-registry-form{grid-template-columns:1fr}.t2m-registry-field:has(textarea){grid-column:auto}}";document.head.appendChild(s)}
function start(){styles();installProfiles();installRegistry()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();