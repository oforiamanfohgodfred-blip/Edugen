/* =========================================================
   EduGen Question Quality + Type Engine
   ---------------------------------------------------------
   Converts generated base questions into reliable output types,
   creates dynamic distractors, validates answers, and provides
   duplicate signatures.
========================================================= */

function clean(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalized(value) {
  return clean(value).toLowerCase();
}

function numeric(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = clean(value).replace(/,/g, "");
  const match = text.match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/i);
  return match ? Number(match[0]) : NaN;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return String(value);
  if (Number.isInteger(value)) return String(value);
  return String(Number(value.toFixed(4)));
}

function unique(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const key = normalized(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(String(value));
  }
  return result;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function numericDistractors(answer, difficulty = "Medium") {
  const n = numeric(answer);
  if (!Number.isFinite(n)) return [];

  const magnitude = Math.max(1, Math.abs(n));
  const near = Math.max(1, Math.round(magnitude * 0.05));
  const candidates = [
    n + randomInt(-near, near),
    n - 1,
    n + 1,
    -n,
    n * 2,
    n / 2,
    n * 10,
    n / 10,
  ];

  if (difficulty === "Hard" || difficulty === "Expert") {
    candidates.push(n * 0.75, n * 1.25, n + near * 2, n - near * 2);
  }

  return unique(candidates.map(formatNumber)).filter(
    (value) => normalized(value) !== normalized(formatNumber(n))
  );
}

function conceptDistractors(question) {
  const options = Array.isArray(question.options) ? question.options : [];
  const answer = clean(question.answer);
  return unique(options).filter((option) => normalized(option) !== normalized(answer));
}

function ensureMultipleChoice(question, difficulty = "Medium") {
  const answer = clean(question.answer);
  let distractors = conceptDistractors(question);

  if (distractors.length < 3) {
    distractors = unique([...distractors, ...numericDistractors(answer, difficulty)]);
  }

  if (distractors.length < 3) {
    const fallback = [
      "None of the above",
      "Cannot be determined from the information given",
      "The opposite result",
      "The intermediate result",
    ];
    distractors = unique([...distractors, ...fallback]);
  }

  const options = shuffle(unique([answer, ...distractors]).slice(0, 4));

  if (!options.some((option) => normalized(option) === normalized(answer))) {
    options[0] = answer;
  }

  return {
    ...question,
    options,
    answer,
    questionType: "Multiple Choice",
  };
}

function toShortAnswer(question) {
  return {
    ...question,
    options: [],
    question: `${question.question}\n\nGive your final answer.`,
    questionType: "Short Answer",
  };
}

function toProblemSolving(question) {
  return {
    ...question,
    options: [],
    question: `PROBLEM SOLVING\n\n${question.question}\n\nSolve the problem carefully. Show your working where appropriate.\n\nFINAL ANSWER: Enter only your final answer.`,
    questionType: "Problem Solving",
  };
}

function toWordProblem(question) {
  const scenarios = [
    "A student is applying this concept to a real-life situation:",
    "A school laboratory records the following situation:",
    "A teacher gives a learner the following practical problem:",
    "A technician is analysing the following situation:",
    "A community project produces the following situation:",
  ];

  return {
    ...question,
    options: [],
    question: `${scenarios[Math.floor(Math.random() * scenarios.length)]}\n\n${question.question}\n\nDetermine the required answer and state the method used.`,
    questionType: "Word Problem",
  };
}

function chooseMixedType() {
  return ["Multiple Choice", "Short Answer", "Problem Solving", "Word Problem"][Math.floor(Math.random() * 4)];
}

function normalizeQuestionType(type) {
  const value = normalized(type);
  if (!value || value === "mcq" || value.includes("multiple choice")) return "Multiple Choice";
  if (value.includes("short")) return "Short Answer";
  if (value.includes("problem") && !value.includes("word")) return "Problem Solving";
  if (value.includes("word")) return "Word Problem";
  if (value.includes("true") || value.includes("false")) return "True / False";
  if (value.includes("mixed")) return "Mixed";
  return "Multiple Choice";
}

function transformQuestion(question, type, difficulty = "Medium") {
  const normalizedType = normalizeQuestionType(type);
  if (normalizedType === "Mixed") return transformQuestion(question, chooseMixedType(), difficulty);
  if (normalizedType === "Short Answer") return toShortAnswer(question);
  if (normalizedType === "Problem Solving") return toProblemSolving(question);
  if (normalizedType === "Word Problem") return toWordProblem(question);
  if (normalizedType === "True / False") {
    const mcq = ensureMultipleChoice(question, difficulty);
    const wrong = mcq.options.find((option) => normalized(option) !== normalized(mcq.answer));
    const makeTrue = Math.random() > 0.5;
    return {
      ...mcq,
      options: ["True", "False"],
      question: `True or False?\n\n${question.question}\n\nThe answer is ${makeTrue ? mcq.answer : wrong}.`,
      answer: makeTrue ? "True" : "False",
      questionType: "True / False",
    };
  }
  return ensureMultipleChoice(question, difficulty);
}

function validateQuestion(question) {
  if (!question || typeof question !== "object") return { valid: false, reason: "empty" };
  if (!clean(question.question)) return { valid: false, reason: "missing_question" };
  if (question.answer === undefined || question.answer === null || !clean(question.answer)) {
    return { valid: false, reason: "missing_answer" };
  }

  const type = normalizeQuestionType(question.questionType);
  if (type === "Multiple Choice") {
    if (!Array.isArray(question.options) || question.options.length < 4) return { valid: false, reason: "insufficient_options" };
    if (!question.options.some((option) => normalized(option) === normalized(question.answer))) {
      return { valid: false, reason: "answer_not_in_options" };
    }
  }

  return { valid: true };
}

function questionSignature(question) {
  return normalized(`${question.subject || ""}|${question.topic || ""}|${question.question || ""}|${question.answer || ""}`)
    .replace(/[^a-z0-9|.-]/g, "")
    .slice(0, 1200);
}

module.exports = {
  normalizeQuestionType,
  transformQuestion,
  validateQuestion,
  questionSignature,
};
