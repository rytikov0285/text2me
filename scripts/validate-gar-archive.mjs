import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";

const statusPath = "data-engine/status.json";
const metadataUrl = "https://fias.nalog.ru/WebServices/Public/GetAllDownloadFileInfo";
const maxBytes = Number(process.env.GAR_MAX_ARCHIVE_BYTES || 12 * 1024 * 1024 * 1024);
const startedAt = new Date().toISOString();
const tempDir = await mkdtemp(path.join(tmpdir(), "text2me-gar-"));
let previous = {};
try { previous = JSON.parse(await readFile(statusPath, "utf8")); } catch {}
const run = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], ...options });
  let stdout = "";
  let stderr = "";
  child.stdout?.on("data", chunk => stdout += chunk.toString());
  child.stderr?.on("data", chunk => stderr += chunk.toString());
  child.on("error", reject);
  child.on("close", code => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(command + " exited " + code + ": " + stderr.slice(-1200))));
});
function walk(value, keyPath = "", out = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, keyPath + "[" + index + "]", out));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      const current = keyPath ? keyPath + "." + key : key;
      if (typeof item === "string" && /GarXML(?:Full|Delta)URL/i.test(key) && /^https:\/\//i.test(item)) {
        out.push({ key, keyPath: current, url: item });
      } else if (item && typeof item === "object") walk(item, current, out);
    }
  }
  return out;
}
let result;
try {
  const metadataResponse = await fetch(metadataUrl, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(60000) });
  if (!metadataResponse.ok) throw new Error("Метаданные: HTTP " + metadataResponse.status);
  const metadata = await metadataResponse.json();
  const candidates = walk(metadata);
  const requestedUrl = process.env.GAR_ARCHIVE_URL;
  let selected;
  if (requestedUrl) {
    const parsed = new URL(requestedUrl);
    if (parsed.protocol !== "https:" || !["fias.nalog.ru", "www.fias.nalog.ru"].includes(parsed.hostname)) {
      throw new Error("GAR_ARCHIVE_URL должен указывать на HTTPS-домен fias.nalog.ru.");
    }
    selected = { key: "GAR_ARCHIVE_URL", url: parsed.href };
  } else {
    const unique = [...new Map(candidates.map(item => [item.url, item])).values()];
    const full = unique.filter(item => /GarXMLFullURL/i.test(item.key));
    if (full.length !== 1) {
      throw new Error("Невозможно безопасно выбрать полную выгрузку автоматически: найдено вариантов " + full.length + ". Передайте GAR_ARCHIVE_URL после просмотра официальных метаданных. Кандидаты: " + unique.slice(0, 20).map(x => x.key + "=" + x.url).join("; "));
    }
    selected = full[0];
  }
  const archiveUrl = new URL(selected.url);
  if (archiveUrl.protocol !== "https:" || !["fias.nalog.ru", "www.fias.nalog.ru"].includes(archiveUrl.hostname)) {
    throw new Error("Ссылка архива не принадлежит официальному домену fias.nalog.ru.");
  }
  const response = await fetch(archiveUrl, { redirect: "follow", signal: AbortSignal.timeout(6 * 60 * 60 * 1000) });
  const finalUrl = new URL(response.url);
  if (!response.ok) throw new Error("Загрузка архива: HTTP " + response.status);
  if (finalUrl.protocol !== "https:" || !["fias.nalog.ru", "www.fias.nalog.ru"].includes(finalUrl.hostname)) {
    throw new Error("После перенаправления архив оказался на другом домене; загрузка отклонена.");
  }
  const declaredSize = Number(response.headers.get("content-length") || 0);
  if (declaredSize > maxBytes) throw new Error("Архив превышает ограничение GAR_MAX_ARCHIVE_BYTES: " + declaredSize);
  const archivePath = path.join(tempDir, "gar-source.zip");
  const hash = createHash("sha256");
  let bytes = 0;
  const file = await import("node:fs").then(m => m.createWriteStream(archivePath, { flags: "wx" }));
  try {
    if (!response.body) throw new Error("Источник не вернул тело архива.");
    for await (const chunk of response.body) {
      bytes += chunk.length;
      if (bytes > maxBytes) throw new Error("Фактический размер архива превысил ограничение " + maxBytes + " байт.");
      hash.update(chunk);
      if (!file.write(chunk)) await new Promise(resolve => file.once("drain", resolve));
    }
  } finally {
    await new Promise((resolve, reject) => file.end(error => error ? reject(error) : resolve()));
  }
  if (bytes < 22) throw new Error("Полученный файл слишком мал для ZIP-архива.");
  const signature = Buffer.alloc(4);
  const handle = await import("node:fs/promises").then(m => m.open(archivePath, "r"));
  try { await handle.read(signature, 0, 4, 0); } finally { await handle.close(); }
  if (signature.readUInt32LE(0) !== 0x04034b50 && signature.readUInt32LE(0) !== 0x06054b50) {
    throw new Error("Полученный файл не начинается с ожидаемой ZIP-сигнатуры.");
  }
  const test = await run("unzip", ["-t", archivePath]);
  const listing = await run("unzip", ["-Z1", archivePath]);
  const entries = listing.stdout.split(/\r?\n/).filter(Boolean);
  if (!entries.length) throw new Error("ZIP-архив пуст.");
  const xmlEntries = entries.filter(name => /\.xml$/i.test(name));
  if (!xmlEntries.length) throw new Error("В архиве не найдены XML-файлы; набор не принят.");
  const finishedAt = new Date().toISOString();
  result = {
    validated_at: finishedAt,
    result: "success",
    source_metadata_url: metadataUrl,
    archive_url: selected.url,
    archive_kind: selected.key,
    bytes_downloaded: bytes,
    sha256: hash.digest("hex"),
    zip_integrity: "passed",
    entry_count: entries.length,
    xml_entry_count: xmlEntries.length,
    xml_entry_examples: xmlEntries.slice(0, 10),
    note: "Архив скачан во временное хранилище Actions, ZIP-тест пройден, найдены XML. Архив не сохраняется в Git; схема XML и адресный индекс этим шагом не проверяются."
  };
  previous.last_archive_validation = result;
  previous.status = "healthy";
  previous.latest_attempt = {
    started_at: startedAt,
    finished_at: finishedAt,
    result: "success",
    source_url: metadataUrl,
    note: "Метаданные и выбранный архив проверены; это ещё не означает, что адресный индекс построен."
  };
  previous.address_index = {
    status: "not_implemented",
    note: "Архив проверен, но XML-разбор, нормализация адресов, индекс и подключение к формам ещё не реализованы."
  };
  console.log(JSON.stringify({ result: "success", bytes, sha256: result.sha256, entries: entries.length, xmlEntries: xmlEntries.length, unzipTest: test.stdout.split(/\r?\n/).slice(-2) }, null, 2));
} catch (error) {
  const finishedAt = new Date().toISOString();
  previous.latest_attempt = {
    started_at: startedAt,
    finished_at: finishedAt,
    result: "error",
    source_url: metadataUrl,
    error: String(error?.message || error).slice(0, 1500),
    note: "При ошибке предыдущая проверенная версия в статусе не удаляется."
  };
  previous.status = previous.last_successful_source_check ? "degraded" : "not_run";
  console.error(String(error?.stack || error));
  process.exitCode = 1;
} finally {
  await writeFile(statusPath, JSON.stringify(previous, null, 2) + "\n", "utf8");
  await rm(tempDir, { recursive: true, force: true });
}
