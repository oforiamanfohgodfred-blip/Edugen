const assert = require("assert");
const { validateRequest, getSubjectsForGrade } = require("./curriculumEngine");
const { generateQuestions } = require("./questionEngine");

function testCurriculum() {
  const valid = validateRequest({
    grade: "JHS1",
    subject: "Mathematics",
    topic: "Number Operations",
  });

  assert.strictEqual(valid.valid, true, "Valid JHS1 Mathematics request should pass");
  assert.deepStrictEqual(getSubjectsForGrade("JHS1"), ["Mathematics", "Integrated Science"]);

  const invalidPhysics = validateRequest({
    grade: "JHS1",
    subject: "Physics",
    topic: "Mechanics",
  });

  assert.strictEqual(invalidPhysics.valid, false, "JHS Physics must not be accepted as a standalone subject");
}

function testGeneratorContract() {
  const cases = [
    {
      name: "JHS1 Mathematics MCQ",
      request: {
        grade: "JHS1",
        subject: "Mathematics",
        topic: "Number Operations",
        level: "JHS1",
        difficulty: "Medium",
        questionType: "Multiple Choice",
        count: 5,
      },
    },
    {
      name: "JHS2 Integrated Science MCQ",
      request: {
        grade: "JHS2",
        subject: "Integrated Science",
        topic: "Energy",
        level: "JHS2",
        difficulty: "Medium",
        questionType: "Multiple Choice",
        count: 5,
      },
    },
    {
      name: "SHS1 Physics MCQ",
      request: {
        grade: "SHS1",
        subject: "Physics",
        topic: "Mechanics",
        level: "SHS1",
        difficulty: "Hard",
        questionType: "Multiple Choice",
        count: 5,
      },
    },
    {
      name: "SHS2 Chemistry Short Answer",
      request: {
        grade: "SHS2",
        subject: "Chemistry",
        topic: "Stoichiometry",
        level: "SHS2",
        difficulty: "Hard",
        questionType: "Short Answer",
        count: 5,
      },
    },
    {
      name: "SHS3 Biology True False",
      request: {
        grade: "SHS3",
        subject: "Biology",
        topic: "Ecology",
        level: "SHS3",
        difficulty: "Medium",
        questionType: "True/False",
        count: 5,
      },
    },
  ];

  for (const testCase of cases) {
    const questions = generateQuestions(testCase.request);
    assert.ok(Array.isArray(questions), `${testCase.name} must return an array`);
    assert.strictEqual(questions.length, 5, `${testCase.name} must return exactly 5 questions`);
    assert.strictEqual(new Set(questions.map((q) => q.question.trim())).size, questions.length, `${testCase.name} contains duplicate displayed questions`);
  }
}

function run() {
  testCurriculum();
  testGeneratorContract();
  console.log("EduGen engine upgrade smoke tests passed.");
}

try {
  run();
} catch (error) {
  console.error("EduGen engine upgrade smoke tests FAILED.");
  console.error(error.stack || error.message);
  process.exit(1);
}
