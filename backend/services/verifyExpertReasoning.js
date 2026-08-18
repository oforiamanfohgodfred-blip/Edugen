const cp = require("child_process");
const path = require("path");
const fs = require("fs");

const enginePath = path.join(__dirname, "masterGenerationEngine.js");
cp.execFileSync(process.execPath, ["--check", enginePath], { stdio: "inherit" });

const { generateQuestions } = require("./masterGenerationEngine");

const tests = [
  ["JHS1", "Mathematics", "Real Numbers"],
  ["JHS2", "Integrated Science", "Matter and Measurement"],
  ["SHS1", "Physics", "Mechanics"],
  ["SHS1", "Chemistry", "Atomic Structure"],
  ["SHS1", "Biology", "Cell Structure and Function"],
];

let failed = false;
for (const [grade, subject, topic] of tests) {
  try {
    const questions = generateQuestions({ grade, subject, topic, difficulty: "Expert", questionType: "Multiple Choice", count: 3 });
    const valid = questions.length === 3 && questions.every((q) =>
      q.difficulty === "Expert" &&
      q.expertReasoning === true &&
      q.reasoningSteps >= 3 &&
      q.questionFamily.startsWith("expert-") &&
      q.question.length > 220 &&
      q.options.length === 4 &&
      q.options.includes(q.answer)
    );
    console.log(`${valid ? "PASS" : "FAIL"}: ${grade} ${subject} -> ${questions.length}/3 expert questions`);
    if (!valid) {
      console.log(JSON.stringify(questions[0], null, 2));
      failed = true;
    }
  } catch (error) {
    console.log(`FAIL: ${grade} ${subject} -> ${error.message}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log("EXPERT REASONING VERIFICATION PASSED");
