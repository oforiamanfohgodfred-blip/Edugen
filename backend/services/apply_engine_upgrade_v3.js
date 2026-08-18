const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const dir = __dirname;
const engine = path.join(dir, "questionEngine.js");
const backup = path.join(dir, `questionEngine.before-v3-${Date.now()}.js`);
const temp = path.join(dir, `questionEngine.v3-temp-${Date.now()}.js`);

function findFunctionBody(source, marker) {
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Could not locate ${marker}`);
  let paren = 0;
  let bodyStart = -1;
  for (let i = start; i < source.length; i++) {
    if (source[i] === "(") paren++;
    else if (source[i] === ")") paren--;
    else if (source[i] === "{" && paren === 0) { bodyStart = i; break; }
  }
  if (bodyStart < 0) throw new Error(`Could not locate body for ${marker}`);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = bodyStart; i < source.length; i++) {
    const c = source[i];
    if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = null; continue; }
    if (c === "'" || c === '"' || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return [start, i + 1]; }
  }
  throw new Error(`Could not locate closing brace for ${marker}`);
}

function replaceFunction(source, marker, replacement) {
  const range = findFunctionBody(source, marker);
  return source.slice(0, range[0]) + replacement + source.slice(range[1]);
}

const replacement = `function generateQuestions({ subject, topic, level, grade, difficulty, questionType, count }) {
  const requestedCount = Math.min(Math.max(Number.parseInt(count, 10) || 5, 1), 50);
  const normalizedGrade = normalizeGrade(grade || level);
  const normalizedSubject = normalizeSubject(subject);
  const validation = validateRequest({ grade: normalizedGrade, subject: normalizedSubject, topic });
  if (!validation.valid) throw new Error(validation.message || "Invalid curriculum request.");
  const results = [];
  const seen = new Set();
  const maxAttempts = Math.max(1500, requestedCount * 400);
  let attempts = 0;
  let textbook = { available: false, grounded: false, learningObjectives: [] };
  try { textbook = getKnowledgeContext({ grade: normalizedGrade, subject: normalizedSubject, topic }); } catch (_) {}
  while (results.length < requestedCount && attempts < maxAttempts) {
    attempts++;
    let q;
    try { q = normalizedSubject === "Mathematics" ? generateMath(topic, difficulty, normalizedGrade) : generateScience(normalizedSubject, topic, difficulty, normalizedGrade); } catch (_) { continue; }
    if (!q) continue;
    const type = String(questionType || "Multiple Choice");
    q = type.toLowerCase() === "mixed" ? transformQuestion(q, makeMixedType(results.length)) : transformQuestion(q, type);
    q = { ...q, id: makeId(), subject: normalizedSubject, grade: normalizedGrade, level: normalizedGrade, difficulty, topic: q.topic || topic, textbookAvailable: Boolean(textbook.available), textbookGrounded: Boolean(textbook.grounded) };
    if (textbook.learningObjectives?.length) q.learningObjective = textbook.learningObjectives[0];
    const check = validateQuestion(q);
    if (!check.valid) continue;
    const sig = signature(q.question);
    if (seen.has(sig)) continue;
    seen.add(sig);
    results.push(q);
  }
  if (results.length !== requestedCount) throw new Error("Unable to generate the requested " + requestedCount + " unique questions for " + normalizedGrade + " " + normalizedSubject + " / " + topic + ". Generated " + results.length + ".");
  return results;
}`;

function main() {
  if (!fs.existsSync(engine)) throw new Error("questionEngine.js not found");
  for (const file of ["curriculumEngine.js", "questionQualityEngine.js", "topicRouter.js", "textbookAdapter.js"]) if (!fs.existsSync(path.join(dir, file))) throw new Error(`${file} not found`);
  const original = fs.readFileSync(engine, "utf8");
  fs.writeFileSync(backup, original, "utf8");
  try {
    let source = original;
    const requires = [
      'const { validateRequest, normalizeGrade, normalizeSubject } = require("./curriculumEngine");',
      'const { validateQuestion, transformQuestion, makeMixedType, signature } = require("./questionQualityEngine");',
      'const { getKnowledgeContext } = require("./textbookAdapter");'
    ];
    for (const statement of requires) if (!source.includes(statement)) source = statement + "\n" + source;
    source = replaceFunction(source, "function generateQuestions(", replacement);
    fs.writeFileSync(temp, source, "utf8");
    cp.execFileSync(process.execPath, ["--check", temp], { stdio: "inherit" });
    fs.renameSync(temp, engine);
    console.log("==========================================");
    console.log(" EduGen FINAL ENGINE UPGRADE V3");
    console.log("==========================================");
    console.log("Curriculum: JHS1-JHS3 + SHS1-SHS3");
    console.log("Question types: MCQ + Short Answer + Problem Solving + Word Problem + Mixed");
    console.log("Quality validation: ENABLED");
    console.log("Textbook adapter: ENABLED");
    console.log("Requested count: UP TO 50");
    console.log("Syntax check: PASSED");
    console.log("FINAL ENGINE UPGRADE COMPLETE");
  } catch (error) {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
    fs.writeFileSync(engine, original, "utf8");
    console.error("V3 upgrade failed:", error.message);
    console.error("Original engine restored.");
    process.exitCode = 1;
  }
}
main();
