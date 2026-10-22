# Архитектура каталога и рабочего места документов

## Цель

Пользователь должен иметь возможность начать с любой понятной формулировки, перейти к конкретной задаче и найти точный тип документа или услуги. После выбора все действия, поля и результат располагаются в одном рабочем потоке, а не разбросаны по длинной странице.

## Уровни классификации

1. **Область** — например, жильё, работа, покупки, деньги, суд, организация, личные тексты.
2. **Ситуация** — например, возврат денег за товар, сдача жилья, взыскание долга, трудовой спор.
3. **Задача** — вернуть деньги, подготовить обращение, составить договор, проверить редакцию.
4. **Атомарный объект** — конкретный документ, приложение, действие, услуга или проверка.
5. **Рабочий инструмент** — конструктор, редактор, сравнение версий, проверочный список, экспорт.
6. **Источник и ограничения** — юрисдикция, официальный источник, дата проверки, обязательные приложения, статус доступности.

Одна карточка может относиться к нескольким областям и ситуациям. Не следует дублировать один и тот же документ в каталоге: для пересекающихся тем нужны теги и связи, ведущие к одной канонической странице.

## Поиск и фильтры

Поиск должен работать по названию, синонимам, реквизитам, ситуации, типу документа, адресату и назначению. Фильтры должны уточнять запрос, а не требовать от человека заранее знать юридический термин. Для каждого результата показывать:
- точное название и простое объяснение;
- ситуацию и предполагаемого адресата;
- готовность: «Работает», «Материалы», «Демо» или «В разработке»;
- юрисдикцию и дату последней проверки, если применимо;
- ссылки на инструкции и первоисточники.

## Витрина сложных документов и услуг

Витрина группирует комплексные сценарии, для которых одного шаблона недостаточно:
- комплект документов по судебному спору;
- подготовка сделки и связанных приложений;
- сравнение редакций договора и список изменений;
- комплект документов для организации;
- маршрут обращения с выбором адресата и контрольным списком.

Карточки со статусом «В разработке» не должны выглядеть как доступные платные услуги. Отдельно показываются доступные локальные конструкторы и внешние профессиональные услуги; стоимость и исполнителя нельзя обещать без подтверждённой интеграции.

## Рабочее место документа

- Сразу после заголовка и короткого пояснения показывать активные поля формы.
- Справочные материалы, подробные пояснения и ссылки размещать после основной рабочей области либо в боковой панели.
- Переход по действию вроде «Заполнить реквизиты» должен открывать страницу с нужными полями вверху и при необходимости фокусировать первое поле.
- Сохранять черновик только с явным объяснением, где он хранится.
- Отдельно показывать оригинал, редактируемую версию и итоговый экспорт.

## Версии и восстановление

Для каждого сохранённого документа хранить текущий текст и ограниченную историю снимков: номер версии, время, текст и причину изменения. Перед сохранением новой редакции создавать снимок предыдущей. Восстановление старой версии не удаляет новую: текущий текст сначала добавляется в историю. Для первой реализации в text2me история остаётся в локальном хранилище браузера и не синхронизируется между устройствами; резервная копия должна включать историю версий.

## Загрузка и фотографирование

Глобальная команда доступна в шапке на всех страницах. Отдельные действия: выбрать существующий файл или сделать снимок камерой устройства. Первая реализация позволяет просмотреть изображение/PDF и скачать исходный файл в текущей вкладке. Автоматическое распознавание текста, извлечение реквизитов, OCR и безопасная серверная обработка не считаются реализованными без отдельного движка и тестов.

## Что полезно из примеров

- **AavanamKit**: взять архитектурные идеи схемы данных, шаблонов, привязки полей, визуального предпросмотра и экспорта. Не переносить весь стек в текущий статический сайт: проект рассчитан на React-дизайнер и Node.js-движок, а текущие страницы используют HTML/JavaScript. Перед внедрением отдельных пакетов проверить зависимости, безопасность и совместимость. Репозиторий публикуется под MIT.
- **Wiley-VCH**: использовать принцип предметных областей, вложенных подкатегорий и фасетных фильтров. Не копировать каталог или содержание; создать собственную классификацию для документов, ситуаций и услуг.

