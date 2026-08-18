const {
  generateQuestions: generateLocalQuestions,
} = require("../services/masterGenerationEngine");
const { validateQuestion, signature, transformQuestion, makeMixedType } = require("../services/questionQualityEngine");
const { loadTextbook } = require("../services/textbookAdapter");

const recentQuestions = new Set();
const MAX_RECENT = 500;

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

const generateQuestions = async (req, res) => {
  try {
    const {
      subject,
      topic,
      level,
      grade,
      difficulty,
      questionType,
      count,
    } = req.body;

    if (!subject || !topic || !(grade || level) || !difficulty || !questionType) {
      return res.status(400).json({
        success: false,
        message: "Subject, topic, grade/level, difficulty and question type are required.",
      });
    }

    const requestedCount = Math.min(Math.max(Number(count) || 5, 1), 50);
    const normalizedType = normalizeRequestedType(questionType);
    const normalizedGrade = grade || level;
    const target = {
      subject,
      topic,
      grade: normalizedGrade,
      level: normalizedGrade,
      difficulty,
      questionType: "Multiple Choice",
      count: Math.min(requestedCount, 20),
    };

    // Textbooks are optional reference material. Their absence NEVER blocks generation.
    let textbookReference = { available: false };
    try {
      const book = loadTextbook(normalizedGrade, subject);
      textbookReference = {
        available: Boolean(book.loaded),
        file: book.file || null,
        usedAsReference: Boolean(book.loaded),
      };
    } catch (bookError) {
      console.warn("Optional textbook reference unavailable:", bookError.message);
    }

    const questions = [];
    const localSignatures = new Set();
    const maxRounds = Math.max(10, Math.ceil(requestedCount / 5) * 3);

    for (let round = 0; round < maxRounds && questions.length < requestedCount; round += 1) {
      const remaining = requestedCount - questions.length;
      const batchSize = Math.min(20, Math.max(remaining, 5));
      const batch = generateLocalQuestions({ ...target, count: batchSize });

      for (const rawQuestion of Array.isArray(batch) ? batch : []) {
        if (questions.length >= requestedCount) break;
        if (!rawQuestion) continue;

        const outputType = normalizedType === "Mixed"
          ? makeMixedType(questions.length)
          : normalizedType;
        const candidate = transformQuestion(rawQuestion, outputType);
        const validation = validateQuestion(candidate);
        if (!validation.valid) continue;

        const key = signature(candidate.question);
        if (localSignatures.has(key) || recentQuestions.has(key)) continue;

        localSignatures.add(key);
        rememberSignature(candidate.question);
        questions.push({
          ...candidate,
          id: candidate.id || signature(candidate.question).slice(0, 16),
          grade: candidate.grade || normalizedGrade,
          level: candidate.level || normalizedGrade,
          subject: candidate.subject || subject,
          topic: candidate.topic || topic,
          difficulty: candidate.difficulty || difficulty,
          qualityChecked: true,
          textbookReferenceAvailable: textbookReference.available,
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
      source: "local",
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
