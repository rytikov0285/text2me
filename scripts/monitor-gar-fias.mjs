import { readFile, writeFile } from "node:fs/promises";

const statusPath = "data-engine/status.json";
const metadataUrl = "https://fias.nalog.ru/WebServices/Public/GetAllDownloadFileInfo";
const startedAt = new Date().toISOString();

let previous;
try {
  previous = JSON.parse(await readFile(statusPath, "utf8"));
} catch {
  previous = {
    schema_version: "1.0.0",
    connector_id: "gar_fias",
    connector_name: "ГАР/ФИАС — официальный набор открытых данных ФНС России",
    status: "not_run",
    source_page: "https://www.nalog.gov.ru/opendata/7707329152-fias/",
    latest_attempt: null,
    last_successful_source_check: null,
    last_archive_validation: null,
    address_index: { status: "not_implemented", note: "Адресный индекс не реализован." }
  };
}

let attempt;
let healthy = false;
try {
  const response = await fetch(metadataUrl, {
    headers: { accept: "application/json, text/plain, */*" },
    signal: AbortSignal.timeout(30000)
  });
  const body = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new Error("Официальный endpoint ответил невалидным JSON.");
  }
  if (!response.ok) {
    throw new Error("HTTP " + response.status + " при запросе метаданных.");
  }
  if (parsed === null || (typeof parsed !== "object")) {
    throw new Error("Формат JSON не соответствует ожидаемым метаданным.");
  }
  const metadataCount = Array.isArray(parsed) ? parsed.length :
    (Array.isArray(parsed.Items) ? parsed.Items.length :
    (Array.isArray(parsed.items) ? parsed.items.length : null));
  attempt = {
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    result: "success",
    source_url: metadataUrl,
    http_status: response.status,
    content_type: response.headers.get("content-type"),
    response_bytes: Buffer.byteLength(body, "utf8"),
    json_type: Array.isArray(parsed) ? "array" : "object",
    metadata_item_count: metadataCount,
    note: "Проверены доступность endpoint и JSON-формат метаданных. Полный архив не скачивался; CRC ZIP и адресный индекс этим запуском не проверялись."
  };
  previous.last_successful_source_check = {
    checked_at: attempt.finished_at,
    source_url: metadataUrl,
    http_status: response.status,
    content_type: attempt.content_type,
    response_bytes: attempt.response_bytes,
    json_type: attempt.json_type,
    metadata_item_count: metadataCount
  };
  healthy = true;
} catch (error) {
  attempt = {
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    result: "error",
    source_url: metadataUrl,
    error: String(error?.message || error).slice(0, 500),
    note: "Не удалять и не заменять последнюю проверенную версию данных из-за сбоя источника."
  };
}
previous.status = healthy ? "healthy" : (previous.last_successful_source_check ? "degraded" : "not_run");
previous.latest_attempt = attempt;
previous.monitor_kind = "official_metadata_endpoint_availability_and_json_shape";
previous.address_index = previous.address_index || { status: "not_implemented" };
previous.address_index.status = "not_implemented";
previous.address_index.note = "Поиск адресов и интеграция адресного индекса в формы ещё не реализованы. Проверка метаданных не означает, что адресная база скачана или проиндексирована.";
await writeFile(statusPath, JSON.stringify(previous, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ status: previous.status, result: attempt.result, source_url: metadataUrl }, null, 2));
if (!healthy) process.exitCode = 1;
