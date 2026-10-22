(function(){
"use strict";
var form=document.getElementById("rental-builder");
if(!form)return;
var output=document.getElementById("rental-output"),actOutput=document.getElementById("rental-act-output"),empty=document.getElementById("rental-empty"),result=document.getElementById("rental-result"),actResult=document.getElementById("rental-act-result"),status=document.getElementById("rental-status"),savedText=document.getElementById("rental-document-text");
function value(name){var node=form.elements.namedItem(name);return node?String(node.value||"").trim():""}
function dateLabel(v){if(!v)return "[указать дату]";var p=v.split("-");return p.length===3?p[2]+"."+p[1]+"."+p[0]:v}
function money(v){if(!v)return "[указать сумму]";return new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(Number(v))+" руб."}
function field(v,label){return v||"["+label+"]"}
function buildContract(){
 var landlord=value("landlord"),landlordInn=value("landlord-inn"),tenant=value("tenant"),address=value("property-address"),start=value("start-date"),end=value("end-date"),rent=value("rent"),deposit=value("deposit"),due=value("due-day")||"5",utilities=value("utilities"),area=value("area"),rooms=value("rooms"),inventory=value("inventory"),extra=value("extra-terms");
 var lines=[
 "ДОГОВОР НАЙМА ЖИЛОГО ПОМЕЩЕНИЯ",
 "г. [указать населённый пункт]                                      Дата: "+dateLabel(start),
 "",
 field(landlord,"ФИО наймодателя")+(landlordInn?" (ИНН "+landlordInn+")":"")+", именуемый(ая) далее «Наймодатель», с одной стороны, и "+field(tenant,"ФИО нанимателя")+", именуемый(ая) далее «Наниматель», с другой стороны, заключили настоящий договор о нижеследующем.",
 "",
 "1. ПРЕДМЕТ ДОГОВОРА",
 "1.1. Наймодатель предоставляет Нанимателю за плату во временное владение и пользование для проживания жилое помещение по адресу: "+field(address,"адрес помещения")+".",
 "1.2. Характеристики помещения: "+(area?area+" кв. м; ":"")+(rooms||"[указать количество комнат и иные характеристики]")+".",
 "1.3. Реквизиты документов, подтверждающих личность сторон и право Наймодателя на помещение, стороны указывают при подписании договора. Наймодатель подтверждает наличие права передавать помещение в пользование.",
 "",
 "2. СРОК НАЙМА",
 "2.1. Срок найма: с "+dateLabel(start)+" по "+dateLabel(end)+" включительно.",
 "2.2. Передача помещения, ключей и имущества оформляется актом приёма-передачи. Фактическое состояние помещения и обнаруженные недостатки следует перечислить в акте.",
 "",
 "3. ПЛАТА И РАСЧЁТЫ",
 "3.1. Плата за пользование помещением составляет "+money(rent)+" в месяц.",
 "3.2. Наниматель вносит плату ежемесячно не позднее "+due+"-го числа соответствующего месяца способом, согласованным сторонами, с сохранением подтверждения оплаты.",
 "3.3. Обеспечительный платёж: "+(deposit?money(deposit):"не предусмотрен")+". Условия его зачёта и возврата стороны должны согласовать отдельно и применять с учётом закона.",
 "3.4. Коммунальные и иные платежи: "+field(utilities,"порядок оплаты коммунальных платежей")+". Показания счётчиков и распределение иных расходов фиксируются сторонами.",
 "",
 "4. ПРАВА И ОБЯЗАННОСТИ СТОРОН",
 "4.1. Наймодатель передаёт помещение в состоянии, пригодном для проживания, и не препятствует согласованному пользованию помещением.",
 "4.2. Наниматель использует помещение для проживания, своевременно вносит плату, бережно относится к помещению и имуществу, сообщает об авариях и существенных повреждениях.",
 "4.3. Порядок доступа Наймодателя в помещение, проведения ремонта, проживания иных лиц и содержания животных стороны согласуют заранее, соблюдая права проживающих и требования закона.",
 "4.4. Имущество и состояние помещения при передаче: "+field(inventory,"описание имущества и состояния")+". Подробный перечень рекомендуется приложить к акту.",
 "",
 "5. ИЗМЕНЕНИЕ И ПРЕКРАЩЕНИЕ ДОГОВОРА",
 "5.1. Изменения договора оформляются письменно и подтверждаются обеими сторонами.",
 "5.2. Основания, сроки уведомления и порядок прекращения договора определяются законом и согласованными условиями. Перед подписанием стороны должны проверить применимые правила и при необходимости дополнить этот раздел.",
 "5.3. При возврате помещения стороны сверяют состояние имущества, ключи, показания счётчиков и расчёты; выявленные обстоятельства фиксируются письменно.",
 "",
 "6. ДОПОЛНИТЕЛЬНЫЕ УСЛОВИЯ",
 field(extra,"дополнительные условия"),
 "",
 "7. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ",
 "7.1. Договор составлен в двух экземплярах, по одному для каждой стороны.",
 "7.2. Приложения (если есть): акт приёма-передачи, опись имущества, фотографии состояния помещения, согласованный график платежей.",
 "",
 "8. РЕКВИЗИТЫ И ПОДПИСИ СТОРОН",
 "НАЙМОДАТЕЛЬ: "+field(landlord,"ФИО")+". Документ, удостоверяющий личность: [указать вручную]. Контакт: [указать].",
 "Подпись: __________________________",
 "",
 "НАНИМАТЕЛЬ: "+field(tenant,"ФИО")+". Документ, удостоверяющий личность: [указать вручную]. Контакт: [указать].",
 "Подпись: __________________________",
 "",
 "Перед подписанием проверьте срок договора, право наймодателя на помещение, условия оплаты и прекращения, реквизиты сторон и соответствие актуальным нормам."
 ];
 return lines.join("\n")
}
function buildAct(){
 return [
 "АКТ ПРИЁМА-ПЕРЕДАЧИ ЖИЛОГО ПОМЕЩЕНИЯ",
 "к договору найма жилого помещения от "+dateLabel(value("start-date")),
 "",
 "г. [указать населённый пункт]                                      Дата передачи: "+dateLabel(value("start-date")),
 "",
 "Наймодатель: "+field(value("landlord"),"ФИО наймодателя")+".",
 "Наниматель: "+field(value("tenant"),"ФИО нанимателя")+".",
 "Адрес помещения: "+field(value("property-address"),"адрес помещения")+".",
 "",
 "1. Наймодатель передал, а Наниматель принял указанное жилое помещение и следующие ключи: [количество и описание].",
 "2. Состояние помещения и имущества на момент передачи: "+field(value("inventory"),"описание состояния и имущества")+".",
 "3. Показания счётчиков на дату передачи: электричество [ ], холодная вода [ ], горячая вода [ ], иные приборы [ ].",
 "4. Обнаруженные недостатки / повреждения: [перечислить или указать «не выявлены» после осмотра].",
 "5. Фотофиксация и опись имущества: [перечислить приложения, если имеются].",
 "",
 "Стороны подтверждают, что сведения в акте соответствуют фактическому состоянию помещения на дату передачи.",
 "",
 "Наймодатель: "+field(value("landlord"),"ФИО")+"  Подпись: __________________",
 "Наниматель: "+field(value("tenant"),"ФИО")+"  Подпись: __________________"
 ].join("\n")
}
function updateSavedText(){if(!savedText)return;savedText.value=output.textContent;savedText.dispatchEvent(new Event("input",{bubbles:true}))}
function showActions(){document.querySelectorAll(".document-export-actions").forEach(function(n){if(n.parentElement===output.parentElement||n.parentElement===actOutput.parentElement)n.hidden=false;n.style.display=""})}
function restore(){
 if(savedText&&savedText.value.trim()){output.textContent=savedText.value;output.hidden=false;empty.hidden=true;result.hidden=false;status.textContent="Сохранённый текст восстановлен. Можно продолжить редактирование и экспортировать файл.";showActions()}
 else if(value("landlord")||value("tenant")||value("property-address")){status.textContent="Найден локальный черновик формы. Проверьте поля и нажмите «Сформировать договор»."}
}
form.addEventListener("submit",function(e){
 e.preventDefault();
 var start=value("start-date"),end=value("end-date");
 if(start&&end&&end<start){status.textContent="Дата окончания не может быть раньше даты начала.";form.elements.namedItem("end-date").focus();return}
 output.textContent=buildContract();output.hidden=false;empty.hidden=true;result.hidden=false;status.textContent="Договор сформирован. Нажмите на текст, чтобы исправить его; изменения войдут в экспорт.";
 updateSavedText();showActions();output.scrollIntoView({behavior:"smooth",block:"start"})
});
output.addEventListener("input",function(){if(savedText)savedText.value=output.textContent;status.textContent="Предпросмотр изменён. Экспортируйте документ или продолжайте редактирование.";if(savedText)savedText.dispatchEvent(new Event("input",{bubbles:true}))});
document.getElementById("rental-create-act").addEventListener("click",function(){actOutput.textContent=buildAct();actResult.hidden=false;showActions();actOutput.scrollIntoView({behavior:"smooth",block:"start"})});
actOutput.addEventListener("input",function(){var n=document.getElementById("rental-act-status");if(n)n.textContent="Текст акта изменён.";});
form.addEventListener("reset",function(){setTimeout(function(){output.textContent="";output.hidden=true;actOutput.textContent="";actResult.hidden=true;result.hidden=true;empty.hidden=false;status.textContent="Форма очищена.";if(savedText)savedText.value=""},0)});
document.addEventListener("DOMContentLoaded",function(){
 document.querySelectorAll(".document-export-actions").forEach(function(n){n.hidden=true;n.style.display="none"});
 restore();
});
})();
