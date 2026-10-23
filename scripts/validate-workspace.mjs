import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const html = readFileSync("dashboard/index.html", "utf8");
const schema = JSON.parse(readFileSync("data-engine/user-workspace-schema.json", "utf8"));
const calendar = readFileSync("calendar/index.html", "utf8");
const enhancements = readFileSync("assets/enhancements.js", "utf8");
const requiredIds = [
  "taskList", "eventList", "caseList", "entryForm", "exportData",
  "importFile", "statTasks", "statDue", "statEvents", "statCases", "documentList", "addDocument", "entryCase", "entryUrl"
];
for (const id of requiredIds) {
  assert.ok(html.includes('id="' + id + '"'), "Missing dashboard element: " + id);
}
assert.ok(html.includes("text2me.dashboard.v1"), "Local storage key is missing");
assert.ok(html.includes("облачной синхронизации"), "Local-only storage limitation must be disclosed");
assert.equal(schema.schema_version, 1, "Unexpected workspace schema version");
assert.ok(schema.entities.task && schema.entities.event && schema.entities.case && schema.entities.document_reference, "Core entities are missing");
assert.equal(schema.entities.document_reference.planned, false, "Document references should be marked as implemented");
assert.ok(html.includes("function renderDocuments()"), "Document reference rendering is missing");
assert.ok(html.includes('bindOpen("addDocument","document")'), "Document reference form is not connected");
assert.ok(html.includes('caseId:type==="case"?"":node("entryCase").value'), "Case relationship field is not saved");
assert.equal(schema.storage.cloud_sync, false, "Cloud sync must not be claimed as implemented");
assert.ok(calendar.includes('id="calendar"') && calendar.includes('id="events"'), "Calendar controls are missing");
assert.ok(calendar.includes("text2me.dashboard.v1"), "Calendar must share workspace storage");

const start = html.indexOf("<script>");
const end = html.lastIndexOf("</script>");
assert.ok(start >= 0 && end > start, "Inline dashboard script not found");
new Function(html.slice(start + 8, end));
const cStart = calendar.indexOf("<script>");
const cEnd = calendar.lastIndexOf("</script>");
assert.ok(cStart >= 0 && cEnd > cStart, "Calendar script not found");
new Function(calendar.slice(cStart + 8, cEnd));
new Function(enhancements);
assert.ok(enhancements.includes('["/text2me/calendar/","Календарь"]'), "Calendar navigation link is missing");
console.log("Workspace validation passed: dashboard/calendar controls, schema JSON, case-linked document references, and JavaScript syntax.");
