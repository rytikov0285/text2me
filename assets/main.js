(function () {
  "use strict";

  var searchForm = document.getElementById("document-search");
  if (searchForm) {
    var input = document.getElementById("search-input");
    var cards = Array.prototype.slice.call(document.querySelectorAll("#document-cards .choice-card"));
    var status = document.getElementById("search-status");
    var empty = document.getElementById("empty-state");
    function filterCards() {
      var query = (input.value || "").trim().toLocaleLowerCase("ru");
      var visible = 0;
      cards.forEach(function (card) {
        var haystack = ((card.innerText || "") + " " + (card.getAttribute("data-search") || "")).toLocaleLowerCase("ru");
        var match = !query || haystack.indexOf(query) !== -1;
        card.hidden = !match;
        if (match) visible++;
      });
      if (status) status.textContent = query ? "Найдено разделов: " + visible : "";
      if (empty) empty.hidden = visible !== 0;
    }
    searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      filterCards();
    });
    input.addEventListener("input", filterCards);
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
      link.addEventListener("click", function () {
        needArea.value = link.getAttribute("data-route-preset");
        document.getElementById("route-builder").scrollIntoView({behavior:"smooth",block:"start"});
      });
    });
  }

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
    var buyer = field("buyer-name");
    var buyerAddress = field("buyer-address");
    var buyerContact = field("buyer-contact");
    var product = field("product-name");
    var purchaseDate = dateText(field("purchase-date"));
    var price = field("product-price");
    var defect = field("defect-description");
    var demand = demandLabels[field("claim-demand")];
    var attachments = field("attachments");
    var lines = [];

    lines.push(seller);
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
    actionStatus.textContent = "Черновик сформирован в браузере. Проверьте весь текст перед использованием.";
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
      actionStatus.textContent = "Файл с черновиком подготовлен для скачивания.";
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
          actionStatus.textContent = "Не удалось автоматически скопировать текст. Выделите его в поле черновика и скопируйте вручную.";
        });
      } else {
        actionStatus.textContent = "Автоматическое копирование недоступно в этом браузере. Выделите текст в поле черновика и скопируйте вручную.";
      }
    });
  }
}());