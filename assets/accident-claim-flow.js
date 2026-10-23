(function(){
"use strict";
function ready(fn){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fn);else fn()}
ready(function(){
 var host=document.getElementById("text2me-editor-app");if(!host)return;
 var tries=0;
 function install(){
  var panel=host.querySelector(".text2me-editor-panel"),title=host.querySelector(".text2me-editor-title"),area=host.querySelector(".text2me-editor-body"),assistant=host.querySelector(".text2me-editor-assistant");
  if(!panel||!title||!area||!assistant){if(tries++<50)setTimeout(install,100);return}
  if(panel.dataset.accidentFlowInstalled)return;panel.dataset.accidentFlowInstalled="1";
  var style=document.createElement("style");
  style.textContent=".t2m-scenario{margin:14px 0;padding:16px;border:1px solid #cbdcf0;border-radius:14px;background:#f5f9ff}.t2m-scenario h3{margin:0 0 6px;font-size:18px}.t2m-scenario p{font-size:13px;line-height:1.5;color:#52647a}.t2m-scenario-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.t2m-scenario-field{display:grid;gap:5px;font-size:12px;font-weight:750;color:#29496f}.t2m-scenario-field input,.t2m-scenario-field select,.t2m-scenario-field textarea{width:100%;min-width:0;padding:10px;border:1px solid #cbd6e5;border-radius:8px;background:#fff;color:#24364b;font:inherit;font-weight:400}.t2m-scenario-field textarea{min-height:80px;resize:vertical}.t2m-scenario-wide{grid-column:1/-1}.t2m-scenario-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.t2m-scenario-privacy{font-size:12px!important}@media(max-width:600px){.t2m-scenario-grid{grid-template-columns:1fr}.t2m-scenario-wide{grid-column:auto}}";
  document.head.appendChild(style);
  var box=document.createElement("section");box.className="t2m-scenario";box.setAttribute("aria-labelledby","t2m-accident-title");
  box.innerHTML='<h3 id="t2m-accident-title">Ситуация: ДТП → заявление страховщику</h3><p>Заполните известные сведения. Поля необязательны, если сведения пока неизвестны. Название страховщика вводится вручную: автоматический справочник страховых организаций пока не подключён.</p><div class="t2m-scenario-grid"><label class="t2m-scenario-field">Регион РФ<input name="region" autocomplete="address-level1" placeholder="Например, Краснодарский край"></label><label class="t2m-scenario-field">Страховая организация<input name="insurer" placeholder="Полное название страховщика"></label><label class="t2m-scenario-field">ФИО заявителя<input name="person" autocomplete="name" placeholder="Как в документах"></label><label class="t2m-scenario-field">Контакт и адрес для ответа<input name="contact" placeholder="Укажите только нужные данные"></label><label class="t2m-scenario-field">Дата ДТП<input name="date" type="date"></label><label class="t2m-scenario-field">Место ДТП<input name="place" placeholder="Населённый пункт, улица или дорога"></label><label class="t2m-scenario-field">Номер полиса / дела<input name="policy" placeholder="Если известен"></label><label class="t2m-scenario-field">Номер автомобиля<input name="vehicle" placeholder="Если относится к обращению"></label><label class="t2m-scenario-field">Что произошло<textarea name="facts" placeholder="Кратко опишите обстоятельства без предположений"></textarea></label><label class="t2m-scenario-field">Что требуется от страховщика<select name="demand"><option value="">Выберите вариант</option><option>Принять и зарегистрировать заявление</option><option>Сообщить порядок и перечень необходимых документов</option><option>Организовать осмотр повреждённого имущества</option><option>Рассмотреть вопрос о страховом возмещении</option><option>Предоставить информацию о статусе дела</option><option>Другое — сформулирую в тексте</option></select></label><label class="t2m-scenario-field t2m-scenario-wide">Повреждения и документы<textarea name="damage" placeholder="Известные повреждения, фото, извещение о ДТП, постановления и другие документы"></textarea></label></div><div class="t2m-scenario-actions"><button type="button" class="button button-primary" data-action="generate">Сформировать заявление</button><button type="button" class="button button-outline" data-action="clear">Очистить поля сценария</button></div><p class="t2m-scenario-privacy">Данные обрабатываются этим интерфейсом в браузере. Не вводите лишние персональные сведения. Это проект текста, а не подтверждение права на выплату: применимые правила, комплект документов, сроки, адрес страховщика и порядок обращения нужно проверить по официальным актуальным источникам.</p>';
  assistant.insertBefore(box,assistant.firstChild);
  var generated=false,programmatic=false;
  function field(name){return box.querySelector('[name="'+name+'"]')}
  function val(name){return (field(name).value||"").trim()}
  function formatDate(s){if(!s)return "[дата ДТП]";var a=s.split("-");return a.length===3?a[2]+"."+a[1]+"."+a[0]:s}
  function build(){
   var lines=[];
   lines.push("Кому: "+(val("insurer")||"[полное наименование страховой организации]"));
   lines.push("Адрес страховщика: [проверьте официальный адрес для направления обращения]");
   lines.push("От: "+(val("person")||"[ФИО заявителя]"));
   if(val("contact"))lines.push("Контакт и адрес для ответа: "+val("contact"));
   if(val("region"))lines.push("Регион: "+val("region"));
   lines.push("");
   lines.push("ЗАЯВЛЕНИЕ");
   lines.push("по обстоятельствам ДТП");
   lines.push("");
   lines.push("Прошу принять и зарегистрировать настоящее обращение по обстоятельствам дорожно-транспортного происшествия.");
   lines.push("");
   lines.push("Сведения о происшествии");
   lines.push("Дата ДТП: "+formatDate(val("date")));
   lines.push("Место ДТП: "+(val("place")||"[укажите место ДТП]"));
   if(val("policy"))lines.push("Номер полиса / дела: "+val("policy"));
   if(val("vehicle"))lines.push("Государственный регистрационный номер автомобиля: "+val("vehicle"));
   lines.push("Обстоятельства: "+(val("facts")||"[опишите обстоятельства ДТП, отделяя известные факты от предположений]"));
   if(val("damage"))lines.push("Повреждения и документы: "+val("damage"));
   lines.push("");
   lines.push("Прошу");
   lines.push(val("demand")||"[уточните конкретное обращение к страховщику]");
   lines.push("Прошу сообщить регистрационный номер обращения, порядок дальнейших действий и перечень документов, необходимых в данной ситуации.");
   lines.push("");
   lines.push("Приложения: [перечислите фактически прилагаемые документы; не указывайте документы, которых нет]");
   lines.push("Дата подачи: [дата]");
   lines.push("Подпись: "+(val("person")||"[ФИО заявителя]"));
   lines.push("");
   lines.push("ПЕРЕД ОТПРАВКОЙ ПРОВЕРИТЬ");
   lines.push("1. Какой режим страхования и порядок урегулирования применим к этому ДТП.");
   lines.push("2. Официальные реквизиты страховщика и способ подачи заявления.");
   lines.push("3. Актуальный перечень документов, порядок осмотра и сроки — по официальным источникам.");
   lines.push("4. Все факты, даты, номера, требования и приложения. Неизвестные сведения не следует угадывать.");
   programmatic=true;title.value="Заявление страховщику по ДТП";area.value=lines.join("\n");area.dataset.scenarioGenerated="true";area.dispatchEvent(new Event("input",{bubbles:true}));title.dispatchEvent(new Event("input",{bubbles:true}));programmatic=false;generated=true;
  }
  box.querySelector('[data-action="generate"]').addEventListener("click",build);
  box.querySelector('[data-action="clear"]').addEventListener("click",function(){if(!window.confirm("Очистить заполненные поля сценария ДТП?"))return;box.querySelectorAll("input,textarea,select").forEach(function(el){el.value=""});});
  box.querySelectorAll("input,textarea,select").forEach(function(el){el.addEventListener("input",function(){if(generated&&area.dataset.scenarioGenerated==="true")build()})});
  area.addEventListener("input",function(){if(!programmatic&&generated)area.dataset.scenarioGenerated="false"});
 }
 install();
});
})();