## Этапы

1. **Сейчас** — единая точка загрузки/фотографирования, приоритет формы, базовая история версий в «Моём пространстве», иерархическая навигация и честные статусы витрины.
2. **Следом** — единый каталог данных (JSON/схема), который питает поиск, фильтры, карточки, карту сайта и связанные материалы без дублирования описаний.
3. **Далее** — OCR и извлечение полей с подтверждением пользователем, сравнение редакций и история изменений на уровне фрагментов.
4. **После проверки спроса** — серверное хранение, учётные записи, синхронизация и подключение профессиональных услуг. До появления серверной части не обещать облачное хранение или автоматический поиск по государственным реестрам.

## Проверки перед публикацией

- Клавиатурная навигация, фокус и доступность диалогового окна.
- Проверка мобильной камеры, выбора файлов и PDF-просмотра.
- Проверка восстановления версии после нескольких правок.
- Проверка того, что ИНН/СНИЛС и другие чувствительные реквизиты не попадают в автосохранение без отдельного согласия.
- Проверка всех ссылок и статусов: работающий конструктор не должен быть помечен как планируемый и наоборот.


## Google services worth adopting

Use Google-like interaction patterns first; add Google accounts/APIs only where they solve a concrete need.

- **Google Drive / Docs**: optional export or save-to-Drive for users who explicitly connect their account. Requires OAuth consent, API enablement, permission scopes and a privacy notice. Do not require Google sign-in for ordinary local document creation.
- **Google Docs API**: a future connector for creating/updating a user's own Google Docs after explicit authorization; keep text2me as the document workflow and use Docs as an optional destination.
- **Google Drive API**: optional user-selected import/export and folder destination. Do not upload files to a user's Drive without clear confirmation.
- **Google Lens / Cloud Vision OCR**: use camera capture and OCR to extract text from a scan. Lens is a user-facing Google product, not a drop-in website API; for a production integration evaluate Cloud Vision or a dedicated document OCR provider, including price, data residency, retention, and supported document types.
- **Google Forms / Sheets**: useful for internal feedback collection and anonymized product analytics during discovery, not as the primary user document database.
- **Google Apps Script**: a lightweight automation option for internal workflows or a proof of concept, but not a substitute for a secure, maintainable API backend for sensitive document data.
- **Google Search / Programmable Search**: can complement the official-source catalogue, but should not replace curated official sources or give search snippets the status of verified legal guidance.
- **Accessibility and productivity patterns**: autosave status, undo/redo, keyboard shortcuts, clear focus, instant search, recent files, version history, side-by-side comparison, preview-before-export, and explicit permission prompts. These are interface patterns and can be built without forcing Google sign-in.

### Integration principle

Keep a provider-neutral adapter layer. Each service should be optional, use least-privilege scopes, state what data leaves the browser, and provide a manual path if unavailable. Google Workspace exposes APIs for Docs, Drive, Forms, Sheets, Gmail, Calendar, Slides and other services, but each API must be enabled and authorized separately; availability of an API does not itself grant access to a user's data.

## OCR implementation status (2026-10-22)

The repository now contains an opt-in OCR UI for image files and a Cloudflare Worker `/ocr` route that calls Google Cloud Vision using the server-side `GOOGLE_CLOUD_VISION_API_KEY` secret. Supported image formats in this first step: JPEG, PNG, WEBP and GIF, up to 5 MB. The user must click “Распознать текст”; results are editable, can be copied, or explicitly appended to the last focused textarea. OCR does not automatically submit or save the document.

The public endpoint setting `window.TEXT2ME_OCR_ENDPOINT` is intentionally blank. The integration is not live until Google Cloud Vision is enabled, Worker secrets are configured, the endpoint is deployed, Cloudflare rate limits and billing alerts are in place, a real test passes, and the public endpoint is configured. PDF OCR and structured field extraction are future work. See `docs/ocr-integration.md`.
