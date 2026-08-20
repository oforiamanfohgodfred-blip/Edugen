/*
  EduGen FINAL ENGINE AUDIT
  Run from backend:
    node services/finalEngineAudit.js

  This is a diagnostic only. It does not modify generation state.
*/
const { generateExpertQuestion } = require("./expertQuestionEngineV2");
const curriculum = require("./curriculumEngine");
const quality = require("./questionQualityEngine");

const cases = [
  ["JHS1", "Mathematics", "Real Numbers"],
  ["JHS2", "Integrated Science", "Cells"],
  ["SHS1", "Mathematics", "Real Numbers"],
  ["SHS1", "Physics", "Mechanics"],
  ["SHS1", "Chemistry", "Atomic Structure"],
  ["SHS1", "Biology", "Cell Structure and Function"],
];

let failed = 0;
console.log("==========================================");
console.log(" EduGen FINAL ENGINE AUDIT");
console.log("==========================================");

for (const [grade, subject, topic] of cases) {
  const check = curriculum.validateRequest({ grade, subject, topic });
  if (!check.valid) {
    console.log(`SKIP: ${grade} ${subject} / ${topic} -> ${check.message}`);
    continue;
  }

  const questions = [];
  const signatures = new Set();
  for (let i = 0; i < 12; i += 1) {
    const q = generateExpertQuestion({ subject, grade, topic, variationIndex: i });
    const validation = quality.validateQuestion(q);
    const sig = quality.signature(q.question);
    if (validation.valid && !signatures.has(sig)) {
      signatures.add(sig);
      questions.push(q);
    }
  }

  const uniqueFamilies = new Set(questions.map(q => q.questionFamily));
  const ok = questions.length >= 5 && uniqueFamilies.size >= Math.min(3, questions.length) && questions.every(q => Number(q.reasoningSteps) >= 4);
  console.log(`${ok ? "PASS" : "FAIL"}: ${grade} ${subject} / ${topic} -> ${questions.length} unique, ${uniqueFamilies.size} reasoning families`);
  if (!ok) failed += 1;
}

console.log("------------------------------------------");
console.log(failed ? `FINAL AUDIT FAILED: ${failed} case(s)` : "FINAL AUDIT PASSED");
process.exitCode = failed ? 1 : 0;
