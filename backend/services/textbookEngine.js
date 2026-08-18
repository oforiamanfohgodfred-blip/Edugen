/* =========================================================
   EduGen TEXTBOOK ENGINE
   ---------------------------------------------------------
   Reads locally supplied textbook text files and turns them into
   searchable knowledge contexts for question generation.

   Copyright/safety rule:
   - textbook files are expected to remain local/user-provided
   - this module extracts concepts for generation
   - it does NOT copy textbook exercises into the question bank
========================================================= */

const fs = require("fs");
const path = require("path");
const { getTextbooks } = require("../data/textbookRegistry");

const DEFAULT_TEXTBOOK_DIR = path.resolve(__dirname, "../../textbook_data");

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\r/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeGrade(value) {
  const raw = normalize(value).replace(/\s+/g, "");
  const match = raw.match(/(?:jhs|basic|b)?([1-3])/);
  return match ? `JHS${match[1]}` : String(value || "").trim().toUpperCase();
}

function normalizeSubject(value) {
  const raw = normalize(value);
  if (raw.includes("science")) return raw.includes("integrated") ? "Integrated Science" : "Integrated Science";
  if (raw.includes("math")) return "Mathematics";
  if (raw.includes("physics")) return "Physics";
  if (raw.includes("chemistry")) return "Chemistry";
  if (raw.includes("biology")) return "Biology";
  return String(value || "").trim();
}

function validateContent(content) {
  if (!content || typeof content !== "object") {
    return { valid: false, message: "Textbook content must be an object." };
  }
  if (!content.grade || !content.subject || !content.topic) {
    return { valid: false, message: "Textbook content requires grade, subject and topic." };
  }
  if (!Array.isArray(content.concepts)) {
    return { valid: false, message: "Textbook content requires a concepts array." };
  }
  return { valid: true };
}

function findApprovedSources(grade, subject) {
  return getTextbooks(grade, subject);
}

function resolveTextbookPath(grade, subject, textbookDir = DEFAULT_TEXTBOOK_DIR) {
  const normalizedGrade = normalizeGrade(grade);
  const normalizedSubject = normalizeSubject(subject);
  const subjectSlug = normalize(normalizedSubject).replace(/\s+/g, "_");

  const candidates = [
    `${normalizedGrade.toLowerCase()}_${subjectSlug}.txt`,
    `${normalizedGrade.toLowerCase()}_${subjectSlug.replace("integrated_", "")}.txt`,
    `${normalizedGrade.toLowerCase()}_${normalize(subject).replace(/\s+/g, "_")}.txt`,
  ];

  for (const filename of candidates) {
    const fullPath = path.join(textbookDir, filename);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) return fullPath;
  }

  // Also allow a single local file to be explicitly supplied by the caller.
  return null;
}

function readLocalTextbook(filePath) {
  if (!filePath) return null;
  if (!fs.existsSync(filePath)) return null;
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) return null;
  return fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
}

