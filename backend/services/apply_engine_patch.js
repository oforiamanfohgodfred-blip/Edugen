const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const enginePath = path.join(__dirname, "questionEngine.js");
const backupPath = path.join(
  __dirname,
  `questionEngine.before-master-upgrade.${Date.now()}.js`
);

console.log("==========================================");
console.log(" EduGen Master Engine Upgrade");
console.log("==========================================");

if (!fs.existsSync(enginePath)) {
  console.error("❌ questionEngine.js was not found:");
  console.error(enginePath);
  process.exit(1);
}

const original = fs.readFileSync(enginePath, "utf8");

const requiredFunctions = [
  "function generateQuestions",
  "function generateMath",
  "function generateScience",
  "function convertQuestion",
];

for (const marker of requiredFunctions) {
  if (!original.includes(marker)) {
    console.error(`❌ Safety check failed: missing ${marker}`);
    console.error("No changes were made.");
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

function ensureCurriculumRequire(source) {
  if (source.includes('require("./curriculumEngine")')) {
    return source;
  }

  const marker = 'const crypto = require("crypto");';
  if (!source.includes(marker)) {
    throw new Error("Could not locate the crypto require for curriculum import.");
  }

  return source.replace(
    marker,
    `${marker}\nconst { validateRequest } = require("./curriculumEngine");`
  );
}

const newLevelProfiles = `const levelProfiles = {
  JHS: {
    name: "JHS",
    reasoningDepth: {
      Easy: 1,
      Medium: 2,
      Hard: 3,
      Expert: 5,
    },
    maxSteps: {
      Easy: 1,
      Medium: 2,
      Hard: 3,
      Expert: 5,
    },
    expertStyle: [
      "multi-step reasoning",
      "hidden relationships",
      "careful interpretation",
      "common-mistake traps",
      "indirect information",
    ],
  },

  SHS: {
    name: "SHS",
    reasoningDepth: {
      Easy: 1,
      Medium: 2,
      Hard: 4,
      Expert: 6,
    },
    maxSteps: {
      Easy: 1,
      Medium: 2,
      Hard: 4,
      Expert: 6,
    },
    expertStyle: [
      "multi-concept reasoning",
      "indirect calculation",
      "algebraic manipulation",
      "interpretation of data",
      "common-mistake traps",
      "reverse reasoning",
    ],
  },
};

`;

const newNormalizeLevel = `function normalizeLevel(level) {
  const value = String(level || "").trim().toLowerCase();

  if (
    value === "jhs1" ||
    value === "jhs 1" ||
    value === "b7" ||
    value.includes("jhs") ||
    value.includes("junior") ||
    value.includes("middle school")
  ) {
    return "JHS";
  }

  if (
    value === "shs1" ||
    value === "shs 1" ||
    value === "b10" ||
    value.includes("shs") ||
    value.includes("senior") ||
    value.includes("high school")
  ) {
    return "SHS";
  }

  // University/tertiary is intentionally unsupported in EduGen v1.
  // Unknown values fall back to SHS only for compatibility with old
  // internal generator calls; public requests are blocked by curriculumEngine.
  return "SHS";
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
  const requestedCount = Math.min(
    Math.max(parseInt(count, 10) || 5, 1),
    20
  );

  // Grade is now the authoritative curriculum selector.
  // The old level value is accepted as a compatibility alias only.
  const curriculumGrade = grade || level;
  const validation = validateRequest({
    grade: curriculumGrade,
    subject,
    topic,
  });

  if (!validation.valid) {
    const error = new Error(validation.message);
    error.code = validation.code;
    error.details = validation;
    throw error;
  }

  const normalizedDifficulty = normalizeDifficulty(difficulty);
  const normalizedType = String(
    questionType || "Multiple Choice"
  ).trim();

  const questions = [];
  const used = new Set();
  let attempts = 0;
  const maxAttempts = Math.max(requestedCount * 300, 750);

  while (
    questions.length < requestedCount &&
    attempts < maxAttempts
  ) {
    attempts++;

    let generated;

    if (validation.subject === "Mathematics") {
      generated = generateMath(
        validation.topic,
        normalizedDifficulty,
        validation.academicLevel
      );
    } else {
      generated = generateScience(
        validation.subject,
        validation.topic,
        normalizedDifficulty,
        validation.academicLevel
      );
    }

    if (!generated || !generated.question) {
      continue;
    }

    generated = convertQuestion(
      generated,
      normalizedType
    );

    const normalized = cleanText(generated.question);

    if (!normalized || used.has(normalized)) {
      continue;
    }

    used.add(normalized);

    questions.push({
      id: makeId(),
      subject: validation.subject,
      topic: generated.topic || validation.topic,
      grade: validation.grade,
      level: validation.academicLevel,
      difficulty: normalizedDifficulty,
      questionType:
        generated.questionType ||
        normalizedType ||
        "Multiple Choice",
      question: generated.question,
      options: generated.options || [],
      answer: generated.answer,
      explanation:
        generated.explanation ||
        "Review the underlying concept and work through the problem carefully.",
      learningObjective:
        generated.learningObjective ||
        "Apply the relevant concept correctly.",
    });
  }

  // Never silently return fewer questions than requested.
  if (questions.length < requestedCount) {
    const error = new Error(
      \`EduGen could only generate \${questions.length} unique question(s) out of \${requestedCount} requested for \${validation.grade} → \${validation.subject} → \${validation.topic} → \${normalizedDifficulty} → \${normalizedType}.\`
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
      questionType: normalizedType,
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

  updated = ensureCurriculumRequire(updated);

  // Replace the old JHS/SHS/University profile with JHS/SHS only.
  updated = replaceSection(
    updated,
    "const levelProfiles = {",
    "/*\n=========================================================\n NORMALIZE ACADEMIC LEVEL",
    newLevelProfiles
  );

  // Replace the old level normalizer so University is no longer a valid path.
  updated = replaceSection(
    updated,
    "function normalizeLevel(level) {",
    "/*\n=========================================================\n NORMALIZE DIFFICULTY",
    newNormalizeLevel
  );

  updated = replaceMainGenerator(updated, newGenerateQuestions);

  const tempPath = `${enginePath}.master-upgrade.tmp.js`;
  fs.writeFileSync(tempPath, updated, "utf8");

  console.log("🔎 Running JavaScript syntax check...");
  execFileSync(
    process.execPath,
    ["--check", tempPath],
    { stdio: "inherit" }
  );

  fs.renameSync(tempPath, enginePath);
  console.log("✅ questionEngine.js updated successfully.");
} catch (error) {
  console.error("❌ Master patch failed:");
  console.error(error.message);

  const tempPath = `${enginePath}.master-upgrade.tmp.js`;
  if (fs.existsSync(tempPath)) {
    fs.unlinkSync(tempPath);
  }

  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, enginePath);
    console.error("↩️ Original engine restored from backup.");
  }

  process.exit(1);
}

console.log("==========================================");
console.log(" EduGen master patch completed");
console.log("==========================================");
