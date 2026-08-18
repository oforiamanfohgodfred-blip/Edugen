const { execFileSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
// Verify only files on the LIVE generation path.
// masterGenerationEngine.js is an obsolete experimental path and is intentionally
// excluded because questionController no longer imports it.
const files = [
  path.join(__dirname, "questionEngine.js"),
  path.join(__dirname, "curriculumEngine.js"),
  path.join(__dirname, "questionQualityEngine.js"),
  path.join(__dirname, "textbookAdapter.js"),
  path.join(__dirname, "stableGenerationEngine.js"),
  path.join(__dirname, "shsPhysicsEngine.js"),
  path.join(__dirname, "integratedScienceGeneratorV2.js"),
  path.join(ROOT, "controllers", "questionController.js"),
];

for (const file of files) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}

const { generateQuestions } = require("../controllers/questionController");
const { loadTextbook } = require("./textbookAdapter");

function callGenerator(body) {
  return new Promise((resolve, reject) => {
    const req = { body };
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(payload) { resolve({ status: this.statusCode, payload }); return this; },
    };
    Promise.resolve(generateQuestions(req, res)).catch(reject);
  });
}

const cases = [
  { name: "JHS Mathematics", body: { subject: "Mathematics", topic: "Fractions", grade: "JHS1", difficulty: "Medium", questionType: "Multiple Choice", count: 5 } },
  { name: "JHS Integrated Science", body: { subject: "Integrated Science", topic: "Electricity", grade: "JHS2", difficulty: "Hard", questionType: "Short Answer", count: 5 } },
  { name: "SHS Mathematics", body: { subject: "Mathematics", topic: "Quadratic Equations", grade: "SHS2", difficulty: "Expert", questionType: "Problem Solving", count: 5 } },
  { name: "SHS Physics", body: { subject: "Physics", topic: "Kinematics", grade: "SHS1", difficulty: "Expert", questionType: "Mixed", count: 8 } },
  { name: "SHS Chemistry", body: { subject: "Chemistry", topic: "Atomic Structure", grade: "SHS1", difficulty: "Hard", questionType: "Multiple Choice", count: 5 } },
  { name: "SHS Biology", body: { subject: "Biology", topic: "Ecology", grade: "SHS1", difficulty: "Hard", questionType: "Word Problem", count: 5 } },
];

(async () => {
  console.log("==========================================");
  console.log(" EduGen FINAL ENGINE VERIFICATION");
  console.log("==========================================");

  let failed = false;

  try {
    const book = loadTextbook("SHS1", "Physics");
    console.log(`Textbook adapter: ${book && typeof book.loaded === "boolean" ? "PASS" : "FAIL"}`);
    if (!book || typeof book.loaded !== "boolean") failed = true;
  } catch (error) {
    console.error("Textbook adapter: FAIL", error.message);
    failed = true;
  }

  for (const test of cases) {
    try {
      const result = await callGenerator(test.body);
      const generated = result.payload?.questions?.length || result.payload?.generatedCount || result.payload?.count || 0;
      const ok = result.status === 200 && result.payload?.success && generated === test.body.count;
      console.log(`${ok ? "PASS" : "FAIL"}: ${test.name} -> ${generated}/${test.body.count}`);
      if (!ok) {
        failed = true;
        console.error(JSON.stringify(result.payload, null, 2));
      }
    } catch (error) {
      failed = true;
      console.error(`FAIL: ${test.name} -> ${error.message}`);
    }
  }

  try {
    const invalid = await callGenerator({ subject: "Mathematics", topic: "Not A Real Topic", grade: "SHS1", difficulty: "Medium", questionType: "Multiple Choice", count: 5 });
    const invalidOk = invalid.status === 400 && invalid.payload?.success === false && invalid.payload?.code === "INVALID_TOPIC";
    console.log(`${invalidOk ? "PASS" : "FAIL"}: Curriculum rejection`);
    if (!invalidOk) failed = true;
  } catch (error) {
    failed = true;
    console.error("FAIL: Curriculum rejection ->", error.message);
  }

  console.log(failed ? "FINAL VERIFICATION FAILED" : "FINAL VERIFICATION PASSED");
  process.exitCode = failed ? 1 : 0;
})();
