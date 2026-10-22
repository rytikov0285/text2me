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
  var demo = document.getElementById("demo-form");
  if (demo) {
    demo.addEventListener("submit", function (event) {
      event.preventDefault();
      var issue = document.getElementById("issue-type").value;
      var result = document.getElementById("desired-result").value;
      var output = document.getElementById("demo-result");
      if (!issue || !result) {
        output.textContent = "Выберите оба варианта. Это демонстрация интерфейса; данные никуда не отправляются.";
        return;
      }
      output.textContent = "Следующий шаг в будущем сервисе: уточнить дату покупки или услуги, сведения о продавце и подтверждающие документы. Выбрано: «" + issue + "»; желаемый результат: «" + result + "». Это не юридическая рекомендация и документ не сформирован.";
    });
  }
}());