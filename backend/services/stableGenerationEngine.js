/* EduGen stable generation facade. Textbooks are optional references. */
const crypto = require("crypto");
const legacyMath = require("./questionEngine");
const curriculum = require("./curriculumEngine");
const science = require("./integratedScienceGeneratorV2");
const physics = require("./shsPhysicsEngine");

const id = () => crypto.randomBytes(8).toString("hex");
const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = a => a[Math.floor(Math.random() * a.length)];
const clean = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function mcq(subject, grade, topic, difficulty, question, answer, distractors, family, explanation) {
  return { id: id(), subject, grade, level: grade, topic, difficulty, questionFamily: family || "application", question, options: [answer, ...distractors].sort(() => Math.random() - 0.5), answer, correctAnswer: answer, questionType: "Multiple Choice", explanation: explanation || `The correct answer is ${answer}.`, learningObjective: `Apply knowledge of ${topic}.` };
}

function fallback(subject, grade, topic, difficulty, family) {
  if (subject === "Integrated Science") {
    const a = ri(5, 40), b = ri(2, 15);
    const variants = [
      () => mcq(subject, grade, topic, difficulty, `A measurement related to ${topic} increases from ${a} by ${b}. What is the new value?`, String(a + b), [String(a - b), String(a * b), String(a + b + 2)], "calculation", `${a} + ${b} = ${a + b}.`),
      () => mcq(subject, grade, topic, difficulty, `Which method is most reliable when investigating ${topic}?`, "Control relevant variables, collect repeatable measurements and use the evidence.", ["Guess the result before collecting data.", "Change several variables at once.", "Ignore results that disagree with the hypothesis."], family || "investigation"),
      () => mcq(subject, grade, topic, difficulty, `Which statement best explains cause and effect in ${topic}?`, "A relevant change can produce a measurable change in an outcome.", ["Cause and effect cannot be tested.", "Every cause has exactly the same effect.", "Measurements are unnecessary."], "cause-effect")
    ];
    return pick(variants)();
  }
  if (subject === "Physics") {
    const u = ri(5, 30), t = ri(2, 12), d = u * t;
    return mcq(subject, grade, topic, difficulty, `An object moves at ${u} m/s for ${t} s. Assuming constant speed, what distance does it cover?`, `${d} m`, [`${u + t} m`, `${u * t + u} m`, `${Math.max(1, d - t)} m`], "calculation", `d = vt = ${u} × ${t} = ${d} m.`);
  }
  if (subject === "Chemistry") {
    const n = ri(2, 20);
    if (clean(topic).includes("atomic")) {
      const p = ri(6, 30), e = ri(Math.max(1, p - 3), p + 3), charge = p - e;
      const ans = charge > 0 ? `+${charge}` : String(charge);
      return mcq(subject, grade, topic, difficulty, `An atom has ${p} protons and ${e} electrons. What is its net charge?`, ans, [String(-charge), "0", `+${p}`], "calculation", `Net charge = ${p} − ${e} = ${ans}.`);
    }
    if (clean(topic).includes("mole") || clean(topic).includes("stoichiometry")) {
      const mass = n * 18;
      return mcq(subject, grade, topic, difficulty, `What mass corresponds to ${n} mol of a substance with molar mass 18 g/mol?`, `${mass} g`, [`${n + 18} g`, `${n * 2} g`, `${mass + 18} g`], "calculation", `m = nM = ${n} × 18 = ${mass} g.`);
    }
    if (clean(topic).includes("ph")) {
      const ph = ri(1, 13), ans = ph < 7 ? "acidic" : ph === 7 ? "neutral" : "alkaline";
      return mcq(subject, grade, topic, difficulty, `A solution has pH ${ph}. How should it be classified?`, ans, [ans === "acidic" ? "alkaline" : "acidic", "always concentrated", "always dilute"], "application");
    }
    const forms = ["Which statement best describes", "Which observation would be useful when investigating", "Which conclusion is most justified for"];
    return mcq(subject, grade, topic, difficulty, `${pick(forms)} ${topic}?`, "Use relevant chemical principles, measurements and evidence.", ["Ignore the evidence.", "Change every variable at once.", "Use an unrelated chemical principle."], family || "concept");
  }
  if (subject === "Biology") {
    if (clean(topic).includes("ecology") || clean(topic).includes("population")) {
      const a = ri(8, 50), b = ri(3, 20);
      return mcq(subject, grade, topic, difficulty, `A field survey records ${a} organisms in one group and ${b} in another. What total is recorded?`, String(a + b), [String(Math.abs(a - b)), String(a * b), String(a + b + 3)], "data-interpretation", `${a} + ${b} = ${a + b}.`);
    }
    if (clean(topic).includes("genetic") || clean(topic).includes("inheritance")) {
      const dominant = ri(20, 80), other = 100 - dominant;
      return mcq(subject, grade, topic, difficulty, `In a sample of 100 offspring, ${dominant}% show one phenotype. What percentage show the alternative phenotype?`, `${other}%`, [`${dominant}%`, `${Math.max(1, other - 10)}%`, `${Math.min(99, other + 10)}%`], "data-interpretation", `100% − ${dominant}% = ${other}%.`);
    }
    return mcq(subject, grade, topic, difficulty, `Which statement best describes an important principle in ${topic}?`, "Apply the relevant biological principles and evidence to explain the observation.", ["Ignore evidence and guess.", "Assume all organisms are identical.", "Use an unrelated biological process."], family || "concept");
  }
  return null;
}

function one(subject, grade, topic, difficulty, family) {
  if (subject === "Mathematics") {
    const result = legacyMath.generateQuestions({ subject, topic, level: grade, difficulty, questionType: "Multiple Choice", count: 1 });
    return Array.isArray(result) ? result[0] : null;
  }
  if (subject === "Integrated Science") {
    try { const q = science.generateJHSIntegratedScienceQuestion({ grade, topic, difficulty, family }); if (q) return q; } catch (_) {}
    return fallback(subject, grade, topic, difficulty, family);
  }
  if (subject === "Physics") {
    try { const q = physics.generateSHSPhysicsQuestion({ grade, topic, difficulty, family }); if (q) return q; } catch (_) {}
    return fallback(subject, grade, topic, difficulty, family);
  }
  return fallback(subject, grade, topic, difficulty, family);
}

function generateQuestions({ subject, topic, level, grade, difficulty = "Medium", count = 5 }) {
  const checked = curriculum.validateRequest({ grade: grade || level, subject, topic });
  if (!checked.valid) { const e = new Error(checked.message); e.code = checked.code; e.details = checked; throw e; }
  const requested = Math.min(Math.max(parseInt(count, 10) || 5, 1), 50);
  const result = [], seen = new Set();
  const families = ["concept", "application", "calculation", "comparison", "cause-effect", "data-interpretation", "investigation", "misconception", "expert-reasoning"];
  let attempts = 0;
  while (result.length < requested && attempts++ < Math.max(300, requested * 150)) {
    const q = one(checked.subject, checked.grade, checked.topic, difficulty, pick(families));
    if (!q || !q.question) continue;
    const key = clean(q.question);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ ...q, id: q.id || id(), subject: checked.subject, grade: checked.grade, level: checked.grade, topic: checked.topic, difficulty });
  }
  return result;
}

module.exports = { generateQuestions };
