const {
  generateQuestions: generateLocalQuestions,
} = require("../services/masterGenerationEngine");

const recentQuestions = [];

const normalize = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const isSimilar = (question) => {
  const current = normalize(question);

  return recentQuestions.some((old) => {
    const previous = normalize(old);
    if (current === previous) return true;

    const currentWords = new Set(current.split(" "));
    const previousWords = new Set(previous.split(" "));
    let common = 0;

    currentWords.forEach((word) => {
      if (previousWords.has(word)) common++;
    });

    const similarity =
      common / Math.max(currentWords.size, previousWords.size, 1);

    return similarity >= 0.90;
  });
};

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

    const requestedCount = Math.min(Math.max(Number(count) || 5, 1), 20);
    const target = { subject, topic, grade: grade || level, level: grade || level, difficulty, questionType, count: requestedCount };
    const questions = [];

    for (let attempt = 0; attempt < 8 && questions.length < requestedCount; attempt += 1) {
      const batch = generateLocalQuestions({ ...target, count: requestedCount });

      for (const question of batch) {
        if (!question || isSimilar(question.question)) continue;
        if (questions.some((existing) => normalize(existing.question) === normalize(question.question))) continue;

        questions.push(question);
        recentQuestions.push(question.question);
        if (recentQuestions.length > 200) recentQuestions.shift();
        if (questions.length >= requestedCount) break;
      }
    }

    if (questions.length < requestedCount) {
      return res.status(422).json({
        success: false,
        message: `The generator could only produce ${questions.length} unique questions for this grade, subject and topic. No duplicate questions were substituted.`,
        requestedCount,
        generatedCount: questions.length,
        questions,
      });
    }

    return res.status(200).json({
      success: true,
      source: "local",
      count: questions.length,
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
