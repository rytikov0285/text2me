(function(){
"use strict";
if(!document.body||document.getElementById("t2m-ai-review-root"))return;
var KEY="text2me.ai-review.v1",ROOT="t2m-ai-review-root",active=false,selected=null;
var css=`
#t2m-ai-review-root{font:14px/1.45 Arial,"Segoe UI",sans-serif;color:#17243a;position:relative;z-index:2147483000}
#t2m-ai-review-root *{box-sizing:border-box}#t2m-ai-review-root [hidden]{display:none!important}
#t2m-ai-review-root .bar{position:fixed;right:16px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:8px;width:190px;max-width:calc(100vw - 32px);padding:10px;background:#fff;border:1px solid #9bb8d3;border-radius:14px;box-shadow:0 8px 28px #0f172a44}
#t2m-ai-review-root button{font:inherit;font-weight:700;line-height:1.3;min-width:0;min-height:40px;padding:9px 12px;border:1px solid #9aa9ba;border-radius:8px;cursor:pointer;overflow-wrap:anywhere;background:#fff;color:#1b2c40}
#t2m-ai-review-root button:focus-visible,#t2m-ai-review-root textarea:focus-visible{outline:3px solid #f2b84b;outline-offset:2px}
#t2m-ai-review-root .primary{background:#205b91;color:#fff;border-color:#205b91}
#t2m-ai-review-root .panel{position:fixed;right:222px;top:50%;bottom:auto;transform:translateY(-50%);width:min(440px,calc(100vw - 244px));max-height:min(78vh,760px);overflow:auto;padding:18px;background:#fff;border:1px solid #9bb8d3;border-radius:14px;box-shadow:0 12px 40px #0f172a4d}
#t2m-ai-review-root .head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;font-size:16px}
#t2m-ai-review-root .head button{min-width:40px;font-size:22px;padding:5px}
#t2m-ai-review-root .id{margin:0 0 6px;font-weight:800;color:#205b91;overflow-wrap:anywhere}
#t2m-ai-review-root .excerpt,#t2m-ai-review-root .help{margin:0 0 14px;color:#53657a;overflow-wrap:anywhere}
#t2m-ai-review-root label{display:block;font-weight:700;margin:0 0 6px}
#t2m-ai-review-root textarea{display:block;width:100%;min-height:110px;resize:vertical;padding:10px;border:1px solid #9aa9ba;border-radius:8px;font:inherit;color:#17243a;background:#fff}
#t2m-ai-review-root .actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:12px}
#t2m-ai-review-root .status{position:fixed;right:18px;bottom:80px;max-width:min(520px,calc(100vw - 36px));margin:0;padding:10px 13px;background:#f0f7ff;color:#173e63;border:1px solid #9bc2e6;border-radius:9px;box-shadow:0 4px 18px #0f172a1f;overflow-wrap:anywhere}
#t2m-ai-review-root .status.error{background:#fff3f1;color:#8b1d17;border-color:#e4a19b}
#t2m-ai-review-root .items{display:grid;gap:10px}#t2m-ai-review-root .item{padding:12px;border:1px solid #d8e0e8;border-radius:9px;background:#f8fafc;overflow-wrap:anywhere}
#t2m-ai-review-root .item strong{color:#205b91}#t2m-ai-review-root .item p{margin:6px 0}#t2m-ai-review-root .item .small{color:#53657a;font-size:12px}
.t2m-ai-review-hover{outline:3px solid #f0a500!important;outline-offset:2px!important;cursor:crosshair!important}
#t2m-ai-review-root.is-selecting .bar{border-color:#f0a500}
@media(max-width:700px){#t2m-ai-review-root .bar{left:10px;right:10px;top:auto;bottom:10px;transform:none;flex-direction:row;flex-wrap:wrap;width:auto;gap:6px;padding:8px}#t2m-ai-review-root .bar button{flex:1 1 auto;font-size:12px;padding:8px 9px}#t2m-ai-review-root .panel{left:10px;right:10px;top:auto;bottom:82px;transform:none;width:auto;max-height:70vh;padding:14px}#t2m-ai-review-root .status{left:10px;right:10px;bottom:72px;max-width:none}}
`;
var style=document.createElement("style");style.textContent=css;document.head.appendChild(style);
var root=document.createElement("div");root.id=ROOT;
root.innerHTML='<div class="bar" role="region" aria-label="Комментарии для ИИ"><button type="button" class="primary" data-act="toggle" aria-pressed="false">Комментарии для ИИ</button><button type="button" data-act="list">Задания <span data-count>0</span></button><button type="button" data-act="export">Собрать задания</button></div><p class="status" role="status" aria-live="polite" hidden></p><section class="panel" data-panel="comment" role="dialog" aria-label="Комментарий к блоку" hidden><div class="head"><strong>Комментарий к блоку</strong><button type="button" data-act="close" aria-label="Закрыть">×</button></div><p class="id" data-id></p><p class="excerpt" data-excerpt></p><form><label for="t2m-ai-review-note">Что нужно изменить?</label><textarea id="t2m-ai-review-note" required rows="5" placeholder="Опиши, что исправить. Укажи, что нельзя менять."></textarea><div class="actions"><button type="button" data-act="close">Отмена</button><button type="submit" class="primary">Сохранить комментарий</button></div></form></section><section class="panel" data-panel="list" role="dialog" aria-label="Список заданий" hidden><div class="head"><strong>Задания для ИИ</strong><button type="button" data-act="close" aria-label="Закрыть">×</button></div><p class="help">Комментарии хранятся только в этом браузере. Скопируй список и отправь его в диалог ChatGPT.</p><div class="items" data-items></div><div class="actions"><button type="button" data-act="clear">Удалить все</button><button type="button" class="primary" data-act="export">Скопировать задания</button></div></section>';
document.body.appendChild(root);
var toggle=root.querySelector('[data-act="toggle"]'),count=root.querySelector("[data-count]"),status=root.querySelector(".status"),commentPanel=root.querySelector('[data-panel="comment"]'),listPanel=root.querySelector('[data-panel="list"]'),form=root.querySelector("form"),input=root.querySelector("textarea"),itemsNode=root.querySelector("[data-items]");
function read(){try{var a=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(a)?a.filter(function(x){return x&&x.blockId&&x.comment}):[]}catch(e){return[]}}
function write(a){try{localStorage.setItem(KEY,JSON.stringify(a));return true}catch(e){say("Не удалось сохранить в хранилище браузера.",true);return false}}
function say(s,err){status.textContent=s;status.hidden=false;status.classList.toggle("error",!!err)}
function clean(s){return String(s||"").replace(/\s+/g," ").trim()}
function textOf(el){var s=clean(el.innerText||el.textContent);return s.length>260?s.slice(0,257)+"…":s}
function esc(s){return window.CSS&&CSS.escape?CSS.escape(s):String(s).replace(/([^a-zA-Z0-9_-])/g,"\\$1")}
function selector(el){if(el.id)return"#"+esc(el.id);var parts=[],n=el;while(n&&n.nodeType===1&&n!==document.body){var p=n.tagName.toLowerCase(),cl=Array.prototype.slice.call(n.classList||[]).filter(function(c){return c.indexOf("t2m-review-")!==0&&c!=="t2m-ai-review-root"}).slice(0,2);if(cl.length)p+=cl.map(function(c){return"."+esc(c)}).join("");var par=n.parentElement;if(par){var same=Array.prototype.filter.call(par.children,function(s){return s.tagName===n.tagName});if(same.length>1)p+=":nth-of-type("+(same.indexOf(n)+1)+")"}parts.unshift(p);if(par&&par.id){parts.unshift("#"+esc(par.id));break}n=par;if(n&&(n.tagName==="MAIN"||n.tagName==="BODY")){if(n.tagName==="MAIN")parts.unshift("main");break}}return parts.join(" > ")||el.tagName.toLowerCase()}
function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(36).toUpperCase()}
function describe(el){var sel=selector(el),page=location.pathname.replace(/\/+$/,"")||"/",excerpt=textOf(el)||clean(el.getAttribute("alt")||el.getAttribute("aria-label")||el.getAttribute("title")||el.getAttribute("placeholder")||el.value||"");return{blockId:"T2M-"+hash(page+"|"+sel),page:page,url:location.origin+location.pathname,selector:sel,tag:el.tagName.toLowerCase(),excerpt:excerpt.slice(0,260)}}
function candidate(target){
 if(!target)return null;
 var el=target.nodeType===1?target:target.parentElement;
 while(el&&el!==document.documentElement&&el!==document.body){
  if(root.contains(el))return null;
  var tag=el.tagName.toLowerCase();
  if(tag!=="script"&&tag!=="style"&&tag!=="noscript"&&tag!=="template"&&tag!=="meta"&&tag!=="link"){
   var rect=el.getBoundingClientRect(),cs=window.getComputedStyle(el),visible=cs.display!=="none"&&cs.visibility!=="hidden"&&Number(cs.opacity)!==0&&rect.width>0&&rect.height>0;
   var content=clean(el.innerText||el.textContent),label=clean(el.getAttribute("alt")||el.getAttribute("aria-label")||el.getAttribute("title")||el.getAttribute("placeholder")||el.value||"");
   if(visible&&(content||label||tag==="img"||tag==="input"||tag==="textarea"||tag==="select"||tag==="svg"))return el;
  }
  el=el.parentElement;
 }
 return null;
}
function clearHighlight(){document.querySelectorAll(".t2m-ai-review-hover").forEach(function(e){e.classList.remove("t2m-ai-review-hover")})}
function setActive(v){active=!!v;toggle.setAttribute("aria-pressed",String(active));toggle.textContent=active?"Выключить выбор блока":"Комментарии для ИИ";root.classList.toggle("is-selecting",active);if(!active)clearHighlight();say(active?"Режим выбора включён. Нажми на текст или блок, который нужно изменить.":"Режим выбора выключен.")}
function closePanels(){commentPanel.hidden=true;listPanel.hidden=true;selected=null}
function openComment(el){selected=describe(el);root.querySelector("[data-id]").textContent=selected.blockId+" · "+selected.tag;root.querySelector("[data-excerpt]").textContent=selected.excerpt||"Блок без текста";input.value="";commentPanel.hidden=false;listPanel.hidden=true;input.focus()}
function refresh(){count.textContent=String(read().length)}
function render(){var a=read();itemsNode.replaceChildren();if(!a.length){var empty=document.createElement("p");empty.textContent="Комментариев пока нет. Включи выбор блока и нажми на нужный элемент.";itemsNode.appendChild(empty)}a.forEach(function(x,i){var card=document.createElement("article"),id=document.createElement("strong"),where=document.createElement("p"),ex=document.createElement("p"),note=document.createElement("p"),rm=document.createElement("button");card.className="item";id.textContent=x.blockId;where.textContent=x.page+" · "+x.tag+" · "+x.selector;ex.className="small";ex.textContent=x.excerpt||"Без текста";note.textContent=x.comment;rm.type="button";rm.textContent="Удалить";rm.addEventListener("click",function(){var latest=read();latest.splice(i,1);if(write(latest)){render();say("Комментарий удалён.")}});card.append(id,where,ex,note,rm);itemsNode.appendChild(card)});refresh()}
function exportText(a){a=Array.isArray(a)?a:read();if(!a.length)return"";var lines=["ЗАДАНИЯ ДЛЯ CHATGPT — ПРОЕКТ text2me","Внеси изменения в указанные блоки исходного кода. Сохрани существующие маршруты, ссылки, обработчики и бизнес-логику, если комментарий явно не требует их изменения.","ID генерируются из пути страницы и DOM-селектора; используй также селектор и исходный текст для точного поиска блока.",""];a.forEach(function(x,i){lines.push((i+1)+". "+x.blockId,"Страница: "+x.url,"Путь: "+x.page,"Селектор DOM: "+x.selector,"Тип элемента: "+x.tag,"Текст блока: "+(x.excerpt||"(пусто)"),"Задание: "+x.comment,"")});return lines.join("\n")}
function copy(s){if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(s);return new Promise(function(resolve,reject){var t=document.createElement("textarea");t.value=s;t.style.position="fixed";t.style.opacity="0";document.body.appendChild(t);t.select();var ok=false;try{ok=document.execCommand("copy")}catch(e){}t.remove();ok?resolve():reject(new Error("copy failed"))})}
function exportItems(){var batch=read(),s=exportText(batch);if(!s){say("Сначала добавь хотя бы один комментарий.",true);return}copy(s).then(function(){var remaining=read(),counts=Object.create(null);batch.forEach(function(x){var k=JSON.stringify(x);counts[k]=(counts[k]||0)+1});remaining=remaining.filter(function(x){var k=JSON.stringify(x);if(counts[k]){counts[k]--;return false}return true});if(write(remaining)){render();say("Скопировано "+batch.length+" заданий. Подборка очищена; новые задания будут собраны отдельно.")}else{say("Задания скопированы, но список не удалось очистить. Не нажимай «Собрать задания» повторно, пока не проверишь список.",true)}}).catch(function(){listPanel.hidden=false;render();say("Автокопирование недоступно. Задания сохранены; скопируй их вручную.",true)})}
toggle.addEventListener("click",function(){setActive(!active)});
root.addEventListener("click",function(e){var b=e.target.closest("[data-act]");if(!b)return;var a=b.getAttribute("data-act");if(a==="close")closePanels();else if(a==="toggle"){}else if(a==="list"){setActive(false);commentPanel.hidden=true;listPanel.hidden=false;render()}else if(a==="export")exportItems();else if(a==="clear"){if(!read().length){say("Список уже пуст.");return}if(confirm("Удалить все комментарии для ИИ из этого браузера?")&&write([])){render();say("Все комментарии удалены.")}}});
form.addEventListener("submit",function(e){e.preventDefault();var note=clean(input.value);if(!selected||!note){input.focus();return}var a=read();a.push(Object.assign({},selected,{comment:note,createdAt:new Date().toISOString()}));if(write(a)){var id=selected.blockId;closePanels();render();setActive(true);say("Комментарий сохранён для "+id+". Всего заданий: "+a.length+".")}});
document.addEventListener("mouseover",function(e){if(!active||root.contains(e.target))return;clearHighlight();var el=candidate(e.target);if(el)el.classList.add("t2m-ai-review-hover")},true);
document.addEventListener("click",function(e){if(!active||root.contains(e.target))return;var el=candidate(e.target);if(!el)return;e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();clearHighlight();openComment(el)},true);
document.addEventListener("keydown",function(e){if(e.key==="Escape"){if(!commentPanel.hidden||!listPanel.hidden)closePanels();else if(active)setActive(false)}});
refresh();
})();