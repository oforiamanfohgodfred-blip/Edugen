/* =========================================================
   EduGen Textbook Adapter
   ---------------------------------------------------------
   Unified local textbook loader.
   - Uses the existing textbookEngine for .txt/.text content.
   - Supports text-based PDFs when pdf-parse is installed.
   - Scanned PDFs intentionally remain OCR-ready rather than
     pretending that image-only text is valid knowledge.
========================================================= */

const fs = require("fs");
const path = require("path");
const { loadLocalTextbook, buildKnowledgeContext } = require("./textbookEngine");

const ROOT = path.resolve(__dirname, "../../textbook_data");

function slug(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function candidateFiles(grade, subject) {
  const g = String(grade || "").toLowerCase();
  const s = slug(subject);
  const shortScience = s === "integrated_science" ? "science" : s;
  return [
    `${g}_${s}.txt`,
    `${g}_${shortScience}.txt`,
    `${g}_${s}.pdf`,
    `${g}_${shortScience}.pdf`,
    `${g}_${s}.text`,
    `${g}_${shortScience}.text`,
  ];
}

function findFile(grade, subject) {
  for (const filename of candidateFiles(grade, subject)) {
    const filePath = path.join(ROOT, filename);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return filePath;
  }
  return null;
}

async function readPdfText(filePath) {
  let pdfParse;
  try {
    pdfParse = require("pdf-parse");
  } catch (_) {
    return null;
  }

  const data = fs.readFileSync(filePath);
  try {
    if (typeof pdfParse === "function") {
      const result = await pdfParse(data);
      return result && result.text ? result.text : null;
    }
    if (pdfParse && pdfParse.PDFParse) {
      const parser = new pdfParse.PDFParse({ data });
      const result = await parser.getText();
      if (typeof parser.destroy === "function") await parser.destroy();
      return result && result.text ? result.text : null;
    }
  } catch (_) {
    return null;
  }
  return null;
}

function choosePrimaryConcept(context, topic) {
  if (!context || !Array.isArray(context.concepts)) return null;
  const target = String(topic || "").toLowerCase();
  const ranked = context.concepts
    .map((concept) => {
      const haystack = `${concept.title || ""} ${concept.summary || ""} ${(concept.keywords || []).join(" ")}`.toLowerCase();
      const score = target && haystack.includes(target) ? 100 : (concept.parentTopic || "").toLowerCase().includes(target) ? 70 : 1;
      return { concept, score };
    })
    .sort((a, b) => b.score - a.score);
  if (!ranked.length) return null;
  const concept = ranked[0].concept;
  return {
    title: concept.title || context.topic || "General concept",
    learningObjective: (concept.learningObjectives || [])[0] || null,
    summary: concept.summary || "",
  };
}

function buildResult(raw, grade, subject, topic, source) {
  const textbook = loadLocalTextbook({ grade, subject, filePath: raw.filePath, source });
  if (!textbook.loaded) return { loaded: false, path: raw.filePath, reason: textbook.message };
  const context = buildKnowledgeContext(textbook.content, topic, topic);
  return {
    loaded: true,
    path: raw.filePath,
    context: {
      ...context,
      primaryConcept: choosePrimaryConcept(context, topic),
    },
  };
}

function loadTextbookForRequest({ grade, subject, topic }) {
  const filePath = findFile(grade, subject);
  if (!filePath) return { loaded: false, path: null, reason: "No local textbook found." };

  if (filePath.toLowerCase().endsWith(".pdf")) {
    // The synchronous generator remains deterministic; PDF extraction is
    // therefore attempted only by the async preparation path below.
    return { loaded: false, path: filePath, reason: "PDF requires preprocessing/OCR before generation." };
  }

  return buildResult({ filePath }, grade, subject, topic, path.basename(filePath));
}

async function preparePdfTextbook({ grade, subject, topic }) {
  const filePath = findFile(grade, subject);
  if (!filePath || !filePath.toLowerCase().endsWith(".pdf")) return { loaded: false, path: filePath || null };
  const text = await readPdfText(filePath);
  if (!text || text.trim().length < 200) {
    return { loaded: false, path: filePath, reason: "PDF appears image-only or produced insufficient text. OCR is required." };
  }
  const tempPath = path.join(ROOT, `.${slug(grade)}_${slug(subject)}_extracted.txt`);
  fs.writeFileSync(tempPath, text, "utf8");
  return buildResult({ filePath: tempPath }, grade, subject, topic, path.basename(filePath));
}

module.exports = { loadTextbookForRequest, preparePdfTextbook, findFile };
