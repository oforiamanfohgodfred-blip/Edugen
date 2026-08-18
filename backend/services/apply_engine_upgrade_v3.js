const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const enginePath = path.join(__dirname, "questionEngine.js");
const backupPath = path.join(__dirname, `questionEngine.before-v3-${Date.now()}.js`);
const tempPath = path.join(__dirname, `questionEngine.v3-temp-${Date.now()}.js`);

function findFunctionBodyOpen(source, functionStart) {
  let parenDepth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  let seenParen = false;

  for (let i = functionStart; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];

    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
    if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { blockComment = true; i++; continue; }

    if (ch === "(") { parenDepth++; seenParen = true; continue; }
    if (ch === ")" && seenParen) {
      parenDepth--;
      if (parenDepth === 0) {
        for (let j = i + 1; j < source.length; j++) {
          if (/\s/.test(source[j])) continue;
          if (source[j] === "{") return j;
          break;
        }
      }
    }
  }
  return -1;
}

function findMatchingBrace(source, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = openIndex; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];

    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") { quote = ch; continue; }
    if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { blockComment = true; i++; continue; }

    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function replaceNamedFunction(source, name, replacement) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Could not locate ${name}()`);
  const open = findFunctionBodyOpen(source, start);
  if (open < 0) throw new Error(`Could not locate ${name}() body`);
  const close = findMatchingBrace(source, open);
  if (close < 0) throw new Error(`Could not locate ${name}() closing brace`);
  return source.slice(0, start) + replacement + source.slice(close + 1);
}

function ensureRequire(source, statement) {
  return source.includes(statement) ? source : `${statement}\n${source}`;
}

const NEW_GENERATOR = `function generateQuestions({ subject, topic, level, grade, difficulty, questionType, count }) {
  const requestedCount = Math.min(Math.max(parseInt(count, 10) || 5, 1), 50);
  const normalizedGrade = normalizeGrade(grade || level);
  const normalizedSubject = normalizeSubject(subject);
  const routedTopic = resolveTopic(normalizedGrade, normalizedSubject, topic);

  if (!normalizedGrade || !normalizedSubject || !routedTopic) {
    const suggestions = getTopicCandidates(normalizedGrade, normalizedSubject, topic);
    throw new Error("Invalid EduGen request. Grade, subject and topic must match the configured JHS/SHS curriculum." + (suggestions.length ? " Suggested topics: " + suggestions.join(", ") : ""));
  }

  const validation = validateRequest({ grade: normalizedGrade, subject: normalizedSubject, topic: routedTopic });
  if (!validation.valid) throw new Error(validation.message);

  const questions = [];
  const used = new Set();
  let attempts = 0;
  const maxAttempts = Math.max(requestedCount * 400, 1500);
  let textbookContext = null;

  try {
    const textbook = loadTextbookForRequest({ grade: normalizedGrade, subject: normalizedSubject, topic: routedTopic });
    if (textbook && textbook.loaded) textbookContext = textbook.context;
  } catch (error) {
    textbookContext = null;
  }

  while (questions.length < requestedCount && attempts < maxAttempts) {
    attempts++;
    let generated;

    if (normalizedSubject === "Mathematics") {
      generated = generateMath(routedTopic, difficulty, normalizedGrade);
    } else {
      generated = generateScience(normalizedSubject, routedTopic, difficulty, normalizedGrade);
    }

    if (!generated || !generated.question || generated.answer === undefined) continue;

    let transformed = transformQuestion(generated, questionType, difficulty);

    if (textbookContext && textbookContext.primaryConcept) {
      transformed = {
        ...transformed,
        textbookGrounded: true,
        textbookConcept: textbookContext.primaryConcept.title || null,
        learningObjective: transformed.learningObjective || textbookContext.primaryConcept.learningObjective || "Apply the relevant textbook concept correctly.",
        explanation: `${transformed.explanation || ""}${transformed.explanation ? "\n\n" : ""}Knowledge focus: ${textbookContext.primaryConcept.title}.`,
      };
    } else {
      transformed = { ...transformed, textbookGrounded: false };
    }

    const quality = validateQuestion(transformed);
    if (!quality.valid) continue;

    const signature = questionSignature({
      subject: normalizedSubject,
      topic: routedTopic,
      question: transformed.question,
      answer: transformed.answer,
    });

    if (!signature || used.has(signature)) continue;
    used.add(signature);

    questions.push({
      id: makeId(),
      subject: normalizedSubject,
      topic: routedTopic,
      grade: normalizedGrade,
      level: normalizedGrade.startsWith("JHS") ? "JHS" : "SHS",
      difficulty,
      questionType: transformed.questionType,
      question: transformed.question,
      options: transformed.options || [],
      answer: transformed.answer,
      explanation: transformed.explanation || "Review the relevant concept and work through the solution carefully.",
      learningObjective: transformed.learningObjective || "Apply the relevant concept correctly.",
      textbookGrounded: Boolean(transformed.textbookGrounded),
      textbookConcept: transformed.textbookConcept || null,
    });
  }

  if (questions.length !== requestedCount) {
    throw new Error("Unable to generate the requested " + requestedCount + " unique questions for " + normalizedGrade + " " + normalizedSubject + " / " + routedTopic + ". Generated " + questions.length + " after " + attempts + " attempts. Try a different topic or smaller batch.");
  }

  return questions;
}`;

function main() {
  if (!fs.existsSync(enginePath)) throw new Error("questionEngine.js not found");
  const original = fs.readFileSync(enginePath, "utf8");
  fs.writeFileSync(backupPath, original, "utf8");

  try {
    let source = original;
    source = ensureRequire(source, 'const { validateRequest, normalizeGrade, normalizeSubject } = require("./curriculumEngine");');
    source = ensureRequire(source, 'const { resolveTopic, getTopicCandidates } = require("./topicRouter");');
    source = ensureRequire(source, 'const { transformQuestion, validateQuestion, questionSignature } = require("./questionQualityEngine");');
    source = ensureRequire(source, 'const { loadTextbookForRequest } = require("./textbookAdapter");');

    source = replaceNamedFunction(source, "generateQuestions", NEW_GENERATOR);

    fs.writeFileSync(tempPath, source, "utf8");
    cp.execFileSync(process.execPath, ["--check", tempPath], { stdio: "inherit" });
    fs.renameSync(tempPath, enginePath);

    console.log("==========================================");
    console.log(" EduGen FINAL ENGINE V3 UPGRADE");
    console.log("==========================================");
    console.log("Curriculum validation: ENABLED");
    console.log("Grade-aware topic routing: ENABLED");
    console.log("Question quality validation: ENABLED");
    console.log("MCQ / Short Answer / Problem Solving / Word Problem / Mixed: ENABLED");
    console.log("Dynamic duplicate signatures: ENABLED");
    console.log("Textbook grounding adapter: ENABLED");
    console.log("Requested-count enforcement: ENABLED (1-50)");
    console.log("University path: BLOCKED BY CURRICULUM");
    console.log("Syntax check: PASSED");
    console.log("FINAL ENGINE UPGRADE COMPLETE");
  } catch (error) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    fs.writeFileSync(enginePath, original, "utf8");
    console.error("❌ V3 upgrade failed:", error.message);
    console.error("↩️ Original engine restored.");
    process.exitCode = 1;
  }
}

main();
