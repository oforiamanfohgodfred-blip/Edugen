const baseEngine = require("./questionEngine");
const { validateQuestion, transformQuestion, makeMixedType, signature } = require("./questionQualityEngine");

const MAX_REQUESTED = 50;

function normalizeType(value) {
  const v = String(value || "Multiple Choice").trim().toLowerCase();
  if (v === "mixed") return "Mixed";
  if (v === "short answer" || v === "short-answer" || v === "shortanswer") return "Short Answer";
  if (v === "problem solving" || v === "problem-solving") return "Problem Solving";
  if (v === "word problem" || v === "word-problem") return "Word Problem";
  if (v === "true/false" || v === "true false") return "True/False";
  return "Multiple Choice";
}

function prepareQuestion(question, type, index) {
  const requested = normalizeType(type);
  const finalType = requested === "Mixed" ? makeMixedType(index) : requested;
  return transformQuestion(question, finalType);
}

async function generateQuestions(options = {}) {
  const requested = Math.max(1, Math.min(MAX_REQUESTED, Number(options.count ?? options.questionCount ?? 10) || 10));
  const type = normalizeType(options.questionType || options.type);
  const seen = new Set();
  const output = [];
  let attempts = 0;
  const maxAttempts = Math.max(requested * 8, 40);

  while (output.length < requested && attempts < maxAttempts) {
    attempts += 1;
    const remaining = requested - output.length;
    const batch = Math.min(remaining, 10);
    const request = { ...options, count: batch, questionCount: batch };
    let generated;
    try {
      generated = await Promise.resolve(baseEngine.generateQuestions(request));
    } catch (error) {
      if (attempts >= maxAttempts) throw error;
      continue;
    }

    if (!Array.isArray(generated)) generated = [];
    for (const raw of generated) {
      if (output.length >= requested) break;
      const question = prepareQuestion(raw, type, output.length);
      const validation = validateQuestion(question);
      if (!validation.valid) continue;
      const key = signature(question.question);
      if (seen.has(key)) continue;
      seen.add(key);
      output.push(question);
    }
  }

  if (output.length < requested) {
    const error = new Error(`Unable to generate the requested ${requested} unique questions. Generated ${output.length}.`);
    error.code = "QUESTION_COUNT_NOT_REACHED";
    error.generated = output.length;
    error.requested = requested;
    throw error;
  }

  return output;
}

module.exports = {
  generateQuestions,
  MAX_REQUESTED,
  normalizeType,
};
