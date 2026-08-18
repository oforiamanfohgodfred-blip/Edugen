const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const enginePath = path.join(__dirname, "masterGenerationEngine.js");
const source = fs.readFileSync(enginePath, "utf8");

if (source.includes('require("./expertQuestionEngine")')) {
  console.log("Expert engine is already integrated.");
  process.exit(0);
}

const backupPath = enginePath.replace(/\.js$/, `.before-expert-${Date.now()}.js`);
fs.copyFileSync(enginePath, backupPath);

let updated = source;

const importAnchor = 'const { generateSHSPhysicsQuestion } = require("./shsPhysicsEngine");';
if (!updated.includes(importAnchor)) throw new Error("Could not locate master engine import section.");
updated = updated.replace(
  importAnchor,
  `${importAnchor}\nconst { generateExpertQuestion } = require("./expertQuestionEngine");`
);

const start = updated.indexOf("function generateQuestions(request) {");
const exportMarker = "\nmodule.exports = { generateQuestions };";
const end = updated.indexOf(exportMarker, start);
if (start < 0 || end < 0) throw new Error("Could not locate generateQuestions section.");

const replacement = `function generateQuestions(request) {
  const grade = curriculum.normalizeGrade(request.grade || request.level);
  const validation = curriculum.validateRequest({ grade, subject: request.subject, topic: request.topic });
  if (!validation.valid) {
    const error = new Error(validation.message);
    error.code = validation.code;
    error.details = validation;
    throw error;
  }

  const subject = validation.subject;
  const topic = validation.topic;
  const difficulty = request.difficulty || "Medium";
  const requestedCount = Math.min(Math.max(parseInt(request.count, 10) || 5, 1), 50);
  const result = [];
  const seen = new Set();
  const families = [
    "concept",
    "application",
    "calculation",
    "comparison",
    "cause-effect",
    "data-interpretation",
    "investigation",
    "misconception",
    "expert-reasoning",
  ];
  const maxAttempts = Math.max(1500, requestedCount * 400);

  for (let attempt = 0; attempt < maxAttempts && result.length < requestedCount; attempt += 1) {
    let generated;

    if (difficulty === "Expert") {
      generated = generateExpertQuestion({ grade, subject, topic });
    } else if (subject === "Mathematics") {
      const legacy = legacyMath.generateQuestions({
        subject,
        topic,
        level: grade,
        difficulty,
        questionType: "Multiple Choice",
        count: 1,
      });
      generated = legacy && legacy[0];
    } else {
      generated = generateScienceQuestion({
        grade,
        subject,
        topic,
        difficulty,
        family: randomItem(families),
      });
    }

    if (!generated) continue;

    generated = convertType(generated, request.questionType);
    const key = clean(generated.question);
    if (seen.has(key)) continue;
    seen.add(key);

    result.push({
      id: id(),
      subject,
      topic,
      grade,
      level: grade,
      difficulty,
      questionType: generated.questionType,
      question: generated.question,
      options: generated.options || [],
      answer: generated.answer,
      correctAnswer: generated.correctAnswer || generated.answer,
      explanation: generated.explanation || "Review the relevant concept and reasoning.",
      learningObjective: generated.learningObjective || `Apply ${topic}.`,
      questionFamily: generated.questionFamily || "generated",
      reasoningSteps: generated.reasoningSteps || (difficulty === "Expert" ? 3 : undefined),
      expertReasoning: Boolean(generated.expertReasoning),
    });
  }

  return result;
}`;

updated = updated.slice(0, start) + replacement + updated.slice(end);
fs.writeFileSync(enginePath, updated, "utf8");

try {
  cp.execFileSync(process.execPath, ["--check", enginePath], { stdio: "inherit" });
  cp.execFileSync(process.execPath, ["--check", path.join(__dirname, "expertQuestionEngine.js")], { stdio: "inherit" });
} catch (error) {
  fs.copyFileSync(backupPath, enginePath);
  console.error("Expert upgrade failed syntax validation. Original restored.");
  process.exit(1);
}

console.log("==========================================");
console.log(" EduGen EXPERT REASONING UPGRADE");
console.log("==========================================");
console.log(`Backup: ${backupPath}`);
console.log("Expert mode: MULTI-STEP + DEEP REASONING");
console.log("Expert mode: CONCEPT-FIRST, NOT NUMBER-FIRST");
console.log("Expert mode: MATHEMATICS + INTEGRATED SCIENCE + PHYSICS + CHEMISTRY + BIOLOGY");
console.log("Syntax check: PASSED");
console.log("EXPERT UPGRADE COMPLETE");
