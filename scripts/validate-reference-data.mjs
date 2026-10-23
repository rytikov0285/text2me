import { readFile } from "node:fs/promises";

const errors = [];
const warnings = [];
const sourcePath = "data-engine/sources.json";
const statusPath = "data-engine/status.json";
const pagePath = "data-engine/index.html";

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

const registry = JSON.parse(await readFile(sourcePath, "utf8"));
const status = JSON.parse(await readFile(statusPath, "utf8"));
const page = await readFile(pagePath, "utf8");

assert(Array.isArray(registry.sources), "sources.json: поле sources должно быть массивом.");
assert(typeof registry.schema_version === "string", "sources.json: отсутствует schema_version.");
assert(status.connector_id === "gar_fias", "status.json: connector_id должен быть gar_fias.");
assert(["not_run", "healthy", "degraded", "error"].includes(status.status), "status.json: неизвестное значение status.");
assert(status.address_index && ["not_implemented", "builder_implemented_not_deployed", "built_not_deployed", "deployed"].includes(status.address_index.status), "status.json: неизвестный статус адресного индекса.");
if (status.address_index && status.address_index.status === "deployed") {
  assert(status.address_index.endpoint && isHttpUrl(status.address_index.endpoint), "status.json: deployed требует URL поискового API.");
  assert(status.address_index.last_successful_build, "status.json: deployed требует last_successful_build.");
}
assert(page.includes("/text2me/data-engine/status.json"), "Страница движка не ссылается на status.json.");
assert(page.includes("/text2me/data-engine/sources.json"), "Страница движка не ссылается на реестр источников.");

const ids = new Set();
for (const [index, source] of (registry.sources || []).entries()) {
  const prefix = "sources[" + index + "]";
  assert(typeof source.id === "string" && source.id.length > 0, prefix + ": отсутствует id.");
  assert(!ids.has(source.id), prefix + ": повторяется id " + source.id + ".");
  ids.add(source.id);
  assert(typeof source.name === "string" && source.name.length > 0, prefix + ": отсутствует name.");
  assert(typeof source.authority === "string" && source.authority.length > 0, prefix + ": отсутствует authority.");
  assert(Array.isArray(source.data_types) && source.data_types.length > 0, prefix + ": data_types должен быть непустым массивом.");
  if (source.url !== null) assert(isHttpUrl(source.url), prefix + ": url должен быть HTTP(S) или null.");
  if (source.terms_url !== null) assert(isHttpUrl(source.terms_url), prefix + ": terms_url должен быть HTTP(S) или null.");
  if (source.status === "connected" || source.status === "operational") {
    assert(source.last_checked !== null, prefix + ": подключённый источник обязан иметь last_checked.");
    assert(source.verified_at !== null, prefix + ": подключённый источник обязан иметь verified_at.");
  }
  if (source.status === "needs_verification" || source.status === "first_connector_implemented_pending_live_run_and_terms_review") {
    warnings.push(source.id + ": источник не считается полностью проверенным.");
  }
}

if (status.status === "healthy") {
  assert(status.last_successful_source_check && status.last_successful_source_check.checked_at,
    "status.json: healthy требует last_successful_source_check.checked_at.");
  assert(status.latest_attempt && (status.latest_attempt.result === "success" || status.latest_attempt.status === "success"),
    "status.json: healthy требует успешную latest_attempt.");
}
if (status.status === "degraded") {
  assert(status.last_successful_source_check && status.last_successful_source_check.checked_at,
    "status.json: degraded должен сохранять последнюю успешную проверку.");
}
if (status.latest_attempt && status.latest_attempt.finished_at) {
  assert(!Number.isNaN(Date.parse(status.latest_attempt.finished_at)),
    "status.json: latest_attempt.finished_at должен быть датой ISO.");
}

console.log("Reference-data registry validation");
console.log("Sources:", (registry.sources || []).length);
console.log("Connector status:", status.status);
console.log("Address index:", status.address_index.status);
for (const warning of warnings) console.log("WARNING:", warning);
if (errors.length) {
  for (const error of errors) console.error("ERROR:", error);
  process.exitCode = 1;
} else {
  console.log("PASS: structural checks passed.");
}
