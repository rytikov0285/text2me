(function(){
"use strict";
var KEY="text2me.workspace.core.v1";
function safeParse(key,fallback){try{var v=JSON.parse(localStorage.getItem(key)||"null");return v==null?fallback:v}catch(e){return fallback}}
function now(){return new Date().toISOString()}
function uid(prefix){return (prefix||"w")+Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function empty(){return {version:1,updatedAt:now(),cases:[],contacts:[],documents:[],tasks:[],events:[],activity:[],migrations:{}}}
function read(){var x=safeParse(KEY,null);if(!x||x.version!==1)return migrate();var changed=ensureLinkedDocuments(x);if(normalizeRelations(x))changed=true;if(changed)write(x);return x}
function write(x){x.updatedAt=now();try{localStorage.setItem(KEY,JSON.stringify(x));window.dispatchEvent(new CustomEvent("text2me:workspace-updated",{detail:{updatedAt:x.updatedAt}}));return true}catch(e){return false}}
function byId(a,id){return a.find(function(x){return x.id===id})}
function validContactIds(x,ids){var known=new Set((x.contacts||[]).map(function(c){return c.id}));return Array.from(new Set((Array.isArray(ids)?ids:[]).filter(function(id){return known.has(id)})))}
function resolveDocumentId(x,id){if(!id)return "";if(byId(x.documents,id))return id;var d=(x.documents||[]).find(function(o){return o.libraryId===id||o.libraryDocumentId===id});return d?d.id:""}
function normalizeRelations(x){
 var changed=false,caseIds=new Set((x.cases||[]).map(function(o){return o.id})),contactIds=new Set((x.contacts||[]).map(function(o){return o.id}));
 (x.cases||[]).forEach(function(c){var ids=validContactIds(x,c.contactIds);if(JSON.stringify(ids)!==JSON.stringify(c.contactIds||[])){c.contactIds=ids;changed=true}});
 ["documents","tasks","events"].forEach(function(k){
  (x[k]||[]).forEach(function(o){
   if(!o.caseId&&(o.caseName||o.case)){var name=String(o.caseName||o.case).trim().toLocaleLowerCase("ru"),match=x.cases.find(function(c){return String(c.title||c.name||"").trim().toLocaleLowerCase("ru")===name});if(match){o.caseId=match.id;changed=true}}
   if(o.caseId&&!caseIds.has(o.caseId)){o.caseId="";changed=true}
   if(k!=="documents"&&o.documentId){var resolved=resolveDocumentId(x,o.documentId);if(resolved!==o.documentId){o.documentId=resolved;changed=true}}
   var ids=validContactIds(x,o.contactIds);
   if(!ids.length&&(o.contactName||o.contact)){var name=String(o.contactName||o.contact).trim().toLocaleLowerCase("ru"),match=x.contacts.find(function(c){return String(c.name||c.title||"").trim().toLocaleLowerCase("ru")===name});if(match)ids=[match.id]}
   if(JSON.stringify(ids)!==JSON.stringify(o.contactIds||[])){o.contactIds=ids;changed=true}
  })
 });
 var taskIds=new Set((x.tasks||[]).map(function(t){return t.id}));
 (x.documents||[]).forEach(function(d){if(d.followupTaskId&&!taskIds.has(d.followupTaskId)){d.followupTaskId="";changed=true}});
 return changed
}
function log(x,action,entity){x.activity.unshift({id:uid("a"),action:action,entityId:entity&&entity.id||"",entityType:entity&&entity.type||"",at:now()});x.activity=x.activity.slice(0,500)}
function upsert(list,obj){var i=list.findIndex(function(x){return x.id===obj.id});if(i<0)list.unshift(obj);else list[i]=Object.assign({},list[i],obj);return obj}
function migrate(){
 var x=empty(),crm=safeParse("text2me.crm.workspace.v1",{items:[],activity:[]}),dash=safeParse("text2me.dashboard.v1",{tasks:[],events:[],cases:[],documents:[]}),lib=safeParse("text2me.space.v1",[]),stamp=now();
 if(Array.isArray(crm.items))crm.items.forEach(function(i){var type=({"Дело":"case","Документ":"document","Задача":"task","Контакт":"contact"})[i.type]||"task",o={id:i.id||uid(type),title:i.title||"",name:i.title||"",status:i.status||"Новый запрос",contactName:i.contact||"",caseName:i.case||"",nextStep:i.next||"",due:i.due||"",createdAt:i.createdAt||stamp,updatedAt:i.updatedAt||stamp,legacy:"crm",crmManaged:true};if(type==="case")x.cases.push(o);else if(type==="document")x.documents.push(o);else if(type==="contact")x.contacts.push(o);else x.tasks.push(o)});
 if(Array.isArray(dash.cases))dash.cases.forEach(function(i){if(!byId(x.cases,i.id))x.cases.push({id:i.id||uid("case"),title:i.name||"Дело",name:i.name||"Дело",description:i.description||"",status:i.status||"active",createdAt:i.createdAt||stamp,updatedAt:i.updatedAt||stamp,legacy:"dashboard"})});
 if(Array.isArray(dash.tasks))dash.tasks.forEach(function(i){if(!byId(x.tasks,i.id))x.tasks.push({id:i.id||uid("task"),title:i.name||"Задача",name:i.name||"Задача",description:i.description||"",due:i.date||"",caseId:i.caseId||"",status:i.done?"done":"active",priority:i.priority||"normal",createdAt:i.createdAt||stamp,updatedAt:i.updatedAt||stamp,legacy:"dashboard"})});
 if(Array.isArray(dash.events))dash.events.forEach(function(i){if(!byId(x.events,i.id))x.events.push({id:i.id||uid("event"),title:i.name||"Событие",name:i.name||"Событие",description:i.description||"",date:i.date||"",caseId:i.caseId||"",createdAt:i.createdAt||stamp,updatedAt:i.updatedAt||stamp,legacy:"dashboard"})});
 if(Array.isArray(dash.documents))dash.documents.forEach(function(i){if(!byId(x.documents,i.id))x.documents.push({id:i.id||uid("doc"),title:i.name||"Документ",name:i.name||"Документ",description:i.description||"",caseId:i.caseId||"",url:i.url||"",documentId:i.documentId||"",createdAt:i.createdAt||stamp,updatedAt:i.updatedAt||stamp,legacy:"dashboard"})});
 if(Array.isArray(lib))lib.forEach(function(i){if(i&&!byId(x.documents,i.id))x.documents.push({id:i.id||uid("doc"),title:i.title||"Документ",name:i.title||"Документ",content:i.content||i.text||"",collection:i.collection||"",source:"library",libraryId:i.id||"",createdAt:i.createdAt||stamp,updatedAt:i.updated||stamp,legacy:"space-library"})});
  ensureLinkedDocuments(x);normalizeRelations(x);
 x.activity=(Array.isArray(crm.activity)?crm.activity:[]).map(function(a){return {id:a.id||uid("a"),action:a.message||"Импортировано событие",at:a.at||stamp,legacy:"crm"}}).concat([{id:uid("a"),action:"Создана единая модель данных; импортированы доступные локальные записи без удаления исходных хранилищ.",at:stamp}]).slice(0,500);
 x.migrations={crm:true,dashboard:true,documentLibrary:true,completedAt:stamp};
 write(x);return x
}

function ensureLinkedDocuments(x){var changed=false;(x.documents||[]).forEach(function(d){if(!d.libraryId||d.caseId)return;var stamp=now(),c={id:uid("case"),type:"case",title:"Дело по документу «"+(d.title||"Документ")+"»",name:"Дело по документу «"+(d.title||"Документ")+"»",description:"Создано автоматически для ранее сохранённого документа. Добавьте обстоятельства и участников.",status:"active",createdAt:stamp,updatedAt:stamp,legacy:"document-link"};x.cases.unshift(c);d.caseId=c.id;d.contactIds=Array.isArray(d.contactIds)?d.contactIds:[];var t={id:uid("task"),type:"task",title:"Проверить и завершить документ: "+(d.title||"Документ"),name:"Проверить и завершить документ: "+(d.title||"Документ"),description:"Проверьте факты, реквизиты, правовые основания, приложения и дальнейший шаг.",caseId:c.id,documentId:d.id,status:"active",priority:"normal",createdAt:stamp,updatedAt:stamp,legacy:"document-link"};x.tasks.unshift(t);d.followupTaskId=t.id;d.updatedAt=d.updatedAt||stamp;log(x,"Автоматически связаны ранее сохранённый документ, дело и задача проверки",d);changed=true});return changed}

function createCase(title,details){var x=read(),o={id:uid("case"),type:"case",title:title,name:title,description:details||"",status:"active",contactIds:[],createdAt:now(),updatedAt:now()};x.cases.unshift(o);log(x,"Создано дело: "+title,o);write(x);return o}
function createDocument(opts){opts=opts||{};var x=read(),caseItem=opts.caseId&&byId(x.cases,opts.caseId);if(!caseItem&&opts.createCase!==false){caseItem=createCase(opts.caseTitle||opts.title||"Дело по документу «"+(opts.title||"Без названия")+"»",opts.description||"Создано вместе с документом");x=read()}
 var o={id:uid("doc"),type:"document",title:opts.title||"Новый документ",name:opts.title||"Новый документ",content:opts.content||"",url:opts.url||"",caseId:caseItem?caseItem.id:"",contactIds:validContactIds(x,opts.contactIds),status:"draft",source:opts.source||"text2me",createdAt:now(),updatedAt:now(),metadata:opts.metadata||{}};x.documents.unshift(o);if(caseItem){caseItem.updatedAt=now();log(x,"Документ связан с делом «"+caseItem.title+"»: "+o.title,o)}else log(x,"Создан документ: "+o.title,o);write(x);return o}
 var o={id:uid("doc"),type:"document",title:opts.title||"Новый документ",name:opts.title||"Новый документ",content:opts.content||"",url:opts.url||"",caseId:caseItem&&caseItem.id||opts.caseId||"",status:"draft",source:opts.source||"text2me",createdAt:now(),updatedAt:now(),metadata:opts.metadata||{}};x.documents.unshift(o);if(caseItem){caseItem.updatedAt=now();log(x,"Документ связан с делом «"+caseItem.title+"»: "+o.title,o)}else log(x,"Создан документ: "+o.title,o);write(x);return o}
function addTask(opts){opts=opts||{};var x=read(),o={id:uid("task"),type:"task",title:opts.title||"Следующее действие",name:opts.title||"Следующее действие",description:opts.description||"",due:opts.due||"",date:opts.due||"",caseId:opts.caseId&&byId(x.cases,opts.caseId)?opts.caseId:"",documentId:resolveDocumentId(x,opts.documentId),contactIds:validContactIds(x,opts.contactIds),status:"active",priority:opts.priority||"normal",createdAt:now(),updatedAt:now()};x.tasks.unshift(o);log(x,"Добавлена задача: "+o.title,o);write(x);return o}
function addEvent(opts){opts=opts||{};var x=read(),o={id:uid("event"),type:"event",title:opts.title||"Контрольная дата",name:opts.title||"Контрольная дата",description:opts.description||"",date:opts.date||"",caseId:opts.caseId&&byId(x.cases,opts.caseId)?opts.caseId:"",documentId:resolveDocumentId(x,opts.documentId),contactIds:validContactIds(x,opts.contactIds),createdAt:now(),updatedAt:now()};x.events.unshift(o);log(x,"Добавлено событие: "+o.title,o);write(x);return o}

function updateTask(id,opts){var x=read(),o=byId(x.tasks,id);if(!o)return null;opts=opts||{};["title","name","description","due","date","priority","status"].forEach(function(k){if(Object.prototype.hasOwnProperty.call(opts,k))o[k]=opts[k]});if(Object.prototype.hasOwnProperty.call(opts,"caseId"))o.caseId=opts.caseId&&byId(x.cases,opts.caseId)?opts.caseId:"";if(Object.prototype.hasOwnProperty.call(opts,"documentId"))o.documentId=resolveDocumentId(x,opts.documentId);if(Object.prototype.hasOwnProperty.call(opts,"contactIds"))o.contactIds=validContactIds(x,opts.contactIds);o.updatedAt=now();log(x,"Обновлена задача: "+(o.title||o.name||id),o);write(x);return o}
function updateEvent(id,opts){var x=read(),o=byId(x.events,id);if(!o)return null;opts=opts||{};["title","name","description","date"].forEach(function(k){if(Object.prototype.hasOwnProperty.call(opts,k))o[k]=opts[k]});if(Object.prototype.hasOwnProperty.call(opts,"caseId"))o.caseId=opts.caseId&&byId(x.cases,opts.caseId)?opts.caseId:"";if(Object.prototype.hasOwnProperty.call(opts,"documentId"))o.documentId=resolveDocumentId(x,opts.documentId);if(Object.prototype.hasOwnProperty.call(opts,"contactIds"))o.contactIds=validContactIds(x,opts.contactIds);o.updatedAt=now();log(x,"Обновлено событие: "+(o.title||o.name||id),o);write(x);return o}

function addContact(opts){opts=opts||{};var x=read(),o={id:uid("contact"),type:"contact",title:opts.name||opts.title||"Новый контакт",name:opts.name||opts.title||"Новый контакт",kind:opts.kind||"person",email:opts.email||"",phone:opts.phone||"",organization:opts.organization||"",createdAt:now(),updatedAt:now()};x.contacts.unshift(o);log(x,"Добавлен контакт: "+o.title,o);write(x);return o}

function upsertLibraryDocument(doc){var x=read(),stamp=now(),caseItem=doc.caseId&&byId(x.cases,doc.caseId),existing=x.documents.find(function(d){return d.libraryId===doc.id||d.id===doc.workspaceDocumentId});if(!caseItem&&existing&&existing.caseId)caseItem=byId(x.cases,existing.caseId);if(!caseItem){caseItem={id:uid("case"),type:"case",title:"Дело по документу «"+(doc.title||"Документ")+"»",name:"Дело по документу «"+(doc.title||"Документ")+"»",description:"Создано автоматически при сохранении документа. Добавьте участников, обстоятельства и сроки.",status:"active",createdAt:stamp,updatedAt:stamp,legacy:"document-link"};x.cases.unshift(caseItem);log(x,"Автоматически создано дело для документа: "+(doc.title||"Документ"),caseItem)}
 var saved={id:existing?existing.id:uid("doc"),type:"document",title:doc.title||"Документ",name:doc.title||"Документ",content:doc.text||doc.content||"",text:doc.text||doc.content||"",source:doc.source||"document-builder",libraryId:doc.id||"",caseId:caseItem.id,status:"draft",createdAt:existing&&existing.createdAt||doc.created||stamp,updatedAt:doc.updated||stamp,version:doc.version||1,followupTaskId:existing&&existing.followupTaskId||"",legacy:"space-library"};if(existing){Object.assign(existing,saved)}else x.documents.unshift(saved);
 var task=existing&&existing.followupTaskId&&byId(x.tasks,existing.followupTaskId);if(!task){task={id:uid("task"),type:"task",title:"Проверить и завершить документ: "+saved.title,name:"Проверить и завершить документ: "+saved.title,description:"Проверьте факты, реквизиты, правовые основания, приложения и дальнейший шаг.",caseId:caseItem.id,documentId:saved.id,status:"active",priority:"normal",createdAt:stamp,updatedAt:stamp,legacy:"document-link"};x.tasks.unshift(task);saved.followupTaskId=task.id}
 caseItem.updatedAt=stamp;log(x,"Документ сохранён и связан с делом: "+saved.title,saved);write(x);return {documentId:saved.id,caseId:caseItem.id,taskId:task&&task.id||saved.followupTaskId}}


function linkContactToCase(caseId,name,details){name=String(name||"").trim();if(!name)return null;details=details||{};var x=read(),c=byId(x.cases,caseId);if(!c)return null;var contact=x.contacts.find(function(o){return String(o.name||o.title||"").trim().toLocaleLowerCase("ru")===name.toLocaleLowerCase("ru")});if(!contact){contact={id:uid("contact"),type:"contact",title:name,name:name,kind:details.organization?"organization":"party",createdAt:now(),updatedAt:now()};x.contacts.unshift(contact);log(x,"Создан контакт из реквизитов документа: "+name,contact)}contact.email=details.email||contact.email||"";contact.phone=details.phone||contact.phone||"";contact.organization=details.organization||contact.organization||"";contact.updatedAt=now();c.contactIds=validContactIds(x,c.contactIds);if(c.contactIds.indexOf(contact.id)<0)c.contactIds.push(contact.id);c.updatedAt=now();["documents","tasks","events"].forEach(function(k){x[k].forEach(function(o){if(o.caseId===caseId){o.contactIds=validContactIds(x,o.contactIds);if(o.contactIds.indexOf(contact.id)<0)o.contactIds.push(contact.id)}})});log(x,"Контакт «"+name+"» связан с делом",c);write(x);return contact}


function removeEntity(collection,id){var x=read(),arr=x[collection];if(!Array.isArray(arr))return false;var item=byId(arr,id);if(!item)return false;arr.splice(arr.indexOf(item),1);if(collection==="cases"){["documents","tasks","events"].forEach(function(k){x[k].forEach(function(o){if(o.caseId===id)o.caseId=""})})}if(collection==="documents"){["tasks","events"].forEach(function(k){x[k].forEach(function(o){if(o.documentId===id)o.documentId=""})})}if(collection==="contacts"){["cases","documents","tasks","events"].forEach(function(k){x[k].forEach(function(o){o.contactIds=(o.contactIds||[]).filter(function(cid){return cid!==id})})})}log(x,"Удалена запись: "+(item.title||item.name||id),item);return write(x)}

function attachDocumentToCase(documentId,caseId){var x=read(),d=byId(x.documents,documentId),c=byId(x.cases,caseId);if(!d||!c)return false;d.caseId=c.id;d.updatedAt=now();log(x,"Документ «"+d.title+"» привязан к делу «"+c.title+"»",d);return write(x)}
function get(){return read()}

function crmType(entityType){return ({case:"Дело",document:"Документ",task:"Задача",contact:"Контакт"})[entityType]||"Задача"}
function crmStatus(status){if(status==="active"||status==="done"||status==="waiting")return status==="done"?"Завершено":status==="waiting"?"Ожидает ответа":"В работе";return status||"В работе"}
function dashboardStatus(status){if(status==="Завершено"||status==="done")return "done";if(status==="Ожидает ответа"||status==="waiting")return "waiting";return "active"}
function crmList(){var x=read(),all=[];["cases","documents","tasks","contacts"].forEach(function(k){x[k].forEach(function(o){all.push({id:o.id,type:crmType(k.slice(0,-1)),title:o.title||o.name||"",contact:o.contactName||o.contact||"",case:o.caseName||o.case||(o.caseId&&byId(x.cases,o.caseId)?(byId(x.cases,o.caseId).title||byId(x.cases,o.caseId).name):""),caseId:o.caseId||"",documentId:o.documentId||"",description:o.description||"",url:o.url||"",content:o.content||o.text||"",libraryId:o.libraryId||"",followupTaskId:o.followupTaskId||"",contactIds:o.contactIds||[],source:o.source||"",metadata:o.metadata||{},collection:o.collection||"",version:o.version||1,done:!!o.done,priority:o.priority||"normal",date:o.date||"",kind:o.kind||"",email:o.email||"",phone:o.phone||"",organization:o.organization||"",next:o.nextStep||"",due:o.due||o.date||"",status:crmStatus(o.status),createdAt:o.createdAt,updatedAt:o.updatedAt,crmManaged:!!o.crmManaged})})});return {items:all,activity:x.activity.map(function(a){return {id:a.id,message:a.action||a.message||"",at:a.at}})}}
function syncCrm(data){
 var x=read(),incoming=new Set((data.items||[]).map(function(i){return i.id}));
 ["cases","documents","tasks","contacts"].forEach(function(k){
  var removed=x[k].filter(function(o){return o.crmManaged&&!incoming.has(o.id)});
  removed.forEach(function(o){
   var at=x[k].findIndex(function(z){return z.id===o.id});
   if(at>=0)x[k].splice(at,1);
   if(k==="cases"){
    ["documents","tasks","events"].forEach(function(q){x[q].forEach(function(z){if(z.caseId===o.id)z.caseId=""})});
    (data.items||[]).forEach(function(i){if(i.caseId===o.id)i.caseId="";if(i.case===o.title)i.case=""});
   }
   if(k==="documents"){
    ["tasks","events"].forEach(function(q){x[q].forEach(function(z){if(z.documentId===o.id)z.documentId=""})});
    (data.items||[]).forEach(function(i){if(i.documentId===o.id)i.documentId=""});
    if(o.libraryId){var lib=safeParse("text2me.space.v1",[]);if(Array.isArray(lib)){lib=lib.filter(function(d){return d.id!==o.libraryId});try{localStorage.setItem("text2me.space.v1",JSON.stringify(lib))}catch(e){}}}
   }
   if(k==="contacts"){
    ["cases","documents"].forEach(function(q){x[q].forEach(function(z){z.contactIds=(z.contactIds||[]).filter(function(cid){return cid!==o.id})})});
    (data.items||[]).forEach(function(i){i.contactIds=(i.contactIds||[]).filter(function(cid){return cid!==o.id})});
   }
   log(x,"Удалена запись: "+(o.title||o.name||o.id),o);
  });
  x[k]=x[k].filter(function(o){return !o.crmManaged});
 });
 (data.items||[]).forEach(function(i){
  var k=({"Дело":"cases","Документ":"documents","Задача":"tasks","Контакт":"contacts"})[i.type]||"tasks";
  var o={id:i.id||uid("crm"),type:i.type==="Дело"?"case":i.type==="Документ"?"document":i.type==="Контакт"?"contact":"task",title:i.title||"",name:i.title||"",contactName:i.contact||"",caseName:i.case||"",caseId:i.caseId||"",documentId:i.documentId||"",description:i.description||"",url:i.url||"",content:i.content||"",text:i.content||"",libraryId:i.libraryId||"",followupTaskId:i.followupTaskId||"",contactIds:i.contactIds||[],source:i.source||"",metadata:i.metadata||{},collection:i.collection||"",version:i.version||1,done:!!i.done,priority:i.priority||"normal",date:i.date||i.due||"",kind:i.kind||"",email:i.email||"",phone:i.phone||"",organization:i.organization||"",nextStep:i.next||"",due:i.due||"",status:i.status||"В работе",createdAt:i.createdAt||now(),updatedAt:i.updatedAt||now(),crmManaged:true,legacy:"crm"};
  upsert(x[k],o);
 });
 (data.activity||[]).slice(0,40).forEach(function(a){if(!x.activity.some(function(z){return z.id===a.id}))x.activity.push({id:a.id||uid("a"),action:a.message||"Действие CRM",at:a.at||now(),legacy:"crm"})});
 x.activity=x.activity.slice(0,500);
 return write(x);
}
function dashboardState(){var x=read();return {cases:x.cases.map(function(o){return {id:o.id,name:o.name||o.title||"",description:o.description||"",status:dashboardStatus(o.status),createdAt:o.createdAt,updatedAt:o.updatedAt}}),tasks:x.tasks.map(function(o){return {id:o.id,name:o.name||o.title||"",description:o.description||"",date:o.date||o.due||"",caseId:o.caseId||"",documentId:o.documentId||"",priority:o.priority||"normal",done:o.done||o.status==="done",createdAt:o.createdAt,updatedAt:o.updatedAt}}),events:x.events.map(function(o){return {id:o.id,name:o.name||o.title||"",description:o.description||"",date:o.date||"",caseId:o.caseId||"",documentId:o.documentId||"",createdAt:o.createdAt,updatedAt:o.updatedAt}}),documents:x.documents.map(function(o){return {id:o.id,name:o.name||o.title||"",description:o.description||"",url:o.url||"",caseId:o.caseId||"",documentId:o.documentId||"",createdAt:o.createdAt,updatedAt:o.updatedAt}})}}
function syncDashboard(state){var x=read(),stamp=now();function sync(key,arr,convert){(arr||[]).forEach(function(i){var o=convert(i);o.legacy="dashboard";o.updatedAt=i.updatedAt||stamp;upsert(x[key],o)})}
 sync("cases",state.cases,function(i){return {id:i.id||uid("case"),type:"case",title:i.name||i.title||"",name:i.name||i.title||"",description:i.description||"",status:i.status||"active",createdAt:i.createdAt||stamp}});
 sync("tasks",state.tasks,function(i){return {id:i.id||uid("task"),type:"task",title:i.name||i.title||"",name:i.name||i.title||"",description:i.description||"",due:i.date||i.due||"",date:i.date||i.due||"",caseId:i.caseId||"",documentId:i.documentId||"",priority:i.priority||"normal",done:!!i.done,status:i.done?"done":"active",createdAt:i.createdAt||stamp}});
 sync("events",state.events,function(i){return {id:i.id||uid("event"),type:"event",title:i.name||i.title||"",name:i.name||i.title||"",description:i.description||"",date:i.date||"",caseId:i.caseId||"",documentId:i.documentId||"",createdAt:i.createdAt||stamp}});
 sync("documents",state.documents,function(i){return {id:i.id||uid("doc"),type:"document",title:i.name||i.title||"",name:i.name||i.title||"",description:i.description||"",url:i.url||"",caseId:i.caseId||"",documentId:i.documentId||"",createdAt:i.createdAt||stamp}});
 return write(x)}

window.Text2meWorkspace={key:KEY,get:get,save:write,migrate:migrate,createCase:createCase,createDocument:createDocument,addTask:addTask,addEvent:addEvent,updateTask:updateTask,updateEvent:updateEvent,addContact:addContact,attachDocumentToCase:attachDocumentToCase,removeEntity:removeEntity,linkContactToCase:linkContactToCase,upsertLibraryDocument:upsertLibraryDocument,crmList:crmList,syncCrm:syncCrm,dashboardState:dashboardState,syncDashboard:syncDashboard,log:function(action,entity){var x=read();log(x,action,entity);write(x)},version:1};
})();