const {
  generateQuestions: generateLocalQuestions,
} = require("../services/questionEngine");

const recentQuestions = [];

const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const isSimilar = (question) => {
  const current = normalize(question);

  return recentQuestions.some((old) => {
    const previous = normalize(old);

    if (current === previous) {
      return true;
    }

    const currentWords = new Set(current.split(" "));
    const previousWords = new Set(previous.split(" "));

    let common = 0;

    currentWords.forEach((word) => {
      if (previousWords.has(word)) {
        common++;
      }
    });

    const similarity =
      common /
      Math.max(
        currentWords.size,
        previousWords.size
      );

    return similarity >= 0.82;
  });
};

const generateQuestions = async (req, res) => {
  try {
    const {
      subject,
      topic,
      level,
      difficulty,
      questionType,
      count,
    } = req.body;

    if (
      !subject ||
      !topic ||
      !level ||
      !difficulty ||
      !questionType
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Subject, topic, level, difficulty and question type are required.",
      });
    }

    const requestedCount = Math.min(
      Math.max(Number(count) || 5, 1),
      20
    );

    let questions = [];

    let attempts = 0;

    while (
      questions.length < requestedCount &&
      attempts < 5
    ) {
      attempts++;

      const batch = generateLocalQuestions({
        subject,
        topic,
        level,
        difficulty,
        questionType,
        count: requestedCount,
      });

      for (const question of batch) {
        if (isSimilar(question.question)) {
          continue;
        }

        questions.push(question);

        recentQuestions.push(
          question.question
        );

        if (recentQuestions.length > 200) {
          recentQuestions.shift();
        }

        if (
          questions.length >=
          requestedCount
        ) {
          break;
        }
      }
    }

    return res.status(200).json({
      success: true,
      source: "local",
      count: questions.length,
      questions,
    });
  } catch (error) {
    console.error(
      "Question generation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate questions.",
    });
  }
};

module.exports = {
  generateQuestions,
};