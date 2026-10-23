(function(){
"use strict";
var TASKS_KEY="text2me.organizer.tasks.v1";
var tasks=readTasks(),files=[],viewDate=new Date(),selectedDate=isoDate(new Date());
var grid=document.getElementById("calendar-grid"),monthLabel=document.getElementById("calendar-month-label"),agenda=document.getElementById("agenda-list"),agendaHeading=document.getElementById("agenda-heading"),taskForm=document.getElementById("organizer-task-form"),taskDate=document.getElementById("task-date"),taskFile=document.getElementById("task-file"),fileList=document.getElementById("organizer-file-list"),fileSearch=document.getElementById("file-search"),fileInput=document.getElementById("organizer-file-input");
function $(id){return document.getElementById(id)}
function node(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
function isoDate(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function readTasks(){try{var v=JSON.parse(localStorage.getItem(TASKS_KEY)||"[]");return Array.isArray(v)?v:[]}catch(e){return []}}
function saveTasks(){try{localStorage.setItem(TASKS_KEY,JSON.stringify(tasks));return true}catch(e){return false}}
function niceDate(value,options){var d=new Date(value+"T12:00:00");return d.toLocaleDateString("ru-RU",options||{day:"numeric",month:"long",year:"numeric"})}
function kindLabel(k){return({document:"Документ",payment:"Платёж",meeting:"Встреча",personal:"Личное",other:"Другое"})[k]||"Задача"}
function fileName(id){var f=files.find(function(x){return x.id===id});return f?f.name:""}
function renderCalendar(){
grid.replaceChildren();var year=viewDate.getFullYear(),month=viewDate.getMonth(),first=new Date(year,month,1),last=new Date(year,month+1,0);
monthLabel.textContent=first.toLocaleDateString("ru-RU",{month:"long",year:"numeric"});
["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].forEach(function(x){grid.appendChild(node("div","calendar-weekday",x))});
var offset=(first.getDay()+6)%7;for(var i=0;i<offset;i++)grid.appendChild(node("div","calendar-empty",""));
for(var day=1;day<=last.getDate();day++){var date=isoDate(new Date(year,month,day)),dayTasks=tasks.filter(function(t){return t.date===date&&!t.done}),b=node("button","calendar-day"+(date===isoDate(new Date())?" is-today":"")+(date===selectedDate?" is-selected":""),String(day));b.type="button";b.setAttribute("aria-label",niceDate(date)+", задач: "+dayTasks.length);if(dayTasks.length)b.appendChild(node("span","calendar-dot",dayTasks.length>9?"9+":String(dayTasks.length)));b.addEventListener("click",function(value){return function(){selectedDate=value;taskDate.value=value;renderCalendar();renderAgenda()}}(date));grid.appendChild(b)}
}
function renderAgenda(){
var dayTasks=tasks.filter(function(t){return t.date===selectedDate}).sort(function(a,b){return Number(a.done)-Number(b.done)||a.created.localeCompare(b.created)});
agendaHeading.textContent=selectedDate===isoDate(new Date())?"Сегодня · "+niceDate(selectedDate,{day:"numeric",month:"long"}):niceDate(selectedDate);
agenda.replaceChildren();if(!dayTasks.length){var empty=node("div","agenda-empty","На этот день задач нет.");empty.appendChild(node("span","","Добавьте задачу справа — она появится здесь."));agenda.appendChild(empty);return}
dayTasks.forEach(function(t){var item=node("article","agenda-item"+(t.done?" is-done":"")),check=document.createElement("input");check.type="checkbox";check.checked=!!t.done;check.setAttribute("aria-label","Отметить задачу выполненной");check.addEventListener("change",function(){t.done=check.checked;saveTasks();renderCalendar();renderAgenda()});var body=node("div","agenda-item-body"),title=node("strong","",t.title);body.appendChild(title);var meta=node("div","agenda-meta",kindLabel(t.kind)+(t.fileId&&fileName(t.fileId)?" · "+fileName(t.fileId):""));body.appendChild(meta);var del=node("button","agenda-delete","Удалить");del.type="button";del.addEventListener("click",function(){if(!confirm("Удалить задачу «"+t.title+"»?"))return;tasks=tasks.filter(function(x){return x.id!==t.id});saveTasks();renderCalendar();renderAgenda()});item.append(check,body,del);agenda.appendChild(item)})
}
function renderFileSelect(){var keep=taskFile.value;taskFile.replaceChildren();var opt=node("option","","Без привязки");opt.value="";taskFile.appendChild(opt);files.forEach(function(f){var o=node("option","",f.name);o.value=f.id;taskFile.appendChild(o)});if(files.some(function(f){return f.id===keep}))taskFile.value=keep}
function sizeLabel(size){if(size<1024)return size+" Б";if(size<1024*1024)return (size/1024).toFixed(1).replace(".",",")+" КБ";return (size/1024/1024).toFixed(1).replace(".",",")+" МБ"}
function renderFiles(){
var q=(fileSearch.value||"").trim().toLocaleLowerCase("ru");fileList.replaceChildren();$("file-count").textContent=String(files.length);
var filtered=files.filter(function(f){return f.name.toLocaleLowerCase("ru").includes(q)});if(!filtered.length){fileList.appendChild(node("div","file-empty",q?"Ничего не найдено по этому названию.":"Здесь пока нет файлов. Добавьте документы, чтобы связывать их с задачами."));renderFileSelect();return}
filtered.forEach(function(f){var item=node("article","organizer-file-item"),icon=node("span","organizer-file-type",(f.name.split(".").pop()||"FILE").slice(0,4).toUpperCase()),info=node("div","organizer-file-info"),name=node("strong","",f.name),meta=node("small","",sizeLabel(f.size)+" · добавлен "+new Date(f.savedAt).toLocaleDateString("ru-RU"));info.append(name,meta);var actions=node("div","organizer-file-actions"),download=node("button","","Скачать"),remove=node("button","","Удалить");download.type=remove.type="button";download.addEventListener("click",function(){if(!f.blob){alert("Содержимое файла недоступно в локальном хранилище.");return}var url=URL.createObjectURL(f.blob),a=document.createElement("a");a.href=url;a.download=f.name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1500)});remove.addEventListener("click",function(){if(!confirm("Удалить файл «"+f.name+"» из этого браузера?"))return;window.Text2MeFileVault.remove(f.id).then(loadFiles).catch(showError)});actions.append(download,remove);item.append(icon,info,actions);fileList.appendChild(item)});renderFileSelect()
}
function showError(e){$("upload-status").textContent=(e&&e.message)||"Не удалось выполнить операцию. Проверьте свободное место в браузере."}
function loadFiles(){if(!window.Text2MeFileVault){showError(new Error("Локальное хранилище файлов не загружено."));return}window.Text2MeFileVault.list().then(function(items){files=items;renderFiles();renderCalendar();renderAgenda()}).catch(showError)}
taskForm.addEventListener("submit",function(e){e.preventDefault();var title=$("task-title").value.trim(),date=taskDate.value;if(!title||!date)return;tasks.push({id:"t"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),title:title,date:date,kind:$("task-kind").value,fileId:taskFile.value||"",done:false,created:new Date().toISOString()});if(!saveTasks()){$("task-form-status").textContent="Не удалось сохранить задачу: возможно, в браузере закончилось место.";tasks.pop();return}selectedDate=date;viewDate=new Date(date+"T12:00:00");taskForm.reset();taskDate.value=date;$("task-form-status").textContent="Задача сохранена на этом устройстве.";renderCalendar();renderAgenda()});
$("calendar-prev").addEventListener("click",function(){viewDate=new Date(viewDate.getFullYear(),viewDate.getMonth()-1,1);renderCalendar()});
$("calendar-next").addEventListener("click",function(){viewDate=new Date(viewDate.getFullYear(),viewDate.getMonth()+1,1);renderCalendar()});
$("calendar-today").addEventListener("click",function(){viewDate=new Date();selectedDate=isoDate(new Date());taskDate.value=selectedDate;renderCalendar();renderAgenda()});
fileInput.addEventListener("change",function(){var chosen=Array.from(fileInput.files||[]);if(!chosen.length)return;$("upload-status").textContent="Сохраняем файлы в хранилище этого браузера…";var done=0,failed=0;chosen.reduce(function(p,file){return p.then(function(){return window.Text2MeFileVault.save(file).then(function(){done++}).catch(function(){failed++})})},Promise.resolve()).then(function(){fileInput.value="";$("upload-status").textContent="Добавлено файлов: "+done+(failed?"; не удалось сохранить: "+failed+". Проверьте свободное место.":".");loadFiles()})});
fileSearch.addEventListener("input",renderFiles);
window.addEventListener("text2me:file-vault-changed",loadFiles);
taskDate.value=selectedDate;
renderCalendar();renderAgenda();loadFiles();
})();