function cleanLine(line) {
  return String(line || "")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function isHeading(line) {
  const text = cleanLine(line);
  if (!text || text.length > 140) return false;
  if (/^(chapter|unit|topic|sub[- ]?strand|section|lesson|module)\b/i.test(text)) return true;
  if (/^[A-Z0-9][A-Z0-9 .:&'()\-/]{4,}$/.test(text) && text.split(/\s+/).length <= 12) return true;
  return false;
}

function inferHeadingType(line) {
  const text = cleanLine(line);
  if (/^chapter\b/i.test(text)) return "chapter";
  if (/^unit\b/i.test(text)) return "unit";
  if (/^topic\b/i.test(text)) return "topic";
  if (/^sub[- ]?strand\b/i.test(text)) return "subStrand";
  if (/^section\b/i.test(text)) return "section";
  if (/^lesson\b/i.test(text)) return "lesson";
  return "heading";
}

function extractLabels(text) {
  const labels = {
    learningObjectives: [],
    keywords: [],
    formulas: [],
  };

  const lines = text.split(/\n/).map(cleanLine).filter(Boolean);
  let active = null;

  for (const line of lines) {
    if (/^(learning objectives?|objectives?|learning outcomes?)\s*:/i.test(line)) {
      active = "learningObjectives";
      continue;
    }
    if (/^(key words?|keywords?|key terms?|terms?)\s*:/i.test(line)) {
      active = "keywords";
      continue;
    }
    if (/^(formulae?|formulas?|equations?)\s*:/i.test(line)) {
      active = "formulas";
      continue;
    }
    if (isHeading(line) && !/^[-•*]/.test(line)) {
      active = null;
      continue;
    }
    if (active && /^[-•*\d.)]+\s+/.test(line)) {
      labels[active].push(line.replace(/^[-•*\d.)]+\s+/, "").trim());
    }
  }

  return labels;
}

function splitIntoSections(rawText) {
  const lines = String(rawText || "").split(/\n/).map(cleanLine);
  const sections = [];
  let current = null;

  for (const line of lines) {
    if (isHeading(line)) {
      if (current && current.text.trim()) sections.push(current);
      current = {
        title: line,
        type: inferHeadingType(line),
        text: "",
      };
      continue;
    }
    if (!current) {
      current = { title: "Introduction", type: "introduction", text: "" };
    }
    if (line) current.text += `${line}\n`;
  }

  if (current && current.text.trim()) sections.push(current);
  return sections;
}

function buildConceptFromSection(section, parentTopic = null) {
  const labels = extractLabels(section.text);
  const summaryLines = section.text
    .split(/\n/)
    .map(cleanLine)
    .filter(Boolean)
    .filter((line) => !/^(learning objectives?|objectives?|learning outcomes?|key words?|keywords?|key terms?|terms?|formulae?|formulas?|equations?)\s*:/i.test(line))
    .slice(0, 8);

  return {
    title: section.title,
    summary: summaryLines.join(" ").slice(0, 1800),
    keywords: labels.keywords,
    formulas: labels.formulas,
    learningObjectives: labels.learningObjectives,
    parentTopic,
  };
}

function parseTextbookText(rawText, metadata = {}) {
  const sections = splitIntoSections(rawText);
  let currentTopic = metadata.topic || null;
  let currentSubStrand = metadata.subStrand || null;
  const concepts = [];
  const seen = new Set();

  for (const section of sections) {
    if (section.type === "topic" || section.type === "chapter" || section.type === "unit") {
      currentTopic = section.title;
    }
    if (section.type === "subStrand") currentSubStrand = section.title;

    const concept = buildConceptFromSection(section, currentTopic);
    const key = normalize(`${concept.title} ${concept.summary}`).slice(0, 500);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    concepts.push(concept);
  }

  return {
    grade: normalizeGrade(metadata.grade),
    subject: normalizeSubject(metadata.subject),
    topic: currentTopic || metadata.topic || "General",
    subStrand: currentSubStrand,
    source: metadata.source || null,
    concepts,
    sections,
    rawLength: String(rawText || "").length,
  };
}

function loadLocalTextbook({ grade, subject, filePath, textbookDir = DEFAULT_TEXTBOOK_DIR, source = null } = {}) {
  const resolved = filePath || resolveTextbookPath(grade, subject, textbookDir);
  if (!resolved) return { loaded: false, path: null, message: "No local textbook file was found." };

  const rawText = readLocalTextbook(resolved);
  if (rawText === null) return { loaded: false, path: resolved, message: "The textbook file could not be read." };

  const content = parseTextbookText(rawText, { grade, subject, source });
  return { loaded: true, path: resolved, content };
}

function selectConcepts(content, topic) {
  const validation = validateContent(content);
  if (!validation.valid) return [];

  const wanted = normalize(topic);
  return content.concepts.filter((concept) => {
    if (!concept || typeof concept !== "object") return false;
    if (!concept.title && !concept.summary) return false;
    if (!wanted) return true;
    const haystack = normalize(`${concept.title || ""} ${concept.summary || ""} ${(concept.keywords || []).join(" ")} ${(concept.parentTopic || "")}`);
    return haystack.includes(wanted) || normalize(content.topic).includes(wanted);
  });
}

function searchConcepts(content, query, limit = 8) {
  const validation = validateContent(content);
  if (!validation.valid) return [];

  const terms = normalize(query).split(/\s+/).filter((term) => term.length > 1);
  if (!terms.length) return content.concepts.slice(0, limit);

  return content.concepts
    .map((concept) => {
      const haystack = normalize(`${concept.title} ${concept.summary} ${(concept.keywords || []).join(" ")} ${(concept.learningObjectives || []).join(" ")} ${(concept.formulas || []).join(" ")}`);
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { concept, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.concept);
}

function buildKnowledgeContext(content, topic, query = topic) {
  const validation = validateContent(content);
  if (!validation.valid) throw new Error(validation.message);

  const concepts = topic ? selectConcepts(content, topic) : searchConcepts(content, query);
  return {
    grade: content.grade,
    subject: content.subject,
    topic: content.topic,
    subStrand: content.subStrand || null,
    learningObjectives: [...new Set(concepts.flatMap((c) => c.learningObjectives || []))],
    concepts: concepts.map((concept) => ({
      title: concept.title || "",
      summary: concept.summary || "",
      keywords: concept.keywords || [],
      formulas: concept.formulas || [],
      parentTopic: concept.parentTopic || null,
    })),
    source: content.source || null,
  };
}

function makeGenerationSeed(content, topic, query = topic) {
  const context = buildKnowledgeContext(content, topic, query);
  return {
    ...context,
    instruction: "Generate original questions that assess the supplied concepts. Do not reproduce textbook exercises verbatim. Stay within the supplied grade and subject context.",
  };
}

module.exports = {
  DEFAULT_TEXTBOOK_DIR,
  normalizeGrade,
  normalizeSubject,
  validateContent,
  findApprovedSources,
  resolveTextbookPath,
  readLocalTextbook,
  splitIntoSections,
  parseTextbookText,
  loadLocalTextbook,
  selectConcepts,
  searchConcepts,
  buildKnowledgeContext,
  makeGenerationSeed,
};
