const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const enginePath = path.join(__dirname, "questionEngine.js");
const backupPath = path.join(
  __dirname,
  `questionEngine.before-v2.${Date.now()}.js`
);

console.log("==========================================");
console.log(" EduGen Robust Master Engine Upgrade v2");
console.log("==========================================");

if (!fs.existsSync(enginePath)) {
  throw new Error(`questionEngine.js not found: ${enginePath}`);
}

const original = fs.readFileSync(enginePath, "utf8");
let source = original;

for (const marker of [
  "function generateQuestions",
  "function generateMath",
  "function generateScience",
  "function convertQuestion",
]) {
  if (!source.includes(marker)) {
    throw new Error(`Safety check failed: missing ${marker}`);
  }
}

fs.copyFileSync(enginePath, backupPath);
console.log(`Backup created: ${backupPath}`);

function ensureRequire(statement) {
  if (source.includes(statement)) return;
  const marker = 'const crypto = require("crypto");';
  if (!source.includes(marker)) throw new Error(`Missing require anchor: ${marker}`);
  source = source.replace(marker, `${marker}\n${statement}`);
}

// Curriculum and textbook dependencies are hard dependencies of the engine,
// but textbook loading remains graceful when files are not available yet.
ensureRequire('const { validateRequest } = require("./curriculumEngine");');
ensureRequire('const { getKnowledgeContext } = require("./textbookEngine");');

// Replace the complete academic level profile using structural boundaries,
// not fragile comment text. This fixes the previous patch failure.
const profileStart = source.indexOf("const levelProfiles = {");
const normalizeStart = source.indexOf("function normalizeLevel(level)", profileStart);
if (profileStart === -1 || normalizeStart === -1) {
  throw new Error("Could not locate levelProfiles/normalizeLevel boundaries.");
}

const newProfiles = `const levelProfiles = {
  JHS: {
    name: "JHS",
    reasoningDepth: { Easy: 1, Medium: 2, Hard: 3, Expert: 5 },
    maxSteps: { Easy: 1, Medium: 2, Hard: 3, Expert: 5 },
    expertStyle: [
      "multi-step reasoning",
      "hidden relationships",
      "careful interpretation",
      "common-mistake traps",
      "indirect information",
      "reverse reasoning",
    ],
  },
  SHS: {
    name: "SHS",
    reasoningDepth: { Easy: 1, Medium: 2, Hard: 4, Expert: 6 },
    maxSteps: { Easy: 1, Medium: 2, Hard: 4, Expert: 6 },
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
source = source.slice(0, profileStart) + newProfiles + source.slice(normalizeStart);

// Replace normalizeLevel through the beginning of normalizeDifficulty.
const levelFnStart = source.indexOf("function normalizeLevel(level)");
const difficultyFnStart = source.indexOf("function normalizeDifficulty(", levelFnStart);
if (levelFnStart === -1 || difficultyFnStart === -1) {
  throw new Error("Could not locate normalizeLevel/normalizeDifficulty boundaries.");
}

const newNormalizeLevel = `function normalizeLevel(level) {
  const value = String(level || "").trim().toLowerCase();

  // University is intentionally unsupported by EduGen.
  if (
    value.includes("university") ||
    value.includes("tertiary") ||
    value.includes("undergraduate")
  ) {
    throw new Error("University level is not supported by EduGen.");
  }

  if (
    value.includes("jhs") ||
    value.includes("junior") ||
    value.includes("middle school") ||
    value.includes("basic")
  ) {
    return "JHS";
  }

  if (
    value.includes("shs") ||
    value.includes("senior") ||
    value.includes("high school")
  ) {
    return "SHS";
  }

  return "SHS";
}

`;
source = source.slice(0, levelFnStart) + newNormalizeLevel + source.slice(difficultyFnStart);

// Add a safe topic mapper used by the existing generator. This does not
// replace generator implementations; it only normalizes curriculum wording.
const mapperMarker = "function mapGeneratorTopic(subject, topic)";
if (!source.includes(mapperMarker)) {
  const generatorStart = source.indexOf("function generateQuestions({");
  if (generatorStart === -1) throw new Error("Could not locate main generator.");

  const topicMapper = `function mapGeneratorTopic(subject, topic) {
  const t = String(topic || "").toLowerCase();
  if (String(subject).toLowerCase() === "mathematics") {
    if (t.includes("simultaneous")) return "simultaneous equations";
    if (t.includes("quadratic")) return "quadratic equations";
    if (t.includes("logarithm")) return "logarithms";
    if (t.includes("function")) return "functions";
    if (t.includes("trigon")) return "trigonometry";
    if (t.includes("sequence") || t.includes("progression") || t.includes("pattern")) return "sequences";
    if (t.includes("probability")) return "probability";
    if (t.includes("statistic") || t.includes("data")) return "statistics";
    if (t.includes("ratio") || t.includes("proportion")) return "ratio";
    if (t.includes("percent") || t.includes("financial")) return "percentage";
    if (t.includes("index") || t.includes("indices") || t.includes("surds")) return "indices";
    if (t.includes("geometry") || t.includes("shape") || t.includes("angle") || t.includes("pythag") || t.includes("circle") || t.includes("bearing") || t.includes("mensuration") || t.includes("measurement")) return "geometry";
    if (t.includes("algebra") || t.includes("equation") || t.includes("inequal")) return "algebra";
    if (t.includes("number") || t.includes("fraction") || t.includes("decimal")) return "percentage";
  }
  return topic;
}

`;
  source = source.slice(0, generatorStart) + topicMapper + source.slice(generatorStart);
}

const tempPath = `${enginePath}.v2.tmp.js`;
fs.writeFileSync(tempPath, source, "utf8");

try {
  console.log("Running JavaScript syntax check...");
  execFileSync(process.execPath, ["--check", tempPath], { stdio: "inherit" });
  fs.renameSync(tempPath, enginePath);
  console.log("✅ questionEngine.js upgraded successfully.");
  console.log("✅ University removed from engine profiles.");
  console.log("✅ Curriculum engine connected.");
  console.log("✅ Textbook engine connected.");
  console.log("✅ Existing generator logic preserved.");
} catch (error) {
  if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  fs.copyFileSync(backupPath, enginePath);
  console.error("❌ Upgrade failed; original engine restored.");
  throw error;
}

console.log("==========================================");
console.log(" EduGen Robust Master Upgrade v2 READY");
console.log("==========================================");
