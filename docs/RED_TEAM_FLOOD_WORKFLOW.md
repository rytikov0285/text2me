# Red Team: сценарий «Затопило квартиру» для text2me

Дата проверки: 2026-10-23. Проверялись исходники репозитория и продуктовая логика; полноценный browser/E2E прогон не выполнялся.

## Критические продуктовые разрывы
1. Нет специализированного сквозного workflow по заливу квартиры в просмотренных конструкторах.
2. Общий подбор ситуации не гарантирует правильный следующий документ и контроль доказательств.
3. DaData endpoint в assets/dadata-config.js пустой; автоматическое заполнение адресов/организаций фактически не подключено.
4. Календарь сохраняет задачи локально. Серверного планировщика, email/мессенджер доставки и межустройственной синхронизации нет.
5. Локальное сохранение не равно облачному архиву; очистка браузера/смена устройства может лишить пользователя данных.
6. Нельзя выдавать универсальное обещание «через 10 дней подать иск»: срок зависит от вида требования, адресата, основания ответственности и фактического вручения.

## Безопасный клиентский маршрут
1. Немедленно сообщить в аварийную службу/УК, зафиксировать номер заявки, фото и видео.
2. Запросить осмотр и акт о заливе; не утверждать причину без доказательств.
3. Установить ответственное лицо и подтвердить размер ущерба (смета/оценка/чеки).
4. Подготовить денежную претензию конкретному адресату, зафиксировать вручение.
5. Контрольная дата через 10 дней — проверить ответ/вручение, а не автоматически обещать подачу иска.
6. Через 30 дней — проверить доказательства и следующий шаг. Подготовка иска должна учитывать обстоятельства и подсудность.

## Внедрённый MVP
- Страница situations/zatoplenie-kvartiry/ с редактируемой формой, первым заявлением в УК, черновиком денежной претензии, сохранением в локальную библиотеку и напоминаниями.
- Задачи на +10 и +30 дней можно записать в существующий локальный календарь.
- Доступен экспорт .ics для импорта в календарь устройства.
- Пользователь видит, что email/Telegram/push и справочники не подключены.
- Входные данные сценария Иванова — только тестовые значения, их можно изменить.

## Остаточные риски / следующий этап
- Реальный поиск управляющей организации и реквизитов требует проверенного справочника/интеграции, проверки совпадения дома и актуальности данных.
- Нужны браузерные тесты на мобильном/десктопе, сценарии отказа IndexedDB/localStorage, проверка экспорта и корректности календарного файла.
- Для гарантированных уведомлений нужны сервер, аккаунт/согласия, очередь заданий, email-провайдер и/или бот, а также надёжный канал отмены/изменения напоминаний.
- Для автоматической генерации исков нужны ветвление по причине затопления, ответственному лицу, сумме и подсудности; обязательная проверка пользователем.
- Strah2me — только рабочая идея бренда. Домен и товарный знак не проверены. Страховые полисы нельзя продавать от имени сервиса без подходящей правовой модели и лицензированных страховых партнёров.

## Источники по первичному процессу
- Роспотребнадзор, «Что делать, если Вас затопили?»: https://zpp.rospotrebnadzor.ru/handbook/zhku/memos/49536
- Роспотребнадзор, отказ УК составить акт: https://zpp.rospotrebnadzor.ru/handbook/zhku/answers/43380
- Роспотребнадзор, разъяснение от 02.09.2026 о протечке крыши и претензии: https://zpp.rospotrebnadzor.ru/news/federal/576692


## Red Team findings by severity

### P1 — Reminders are not a reliable notification service
**Attack/test:** user assumes the site will alert them in 10 days, closes the tab, clears browser data or switches device.
**Observed:** static-site prototype only stores tasks locally and can export an .ics file. There is no deployed server scheduler, verified email channel or messenger bot.
**Impact:** missed response date and lost trust.
**Mitigation:** before advertising automatic reminders, implement authenticated case storage, server-side scheduled jobs, opt-in email/bot delivery, delivery status, retries, timezone handling and a way to change/cancel reminders.

### P1 — Wrong addressee or unproven cause can invalidate the route
**Attack/test:** the wizard assumes the managing company caused the flood when the source may be a neighbour's apartment, roof, common riser, private pipe or weather.
**Observed:** no verified property/management-company lookup is configured; the DaData endpoint is empty.
**Impact:** user sends a claim to the wrong party and loses time.
**Mitigation:** first document requests an inspection and act without asserting a proven cause. Before a compensation claim, require user confirmation of the responsible party and supporting evidence; offer a “cause unknown” branch.

