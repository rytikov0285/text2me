(function(){
"use strict";
function installSelectionEditor(){
  var previews=Array.prototype.slice.call(document.querySelectorAll("#claim-output,#court-output"));
  if(!previews.length)return;
  var active=null,toolbar=document.createElement("div");
  toolbar.className="selection-edit-menu";toolbar.hidden=true;toolbar.setAttribute("role","toolbar");toolbar.setAttribute("aria-label","Действия с выделенным текстом");
  var edit=document.createElement("button");edit.type="button";edit.textContent="Изменить";
  var remove=document.createElement("button");remove.type="button";remove.textContent="Удалить";
  toolbar.appendChild(edit);toolbar.appendChild(remove);document.body.appendChild(toolbar);
  function selectionInfo(pre){
    var s=window.getSelection();if(!s||s.isCollapsed||!s.rangeCount)return null;
    var r=s.getRangeAt(0);if(!pre.contains(r.startContainer)||!pre.contains(r.endContainer))return null;
    var before=r.cloneRange();before.selectNodeContents(pre);before.setEnd(r.startContainer,r.startOffset);
    var selected=s.toString();if(!selected.trim())return null;
    return {pre:pre,start:before.toString().length,end:before.toString().length+selected.length,text:selected,rect:r.getBoundingClientRect()};
  }
  function locate(){
    var found=null;previews.some(function(pre){found=selectionInfo(pre);return !!found});
    if(!found){toolbar.hidden=true;active=null;return}
    active=found;toolbar.hidden=false;
    var x=Math.max(8,Math.min(window.innerWidth-toolbar.offsetWidth-8,found.rect.left+found.rect.width/2-toolbar.offsetWidth/2));
    var y=found.rect.top-toolbar.offsetHeight-8;if(y<8)y=found.rect.bottom+8;
    toolbar.style.left=x+"px";toolbar.style.top=Math.min(window.innerHeight-toolbar.offsetHeight-8,y)+"px";
  }
  previews.forEach(function(pre){pre.addEventListener("mouseup",function(){setTimeout(locate,0)});pre.addEventListener("keyup",function(){setTimeout(locate,0)});});
  document.addEventListener("selectionchange",function(){if(!toolbar.matches(":hover")&&document.activeElement!==edit&&document.activeElement!==remove)setTimeout(locate,0)});
  window.addEventListener("scroll",function(){if(active)locate()},true);window.addEventListener("resize",function(){if(active)locate()});
  function apply(replacement){
    if(!active)return;var pre=active.pre,full=pre.textContent||"";
    pre.textContent=full.slice(0,active.start)+replacement+full.slice(active.end);
    var status=document.getElementById(pre.id==="court-output"?"court-action-status":"claim-action-status");
    if(status)status.textContent="Текст изменён. Скачивание, копирование и сохранение возьмут обновлённую версию.";
    pre.dispatchEvent(new CustomEvent("text2me:document-edited",{bubbles:true,detail:{text:pre.textContent}}));
    toolbar.hidden=true;active=null;window.getSelection().removeAllRanges();
  }
  edit.addEventListener("mousedown",function(e){e.preventDefault()});
  remove.addEventListener("mousedown",function(e){e.preventDefault()});
  edit.addEventListener("click",function(){if(!active)return;var next=window.prompt("Заменить выделенный текст на:",active.text);if(next!==null)apply(next)});
  remove.addEventListener("click",function(){if(!active)return;if(window.confirm("Удалить выделенный фрагмент?"))apply("")});
  document.addEventListener("click",function(e){if(!toolbar.contains(e.target)&&!previews.some(function(p){return p.contains(e.target)}))toolbar.hidden=true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",installSelectionEditor);else installSelectionEditor();
})();