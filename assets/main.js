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