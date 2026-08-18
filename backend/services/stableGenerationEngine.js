/* EduGen stable generation facade.
   Textbooks are optional references. Generation must remain independent of books. */
const crypto = require("crypto");
const curriculum = require("./curriculumEngine");
const science = require("./integratedScienceGeneratorV2");
const physics = require("./shsPhysicsEngine");

const id = () => crypto.randomBytes(8).toString("hex");
const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clean = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const fmt = (n) => Number.isInteger(n) ? String(n) : Number(n.toFixed(2)).toString();

function mcq(subject, grade, topic, difficulty, question, answer, distractors, family, explanation) {
  return {
    id: id(), subject, grade, level: grade, topic, difficulty,
    questionFamily: family || "application", question,
    options: [answer, ...distractors].filter((v, i, a) => a.indexOf(v) === i).sort(() => Math.random() - 0.5),
    answer, correctAnswer: answer, questionType: "Multiple Choice",
    explanation: explanation || `The correct answer is ${answer}.`,
    learningObjective: `Apply knowledge of ${topic}.`,
  };
}

function mathFallback(grade, topic, difficulty, family) {
  const t = clean(topic);
  if (t.includes("percentage") || t.includes("financial")) {
    const base = ri(80, 900), pct = ri(5, 35), value = base * pct / 100;
    return mcq("Mathematics", grade, topic, difficulty, `A quantity is ${base}. What is ${pct}% of it?`, fmt(value), [fmt(base + value), fmt(base - pct), fmt(value + pct)], "calculation", `${pct}/100 × ${base} = ${fmt(value)}.`);
  }
  if (t.includes("ratio") || t.includes("proportion")) {
    const a = ri(2, 9), b = ri(3, 12), k = ri(3, 15), x = b * k / a;
    return mcq("Mathematics", grade, topic, difficulty, `Two quantities are in the ratio ${a}:${b}. If the first quantity is ${k * a}, what is the second?`, String(k * b), [String(k * a), String(b + k), String(k * a + b)], "ratio-application", `${a}:${b} scales by ${k}, so the second quantity is ${k} × ${b} = ${k * b}.`);
  }
  if (t.includes("probability")) {
    const total = ri(8, 30), favorable = ri(1, total - 1);
    return mcq("Mathematics", grade, topic, difficulty, `A random selection has ${favorable} favourable outcomes out of ${total} equally likely outcomes. What is the probability of success?`, `${favorable}/${total}`, [`${total}/${favorable}`, `${favorable + 1}/${total}`, `${favorable}/${total + 1}`], "probability", `Probability = favourable outcomes / total outcomes = ${favorable}/${total}.`);
  }
  if (t.includes("statistics") || t.includes("data")) {
    const nums = [ri(4, 20), ri(4, 20), ri(4, 20), ri(4, 20), ri(4, 20)];
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    return mcq("Mathematics", grade, topic, difficulty, `The values are ${nums.join(", ")}. What is their mean?`, fmt(mean), [fmt(mean + 1), fmt(mean - 1), fmt(nums[0])], "data-interpretation", `Add the five values and divide by 5: ${fmt(mean)}.`);
  }
  if (t.includes("quadratic")) {
    const r1 = ri(-9, 9), r2 = ri(-9, 9), b = -(r1 + r2), c = r1 * r2;
    return mcq("Mathematics", grade, topic, difficulty, `For x² ${b >= 0 ? "+" : "−"} ${Math.abs(b)}x ${c >= 0 ? "+" : "−"} ${Math.abs(c)} = 0, what is the sum of the roots?`, String(r1 + r2), [String(r1 * r2), String(Math.abs(r1 - r2)), String(-(r1 * r2))], "quadratic-reasoning", `For x² + bx + c = 0, the sum of roots is −b = ${r1 + r2}.`);
  }
  if (t.includes("linear") || t.includes("algebra") || t.includes("equation")) {
    const x = ri(-20, 40), a = ri(2, 12), b = ri(-20, 30), rhs = a * x + b;
    return mcq("Mathematics", grade, topic, difficulty, `Solve ${a}x ${b >= 0 ? "+" : "−"} ${Math.abs(b)} = ${rhs}.`, String(x), [String(x + 1), String(x - 1), String(-x)], "algebra", `Subtract ${b} and divide by ${a}: x = ${x}.`);
  }
  if (t.includes("sequence") || t.includes("series") || t.includes("pattern")) {
    const first = ri(2, 20), d = ri(2, 12), n = ri(5, 18), ans = first + (n - 1) * d;
    return mcq("Mathematics", grade, topic, difficulty, `An arithmetic sequence starts at ${first} and increases by ${d}. What is its ${n}th term?`, String(ans), [String(ans + d), String(ans - d), String(first + n * d)], "sequence", `aₙ = a + (n−1)d = ${first} + (${n}−1)×${d} = ${ans}.`);
  }
  if (t.includes("indices") || t.includes("surds") || t.includes("logarithm")) {
    const a = ri(2, 6), n = ri(2, 5), ans = Math.pow(a, n);
    return mcq("Mathematics", grade, topic, difficulty, `Evaluate ${a}^${n}.`, String(ans), [String(a * n), String(ans + a), String(Math.max(1, ans - a))], "indices", `${a}^${n} = ${ans}.`);
  }
  if (t.includes("geometry") || t.includes("angle") || t.includes("shape") || t.includes("mensuration") || t.includes("area") || t.includes("volume")) {
    const length = ri(4, 30), width = ri(3, 20), area = length * width;
    return mcq("Mathematics", grade, topic, difficulty, `A rectangle has length ${length} cm and width ${width} cm. What is its area?`, `${area} cm²`, [`${2 * (length + width)} cm`, `${length + width} cm²`, `${area + width} cm²`], "geometry", `Area = length × width = ${length} × ${width} = ${area} cm².`);
  }
  if (t.includes("vector") || t.includes("coordinate")) {
    const x1 = ri(-10, 10), y1 = ri(-10, 10), x2 = ri(-10, 10), y2 = ri(-10, 10);
    return mcq("Mathematics", grade, topic, difficulty, `Point A is (${x1}, ${y1}) and point B is (${x2}, ${y2}). What is the change in x-coordinate from A to B?`, String(x2 - x1), [String(x1 - x2), String(x2 + x1), String(y2 - y1)], "coordinate-application");
  }
  const a = ri(3, 80), b = ri(2, 40), ans = a + b;
  return mcq("Mathematics", grade, topic, difficulty, `A quantity related to ${topic} is ${a}. It changes by ${b}. What is the resulting value?`, String(ans), [String(a - b), String(a * b), String(ans + b)], family || "application", `${a} + ${b} = ${ans}.`);
}

