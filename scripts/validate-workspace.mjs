import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const html = readFileSync("dashboard/index.html", "utf8");
const schema = JSON.parse(readFileSync("data-engine/user-workspace-schema.json", "utf8"));
const requiredIds = [
  "taskList", "eventList", "caseList", "entryForm", "exportData",
  "importFile", "statTasks", "statDue", "statEvents", "statCases"
];
for (const id of requiredIds) {
  assert.ok(html.includes('id="' + id + '"'), "Missing dashboard element: " + id);
}
assert.ok(html.includes("text2me.dashboard.v1"), "Local storage key is missing");
assert.ok(html.includes("облачной синхронизации"), "Local-only storage limitation must be disclosed");
assert.equal(schema.schema_version, 1, "Unexpected workspace schema version");
assert.ok(schema.entities.task && schema.entities.event && schema.entities.case, "Core entities are missing");
assert.equal(schema.storage.cloud_sync, false, "Cloud sync must not be claimed as implemented");

const scripts = [...html.matchAll(/<script>([\\s\\S]*?)<\\/script>/g)];
assert.ok(scripts.length > 0, "Inline dashboard script not found");
for (const match of scripts) new Function(match[1]);
console.log("Workspace validation passed: HTML markers, schema JSON, core entities, and JavaScript syntax.");
