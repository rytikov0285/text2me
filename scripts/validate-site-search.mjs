import { readFile } from "node:fs/promises";
import { Script } from "node:vm";

const errors = [];
function assert(condition, message) {
  if (!condition) errors.push(message);
}

const home = await readFile("index.html", "utf8");
const start = await readFile("start/index.html", "utf8");
const main = await readFile("assets/main.js", "utf8");
const style = await readFile("assets/style.css", "utf8");
const design = await readFile("docs/DESIGN_SYSTEM.md", "utf8");
const agents = await readFile("AGENTS.md", "utf8");

try {
  new Script(main, { filename: "assets/main.js" });
} catch (error) {
  errors.push("assets/main.js: ошибка синтаксиса JavaScript: " + error.message);
}
const inlineScript = home.match(/<script>\\s*([\\s\\S]*?)\\s*<\\/script>/);
assert(!!inlineScript, "Главная: не найден встроенный JavaScript для проверки синтаксиса.");
if (inlineScript) {
  try {
    new Script(inlineScript[1], { filename: "index.html:inline-script" });
  } catch (error) {
    errors.push("index.html: ошибка синтаксиса встроенного JavaScript: " + error.message);
  }
}

assert(home.includes('id="title-search-form"'), "Главная: отсутствует форма поиска по названию.");
assert(home.includes('placeholder="Название документа, например «Исковое заявление»"'), "Главная: поиск не объясняет, что требуется название документа.");
assert(home.includes('id="title-search-popover" hidden'), "Главная: панель результатов должна быть скрыта до поиска.");
assert(home.includes('searchForm.addEventListener("submit",function(e){e.preventDefault();search();});'), "Главная: Enter и кнопка должны вызывать единый обработчик submit.");
assert(home.includes("normalizeTitleQuery(item.title)"), "Главная: поиск должен сравнивать запрос с названием, а не описанием ситуации.");
assert(home.includes("popover.hidden=true"), "Главная: панель результатов должна скрываться при очистке поля.");
assert(start.includes('id="document-search"'), "Подбор: отсутствует форма поиска каталога.");
assert(start.includes('placeholder="Название документа, например «Исковое заявление»"'), "Подбор: поиск по названию не отделён от описания ситуации.");
assert(main.includes('searchForm.addEventListener("submit", function (event)'), "Подбор: отсутствует обработчик отправки формы.");
assert(main.includes('terms.every(function (term) { return title.indexOf(term) !== -1; })'), "Подбор: поиск должен сопоставлять слова с заголовком документа.");
assert(main.includes('if (scrollToResults && catalog) catalog.scrollIntoView'), "Подбор: после Enter пользователь должен перейти к видимым результатам.");
assert(!main.includes('var quickCards = Array.prototype.slice.call(document.querySelectorAll("#quick-actions a"))'), "Поиск по названию не должен фильтровать быстрые сценарии по ситуации.");
assert(style.includes(".button,.dash-btn,.workspace-search-submit{"), "Отсутствует общий базовый guardrail масштабирования кнопок.");
assert(style.includes("white-space:normal;overflow-wrap:anywhere"), "Длинные подписи контролов должны переноситься.");
assert(design.includes("## 4. Кнопки и ссылки") && design.includes("## 5. Формы и клавиатура"), "Дизайн-система не содержит правил кнопок и клавиатурных форм.");
assert(agents.includes("docs/DESIGN_SYSTEM.md"), "AGENTS.md не ссылается на дизайн-систему.");

if (errors.length) {
  for (const error of errors) console.error("FAIL:", error);
  process.exitCode = 1;
} else {
  console.log("PASS: static search and design-system contracts verified.");
}