function fallback(subject, grade, topic, difficulty, family) {
  if (subject === "Mathematics") return mathFallback(grade, topic, difficulty, family);
  if (subject === "Integrated Science") {
    const a = ri(5, 40), b = ri(2, 15);
    return mcq(subject, grade, topic, difficulty, `A measurement related to ${topic} changes from ${a} by ${b}. What is the new value?`, String(a + b), [String(a - b), String(a * b), String(a + b + 2)], "calculation", `${a} + ${b} = ${a + b}.`);
  }
  if (subject === "Physics") {
    const u = ri(5, 30), time = ri(2, 12), distance = u * time;
    return mcq(subject, grade, topic, difficulty, `An object moves at ${u} m/s for ${time} s. Assuming constant speed, what distance does it cover?`, `${distance} m`, [`${u + time} m`, `${distance + u} m`, `${Math.max(1, distance - time)} m`], "calculation", `d = vt = ${u} × ${time} = ${distance} m.`);
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
    const ph = ri(1, 13), ans = ph < 7 ? "acidic" : ph === 7 ? "neutral" : "alkaline";
    return mcq(subject, grade, topic, difficulty, `A solution related to ${topic} has pH ${ph}. How should it be classified?`, ans, [ans === "acidic" ? "alkaline" : "acidic", "always concentrated", "always dilute"], "application");
  }
  if (subject === "Biology") {
    const a = ri(8, 50), b = ri(3, 20);
    return mcq(subject, grade, topic, difficulty, `A field observation related to ${topic} records ${a} organisms in one group and ${b} in another. What total is recorded?`, String(a + b), [String(Math.abs(a - b)), String(a * b), String(a + b + 3)], "data-interpretation", `${a} + ${b} = ${a + b}.`);
  }
  return null;
}

function one(subject, grade, topic, difficulty, family) {
  if (subject === "Integrated Science") {
    try { const q = science.generateJHSIntegratedScienceQuestion({ grade, topic, difficulty, family }); if (q) return q; } catch (_) {}
  }
  if (subject === "Physics") {
    try { const q = physics.generateSHSPhysicsQuestion({ grade, topic, difficulty, family }); if (q) return q; } catch (_) {}
  }
  return fallback(subject, grade, topic, difficulty, family);
}

function generateQuestions({ subject, topic, level, grade, difficulty = "Medium", count = 5 }) {
  const checked = curriculum.validateRequest({ grade: grade || level, subject, topic });
  if (!checked.valid) {
    const e = new Error(checked.message);
    e.code = checked.code;
    e.details = checked;
    throw e;
  }
  const requested = Math.min(Math.max(parseInt(count, 10) || 5, 1), 50);
  const result = [];
  const seen = new Set();
  const families = ["concept", "application", "calculation", "comparison", "cause-effect", "data-interpretation", "investigation", "misconception", "expert-reasoning"];
  let attempts = 0;
  while (result.length < requested && attempts++ < Math.max(1000, requested * 300)) {
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
