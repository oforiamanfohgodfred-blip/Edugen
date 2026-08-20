const { generateQuestions: generateLocalQuestions } = require("../services/stableGenerationEngine");
const { generateExpertQuestion } = require("../services/expertQuestionEngineV2");
const { validateQuestion, signature, transformQuestion, makeMixedType } = require("../services/questionQualityEngine");
const { loadTextbook } = require("../services/textbookAdapter");

// Keep a bounded memory of recent questions, but scope it by curriculum request.
// This prevents one previous test from exhausting a small topic's expert pool.
const recentQuestions = new Map();
const MAX_RECENT_PER_SCOPE = 80;

function scopeKey(subject, grade, topic, difficulty) {
  return [subject, grade, topic, difficulty].map(v => String(v || "").trim().toLowerCase()).join("|");
}

function rememberSignature(scope, value) {
  if (!recentQuestions.has(scope)) recentQuestions.set(scope, new Set());
  const set = recentQuestions.get(scope);
  set.add(signature(value));
  while (set.size > MAX_RECENT_PER_SCOPE) {
    const first = set.values().next().value;
    if (first) set.delete(first); else break;
  }
}

function hasRecentSignature(scope, value) {
  return Boolean(recentQuestions.get(scope)?.has(signature(value)));
}

function normalizeRequestedType(value) {
  const raw = String(value || "Multiple Choice").trim().toLowerCase();
  if (raw === "mixed") return "Mixed";
  if (raw.includes("short")) return "Short Answer";
  if (raw.includes("problem") && !raw.includes("word")) return "Problem Solving";
  if (raw.includes("word")) return "Word Problem";
  if (raw.includes("true") || raw.includes("false")) return "True/False";
  return "Multiple Choice";
}

const generateQuestions = async (req, res) => {
  try {
    const { subject, topic, level, grade, difficulty, questionType, count } = req.body;
    if (!subject || !topic || !(grade || level) || !difficulty || !questionType) {
      return res.status(400).json({ success: false, message: "Subject, topic, grade/level, difficulty and question type are required." });
    }

    const requestedCount = Math.min(Math.max(Number(count) || 5, 1), 50);
    const normalizedType = normalizeRequestedType(questionType);
    const normalizedGrade = grade || level;
    const isExpert = String(difficulty).trim().toLowerCase() === "expert";
    const scope = scopeKey(subject, normalizedGrade, topic, difficulty);

    let textbookReference = { available: false };
    try {
      const book = loadTextbook(normalizedGrade, subject);
      textbookReference = {
        available: Boolean(book && book.loaded),
        file: book ? book.file || null : null,
        usedAsReference: Boolean(book && book.loaded),
        requiresOCR: Boolean(book && book.requiresOCR),
      };
    } catch (bookError) {
      console.warn("Optional textbook reference unavailable:", bookError.message);
    }

    const questions = [];
    const localSignatures = new Set();
    const maxRounds = isExpert
      ? Math.max(80, requestedCount * 30)
      : Math.max(30, Math.ceil(requestedCount / 5) * 10);
    let variationIndex = 0;

    for (let round = 0; round < maxRounds && questions.length < requestedCount; round += 1) {
      const remaining = requestedCount - questions.length;
      let batch = [];

      if (isExpert) {
        // Generate one candidate at a time so variationIndex keeps advancing even
        // when a candidate is rejected. This is important for difficult topics.
        const attemptsThisRound = Math.min(Math.max(remaining * 2, 4), 20);
        for (let i = 0; i < attemptsThisRound; i += 1) {
          try {
            batch.push(generateExpertQuestion({
              subject,
              grade: normalizedGrade,
              topic,
              variationIndex: variationIndex++,
            }));
          } catch (expertError) {
            console.warn("Expert generation attempt failed:", expertError.message);
          }
        }
      } else {
        try {
          batch = generateLocalQuestions({
            subject,
            topic,
            grade: normalizedGrade,
            level: normalizedGrade,
            difficulty,
            count: remaining,
          });
        } catch (localError) {
          return res.status(422).json({ success: false, message: localError.message || "Unable to generate the requested questions." });
        }
      }

      for (const rawQuestion of Array.isArray(batch) ? batch : []) {
        if (questions.length >= requestedCount || !rawQuestion) break;
        const outputType = normalizedType === "Mixed" ? makeMixedType(questions.length) : normalizedType;
        const candidate = transformQuestion(rawQuestion, outputType);
        const validation = validateQuestion(candidate);
        if (!validation.valid) continue;

        const key = signature(candidate.question);
        if (localSignatures.has(key)) continue;

        // For Expert, allow the engine to reach deeper variation indexes before
        // declaring a request exhausted. Previous tests should not permanently
        // consume the entire small family pool.
        if (hasRecentSignature(scope, candidate.question) && variationIndex < 200) continue;

        localSignatures.add(key);
        rememberSignature(scope, candidate.question);
        questions.push({
          ...candidate,
          id: candidate.id || key.slice(0, 16),
          grade: candidate.grade || normalizedGrade,
          level: candidate.level || normalizedGrade,
          subject: candidate.subject || subject,
          topic: candidate.topic || topic,
          difficulty: candidate.difficulty || difficulty,
          qualityChecked: true,
          textbookReferenceAvailable: textbookReference.available,
          expertReasoning: isExpert,
          reasoningSteps: isExpert ? Math.max(4, Number(candidate.reasoningSteps) || 4) : candidate.reasoningSteps,
        });
      }
    }

    if (questions.length < requestedCount) {
      return res.status(422).json({
        success: false,
        message: `The generator could only produce ${questions.length} unique high-quality questions for this grade, subject and topic.`,
        requestedCount,
        generatedCount: questions.length,
        questions,
        textbookReference,
      });
    }

    return res.status(200).json({
      success: true,
      source: isExpert ? "expert-local-v2" : "local",
      count: questions.length,
      textbookReference,
      questions,
    });
  } catch (error) {
    console.error("Question generation error:", error);
    const status = error.code && String(error.code).startsWith("INVALID_") ? 400 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to generate questions.",
      code: error.code || "GENERATION_ERROR",
      details: error.details || undefined,
    });
  }
};

module.exports = { generateQuestions };