(function(){
"use strict";
function ready(fn){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fn);else fn()}
ready(function(){
 var host=document.getElementById("text2me-editor-app");
 if(!host)return;
 var attempts=0;
 function install(){
  var panel=host.querySelector(".text2me-editor-panel"),title=host.querySelector(".text2me-editor-title"),area=host.querySelector(".text2me-editor-body"),assistant=host.querySelector(".text2me-editor-assistant");
  if(!panel||!title||!area||!assistant){if(attempts++<30)setTimeout(install,100);return}
  if(panel.dataset.typeToolsInstalled)return;panel.dataset.typeToolsInstalled="1";
  var style=document.createElement("style");style.textContent=".text2me-editor-type-row{display:flex;align-items:end;gap:10px;flex-wrap:wrap;margin:0 0 10px}.text2me-editor-type-label{display:grid;gap:5px;min-width:220px;flex:1;color:#193a62;font-size:12px;font-weight:750}.text2me-editor-type-select{width:100%;min-height:42px;padding:9px 11px;border:1px solid #cbd6e5;border-radius:9px;background:#fff;color:#24364b;font:inherit}.text2me-editor-type-note{margin:0 0 12px;color:#52647a;font-size:12px;line-height:1.5}";document.head.appendChild(style);
  var types=[
   {id:"letter",name:"Обращение / письмо",title:"Обращение",template:"Адресат: [наименование организации / ФИО]\nОт: [ФИО, адрес для ответа, контакты]\n\nТема: [кратко]\n\nОбстоятельства\n[Изложите факты по порядку, укажите даты и подтверждающие документы.]\n\nПрошу\n[Сформулируйте конкретное действие или решение.]\n\nПриложения: [перечень или «нет»]\nДата: [дата]\nПодпись: [ФИО]"},
   {id:"claim",name:"Претензия / требование",title:"Претензия",template:"Кому: [организация, адрес]\nОт: [ФИО, адрес для ответа, контакты]\n\nПРЕТЕНЗИЯ\n\n[Дата покупки / договора / события]: [описание обстоятельств и последовательность событий].\nДокументы, подтверждающие обстоятельства: [перечень].\n\nТребование\n[Укажите одно или несколько конкретных требований, сумму и расчёт, если применимо.]\n\nСрок ответа / исполнения: [укажите срок и основание, если оно проверено].\n\nПри отсутствии ответа или удовлетворения требования рассмотрю дальнейшие предусмотренные законом способы защиты права.\n\nПриложения: [перечень]\nДата: [дата]\nПодпись: [ФИО]"},
   {id:"appeal",name:"Жалоба / обжалование",title:"Жалоба",template:"Адресат: [орган / должностное лицо]\nЗаявитель: [ФИО, адрес для ответа, контакты]\n\nЖАЛОБА\nна [решение, действие или бездействие]\n\nОбжалуемое решение / действие\n[Укажите орган, дату, номер решения или событие. Если номер неизвестен, не придумывайте его.]\n\nВ чём состоит нарушение\n[Изложите факты, почему не согласны, и укажите подтверждающие материалы.]\n\nПрошу\n[Укажите конкретный результат, которого добиваетесь.]\n\nПриложения: [перечень]\nДата: [дата]\nПодпись: [ФИО]"},
   {id:"court",name:"Исковое заявление",title:"Исковое заявление",template:"В [наименование суда]\nИстец: [ФИО / наименование, адрес, контакты]\nОтветчик: [ФИО / наименование, адрес, известные сведения]\nЦена иска: [если применимо, расчёт]\n\nИСКОВОЕ ЗАЯВЛЕНИЕ\nо [предмет требования]\n\nОбстоятельства дела\n[Факты по порядку, даты, доказательства.]\n\nПравовое обоснование\n[Укажите только проверенные нормы и основания.]\n\nПрошу суд\n[Сформулируйте требования.]\n\nПриложения: [перечень документов]\nДата: [дата]\nПодпись: [ФИО]\n\nПроверьте подсудность, досудебный порядок, расчёт, госпошлину и актуальные требования суда до подачи."},
   {id:"contract",name:"Договор",title:"Договор",template:"ДОГОВОР № [номер при наличии]\nг. [место] · [дата]\n\nСтороны\n[Полные наименования / ФИО сторон, статус и реквизиты.]\n\nПредмет договора\n[Что именно обязуется сделать / передать каждая сторона.]\n\nПрава и обязанности\n[Обязанности каждой стороны, порядок взаимодействия.]\n\nЦена и расчёты\n[Сумма, порядок и сроки оплаты либо отметка, что раздел неприменим.]\n\nСрок действия и прекращение\n[Дата начала, срок, порядок изменения и прекращения.]\n\nОтветственность и урегулирование споров\n[Согласованные условия.]\n\nРеквизиты и подписи сторон\n[Реквизиты, адреса, подписи.]\n\nПроверьте обязательные условия именно для этого вида договора и применимое право."}
  ];
  var label=document.createElement("label");label.className="text2me-editor-type-label";label.appendChild(document.createTextNode("Тип документа"));
  var select=document.createElement("select");select.className="text2me-editor-type-select";select.setAttribute("aria-label","Тип документа для структуры и проверки");
  types.forEach(function(t){var o=document.createElement("option");o.value=t.id;o.textContent=t.name;select.appendChild(o)});label.appendChild(select);
  var apply=document.createElement("button");apply.type="button";apply.className="button button-outline";apply.textContent="Создать структуру";
  var row=document.createElement("div");row.className="text2me-editor-type-row";row.append(label,apply);
  assistant.insertBefore(row,assistant.firstChild);
  var note=document.createElement("p");note.className="text2me-editor-type-note";note.textContent="Выбор типа меняет структуру и контрольный список. Он не проверяет актуальность закона и не определяет автоматически срок ответа.";row.insertAdjacentElement("afterend",note);
  function chosen(){return types.find(function(t){return t.id===select.value})||types[0]}
  function guess(){var s=(title.value+" "+area.value.slice(0,500)).toLocaleLowerCase("ru");if(/договор|соглашение|контракт/.test(s))return "contract";if(/исковое заявление|истец|ответчик|в суд/.test(s))return "court";if(/жалоб|обжалован|решение органа/.test(s))return "appeal";if(/претензи|возврат денег|требую устранить/.test(s))return "claim";return "letter"}
  function sync(){var g=guess();if(types.some(function(t){return t.id===g}))select.value=g}
  function createStructure(){var t=chosen();if(area.value.trim()&&!window.confirm("Заменить текущий текст новой структурой «"+t.name+"»? Перед заменой скачайте или сохраните нужный текст."))return;title.value=t.title;area.value=t.template;area.dispatchEvent(new Event("input",{bubbles:true}));title.dispatchEvent(new Event("input",{bubbles:true}));area.focus()}
  apply.addEventListener("click",createStructure);
  var structure=Array.from(assistant.querySelectorAll("button")).find(function(b){return /структур/i.test(b.textContent)});
  if(structure){structure.textContent="Вставить структуру выбранного типа";structure.addEventListener("click",function(e){e.preventDefault();e.stopImmediatePropagation();createStructure()},true)}
  var review=Array.from(assistant.querySelectorAll("button")).find(function(b){return /проверить текст/i.test(b.textContent)});
  if(review){review.addEventListener("click",function(e){e.preventDefault();e.stopImmediatePropagation();var t=chosen(),s=area.value,checks=[];function check(ok,msg){checks.push({ok:!!ok,msg:msg})}
    if(!s.trim()){check(false,"Текст пуст.");}
    else{
     check(s.length<120,"Текст короткий: проверьте, достаточно ли фактов и контекста.");
     check(/\[(?:[^\]]+)\]/.test(s),"Есть поля-подсказки в квадратных скобках — заполните или удалите их.");
     check(!/\b(?:дата|число|\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b/i.test(s),"Не найдены явные даты. Если они важны для документа, добавьте их и проверьте последовательность событий.");
     if(t.id==="claim"){check(!/требован|прошу|требую/i.test(s),"В претензии не найдено явно сформулированное требование.");check(!/срок|дней|рабочих дней|календарных дней/i.test(s),"Проверьте, нужен ли срок ответа/исполнения и на каком основании он установлен; срок автоматически не рассчитывается.");check(!/сумм|руб|₽|расчёт|расчет/i.test(s),"Если заявляется денежное требование, проверьте, указаны ли сумма и её расчёт.");}
     if(t.id==="appeal"){check(!/адресат|кому:|в [а-яё]/i.test(s),"Уточните орган или должностное лицо, которому адресуется жалоба.");check(!/обжалу|решени|действи|бездейств/i.test(s),"Опишите конкретное решение, действие или бездействие, которое обжалуется.");check(!/прошу/i.test(s),"Сформулируйте требуемый результат.");}
     if(t.id==="contract"){check(!/сторон|арендодатель|исполнитель|заказчик|продавец|покупатель/i.test(s),"Проверьте, определены ли стороны и их статус.");check(!/предмет договора|предмет|обязуется|услуг|передат/i.test(s),"Проверьте, конкретно ли описан предмет договора.");check(!/срок|дата начала|действия/i.test(s),"Проверьте сроки, порядок исполнения и прекращения.");check(!/цен|оплат|расчёт|расчет/i.test(s),"Проверьте цену и порядок расчётов, если они применимы.");}
     if(t.id==="court"){check(!/суд/i.test(s),"Проверьте наименование и подсудность суда.");check(!(/истец/i.test(s)&&/ответчик/i.test(s)),"Проверьте сведения об истце и ответчике.");check(!/прошу суд/i.test(s),"Проверьте формулировку требований к суду.");}
     if(t.id==="letter"){check(!/адресат|кому:/i.test(s),"Проверьте адресата и сведения для ответа.");check(!/прошу|требую|предлагаю/i.test(s),"Сформулируйте ожидаемое действие или решение.");}
    }
    var results=assistant.querySelector(".text2me-editor-results");if(!results){results=document.createElement("div");results.className="text2me-editor-results";assistant.appendChild(results)}results.replaceChildren();checks.forEach(function(c){var p=document.createElement("p");p.className="text2me-editor-result "+(c.ok?"text2me-editor-result-success":"text2me-editor-result-warning");p.textContent=(c.ok?"Проверено: ":"Проверьте: ")+c.msg;results.appendChild(p)});var caveat=document.createElement("p");caveat.className="text2me-editor-result text2me-editor-result-info";caveat.textContent="Это технический контроль наличия типовых элементов, а не правовая экспертиза. Сроки, правовые основания, подсудность и обязательные условия необходимо проверять по официальным актуальным источникам.";results.appendChild(caveat);
  },true)}
  title.addEventListener("input",sync);area.addEventListener("input",sync);sync();
 }
 install();
});
})();