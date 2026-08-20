const { generateQuestions: generateLocalQuestions } = require("../services/stableGenerationEngine");
const { generateExpertQuestion } = require("../services/expertQuestionEngine");
const { validateQuestion, signature, transformQuestion, makeMixedType } = require("../services/questionQualityEngine");
const { loadTextbook } = require("../services/textbookAdapter");

const recentQuestions = new Set();
const MAX_RECENT = 500;

const EXPERT_VARIATIONS = [
  "A second piece of evidence points in a different direction, so the conclusion must account for both.",
  "Now assume one important condition changes while the other evidence remains reliable.",
  "A plausible alternative explanation is introduced and must be ruled out before accepting the conclusion.",
  "The first observation is incomplete; the strongest answer must explain what additional evidence would distinguish the possibilities.",
  "A common shortcut produces a tempting answer, but its hidden assumption must be examined.",
  "The situation is transferred to a new context, so the underlying principle must be identified rather than recalled by name.",
  "One result appears to support the claim while another appears to weaken it; both must be reconciled.",
  "The question deliberately removes a familiar condition, requiring the learner to decide which part of the original reasoning still survives.",
  "Two methods appear reasonable, but only one remains valid under every stated condition.",
  "The final conclusion must be justified from mechanism, evidence and assumptions rather than from the appearance of the result.",
];

function rememberSignature(value) {
  recentQuestions.add(signature(value));
  if (recentQuestions.size > MAX_RECENT) {
    const first = recentQuestions.values().next().value;
    if (first) recentQuestions.delete(first);
  }
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

function buildExpertCandidate({ subject, grade, topic, variationIndex }) {
  const base = generateExpertQuestion({ subject, grade, topic });
  const variation = EXPERT_VARIATIONS[variationIndex % EXPERT_VARIATIONS.length];
  return {
    ...base,
    question: `${base.question} ${variation}`,
    explanation: `${base.explanation} The added condition is intended to require transfer of the principle, comparison of evidence and evaluation of assumptions.`,
    reasoningSteps: Math.max(3, Number(base.reasoningSteps) || 3),
    expertReasoning: true,
    difficulty: "Expert",
  };
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
    const maxRounds = Math.max(20, Math.ceil(requestedCount / 5) * 8);
    let expertVariationIndex = 0;

    for (let round = 0; round < maxRounds && questions.length < requestedCount; round += 1) {
      const remaining = requestedCount - questions.length;
      let batch;

      if (isExpert) {
        batch = [];
        const batchSize = Math.min(remaining, 10);
        for (let i = 0; i < batchSize; i += 1) {
          try {
            batch.push(buildExpertCandidate({
              subject,
              grade: normalizedGrade,
              topic,
              variationIndex: expertVariationIndex++,
            }));
          } catch (expertError) {
            console.warn("Expert generation attempt failed:", expertError.message);
          }
        }
      } else {
        batch = generateLocalQuestions({
          subject,
          topic,
          grade: normalizedGrade,
          level: normalizedGrade,
          difficulty,
          count: remaining,
        });
      }

      for (const rawQuestion of Array.isArray(batch) ? batch : []) {
        if (questions.length >= requestedCount || !rawQuestion) break;
        const outputType = normalizedType === "Mixed" ? makeMixedType(questions.length) : normalizedType;
        const candidate = transformQuestion(rawQuestion, outputType);
        const validation = validateQuestion(candidate);
        if (!validation.valid) continue;
        const key = signature(candidate.question);
        if (localSignatures.has(key) || recentQuestions.has(key)) continue;
        localSignatures.add(key);
        rememberSignature(candidate.question);
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
          reasoningSteps: isExpert ? Math.max(3, Number(candidate.reasoningSteps) || 3) : candidate.reasoningSteps,
        });
      }
    }

    if (questions.length < requestedCount) {
      return res.status(422).json({ success: false, message: `The generator could only produce ${questions.length} unique high-quality questions for this grade, subject and topic.`, requestedCount, generatedCount: questions.length, questions, textbookReference });
    }

    return res.status(200).json({ success: true, source: isExpert ? "expert-local" : "local", count: questions.length, textbookReference, questions });
  } catch (error) {
    console.error("Question generation error:", error);
    const status = error.code && String(error.code).startsWith("INVALID_") ? 400 : 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to generate questions.", code: error.code || "GENERATION_ERROR", details: error.details || undefined });
  }
};

module.exports = { generateQuestions };