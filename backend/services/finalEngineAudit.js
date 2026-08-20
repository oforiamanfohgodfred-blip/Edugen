/* EduGen FINAL ENGINE AUDIT */
const { generateExpertQuestion } = require("./expertQuestionEngineV2");
const curriculum = require("./curriculumEngine");
const quality = require("./questionQualityEngine");

const requested = [
  ["JHS1", "Mathematics"],
  ["JHS2", "Integrated Science"],
  ["SHS1", "Mathematics"],
  ["SHS1", "Physics"],
  ["SHS1", "Chemistry"],
  ["SHS1", "Biology"],
];

let failed = 0;
console.log("==========================================");
console.log(" EduGen FINAL ENGINE AUDIT");
console.log("==========================================");

for (const [grade, subject] of requested) {
  const topics = curriculum.getTopicsForSubject(grade, subject);
  const topic = topics[0];
  if (!topic) { console.log(`FAIL: ${grade} ${subject} has no configured topics`); failed += 1; continue; }
  const questions = [];
  const signatures = new Set();
  for (let i = 0; i < 20 && questions.length < 5; i += 1) {
    const q = generateExpertQuestion({ subject, grade, topic, variationIndex: i });
    const validation = quality.validateQuestion(q);
    const sig = quality.signature(q.question);
    if (validation.valid && !signatures.has(sig)) { signatures.add(sig); questions.push(q); }
  }
  const families = new Set(questions.map(q => q.questionFamily));
  const ok = questions.length >= 5 && families.size >= 5 && questions.every(q => Number(q.reasoningSteps) >= 4);
  console.log(`${ok ? "PASS" : "FAIL"}: ${grade} ${subject} / ${topic} -> ${questions.length} unique, ${families.size} reasoning families`);
  if (!ok) failed += 1;
}

console.log("------------------------------------------");
console.log(failed ? `FINAL AUDIT FAILED: ${failed} case(s)` : "FINAL AUDIT PASSED");
process.exitCode = failed ? 1 : 0;
