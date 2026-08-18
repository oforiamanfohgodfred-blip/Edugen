/* =========================================================
   EduGen TEXTBOOK ENGINE
   ---------------------------------------------------------
   Uses licensed/user-provided textbook extracts as a content
   source. It never copies textbook questions automatically.

   Content format:
   {
     grade, subject, topic, subStrand?, learningObjectives?,
     concepts: [{ title, summary, keywords?, formulas? }]
   }
========================================================= */

const { getTextbooks } = require("../data/textbookRegistry");

function normalize(value) {
  return String(value || "").trim().toLowerCase();
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

function selectConcepts(content, topic) {
  const wanted = normalize(topic);
  return content.concepts.filter((concept) => {
    if (!concept || typeof concept !== "object") return false;
    if (!concept.title && !concept.summary) return false;
    if (!wanted) return true;
    const haystack = normalize(`${concept.title || ""} ${concept.summary || ""} ${(concept.keywords || []).join(" ")}`);
    return haystack.includes(wanted) || normalize(content.topic).includes(wanted);
  });
}

function buildKnowledgeContext(content, topic) {
  const validation = validateContent(content);
  if (!validation.valid) throw new Error(validation.message);

  const concepts = selectConcepts(content, topic);
  return {
    grade: content.grade,
    subject: content.subject,
    topic: content.topic,
    subStrand: content.subStrand || null,
    learningObjectives: content.learningObjectives || [],
    concepts: concepts.map((concept) => ({
      title: concept.title || "",
      summary: concept.summary || "",
      keywords: concept.keywords || [],
      formulas: concept.formulas || [],
    })),
    source: content.source || null,
  };
}

function makeGenerationSeed(content, topic) {
  const context = buildKnowledgeContext(content, topic);
  return {
    ...context,
    instruction: "Generate original questions that assess the supplied concepts. Do not reproduce textbook exercises verbatim.",
  };
}

module.exports = {
  validateContent,
  findApprovedSources,
  selectConcepts,
  buildKnowledgeContext,
  makeGenerationSeed,
};
