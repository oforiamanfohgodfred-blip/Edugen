const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const enginePath = path.join(__dirname, "questionEngine.js");
const backupPath = path.join(__dirname, `questionEngine.before-final-upgrade.${Date.now()}.js`);

console.log("==========================================");
console.log(" EduGen Final Engine Upgrade");
console.log("==========================================");

if (!fs.existsSync(enginePath)) {
  console.error("❌ questionEngine.js was not found:", enginePath);
  process.exit(1);
}

const original = fs.readFileSync(enginePath, "utf8");

for (const marker of [
  "function generateQuestions",
  "function generateMath",
  "function generateScience",
  "function convertQuestion",
]) {
  if (!original.includes(marker)) {
    console.error(`❌ Safety check failed: missing ${marker}`);
    process.exit(1);
  }
}

function replaceSection(source, startMarker, endMarker, replacement) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Could not locate section: ${startMarker}`);
  }
  return source.slice(0, start) + replacement + source.slice(end);
}

function replaceMainGenerator(source, replacement) {
  const start = source.indexOf("function generateQuestions({");
  const exportStart = source.indexOf("module.exports = {", start);
  if (start === -1 || exportStart === -1) {
    throw new Error("Could not locate generateQuestions/export boundaries.");
  }
  return source.slice(0, start) + replacement + source.slice(exportStart);
}

function ensureRequire(source, statement, marker = 'const crypto = require("crypto");') {
  if (source.includes(statement)) return source;
  if (!source.includes(marker)) throw new Error(`Could not locate ${marker}`);
  return source.replace(marker, `${marker}\n${statement}`);
}

const newLevelProfiles = `const levelProfiles = {
  JHS: {
    name: "JHS",
    reasoningDepth: { Easy: 1, Medium: 2, Hard: 3, Expert: 5 },
    maxSteps: { Easy: 1, Medium: 2, Hard: 3, Expert: 5 },
    expertStyle: [
      "multi-step reasoning", "hidden relationships", "careful interpretation",
      "common-mistake traps", "indirect information", "reverse reasoning",
    ],
  },
  SHS: {
    name: "SHS",
    reasoningDepth: { Easy: 1, Medium: 2, Hard: 4, Expert: 6 },
    maxSteps: { Easy: 1, Medium: 2, Hard: 4, Expert: 6 },
    expertStyle: [
      "multi-concept reasoning", "indirect calculation", "algebraic manipulation",
      "interpretation of data", "common-mistake traps", "reverse reasoning",
    ],
  },
};

`;

const newNormalizeLevel = `function normalizeLevel(level) {
  const value = String(level || "").trim().toLowerCase();
  if (value.includes("university") || value.includes("tertiary") || value.includes("undergraduate")) {
    return "SHS";
  }
  if (value.includes("jhs") || value.includes("junior") || value.includes("middle") || value.includes("basic")) {
    return "JHS";
  }
  if (value.includes("shs") || value.includes("senior") || value.includes("high school")) {
    return "SHS";
  }
  return "SHS";
}

`;

const newConvertQuestion = `function convertToShortAnswer(question) {
  return {
    ...question,
    options: [],
    questionType: "Short Answer",
  };
}

function convertQuestion(question, questionType) {
  const requested = String(questionType || "Multiple Choice").trim();
  const type = requested.toLowerCase();

  if (type.includes("mixed")) {
    const choices = [
      "Multiple Choice",
      "Short Answer",
      "Problem Solving",
      "True / False",
      "Word Problems",
    ];
    return convertQuestion(question, randomItem(choices));
  }

  if (type.includes("true") || type.includes("false")) {
    return convertToTrueFalse(question);
  }
  if (type.includes("problem") && !type.includes("word")) {
    return convertToProblemSolving(question);
  }
  if (type.includes("word")) {
    return convertToWordProblem(question);
  }
  if (type.includes("short") || type.includes("answer")) {
    return convertToShortAnswer(question);
  }

  return { ...question, questionType: "Multiple Choice" };
}

`;

const topicMapper = `function mapGeneratorTopic(subject, topic) {
  const t = String(topic || "").toLowerCase();
  if (String(subject).toLowerCase() === "mathematics") {
    if (t.includes("simultaneous")) return "simultaneous equations";
    if (t.includes("quadratic")) return "quadratic equations";
    if (t.includes("logarithm")) return "logarithms";
    if (t.includes("function")) return "functions";
    if (t.includes("trigon")) return "trigonometry";
    if (t.includes("sequence") || t.includes("progression") || t.includes("pattern")) return "sequences";
    if (t.includes("probability") || t.includes("chance")) return "probability";
    if (t.includes("statistic") || t.includes("data")) return "statistics";
    if (t.includes("ratio") || t.includes("proportion")) return "ratio";
    if (t.includes("percent") || t.includes("financial")) return "percentage";
    if (t.includes("index") || t.includes("indices") || t.includes("surds")) return "indices";
    if (t.includes("trig")) return "trigonometry";
    if (t.includes("geometry") || t.includes("shape") || t.includes("angle") || t.includes("pythag") || t.includes("circle") || t.includes("bearing") || t.includes("mensuration") || t.includes("measurement")) return "geometry";
    if (t.includes("vector")) return "geometry";
    if (t.includes("algebra") || t.includes("equation") || t.includes("inequal")) return "algebra";
    if (t.includes("number") || t.includes("fraction") || t.includes("decimal")) return "percentage";
    return "algebra";
  }
  return topic;
}

