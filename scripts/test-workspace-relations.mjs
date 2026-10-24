import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync("assets/unified-workspace.js", "utf8");
const store = new Map();
const localStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); }
};
const window = { dispatchEvent() {} };
class MockCustomEvent {
  constructor(type, init = {}) { this.type = type; this.detail = init.detail || {}; }
}
runInNewContext(source, { window, localStorage, CustomEvent: MockCustomEvent }, { filename: "assets/unified-workspace.js" });

const workspace = window.Text2meWorkspace;
assert.ok(workspace, "Workspace API must be exposed.");

const caseItem = workspace.createCase("Тестовое дело", "Проверка связей сущностей");
const contact = workspace.addContact({ name: "Тестовый контакт", email: "contact@example.test" });
const documentItem = workspace.createDocument({ title: "Тестовый документ", caseId: caseItem.id, content: "Черновик" });
const task = workspace.addTask({
  title: "Проверить документ",
  caseId: caseItem.id,
  documentId: documentItem.id,
  contactIds: [contact.id]
});
const event = workspace.addEvent({
  title: "Контрольный срок",
  date: "2030-01-10",
  caseId: caseItem.id,
  documentId: documentItem.id,
  contactIds: [contact.id]
});

let state = workspace.get();
assert.equal(state.documents.find(item => item.id === documentItem.id).caseId, caseItem.id, "Document must link to its case.");
assert.equal(state.tasks.find(item => item.id === task.id).caseId, caseItem.id, "Task must link to its case.");
assert.equal(state.events.find(item => item.id === event.id).caseId, caseItem.id, "Event must link to its case.");
assert.equal(state.tasks.find(item => item.id === task.id).documentId, documentItem.id, "Task must link to its workspace document.");
assert.equal(state.events.find(item => item.id === event.id).documentId, documentItem.id, "Event must link to its workspace document.");
assert.ok(state.tasks.find(item => item.id === task.id).contactIds.includes(contact.id), "Task must preserve contact links.");
assert.ok(state.events.find(item => item.id === event.id).contactIds.includes(contact.id), "Event must preserve contact links.");

workspace.linkContactToCase(caseItem.id, contact.name, { email: contact.email });
state = workspace.get();
assert.ok(state.cases.find(item => item.id === caseItem.id).contactIds.includes(contact.id), "Case must link to its contact.");
assert.ok(state.documents.find(item => item.id === documentItem.id).contactIds.includes(contact.id), "Documents in the case must inherit the linked contact.");

const invalidTask = workspace.addTask({ title: "Broken task", caseId: "missing-case", documentId: "missing-document", contactIds: ["missing-contact"] });
const invalidEvent = workspace.addEvent({ title: "Broken event", caseId: "missing-case", documentId: "missing-document", contactIds: ["missing-contact"] });
const unlinkedDocument = workspace.createDocument({ title: "Unlinked document", caseId: "missing-case", createCase: false });
state = workspace.get();
assert.equal(state.tasks.find(item => item.id === invalidTask.id).caseId, "", "Invalid task case references must be cleared.");
assert.equal(state.tasks.find(item => item.id === invalidTask.id).documentId, "", "Invalid task document references must be cleared.");
assert.deepEqual(Array.from(state.tasks.find(item => item.id === invalidTask.id).contactIds || []), [], "Invalid task contact references must be cleared.");
assert.equal(state.events.find(item => item.id === invalidEvent.id).caseId, "", "Invalid event case references must be cleared.");
assert.equal(state.events.find(item => item.id === invalidEvent.id).documentId, "", "Invalid event document references must be cleared.");
assert.deepEqual(Array.from(state.events.find(item => item.id === invalidEvent.id).contactIds || []), [], "Invalid event contact references must be cleared.");
assert.equal(state.documents.find(item => item.id === unlinkedDocument.id).caseId, "", "A document created without a case must not retain a dangling case ID.");

workspace.updateTask(task.id, { caseId: "missing-case", documentId: "missing-document", contactIds: ["missing-contact"] });
workspace.updateEvent(event.id, { caseId: "missing-case", documentId: "missing-document", contactIds: ["missing-contact"] });
state = workspace.get();
assert.equal(state.tasks.find(item => item.id === task.id).caseId, "", "Updating a task must not create a dangling case reference.");
assert.equal(state.events.find(item => item.id === event.id).documentId, "", "Updating an event must not create a dangling document reference.");

workspace.removeEntity("contacts", contact.id);
state = workspace.get();
for (const entity of [...state.cases, ...state.documents, ...state.tasks, ...state.events]) {
  assert.ok(!(entity.contactIds || []).includes(contact.id), "Deleting a contact must unlink every entity that references it.");
}
workspace.removeEntity("cases", caseItem.id);
state = workspace.get();
for (const entity of [...state.documents, ...state.tasks, ...state.events]) {
  assert.notEqual(entity.caseId, caseItem.id, "Deleting a case must clear dependent case references.");
}
workspace.removeEntity("documents", documentItem.id);
state = workspace.get();
assert.notEqual(state.tasks.find(item => item.id === task.id).documentId, documentItem.id, "Deleting a workspace document must clear task references.");
assert.notEqual(state.events.find(item => item.id === event.id).documentId, documentItem.id, "Deleting a workspace document must clear event references.");

localStorage.setItem("text2me.space.v1", JSON.stringify([{ id: "library-source-1", title: "Saved source", content: "Keep me" }]));
const saved = workspace.upsertLibraryDocument({ id: "library-source-1", title: "Saved source", text: "Keep me" });
workspace.removeEntity("documents", saved.documentId);
const retainedLibrary = JSON.parse(localStorage.getItem("text2me.space.v1") || "[]");
assert.ok(retainedLibrary.some(item => item.id === "library-source-1"), "Removing a workspace reference must not delete the source library document.");

console.log("Workspace relationship tests passed: cases, contacts, documents, tasks, events, invalid IDs, deletion, and library retention.");