### P1 — The 10-day countdown can be legally misleading
**Attack/test:** the site starts the same deadline from any first request, or automatically tells everyone to sue on day 10.
**Impact:** incorrect legal expectations.
**Mitigation:** calculate reminders only from the actual sent date of the compensation demand; label day 10 as a review checkpoint, not an automatic court deadline. Determine whether a specific statutory deadline applies to the selected demand and respondent.

### P2 — Local-only storage is fragile for a high-stakes case
**Attack/test:** user opens the workflow on a phone, later uses a laptop, or clears site data.
**Observed:** document library and organizer are browser-local.
**Impact:** photos, drafts and dates may not follow the user to another device.
**Mitigation:** cloud sync with authentication, export/backup, restore testing and explicit retention/deletion controls. Until then, show the local-storage warning before saving.

### P2 — No verified end-to-end acceptance test
**Attack/test:** mobile viewport, unavailable IndexedDB/localStorage, malformed date, empty fields, failed download, duplicate reminders, imported calendar event.
**Observed:** code and links were inspected, but browser/E2E execution was not available in this pass.
**Impact:** runtime defects may remain.
**Mitigation:** add automated smoke tests and run manual desktop/mobile checks before promoting the workflow publicly.

### P2 — Sensitive data and document contents
**Attack/test:** analytics or third-party lookup receives names, addresses, photos, claim text or other case details.
**Mitigation:** keep document contents and identifying fields out of analytics; send only minimised event identifiers. Do not enable external integrations until privacy notice, consent, data location, access controls and retention are reviewed.

### P3 — Insurance cross-sell can damage trust if shown too early
**Attack/test:** an upset user sees a sales pitch before receiving emergency steps and the first document.
**Mitigation:** show prevention/insurance options only after the immediate workflow is complete, mark commercial links clearly, keep the legal workflow usable for free, and never imply a new policy covers an already-known event.

## Monetisation and retention hypotheses to validate

- **Free:** first request to the management company, evidence checklist, editable draft, local calendar tasks and .ics export.
- **Paid per case:** a reviewed document pack for the confirmed responsible party, claim, attachment list and court-preparation checklist; clearly distinguish document preparation from legal representation.
- **Optional expert service:** independent property damage assessment or lawyer review through verified providers, with transparent price and referral disclosure.
- **Retention:** a “Case” page with timeline, outgoing documents, delivery proofs, evidence, repair estimates, expenses, tasks and outcome status. Users should be able to export the entire case.
- **Insurance brand:** “Strah2me” is a workable naming concept only pending domain, trademark and market checks. Position it as a comparison/partner marketplace, not as an insurer unless the business obtains the necessary legal status. Start with apartment coverage (finishing, furniture/electronics, civil liability to neighbours), then separate OSAGO/CASCO flows. Existing comparison services show these are established categories, so differentiation should be the link to a user's documents, property risks and reminders—not merely another list of policies.


## Follow-up integration audit — 23.10.2026

- Исправлена структура сохраняемого документа: теперь сценарий использует те же поля `text2me.space.v1`, что и общая библиотека («Мои документы»), включая дату создания, версию, историю версий, коллекцию, теги и архивный статус.
- Черновик сценария теперь сохраняет также поля претензии, текст сгенерированных документов, отметки чек-листа и состояние открытых этапов; после перезагрузки страница пытается восстановить их из localStorage.
- Дата по умолчанию берётся в локальном часовом поясе устройства, а не через UTC-срез ISO-строки.
- Подтверждено чтением исходников: ключ задач совпадает с органайзером (`text2me.organizer.tasks.v1`), а CSS `assets/style.css` существует. Схема задачи содержит используемые органайзером поля `id`, `title`, `date`, `kind`, `fileId`, `done`, `created`.
- Ограничение проверки: браузерный запуск и E2E-тесты по-прежнему не выполнены; CI не вернул настроенных проверок. Не считать изменения доказанно работающими в опубликованной версии до ручного прогона.


## Follow-up checks — 23.10.2026 (continued)

- Удалены тестовые ФИО и адрес из значений по умолчанию публичной формы. Поля теперь пустые и содержат подсказки ввода. Поиск по репозиторию не выявил эти строки в индексируемых результатах; исходные значения удалены из проверенной страницы и её сценария.
- Исправлена дата в тексте денежной претензии: используется локальная дата устройства, как и в первом заявлении.
- Выполнена статическая проверка: синтаксис `assets/flood-workflow.js` и `assets/organizer.js` разбирается без ошибок; 38 прямых ссылок сценария на DOM-элементы соответствуют существующим ID; дублирующихся ID нет; ключ локального хранения задач совпадает.
- Проверка опубликованной страницы через доступный веб-инструмент не удалась: URL недоступен для чтения этим инструментом. Это не доказывает, что сайт недоступен в обычном браузере. Ручной браузерный E2E-прогон остаётся необходимым.
