const { execFileSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const files = [
  path.join(__dirname, "questionEngine.js"),
  path.join(__dirname, "masterGenerationEngine.js"),
  path.join(__dirname, "curriculumEngine.js"),
  path.join(__dirname, "questionQualityEngine.js"),
  path.join(__dirname, "textbookAdapter.js"),
  path.join(__dirname, "shsPhysicsEngine.js"),
  path.join(__dirname, "integratedScienceGeneratorV2.js"),
  path.join(ROOT, "controllers", "questionController.js"),
];

for (const file of files) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}

const { generateQuestions } = require("../controllers/questionController");

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
  for (const test of cases) {
    const result = await callGenerator(test.body);
    const ok = result.status === 200 && result.payload?.success && result.payload.questions?.length === test.body.count;
    console.log(`${ok ? "PASS" : "FAIL"}: ${test.name} -> ${result.payload?.count || result.payload?.generatedCount || 0}/${test.body.count}`);
    if (!ok) {
      console.error(JSON.stringify(result.payload, null, 2));
      process.exitCode = 1;
    }
  }

  const invalid = await callGenerator({ subject: "Mathematics", topic: "Not A Real Topic", grade: "SHS1", difficulty: "Medium", questionType: "Multiple Choice", count: 5 });
  const invalidOk = invalid.status === 400 && invalid.payload?.success === false && invalid.payload?.code === "INVALID_TOPIC";
  console.log(`${invalidOk ? "PASS" : "FAIL"}: Curriculum rejection`);
  if (!invalidOk) process.exitCode = 1;

  console.log(process.exitCode ? "FINAL VERIFICATION FAILED" : "FINAL VERIFICATION PASSED");
})();
