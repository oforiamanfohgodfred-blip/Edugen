/* =========================================================
   EduGen Content Engine
   ---------------------------------------------------------
   This layer separates curriculum/content knowledge from the
   question-generation algorithms.

   It intentionally does NOT copy textbook questions. Authorized
   curriculum/textbook material can be represented as concepts,
   learning objectives and source metadata, which generators use
   to create original questions.
========================================================= */

const { CURRICULUM_SOURCES, normalizeGrade, normalizeSubject } = require("./curriculumEngine");

const CONTENT_SOURCES = {
  officialCurriculum: CURRICULUM_SOURCES,
  authorizedTextbooks: [],
};

const CONTENT_REGISTRY = new Map();

function makeKey(grade, subject, topic) {
  return [grade, subject, topic]
    .map((value) => String(value || "").trim().toLowerCase())
    .join("::");
}

function registerContent({ grade, subject, topic, concepts = [], objectives = [], source = null }) {
  const normalizedGrade = normalizeGrade(grade);
  const normalizedSubject = normalizeSubject(subject, normalizedGrade);

  if (!normalizedGrade || !normalizedSubject || !topic) {
    throw new Error("Content registration requires grade, subject and topic.");
  }

  const entry = {
    grade: normalizedGrade,
    subject: normalizedSubject,
    topic: String(topic).trim(),
    concepts: Array.from(new Set(concepts.map(String).map((x) => x.trim()).filter(Boolean))),
    objectives: Array.from(new Set(objectives.map(String).map((x) => x.trim()).filter(Boolean))),
    source,
  };

  CONTENT_REGISTRY.set(makeKey(normalizedGrade, normalizedSubject, topic), entry);
  return entry;
}

function getContent({ grade, subject, topic }) {
  const normalizedGrade = normalizeGrade(grade);
  const normalizedSubject = normalizeSubject(subject, normalizedGrade);
  return CONTENT_REGISTRY.get(makeKey(normalizedGrade, normalizedSubject, topic)) || null;
}

function getContentForGradeSubject(grade, subject) {
  const normalizedGrade = normalizeGrade(grade);
  const normalizedSubject = normalizeSubject(subject, normalizedGrade);
  const prefix = `${String(normalizedGrade).toLowerCase()}::${String(normalizedSubject).toLowerCase()}::`;

  return Array.from(CONTENT_REGISTRY.entries())
    .filter(([key]) => key.startsWith(prefix))
    .map(([, value]) => value);
}

function registerAuthorizedTextbook({ title, publisher, subject, grades, url, license, notes = "" }) {
  if (!title || !subject || !url || !license) {
    throw new Error("Authorized textbook registration requires title, subject, url and license.");
  }

  const entry = {
    title,
    publisher: publisher || null,
    subject,
    grades: Array.isArray(grades) ? grades : [],
    url,
    license,
    notes,
  };

  CONTENT_SOURCES.authorizedTextbooks.push(entry);
  return entry;
}

function getContentSourceInfo() {
  return {
    officialCurriculum: { ...CONTENT_SOURCES.officialCurriculum },
    authorizedTextbooks: CONTENT_SOURCES.authorizedTextbooks.slice(),
  };
}

module.exports = {
  CONTENT_SOURCES,
  CONTENT_REGISTRY,
  registerContent,
  getContent,
  getContentForGradeSubject,
  registerAuthorizedTextbook,
  getContentSourceInfo,
};