`;

const newGenerateQuestions = `function generateQuestions({
  subject,
  topic,
  level,
  grade,
  difficulty,
  questionType,
  count,
}) {
  const requestedCount = Math.min(Math.max(parseInt(count, 10) || 5, 1), 20);
  const curriculumGrade = grade || level;
  const validation = validateRequest({ grade: curriculumGrade, subject, topic });

  if (!validation.valid) {
    const error = new Error(validation.message);
    error.code = validation.code;
    error.details = validation;
    throw error;
  }

  const normalizedDifficulty = normalizeDifficulty(difficulty);
  const requestedType = String(questionType || "Multiple Choice").trim();
  const textbook = getKnowledgeContext({
    grade: validation.grade,
    subject: validation.subject,
    topic: validation.topic,
  });

  const questions = [];
  const used = new Set();
  let attempts = 0;
  const maxAttempts = Math.max(requestedCount * 300, 750);

  while (questions.length < requestedCount && attempts < maxAttempts) {
    attempts++;

    let generated;
    const generatorTopic = mapGeneratorTopic(validation.subject, validation.topic);

    if (validation.subject === "Mathematics") {
      generated = generateMath(generatorTopic, normalizedDifficulty, validation.academicLevel);
    } else {
      generated = generateScience(validation.subject, validation.topic, normalizedDifficulty, validation.academicLevel);
    }

    if (!generated || !generated.question) continue;

    generated = convertQuestion(generated, requestedType);
    const normalized = cleanText(generated.question);
    if (!normalized || used.has(normalized)) continue;
    used.add(normalized);

    const learningObjective = generated.learningObjective ||
      (textbook.learningObjectives && textbook.learningObjectives[0]) ||
      "Apply the relevant concept correctly.";

    questions.push({
      id: makeId(),
      subject: validation.subject,
      topic: validation.topic,
      grade: validation.grade,
      level: validation.academicLevel,
      difficulty: normalizedDifficulty,
      questionType: generated.questionType || "Multiple Choice",
      question: generated.question,
      options: generated.options || [],
      answer: generated.answer,
      explanation: generated.explanation || "Review the underlying concept and work through the problem carefully.",
      learningObjective,
      textbookGrounded: Boolean(textbook.grounded),
      textbookSource: textbook.source || null,
      textbookContext: textbook.context || null,
    });
  }

  if (questions.length < requestedCount) {
    const error = new Error(
      \`EduGen could only generate \${questions.length} unique question(s) out of \${requestedCount} requested for \${validation.grade} → \${validation.subject} → \${validation.topic} → \${normalizedDifficulty} → \${requestedType}.\`
    );
    error.code = "INSUFFICIENT_UNIQUE_QUESTIONS";
    error.details = {
      requestedCount,
      generatedCount: questions.length,
      attempts,
      grade: validation.grade,
      level: validation.academicLevel,
      subject: validation.subject,
      topic: validation.topic,
      difficulty: normalizedDifficulty,
      questionType: requestedType,
      textbookAvailable: Boolean(textbook.available),
    };
    throw error;
  }

  return questions;
}

`;

let updated = original;

try {
  fs.copyFileSync(enginePath, backupPath);
  console.log(`✅ Backup created: ${backupPath}`);

  updated = ensureRequire(updated, 'const { validateRequest } = require("./curriculumEngine");');
  updated = ensureRequire(updated, 'const { getKnowledgeContext } = require("./textbookEngine");');

  updated = replaceSection(
    updated,
    "const levelProfiles = {",
    "/*\n=========================================================\n NORMALIZE ACADEMIC LEVEL",
    newLevelProfiles
  );

  updated = replaceSection(
    updated,
    "function normalizeLevel(level) {",
    "/*\n=========================================================\n NORMALIZE DIFFICULTY",
    newNormalizeLevel
  );

  updated = replaceSection(
    updated,
    "function convertQuestion(",
    "/* ========================================================\n   MAIN GENERATOR",
    newConvertQuestion
  );

  const insertBeforeGenerate = "function generateQuestions({";
  if (!updated.includes("function mapGeneratorTopic(")) {
    updated = updated.replace(insertBeforeGenerate, topicMapper + insertBeforeGenerate);
  }

  updated = replaceMainGenerator(updated, newGenerateQuestions);

  const tempPath = `${enginePath}.final-upgrade.tmp.js`;
  fs.writeFileSync(tempPath, updated, "utf8");
  console.log("🔎 Running JavaScript syntax check...");
  execFileSync(process.execPath, ["--check", tempPath], { stdio: "inherit" });
  fs.renameSync(tempPath, enginePath);
  console.log("✅ questionEngine.js updated successfully.");
} catch (error) {
  console.error("❌ Final patch failed:", error.message);
  const tempPath = `${enginePath}.final-upgrade.tmp.js`;
  if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, enginePath);
    console.error("↩️ Original engine restored from backup.");
  }
  process.exit(1);
}

console.log("==========================================");
console.log(" EduGen final patch ready");
console.log("==========================================");
