const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const dir = __dirname;
const enginePath = path.join(dir, "questionEngine.js");
const curriculumPath = path.join(dir, "curriculumEngine.js");
const qualityPath = path.join(dir, "questionQualityEngine.js");
const textbookPath = path.join(dir, "textbookAdapter.js");
const topicPath = path.join(dir, "topicRouter.js");

for (const file of [enginePath, curriculumPath, qualityPath, textbookPath, topicPath]) {
  if (!fs.existsSync(file)) throw new Error(`Missing required file: ${file}`);
}

const original = fs.readFileSync(enginePath, "utf8");
const backup = path.join(dir, `questionEngine.before-final-integration-${Date.now()}.js`);
const temp = path.join(dir, `questionEngine.final-integration-${Date.now()}.js`);
fs.writeFileSync(backup, original, "utf8");

const imports = `const { validateRequest, normalizeGrade, normalizeSubject } = require("./curriculumEngine");
const { validateQuestion, transformQuestion, makeMixedType, signature } = require("./questionQualityEngine");
const { getKnowledgeContext } = require("./textbookAdapter");
const { routeTopic } = require("./topicRouter");`;

function addImports(source) {
  const lines = imports.split("\n");
  let result = source;
  for (const line of lines) if (!result.includes(line)) result = `${line}\n${result}`;
  return result;
}

const newGenerator = `function generateQuestions({
  subject,
  topic,
  level,
  grade,
  difficulty = "Medium",
  questionType = "Multiple Choice",
  count,
}) {
  const requestedCount = Math.min(Math.max(parseInt(count, 10) || 5, 1), 50);
  const normalizedGrade = normalizeGrade(grade || level);
  const normalizedSubject = normalizeSubject(subject);
  const validation = validateRequest({ grade: normalizedGrade, subject: normalizedSubject, topic });

  if (!validation.valid) {
    throw new Error(validation.message || "Invalid curriculum request.");
  }

  const routedTopic = routeTopic(normalizedSubject, topic);

  // Textbooks are OPTIONAL reference material. Generation never depends on them.
  let textbookReference = { available: false, grounded: false, source: null, context: "", learningObjectives: [], requiresOCR: false };
  try {
    textbookReference = getKnowledgeContext({ grade: normalizedGrade, subject: normalizedSubject, topic: routedTopic });
  } catch (_) {}

  const questions = [];
  const used = new Set();
  let attempts = 0;
  const maxAttempts = Math.max(requestedCount * 400, 1500);

  while (questions.length < requestedCount && attempts < maxAttempts) {
    attempts++;

    let generated;
    const isMath = /^(mathematics|math)$/i.test(String(normalizedSubject));

    if (isMath) {
      generated = generateMath(routedTopic, difficulty, normalizedGrade);
    } else {
      generated = generateScience(normalizedSubject, routedTopic, difficulty, normalizedGrade);
    }

    if (!generated) continue;

    const requestedType = String(questionType || "Multiple Choice").trim();
    const effectiveType = /^mixed$/i.test(requestedType) ? makeMixedType(questions.length) : requestedType;
    generated = transformQuestion(generated, effectiveType);

    // Preserve richer generated metadata while attaching final request metadata.
    generated = {
      ...generated,
      subject: normalizedSubject,
      topic: generated.topic || topic,
      level: normalizedGrade,
      grade: normalizedGrade,
      difficulty,
      questionType: generated.questionType || effectiveType,
    };

    const quality = validateQuestion(generated);
    if (!quality.valid) continue;

    const key = signature(generated.question);
    if (used.has(key)) continue;
    used.add(key);

    questions.push({
      id: makeId(),
      subject: normalizedSubject,
      topic: generated.topic || topic,
      level: normalizedGrade,
      grade: normalizedGrade,
      difficulty,
      questionType: generated.questionType,
      question: generated.question,
      options: generated.options || [],
      answer: generated.answer,
      explanation: generated.explanation || "Review the relevant concept and work through the problem carefully.",
      learningObjective: generated.learningObjective || "Apply the relevant concept correctly.",
      textbookReferenceAvailable: Boolean(textbookReference.available),
      textbookReferenceGrounded: Boolean(textbookReference.grounded),
      textbookReferenceSource: textbookReference.source || null,
      textbookReferenceRequiresOCR: Boolean(textbookReference.requiresOCR),
    });
  }

  if (questions.length !== requestedCount) {
    throw new Error(
      "Unable to generate the requested " + requestedCount +
      " unique questions for " + normalizedGrade + " " + normalizedSubject +
      " / " + topic + ". Generated " + questions.length + "."
    );
  }

  return questions;
}`;

try {
  let source = addImports(original);
  const startMarker = "function generateQuestions({";
  const start = source.indexOf(startMarker);
  if (start === -1) throw new Error("Could not locate generateQuestions function.");

  const exportMarker = "\n/* ========================================================\n   EXPORT\n======================================================== */";
  const end = source.indexOf(exportMarker, start);
  if (end === -1) throw new Error("Could not locate export section after generateQuestions.");

  source = source.slice(0, start) + newGenerator + "\n" + source.slice(end);
  fs.writeFileSync(temp, source, "utf8");
  cp.execFileSync(process.execPath, ["--check", temp], { stdio: "inherit" });
  fs.renameSync(temp, enginePath);

  console.log("==========================================");
  console.log(" EduGen FINAL ENGINE INTEGRATION");
  console.log("==========================================");
  console.log("JHS1-JHS3 + SHS1-SHS3: ENABLED");
  console.log("Textbooks: OPTIONAL REFERENCE ONLY");
  console.log("Missing textbook never blocks generation: YES");
  console.log("PDF/scanned textbook can require OCR: YES");
  console.log("Topic routing: ENABLED");
  console.log("Question quality validation: ENABLED");
  console.log("Mixed question types: ENABLED");
  console.log("Requested count: 1-50");
  console.log("Duplicate signatures: ENABLED");
  console.log("Syntax check: PASSED");
  console.log("FINAL ENGINE INTEGRATION COMPLETE");
  console.log("Backup:", backup);
} catch (error) {
  if (fs.existsSync(temp)) fs.unlinkSync(temp);
  fs.writeFileSync(enginePath, original, "utf8");
  console.error("❌ FINAL INTEGRATION FAILED:", error.message);
  console.error("↩️ Original engine restored.");
  process.exitCode = 1;
}
