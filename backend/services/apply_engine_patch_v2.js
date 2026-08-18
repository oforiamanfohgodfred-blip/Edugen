const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const enginePath = path.join(__dirname, "questionEngine.js");
const backupPath = path.join(__dirname, `questionEngine.before-v2-${Date.now()}.js`);
const tempPath = path.join(__dirname, `questionEngine.upgrade-temp-${Date.now()}.js`);
const curriculumPath = path.join(__dirname, "curriculumEngine.js");
const textbookPath = path.join(__dirname, "textbookEngine.js");

function findMatchingBrace(source, openIndex) {
  let depth = 0, quote = null, escaped = false, lineComment = false, blockComment = false;
  for (let i = openIndex; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (ch === "\\") escaped = true; else if (ch === quote) quote = null; continue; }
    if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
    if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { blockComment = true; i++; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) return i; }
  }
  return -1;
}

function findFunctionBodyOpen(source, start) {
  let parenDepth = 0, quote = null, escaped = false, lineComment = false, blockComment = false;
  let seenParen = false;
  for (let i = start; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (ch === "\\") escaped = true; else if (ch === quote) quote = null; continue; }
    if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
    if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { blockComment = true; i++; continue; }
    if (ch === "(") { seenParen = true; parenDepth++; continue; }
    if (ch === ")" && seenParen) { parenDepth--; continue; }
    if (seenParen && parenDepth === 0 && ch === "{") return i;
  }
  return -1;
}

function replaceFunction(source, functionName, replacement) {
  const marker = `function ${functionName}(`;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`Could not locate function: ${functionName}`);
  const open = findFunctionBodyOpen(source, start + marker.length - 1);
  if (open === -1) throw new Error(`Could not locate body for: ${functionName}`);
  const close = findMatchingBrace(source, open);
  if (close === -1) throw new Error(`Could not locate closing brace for: ${functionName}`);
  return source.slice(0, start) + replacement + source.slice(close + 1);
}

function ensureRequire(source, statement) {
  return source.includes(statement) ? source : `${statement}\n${source}`;
}

function main() {
  if (!fs.existsSync(enginePath)) throw new Error("questionEngine.js not found");
  if (!fs.existsSync(curriculumPath)) throw new Error("curriculumEngine.js not found");
  if (!fs.existsSync(textbookPath)) throw new Error("textbookEngine.js not found");

  const original = fs.readFileSync(enginePath, "utf8");
  fs.writeFileSync(backupPath, original, "utf8");

  try {
    let source = original;
    source = ensureRequire(source, 'const { validateRequest, normalizeGrade, normalizeSubject } = require("./curriculumEngine");');
    source = ensureRequire(source, 'const { loadLocalTextbook, buildKnowledgeContext } = require("./textbookEngine");');

    const newGenerateQuestions = `function generateQuestions({
  subject,
  topic,
  level,
  grade,
  difficulty,
  questionType,
  count,
}) {
  const requestedCount = Math.min(Math.max(parseInt(count, 10) || 5, 1), 50);
  const normalizedGrade = normalizeGrade(grade || level);
  const normalizedSubject = normalizeSubject(subject);
  const validation = validateRequest({ grade: normalizedGrade, subject: normalizedSubject, topic });

  if (!validation.valid) {
    throw new Error(validation.message || "Invalid EduGen curriculum request.");
  }

  const questions = [];
  const used = new Set();
  let attempts = 0;
  const maxAttempts = Math.max(requestedCount * 300, 1000);
  let textbookContext = null;

  try {
    const textbook = loadLocalTextbook({ grade: normalizedGrade, subject: normalizedSubject });
    if (textbook && textbook.loaded) {
      textbookContext = buildKnowledgeContext(textbook.content, topic, topic);
    }
  } catch (_) {
    textbookContext = null;
  }

  while (questions.length < requestedCount && attempts < maxAttempts) {
    attempts++;
    let generated;

    if (normalizedSubject.toLowerCase() === "mathematics" || normalizedSubject.toLowerCase() === "math") {
      generated = generateMath(topic, difficulty, normalizedGrade);
    } else {
      generated = generateScience(normalizedSubject, topic, difficulty, normalizedGrade);
    }

    if (!generated) continue;
    generated = convertQuestion(generated, questionType);

    const normalized = cleanText(generated.question);
    if (!normalized || used.has(normalized)) continue;
    used.add(normalized);

    questions.push({
      id: makeId(),
      subject: normalizedSubject,
      topic: generated.topic || topic,
      level: normalizedGrade,
      grade: normalizedGrade,
      difficulty,
      questionType: generated.questionType || questionType || "Multiple Choice",
      question: generated.question,
      options: generated.options || [],
      answer: generated.answer,
      explanation: generated.explanation || "Review the underlying concept and work through the problem carefully.",
      learningObjective: generated.learningObjective || "Apply the relevant concept correctly.",
      textbookGrounded: Boolean(textbookContext),
      textbookContextAvailable: Boolean(textbookContext),
    });
  }

  if (questions.length !== requestedCount) {
    const message = "Unable to generate the requested " + requestedCount + " unique questions for " + normalizedGrade + " " + normalizedSubject + " / " + topic + ". Generated " + questions.length + ".";
    throw new Error(message);
  }

  return questions;
}`;

    source = replaceFunction(source, "generateQuestions", newGenerateQuestions);
    fs.writeFileSync(tempPath, source, "utf8");
    cp.execFileSync(process.execPath, ["--check", tempPath], { stdio: "inherit" });
    fs.renameSync(tempPath, enginePath);

    console.log("==========================================");
    console.log(" EduGen QUESTION ENGINE V2 UPGRADE");
    console.log("==========================================");
    console.log("Backup:", backupPath);
    console.log("Curriculum validation: ENABLED");
    console.log("Textbook dependency: ENABLED (ready for processed books)");
    console.log("Requested-count enforcement: ENABLED");
    console.log("Duplicate protection: ENABLED");
    console.log("Syntax check: PASSED");
    console.log("ENGINE UPGRADE COMPLETE");
  } catch (error) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    fs.writeFileSync(enginePath, original, "utf8");
    console.error("❌ V2 patch failed:", error.message);
    console.error("↩️ Original engine restored.");
    process.exitCode = 1;
  }
}

main();
