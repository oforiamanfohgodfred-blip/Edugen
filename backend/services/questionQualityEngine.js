const crypto = require("crypto");

function normalize(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function signature(question) {
  return crypto.createHash("sha1").update(normalize(question)).digest("hex");
}

function validateQuestion(q) {
  if (!q || typeof q !== "object") return { valid: false, reason: "empty" };
  if (!normalize(q.question)) return { valid: false, reason: "missing question" };
  if (q.answer === undefined || q.answer === null || q.answer === "") return { valid: false, reason: "missing answer" };
  if (q.questionType === "Multiple Choice") {
    if (!Array.isArray(q.options) || q.options.length < 4) return { valid: false, reason: "MCQ needs four options" };
    if (!q.options.some(x => normalize(x) === normalize(q.answer))) return { valid: false, reason: "answer not in options" };
  }
  return { valid: true };
}

function transformQuestion(q, requestedType) {
  const type = String(requestedType || "Multiple Choice").toLowerCase();
  if (type === "short answer" || type === "short-answer" || type === "shortanswer") {
    return { ...q, questionType: "Short Answer", options: [] };
  }
  if (type === "problem solving" || type === "problem-solving") {
    return { ...q, questionType: "Problem Solving", options: [] };
  }
  if (type === "word problem" || type === "word-problem") {
    return { ...q, questionType: "Word Problem", options: [] };
  }
  if (type === "true/false" || type === "true false") {
    const answer = /^(true|false)$/i.test(String(q.answer)) ? q.answer : "True";
    return { ...q, questionType: "True/False", options: ["True", "False"], answer };
  }
  return { ...q, questionType: "Multiple Choice" };
}

function makeMixedType(index) {
  return ["Multiple Choice", "Short Answer", "Problem Solving", "Word Problem"][index % 4];
}

module.exports = { normalize, signature, validateQuestion, transformQuestion, makeMixedType };
