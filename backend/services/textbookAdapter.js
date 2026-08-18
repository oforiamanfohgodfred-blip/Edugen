const fs = require("fs");
const path = require("path");

const TEXTBOOK_ROOT = path.resolve(__dirname, "../../textbook_data");

function norm(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function walk(dir, out = [], depth = 0) {
  if (depth > 4 || !fs.existsSync(dir)) return out;
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out, depth + 1);
    else if (/\.(txt|json|pdf)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

function gradeMatch(file, grade) {
  const n = norm(file), g = norm(grade);
  if (!g) return true;
  const aliases = {
    jhs1: ["jhs1", "basic 7", "b7"], jhs2: ["jhs2", "basic 8", "b8"], jhs3: ["jhs3", "basic 9", "b9"],
    shs1: ["shs1", "b10"], shs2: ["shs2", "b11"], shs3: ["shs3", "b12"],
  };
  if (aliases[g]?.some((x) => n.includes(norm(x)))) return true;
  if (/^jhs[123]$/.test(g) && n.includes("jhs1 3")) return true;
  if (/^shs[123]$/.test(g) && n.includes("shs1 3")) return true;
  return false;
}

function subjectMatch(file, subject) {
  const n = norm(file), s = norm(subject);
  if (!s) return true;
  if (s === "integrated science") return n.includes("science") && !n.includes("physics") && !n.includes("chemistry") && !n.includes("biology");
  if (s === "mathematics") return n.includes("math") || n.includes("mathematics");
  return n.includes(s);
}

function findText(grade, subject) {
  const files = walk(TEXTBOOK_ROOT).filter((f) => gradeMatch(f, grade) && subjectMatch(f, subject));
  files.sort((a, b) => (/.txt$/i.test(b) ? 2 : 0) - (/.txt$/i.test(a) ? 2 : 0));
  return files[0] || null;
}

function extractContext(text, topic) {
  const lines = String(text || "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  const terms = norm(topic).split(" ").filter((x) => x.length > 2);
  if (!terms.length) return lines.slice(0, 5).join(" ");
  const hits = [];
  for (let i = 0; i < lines.length && hits.length < 6; i++) {
    const line = norm(lines[i]);
    if (terms.some((term) => line.includes(term))) hits.push(lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 2)).join(" "));
  }
  return [...new Set(hits)].join("\n\n");
}

function getKnowledgeContext({ grade, subject, topic } = {}) {
  const file = findText(grade, subject);
  if (!file) return { available: false, grounded: false, source: null, context: "", learningObjectives: [] };
  if (/\.pdf$/i.test(file)) return { available: true, grounded: false, source: file, context: "", learningObjectives: [], requiresOCR: true };
  let text = "";
  try { text = fs.readFileSync(file, "utf8"); } catch { return { available: false, grounded: false, source: file, context: "", learningObjectives: [] }; }
  const context = extractContext(text, topic);
  const objectives = text.split(/\r?\n/).map((x) => x.trim()).filter((x) => /^(learning objective|objective|learning outcome)/i.test(x)).slice(0, 10);
  return { available: true, grounded: Boolean(context), source: file, context, learningObjectives: objectives, requiresOCR: false };
}

// Backward-compatible name used by the controller.
function loadTextbook(grade, subject) {
  const file = findText(grade, subject);
  if (!file) return { loaded: false, file: null, content: "" };
  if (/\.pdf$/i.test(file)) return { loaded: true, file, content: "", requiresOCR: true };
  try { return { loaded: true, file, content: fs.readFileSync(file, "utf8"), requiresOCR: false }; }
  catch { return { loaded: false, file, content: "" }; }
}

module.exports = { TEXTBOOK_ROOT, getKnowledgeContext, loadTextbook, findText, extractContext };
