const assert = require("assert");
const { generateQuestions } = require("./masterGenerationEngine");
const { validateRequest, getSubjectsForGrade } = require("./curriculumEngine");

const cases = [
  ["JHS1", "Mathematics", "Number Operations"],
  ["JHS2", "Mathematics", "Variables and Equations"],
  ["JHS3", "Mathematics", "Data"],
  ["JHS1", "Integrated Science", "Matter"],
  ["JHS2", "Integrated Science", "Energy"],
  ["JHS3", "Integrated Science", "Ecology"],
  ["SHS1", "Mathematics", "Real Number System"],
  ["SHS2", "Mathematics", "Geometry Around Us"],
  ["SHS3", "Mathematics", "Probability/Chance"],
  ["SHS1", "Physics", "Mechanics"],
  ["SHS2", "Physics", "Electricity"],
  ["SHS3", "Physics", "Waves"],
  ["SHS1", "Chemistry", "Atomic Structure"],
  ["SHS2", "Chemistry", "Stoichiometry"],
  ["SHS3", "Chemistry", "Acids and Bases"],
  ["SHS1", "Biology", "Cell Structure and Functions"],
  ["SHS2", "Biology", "Ecology"],
  ["SHS3", "Biology", "Mammalian Systems"],
];

const types = ["Multiple Choice", "True / False", "Short Answer", "Fill in the Blank", "Problem Solving", "Word Problems"];

for (const [grade, subject, topic] of cases) {
  const valid = validateRequest({ grade, subject, topic });
  assert.strictEqual(valid.valid, true, `${grade} ${subject} ${topic} must be curriculum-valid`);

  for (const questionType of types) {
    const questions = generateQuestions({ grade, subject, topic, difficulty: "Medium", questionType, count: 5 });
    assert.strictEqual(questions.length, 5, `${grade} ${subject} ${topic} ${questionType} must return 5 questions`);
    assert.strictEqual(new Set(questions.map((q) => q.question)).size, 5, `${grade} ${subject} ${topic} ${questionType} has duplicates`);
    assert.ok(questions.every((q) => q.questionType === (questionType === "True / False" ? "True / False" : questionType)), `${grade} ${subject} returned the wrong question type`);
  }
}

const invalidUniversity = validateRequest({ grade: "University", subject: "Mathematics", topic: "Algebra" });
assert.strictEqual(invalidUniversity.valid, false, "University must be rejected");
assert.deepStrictEqual(getSubjectsForGrade("JHS1"), ["Mathematics", "Integrated Science"]);

console.log("Master EduGen audit matrix passed.");
