(function () {
  "use strict";
  function fitPromptFields(){var fields=document.querySelectorAll("#main textarea[readonly]");fields.forEach(function(field){field.style.overflowY="hidden";field.style.height="auto";field.style.height=(field.scrollHeight+2)+"px";});}
  if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",fitPromptFields);}else{fitPromptFields();}
  window.addEventListener("resize",fitPromptFields);

  function fitPromptFields() {
    var fields = document.querySelectorAll("#main textarea[readonly]");
    fields.forEach(function (field) {
      field.style.overflowY = "hidden";
      field.style.height = "auto";
      field.style.height = (field.scrollHeight + 2) + "px";
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fitPromptFields);
  } else {
    fitPromptFields();
  }
  window.addEventListener("resize", fitPromptFields);

  var searchForm = document.getElementById("document-search");
  if (searchForm) {
    var input = document.getElementById("search-input");
    var quickCards = Array.prototype.slice.call(document.querySelectorAll("#quick-actions a"));
    var catalogCards = Array.prototype.slice.call(document.querySelectorAll("#catalog-cards [data-search-item]"));
    var status = document.getElementById("search-status");
    var empty = document.getElementById("empty-state");
    function filterCards() {
      var query = (input.value || "").trim().toLocaleLowerCase("ru");
      var visible = 0;
      quickCards.forEach(function (card) {
        var haystack = ((card.innerText || "") + " " + (card.getAttribute("data-search") || "")).toLocaleLowerCase("ru");
        var match = !query || haystack.indexOf(query) !== -1;
        card.hidden = !match;
        if (match) visible++;
      });
      catalogCards.forEach(function (card) {
        var haystack = ((card.innerText || "") + " " + (card.getAttribute("data-search") || "")).toLocaleLowerCase("ru");
        var match = !query || haystack.indexOf(query) !== -1;
        card.hidden = !match;
        if (match) visible++;
      });
      if (status) status.textContent = query ? "Найдено подходящих направлений: " + visible : "";
      if (empty) empty.hidden = visible !== 0;
    }
    searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      filterCards();
    });
    input.addEventListener("input", filterCards);
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-search-chip]"), function (chip) {
    chip.addEventListener("click", function () {
      var input = document.getElementById("search-input");
      var form = document.getElementById("document-search");
      if (!input) return;
      input.value = chip.getAttribute("data-search-chip") || "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      var catalog = document.getElementById("catalog");
      if (catalog) catalog.scrollIntoView({ behavior: "smooth", block: "start" });
      else if (form) form.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  var aiPathForm = document.getElementById("ai-path-form");
  if (aiPathForm) {
    aiPathForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var prompt = document.getElementById("ai-path-input");
      var description = document.getElementById("need-description");
      var status = document.getElementById("ai-path-status");
      var routeBuilder = document.getElementById("route-builder");
      if (!prompt || !prompt.value.trim()) {
        if (status) status.textContent = "Сначала кратко опишите задачу.";
        if (prompt) prompt.focus();
        return;
      }
      if (description) description.value = prompt.value.trim();
      if (status) status.textContent = "ИИ пока не подключён. Описание перенесено в форму ситуации ниже: выберите тему и желаемый результат, чтобы получить стартовую подсказку.";
      if (routeBuilder) routeBuilder.scrollIntoView({ behavior: "smooth", block: "start" });
      var area = document.getElementById("need-area");
      if (area) area.focus({ preventScroll: true });
    });
  }

  var needForm = document.getElementById("need-form");
  if (needForm) {
    var needResult = document.getElementById("need-result");
    var needArea = document.getElementById("need-area");
    var needGoal = document.getElementById("need-goal");
    var needDescription = document.getElementById("need-description");
    var needDetail = document.getElementById("need-detail");
    var needDetailWrap = document.getElementById("need-detail-wrap");
    var needStatus = document.getElementById("need-status");
    var needStatusWrap = document.getElementById("need-status-wrap");
    var detailOptions = {
      consumer: [["defect","Товар с недостатком"],["refund","Не возвращают деньги"],["service","Некачественная услуга"],["delivery","Проблема с доставкой"],["warranty","Спор по гарантии"],["other","Другое"]],
      housing: [["maintenance","Плохое содержание дома"],["utilities","Перебои с коммунальной услугой"],["payment","Начисление или платёж"],["neighbors","Действия соседей"],["management","Управляющая организация не отвечает"],["other","Другое"]],
      work: [["salary","Задержка или невыплата зарплаты"],["dismissal","Увольнение или давление"],["conditions","Условия труда"],["leave","Отпуск или больничный"],["contract","Трудовой договор"],["other","Другое"]],
      money: [["unknown-charge","Непонятное списание"],["bank","Спор с банком"],["debt","Долг или взыскание"],["tax","Налог или вычет"],["benefit","Выплата или пособие"],["other","Другое"]],
      government: [["application","Подать заявление"],["status","Узнать статус заявления"],["document","Получить справку или документ"],["benefit","Оформить выплату"],["refusal","Отказали в услуге"],["other","Другое"]],
      business: [["contract","Договор или условия сделки"],["payment","Оплата или задолженность"],["client","Письмо клиенту или партнёру"],["claim","Претензия контрагенту"],["offer","Коммерческое предложение"],["other","Другое"]],
      court: [["claim","Подготовить иск"],["file","Подать готовые документы"],["response","Ответить на иск или документ суда"],["appeal","Обжаловать решение"],["debt","Взыскать долг"],["other","Другое"]],
      other: [["document","Нужен документ"],["official","Нужен официальный сервис"],["advice","Не понимаю, с чего начать"],["other","Другое"]]
    };
    function updateDetailOptions() {
      var options = detailOptions[needArea.value] || [];
      needDetail.textContent = "";
      var placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Выберите уточнение";
      needDetail.appendChild(placeholder);
      options.forEach(function (item) {
        var option = document.createElement("option");
        option.value = item[0];
        option.textContent = item[1];
        needDetail.appendChild(option);
      });
      needDetailWrap.hidden = !needArea.value;
      needDetail.required = !!needArea.value;
      needStatusWrap.hidden = !needArea.value;
      needStatus.required = !!needArea.value;
    }
    needArea.addEventListener("change", updateDetailOptions);
    var routeData = {
      consumer: {
        title: "Покупка или услуга: начните с фактов и требования",
        copy: "Сохраните чек или заказ, переписку, фотографии и даты. Если товар с недостатком, можно подготовить черновик претензии, а затем проверить, подходит ли выбранное требование.",
        links: [{label:"Подготовить черновик претензии",url:"/text2me/documents/pretenziya-prodavtsu/"},{label:"Официальные рекомендации Роспотребнадзора",url:"https://www.rospotrebnadzor.ru/"}]
      },
      housing: {
        title: "Дом и ЖКХ: зафиксируйте проблему и адресата",
        copy: "Уточните, кто отвечает за услугу, зафиксируйте дату и обстоятельства, сохраните обращения и ответы. Дальше выберите официальный канал для вашей услуги или подготовьте письменное обращение.",
        links: [{label:"Каталог жизненных ситуаций на Госуслугах",url:"https://www.gosuslugi.ru/landing/forcitizens"},{label:"Подготовить обращение",url:"/text2me/people/"}]
      },
      work: {
        title: "Работа: соберите подтверждения и уточните способ обращения",
        copy: "Сохраните договор, расчётные листки, график, переписку и даты событий. Не отправляйте оригиналы документов без необходимости. По трудовому вопросу проверьте официальный канал инспекции труда.",
        links: [{label:"Онлайнинспекция.рф",url:"https://онлайнинспекция.рф/"},{label:"Подготовить письменное обращение",url:"/text2me/people/"}]
      },
      money: {
        title: "Деньги или платёж: определите получателя и основание",
        copy: "Найдите дату, сумму и получателя операции; сохраните выписку и номер обращения. Не публикуйте полный номер карты, пароль или коды подтверждения. Канал дальнейшего обращения зависит от типа операции.",
        links: [{label:"Банк России — финансовые вопросы",url:"https://www.cbr.ru/"},{label:"ФНС России — налоги и вычеты",url:"https://www.nalog.gov.ru/"}]
      },
      government: {
        title: "Государственная услуга: найдите сценарий по жизненной ситуации",
        copy: "Уточните, что именно нужно получить, кто заявитель и в каком регионе оказывается услуга. На официальном портале проверьте условия, список документов и способ подачи.",
        links: [{label:"Каталог услуг для граждан",url:"https://www.gosuslugi.ru/landing/forcitizens"}]
      },
      court: {
        title: "Суд: сначала выберите, что нужно сделать",
        copy: "Подготовьте документы и доказательства, проверьте требования к форме обращения, подсудность, приложения и госпошлину (если она требуется). Электронная подача зависит от вида дела, суда и доступного сервиса. Податьвсуд.РФ — сторонняя платформа, не государственный сайт; перед использованием проверьте условия и стоимость.",
        links: [
          {label:"Подготовить черновик искового заявления",url:"/text2me/documents/isk-v-sud/"},
          {label:"Официальная система «Электронное правосудие» (ГАС «Правосудие»)",url:"https://ej.sudrf.ru/"},
          {label:"Податьвсуд.РФ — подготовка документов и варианты подачи",url:"https://xn--80aeec0cfsgl1g.xn--p1ai/"}
        ]
      },
      business: {
        title: "Деловая задача: зафиксируйте договорённости и желаемый результат",
        copy: "Уточните стороны, предмет договорённости, сумму, сроки и что уже согласовано. Затем выберите подходящий формат письма или документа и проверьте условия перед подписанием.",
        links: [{label:"Материалы для бизнеса",url:"/text2me/business/"}]
      },
      other: {
        title: "Начните с описания результата, который вам нужен",
        copy: "Опишите, что произошло, кто участвует, что вы уже пробовали и что должно измениться. Если непонятно, какой документ или сервис нужен, начните с короткого письменного обращения с фактами и конкретной просьбой.",
        links: [{label:"Материалы для населения",url:"/text2me/people/"},{label:"Официальный каталог Госуслуг",url:"https://www.gosuslugi.ru/landing/forcitizens"}]
      }
    };
    function renderNeedRoute() {
      var route = routeData[needArea.value] || routeData.other;
      var goal = needGoal.value;
      var selectedDetail = needDetail.options[needDetail.selectedIndex];
      var detailText = selectedDetail && selectedDetail.value ? selectedDetail.textContent : "";
      var extra = "";
      if (detailText) extra += " Уточнение ситуации: " + detailText + ".";
      if (needStatus.value === "not-contacted") extra += " Вы ещё не обращались: сначала зафиксируйте факты, определите ответственного адресата и сформулируйте конкретную просьбу.";
      if (needStatus.value === "waiting") extra += " Вы уже обратились и ждёте ответ: сохраните подтверждение обращения и дату подачи, проверьте официальный срок ответа для этого вида обращения.";
      if (needStatus.value === "refused") extra += " Вы получили отказ или вопрос не решён: сохраните полный текст ответа, выясните мотивировку и порядок обжалования. Не отправляйте повторное обращение, не разобравшись с причиной отказа.";
      if (needStatus.value === "deadline") extra += " Срок, по вашему мнению, прошёл: проверьте дату получения обращения адресатом и применимый срок именно для вашей процедуры.";
      if (needStatus.value === "unsure") extra += " Если этап непонятен, начните с хронологии: дата события, кому обращались, что ответили и что остаётся нерешённым.";
      var descriptionText = (needDescription.value || "").trim();
      if (descriptionText) extra += " Ваше описание сохранено только в этом окне и не отправляется на сервер: «" + descriptionText.slice(0, 420) + (descriptionText.length > 420 ? "…" : "") + "». Проверьте, что в нём нет лишних персональных или финансовых данных.";
      if (goal === "document") extra += " Цель — документ: в тексте изложите факты по датам, приложите подтверждения и сформулируйте одно конкретное требование.";
      if (goal === "official") extra += " Цель — официальная услуга: перед подачей проверьте условия, регион, срок и перечень документов на сайте ведомства.";
      if (goal === "money") extra += " Цель — получить деньги: укажите сумму, основание требования и доказательства оплаты; не считайте возврат гарантированным.";
      if (goal === "contact") extra += " Цель — письмо: обозначьте адресата, кратко изложите ситуацию и сформулируйте, какого ответа или действия ожидаете.";
      if (needArea.value === "court") {
        var courtAdvice = {
          claim: "Перед подготовкой иска определите ответчика, конкретные требования, факты по датам и доказательства. Проверьте подсудность, цену иска, обязательный досудебный порядок, госпошлину и приложения.",
          file: "Перед отправкой проверьте, что документ подписан, приложения приложены, выбран правильный суд и способ подачи. Сохраните подтверждение отправки и результат регистрации.",
          response: "Проверьте номер дела, содержание требований и сроки из судебного документа. Изложите возражения по пунктам и приложите подтверждения; не игнорируйте назначенные судом сроки.",
          appeal: "Сначала установите вид судебного акта и дату, с которой исчисляется срок обжалования. Порядок и срок зависят от вида дела и акта; проверьте их по официальному источнику или получите юридическую помощь.",
          debt: "Соберите договоры, расписки, акты, переписку и подтверждения платежей; составьте расчёт долга по датам. Проверьте, нужен ли претензионный порядок и какой способ судебного взыскания применим.",
          other: "Уточните вид судопроизводства, суд, стадию дела и желаемый результат. Если уже получали документ из суда, ориентируйтесь на его содержание и указанные сроки."
        };
        extra += " " + (courtAdvice[needDetail.value] || courtAdvice.other);
      }
      document.getElementById("need-result-title").textContent = route.title;
      document.getElementById("need-result-copy").textContent = route.copy + extra;
      var links = document.getElementById("need-result-links");
      links.textContent = "";
      route.links.forEach(function (item) {
        var a = document.createElement("a");
        a.href = item.url;
        a.textContent = item.label + (item.url.indexOf("http") === 0 ? " ↗" : " →");
        if (item.url.indexOf("http") === 0) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
        links.appendChild(a);
      });
      needResult.hidden = false;
    }
    needForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!needForm.reportValidity()) return;
      renderNeedRoute();
      needResult.scrollIntoView({behavior:"smooth",block:"nearest"});
    });
    needForm.addEventListener("reset", function () {
      needResult.hidden = true;
      if (needDescription) needDescription.value = "";
      if (needDetail) needDetail.value = "";
      if (needStatus) needStatus.value = "";
      needArea.value = "";
      updateDetailOptions();
    });
    updateDetailOptions();
    Array.prototype.forEach.call(document.querySelectorAll("[data-route-preset]"), function (link) {
      link.addEventListener("click", function (event) {
        needArea.value = link.getAttribute("data-route-preset");
        updateDetailOptions();
        var goal = link.getAttribute("data-route-goal");
        if (goal) needGoal.value = goal;
        var detail = link.getAttribute("data-route-detail");
        if (detail) needDetail.value = detail;
        needStatus.value = "unsure";
        if (link.getAttribute("href") === "#need-result") {
          event.preventDefault();
          renderNeedRoute();
          needResult.scrollIntoView({behavior:"smooth",block:"center"});
        } else {
          document.getElementById("route-builder").scrollIntoView({behavior:"smooth",block:"start"});
        }
      });
    });
  }

  function digitsOnly(value) { return String(value || "").replace(/\D/g, ""); }
  function validInn(value) {
    var d = digitsOnly(value);
    if (d.length === 10) return [2,4,10,3,5,9,4,6,8].reduce(function(s,w,i){return s+w*Number(d[i]);},0)%11%10 === Number(d[9]);
    if (d.length === 12) {
      var c11=[7,2,4,10,3,5,9,4,6,8].reduce(function(s,w,i){return s+w*Number(d[i]);},0)%11%10;
      var c12=[3,7,2,4,10,3,5,9,4,6,8].reduce(function(s,w,i){return s+w*Number(d[i]);},0)%11%10;
      return c11===Number(d[10]) && c12===Number(d[11]);
    }
    return false;
  }
  function validSnils(value) {
    var d=digitsOnly(value); if(d.length!==11) return false;
    if(Number(d.slice(0,9))<1001998) return true;
    var sum=0; for(var i=0;i<9;i++) sum+=Number(d[i])*(9-i);
    var check=sum%101; if(check===100||check===101) check=0;
    return check===Number(d.slice(9));
  }
  function setIdentityValidity(id,kind) {
    var node=document.getElementById(id); if(!node) return;
    var value=node.value.trim(), message="";
    if(value && kind==="inn" && !validInn(value)) message="Проверьте длину и контрольные цифры ИНН.";
    if(value && kind==="snils" && !validSnils(value)) message="Проверьте формат и контрольное число СНИЛС.";
    node.setCustomValidity(message); node.setAttribute("aria-invalid",message?"true":"false");
  }
  ["plaintiff-inn","defendant-inn"].forEach(function(id){var n=document.getElementById(id);if(n){["input","blur"].forEach(function(ev){n.addEventListener(ev,function(){setIdentityValidity(id,"inn");});});}});
  ["plaintiff-snils"].forEach(function(id){var n=document.getElementById(id);if(n){["input","blur"].forEach(function(ev){n.addEventListener(ev,function(){setIdentityValidity(id,"snils");});});}});
  var courtPriceInput=document.getElementById("court-price");
  if(courtPriceInput) courtPriceInput.addEventListener("input",function(){var v=courtPriceInput.value.trim();courtPriceInput.setCustomValidity(v&&(!Number.isFinite(Number(v))||Number(v)<=0)?"Укажите сумму больше нуля или оставьте поле пустым.":"");});
  var readinessButton=document.getElementById("court-readiness-check");
  if(readinessButton) readinessButton.addEventListener("click",function(){
    var checks=Array.prototype.slice.call(document.querySelectorAll("#court-readiness input[type=checkbox]"));
    var checked=checks.filter(function(x){return x.checked;}).length, missing=checks.filter(function(x){return !x.checked;}).map(function(x){return x.parentElement.textContent.trim();});
    var status=document.getElementById("court-readiness-status"); if(!status)return;
    status.textContent=checked===checks.length?"Отмечены все 5 пунктов. Это не подтверждает юридическую готовность: проверьте требования для вашего вида дела.":"Отмечено "+checked+" из "+checks.length+". Проверьте: "+missing.join("; ")+". Некоторые пункты могут быть неприменимы.";
  });
  var courtForm = document.getElementById("court-builder");
  if (courtForm) {
    var courtOutput = document.getElementById("court-output");
    var courtResult = document.getElementById("court-result");
    var courtStatus = document.getElementById("court-action-status");
    function courtField(id) {
      var node = document.getElementById(id);
      return node ? node.value.trim() : "";
    }
    function makeCourtDraft() {
      var court = courtField("court-name");
      var plaintiff = courtField("plaintiff-name");
      var plaintiffAddress = courtField("plaintiff-address");
      var plaintiffContact = courtField("plaintiff-contact");
      var defendant = courtField("defendant-name");
      var defendantAddress = courtField("defendant-address");
      var caseType = courtField("court-case-type");
      var price = courtField("court-price");
      var facts = courtField("court-facts");
      var demands = courtField("court-demands");
      var pretrial = courtField("court-pretrial");
      var attachments = courtField("court-attachments");
      var lines = [];
      lines.push(court || "[Укажите наименование суда — проверьте подсудность]");
      lines.push("");
      lines.push("Истец: " + (plaintiff || "[ФИО или наименование истца]"));
      lines.push("Адрес истца: " + (plaintiffAddress || "[укажите адрес, если он требуется для выбранного порядка]"));
      var plaintiffInn=courtField("plaintiff-inn"), plaintiffSnils=courtField("plaintiff-snils"), defendantInn=courtField("defendant-inn");
      if(plaintiffInn) lines.push("ИНН истца: "+digitsOnly(plaintiffInn));
      if(plaintiffSnils) lines.push("СНИЛС истца: "+digitsOnly(plaintiffSnils));
      if (plaintiffContact) lines.push("Контактные данные истца: " + plaintiffContact);
      lines.push("Ответчик: " + (defendant || "[ФИО или наименование ответчика]"));
      if (defendantAddress) lines.push("Адрес ответчика: " + defendantAddress);
      if(defendantInn) lines.push("ИНН ответчика: "+digitsOnly(defendantInn));
      lines.push("");
      lines.push("ИСКОВОЕ ЗАЯВЛЕНИЕ");
      lines.push("о " + (caseType || "[укажите предмет иска]"));
      lines.push("");
      if (price) lines.push("Цена иска: " + price + " руб. [проверьте состав расчёта и необходимость указания]");
      lines.push("");
      lines.push("1. Обстоятельства дела");
      lines.push(facts || "[Последовательно изложите события, даты, участников и подтверждающие документы.]");
      lines.push("");
      lines.push("2. Требования истца");
      lines.push(demands || "[Сформулируйте конкретные требования к ответчику.]");
      lines.push("");
      lines.push("3. Досудебный порядок");
      lines.push(pretrial || "[Укажите, направлялась ли претензия или соблюдался ли обязательный досудебный порядок; проверьте, обязателен ли он для вашего спора.]");
      lines.push("");
      lines.push("4. Приложения");
      if (attachments) {
        attachments.split(/\n|;/).map(function (item) { return item.trim(); }).filter(Boolean).forEach(function (item, index) {
          lines.push((index + 1) + ". " + item);
        });
      } else {
        lines.push("[Перечислите документы, которые фактически приложите: доказательства обстоятельств, расчёт, подтверждение отправки копий другим участникам и иные требуемые документы.]");
      }
      lines.push("");
      lines.push("На основании изложенного прошу суд удовлетворить заявленные требования.");
      lines.push("");
      lines.push("Дата: «____» ______________ 20___ г.");
      lines.push("Подпись: __________________ / " + (plaintiff || "[ФИО]") + " /");
      lines.push("");
      lines.push("ПРОВЕРИТЬ ПЕРЕД ПОДАЧЕЙ");
      lines.push("• Правильность вида судопроизводства, подсудности и наименования суда.");
      lines.push("• Требования к форме и содержанию заявления для вашей категории дела.");
      lines.push("• Расчёт цены иска и госпошлину либо основание льготы/освобождения, если применимо.");
      lines.push("• Обязательный досудебный порядок и сроки обращения.");
      lines.push("• Наличие подписей, копий для участников и всех обязательных приложений.");
      lines.push("• Способ подачи и актуальные правила выбранного суда.");
      lines.push("");
      lines.push("Это универсальный черновик для дальнейшей проверки, а не готовая к подаче форма. Он не определяет подсудность, не рассчитывает госпошлину и не проверяет юридическую обоснованность требований. Требования к иску зависят от вида спора и процедуры.");
      return lines.join("\n");
    }
    courtForm.addEventListener("submit", function (event) {
      event.preventDefault();
      ["plaintiff-inn","defendant-inn"].forEach(function(id){setIdentityValidity(id,"inn");});
      ["plaintiff-snils"].forEach(function(id){setIdentityValidity(id,"snils");});
      if (!courtForm.reportValidity()) return;
      courtOutput.textContent = makeCourtDraft();
      courtResult.hidden = false;
      courtStatus.textContent = "Черновик готов в этом браузере. Перечитайте его и проверьте требования перед подачей.";
      courtResult.scrollIntoView({behavior:"smooth",block:"start"});
    });
    courtForm.addEventListener("reset", function () {
      courtResult.hidden = true;
      courtOutput.textContent = "";
      courtStatus.textContent = "";
    });
    var courtDownload = document.getElementById("download-court");
    if (courtDownload) courtDownload.addEventListener("click", function () {
      if (!courtOutput.textContent) return;
      var blob = new Blob(["\ufeff", courtOutput.textContent], {type:"text/plain;charset=utf-8"});
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "iskovoe-zayavlenie-chernovik.txt";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      courtStatus.textContent = "Файл с черновиком готов к скачиванию.";
    });
    var courtCopy = document.getElementById("copy-court");
    if (courtCopy) courtCopy.addEventListener("click", function () {
      if (!courtOutput.textContent) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(courtOutput.textContent).then(function () {
          courtStatus.textContent = "Текст скопирован.";
        }).catch(function () {
          courtStatus.textContent = "Не удалось скопировать автоматически. Выделите текст черновика и скопируйте вручную.";
        });
      } else {
        courtStatus.textContent = "Автоматическое копирование недоступно. Выделите текст черновика и скопируйте вручную.";
      }
    });
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-copy-target]");
    if (!button) return;
    var target = document.getElementById(button.getAttribute("data-copy-target"));
    if (!target) return;
    var value = target.value || target.textContent || "";
    if (!value) return;
    function copied() {
      var oldLabel = button.getAttribute("data-original-label") || button.textContent;
      button.setAttribute("data-original-label", oldLabel);
      button.textContent = "Скопировано";
      window.setTimeout(function () { button.textContent = oldLabel; }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(copied).catch(function () {
        target.focus();
        target.select();
        button.textContent = "Выделено — скопируйте";
      });
    } else {
      target.focus();
      target.select();
      button.textContent = "Выделено — скопируйте";
    }
  });

  var claimForm = document.getElementById("claim-builder");
  if (!claimForm) return;

  var resultPanel = document.getElementById("claim-result");
  var output = document.getElementById("claim-output");
  var actionStatus = document.getElementById("claim-action-status");
  var demandLabels = {
    refund: "отказаться от исполнения договора купли-продажи и потребовать возврата уплаченной за товар суммы",
    "replace-same": "потребовать замены на товар этой же марки (модели, артикула)",
    "replace-other": "потребовать замены на аналогичный товар другой марки (модели, артикула) с соответствующим перерасчётом покупной цены",
    reduce: "потребовать соразмерного уменьшения покупной цены",
    repair: "потребовать безвозмездного устранения недостатка товара",
    costs: "потребовать возмещения расходов на устранение недостатка"
  };

  function field(id) {
    var element = document.getElementById(id);
    return element ? element.value.trim() : "";
  }

  function dateText(value) {
    if (!value) return "[укажите дату покупки]";
    var parts = value.split("-");
    return parts.length === 3 ? parts[2] + "." + parts[1] + "." + parts[0] : value;
  }

  function makeClaim() {
    var seller = field("seller-name");
    var sellerAddress = field("seller-address");
    var sellerInn = field("seller-inn");
    var buyer = field("buyer-name");
    var buyerAddress = field("buyer-address");
    var buyerContact = field("buyer-contact");
    var product = field("product-name");
    var purchaseDate = dateText(field("purchase-date"));
    var price = field("product-price");
    var defect = field("defect-description");
    var situationContext = field("situation-context");
    var demand = demandLabels[field("claim-demand")];
    var attachments = field("attachments");
    var lines = [];

    lines.push(seller);
    if (sellerInn) lines.push("ИНН: " + sellerInn);
    if (sellerAddress) lines.push(sellerAddress);
    lines.push("");
    lines.push("От: " + buyer);
    if (buyerAddress) lines.push("Адрес для ответа: " + buyerAddress);
    if (buyerContact) lines.push("Контакт: " + buyerContact);
    lines.push("");
    lines.push("ПРЕТЕНЗИЯ");
    lines.push("в связи с обнаружением недостатка товара");
    lines.push("");
    lines.push("Дата приобретения: " + purchaseDate + ".");
    lines.push("Товар: " + product + ".");
    if (price) lines.push("Цена товара: " + price + " руб.");
    lines.push("");
    lines.push("Описание ситуации");
    if (situationContext) { lines.push("Дополнительный контекст со слов заявителя:"); lines.push(situationContext); lines.push(""); }
    lines.push("Описание недостатка товара:");
    lines.push(defect);
    lines.push("");
    lines.push("На основании изложенного прошу: " + demand + ".");
    lines.push("");
    lines.push("Прошу рассмотреть настоящее обращение и сообщить о принятом решении по указанным выше контактным данным.");
    lines.push("");
    if (attachments) {
      lines.push("Приложения:");
      attachments.split(/\n|;/).map(function (item) { return item.trim(); }).filter(Boolean).forEach(function (item, index) {
        lines.push((index + 1) + ". " + item);
      });
      lines.push("");
    } else {
      lines.push("Приложения: [перечислите фактически прилагаемые документы, если они есть].");
      lines.push("");
    }
    lines.push("Дата: «____» ______________ 20___ г.");
    lines.push("");
    lines.push("Подпись: __________________ / " + buyer + " /");
    lines.push("");
    lines.push("---");
    lines.push("ПЕРЕД ИСПОЛЬЗОВАНИЕМ ПРОВЕРЬТЕ:");
    lines.push("1. Правильно ли определён продавец и его адрес.");
    lines.push("2. Применимо ли выбранное требование к категории товара и обстоятельствам.");
    lines.push("3. Актуальные правовые основания и срок исполнения требования.");
    lines.push("4. Все ли указанные приложения действительно приложены.");
    lines.push("5. Сохраните копию претензии и подтверждение её передачи продавцу.");
    lines.push("");
    lines.push("Этот текст — автоматически собранный черновик. Он не прошёл индивидуальную юридическую проверку и не подтверждает обоснованность требования.");
    return lines.join("\n");
  }

  claimForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!claimForm.reportValidity()) return;
    output.textContent = makeClaim();
    resultPanel.hidden = false;
    actionStatus.textContent = "Черновик готов. Перечитайте весь текст и проверьте детали перед использованием.";
    resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  claimForm.addEventListener("reset", function () {
    resultPanel.hidden = true;
    output.textContent = "";
    actionStatus.textContent = "";
  });

  var downloadButton = document.getElementById("download-claim");
  if (downloadButton) {
    downloadButton.addEventListener("click", function () {
      if (!output.textContent) return;
      var blob = new Blob(["\ufeff", output.textContent], { type: "text/plain;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "pretenziya-prodavtsu-chernovik.txt";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      actionStatus.textContent = "Файл с черновиком готов к скачиванию.";
    });
  }

  var copyButton = document.getElementById("copy-claim");
  if (copyButton) {
    copyButton.addEventListener("click", function () {
      if (!output.textContent) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(output.textContent).then(function () {
          actionStatus.textContent = "Текст скопирован.";
        }).catch(function () {
          actionStatus.textContent = "Автоматически скопировать не получилось. Выделите текст черновика и скопируйте вручную.";
        });
      } else {
        actionStatus.textContent = "В этом браузере автоматическое копирование недоступно. Выделите текст черновика и скопируйте вручную.";
      }
    });
  }
  var backToTop = document.querySelector("[data-back-to-top]");
  if (backToTop) {
    backToTop.addEventListener("click", function (event) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }



}());